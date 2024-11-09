import { detect, EOL } from "@std/fs/eol";

const encoder = new TextEncoder();

/**
 * Returns the byte length of the given string.
 *
 * @param str - The string to measure.
 * @returns The byte length of the encoded string.
 */
export function getByteLength(str: string): number {
  return encoder.encode(str).length;
}

/**
 * Splits the given text into lines in POSIX style (LF line endings).
 *
 * Detects the line ending type in the text and splits it accordingly. If the
 * text ends with a newline, the resulting array does not include an empty
 * string for the final line.
 *
 * @param text - The text to split into lines.
 * @returns An array of strings, each representing a line in the text.
 */
export function splitText(text: string): string[] {
  const eof = detect(text) ?? EOL;
  const lines = text.split(eof);
  return lines.at(-1) === "" ? lines.slice(0, -1) : lines;
}
