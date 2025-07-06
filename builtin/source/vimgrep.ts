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

export type VimgrepOptions = {
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
   * Vimgrep flags.
   * g: all matches in a line
   * j: don't jump to first match
   * @default "j"
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
 * Creates a Source that generates items from Vim's :vimgrep command results.
 *
 * This Source executes Vim's :vimgrep command and generates items from the results.
 * Unlike :grep, :vimgrep uses Vim's internal pattern matching.
 *
 * @param options - Options to customize vimgrep execution.
 * @returns A Source that generates items representing vimgrep results.
 */
export function vimgrep(
  options: Readonly<VimgrepOptions> = {},
): Source<Detail> {
  const pattern = options.pattern;
  const files = options.files ?? ["%"];
  const flags = options.flags ?? "j";
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

    // Escape the pattern for vimgrep
    const escapedPattern = searchPattern.replace(/[\\\/]/g, "\\$&");

    // Build vimgrep command
    const vimgrepCmd = `:vimgrep /${escapedPattern}/${flags} ${
      files.map((f) => `'${f.replace(/'/g, "''")}'`).join(" ")
    }`;

    try {
      if (useQuickfix) {
        // Save current quickfix list
        const savedQflist = await fn.getqflist(denops);

        // Execute vimgrep command
        await denops.cmd(`silent! ${vimgrepCmd}`);
        signal?.throwIfAborted();

        // Get results from quickfix list
        const qflist = await fn.getqflist(denops) as unknown as Array<{
          bufnr: number;
          lnum: number;
          col: number;
          text: string;
          valid: number;
        }>;

        // Restore original quickfix list
        await fn.setqflist(denops, savedQflist);

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
        // For non-quickfix mode, we still need to use quickfix internally
        // but we'll clean it up immediately
        const savedQflist = await fn.getqflist(denops);

        await denops.cmd(`silent! ${vimgrepCmd}`);
        signal?.throwIfAborted();

        const qflist = await fn.getqflist(denops) as unknown as Array<{
          bufnr: number;
          lnum: number;
          col: number;
          text: string;
          valid: number;
        }>;

        // Immediately restore
        await fn.setqflist(denops, savedQflist);

        let id = 0;
        for (const item of qflist) {
          if (!item.valid) {
            continue;
          }

          let filename = "";
          if (item.bufnr > 0) {
            filename = await fn.bufname(denops, item.bufnr);
          }

          if (!filename) {
            continue;
          }

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
      }
    } catch (error) {
      // Vimgrep might fail if no matches found
      // This is not an error condition
      if (error instanceof Error && !error.message.includes("E480")) {
        throw error;
      }
    }
  });
}
