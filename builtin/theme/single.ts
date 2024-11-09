import type { Border, Divider, Theme } from "../../theme.ts";

const SINGLE_BORDER: Border = [
  "┌",
  "─",
  "┐",
  "│",
  "┘",
  "─",
  "└",
  "│",
] as const;

const SINGLE_DIVIDER: Divider = [
  "├",
  "─",
  "┤",
  "┬",
  "│",
  "┴",
] as const;

/**
 * Single Theme.
 *
 * This theme uses single box-drawing characters for both borders and dividers,
 * providing a clean and minimalist look. The single lines create clear
 * boundaries while maintaining simplicity, making it suitable for terminals
 * with basic box-drawing character support.
 *
 * Visual representation:
 *
 * ```
 * ┌─────────┐┌────┬────┐
 * │         ││    │    │
 * ├─────────┤│    │    │
 * │         ││    │    │
 * └─────────┘└────┴────┘
 * ```
 *
 * @constant
 * @type {Theme}
 * @property {Border} border - Single line characters defining the outer border.
 * @property {Divider} divider - Single line characters used for dividing sections within the theme.
 */
export const SINGLE_THEME: Theme = {
  border: SINGLE_BORDER,
  divider: SINGLE_DIVIDER,
} as const;
