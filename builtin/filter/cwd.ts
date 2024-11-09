import * as fn from "@denops/std/function";

import { defineFilter, type Filter } from "../../filter.ts";

/**
 * Represents detailed information for each item, specifically the file path.
 */
type Detail = {
  path: string;
};

/**
 * Creates a Filter that filters items based on the current working directory.
 *
 * This Filter yields only those items whose `path` is within the current working directory.
 *
 * @returns A Filter that filters items according to the current working directory.
 */
export function cwd<T extends Detail>(): Filter<T> {
  return defineFilter<T>(async function* (denops, { items }, { signal }) {
    // Retrieve the current working directory
    const cwd = await fn.getcwd(denops);
    signal?.throwIfAborted();

    // Yield each item that matches the current working directory
    for await (const item of items) {
      signal?.throwIfAborted();
      if (item.detail.path.startsWith(cwd)) {
        yield item;
      }
    }
  });
}
