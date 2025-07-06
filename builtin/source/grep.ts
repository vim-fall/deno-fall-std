import * as fn from "@denops/std/function";

import { defineSource, type Source } from "../../source.ts";

type Detail = {
  /**
   * File path
   */
  path: string;

  /**
   * Line number
   */
  line: number;

  /**
   * Column number
   */
  column: number;

  /**
   * Matched text
   */
  text: string;

  /**
   * The pattern that was searched
   */
  pattern: string;
};

export type GrepOptions = {
  /**
   * The pattern to search for.
   * If not provided, uses the last search pattern.
   */
  pattern?: string;

  /**
   * Files to search in.
   * Defaults to current file if not specified.
   */
  files?: string[];

  /**
   * Additional grep flags.
   */
  flags?: string;

  /**
   * Whether to use the quickfix list.
   * If false, returns results directly without populating quickfix.
   * @default true
   */
  useQuickfix?: boolean;
};

/**
 * Creates a Source that generates items from Vim's :grep command results.
 *
 * This Source executes Vim's :grep command and generates items from the results.
 * It uses the 'grepprg' and 'grepformat' settings to parse the output.
 *
 * @param options - Options to customize grep execution.
 * @returns A Source that generates items representing grep results.
 */
export function grep(
  options: Readonly<GrepOptions> = {},
): Source<Detail> {
  const pattern = options.pattern;
  const files = options.files ?? ["%"];
  const flags = options.flags ?? "";
  const useQuickfix = options.useQuickfix ?? true;

  return defineSource(async function* (denops, _params, { signal }) {
    // Get the pattern to search for
    let searchPattern = pattern;
    if (!searchPattern) {
      // Use last search pattern
      const regValue = await fn.getreg(denops, "/");
      searchPattern = typeof regValue === "string" ? regValue : "";
      if (!searchPattern) {
        return;
      }
    }

    signal?.throwIfAborted();

    // Build grep command
    const args = [searchPattern, ...files];
    const grepCmd = flags
      ? `:grep! ${flags} ${
        args.map((a) => `'${a.replace(/'/g, "''")}'`).join(" ")
      }`
      : `:grep! ${args.map((a) => `'${a.replace(/'/g, "''")}'`).join(" ")}`;

    try {
      if (useQuickfix) {
        // Execute grep command
        await denops.cmd(`silent! ${grepCmd}`);
        signal?.throwIfAborted();

        // Get results from quickfix list
        const qflist = await fn.getqflist(denops) as unknown as Array<{
          bufnr: number;
          lnum: number;
          col: number;
          text: string;
          valid: number;
        }>;

        // Clear quickfix list to avoid side effects
        await denops.cmd("cexpr []");

        let id = 0;
        for (const item of qflist) {
          if (!item.valid) {
            continue;
          }

          // Get filename from buffer number
          let filename = "";
          if (item.bufnr > 0) {
            filename = await fn.bufname(denops, item.bufnr);
          }

          if (!filename) {
            continue;
          }

          // Format display value
          const locationStr = `${filename}:${item.lnum}:${item.col}`;
          const value = `${locationStr}: ${item.text}`;

          yield {
            id: id++,
            value,
            detail: {
              path: filename,
              line: item.lnum,
              column: item.col,
              text: item.text,
              pattern: searchPattern,
            },
          };
        }
      } else {
        // Execute grep directly and parse output
        const grepprg = await denops.eval("&grepprg");

        // This is a simplified implementation
        // In practice, we'd need to properly parse grepformat
        // For now, assume standard grep output format
        const output = await fn.system(
          denops,
          `${grepprg} ${args.join(" ")}`,
        );

        if (output) {
          const lines = output.trim().split("\n");
          let id = 0;

          for (const line of lines) {
            // Simple parsing for "filename:line:column:text" format
            const match = line.match(/^([^:]+):(\d+):(\d+)?:?(.*)$/);
            if (match) {
              const [, filename, lineStr, colStr, text] = match;
              const lineNum = parseInt(lineStr, 10);
              const colNum = colStr ? parseInt(colStr, 10) : 1;

              yield {
                id: id++,
                value: line,
                detail: {
                  path: filename,
                  line: lineNum,
                  column: colNum,
                  text: text.trim(),
                  pattern: searchPattern,
                },
              };
            }
          }
        }
      }
    } catch (error) {
      // Grep might return non-zero exit code if no matches found
      // This is not an error condition
      if (error instanceof Error && !error.message.includes("E480")) {
        throw error;
      }
    }
  });
}
