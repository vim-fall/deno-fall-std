import { defineRenderer, type Renderer } from "../../renderer.ts";
import { dirname } from "@std/path/dirname";

type Detail = {
  /**
   * File path
   */
  path: string;

  /**
   * Line number
   */
  line?: number;

  /**
   * Column number
   */
  column?: number;

  /**
   * Matched text or line content
   */
  text?: string;
};

export type SmartGrepOptions = {
  /**
   * Maximum length for displayed text.
   * @default 80
   */
  maxTextLength?: number;

  /**
   * Whether to show line and column numbers.
   * @default true
   */
  showLineNumbers?: boolean;

  /**
   * Whether to group results by directory.
   * @default false
   */
  groupByDirectory?: boolean;

  /**
   * Whether to use relative paths.
   * @default true
   */
  useRelativePaths?: boolean;

  /**
   * Whether to colorize output (using ANSI codes).
   * @default false
   */
  colorize?: boolean;

  /**
   * Whether to align columns.
   * @default true
   */
  alignColumns?: boolean;
};

/**
 * Creates a Renderer that formats grep-like results in a smart way.
 *
 * This Renderer reformats items that contain file paths, line numbers,
 * and matched text into a more readable format with proper alignment
 * and optional grouping.
 *
 * @param options - Options to customize smart grep display.
 * @returns A Renderer that reformats grep-like results.
 */
export function smartGrep(
  options: Readonly<SmartGrepOptions> = {},
): Renderer<Detail> {
  const maxTextLength = options.maxTextLength ?? 80;
  const showLineNumbers = options.showLineNumbers ?? true;
  const groupByDirectory = options.groupByDirectory ?? false;
  const useRelativePaths = options.useRelativePaths ?? true;
  const colorize = options.colorize ?? false;
  const alignColumns = options.alignColumns ?? true;

  return defineRenderer((_denops, { items }) => {
    if (items.length === 0) {
      return;
    }

    // Calculate maximum widths for alignment
    let maxPathWidth = 0;
    let maxLineWidth = 0;
    let maxColumnWidth = 0;

    if (alignColumns) {
      for (const item of items) {
        const { path, line, column } = item.detail;
        const displayPath = useRelativePaths ? path : path;
        maxPathWidth = Math.max(maxPathWidth, displayPath.length);
        if (line !== undefined) {
          maxLineWidth = Math.max(maxLineWidth, line.toString().length);
        }
        if (column !== undefined) {
          maxColumnWidth = Math.max(maxColumnWidth, column.toString().length);
        }
      }
    }

    // Group items by directory if requested
    if (groupByDirectory) {
      const groups = new Map<string, typeof items>();

      for (const item of items) {
        const dir = dirname(item.detail.path);
        if (!groups.has(dir)) {
          groups.set(dir, []);
        }
        groups.get(dir)!.push(item);
      }

      // Process each group
      let currentDir = "";
      for (const item of items) {
        const dir = dirname(item.detail.path);

        // Add directory header if changed
        if (dir !== currentDir) {
          currentDir = dir;
          // Modify the first item in each directory group to include header
          const dirHeader = `=== ${dir} ===`;
          if (colorize) {
            item.label = `\x1b[36m${dirHeader}\x1b[0m\n${formatItem(item)}`;
          } else {
            item.label = `${dirHeader}\n${formatItem(item)}`;
          }
        } else {
          item.label = formatItem(item);
        }
      }
    } else {
      // Format each item individually
      for (const item of items) {
        item.label = formatItem(item);
      }
    }

    function formatItem(item: typeof items[0]): string {
      const { path, line, column, text } = item.detail;
      const parts: string[] = [];

      // Format path
      const displayPath = useRelativePaths ? path : path;
      const pathPart = alignColumns
        ? displayPath.padEnd(maxPathWidth)
        : displayPath;

      if (colorize) {
        parts.push(`\x1b[35m${pathPart}\x1b[0m`); // Magenta for path
      } else {
        parts.push(pathPart);
      }

      // Format line and column numbers
      if (showLineNumbers && line !== undefined) {
        const lineStr = alignColumns
          ? line.toString().padStart(maxLineWidth)
          : line.toString();

        if (column !== undefined) {
          const colStr = alignColumns
            ? column.toString().padStart(maxColumnWidth)
            : column.toString();

          if (colorize) {
            parts.push(`\x1b[32m${lineStr}:${colStr}\x1b[0m`); // Green for numbers
          } else {
            parts.push(`${lineStr}:${colStr}`);
          }
        } else {
          if (colorize) {
            parts.push(`\x1b[32m${lineStr}\x1b[0m`); // Green for line number
          } else {
            parts.push(lineStr);
          }
        }
      }

      // Format text
      if (text) {
        let displayText = text.trim();
        if (displayText.length > maxTextLength) {
          displayText = displayText.substring(0, maxTextLength - 3) + "...";
        }

        if (colorize) {
          // Try to highlight the matched part (simple approach)
          parts.push(`\x1b[37m${displayText}\x1b[0m`); // White for text
        } else {
          parts.push(displayText);
        }
      }

      return parts.join("  ");
    }
  });
}
