import { detect, EOL } from "@std/fs/eol";

const encoder = new TextEncoder();

/**
 * Get the byte length of the string.
 */
export function getByteLength(str: string): number {
  return encoder.encode(str).length;
}

/**
 * Split the text into lines in POSIX style.
 */
export function splitText(text: string): string[] {
  const eof = detect(text) ?? EOL;
  const lines = text.split(eof);
  return lines.at(-1) === "" ? lines.slice(0, -1) : lines;
}
