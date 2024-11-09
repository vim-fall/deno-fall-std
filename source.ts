import type { Denops } from "@denops/std";
import type { CollectParams, Source } from "@vim-fall/core/source";

import type { IdItem } from "./item.ts";

/**
 * Define a source.
 *
 * @param collect The function to collect items.
 * @returns The source.
 */
export function defineSource<T>(
  collect: (
    denops: Denops,
    params: CollectParams,
    options: { signal?: AbortSignal },
  ) => AsyncIterableIterator<IdItem<T>>,
): Source<T> {
  return { collect };
}

export type * from "@vim-fall/core/source";
