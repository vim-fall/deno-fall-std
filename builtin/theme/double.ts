import type { Border, Divider, Theme } from "../../theme.ts";

const DOUBLE_BORDER: Border = [
  "╔",
  "═",
  "╗",
  "║",
  "╝",
  "═",
  "╚",
  "║",
] as const;

const DOUBLE_DIVIDER: Divider = [
  "╠",
  "═",
  "╣",
  "╦",
  "║",
  "╩",
] as const;

/**
 * Double Theme.
 *
 * This theme uses double box-drawing characters for both borders and dividers,
 * giving a bold, structured look suitable for interfaces where clear separation
 * between sections is important.
 *
 * Visual representation:
 *
 * ```
 * ╔═════════╗╔════╦════╗
 * ║         ║║    ║    ║
 * ╠═════════╣║    ║    ║
 * ║         ║║    ║    ║
 * ╚═════════╝╚════╩════╝
 * ```
 *
 * @constant
 * @type {Theme}
 * @property {Border} border - Double-lined box-drawing characters for borders.
 * @property {Divider} divider - Double-lined box-drawing characters for dividers.
 */
export const DOUBLE_THEME: Theme = {
  border: DOUBLE_BORDER,
  divider: DOUBLE_DIVIDER,
} as const;
