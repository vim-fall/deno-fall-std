import { enumerate } from "@core/iterutil/enumerate";
import * as fn from "@denops/std/function";

import { defineSource, type Source } from "../../source.ts";

type Detail = {
  /**
   * Window ID
   */
  winid: number;

  /**
   * Buffer number
   */
  bufnr: number;

  /**
   * Line number
   */
  line: number;

  /**
   * Column number
   */
  column: number;

  /**
   * Location list item
   */
  loclist: LoclistItem;
};

export type LoclistOptions = {
  /**
   * Whether to include location lists from all windows.
   * If false, only the current window's location list is included.
   * @default false
   */
  allWindows?: boolean;
};

/**
 * Provides a source for location list items.
 *
 * This source reads the location list from the current window or all windows
 * and yields each item with detailed information.
 *
 * @param options - Options to customize location list retrieval.
 * @returns A source that yields location list items.
 */
export function loclist(
  options: Readonly<LoclistOptions> = {},
): Source<Detail> {
  const allWindows = options.allWindows ?? false;
  return defineSource(async function* (denops, _params, { signal }) {
    let winids: number[];

    if (allWindows) {
      // Get all window IDs
      const wininfos = await fn.getwininfo(denops);
      winids = wininfos.map((w) => w.winid);
    } else {
      // Get current window ID
      const currentWinid = await fn.win_getid(denops);
      winids = [currentWinid];
    }

    signal?.throwIfAborted();

    let globalId = 0;
    for (const winid of winids) {
      // Get location list for this window
      const loclistItems = await fn.getloclist(
        denops,
        winid,
      ) as unknown as LoclistItem[];

      if (loclistItems.length === 0) {
        continue;
      }

      // Get window number for display
      const winnr = await fn.win_id2win(denops, winid);
      const winPrefix = allWindows ? `[Win ${winnr}] ` : "";

      for (const [_index, item] of enumerate(loclistItems)) {
        const length = (item.end_col ?? 0) - item.col;
        const decorations = length > 0 ? [{ column: item.col, length }] : [];

        yield {
          id: globalId++,
          value: `${winPrefix}${item.text}`,
          detail: {
            winid,
            bufnr: item.bufnr,
            line: item.lnum,
            column: item.col,
            loclist: item,
          },
          decorations,
        };
      }
    }
  });
}

type LoclistItem = {
  bufnr: number;
  module: string;
  lnum: number;
  end_lnum?: number;
  col: number;
  end_col?: number;
  vcol: boolean;
  nr: number;
  pattern: string;
  text: string;
  type: string;
  valid: boolean;
  user_data: unknown;
};
