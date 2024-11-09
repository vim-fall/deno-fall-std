import type { Denops } from "@denops/std";
import type { IdItem } from "@vim-fall/core/item";
import type { CurateParams, Curator } from "@vim-fall/core/curator";

/**
 * Define a curator.
 *
 * @param curate The function to curate items.
 * @returns The curator.
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
