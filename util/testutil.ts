import {
  type Border,
  BorderIndex as BI,
  DividerIndex as DI,
  type Theme,
} from "../theme.ts";
import type { Dimension, Size } from "../coordinator.ts";

/**
 * Creates a blank canvas with the given width and height.
 *
 * @param width - The width of the canvas.
 * @param height - The height of the canvas.
 * @returns A 2D array representing the blank canvas filled with spaces.
 */
export function buildCanvas({ width, height }: Size): string[][] {
  return [...Array(height)].map(() => [...Array(width)].fill(" "));
}

/**
 * Renders a border around the given canvas based on the specified dimensions.
 *
 * The border characters are placed along the edges of the canvas according
 * to the positions defined in `BorderIndex`.
 *
 * @param canvas - The canvas to render the border onto.
 * @param border - The border style to use for rendering.
 * @param dimension - The dimensions and position of the border within the canvas.
 */
export function renderBorder(
  canvas: string[][],
  border: Border,
  dimension: Dimension,
): void {
  const getChar = (x: number, y: number): string => {
    if (y === 0 && x === 0) {
      // top-left corner
      return border[BI.TopLeft];
    } else if (y === 0 && x === width + 1) {
      // top-right corner
      return border[BI.TopRight];
    } else if (y === height + 1 && x === 0) {
      // bottom-left corner
      return border[BI.BottomLeft];
    } else if (y === height + 1 && x === width + 1) {
      // bottom-right corner
      return border[BI.BottomRight];
    } else if (y === 0) {
      // top edge
      return border[BI.Top];
    } else if (y === height + 1) {
      // bottom edge
      return border[BI.Bottom];
    } else if (x === 0) {
      // left edge
      return border[BI.Left];
    } else if (x === width + 1) {
      // right edge
      return border[BI.Right];
    } else {
      // inside canvas
      return "";
    }
  };

  const { row, col, width, height } = dimension;
  for (let y = 0; y < height + 2; y++) {
    for (let x = 0; x < width + 2; x++) {
      const char = getChar(x, y);
      if (char) {
        canvas[row - 1 + y][col - 1 + x] = char;
      }
    }
  }
}

/**
 * Renders a sample display of the theme, showing the border and divider styles.
 *
 * This function creates a visual representation of the theme’s border and
 * divider characters, formatted in a standard way for preview.
 *
 * @param theme - The theme to render.
 * @returns An array of strings representing the theme sample.
 */
export function renderTheme(theme: Theme): string[] {
  const width = 22;
  const halfWidth = width / 2;
  const height = 5;
  const canvas = buildCanvas({ width, height });

  const getChar = (x: number, y: number): string => {
    // Corners
    if (x === 0 && y === 0 || x === halfWidth && y === 0) {
      return theme.border[BI.TopLeft];
    }
    if (x === halfWidth - 1 && y === 0 || x === width - 1 && y === 0) {
      return theme.border[BI.TopRight];
    }
    if (x === 0 && y === height - 1 || x === halfWidth && y === height - 1) {
      return theme.border[BI.BottomLeft];
    }
    if (
      x === halfWidth - 1 && y === height - 1 ||
      x === width - 1 && y === height - 1
    ) {
      return theme.border[BI.BottomRight];
    }
    // Dividers
    if (x === 0 && y === 2) {
      return theme.divider[DI.Left];
    }
    if (x === halfWidth - 1 && y === 2) {
      return theme.divider[DI.Right];
    }
    if (y === 2 && x > 0 && x < halfWidth - 1) {
      return theme.divider[DI.Horizontal];
    }
    if (x === 16 && y === 0) {
      return theme.divider[DI.Top];
    }
    if (x === 16 && y === height - 1) {
      return theme.divider[DI.Bottom];
    }
    if (x === 16) {
      return theme.divider[DI.Vertical];
    }
    // Other borders
    if (x === 0 || x === halfWidth) {
      return theme.border[BI.Left];
    }
    if (x === halfWidth - 1 || x === width - 1) {
      return theme.border[BI.Right];
    }
    if (y === 0) {
      return theme.border[BI.Top];
    }
    if (y === height - 1) {
      return theme.border[BI.Bottom];
    }
    // Inside
    return " ";
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      canvas[y][x] = getChar(x, y);
    }
  }

  return canvas.map((row) => row.join(""));
}
