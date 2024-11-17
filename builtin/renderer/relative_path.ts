import * as fn from "@denops/std/function";
import { relative } from "@std/path/relative";

import { defineRenderer, type Renderer } from "../../renderer.ts";

type Detail = {
  path: string;
};

/**
 * Options for the relativePath renderer.
 */
export type RelativePathOptions = {
  /**
   * The base directory to calculate the relative path. If not specified, the
   * current working directory is used.
   */
  base?: string;
};

/**
 * Creates a Renderer that replace file path in the label to relative paths.
 *
 * @returns A Renderer that replace file path in the label to relative paths.
 */
export function relativePath(
  options: RelativePathOptions = {},
): Renderer<Detail> {
  return defineRenderer(async (denops, { items }, { signal }) => {
    // Get the current working directory
    const base = options.base ?? await fn.getcwd(denops);
    signal?.throwIfAborted();

    // Convert absolute path in label to relative path
    items.forEach((item) => {
      const relpath = relative(base, item.detail.path);
      item.label = item.label.replace(item.detail.path, relpath);
    });
  });
}
