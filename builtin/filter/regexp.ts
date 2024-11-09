import { defineProjector, type Projector } from "../../projector.ts";

/**
 * Options for filtering items by regular expressions.
 *
 * - `includes`: A list of regular expressions; an item is included if it matches any of these.
 * - `excludes`: A list of regular expressions; an item is excluded if it matches any of these.
 *
 * One of `includes` or `excludes` must be provided, or both can be used together.
 */
type Options = {
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
 * Represents detailed information for each item, specifically the file path.
 */
type Detail = {
  path: string;
};

/**
 * Creates a Projector that filters items based on regular expression patterns.
 *
 * The `regexp` Projector filters items using `includes` and/or `excludes` patterns.
 * - If `includes` patterns are provided, only items that match at least one pattern are yielded.
 * - If `excludes` patterns are provided, any item that matches at least one pattern is excluded.
 *
 * @param options - Filtering options specifying `includes` and/or `excludes` patterns.
 * @returns A Projector that yields items matching the specified patterns.
 */
export function regexp<T extends Detail>(
  { includes, excludes }: Readonly<Options>,
): Projector<T> {
  return defineProjector<T>(async function* (_denops, { items }, { signal }) {
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
