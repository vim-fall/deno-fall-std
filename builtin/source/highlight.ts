import * as fn from "@denops/std/function";

import { defineSource, type Source } from "../../source.ts";

type Detail = {
  /**
   * Highlight group name
   */
  name: string;

  /**
   * Whether the highlight group is linked
   */
  linked: boolean;

  /**
   * The target group if linked
   */
  linkTarget?: string;

  /**
   * Whether the highlight group is cleared
   */
  cleared: boolean;
};

export type HighlightOptions = {
  /**
   * Whether to include cleared highlight groups.
   * @default false
   */
  includeCleared?: boolean;
};

/**
 * Creates a Source that generates items from Vim highlight groups.
 *
 * This Source retrieves all highlight groups and generates items
 * for each one, showing their definition status and link targets.
 *
 * @param options - Options to customize highlight group listing.
 * @returns A Source that generates items representing highlight groups.
 */
export function highlight(
  options: Readonly<HighlightOptions> = {},
): Source<Detail> {
  const includeCleared = options.includeCleared ?? false;
  return defineSource(async function* (denops, _params, { signal }) {
    // Get list of all highlight groups
    const highlightGroups = await fn.getcompletion(
      denops,
      "",
      "highlight",
    ) as string[];
    signal?.throwIfAborted();

    // Get detailed information about each highlight group
    const items = [];
    let index = 0;
    for (const name of highlightGroups) {
      // Execute highlight command to get details
      const output = await fn.execute(
        denops,
        `highlight ${name}`,
      ) as string;

      // Parse the output to determine status
      const trimmed = output.trim();
      const cleared = trimmed.includes("xxx cleared");
      const linkMatch = trimmed.match(/xxx links to (\S+)/);
      const linked = !!linkMatch;
      const linkTarget = linkMatch?.[1];

      // Skip cleared groups if not included
      if (cleared && !includeCleared) {
        continue;
      }

      // Format the display value
      let value = name;
      if (linked && linkTarget) {
        value += ` → ${linkTarget}`;
      } else if (cleared) {
        value += " (cleared)";
      }

      items.push({
        id: index++,
        value,
        detail: {
          name,
          linked,
          linkTarget,
          cleared,
        },
      });
    }

    yield* items;
  });
}
