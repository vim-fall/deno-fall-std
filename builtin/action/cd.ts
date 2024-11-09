import type { IdItem } from "../../item.ts";
import type { Action } from "../../action.ts";
import { cmd } from "./cmd.ts";

type Detail = {
  path: string;
} | {
  bufname: string;
};

/**
 * Retrieves the appropriate attribute (`path` or `bufname`) from the item's detail.
 *
 * @param item - The item containing either a `path` or a `bufname`.
 * @returns The `path` if present; otherwise, the `bufname`.
 */
function attrGetter({ detail }: IdItem<Detail>): string {
  return "path" in detail ? detail.path : detail.bufname;
}

/**
 * Changes the current working directory globally to the specified path.
 */
export const cd: Action<Detail> = cmd({
  attrGetter,
  immediate: true,
  template: "cd {}",
  restriction: "directory-or-parent",
  fnameescape: true,
});

/**
 * Changes the current working directory locally for the window to the specified path.
 */
export const lcd: Action<Detail> = cmd({
  attrGetter,
  immediate: true,
  template: "lcd {}",
  restriction: "directory-or-parent",
  fnameescape: true,
});

/**
 * Changes the current working directory locally for the tab to the specified path.
 */
export const tcd: Action<Detail> = cmd({
  attrGetter,
  immediate: true,
  template: "tcd {}",
  restriction: "directory-or-parent",
  fnameescape: true,
});

/**
 * A collection of default actions for changing directories.
 */
export const defaultCdActions: {
  cd: Action<Detail>;
  lcd: Action<Detail>;
  tcd: Action<Detail>;
} = {
  cd,
  lcd,
  tcd,
};
