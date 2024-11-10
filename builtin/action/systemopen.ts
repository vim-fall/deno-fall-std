import { systemopen as systemopen_ } from "@lambdalisue/systemopen";
import { type Action, defineAction } from "../../action.ts";

type Detail = {
  path: string;
};

/**
 * Creates an action that opens a specified path using the system's default application.
 *
 * This action leverages the `systemopen` utility, which uses the default application
 * on the user's operating system to open files or directories.
 *
 * @returns An action that opens each selected item's path.
 */
export function systemopen(): Action<Detail> {
  return defineAction<Detail>(
    async (_denops, { item, selectedItems }, { signal }) => {
      const items = selectedItems ?? [item];

      for (const item of items.filter((v) => !!v)) {
        await systemopen_(item.detail.path);
        signal?.throwIfAborted();
      }
    },
  );
}

/**
 * Default systemopen action set, including the `systemopen` action.
 */
export const defaultSystemopenActions: {
  systemopen: Action<Detail>;
} = {
  systemopen: systemopen(),
};
