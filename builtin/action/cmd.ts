import type { Denops } from "@denops/std";
import * as fn from "@denops/std/function";
import { input } from "@denops/std/helper/input";
import { dirname } from "@std/path/dirname";

import type { IdItem } from "../../item.ts";
import { type Action, defineAction } from "../../action.ts";

type Restriction = "file" | "directory" | "directory-or-parent" | "buffer";

type Options<T> = {
  /**
   * Function to retrieve the attribute from an item. Defaults to `item.value`.
   */
  attrGetter?: (item: IdItem<T>) => string | undefined;
  /**
   * Executes the command immediately without prompting.
   */
  immediate?: boolean;
  /**
   * Template for the command, with `{}` as a placeholder for the attribute.
   */
  template?: string;
  /**
   * Restriction on the type of items to process (e.g., only files or directories).
   */
  restriction?: Restriction;
  /**
   * Escapes the filename if true.
   */
  fnameescape?: boolean;
  /**
   * Escapes the value for shell execution if true.
   */
  shellescape?: boolean;
};

/**
 * Creates an action that executes a command based on specified options.
 *
 * @param options - Configuration options for the command execution.
 * @returns An action that executes the command.
 */
export function cmd<T>(options: Options<T> = {}): Action<T> {
  const attrGetter = options.attrGetter ?? ((item) => item.value);
  const immediate = options.immediate ?? false;
  const template = options.template ?? "{}";
  const restriction = options.restriction;
  const fnameescape = options.fnameescape ?? false;
  const shellescape = options.shellescape ?? false;

  return defineAction<T>(
    async (denops, { item, selectedItems }, { signal }) => {
      const items = selectedItems ?? [item];
      for (const item of items.filter((v) => !!v)) {
        signal?.throwIfAborted();
        let value = attrGetter(item);
        if (value == undefined) continue;

        if (restriction) {
          value = await applyRestriction(denops, value, restriction);
          if (value == undefined) continue;
        }

        if (fnameescape) {
          value = await fn.fnameescape(denops, value);
        }
        if (shellescape) {
          value = await fn.shellescape(denops, value);
        }

        const cmd = template.replaceAll("{}", value);
        try {
          await execute(denops, cmd, immediate);
        } catch (err) {
          console.warn(`[fall] Failed to execute '${cmd}':`, err);
        }
      }
    },
  );
}

/**
 * Applies a restriction to an item, ensuring it meets the specified criteria.
 *
 * @param denops - The Denops instance.
 * @param value - The item to check.
 * @param restriction - The restriction type to enforce.
 * @returns The original or modified value if it meets the restriction, otherwise `undefined`.
 */
async function applyRestriction(
  denops: Denops,
  value: string,
  restriction: Restriction,
): Promise<string | undefined> {
  switch (restriction) {
    case "file":
    case "directory":
    case "directory-or-parent": {
      try {
        const stat = await Deno.stat(value);
        switch (restriction) {
          case "file":
            if (stat.isFile) return value;
            break;
          case "directory":
            if (stat.isDirectory) return value;
            break;
          case "directory-or-parent":
            if (!stat.isDirectory) value = dirname(value);
            return value;
        }
      } catch (err) {
        if (!(err instanceof Deno.errors.NotFound)) throw err;
      }
      return;
    }
    case "buffer": {
      if (await fn.bufloaded(denops, value)) {
        return value;
      }
      return;
    }
  }
}

/**
 * Executes a command in Denops. If immediate execution is disabled, prompts for confirmation.
 *
 * @param denops - The Denops instance.
 * @param cmd - The command to execute.
 * @param immediate - Whether to execute the command immediately.
 */
async function execute(
  denops: Denops,
  cmd: string,
  immediate: boolean,
): Promise<void> {
  const command = immediate ? cmd : await input(denops, {
    prompt: ":",
    text: cmd,
    completion: "command",
  });
  if (command == null) {
    // Command was cancelled
    return;
  }
  await denops.cmd(command);
}

/**
 * Default command actions.
 */
export const defaultCmdActions: {
  cmd: Action<unknown>;
} = {
  cmd: cmd(),
};
