import type { Denops } from "@denops/std";
import type { Action, InvokeParams } from "@vim-fall/core/action";

import type { Promish } from "./util/_typeutil.ts";
import { type DerivableArray, deriveArray } from "./util/derivable.ts";

/**
 * Defines an action.
 *
 * @param invoke - The function to invoke the action.
 * @returns The defined action.
 */
export function defineAction<T>(
  invoke: (
    denops: Denops,
    params: InvokeParams<T>,
    options: { signal?: AbortSignal },
  ) => Promish<void | true>,
): Action<T> {
  return {
    invoke,
  };
}

/**
 * Composes multiple actions.
 *
 * The actions are invoked sequentially in the order they are passed.
 *
 * @param actions - The actions to compose.
 * @returns The composed action.
 */
export function composeActions<
  T,
  A extends DerivableArray<[Action<T>, ...Action<T>[]]>,
>(...actions: A): Action<T> {
  return {
    invoke: async (denops, params, options) => {
      for (const action of deriveArray(actions)) {
        await action.invoke(denops, params, options);
      }
    },
  };
}

export type * from "@vim-fall/core/action";
