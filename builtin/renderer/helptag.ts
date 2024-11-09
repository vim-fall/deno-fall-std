import { defineRenderer, type Renderer } from "../../renderer.ts";

/**
 * Creates a Renderer for helptags, adding language suffixes as labels and decorations.
 *
 * This Renderer modifies each item's label by appending its language, if available.
 * It also applies syntax highlighting to the language suffix for better visualization.
 *
 * @returns A Renderer that formats helptags with optional language suffixes.
 */
export function helptag<
  T extends { helptag: string; lang?: string },
>(): Renderer<T> {
  return defineRenderer<T>(async (_denops, { items }, { signal }) => {
    for await (const item of items) {
      signal?.throwIfAborted();
      // If a language is specified, update the label and add decoration
      if (item.detail.lang) {
        item.label = `${item.value}@${item.detail.lang}`;
        item.decorations = [
          {
            column: item.value.length + 1,
            length: item.detail.lang.length + 1,
            highlight: "Comment",
          },
        ];
      }
    }
  });
}
