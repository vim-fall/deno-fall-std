export type * from "@vim-fall/core/sorter";

import type { Denops } from "@denops/std";
import type { Sorter, SortParams } from "@vim-fall/core/sorter";

import type { Detail, DetailUnit } from "./item.ts";
import { type DerivableArray, deriveArray } from "./util/derivable.ts";

/**
 * Defines a sorter responsible for arranging items in a specific order.
 *
 * @param sort - A function that sorts items based on given parameters.
 * @returns A sorter object containing the `sort` function.
 */
export function defineSorter<T extends Detail = DetailUnit>(
  sort: (
    denops: Denops,
    params: SortParams<T>,
    options: { signal?: AbortSignal },
  ) => void | Promise<void>,
): Sorter<T> {
  return { sort };
}

/**
 * Composes multiple sorters into a single sorter.
 *
 * Each sorter is applied sequentially in the order provided, allowing
 * for complex sorting criteria by combining multiple sorters.
 *
 * @param sorters - The sorters to compose.
 * @returns A single sorter that applies all given sorters in sequence.
 */
export function composeSorters<T extends Detail>(
  ...sorters: DerivableArray<[Sorter<T>, ...Sorter<T>[]]>
): Sorter<T> {
  return {
    sort: async (denops, params, options) => {
      for (const sorter of deriveArray(sorters)) {
        await sorter.sort(denops, params, options);
      }
    },
  };
}
