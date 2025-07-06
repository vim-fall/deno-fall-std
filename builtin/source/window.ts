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
};

export type WindowOptions = {
  /**
   * Whether to include windows from all tab pages.
   * If false, only windows from the current tab page are included.
   * @default false
   */
  allTabs?: boolean;
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
export function window(options: Readonly<WindowOptions> = {}): Source<Detail> {
  const allTabs = options.allTabs ?? false;
  return defineSource(async function* (denops, _params, { signal }) {
    const wininfos = await fn.getwininfo(denops);
    signal?.throwIfAborted();

    // Filter windows based on allTabs option
    const currentTabnr = allTabs ? 0 : await fn.tabpagenr(denops);
    const filteredWininfos = allTabs
      ? wininfos
      : wininfos.filter((w) => w.tabnr === currentTabnr);

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
          bufname: bufname,
        },
      };
    }
  });
}
