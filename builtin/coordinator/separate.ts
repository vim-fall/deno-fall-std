import { BorderIndex as BI, type Theme } from "../../theme.ts";
import type { Coordinator, Layout, Size, Style } from "../../coordinator.ts";

const WIDTH_RATIO = 0.8;
const WIDTH_MIN = 10;
const WIDTH_MAX = 340;
const HEIGHT_RATIO = 0.6;
const HEIGHT_MIN = 5;
const HEIGHT_MAX = 70;
const PREVIEW_RATIO = 0.6;

export type SeparateOptions = {
  /**
   * If true, hides the preview component.
   */
  hidePreview?: boolean;
  /**
   * Ratio of the screen width to use for the coordinator.
   */
  widthRatio?: number;
  /**
   * Minimum width for the coordinator.
   */
  widthMin?: number;
  /**
   * Maximum width for the coordinator.
   */
  widthMax?: number;
  /**
   * Ratio of the screen height to use for the coordinator.
   */
  heightRatio?: number;
  /**
   * Minimum height for the coordinator.
   */
  heightMin?: number;
  /**
   * Maximum height for the coordinator.
   */
  heightMax?: number;
  /**
   * Ratio of width allocated for the preview component.
   */
  previewRatio?: number;
};

/**
 * Separate Coordinator.
 *
 * This coordinator is designed to mimic the style of telescope.nvim,
 * though the position of the input component is reversed.
 *
 * It looks like this (with MODERN_THEME):
 *
 * ```
 *                               Width
 *                ╭──────────────────────────────────╮
 *             ╭─ ╭────────────╮╭────────────────────╮ ─╮
 * inputHeight │  │            ││                    │  │
 *             ╰─ ╰────────────╯│                    │  │
 *             ╭─ ╭────────────╮│                    │  │
 *             │  │            ││                    │  │
 *             │  │            ││                    │  │
 *             │  │            ││                    │  │
 *             │  │            ││                    │  │Height
 * listHeight  │  │            ││                    │  │
 *             │  │            ││                    │  │
 *             │  │            ││                    │  │
 *             │  │            ││                    │  │
 *             │  │            ││                    │  │
 *             │  │            ││                    │  │
 *             ╰─ ╰────────────╯╰────────────────────╯ ─╯
 *                ╰────────────╯╰────────────────────╯
 *                  mainWidth        previewWidth
 * ```
 */
export function separate(options: SeparateOptions = {}): Coordinator {
  const {
    hidePreview = false,
    widthRatio = WIDTH_RATIO,
    widthMin = WIDTH_MIN,
    widthMax = WIDTH_MAX,
    heightRatio = HEIGHT_RATIO,
    heightMin = HEIGHT_MIN,
    heightMax = HEIGHT_MAX,
    previewRatio = PREVIEW_RATIO,
  } = options;

  /**
   * Computes the dimensions for the coordinator based on screen size.
   *
   * @param screen - The screen size to base the dimensions on.
   * @returns The calculated position and size for the coordinator.
   */
  const dimension = ({ width: screenWidth, height: screenHeight }: Size) => {
    const width = Math.min(
      widthMax,
      Math.max(widthMin, Math.floor(screenWidth * widthRatio)),
    );
    const height = Math.min(
      heightMax,
      Math.max(heightMin, Math.floor(screenHeight * heightRatio)),
    );
    const col = 1 + Math.floor((screenWidth - width) / 2);
    const row = 1 + Math.floor((screenHeight - height) / 2);
    return { col, row, width, height };
  };

  if (!hidePreview) {
    return {
      /**
       * Defines the border styles for the components when preview is enabled.
       *
       * @param theme - The theme defining border characters.
       * @returns The style configuration for input, list, and preview components.
       */
      style({ border }: Theme): Style {
        return {
          input: [
            border[BI.TopLeft],
            border[BI.Top],
            border[BI.TopRight],
            border[BI.Right],
            border[BI.BottomRight],
            border[BI.Bottom],
            border[BI.BottomLeft],
            border[BI.Left],
          ],
          list: [
            border[BI.TopLeft],
            border[BI.Top],
            border[BI.TopRight],
            border[BI.Right],
            border[BI.BottomRight],
            border[BI.Bottom],
            border[BI.BottomLeft],
            border[BI.Left],
          ],
          preview: [
            border[BI.TopLeft],
            border[BI.Top],
            border[BI.TopRight],
            border[BI.Right],
            border[BI.BottomRight],
            border[BI.Bottom],
            border[BI.BottomLeft],
            border[BI.Left],
          ],
        } as const;
      },

      /**
       * Calculates the layout for the components including input, list, and preview.
       *
       * @param screen - The screen size for reference.
       * @returns The layout configuration for input, list, and preview components.
       */
      layout(screen: Size): Layout {
        const { col, row, width, height } = dimension(screen);
        const previewWidth = Math.max(0, Math.floor(width * previewRatio));
        const previewInnerWidth = previewWidth - 2;
        const mainWidth = width - previewWidth;
        const mainInnerWidth = mainWidth - 2;
        const inputHeight = 3;
        const inputInnerHeight = inputHeight - 2;
        const listHeight = height - inputHeight;
        const listInnerHeight = listHeight - 2;
        const previewInnerHeight = height - 2;
        return {
          input: {
            col,
            row,
            width: mainInnerWidth,
            height: inputInnerHeight,
          },
          list: {
            col,
            row: row + inputHeight,
            width: mainInnerWidth,
            height: listInnerHeight,
          },
          preview: {
            col: col + mainWidth,
            row,
            width: previewInnerWidth,
            height: previewInnerHeight,
          },
        } as const;
      },
    };
  } else {
    return {
      /**
       * Defines the border styles for the components when preview is disabled.
       *
       * @param theme - The theme defining border characters.
       * @returns The style configuration for input and list components.
       */
      style({ border }: Theme): Style {
        return {
          input: [
            border[BI.TopLeft],
            border[BI.Top],
            border[BI.TopRight],
            border[BI.Right],
            border[BI.BottomRight],
            border[BI.Bottom],
            border[BI.BottomLeft],
            border[BI.Left],
          ],
          list: [
            border[BI.TopLeft],
            border[BI.Top],
            border[BI.TopRight],
            border[BI.Right],
            border[BI.BottomRight],
            border[BI.Bottom],
            border[BI.BottomLeft],
            border[BI.Left],
          ],
        } as const;
      },

      /**
       * Calculates the layout for the components, with no preview component.
       *
       * @param screen - The screen size for reference.
       * @returns The layout configuration for input and list components.
       */
      layout(screen: Size): Layout {
        const { col, row, width, height } = dimension(screen);
        const mainInnerWidth = width - 2;
        const inputHeight = 3;
        const inputInnerHeight = inputHeight - 2;
        const listHeight = height - inputHeight;
        const listInnerHeight = listHeight - 2;
        return {
          input: {
            col,
            row,
            width: mainInnerWidth,
            height: inputInnerHeight,
          },
          list: {
            col,
            row: row + inputHeight,
            width: mainInnerWidth,
            height: listInnerHeight,
          },
        } as const;
      },
    };
  }
}
