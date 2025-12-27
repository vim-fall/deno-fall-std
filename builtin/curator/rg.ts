import type { Denops } from "@denops/std";
import * as fn from "@denops/std/function";
import { relative } from "@std/path/relative";
import { TextLineStream } from "@std/streams/text-line-stream";

import { type Curator, defineCurator } from "../../curator.ts";

type Detail = {
  path: string;
  line: number;
  column: number;
  context: string;
};

/**
 * Options for the `rg` (ripgrep) Curator.
 */
export type RgOptions = {
  /**
   * If true, the `value` of each item will be the relative path from the base directory.
   */
  relativeFromBase?: boolean;

  // Search Options
  /**
   * Case insensitive search (-i, --ignore-case).
   */
  ignoreCase?: boolean;

  /**
   * Smart case search (-S, --smart-case).
   * Search case insensitively if pattern is all lowercase, case sensitively otherwise.
   */
  smartCase?: boolean;

  /**
   * Search case sensitively (-s, --case-sensitive).
   */
  caseSensitive?: boolean;

  /**
   * Treat all patterns as literals (-F, --fixed-strings).
   */
  fixedStrings?: boolean;

  /**
   * Enable searching across multiple lines (-U, --multiline).
   */
  multiline?: boolean;

  /**
   * Make '.' match line terminators (--multiline-dotall).
   */
  multilineDotall?: boolean;

  /**
   * Invert matching (-v, --invert-match).
   */
  invertMatch?: boolean;

  /**
   * Limit the number of matching lines (-m, --max-count).
   */
  maxCount?: number;

  /**
   * Enable PCRE2 matching (-P, --pcre2).
   */
  pcre2?: boolean;

  // Filter Options
  /**
   * Only search files matching TYPE (-t, --type).
   */
  type?: string[];

  /**
   * Do not search files matching TYPE (-T, --type-not).
   */
  typeNot?: string[];

  /**
   * Include or exclude file paths (-g, --glob).
   */
  glob?: string[];

  /**
   * Search hidden files and directories (-., --hidden).
   */
  hidden?: boolean;

  /**
   * Follow symbolic links (-L, --follow).
   */
  follow?: boolean;

  /**
   * Descend at most NUM directories (-d, --max-depth).
   */
  maxDepth?: number;

  /**
   * Ignore files larger than NUM in bytes (--max-filesize).
   */
  maxFilesize?: number;

  /**
   * Don't use ignore files (--no-ignore).
   */
  noIgnore?: boolean;

  /**
   * Don't use ignore files from source control (--no-ignore-vcs).
   */
  noIgnoreVcs?: boolean;

  /**
   * Don't use global ignore files (--no-ignore-global).
   */
  noIgnoreGlobal?: boolean;

  /**
   * Don't use .ignore or .rgignore files (--no-ignore-dot).
   */
  noIgnoreDot?: boolean;

  /**
   * Don't use ignore files in parent directories (--no-ignore-parent).
   */
  noIgnoreParent?: boolean;
};

/**
 * Regex pattern to parse `rg` output lines.
 * Matches the format: path:line:column:context
 */
const pattern = new RegExp("^(.*?):(\\d+):(\\d+):(.*)$");

/**
 * Creates a Curator that runs `rg` (ripgrep) with the specified query.
 *
 * The `rg` command is executed in the specified root directory,
 * and the output is processed line by line. Each line is parsed and
 * converted into an item with detailed information.
 *
 * @returns A Curator that yields search results in the form of `RgDetail`.
 */
