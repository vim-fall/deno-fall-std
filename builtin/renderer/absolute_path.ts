import * as fn from "@denops/std/function";
import { join } from "@std/path/join";
import { isAbsolute } from "@std/path/is-absolute";

import { defineRenderer, type Renderer } from "../../renderer.ts";

type Detail = {
  path: string;
};

/**
 * Options for the absolutePath renderer.
 */
export type AbsolutePathOptions = {
  /**
   * The base directory to calculate the absolute path. If not specified, the
   * current working directory is used.
   */
  base?: string;
};

/**
 * Creates a Renderer that replace file path in the label to absolute paths.
 *
 * @returns A Renderer that replace file path in the label to absolute paths.
 */
export function absolutePath(
  options: AbsolutePathOptions = {},
): Renderer<Detail> {
  return defineRenderer(async (denops, { items }, { signal }) => {
    // Get the current working directory
    const base = options.base ?? await fn.getcwd(denops);
    signal?.throwIfAborted();

    // Convert relative path in label to absolute path
    items.forEach((item) => {
      const abspath = isAbsolute(item.detail.path)
        ? item.detail.path
        : join(base, item.detail.path);
      item.label = item.label.replace(item.detail.path, abspath);
    });
  });
}
