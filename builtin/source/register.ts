import * as fn from "@denops/std/function";
import { collect } from "@denops/std/batch";

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

    let index = 0;
    for (const reg of REGISTER_NAMES) {
      // Get register content and type using collect for better performance
      const [content, regtype] = await collect(denops, (denops) => [
        fn.getreg(denops, reg),
        fn.getregtype(denops, reg),
      ]);

      // Skip empty registers if not included
      if (!content && !includeEmpty) {
        index++;
        continue;
      }

      // Format content for display
      const contentStr = typeof content === "string" ? content : "";
      let displayContent = contentStr || "(empty)";
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

      yield {
        id: index++,
        value: `"${reg}${desc} ${typeIndicator} ${displayContent}`,
        detail: {
          name: reg,
          content: contentStr,
          regtype: regtype,
        },
      };
    }
  });
}
