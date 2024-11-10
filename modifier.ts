import type { Denops } from "@denops/std";
import type { IdItem } from "@vim-fall/core/item";

import type { FlatType } from "./util/_typeutil.ts";
import { defineSource, type Source } from "./source.ts";
import { type Curator, defineCurator } from "./curator.ts";

export type ModifyParams<T> = {
  readonly items: AsyncIterable<IdItem<T>>;
};

export type Modifier<T, U = T> =
  & (<
    S extends Source<T> | Curator<T>,
    V extends S extends (Source<infer V> | Curator<infer V>) ? V : never,
    R extends S extends Source<T> ? Source<FlatType<V & U>>
      : Curator<FlatType<V & U>>,
  >(source: S) => R)
  & {
    // This `__phantom` property is used for type constraint.
    __phantom?: (_: T) => void;
  };

export function defineModifier<T, U = T>(
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
