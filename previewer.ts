import type { Denops } from "@denops/std";
import type { PreviewItem } from "@vim-fall/core/item";
import type { Previewer, PreviewParams } from "@vim-fall/core/previewer";

import type { Promish } from "./util/_typeutil.ts";
import { type DerivableArray, deriveArray } from "./util/derivable.ts";

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

/**
 * Compose multiple previewers.
 *
 * The previewers are tried in the order they are passed.
 * Once a previewer returns a non-`undefined` value, the previewing process is
 * stopped.
 *
 * @param previewers The previewers to compose.
 * @returns The composed previewer.
 */
export function composePreviewers<
  T,
  P extends DerivableArray<[Previewer<T>, ...Previewer<T>[]]>,
>(...previewers: P): Previewer<T> {
  return {
    preview: async (denops, params, options) => {
      for (const previewer of deriveArray(previewers)) {
        const item = await previewer.preview(denops, params, options);
        if (item) {
          return item;
        }
      }
    },
  };
}

export type * from "@vim-fall/core/previewer";
