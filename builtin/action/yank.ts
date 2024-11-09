import { type Action, defineAction } from "../../action.ts";

/**
 * Creates an action that yanks (copies) the selected items to the clipboard or specified register.
 *
 * The items' values are concatenated with a newline separator and stored in the specified Vim register.
 *
 * @returns An action that yanks the values of selected items.
 */
export function yank<T>(): Action<T> {
  return defineAction(async (denops, { item, selectedItems }, { signal }) => {
    const items = selectedItems ?? [item];
    const value = items.filter((v) => !!v).map((item) => item.value).join("\n");

    signal?.throwIfAborted();

    await denops.cmd("call setreg(v:register, value)", { value });
  });
}

/**
 * Default yank action set, including the `yank` action.
 */
export const defaultYankActions: {
  yank: Action<unknown>;
} = {
  yank: yank(),
};
