import { defineMatcher, type Matcher } from "../../matcher.ts";
import { getByteLength } from "../../util/stringutil.ts";

/**
 * Options for substring matching.
 *
 * - `smartCase`: Enables case-insensitive matching only if the query is lowercase.
 * - `ignoreCase`: Enables case-insensitive matching regardless of query casing.
 *
 * If both `smartCase` and `ignoreCase` are true, `ignoreCase` takes precedence.
 */
export type SubstringOptions = {
  smartCase?: boolean;
  ignoreCase?: boolean;
};

/**
 * Creates a substring Matcher that filters items based on query substrings.
 *
 * The Matcher supports multi-term queries and case sensitivity options
 * (smart case and ignore case). Each matched substring within the item is decorated
 * with its position and length.
 *
 * @param options - Matching options to control case sensitivity.
 * @returns A Matcher that applies substring filtering with decorations.
 */
export function substring(options: SubstringOptions = {}): Matcher {
  // Determine case sensitivity mode based on options
  const case_ = options.ignoreCase
    ? "ignore"
    : options.smartCase
    ? "smart"
    : "none";

  // Determine if the search should ignore case based on the query
  const shouldIgnoreCase = (query: string): boolean => {
    switch (case_) {
      case "ignore":
        return true;
      case "smart":
        return query.toLowerCase() === query;
      default:
        return false;
    }
  };

  return defineMatcher(
    async function* (_denops, { query, items }, { signal }) {
      const ignoreCase = shouldIgnoreCase(query);
      const norm = (v: string): string => (ignoreCase ? v.toLowerCase() : v);
      const terms = query
        .split(/\s+/)
        .filter((v) => v.length > 0)
        .map(norm);
      const pattern = new RegExp(terms.join("|"), ignoreCase ? "ig" : "g");

      // Process each item and match against the pattern
      for await (const item of items) {
        signal?.throwIfAborted();

        // Check if all terms are included in the item value
        if (terms.some((term) => !norm(item.value).includes(term))) {
          continue;
        }

        // Collect match details for decoration
        const matches = [...item.value.matchAll(pattern)];
        const decorations = matches.map((match) => {
          const length = match[0].length;
          const index = match.index ?? 0;
          const head = item.value.slice(0, index);
          const column = 1 + getByteLength(head);

          return { column, length };
        });

        // Yield the item with decorations for all matches
        yield {
          ...item,
          decorations: item.decorations
            ? [...item.decorations, ...decorations]
            : decorations,
        };
      }
    },
  );
}
