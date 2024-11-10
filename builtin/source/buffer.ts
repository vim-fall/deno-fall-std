import { unreachable } from "@core/errorutil/unreachable";
import * as fn from "@denops/std/function";

import { defineSource, type Source } from "../../source.ts";

type Detail = {
  /**
   * Buffer number
   */
  bufnr: number;

  /**
   * Buffer name
   */
  bufname: string;

  /**
   * Buffer information including status flags and attributes.
   */
  bufinfo: fn.BufInfo;
};

export type BufferOptions = {
  /**
   * The mode to filter the buffer.
   * - `buflisted`: Only includes buffers listed in the buffer list.
   * - `bufloaded`: Only includes loaded buffers.
   * - `bufmodified`: Only includes buffers with unsaved changes.
   */
  filter?: Filter;
};

type Filter = "buflisted" | "bufloaded" | "bufmodified";

/**
 * Creates a Source that generates items from the current buffers based on filter criteria.
 *
 * This Source retrieves buffer information and applies the specified filter to include
 * only the relevant buffers (listed, loaded, or modified).
 *
 * @param options - Options to customize buffer filtering.
 * @returns A Source that generates items representing filtered buffers.
 */
export function buffer(options: Readonly<BufferOptions> = {}): Source<Detail> {
  const filter = options.filter;
  return defineSource(async function* (denops, _params, { signal }) {
    const bufinfo = await fn.getbufinfo(denops);
    signal?.throwIfAborted();

    // Filter and map buffers based on the provided filter option
    const items = bufinfo
      .filter((v) => v.name !== "")
      .filter((v) => {
        switch (filter) {
          case "buflisted":
            return v.listed;
          case "bufloaded":
            return v.loaded;
          case "bufmodified":
            return v.changed;
          case undefined:
            return true;
          default:
            unreachable(filter);
        }
      })
      .map((v, i) => ({
        id: i,
        value: v.name,
        detail: {
          bufnr: v.bufnr,
          bufname: v.name,
          bufinfo: v,
        },
      }));

    yield* items;
  });
}
