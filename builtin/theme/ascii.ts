import type { Border, Divider, Theme } from "../../theme.ts";

const ASCII_BORDER: Border = [
  ".",
  "-",
  ".",
  "|",
  "'",
  "-",
  "'",
  "|",
] as const;

const ASCII_DIVIDER: Divider = [
  "|",
  "~",
  "|",
  "-",
  ":",
  "-",
] as const;

/**
 * ASCII Theme.
 *
 * This theme uses only ASCII characters for borders and dividers, making it ideal for
 * terminals that lack support for box-drawing characters. The theme uses basic ASCII characters
 * like `.`, `-`, `|`, `'`, and `~` to create simple and readable boundaries. It's a minimalistic
 * design that focuses on legibility while ensuring compatibility with basic terminals.
 *
 * Visual Representation:
 *
 * ```
 * .---------..---------.
 * |         ||    :    |
 * |~~~~~~~~~||    :    |
 * |         ||    :    |
 * '---------''---------'
 * ```
 *
 * @constant
 * @type {Theme}
 * @property {Border} border - Defines the border styling using ASCII characters for clarity and simplicity.
 * @property {Divider} divider - Defines the divider styling, making use of simple ASCII symbols for separating sections.
 */
export const ASCII_THEME: Theme = {
  border: ASCII_BORDER,
  divider: ASCII_DIVIDER,
  spinner: ["-", "\\", "|", "/"],
  headSymbol: ">",
  failSymbol: "X",
  matcherIcon: "m:",
  sorterIcon: "s:",
  rendererIcon: "r:",
  previewerIcon: "p:",
} as const;
