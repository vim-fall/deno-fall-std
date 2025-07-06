import * as fn from "@denops/std/function";

import { defineSource, type Source } from "../../source.ts";

type Detail = {
  /**
   * Autocmd event name
   */
  event: string;

  /**
   * Autocmd group name (if any)
   */
  group?: string;

  /**
   * Pattern the autocmd matches
   */
  pattern: string;

  /**
   * Command to execute
   */
  command: string;

  /**
   * Whether it's a buffer-local autocmd
   */
  bufferLocal: boolean;

  /**
   * Additional autocmd flags/attributes
   */
  flags: string[];
};

export type AutocmdOptions = {
  /**
   * Filter by specific event(s).
   */
  events?: string[];

  /**
   * Filter by autocmd group.
   */
  group?: string;

  /**
   * Whether to include buffer-local autocmds.
   * @default true
   */
  includeBufferLocal?: boolean;

  /**
   * Whether to show detailed command (full command vs truncated).
   * @default false
   */
  showFullCommand?: boolean;
};

/**
 * Creates a Source that generates items from Vim autocmds.
 *
 * This Source retrieves all defined autocmds and generates items
 * for each one, showing their events, patterns, and commands.
 *
 * @param options - Options to customize autocmd listing.
 * @returns A Source that generates items representing autocmds.
 */
// Regular expressions for parsing autocmd output
const PATTERNS = {
  GROUP_HEADER: /^--- Autocommands ---$/,
  NAMED_GROUP_HEADER: /^(\w+)\s+Autocommands for "(.+)"$/,
  EVENT_HEADER: /^(\w+)$/,
  AUTOCMD_LINE: /^\s*(\S+)\s+(.+)$/,
} as const;

/**
 * Creates a Source that generates items from Vim autocmds.
 *
 * This Source retrieves all defined autocmds and generates items
 * for each one, showing their events, patterns, and commands.
 *
 * @param options - Options to customize autocmd listing.
 * @returns A Source that generates items representing autocmds.
 */
export function autocmd(
  options: Readonly<AutocmdOptions> = {},
): Source<Detail> {
  const filterEvents = options.events;
  const filterGroup = options.group;
  const includeBufferLocal = options.includeBufferLocal ?? true;
  const showFullCommand = options.showFullCommand ?? false;

  return defineSource(async function* (denops, _params, { signal }) {
    // Get autocmd output
    const autocmdCmd = filterGroup ? `autocmd ${filterGroup}` : "autocmd";
    const output = await fn.execute(denops, autocmdCmd);
    signal?.throwIfAborted();

    // Parse autocmd output
    const lines = output.trim().split("\n");
    const items: Array<{
      id: number;
      value: string;
      detail: Detail;
    }> = [];

    let id = 0;
    let currentGroup = "";
    let currentEvent = "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Check for group header
      if (PATTERNS.GROUP_HEADER.test(trimmed)) {
        currentGroup = "";
        continue;
      }

      // Check for named group header
      const namedGroupMatch = trimmed.match(PATTERNS.NAMED_GROUP_HEADER);
      if (namedGroupMatch) {
        currentGroup = namedGroupMatch[1];
        continue;
      }

      // Check for event header
      const eventMatch = trimmed.match(PATTERNS.EVENT_HEADER);
      if (eventMatch && !trimmed.includes(" ")) {
        currentEvent = eventMatch[1];
        continue;
      }

      // Parse autocmd line
      // Format: "    pattern    command"
      const cmdMatch = trimmed.match(PATTERNS.AUTOCMD_LINE);
      if (cmdMatch && currentEvent) {
        const [, pattern, command] = cmdMatch;

        // Filter by event if specified
        if (filterEvents && !filterEvents.includes(currentEvent)) {
          continue;
        }

        // Parse flags from pattern
        const flags: string[] = [];
        let bufferLocal = false;
        let cleanPattern = pattern;

        // Check for buffer-local indicator
        if (pattern.startsWith("<buffer>")) {
          bufferLocal = true;
          cleanPattern = pattern.replace("<buffer>", "").trim();
          flags.push("buffer");
        }

        // Skip buffer-local if not included
        if (bufferLocal && !includeBufferLocal) {
          continue;
        }

        // Format display value
        const groupStr = currentGroup ? `[${currentGroup}] ` : "";
        const bufferStr = bufferLocal ? " <buffer>" : "";
        const truncatedCmd = showFullCommand || command.length <= 50
          ? command
          : command.substring(0, 47) + "...";

        const value =
          `${groupStr}${currentEvent} ${cleanPattern}${bufferStr} → ${truncatedCmd}`;

        items.push({
          id: id++,
          value,
          detail: {
            event: currentEvent,
            group: currentGroup || undefined,
            pattern: cleanPattern,
            command,
            bufferLocal,
            flags,
          },
        });
      }
    }

    yield* items;
  });
}
