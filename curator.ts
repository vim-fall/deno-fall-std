export type * from "@vim-fall/core/curator";

import type { Denops } from "@denops/std";
import type { CurateParams, Curator } from "@vim-fall/core/curator";

import type { Detail, IdItem } from "./item.ts";
import { type DerivableArray, deriveArray } from "./util/derivable.ts";

/**
 * Defines a curator responsible for collecting and filtering items.
 *
 * @param curate - A function to curate items based on the provided parameters.
 * @returns A curator object containing the `curate` function.
 */
export function defineCurator<T extends Detail>(
  curate: (
    denops: Denops,
    params: CurateParams,
    options: { signal?: AbortSignal },
  ) => AsyncIterableIterator<IdItem<T>>,
): Curator<T> {
  return { curate };
}

/**
 * Composes multiple curators into a single curator.
 *
 * Each curator is collected sequentially in the order it is provided. The
 * resulting items are combined into a single asynchronous iterable, with each
 * item assigned a unique incremental ID.
 *
 * @param curators - The curators to compose.
 * @returns A single composed curator that collects items from all given curators.
 */
export function composeCurators<
  S extends DerivableArray<[Curator<Detail>, ...Curator<Detail>[]]>,
  R extends UnionCurator<S>,
>(...curators: S): Curator<R> {
  return {
    curate: async function* (denops, params, options) {
      let id = 0;
      for (const curator of deriveArray(curators)) {
        for await (const item of curator.curate(denops, params, options)) {
          yield { ...item, id: id++ } as IdItem<R>;
        }
      }
    },
  };
}

/**
 * Recursively constructs a union type from an array of curators.
 *
 * @template S - Array of curators to create a union type from.
 */
type UnionCurator<
  S extends DerivableArray<Curator<Detail>[]>,
> = S extends DerivableArray<
  [Curator<infer T>, ...infer R extends DerivableArray<Curator<Detail>[]>]
> ? T | UnionCurator<R>
  : never;
