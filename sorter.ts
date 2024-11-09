import type { Denops } from "@denops/std";
import type { Sorter, SortParams } from "@vim-fall/core/sorter";

import { type DerivableArray, deriveArray } from "./util/derivable.ts";

/**
 * Define a sorter.
 *
 * @param sort The function to sort items.
 * @returns The sorter.
 */
export function defineSorter<T>(
  sort: (
    denops: Denops,
    params: SortParams<T>,
    options: { signal?: AbortSignal },
  ) => void | Promise<void>,
): Sorter<T> {
  return { sort };
}

/**
 * Compose multiple sorters.
 *
 * @param sorters The sorters to compose.
 * @returns The composed sorter.
 */
export function composeSorters<
  T,
  S extends DerivableArray<[Sorter<T>, ...Sorter<T>[]]>,
>(...sorters: S): Sorter<T> {
  return {
    sort: async (denops, params, options) => {
      for (const sorter of deriveArray(sorters)) {
        await sorter.sort(denops, params, options);
      }
    },
  };
}

export type * from "@vim-fall/core/sorter";
