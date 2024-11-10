import * as fn from "@denops/std/function";
import { relative } from "@std/path/relative";

import { defineRefiner, type Refiner } from "../../refiner.ts";

type Detail = {
  path: string;
};

type DetailAfter = {
  abspath: string;
};

/**
 * Creates a Projector that converts file paths to relative paths.
 *
 * This Projector transforms each item's `path` property to a relative path
 * based on the current working directory. It also preserves the original
 * absolute path in a new `abspath` field in `DetailAfter`.
 *
 * @returns A Projector that converts absolute paths to relative paths and includes the absolute path as `abspath`.
 */
export function relativePath(): Refiner<Detail, DetailAfter> {
  return defineRefiner(
    async function* (denops, { items }, { signal }) {
      // Get the current working directory
      const cwd = await fn.getcwd(denops);
      signal?.throwIfAborted();

      // Convert each item's path to a relative path
      for await (const item of items) {
        const relpath = relative(cwd, item.detail.path);
        const value = item.value.replace(item.detail.path, relpath);

        // Yield item with updated relative path and original absolute path
        yield {
          ...item,
          value,
          detail: {
            ...item.detail,
            path: relpath,
            abspath: item.detail.path,
          },
        };
      }
    },
  );
}
