import type { Denops } from "@denops/std";
import type { IdItem } from "@vim-fall/core/item";

import { defineSource, type Source } from "./source.ts";
import { type Curator, defineCurator } from "./curator.ts";

export type FilterParams<T> = {
  readonly items: AsyncIterable<IdItem<T>>;
};

export type Filter<T> = (<S extends Source<T> | Curator<T>>(source: S) => S) & {
  __phantom?: T;
};

export function defineFilter<T>(
  modify: (
    denops: Denops,
    params: FilterParams<T>,
    options: { signal?: AbortSignal },
  ) => AsyncIterableIterator<IdItem<T>>,
): Filter<T> {
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
  }) as Filter<T>;
}
