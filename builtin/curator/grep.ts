import type { Denops } from "@denops/std";
import * as fn from "@denops/std/function";
import { relative } from "@std/path/relative";
import { TextLineStream } from "@std/streams/text-line-stream";

import { type Curator, defineCurator } from "../../curator.ts";

/**
 * Detail information for each result returned by `grep`.
 */
type Detail = {
  path: string;
  line: number;
  context: string;
};

/**
 * Options for the `grep` Curator.
 */
export type GrepOptions = {
  /**
   * If true, the `value` of each item will be the relative path from the base directory.
   */
  relativeFromBase?: boolean;
};

/**
 * Regex pattern to parse grep output lines.
 * Matches the format: path:line:context
 */
const pattern = new RegExp("^(.*?):(\\d+):(.*)$");

/**
 * Creates a Curator that runs `grep` with the specified query.
 *
 * The `grep` command is executed in the specified root directory,
 * and the output is processed line by line. Each line is parsed and
 * converted into an item with detailed information.
 *
 * @returns A Curator that yields search results in the form of `GrepDetail`.
 */
export function grep(options: GrepOptions = {}): Curator<Detail> {
  let base: string;
  return defineCurator(
    async function* (denops, { args, query }, { signal }) {
      // Determine the root directory for the grep command
      base ??= await getAbsolutePathOf(denops, args[0] ?? ".", signal);

      // Configure the `grep` command with the provided query
      const cmd = new Deno.Command("grep", {
        args: [
          "--color=never",
          "--no-messages",
          "--recursive",
          "--line-number",
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
        const { path, line, context } = result;
        const vpath = options.relativeFromBase ? relative(base, path) : path;

        // Yield a structured item for each matched line
        yield {
          id: `${path}:${line}`,
          value: `${vpath}:${line}:${context}`,
          detail: {
            path,
            line,
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
 * Parses a single line of `grep` output to extract file path, line number, and context.
 *
 * @param record - A line from `grep` output.
 * @returns An object containing parsed `path`, `line`, and `context`, or undefined if parsing fails.
 */
function parse(record: string) {
  const m = record.match(pattern);
  if (!m) return;
  const [, path, line, context] = m;
  return {
    path,
    line: Number(line),
    context,
  };
}
