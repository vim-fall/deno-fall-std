import { type Action, defineAction } from "../../action.ts";

/**
 * Creates an action that logs the item to the console.
 *
 * This action serializes the item to a JSON string with indentation and logs it.
 *
 * @returns An action that logs the item.
 */
export function echo(): Action {
  return defineAction((_denops, { item, selectedItems }, _options) => {
    console.info(Deno.inspect(selectedItems ?? item));
  });
}

/**
 * Default action for echoing items to the console.
 */
export const defaultEchoActions: {
  echo: Action;
} = {
  echo: echo(),
};
