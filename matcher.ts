import type { Denops } from "@denops/std";
import type { IdItem } from "@vim-fall/core/item";
import type { Matcher, MatchParams } from "@vim-fall/core/matcher";

import { type DerivableArray, deriveArray } from "./util/derivable.ts";

/**
 * Define a matcher.
 *
 * @param match The function to match items.
 * @returns The matcher.
 */
export function defineMatcher<T>(
  match: (
    denops: Denops,
    params: MatchParams<T>,
    options: { signal?: AbortSignal },
  ) => AsyncIterableIterator<IdItem<T>>,
): Matcher<T> {
  return { match };
}

/**
 * Compose multiple matchers.
 *
 * The matchers are applied in the order they are passed.
 *
 * @param matchers The matchers to compose.
 * @returns The composed matcher.
 */
export function composeMatchers<
  T,
  M extends DerivableArray<[Matcher<T>, ...Matcher<T>[]]>,
>(...matchers: M): Matcher<T> {
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

export type * from "@vim-fall/core/matcher";
