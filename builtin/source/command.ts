import * as fn from "@denops/std/function";

import { defineSource, type Source } from "../../source.ts";

type Detail = {
  /**
   * Command name
   */
  name: string;

  /**
   * Command definition/replacement text
   */
  definition: string;

  /**
   * Command attributes (bang, range, etc.)
   */
  attributes: string;

  /**
   * Whether the command is buffer-local
   */
  bufferLocal: boolean;

  /**
   * Number of arguments the command accepts
   */
  nargs: string;

  /**
   * Completion type
   */
  complete?: string;
};

export type CommandOptions = {
  /**
   * Whether to include buffer-local commands.
   * @default true
   */
  includeBufferLocal?: boolean;

  /**
   * Whether to include builtin commands.
   * @default false
   */
  includeBuiltin?: boolean;
};

/**
 * Creates a Source that generates items from user-defined Vim commands.
 *
 * This Source retrieves all user-defined commands and generates items
 * for each one, showing their definition and attributes.
 *
 * @param options - Options to customize command listing.
 * @returns A Source that generates items representing commands.
 */
export function command(
  options: Readonly<CommandOptions> = {},
): Source<Detail> {
  const includeBufferLocal = options.includeBufferLocal ?? true;
  const includeBuiltin = options.includeBuiltin ?? false;

  return defineSource(async function* (denops, _params, { signal }) {
    // Get user commands
    const commandOutput = await fn.execute(denops, "command");
    signal?.throwIfAborted();

    // Parse command output
    const lines = commandOutput.trim().split("\n").filter((line) =>
      line.trim()
    );
    const items: Array<{
      id: number;
      value: string;
      detail: Detail;
    }> = [];

    let id = 0;
    for (const line of lines) {
      // Skip header line
      if (line.includes("Name") && line.includes("Args")) {
        continue;
      }

      // Parse command line
      // Format: "    Name              Args       Address   Complete  Definition"
      const match = line.match(
        /^\s*(\S+)\s+(\S+)\s+(\S+)\s+(\S*)\s+(.*)$/,
      );
      if (!match) {
        continue;
      }

      const [, name, nargs, address, complete, definition] = match;

      // Check if it's a buffer-local command
      const bufferLocal = name.startsWith("b:");

      // Skip buffer-local commands if not included
      if (bufferLocal && !includeBufferLocal) {
        continue;
      }

      // Skip builtin commands if not included (they start with uppercase)
      if (!includeBuiltin && /^[A-Z]/.test(name) && !name.includes(":")) {
        continue;
      }

      // Build attributes string
      const attributes: string[] = [];
      if (nargs !== "0") {
        attributes.push(`nargs=${nargs}`);
      }
      if (address !== ".") {
        attributes.push(`addr=${address}`);
      }
      if (complete) {
        attributes.push(`complete=${complete}`);
      }

      // Format display value
      const attrStr = attributes.length > 0
        ? ` (${attributes.join(", ")})`
        : "";
      const localStr = bufferLocal ? " [buffer]" : "";
      const truncatedDef = definition.length > 50
        ? definition.substring(0, 47) + "..."
        : definition;

      items.push({
        id: id++,
        value: `:${name}${localStr}${attrStr} → ${truncatedDef}`,
        detail: {
          name,
          definition,
          attributes: attrStr,
          bufferLocal,
          nargs,
          complete: complete || undefined,
        },
      });
    }

    // Get completion list if needed
    if (includeBuiltin) {
      const builtinCommands = await fn.getcompletion(
        denops,
        "",
        "command",
      ) as string[];

      for (const cmd of builtinCommands) {
        // Skip if already in the list
        if (items.some((item) => item.detail.name === cmd)) {
          continue;
        }

        items.push({
          id: id++,
          value: `:${cmd} [builtin]`,
          detail: {
            name: cmd,
            definition: "(builtin command)",
            attributes: "",
            bufferLocal: false,
            nargs: "?",
            complete: undefined,
          },
        });
      }
    }

    yield* items;
  });
}
