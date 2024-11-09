import basenameJson from "./_nerdfont/basename.json" with { type: "json" };
import extensionJson from "./_nerdfont/extension.json" with { type: "json" };
import patternJson from "./_nerdfont/pattern.json" with { type: "json" };

import { basename } from "@std/path/basename";
import { extname } from "@std/path/extname";

import { defineRenderer, type Renderer } from "../../renderer.ts";
import { getByteLength } from "../../util/stringutil.ts";

/**
 * Represents details for items that include a file path.
 */
type Detail = {
  path: string;
};

/**
 * Creates a Renderer that adds a Nerd Font icon as a prefix based on file properties.
 *
 * This Renderer inspects each item's file path and determines an appropriate icon from
 * predefined JSON mappings based on pattern, basename, or file extension. The icon
 * is then prepended to the item's label, and existing decorations are adjusted to account
 * for the icon's length.
 *
 * @returns A Renderer that adds Nerd Font icons as labels for items based on file properties.
 */
export function nerdfont<T extends Detail>(): Renderer<T> {
  return defineRenderer<T>((_denops, { items }) => {
    items.forEach((item) => {
      const { path } = item.detail;

      // Determine the icon based on pattern, basename, or extension
      const icon = fromPattern(path) ??
        fromBasename(path) ??
        fromExtension(path) ??
        extensionJson["."];
      const prefix = `${icon}  `;
      const offset = getByteLength(prefix);

      // Prepend the icon to the label and adjust decoration positions
      item.label = `${prefix}${item.label}`;
      item.decorations = item.decorations.map((v) => ({
        ...v,
        column: offset + v.column,
      }));
    });
  });
}

/**
 * Retrieves an icon based on pattern matching for the file path.
 *
 * @param path - The file path to check against patterns.
 * @returns The matching icon, if found.
 */
function fromPattern(path: string): string | undefined {
  for (const [pattern, value] of Object.entries(patternJson)) {
    try {
      if (new RegExp(pattern).test(path)) {
        return value;
      }
    } catch {
      // Ignore invalid regex patterns
    }
  }
}

/**
 * Retrieves an icon based on the file basename.
 *
 * @param path - The file path from which to extract the basename.
 * @returns The matching icon, if found.
 */
function fromBasename(path: string): string | undefined {
  const base = basename(path).toLowerCase();
  return (basenameJson as Record<string, string>)[base];
}

/**
 * Retrieves an icon based on the file extension.
 *
 * @param path - The file path from which to extract the extension.
 * @returns The matching icon, if found.
 */
function fromExtension(path: string): string | undefined {
  const base = extname(path).toLowerCase().replace(/^\./, "");
  return (extensionJson as Record<string, string>)[base];
}
