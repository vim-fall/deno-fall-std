import {
  BorderIndex as BI,
  DividerIndex as DI,
  type Theme,
} from "../../theme.ts";
import type { Coordinator, Layout, Size, Style } from "../../coordinator.ts";

const WIDTH_RATIO = 0.8;
const WIDTH_MIN = 10;
const WIDTH_MAX = 340;
const HEIGHT_RATIO = 0.6;
const HEIGHT_MIN = 5;
const HEIGHT_MAX = 70;
const PREVIEW_RATIO = 0.6;

export type CompactOptions = {
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
 * Compact Coordinator.
 *
 * This coordinator is designed for use in compact spaces, where components
 * like the input, list, and preview are closely packed together without spaces.
 *
 * It looks like this (with MODERN_THEME):
 *
 * ```
 *                               Width
 *                ╭──────────────────────────────────╮
 *             ╭─ ╭────────────┬─────────────────────╮ ─╮
 * inputHeight │  │            ╎                     │  │
 *             ├─ ├╌╌╌╌╌╌╌╌╌╌╌╌┤                     │  │
 *             │  │            ╎                     │  │
 *             │  │            ╎                     │  │
 *             │  │            ╎                     │  │
 *             │  │            ╎                     │  │
 *             │  │            ╎                     │  │Height
 * listHeight  │  │            ╎                     │  │
 *             │  │            ╎                     │  │
 *             │  │            ╎                     │  │
 *             │  │            ╎                     │  │
 *             │  │            ╎                     │  │
 *             │  │            ╎                     │  │
 *             ╰─ ╰────────────┴─────────────────────╯ ─╯
 *                ╰────────────┴─────────────────────╯
 *                  mainWidth        previewWidth
 * ```
 *
 * @param options - Configuration options for the layout.
 * @returns A coordinator with specified layout and style functions.
 */
export function compact(
  options: CompactOptions = {},
): Coordinator {
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
       * Defines the border and divider styles for the components when preview is enabled.
       *
       * @param theme - The theme defining border and divider characters.
       * @returns The style configuration for input, list, and preview components.
       */
      style(
        { border, divider }: Theme,
      ): Style {
        return {
          input: [
            border[BI.TopLeft],
            border[BI.Top],
            divider[DI.Top],
            divider[DI.Vertical],
            "",
            "",
            "",
            border[BI.Left],
          ],
          list: [
            divider[DI.Left],
            divider[DI.Horizontal],
            "",
            "",
            "",
            border[BI.Bottom],
            border[BI.BottomLeft],
            border[BI.Left],
          ],
          preview: [
            divider[DI.Top],
            border[BI.Top],
            border[BI.TopRight],
            border[BI.Right],
            border[BI.BottomRight],
            border[BI.Bottom],
            divider[DI.Bottom],
            divider[DI.Vertical],
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
        const mainInnerWidth = mainWidth - 1;
        const inputHeight = 2;
        const inputInnerHeight = inputHeight - 1;
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
       * Defines the border and divider styles for the components when preview is disabled.
       *
       * @param theme - The theme defining border and divider characters.
       * @returns The style configuration for input and list components.
       */
      style({ border, divider }: Theme): Style {
        return {
          input: [
            border[BI.TopLeft],
            border[BI.Top],
            border[BI.TopRight],
            border[BI.Right],
            "",
            "",
            "",
            border[BI.Left],
          ],
          list: [
            divider[DI.Left],
            divider[DI.Horizontal],
            divider[DI.Right],
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
        const inputHeight = 2;
        const inputInnerHeight = inputHeight - 1;
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
