import * as fn from "@denops/std/function";

import { defineSource, type Source } from "../../source.ts";

type Detail = {
  /**
   * Window ID
   */
  winid: number;

  /**
   * Window number
   */
  winnr: number;

  /**
   * Tab number
   */
  tabnr: number;

  /**
   * Buffer number in the window
   */
  bufnr: number;

  /**
   * Buffer name in the window
   */
  bufname: string;

  winType: string;
};

export type WindowOptions = {
  /**
   * Whether to include windows from all tab pages.
   * If false, only windows from the current tab page are included.
   * @default false
   */
  allTabs?: boolean;

  includeFlaoting?: boolean;
};

/**
 * Creates a Source that generates items from Vim windows.
 *
 * This Source retrieves window information from the current tab page or all tab pages
 * and generates items for each window with details about the window and its buffer.
 *
 * @param options - Options to customize window listing.
 * @returns A Source that generates items representing windows.
 */
export function window(
  { allTabs, includeFlaoting }: Readonly<WindowOptions> = {},
): Source<Detail> {
  return defineSource(async function* (denops, _params, { signal }) {
    const wininfos = await Promise.all(
      (await fn.getwininfo(denops)).map(async (w) => {
        const winType = await fn.win_gettype(denops, w.winid);
        signal?.throwIfAborted();
        return {
          ...w,
          winType,
        } as const;
      }),
    );
    signal?.throwIfAborted();

    // Filter windows based on allTabs option
    const currentTabnr = allTabs ? 0 : await fn.tabpagenr(denops);
    let filteredWininfos = wininfos;
    if (!allTabs) {
      filteredWininfos = wininfos.filter((w) => w.tabnr === currentTabnr);
    }
    if (!includeFlaoting) {
      filteredWininfos = filteredWininfos.filter((w) => w.winType !== "popup");
    }

    let id = 0;
    for (const wininfo of filteredWininfos) {
      const bufname = await fn.bufname(denops, wininfo.bufnr);
      yield {
        id: id++,
        value: bufname || `[No Name] (${wininfo.winnr})`,
        detail: {
          winid: wininfo.winid,
          winnr: wininfo.winnr,
          tabnr: wininfo.tabnr,
          bufnr: wininfo.bufnr,
          bufname,
          winType: wininfo.winType,
        },
      };
    }
  });
}
