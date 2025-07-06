import * as fn from "@denops/std/function";
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
    // Get all buffer info at once for efficiency
    const allBufinfo = await fn.getbufinfo(denops);
    const bufInfoMap = new Map(
      allBufinfo.map((info) => [info.bufnr, info]),
    );

    // Process items sequentially to avoid Promise.all
    for await (const item of items) {
      const { bufnr } = item.detail;
      const bufinfo = bufInfoMap.get(bufnr);

      if (!bufinfo) {
        continue;
      }

      // Check modification status
      if (modified !== undefined && !!bufinfo.changed !== modified) {
        continue;
      }

      // Check listed status
      if (listed !== undefined && !!bufinfo.listed !== listed) {
        continue;
      }

      // Check loaded status
      if (loaded !== undefined && !!bufinfo.loaded !== loaded) {
        continue;
      }

      // Check visibility
      if (visible !== undefined) {
        const isVisible = bufinfo.windows && bufinfo.windows.length > 0;
        if (visible !== isVisible) {
          continue;
        }
      }

      // Check unnamed buffers
      if (!includeUnnamed && !bufinfo.name) {
        continue;
      }

      // Check line count
      if (minLines !== undefined && bufinfo.linecount < minLines) {
        continue;
      }
      if (maxLines !== undefined && bufinfo.linecount > maxLines) {
        continue;
      }

      // Check filetype
      if (filetypes && filetypes.length > 0) {
        const filetype = await fn.getbufvar(
          denops,
          bufnr,
          "&filetype",
        ) as string;
        if (!filetypes.includes(filetype)) {
          continue;
        }
      }

      // Check buftype
      if (buftypes && buftypes.length > 0) {
        const buftype = await fn.getbufvar(denops, bufnr, "&buftype") as string;
        if (!buftypes.includes(buftype)) {
          continue;
        }
      }

      // Check special buffers
      if (!includeSpecial) {
        const buftype = await fn.getbufvar(denops, bufnr, "&buftype") as string;
        if (buftype && buftype !== "") {
          continue;
        }

        // Also check for help buffers
        const filetype = await fn.getbufvar(
          denops,
          bufnr,
          "&filetype",
        ) as string;
        if (filetype === "help") {
          continue;
        }
      }

      yield item;
    }
  });
}
