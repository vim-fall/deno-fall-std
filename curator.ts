import type { Denops } from "@denops/std";
import type { IdItem } from "@vim-fall/core/item";
import type { CurateParams, Curator } from "@vim-fall/core/curator";

/**
 * Defines a curator responsible for collecting and filtering items.
 *
 * @param curate - A function to curate items based on the provided parameters.
 * @returns A curator object containing the `curate` function.
 */
export function defineCurator<T>(
  curate: (
    denops: Denops,
    params: CurateParams,
    options: { signal?: AbortSignal },
  ) => AsyncIterableIterator<IdItem<T>>,
): Curator<T> {
  return { curate };
}

export type * from "@vim-fall/core/curator";
