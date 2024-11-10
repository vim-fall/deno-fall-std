import * as fn from "@denops/std/function";

import { defineRefiner, type Refiner } from "../../refiner.ts";

type Detail = {
  path: string;
};

/**
 * Creates a Refiner that filters items based on the current working directory.
 *
 * This Refiner yields only those items whose `path` is within the current working directory.
 *
 * @returns A Refiner that filters items according to the current working directory.
 */
export function cwd(): Refiner<Detail> {
  return defineRefiner(async function* (denops, { items }, { signal }) {
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
