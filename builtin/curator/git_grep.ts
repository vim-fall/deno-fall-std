import { TextLineStream } from "@std/streams/text-line-stream";
import * as fn from "@denops/std/function";

import { type Curator, defineCurator } from "../../curator.ts";

/**
 * Detail information for each result returned by `git grep`.
 */
type GitGrepDetail = {
  path: string;
  line: number;
  column: number;
  context: string;
};

/**
 * Regex pattern to parse git grep output lines.
 * Matches the format: path:line:column:context
 */
const pattern = new RegExp("^(.*?):(\\d+):(\\d+):(.*)$");

/**
 * Creates a Curator that runs `git grep` with the specified query.
 *
 * The `git grep` command is executed in the current working directory,
 * and the output is processed line by line. Each line is parsed and
 * converted into an item with detailed information.
 *
 * @returns A Curator that yields search results in the form of `GitGrepDetail`.
 */
export function gitGrep(): Curator<GitGrepDetail> {
  return defineCurator<GitGrepDetail>(
    async function* (denops, { query }, { signal }) {
      // Get the current working directory in Vim/Neovim
      const cwd = await fn.getcwd(denops);

      // Configure the `git grep` command with the provided query
      const cmd = new Deno.Command("git", {
        cwd,
        args: [
          "grep",
          "--color=never",
          "--no-heading",
          "--full-name",
          "--line-number",
          "--column",
          query,
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

      let id = 0;
      for await (const record of stream) {
        // Abort if the signal is triggered
        signal?.throwIfAborted();

        // Parse each line of output
        const result = parse(record);
        if (!result) {
          continue;
        }
        const { path, line, column, context } = result;

        // Yield a structured item for each matched line
        yield {
          id: id++,
          value: `${path}:${line}:${column}:${context}`,
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
 * Parses a single line of `git grep` output to extract file path, line number, column number, and context.
 *
 * @param record - A line from `git grep` output.
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
