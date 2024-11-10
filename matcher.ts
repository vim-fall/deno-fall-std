export type * from "@vim-fall/core/matcher";

import type { Denops } from "@denops/std";
import type { Detail, DetailUnit, IdItem } from "@vim-fall/core/item";
import type { Matcher, MatchParams } from "@vim-fall/core/matcher";

import { type DerivableArray, deriveArray } from "./util/derivable.ts";

/**
 * Defines a matcher that filters items based on a query.
 *
 * @param match - A function that matches items based on given parameters.
 * @returns A matcher object containing the `match` function.
 */
export function defineMatcher<T extends Detail = DetailUnit>(
  match: <V extends T>(
    denops: Denops,
    params: MatchParams<V>,
    options: { signal?: AbortSignal },
  ) => AsyncIterableIterator<IdItem<V>>,
): Matcher<T> {
  return { match };
}

/**
 * Composes multiple matchers into a single matcher.
 *
 * The matchers are applied sequentially in the order they are provided.
 * Each matcher processes the items from the previous one.
 *
 * @param matchers - The matchers to compose.
 * @returns A matcher that applies all composed matchers in sequence.
 */
export function composeMatchers<T extends Detail>(
  ...matchers: DerivableArray<[Matcher<T>, ...Matcher<NoInfer<T>>[]]>
): Matcher<T> {
  return {
    match: async function* (denops, { items, query }, options) {
      for (const matcher of deriveArray(matchers)) {
        items = await Array.fromAsync(
          matcher.match(denops, { items, query }, options),
        );
      }
      yield* items;
    },
  };
}
