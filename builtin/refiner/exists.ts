import { exists as exists_ } from "@std/fs/exists";

import { defineRefiner, type Refiner } from "../../refiner.ts";

type Detail = {
  path: string;
};

/**
 * Creates a Refiner that filters items based on file existence.
 *
 * This Refiner checks each item's `path` and yields only those items
 * where the path exists in the filesystem.
 *
 * @returns A Refiner that filters items according to file existence.
 */
export function exists(): Refiner<Detail> {
  return defineRefiner(async function* (_denops, { items }, { signal }) {
    // Check each item's path for existence and yield it if the file exists
    for await (const item of items) {
      if (await exists_(item.detail.path)) {
        yield item;
      }
      // Abort the iteration if the signal is triggered
      signal?.throwIfAborted();
    }
  });
}
