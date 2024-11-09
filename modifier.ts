import type { Denops } from "@denops/std";
import type { IdItem } from "@vim-fall/core/item";

import type { FlatType } from "./util/_typeutil.ts";
import { defineSource, type Source } from "./source.ts";
import { type Curator, defineCurator } from "./curator.ts";

declare const UNSPECIFIED: unique symbol;
type UNSPECIFIED = typeof UNSPECIFIED;

export type ModifyParams<T> = {
  readonly items: AsyncIterable<IdItem<T>>;
};

export type Modifier<T, U = UNSPECIFIED> =
  & (<
    S extends Source<T> | Curator<T>,
    V extends S extends (Source<infer V> | Curator<infer V>) ? V : never,
    W extends U extends UNSPECIFIED ? V : U,
    R extends S extends Source<T> ? Source<FlatType<V & W>>
      : Curator<FlatType<V & W>>,
  >(source: S) => R)
  & {
    __phantom?: T;
  };

export function defineModifier<T, U = UNSPECIFIED>(
  modify: (
    denops: Denops,
    params: ModifyParams<T>,
    options: { signal?: AbortSignal },
  ) => AsyncIterableIterator<IdItem<T & U>>,
): Modifier<T, U> {
  return ((source) => {
    if ("collect" in source) {
      return defineSource(
        (denops, params, options) => {
          const items = source.collect(denops, params, options);
          return modify(denops, { items }, options);
        },
      );
    } else {
      return defineCurator(
        (denops, params, options) => {
          const items = source.curate(denops, params, options);
          return modify(denops, { items }, options);
        },
      );
    }
  }) as Modifier<T, U>;
}
