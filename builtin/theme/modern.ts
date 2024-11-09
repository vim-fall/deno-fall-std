import type { Border, Divider, Theme } from "../../theme.ts";

const ROUNDED_BORDER: Border = [
  "╭",
  "─",
  "╮",
  "│",
  "╯",
  "─",
  "╰",
  "│",
] as const;

const DASHED_DIVIDER: Divider = [
  "├",
  "╌",
  "┤",
  "┬",
  "╎",
  "┴",
] as const;

/**
 * Modern Theme.
 *
 * This theme uses rounded corners for borders, adding a softer and more modern
 * aesthetic. Dashed lines are used as dividers, creating a distinct separation
 * between sections without the rigidity of solid lines.
 *
 * This theme is designed for terminals that support a wide range of box-drawing
 * characters, making it suitable for modern UI designs.
 *
 * Visual representation:
 *
 * ```
 * ╭─────────╮╭────┬────╮
 * │         ││    ╎    │
 * ├╌╌╌╌╌╌╌╌╌┤│    ╎    │
 * │         ││    ╎    │
 * ╰─────────╯╰────┴────╯
 * ```
 *
 * @constant
 * @type {Theme}
 * @property {Border} border - Rounded box-drawing characters for the border,
 * creating a softened frame around components.
 * @property {Divider} divider - Dashed lines for dividers, adding a subtle yet
 * visible boundary between sections.
 */
export const MODERN_THEME: Theme = {
  border: ROUNDED_BORDER,
  divider: DASHED_DIVIDER,
} as const;
