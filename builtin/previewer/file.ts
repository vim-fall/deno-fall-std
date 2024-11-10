import * as fn from "@denops/std/function";
import { isAbsolute } from "@std/path/is-absolute";
import { basename } from "@std/path/basename";

import { definePreviewer, type Previewer } from "../../previewer.ts";
import { splitText } from "../../util/stringutil.ts";

const decoder = new TextDecoder("utf-8", { fatal: true });

type Detail = {
  path: string;
  line?: number;
  column?: number;
};

/**
 * Creates a Previewer that displays the content of a file.
 *
 * This Previewer reads the content of a specified file and formats it for preview.
 * If the file is binary, a message indicating that no preview is available is shown.
 *
 * @returns A Previewer that shows the specified file's content or a binary file message.
 */
export function file(): Previewer<Detail> {
  return definePreviewer(async (denops, { item }, { signal }) => {
    // Resolve the absolute path of the file
    const abspath = isAbsolute(item.detail.path)
      ? item.detail.path
      : await fn.fnamemodify(denops, item.detail.path, ":p");
    signal?.throwIfAborted();

    try {
      // Read and decode the file content
      const data = await Deno.readFile(abspath, { signal });
      signal?.throwIfAborted();
      const text = decoder.decode(data);

      return {
        content: splitText(text),
        line: item.detail.line,
        column: item.detail.column,
        filename: basename(abspath),
      };
    } catch (err) {
      // Handle binary files and other errors with appropriate messages
      if (err instanceof TypeError) {
        return {
          content: ["No preview for binary file is available."],
        };
      }
      return {
        content: String(err).split("\n"),
      };
    }
  });
}
