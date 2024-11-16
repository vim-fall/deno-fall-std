import {
  asyncExtendedMatch,
  AsyncFzf,
  type AsyncFzfOptions,
  type Tiebreaker,
} from "fzf";

import type { Detail, IdItem } from "../../item.ts";
import { defineMatcher, type Matcher } from "../../matcher.ts";

/**
 * Options for configuring the FZF matcher.
 *
 * - `casing`: Specifies case sensitivity options ("smart-case", "case-sensitive", "case-insensitive").
 * - `normalize`: Normalizes characters for comparison (e.g., ignoring accents).
 * - `sort`: Enables sorting of results.
 * - `forward`: Controls the search direction (forward or backward).
 * - `match`: Custom matching function for FZF.
 */
export type FzfOptions = Omit<AsyncFzfOptions<IdItem<Detail>>, "selector">;

/**
 * Creates an FZF-based matcher that filters items based on user query terms.
 *
 * This matcher uses the FZF algorithm for fuzzy matching, with support for
 * multi-term queries. Each term is matched sequentially, refining the results.
 * Decorations are added to highlight matched portions of each item.
 *
 * @param options - Configuration options for FZF matching.
 * @returns A Matcher that performs fuzzy matching on items.
 */
export function fzf(options: FzfOptions = {}): Matcher {
  const casing = options.casing ?? "smart-case";
  const normalize = options.normalize ?? true;
  const sort = options.sort ?? true;
  const forward = options.forward ?? true;
  const match = options.match ?? asyncExtendedMatch;

  return defineMatcher(async function* (_denops, { items, query }, { signal }) {
    if (query.trim() === "") {
      yield* items;
      return;
    }

    // Split query into individual terms, ignoring empty strings
    const terms = query.trim().split(/\s+/).filter((v) => v.length > 0);

    // deno-lint-ignore no-explicit-any
    const filter = async (items: readonly IdItem<any>[], term: string) => {
      const fzf = new AsyncFzf(items, {
        selector: (v) => v.value,
        casing,
        normalize,
        sort,
        forward,
        match,
        tiebreakers: [byTrimmedLengthAsc],
      });

      // Perform the FZF search
      const found = await fzf.find(term);
      signal?.throwIfAborted();

      // Map matched results and add decorations for highlighting
      return found
        .map((v) => {
          const column = Math.max(0, v.start + 1);
          const length = Math.max(0, v.end - v.start);
          if (length === 0) return undefined;

          return {
            ...v.item,
            decorations: [
              ...(v.item.decorations ?? []),
              { column, length },
            ],
          };
        })
        .filter((v) => !!v);
    };

    // Apply filtering for each term in reverse order to refine results
    for (const term of terms.reverse()) {
      items = await filter(items, term);
    }
    yield* items;
  });
}

// deno-lint-ignore no-explicit-any
const byTrimmedLengthAsc: Tiebreaker<IdItem<any>> = (a, b, selector) => {
  return selector(a.item).trim().length - selector(b.item).trim().length;
};
