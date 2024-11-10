import * as fn from "@denops/std/function";

import { defineSource, type Source } from "../../source.ts";

type Detail = {
  history: History;
};

/**
 * Options for the history source.
 * - `mode`: Specifies which history mode to retrieve.
 */
export type HistoryOptions = {
  mode?: Mode;
};

/**
 * Structure of a single history entry.
 */
type History = {
  /**
   * The line content of the history entry.
   */
  line: string;

  /**
   * The mode/type of the history entry.
   */
  mode: Mode;

  /**
   * The index position within the history entries.
   */
  index: number;

  /**
   * The latest history number.
   */
  histnr: number;
};

/**
 * Mode of the history to retrieve.
 * - `cmd`: Command history
 * - `search`: Search history
 * - `expr`: Expression history
 * - `input`: Input history
 * - `debug`: Debug history
 */
type Mode = "cmd" | "search" | "expr" | "input" | "debug";

/**
 * Detail information attached to each history item.
 */

/**
 * Source to retrieve history items from the specified mode.
 *
 * This source collects history entries of a specified mode (e.g., "cmd" for command history)
 * and provides each entry with its line content and relevant metadata.
 *
 * @param options - The options to configure the history retrieval, with `mode` specifying the history type.
 * @returns A Source that yields history entries as items.
 */
export function history(options: HistoryOptions = {}): Source<Detail> {
  const { mode = "cmd" } = options;
  return defineSource(async function* (denops, _params, { signal }) {
    const histnr = await fn.histnr(denops, mode);
    signal?.throwIfAborted();
    let id = 0;

    for (let index = histnr; index > 0; index--) {
      const line = await fn.histget(denops, mode, index);
      if (line) {
        yield {
          id: id++,
          value: line,
          detail: {
            history: {
              line,
              mode,
              index,
              histnr,
            },
          },
        };
      }
    }
  });
}
