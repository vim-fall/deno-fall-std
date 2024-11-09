import type { IdItem } from "../../item.ts";
import type { Action } from "../../action.ts";
import { cmd } from "./cmd.ts";

type Detail = {
  bufname: string;
} | {
  path: string;
};

/**
 * Retrieves the appropriate attribute (either `bufname` or `path`) from the item's detail.
 *
 * @param item - The item containing either a `bufname` or a `path`.
 * @returns The `path` if present; otherwise, the `bufname`.
 */
function attrGetter({ detail }: IdItem<Detail>): string {
  if ("path" in detail) {
    return detail.path;
  } else {
    return detail.bufname;
  }
}

/**
 * Unloads the buffer without deleting it.
 */
export const bunload: Action<Detail> = cmd({
  attrGetter,
  immediate: true,
  template: "bunload {}",
  restriction: "buffer",
  fnameescape: true,
});

/**
 * Deletes the buffer, removing it from the buffer list.
 */
export const bdelete: Action<Detail> = cmd({
  attrGetter,
  immediate: true,
  template: "bdelete {}",
  restriction: "buffer",
  fnameescape: true,
});

/**
 * Wipes out the buffer, clearing it from memory.
 */
export const bwipeout: Action<Detail> = cmd({
  attrGetter,
  immediate: true,
  template: "bwipeout {}",
  restriction: "buffer",
  fnameescape: true,
});

/**
 * Opens the buffer in a new tab, writes any changes, and then closes the tab.
 */
export const write: Action<Detail> = cmd({
  attrGetter,
  immediate: true,
  template: "tabedit {} | write | tabclose",
  restriction: "buffer",
  fnameescape: true,
});

/**
 * A collection of default actions for buffer management.
 */
export const defaultBufferActions: {
  bunload: Action<Detail>;
  bdelete: Action<Detail>;
  bwipeout: Action<Detail>;
  write: Action<Detail>;
} = {
  bunload,
  bdelete,
  bwipeout,
  write,
};
