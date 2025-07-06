import * as fn from "@denops/std/function";

import { defineSource, type Source } from "../../source.ts";

type Detail = {
  /**
   * Colorscheme name
   */
  name: string;

  /**
   * Whether this is the current colorscheme
   */
  current: boolean;
};

export type ColorschemeOptions = {
  /**
   * Whether to mark the current colorscheme.
   * @default true
   */
  markCurrent?: boolean;

  /**
   * The indicator string for the current colorscheme.
   * @default "> "
   */
  indicator?: string;
};

/**
 * Creates a Source that generates items from available Vim colorschemes.
 *
 * This Source retrieves all available colorschemes and generates items
 * for each one, optionally marking the currently active colorscheme.
 *
 * @param options - Options to customize colorscheme listing.
 * @returns A Source that generates items representing colorschemes.
 */
export function colorscheme(
  options: Readonly<ColorschemeOptions> = {},
): Source<Detail> {
  const markCurrent = options.markCurrent ?? true;
  return defineSource(async function* (denops, _params, { signal }) {
    // Get list of all colorschemes
    const colorschemes = await fn.getcompletion(
      denops,
      "",
      "color",
    ) as string[];
    signal?.throwIfAborted();

    // Get current colorscheme if needed
    let currentColorscheme = "";
    if (markCurrent) {
      const colors = await fn.execute(denops, "colorscheme") as string;
      // Extract colorscheme name from output (removes whitespace and newlines)
      currentColorscheme = colors.trim();
    }

    const items = colorschemes.map((name, index) => {
      const isCurrent = markCurrent && name === currentColorscheme;
      const indicator = options.indicator ?? "> ";
      const prefix = isCurrent ? indicator : " ".repeat(indicator.length);
      const suffix = isCurrent ? " (current)" : "";

      return {
        id: index,
        value: `${prefix}${name}${suffix}`,
        detail: {
          name,
          current: isCurrent,
        },
      };
    });

    yield* items;
  });
}
