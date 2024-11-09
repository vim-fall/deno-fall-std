import type { Denops } from "@denops/std";
import type { PreviewItem } from "@vim-fall/core/item";
import type { Previewer, PreviewParams } from "@vim-fall/core/previewer";

import type { Promish } from "./util/_typeutil.ts";

/**
 * Define a previewer.
 *
 * @param preview The function to preview an item.
 * @returns The previewer.
 */
export function definePreviewer<T>(
  preview: (
    denops: Denops,
    params: PreviewParams<T>,
    options: { signal?: AbortSignal },
  ) => Promish<void | PreviewItem>,
): Previewer<T> {
  return { preview };
}

export type * from "@vim-fall/core/previewer";
