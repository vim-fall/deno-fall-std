import * as fn from "@denops/std/function";
import { collect } from "@denops/std/batch";
import { basename } from "@std/path/basename";

import { definePreviewer, type Previewer } from "../../previewer.ts";

type Detail = {
  bufnr: number;
  line?: number;
  column?: number;
};

/**
 * Creates a Previewer that displays content from a specified buffer.
 *
 * This Previewer retrieves the content of the buffer identified by `bufnr` and
 * prepares it for preview, including optional line and column indicators.
 *
 * @returns A Previewer that displays the specified buffer's content.
 */
export function buffer(): Previewer<Detail> {
  return definePreviewer(async (denops, { item }, { signal }) => {
    // Ensure that the buffer is loaded
    await fn.bufload(denops, item.detail.bufnr);

    // Retrieve buffer properties in a batch
    const [bufname, content] = await collect(denops, (denops) => [
      fn.bufname(denops, item.detail.bufnr),
      fn.getbufline(denops, item.detail.bufnr, 1, "$"),
    ]);
    signal?.throwIfAborted();

    // Extract line and column details for highlighting in the preview
    const { line, column } = item.detail;
    return {
      content,
      line,
      column,
      filename: basename(bufname),
    };
  });
}
