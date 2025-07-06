import * as fn from "@denops/std/function";

import { defineSource, type Source } from "../../source.ts";

// Define all standard registers
const REGISTER_NAMES = [
  // Named registers
  '"', // unnamed register
  "-", // small delete register
  "*", // clipboard (selection)
  "+", // clipboard
  // Numbered registers
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  // Named registers a-z
  ..."abcdefghijklmnopqrstuvwxyz".split(""),
  // Read-only registers
  ".", // last inserted text
  "%", // current file name
  "#", // alternate file name
  ":", // last command-line
  "/", // last search pattern
  "=", // expression register
] as const;

// Special register descriptions
const REGISTER_DESCRIPTIONS: Record<string, string> = {
  '"': "unnamed",
  "-": "small delete",
  "*": "selection",
  "+": "clipboard",
  ".": "last inserted",
  "%": "current file",
  "#": "alternate file",
  ":": "last command",
  "/": "last search",
  "=": "expression",
} as const;

type Detail = {
  /**
   * Register name
   */
  name: string;

  /**
   * Register content
   */
  content: string;

  /**
   * Register type (linewise, characterwise, or blockwise)
   */
  regtype: string;
};

export type RegisterOptions = {
  /**
   * Whether to include empty registers.
   * @default false
   */
  includeEmpty?: boolean;

  /**
   * Maximum length of content to display in the value.
   * @default 80
   */
  maxLength?: number;
};

/**
 * Creates a Source that generates items from Vim registers.
 *
 * This Source retrieves all register contents and generates items
 * for each register, showing their type and content.
 *
 * @param options - Options to customize register listing.
 * @returns A Source that generates items representing registers.
 */
export function register(
  options: Readonly<RegisterOptions> = {},
): Source<Detail> {
  const includeEmpty = options.includeEmpty ?? false;
  const maxLength = options.maxLength ?? 80;

  return defineSource(async function* (denops, _params, { signal }) {
    signal?.throwIfAborted();

    const items = [];
    let index = 0;
    for (const reg of REGISTER_NAMES) {
      // Get register content and type
      const content = await fn.getreg(denops, reg) as string;
      const regtype = await fn.getregtype(denops, reg) as string;

      // Skip empty registers if not included
      if (!content && !includeEmpty) {
        index++;
        continue;
      }

      // Format content for display
      let displayContent = content || "(empty)";
      // Replace newlines with visible indicator
      displayContent = displayContent.replace(/\n/g, "↵");
      // Truncate if too long
      if (displayContent.length > maxLength) {
        displayContent = displayContent.substring(0, maxLength - 3) + "...";
      }

      // Format register type indicator
      let typeIndicator = "";
      if (regtype === "v") {
        typeIndicator = "[c]"; // characterwise
      } else if (regtype === "V") {
        typeIndicator = "[l]"; // linewise
      } else if (regtype.startsWith("\x16")) {
        typeIndicator = "[b]"; // blockwise
      }

      const desc = REGISTER_DESCRIPTIONS[reg]
        ? ` (${REGISTER_DESCRIPTIONS[reg]})`
        : "";

      items.push({
        id: index++,
        value: `"${reg}${desc} ${typeIndicator} ${displayContent}`,
        detail: {
          name: reg,
          content: content,
          regtype: regtype,
        },
      });
    }

    yield* items;
  });
}
