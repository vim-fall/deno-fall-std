import type { IdItem } from "../../item.ts";
import type { Action } from "../../action.ts";
import { cmd } from "./cmd.ts";

type Detail = {
  helptag: string;
  lang?: string;
};

/**
 * Constructs the help tag with an optional language suffix.
 *
 * @param item - The item containing help details.
 * @returns The helptag string, with language suffix if available.
 */
function attrGetter({ detail }: IdItem<Detail>): string {
  return detail.lang ? `${detail.helptag}@${detail.lang}` : detail.helptag;
}

/**
 * Opens help documentation based on the helptag and optional language.
 */
export const help: Action<Detail> = cmd({
  attrGetter,
  immediate: true,
  template: "help {}",
});

/**
 * Default action for accessing help documentation.
 */
export const defaultHelpActions: {
  help: Action<Detail>;
} = {
  help,
};
