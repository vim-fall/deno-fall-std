import type { Detail, IdItem } from "../../item.ts";
import { defineSource, type Source } from "../../source.ts";

/**
 * Create a source that provides a fixed list of items.
 *
 * This source yields items from a specified list, which can be either
 * a synchronous or asynchronous iterable. The list of items remains constant,
 * making this source suitable for use cases where a predefined set of items is needed.
 *
 * @param items - An iterable or async iterable of items to yield.
 * @returns A source that yields each item in the provided list.
 */
export function list<T extends Detail>(
  items: Iterable<IdItem<T>> | AsyncIterable<IdItem<T>>,
): Source<T> {
  return defineSource(async function* (_denops, _params, _options) {
    yield* items;
  });
}
