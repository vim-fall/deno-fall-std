import * as fn from "@denops/std/function";
import { collect } from "@denops/std/batch";

import { defineSource, type Source } from "../../source.ts";

type Detail = {
  /**
   * Tab page number (1-indexed)
   */
  tabnr: number;

  /**
   * Tab page variables
   */
  variables: Record<string, unknown>;

  /**
   * Windows in the tab page
   */
  windows: fn.WinInfo[];
};

export type TabpageOptions = {
  /**
   * Whether to include the tab label.
   * If true, uses the tab label if set, otherwise shows buffer names.
   * @default true
   */
  showLabel?: boolean;

  /**
   * The indicator string for the current tab.
   * @default "> "
   */
  indicator?: string;
};

/**
 * Creates a Source that generates items from Vim tab pages.
 *
 * This Source retrieves information about all tab pages and generates items
 * for each tab with details about windows and buffers in that tab.
 *
 * @param options - Options to customize tabpage listing.
 * @returns A Source that generates items representing tab pages.
 */
export function tabpage(
  options: Readonly<TabpageOptions> = {},
): Source<Detail> {
  const showLabel = options.showLabel ?? true;
  return defineSource(async function* (denops, _params, { signal }) {
    const [currentTabnr, lastTabnr, allWininfos] = await collect(
      denops,
      (denops) => [
        fn.tabpagenr(denops),
        fn.tabpagenr(denops, "$"),
        fn.getwininfo(denops),
      ],
    );
    signal?.throwIfAborted();

    const items = [];
    for (let tabnr = 1; tabnr <= lastTabnr; tabnr++) {
      // Get windows in this tab
      const windows = allWininfos.filter((w) => w.tabnr === tabnr);
      const windowCount = windows.length;

      // Get tab variables
      const variables = await fn.gettabvar(denops, tabnr, "") as Record<
        string,
        unknown
      >;

      let label: string;
      if (showLabel) {
        // Try to get tab label from 't:tabLabel' variable
        const customLabel = await fn.gettabvar(denops, tabnr, "tabLabel") as
          | string
          | null;
        if (customLabel) {
          label = customLabel;
        } else {
          // Create label from buffer names in the tab
          const bufferNames = [];
          for (const w of windows) {
            const name = await fn.bufname(denops, w.bufnr);
            bufferNames.push(
              name ? name.split("/").pop() || name : "[No Name]",
            );
          }
          label = bufferNames.join(", ");
        }
      } else {
        label = `Tab ${tabnr}`;
      }

      // Add current tab indicator
      const indicator = options.indicator ?? "> ";
      const prefix = tabnr === currentTabnr
        ? indicator
        : " ".repeat(indicator.length);
      const value = `${prefix}${tabnr}: ${label} (${windowCount} window${
        windowCount !== 1 ? "s" : ""
      })`;

      items.push({
        id: tabnr - 1,
        value,
        detail: {
          tabnr,
          variables,
          windows,
        },
      });
    }

    yield* items;
  });
}
