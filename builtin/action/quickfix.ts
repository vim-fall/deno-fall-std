import * as fn from "@denops/std/function";
import { type Action, defineAction } from "../../action.ts";

type What = {
  context?: unknown;
  id?: number;
  idx?: number | string;
  nr?: number;
  title?: string;
};

type Options = {
  /**
   * Specifies additional parameters for the quickfix list, such as `id`, `idx`, `nr`, etc.
   */
  what?: What;
  /**
   * Action type for modifying the quickfix list:
   * - "a": Append to the list
   * - "r": Replace the list
   * - "f": Refill the list
   * - " ": Set the list
   */
  action?: "a" | "r" | "f" | " ";
  /**
   * Command to execute after setting the quickfix list.
   */
  after?: string;
};

type Detail = {
  path: string;
  line?: number;
  column?: number;
  length?: number;
  context?: string;
} | {
  bufname: string;
  line?: number;
  column?: number;
  length?: number;
  context?: string;
};

/**
 * Creates an action that populates the quickfix list with specified items.
 *
 * @param options - Configuration options for setting the quickfix list.
 * @returns An action that sets the quickfix list and optionally opens it.
 */
export function quickfix<T extends Detail>(
  options: Options = {},
): Action<T> {
  const what = options.what ?? {};
  const action = options.action ?? " ";
  const after = options.after ?? "copen";

  return defineAction<T>(
    async (denops, { selectedItems, filteredItems }, { signal }) => {
      const source = selectedItems ?? filteredItems;

      const items = source.map((item) => {
        const filename = "bufname" in item.detail
          ? item.detail.bufname
          : item.detail.path;
        return {
          filename,
          lnum: item.detail.line,
          col: item.detail.column,
          end_col: item.detail.column && item.detail.length
            ? item.detail.column + item.detail.length
            : undefined,
          text: item.detail.context,
        };
      });

      signal?.throwIfAborted();

      await fn.setqflist(denops, [], action, {
        ...what,
        items,
      });

      if (after) {
        signal?.throwIfAborted();
        await denops.cmd(after);
      }
    },
  );
}

/**
 * Default action for managing the quickfix list.
 */
export const defaultQuickfixActions: {
  quickfix: Action<Detail>;
} = {
  quickfix: quickfix(),
};
