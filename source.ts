import type { Denops } from "@denops/std";
import type { CollectParams, Source } from "@vim-fall/core/source";

import type { IdItem } from "./item.ts";
import { type DerivableArray, deriveArray } from "./util/derivable.ts";

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

/**
 * Compose multiple sources.
 *
 * The sources are collected in the order they are passed.
 *
 * @param sources The sources to compose.
 * @returns The composed source.
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

type UnionSource<
  S extends DerivableArray<Source<unknown>[]>,
> = S extends DerivableArray<
  [Source<infer T>, ...infer R extends DerivableArray<Source<unknown>[]>]
> ? T | UnionSource<R>
  : never;

export type * from "@vim-fall/core/source";
