import { type Action, defineAction } from "../../action.ts";

/**
 * Creates a no-operation (noop) action.
 *
 * This action performs no operation when invoked and is useful as a placeholder.
 *
 * @returns An action that does nothing.
 */
export function noop(): Action {
  return defineAction(() => {});
}

/**
 * Default action set containing the noop action.
 */
export const defaultNoopActions: {
  noop: Action;
} = {
  noop: noop(),
};
