import * as fn from "@denops/std/function";

import { defineProjector, type Projector } from "../../projector.ts";

/**
 * Represents detailed information for each item, specifically the file path.
 */
type Detail = {
  path: string;
};

/**
 * Creates a Projector that filters items based on the current working directory.
 *
 * This Projector yields only those items whose `path` is within the current working directory.
 *
 * @returns A Projector that filters items according to the current working directory.
 */
export function cwd<T extends Detail>(): Projector<T> {
  return defineProjector<T>(async function* (denops, { items }, { signal }) {
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
