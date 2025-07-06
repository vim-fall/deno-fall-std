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

  /**
   * The indicator string for linked highlight groups.
   * @default " -> "
   */
  linkIndicator?: string;
};

/**
 * Represents parsed highlight information
 */
export type HighlightInfo = {
  name: string;
  cleared: boolean;
  linked: boolean;
  linkTarget?: string;
};

/**
 * Parse highlight command output for a single group
 */
export function parseHighlightOutput(
  name: string,
  output: string,
): HighlightInfo {
  const trimmed = output.trim();
  const cleared = trimmed.includes("xxx cleared");
  const linkMatch = trimmed.match(/xxx links to (\S+)/);
  const linked = !!linkMatch;
  const linkTarget = linkMatch?.[1];

  return {
    name,
    cleared,
    linked,
    linkTarget,
  };
}

/**
 * Parse highlight command output for all groups
 */
export function parseHighlightOutputAll(output: string): HighlightInfo[] {
  const lines = output.trim().split("\n");
  const result: HighlightInfo[] = [];

  for (const line of lines) {
    const match = line.match(/^(\S+)\s+xxx\s+(.*)$/);
    if (!match) continue;

    const [, name, rest] = match;
    const cleared = rest === "cleared";
    const linkMatch = rest.match(/links to (\S+)/);
    const linked = !!linkMatch;
    const linkTarget = linkMatch?.[1];

    result.push({
      name,
      cleared,
      linked,
      linkTarget,
    });
  }

  return result;
}

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
  const linkIndicator = options.linkIndicator ?? " -> ";

  return defineSource(async function* (denops, _params, { signal }) {
    // Execute highlight command once to get all groups
    const output = await fn.execute(denops, "highlight");
    signal?.throwIfAborted();

    // Parse all highlight groups at once
    const allHighlights = parseHighlightOutputAll(output);

    let index = 0;
    for (const info of allHighlights) {
      // Skip cleared groups if not included
      if (info.cleared && !includeCleared) {
        continue;
      }

      // Format the display value
      let value = info.name;
      if (info.linked && info.linkTarget) {
        value += `${linkIndicator}${info.linkTarget}`;
      } else if (info.cleared) {
        value += " (cleared)";
      }

      yield {
        id: index++,
        value,
        detail: {
          name: info.name,
          linked: info.linked,
          linkTarget: info.linkTarget,
          cleared: info.cleared,
        },
      };
    }
  });
}
