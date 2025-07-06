import * as fn from "@denops/std/function";
import { ensure, is } from "@core/unknownutil";

import { defineSource, type Source } from "../../source.ts";

// Mark categories
const LOCAL_MARKS = "abcdefghijklmnopqrstuvwxyz".split("");
const GLOBAL_MARKS = [
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
  ..."0123456789".split(""),
];
const SPECIAL_MARKS = [
  ".", // last change
  "^", // last insert
  "<", // start of last visual selection
  ">", // end of last visual selection
  "'", // previous context mark
  '"', // position when last exiting buffer
  "[", // start of last change/yank
  "]", // end of last change/yank
];

// Special mark descriptions
const MARK_DESCRIPTIONS: Record<string, string> = {
  ".": "last change",
  "^": "last insert",
  "<": "visual start",
  ">": "visual end",
  "'": "previous context",
  '"': "last exit",
  "[": "change/yank start",
  "]": "change/yank end",
};

type Detail = {
  /**
   * Mark name
   */
  mark: string;

  /**
   * Line number
   */
  line: number;

  /**
   * Column number
   */
  column: number;

  /**
   * Buffer number (0 for global marks)
   */
  bufnr: number;

  /**
   * File path (for global marks)
   */
  file: string;
};

export type MarkOptions = {
  /**
   * Whether to include global marks (A-Z, 0-9).
   * @default true
   */
  includeGlobal?: boolean;

  /**
   * Whether to include local marks (a-z).
   * @default true
   */
  includeLocal?: boolean;

  /**
   * Whether to include special marks (. ^ < > etc).
   * @default true
   */
  includeSpecial?: boolean;
};

/**
 * Creates a Source that generates items from Vim marks.
 *
 * This Source retrieves all marks and generates items for each one,
 * showing their location and type (local, global, or special).
 *
 * @param options - Options to customize mark listing.
 * @returns A Source that generates items representing marks.
 */
export function mark(options: Readonly<MarkOptions> = {}): Source<Detail> {
  const includeGlobal = options.includeGlobal ?? true;
  const includeLocal = options.includeLocal ?? true;
  const includeSpecial = options.includeSpecial ?? true;

  return defineSource(async function* (denops, _params, { signal }) {
    const marks: string[] = [];

    // Add marks based on options
    if (includeLocal) {
      marks.push(...LOCAL_MARKS);
    }
    if (includeGlobal) {
      marks.push(...GLOBAL_MARKS);
    }
    if (includeSpecial) {
      marks.push(...SPECIAL_MARKS);
    }

    signal?.throwIfAborted();

    // Get all marks information if looking for global marks
    // For now, we'll handle global marks the same as local marks
    // since parsing the 'marks' command output would require a complex parser

    let index = 0;
    for (const markName of marks) {
      // Get mark position
      const pos = await fn.getpos(denops, `'${markName}`);
      const [bufnr, line, col] = pos;

      // Skip marks that don't exist (line 0)
      if (line === 0) {
        index++;
        continue;
      }

      // Get file path for the mark
      let file = "";
      let displayName = "";
      if (bufnr === 0) {
        // Global mark - try to get filename from expand
        try {
          file = ensure(await fn.expand(denops, `'${markName}:p`), is.String);
          displayName = file.split("/").pop() || file || "[Unknown]";
        } catch {
          displayName = "[Unknown]";
        }
      } else {
        // Local mark - get buffer name
        displayName = await fn.bufname(denops, bufnr) || "[No Name]";
        displayName = displayName.split("/").pop() || displayName;
      }

      // Get mark type
      let markType = "";
      if (markName >= "a" && markName <= "z") {
        markType = "[local]";
      } else if (markName >= "A" && markName <= "Z") {
        markType = "[global]";
      } else if (markName >= "0" && markName <= "9") {
        markType = "[numbered]";
      } else {
        markType = "[special]";
      }

      const desc = MARK_DESCRIPTIONS[markName]
        ? ` (${MARK_DESCRIPTIONS[markName]})`
        : "";

      yield {
        id: index++,
        value: `'${markName}${desc} ${markType} ${displayName}:${line}:${col}`,
        detail: {
          mark: markName,
          line,
          column: col,
          bufnr,
          file,
        },
      };
    }
  });
}
