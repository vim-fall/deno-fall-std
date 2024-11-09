import type { Denops } from "@denops/std";
import type { PreviewItem } from "@vim-fall/core/item";
import type { Previewer, PreviewParams } from "@vim-fall/core/previewer";

import type { Promish } from "./util/_typeutil.ts";
import { type DerivableArray, deriveArray } from "./util/derivable.ts";

/**
 * Defines a previewer for displaying item previews.
 *
 * @param preview - A function that generates a preview for an item.
 * @returns A previewer object containing the `preview` function.
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
 * Composes multiple previewers into a single previewer.
 *
 * The composed previewer tries each previewer in sequence, stopping as soon as
 * one of them returns a non-`undefined` preview. This allows for a fallback
 * mechanism among multiple previewers.
 *
 * @param previewers - The previewers to compose.
 * @returns A single previewer that applies each previewer in sequence until a preview is generated.
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
