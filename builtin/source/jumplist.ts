import * as fn from "@denops/std/function";

import { defineSource, type Source } from "../../source.ts";

type Detail = {
  /**
   * Jump number (position in jumplist)
   */
  jump: number;

  /**
   * Line number
   */
  line: number;

  /**
   * Column number
   */
  column: number;

  /**
   * Buffer number
   */
  bufnr: number;

  /**
   * Buffer name/path
   */
  bufname: string;

  /**
   * File content at the jump location
   */
  text: string;
};

/**
 * Creates a Source that generates items from Vim's jumplist.
 *
 * This Source retrieves the jumplist entries and generates items
 * for each jump location with file and position information.
 *
 * @returns A Source that generates items representing jump locations.
 */
/**
 * Parses jump list entry to create formatted item.
 */
function formatJumpItem(
  jump: JumplistItem,
  index: number,
  currentPos: number,
  bufname: string,
  text: string,
): { id: number; value: string; detail: Detail } {
  const jumpNum = index - currentPos;
  const jumpIndicator = jumpNum === 0
    ? ">"
    : jumpNum < 0
    ? jumpNum.toString()
    : `+${jumpNum}`;
  const displayName = bufname || "[No Name]";
  const shortName = displayName.split("/").pop() || displayName;

  return {
    id: index,
    value: `${
      jumpIndicator.padStart(4)
    } ${shortName}:${jump.lnum}:${jump.col} ${text.trim()}`,
    detail: {
      jump: jumpNum,
      line: jump.lnum,
      column: jump.col,
      bufnr: jump.bufnr,
      bufname: bufname,
      text: text,
    },
  };
}

export function jumplist(): Source<Detail> {
  return defineSource(async function* (denops, _params, { signal }) {
    // Get jumplist
    const jumplistData = await fn.getjumplist(denops) as [
      JumplistItem[],
      number,
    ];
    const [jumplist, currentPos] = jumplistData;
    signal?.throwIfAborted();

    // Process each jump entry
    let index = 0;
    for (const jump of jumplist) {
      // Get buffer name
      const bufname = jump.bufnr > 0
        ? await fn.bufname(denops, jump.bufnr)
        : "";

      // Try to get the line content if buffer is loaded
      let text = "";
      if (jump.bufnr > 0 && await fn.bufloaded(denops, jump.bufnr)) {
        const lines = await fn.getbufline(
          denops,
          jump.bufnr,
          jump.lnum,
          jump.lnum,
        );
        text = lines[0] || "";
      }

      yield formatJumpItem(jump, index, currentPos, bufname, text);
      index++;
    }
  });
}

type JumplistItem = {
  bufnr: number;
  col: number;
  coladd: number;
  filename: string;
  lnum: number;
};
