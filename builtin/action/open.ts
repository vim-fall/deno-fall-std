import * as buffer from "@denops/std/buffer";
import * as fn from "@denops/std/function";

import { type Action, defineAction } from "../../action.ts";

type Detail = {
  path: string;
  line?: number;
  column?: number;
} | {
  bufname: string;
  line?: number;
  column?: number;
};

export type OpenOptions = {
  /**
   * Specifies if the command should be executed with `!`.
   */
  bang?: boolean;
  /**
   * Command modifiers to apply, such as `vertical` or `silent`.
   */
  mods?: string;
  /**
   * Additional command arguments.
   */
  cmdarg?: string;
  /**
   * The primary opener command (e.g., `edit`, `split`).
   */
  opener?: string;
  /**
   * The command to use when opening subsequent items (defaults to the `opener`).
   */
  splitter?: string;
};

/**
 * Creates an action that opens a file or buffer in a specified way.
 *
 * @param options - Configuration options for opening files or buffers.
 * @returns An action that opens the specified items.
 */
export function open(options: OpenOptions = {}): Action<Detail> {
  const bang = options.bang ?? false;
  const mods = options.mods ?? "";
  const cmdarg = options.cmdarg ?? "";
  const opener = options.opener ?? "edit";
  const splitter = options.splitter ?? opener;

  return defineAction<Detail>(
    async (denops, { item, selectedItems }, { signal }) => {
      const items = selectedItems ?? [item];
      let currentOpener = opener;

      for (const item of items.filter((v) => !!v)) {
        const expr = "bufname" in item.detail
          ? item.detail.bufname
          : item.detail.path;

        const info = await buffer.open(denops, expr, {
          bang,
          mods,
          cmdarg,
          opener: currentOpener,
        });
        signal?.throwIfAborted();

        currentOpener = splitter;

        if (item.detail.line || item.detail.column) {
          const line = item.detail.line ?? 1;
          const column = item.detail.column ?? 1;
          await fn.win_execute(
            denops,
            info.winid,
            `silent! normal! ${line}G${column}|zv`,
          );
        }
      }
    },
  );
}

/**
 * Default set of open actions for various opening methods.
 */
export const defaultOpenActions: {
  open: Action<Detail>;
  "open:split": Action<Detail>;
  "open:vsplit": Action<Detail>;
  "open:tabedit": Action<Detail>;
  "open:drop": Action<Detail>;
} = {
  open: open(),
  "open:split": open({ opener: "split" }),
  "open:vsplit": open({ opener: "vsplit" }),
  "open:tabedit": open({ opener: "tabedit" }),
  "open:drop": open({ opener: "drop" }),
};