export function rg(options: RgOptions = {}): Curator<Detail> {
  return defineCurator(
    async function* (denops, { args, query }, { signal }) {
      // Determine the root directory for the rg command
      const base = await getAbsolutePathOf(denops, args[0] ?? ".", signal);

      // Build command arguments from options
      const cmdArgs: string[] = [
        "--color=never",
        "--no-heading",
        "--no-messages",
        "--with-filename",
        "--line-number",
        "--column",
      ];

      // Search options
      if (options.ignoreCase) cmdArgs.push("--ignore-case");
      if (options.smartCase) cmdArgs.push("--smart-case");
      if (options.caseSensitive) cmdArgs.push("--case-sensitive");
      if (options.fixedStrings) cmdArgs.push("--fixed-strings");
      if (options.multiline) cmdArgs.push("--multiline");
      if (options.multilineDotall) cmdArgs.push("--multiline-dotall");
      if (options.invertMatch) cmdArgs.push("--invert-match");
      if (options.maxCount !== undefined) {
        cmdArgs.push("--max-count", options.maxCount.toString());
      }
      if (options.pcre2) cmdArgs.push("--pcre2");

      // Filter options
      if (options.type) {
        options.type.forEach((t) => cmdArgs.push("--type", t));
      }
      if (options.typeNot) {
        options.typeNot.forEach((t) => cmdArgs.push("--type-not", t));
      }
      if (options.glob) {
        options.glob.forEach((g) => cmdArgs.push("--glob", g));
      }
      if (options.hidden) cmdArgs.push("--hidden");
      if (options.follow) cmdArgs.push("--follow");
      if (options.maxDepth !== undefined) {
        cmdArgs.push("--max-depth", options.maxDepth.toString());
      }
      if (options.maxFilesize !== undefined) {
        cmdArgs.push("--max-filesize", options.maxFilesize.toString());
      }
      if (options.noIgnore) cmdArgs.push("--no-ignore");
      if (options.noIgnoreVcs) cmdArgs.push("--no-ignore-vcs");
      if (options.noIgnoreGlobal) cmdArgs.push("--no-ignore-global");
      if (options.noIgnoreDot) cmdArgs.push("--no-ignore-dot");
      if (options.noIgnoreParent) cmdArgs.push("--no-ignore-parent");

      // Add query and path
      cmdArgs.push(query, "--", base);

      // Configure the `rg` command with the provided query
      const cmd = new Deno.Command("rg", {
        args: cmdArgs,
        stdin: "null",
        stdout: "piped",
        stderr: "null",
      });

      // Start the process and handle its output
      await using proc = cmd.spawn();
      const stream = proc.stdout
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new TextLineStream());

      for await (const record of stream) {
        // Abort if the signal is triggered
        signal?.throwIfAborted();

        // Parse each line of output
        const result = parse(record);
        if (!result) {
          continue;
        }
        const { path, line, column, context } = result;
        const vpath = options.relativeFromBase ? relative(base, path) : path;

        // Yield a structured item for each matched line
        yield {
          id: `${path}:${line}:${column}`,
          value: `${vpath}:${line}:${column}:${context}`,
          detail: {
            path,
            line,
            column,
            context,
          },
        };
      }
    },
  );
}

/**
 * Resolves and returns the absolute path of the specified expression.
 *
 * @param denops - The Denops instance.
 * @param expr - The path expression to resolve.
 * @param signal - An optional abort signal to cancel the operation.
 * @returns A promise that resolves to the absolute path of the expression.
 */
async function getAbsolutePathOf(
  denops: Denops,
  expr: string,
  signal?: AbortSignal,
): Promise<string> {
  const path = await fn.expand(denops, expr) as string;
  signal?.throwIfAborted();
  const abspath = await fn.fnamemodify(denops, path, ":p");
  return abspath;
}

/**
 * Parses a single line of `rg` output to extract file path, line number, column number, and context.
 *
 * @param record - A line from `rg` output.
 * @returns An object containing parsed `path`, `line`, `column`, and `context`, or undefined if parsing fails.
 */
function parse(record: string) {
  const m = record.match(pattern);
  if (!m) return;
  const [, path, line, column, context] = m;
  return {
    path,
    line: Number(line),
    column: Number(column),
    context,
  };
}
