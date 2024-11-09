import type { Denops } from "@denops/std";
import type { Renderer, RenderParams } from "@vim-fall/core/renderer";

import { type DerivableArray, deriveArray } from "./util/derivable.ts";

/**
 * Define a renderer.
 *
 * @param render The function to render items.
 * @returns The renderer.
 */
export function defineRenderer<T>(
  render: (
    denops: Denops,
    params: RenderParams<T>,
    options: { signal?: AbortSignal },
  ) => void | Promise<void>,
): Renderer<T> {
  return { render };
}

/**
 * Compose multiple renderers.
 *
 * @param renderers The renderers to compose.
 * @returns The composed renderer.
 */
export function composeRenderers<
  T,
  R extends DerivableArray<[Renderer<T>, ...Renderer<T>[]]>,
>(
  ...renderers: R
): Renderer<T> {
  return {
    render: async (denops, params, options) => {
      for (const renderer of deriveArray(renderers)) {
        await renderer.render(denops, params, options);
      }
    },
  };
}

export type * from "@vim-fall/core/renderer";
