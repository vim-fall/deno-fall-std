import { exists as exists_ } from "@std/fs/exists";

import { defineProjector, type Projector } from "../../projector.ts";

/**
 * Represents detailed information for each item, specifically the file path.
 */
type Detail = {
  path: string;
};

/**
 * Creates a Projector that filters items based on file existence.
 *
 * This Projector checks each item's `path` and yields only those items
 * where the path exists in the filesystem.
 *
 * @returns A Projector that filters items according to file existence.
 */
export function exists(): Projector<Detail> {
  return defineProjector(async function* (_denops, { items }, { signal }) {
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
