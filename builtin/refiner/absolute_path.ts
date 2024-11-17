import * as fn from "@denops/std/function";
import { join } from "@std/path/join";
import { isAbsolute } from "@std/path/is-absolute";

import { defineRefiner, type Refiner } from "../../refiner.ts";

type Detail = {
  path: string;
};

type DetailAfter = {
  abspath: string;
};

/**
 * Options for the `absolutePath` Refiner.
 */
export type AbsolutePathOptions = {
  /**
   * The base directory to calculate the absolute path from.
   */
  base?: string;
};

/**
 * Creates a Projector that converts file path in value to absolute paths.
 */
export function absolutePath(
  options: AbsolutePathOptions = {},
): Refiner<Detail, DetailAfter> {
  return defineRefiner(
    async function* (denops, { items }, { signal }) {
      // Get the current working directory
      const base = options.base ?? await fn.getcwd(denops);
      signal?.throwIfAborted();

      for await (const item of items) {
        const abspath = isAbsolute(item.detail.path)
          ? item.detail.path
          : join(base, item.detail.path);
        const value = item.value.replace(item.detail.path, abspath);

        yield {
          ...item,
          value,
          detail: {
            ...item.detail,
            abspath,
          },
        };
      }
    },
  );
}
