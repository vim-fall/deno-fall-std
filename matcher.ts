import type { Denops } from "@denops/std";
import type { IdItem } from "@vim-fall/core/item";
import type { Matcher, MatchParams } from "@vim-fall/core/matcher";

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

export type * from "@vim-fall/core/matcher";
