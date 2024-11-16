import * as fn from "@denops/std/function";
import { relative } from "@std/path/relative";

import { defineRefiner, type Refiner } from "../../refiner.ts";

type Detail = {
  path: string;
};

type DetailAfter = {
  relpath: string;
};

export type RelativePathOptions = {
  base?: string;
};

/**
 * Creates a Projector that converts file path in value to relative paths.
 */
export function relativePath(
  options: RelativePathOptions = {},
): Refiner<Detail, DetailAfter> {
  return defineRefiner(
    async function* (denops, { items }, { signal }) {
      // Get the current working directory
      const base = options.base ?? await fn.getcwd(denops);
      signal?.throwIfAborted();

      // Convert each item's path to a relative path
      for await (const item of items) {
        const relpath = relative(base, item.detail.path);
        const value = item.value.replace(item.detail.path, relpath);

        // Yield item with updated relative path and original absolute path
        yield {
          ...item,
          value,
          detail: {
            ...item.detail,
            relpath,
          },
        };
      }
    },
  );
}
