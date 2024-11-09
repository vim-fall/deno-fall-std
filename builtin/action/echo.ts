import { type Action, defineAction } from "../../action.ts";

/**
 * Creates an action that logs the item to the console.
 *
 * This action serializes the item to a JSON string with indentation and logs it.
 *
 * @returns An action that logs the item.
 */
export function echo<T>(): Action<T> {
  return defineAction((_denops, { item }, _options) => {
    console.log(JSON.stringify(item, null, 2));
  });
}

/**
 * Default action for echoing items to the console.
 */
export const defaultEchoActions: {
  echo: Action<unknown>;
} = {
  echo: echo(),
};
