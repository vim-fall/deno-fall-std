import * as fn from "@denops/std/function";

import { defineSource, type Source } from "../../source.ts";

type Detail = {
  /**
   * Mapping key/lhs
   */
  lhs: string;

  /**
   * Mapping value/rhs
   */
  rhs: string;

  /**
   * Mapping mode
   */
  mode: string;

  /**
   * Whether the mapping is buffer-local
   */
  bufferLocal: boolean;

  /**
   * Whether the mapping is silent
   */
  silent: boolean;

  /**
   * Whether the mapping is noremap
   */
  noremap: boolean;

  /**
   * Whether the mapping waits for more input
   */
  nowait: boolean;

  /**
   * Whether the mapping is an expression
   */
  expr: boolean;
};

export type MappingOptions = {
  /**
   * Which modes to include mappings from.
   * Default includes all common modes.
   * @default ["n", "i", "v", "x", "s", "o", "c", "t"]
   */
  modes?: string[];

  /**
   * Whether to include buffer-local mappings.
   * @default true
   */
  includeBufferLocal?: boolean;

  /**
   * Whether to include plugin mappings (mappings containing <Plug>).
   * @default false
   */
  includePluginMappings?: boolean;
};

/**
 * Creates a Source that generates items from Vim key mappings.
 *
 * This Source retrieves all key mappings from specified modes and
 * generates items for each one, showing their definitions and attributes.
 *
 * @param options - Options to customize mapping listing.
 * @returns A Source that generates items representing mappings.
 */
export function mapping(
  options: Readonly<MappingOptions> = {},
): Source<Detail> {
  const modes = options.modes ?? ["n", "i", "v", "x", "s", "o", "c", "t"];
  const includeBufferLocal = options.includeBufferLocal ?? true;
  const includePluginMappings = options.includePluginMappings ?? false;

  return defineSource(async function* (denops, _params, { signal }) {
    const items: Array<{
      id: number;
      value: string;
      detail: Detail;
    }> = [];

    let id = 0;
    for (const mode of modes) {
      // Get mappings for this mode
      const mappingList = await fn.maplist(denops, mode) as Array<{
        lhs: string;
        rhs: string;
        silent: number | boolean;
        noremap: number | boolean;
        nowait: number | boolean;
        expr: number | boolean;
        buffer: number | boolean;
        mode?: string;
        sid?: number;
        lnum?: number;
        script?: number | boolean;
      }>;
      signal?.throwIfAborted();

      for (const mapping of mappingList) {
        // Skip buffer-local mappings if not included
        const isBufferLocal = Boolean(mapping.buffer);
        if (isBufferLocal && !includeBufferLocal) {
          continue;
        }

        // Skip plugin mappings if not included
        if (!includePluginMappings && mapping.rhs.includes("<Plug>")) {
          continue;
        }

        // Build attributes
        const attributes: string[] = [];
        if (mapping.silent) attributes.push("silent");
        if (mapping.noremap) attributes.push("noremap");
        if (mapping.nowait) attributes.push("nowait");
        if (mapping.expr) attributes.push("expr");
        if (isBufferLocal) attributes.push("buffer");

        // Format mode indicator
        const modeIndicator = mode === "n" ? " " : `[${mode}]`;

        // Format display value
        const attrStr = attributes.length > 0
          ? ` (${attributes.join(", ")})`
          : "";
        const truncatedRhs = mapping.rhs.length > 50
          ? mapping.rhs.substring(0, 47) + "..."
          : mapping.rhs;

        items.push({
          id: id++,
          value: `${modeIndicator} ${mapping.lhs}${attrStr} → ${truncatedRhs}`,
          detail: {
            lhs: mapping.lhs,
            rhs: mapping.rhs,
            mode: mode,
            bufferLocal: isBufferLocal,
            silent: Boolean(mapping.silent),
            noremap: Boolean(mapping.noremap),
            nowait: Boolean(mapping.nowait),
            expr: Boolean(mapping.expr),
          },
        });
      }
    }

    // Sort by mode and then by lhs
    items.sort((a, b) => {
      const modeCmp = a.detail.mode.localeCompare(b.detail.mode);
      if (modeCmp !== 0) return modeCmp;
      return a.detail.lhs.localeCompare(b.detail.lhs);
    });

    yield* items;
  });
}
