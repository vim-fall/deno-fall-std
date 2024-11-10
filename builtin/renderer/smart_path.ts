import { SEPARATOR } from "@std/path/constants";

import { defineRenderer, type Renderer } from "../../renderer.ts";
import { getByteLength } from "../../util/stringutil.ts";

/**
 * Creates a Renderer that formats paths by emphasizing the filename.
 *
 * This Renderer separates the filename from its directory path, displaying the filename prominently
 * and applying a `Comment` highlight to the directory portion. It also adjusts existing decorations
 * to account for the filename and directory split.
 *
 * @returns A Renderer that reformats paths for better readability.
 */
export function smartPath(): Renderer {
  return defineRenderer((_denops, { items }, { signal }) => {
    for (const item of items) {
      signal?.throwIfAborted();

      const { label, decorations } = item;
      const index = label.lastIndexOf(SEPARATOR);
      if (index === -1) {
        continue;
      }

      // Separate filename and dirname based on the last separator
      const filename = label.substring(index + 1);
      const dirname = label.substring(0, index);
      const filenameLength = getByteLength(filename);
      const dirnameLength = getByteLength(dirname);

      // Adjusts decoration positions after reformatting the label
      const project = (n: number): number => {
        if (n > index) {
          return n - index - 1;
        } else {
          return n + filenameLength + 1;
        }
      };

      // Update label and apply decoration to the dirname
      item.label = `${filename} ${dirname}`;
      item.decorations = [
        ...decorations.map((v) => ({
          ...v,
          column: project(v.column),
        })),
        {
          column: filenameLength + 1,
          length: dirnameLength + 1,
          highlight: "Comment",
        },
      ];
    }
  });
}
