import { systemopen as systemopen_ } from "@lambdalisue/systemopen";

import { type Action, defineAction } from "../../action.ts";

type Detail = {
  path: string;
};

export function systemopen<T extends Detail>(): Action<T> {
  return defineAction(async (_denops, { item, selectedItems }, { signal }) => {
    const items = selectedItems ?? [item];
    for (const item of items.filter((v) => !!v)) {
      await systemopen_(item.detail.path);
      signal?.throwIfAborted();
    }
  });
}

export const defaultSystemopenActions: {
  systemopen: Action<Detail>;
} = {
  systemopen: systemopen(),
};
