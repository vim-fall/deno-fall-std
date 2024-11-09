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

export function file<T extends Detail>(): Previewer<T> {
  return definePreviewer(async (denops, { item }, { signal }) => {
    const abspath = isAbsolute(item.detail.path)
      ? item.detail.path
      : await fn.fnamemodify(denops, item.detail.path, ":p");
    signal?.throwIfAborted();

    try {
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
