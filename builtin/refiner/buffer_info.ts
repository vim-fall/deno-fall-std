import * as fn from "@denops/std/function";
import type { IdItem } from "@vim-fall/core/item";
import { defineRefiner, type Refiner } from "../../refiner.ts";

type Detail = {
  bufnr: number;
};

export type BufferInfoRefinerOptions = {
  /**
   * Filter by buffer modification status.
   */
  modified?: boolean;

  /**
   * Filter by buffer listed status.
   */
  listed?: boolean;

  /**
   * Filter by buffer loaded status.
   */
  loaded?: boolean;

  /**
   * Filter by buffer visibility (visible in any window).
   */
  visible?: boolean;

  /**
   * Filter by file types.
   * If provided, only buffers with these filetypes will pass.
   */
  filetypes?: string[];

  /**
   * Filter by buffer types.
   * Common values: "", "help", "quickfix", "terminal", "prompt", "popup", "nofile", "nowrite", "acwrite"
   */
  buftypes?: string[];

  /**
   * Whether to include unnamed buffers.
   * @default true
   */
  includeUnnamed?: boolean;

  /**
   * Whether to include special buffers (help, quickfix, etc).
   * @default true
   */
  includeSpecial?: boolean;

  /**
   * Minimum line count for the buffer.
   */
  minLines?: number;

  /**
   * Maximum line count for the buffer.
   */
  maxLines?: number;
};

/**
 * Creates a Refiner that filters items based on buffer information.
 *
 * This Refiner can filter buffers based on various criteria such as
 * modification status, visibility, file type, and buffer properties.
 *
 * @param options - Options to customize buffer filtering.
 * @returns A Refiner that filters items based on buffer information.
 */
export function bufferInfo(
  options: Readonly<BufferInfoRefinerOptions> = {},
): Refiner<Detail> {
  const modified = options.modified;
  const listed = options.listed;
  const loaded = options.loaded;
  const visible = options.visible;
  const filetypes = options.filetypes;
  const buftypes = options.buftypes;
  const includeUnnamed = options.includeUnnamed ?? true;
  const includeSpecial = options.includeSpecial ?? true;
  const minLines = options.minLines;
  const maxLines = options.maxLines;

  return defineRefiner(async function* (denops, { items }) {
    // Convert async iterable to array first
    const itemsArray: IdItem<Detail>[] = [];
    for await (const item of items) {
      itemsArray.push(item);
    }

    // Get all buffer info at once for efficiency
    const allBufinfo = await fn.getbufinfo(denops);
    const bufInfoMap = new Map(
      allBufinfo.map((info) => [info.bufnr, info]),
    );

    // Process items and filter
    const results = await Promise.all(
      itemsArray.map(async (item) => {
        const { bufnr } = item.detail;
        const bufinfo = bufInfoMap.get(bufnr);

        if (!bufinfo) {
          return null;
        }

        // Check modification status
        if (modified !== undefined && !!bufinfo.changed !== modified) {
          return null;
        }

        // Check listed status
        if (listed !== undefined && !!bufinfo.listed !== listed) {
          return null;
        }

        // Check loaded status
        if (loaded !== undefined && !!bufinfo.loaded !== loaded) {
          return null;
        }

        // Check visibility
        if (visible !== undefined) {
          const isVisible = bufinfo.windows && bufinfo.windows.length > 0;
          if (visible !== isVisible) {
            return null;
          }
        }

        // Check unnamed buffers
        if (!includeUnnamed && !bufinfo.name) {
          return null;
        }

        // Check line count
        if (minLines !== undefined && bufinfo.linecount < minLines) {
          return null;
        }
        if (maxLines !== undefined && bufinfo.linecount > maxLines) {
          return null;
        }

        // Check filetype
        if (filetypes && filetypes.length > 0) {
          const filetype = await denops.eval(
            `getbufvar(${bufnr}, "&filetype")`,
          ) as string;
          if (!filetypes.includes(filetype)) {
            return null;
          }
        }

        // Check buftype
        if (buftypes && buftypes.length > 0) {
          const buftype = await denops.eval(
            `getbufvar(${bufnr}, "&buftype")`,
          ) as string;
          if (!buftypes.includes(buftype)) {
            return null;
          }
        }

        // Check special buffers
        if (!includeSpecial) {
          const buftype = await denops.eval(
            `getbufvar(${bufnr}, "&buftype")`,
          ) as string;
          if (buftype && buftype !== "") {
            return null;
          }

          // Also check for help buffers
          const filetype = await denops.eval(
            `getbufvar(${bufnr}, "&filetype")`,
          ) as string;
          if (filetype === "help") {
            return null;
          }
        }

        return item;
      }),
    );

    // Return only non-null items
    const filtered = results.filter((item): item is IdItem<Detail> =>
      item !== null
    );
    yield* filtered;
  });
}
