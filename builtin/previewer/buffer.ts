import * as fn from "@denops/std/function";
import { collect } from "@denops/std/batch";
import { basename } from "@std/path/basename";

import { definePreviewer, type Previewer } from "../../previewer.ts";

type Detail = {
  bufnr: number;
  line?: number;
  column?: number;
};

export function buffer<T extends Detail>(): Previewer<T> {
  return definePreviewer<T>(async (denops, { item }, { signal }) => {
    const [bufloaded, bufname, content] = await collect(denops, (denops) => [
      fn.bufloaded(denops, item.detail.bufnr),
      fn.bufname(denops, item.detail.bufnr),
      fn.getbufline(denops, item.detail.bufnr, 1, "$"),
    ]);
    signal?.throwIfAborted();

    if (!bufloaded) {
      return;
    }
    const { line, column } = item.detail;
    return {
      content,
      line,
      column,
      filename: basename(bufname),
    };
  });
}
