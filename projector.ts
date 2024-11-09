import type { Denops } from "@denops/std";
import type { IdItem } from "@vim-fall/core/item";
import type { Projector, ProjectParams } from "@vim-fall/core/projector";

import type { FirstType, LastType } from "./util/_typeutil.ts";
import { defineSource, type Source } from "./source.ts";
import { type Curator, defineCurator } from "./curator.ts";
import {
  type Derivable,
  type DerivableArray,
  derive,
  deriveArray,
} from "./util/derivable.ts";

/**
 * Defines a projector responsible for transforming or filtering items.
 *
 * @param project - A function that processes items based on given parameters.
 * @returns A projector object containing the `project` function.
 */
export function defineProjector<T, U = T>(
  project: (
    denops: Denops,
    params: ProjectParams<T>,
    options: { signal?: AbortSignal },
  ) => AsyncIterableIterator<IdItem<U>>,
): Projector<T, U> {
  return { project };
}

/**
 * Composes multiple projectors into a single projector.
 *
 * The projectors are applied sequentially in the order they are passed.
 * Each projector processes the items from the previous one, allowing for
 * a series of transformations or filters.
 *
 * @param projectors - The projectors to compose.
 * @returns A composed projector that applies all given projectors in sequence.
 */
export function composeProjectors<
  T extends FirstType<P> extends Derivable<Projector<infer T, unknown>> ? T
    : never,
  U extends LastType<P> extends Derivable<Projector<infer _, infer U>> ? U
    : never,
  P extends DerivableArray<[
    Projector<unknown, unknown>,
    ...Projector<unknown, unknown>[],
  ]>,
>(...projectors: P): Projector<T, U> {
  return {
    project: async function* (
      denops: Denops,
      params: ProjectParams<T>,
      options: { signal?: AbortSignal },
    ) {
      let it: AsyncIterable<IdItem<unknown>> = params.items;
      for (const projector of deriveArray(projectors)) {
        it = projector.project(denops, { items: it }, options);
      }
      yield* it as AsyncIterable<IdItem<U>>;
    },
  };
}

/**
 * Pipes projectors to a source or curator, applying them sequentially.
 *
 * Each projector is applied in the order specified, transforming or filtering
 * items from the source or curator.
 *
 * @param source - The source or curator to which projectors are applied.
 * @param projectors - The projectors to apply.
 * @returns A new source or curator with the projectors applied in sequence.
 */
export function pipeProjectors<
  T,
  U extends LastType<P> extends Derivable<Projector<infer _, infer U>> ? U
    : never,
  S extends Derivable<Source<T> | Curator<T>>,
  P extends DerivableArray<[
    Projector<unknown, unknown>,
    ...Projector<unknown, unknown>[],
  ]>,
  R extends S extends Derivable<Source<unknown>> ? Source<U> : Curator<U>,
>(
  source: S,
  ...projectors: P
): R {
  const src = derive(source);
  const projector = composeProjectors(...projectors) as Projector<T, U>;
  if ("collect" in src) {
    // Define a new source with the composed projectors applied.
    return defineSource<U>((denops, params, options) => {
      const items = src.collect(denops, params, options);
      return projector.project(denops, { items }, options);
    }) as R;
  } else {
    // Define a new curator with the composed projectors applied.
    return defineCurator<U>((denops, params, options) => {
      const items = src.curate(denops, params, options);
      return projector.project(denops, { items }, options);
    }) as R;
  }
}

export type * from "@vim-fall/core/projector";
