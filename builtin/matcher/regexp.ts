import { defineMatcher, type Matcher } from "../../matcher.ts";
import { getByteLength } from "../../util/stringutil.ts";

/**
 * Creates a Matcher that filters items based on a regular expression pattern.
 *
 * The `regexp` Matcher applies the provided query as a regular expression to
 * each item and yields items that match the pattern. Each match within the item
 * is decorated with its matched position and length.
 *
 * @returns A Matcher that applies a regular expression filter with decorations.
 */
export function regexp(): Matcher {
  return defineMatcher(async function* (_denops, { query, items }, { signal }) {
    if (query.trim() === "") {
      yield* items;
      return;
    }

    // Create a RegExp from the query with global matching enabled
    const pattern = new RegExp(query.trim(), "g");

    // Iterate over each item, applying the regular expression
    for await (const item of items) {
      signal?.throwIfAborted();

      // Skip items that do not match the pattern
      if (!pattern.test(item.value)) {
        continue;
      }

      // Collect match details for decoration
      const matches = [...item.value.matchAll(pattern)];
      const decorations = matches.map((match) => {
        const length = match[0].length;
        const index = match.index ?? 0;
        const head = item.value.slice(0, index);
        const column = 1 + getByteLength(head); // Adjust for byte-length encoding

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
  });
}
