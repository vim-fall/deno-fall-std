import * as fn from "@denops/std/function";
import { collect } from "@denops/std/batch";
import { basename } from "@std/path/basename";

import { definePreviewer, type Previewer } from "../../previewer.ts";

/**
 * Represents details for buffer preview, including buffer number and optional line and column.
 */
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
export function buffer<T extends Detail>(): Previewer<T> {
  return definePreviewer<T>(async (denops, { item }, { signal }) => {
    // Retrieve buffer properties in a batch
    const [bufloaded, bufname, content] = await collect(denops, (denops) => [
      fn.bufloaded(denops, item.detail.bufnr),
      fn.bufname(denops, item.detail.bufnr),
      fn.getbufline(denops, item.detail.bufnr, 1, "$"),
    ]);
    signal?.throwIfAborted();

    // If buffer is not loaded, return nothing
    if (!bufloaded) {
      return;
    }

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
