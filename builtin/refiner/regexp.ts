import { defineRefiner, type Refiner } from "../../refiner.ts";

/**
 * Options for filtering items by regular expressions.
 *
 * - `includes`: A list of regular expressions; an item is included if it matches any of these.
 * - `excludes`: A list of regular expressions; an item is excluded if it matches any of these.
 *
 * One of `includes` or `excludes` must be provided, or both can be used together.
 */
export type RegexpOptions = {
  includes: RegExp[];
  excludes?: undefined;
} | {
  includes?: undefined;
  excludes: RegExp[];
} | {
  includes: RegExp[];
  excludes: RegExp[];
};

/**
 * Creates a Refiner that filters items based on regular expression patterns.
 *
 * The `regexp` Refiner filters items using `includes` and/or `excludes` patterns.
 * - If `includes` patterns are provided, only items that match at least one pattern are yielded.
 * - If `excludes` patterns are provided, any item that matches at least one pattern is excluded.
 *
 * @param options - Refinering options specifying `includes` and/or `excludes` patterns.
 * @returns A Refiner that yields items matching the specified patterns.
 */
export function regexp(
  { includes, excludes }: Readonly<RegexpOptions>,
): Refiner {
  return defineRefiner(async function* (_denops, { items }, { signal }) {
    signal?.throwIfAborted();

    // Process each item and yield only those matching the filter conditions
    for await (const item of items) {
      signal?.throwIfAborted();

      // Skip items that do not match any of the `includes` patterns, if provided
      if (includes && !includes.some((r) => r.test(item.value))) {
        continue;
      }

      // Skip items that match any of the `excludes` patterns, if provided
      if (excludes && excludes.some((r) => r.test(item.value))) {
        continue;
      }

      // Yield item if it passed both includes and excludes checks
      yield item;
    }
  });
}
