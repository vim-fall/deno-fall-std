import type { Denops } from "@denops/std";
import type { Renderer, RenderParams } from "@vim-fall/core/renderer";

import { type DerivableArray, deriveArray } from "./util/derivable.ts";

/**
 * Defines a renderer for rendering items in a specific way.
 *
 * @param render - A function that renders items based on provided parameters.
 * @returns A renderer object containing the `render` function.
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
 * Composes multiple renderers into a single renderer.
 *
 * Each renderer is applied sequentially in the order it is passed, allowing
 * multiple render processes to be combined into one.
 *
 * @param renderers - The renderers to compose.
 * @returns A single renderer that applies all given renderers in sequence.
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
