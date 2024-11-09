import type { Denops } from "@denops/std";
import type { CollectParams, Source } from "@vim-fall/core/source";

import type { IdItem } from "./item.ts";
import { type DerivableArray, deriveArray } from "./util/derivable.ts";

/**
 * Defines a source responsible for collecting items.
 *
 * @param collect - A function that collects items asynchronously.
 * @returns A source object containing the `collect` function.
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

/**
 * Composes multiple sources into a single source.
 *
 * Each source is collected sequentially in the order it is provided. The
 * resulting items are combined into a single asynchronous iterable, with each
 * item assigned a unique incremental ID.
 *
 * @param sources - The sources to compose.
 * @returns A single composed source that collects items from all given sources.
 */
export function composeSources<
  S extends DerivableArray<[Source<unknown>, ...Source<unknown>[]]>,
  R extends UnionSource<S>,
>(...sources: S): Source<R> {
  return {
    collect: async function* (denops, params, options) {
      let id = 0;
      for (const source of deriveArray(sources)) {
        for await (const item of source.collect(denops, params, options)) {
          yield { ...item, id: id++ } as IdItem<R>;
        }
      }
    },
  };
}

/**
 * Recursively constructs a union type from an array of sources.
 *
 * @template S - Array of sources to create a union type from.
 */
type UnionSource<
  S extends DerivableArray<Source<unknown>[]>,
> = S extends DerivableArray<
  [Source<infer T>, ...infer R extends DerivableArray<Source<unknown>[]>]
> ? T | UnionSource<R>
  : never;

export type * from "@vim-fall/core/source";
