import { enumerate } from "@core/iterutil/enumerate";
import * as fn from "@denops/std/function";

import { defineSource, type Source } from "../../source.ts";

type Detail = {
  bufnr: number;
  line: number;
  column: number;
  quickfix: QuickfixItem;
};

/**
 * Provides a source for the current quickfix errors.
 *
 * This source reads the list of the current quickfix errors and yields them
 * with each error's detailed information as `Detail`.
 *
 * @returns A source that yields the current quickfix errors.
 */
export function quickfix(): Source<Detail> {
  return defineSource(async function* (denops, _params, { signal }) {
    const qflist = await fn.getqflist(denops) as unknown as QuickfixItem[];
    signal?.throwIfAborted();
    for (const [id, item] of enumerate(qflist)) {
      const length = (item.end_col ?? 0) - item.col;
      const decorations = length > 0 ? [{ column: item.col, length }] : [];
      yield {
        id,
        value: item.text,
        detail: {
          bufnr: item.bufnr,
          line: item.lnum,
          column: item.col,
          quickfix: item,
        },
        decorations,
      };
    }
  });
}

type QuickfixItem = {
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
