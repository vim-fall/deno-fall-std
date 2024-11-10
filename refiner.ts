import type { Denops } from "@denops/std";
import type { IdItem } from "@vim-fall/core/item";

import type { FlatType } from "./util/_typeutil.ts";
import type { Detail, DetailUnit } from "./item.ts";
import { defineSource, type Source } from "./source.ts";
import { type Curator, defineCurator } from "./curator.ts";
import { type Derivable, derive, deriveArray } from "./util/derivable.ts";

type Refine<T extends Detail, U extends Detail> = (
  denops: Denops,
  params: RefineParams<T>,
  options: { signal?: AbortSignal },
) => AsyncIterableIterator<IdItem<T & U>>;

export type RefineParams<T extends Detail> = {
  readonly items: AsyncIterable<IdItem<T>>;
};

export type Refiner<
  T extends Detail = DetailUnit,
  U extends Detail = DetailUnit,
> = {
  __phantom?: (_: T) => void;
  refine: <V extends T>(
    denops: Denops,
    params: RefineParams<V>,
    options: { signal?: AbortSignal },
  ) => AsyncIterableIterator<IdItem<V & U>>;
};

export function defineRefiner<
  T extends Detail = DetailUnit,
  U extends Detail = DetailUnit,
>(
  refine: Refine<T, U>,
): Refiner<T, U> {
  return { refine } as Refiner<T, U>;
}

export function refineSource<
  Input extends Detail,
  // deno-lint-ignore no-explicit-any
  Refiners extends Derivable<Refiner<any, Detail>>[],
>(
  source: Derivable<Source<Input>>,
  ...refiners: PipeRefiners<Refiners, Input>
): Source<FlatType<Input & PipeRefinersOutput<Refiners>>> {
  // deno-lint-ignore no-explicit-any
  const refiner = composeRefiners(...refiners as any);
  source = derive(source);
  return defineSource((denops, params, options) => {
    const items = source.collect(denops, params, options);
    return refiner.refine(denops, { items }, options);
  });
}

export function refineCurator<
  Input extends Detail,
  // deno-lint-ignore no-explicit-any
  Refiners extends Derivable<Refiner<any, Detail>>[],
>(
  curator: Derivable<Curator<Input>>,
  ...refiners: PipeRefiners<Refiners, Input>
): Curator<FlatType<Input & PipeRefinersOutput<Refiners>>> {
  // deno-lint-ignore no-explicit-any
  const refiner = composeRefiners(...refiners as any);
  curator = derive(curator);
  return defineCurator((denops, params, options) => {
    const items = curator.curate(denops, params, options);
    return refiner.refine(denops, { items }, options);
  });
}

export function composeRefiners<
  Input extends Detail,
  // deno-lint-ignore no-explicit-any
  Refiners extends Derivable<Refiner<any, Detail>>[],
>(
  ...refiners: PipeRefiners<Refiners, Input>
): Refiner<Input, FlatType<PipeRefinersOutput<Refiners>>> {
  return {
    refine: async function* (
      denops: Denops,
      params: RefineParams<Input>,
      options: { signal?: AbortSignal },
    ) {
      let items: AsyncIterable<IdItem<Detail>> = params.items;
      for (const refiner of deriveArray(refiners)) {
        items = (refiner.refine as Refine<Detail, Detail>)(
          denops,
          { items },
          options,
        );
      }
      yield* items;
    },
  } as Refiner<Input, FlatType<PipeRefinersOutput<Refiners>>>;
}

type RefinerB<T> = T extends Derivable<Refiner<infer _, infer B>> ? B : never;

type PipeRefiners<
  Refiners extends Derivable<Refiner<Detail, Detail>>[],
  Input extends Detail,
> = Refiners extends // deno-lint-ignore no-explicit-any
[infer Head, ...infer Tail extends Derivable<Refiner<any, any>>[]] ? [
    Derivable<Refiner<Input, RefinerB<Head>>>,
    ...PipeRefiners<Tail, Input & RefinerB<Head>>,
  ]
  : Refiners;

type PipeRefinersOutput<
  Refiners extends Derivable<Refiner<Detail, Detail>>[],
> = Refiners extends [infer Head] ? RefinerB<Head>
  : Refiners extends // deno-lint-ignore no-explicit-any
  [infer Head, ...infer Tail extends Derivable<Refiner<any, any>>[]]
    ? RefinerB<Head> & PipeRefinersOutput<Tail>
  : never;
