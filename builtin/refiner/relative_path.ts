import * as fn from "@denops/std/function";
import { relative } from "@std/path/relative";

import { defineRefiner, type Refiner } from "../../refiner.ts";

type Detail = {
  path: string;
};

type DetailAfter = {
  relpath: string;
};

/**
 * Options for the `relativePath` Refiner.
 */
export type RelativePathOptions = {
  /**
   * The base directory to calculate the relative path from.
   */
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

      for await (const item of items) {
        const relpath = relative(base, item.detail.path);
        const value = item.value.replace(item.detail.path, relpath);

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
