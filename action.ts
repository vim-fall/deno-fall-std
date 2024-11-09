import type { Denops } from "@denops/std";
import type { Action, InvokeParams } from "@vim-fall/core/action";

import type { Promish } from "./util/_typeutil.ts";

/**
 * Define an action.
 *
 * @param invoke The function to invoke the action.
 * @returns The action.
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

export type * from "@vim-fall/core/action";
