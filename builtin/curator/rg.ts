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

      // Configure the `rg` command with the provided query
      const cmd = new Deno.Command("rg", {
        args: [
          "--color=never",
          "--no-heading",
          "--no-messages",
          "--with-filename",
          "--line-number",
          "--column",
          query,
          "--",
          base,
        ],
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
