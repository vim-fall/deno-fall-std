import type { IdItem } from "../../item.ts";
import { defineSorter, type Sorter } from "../../sorter.ts";

type Options<T> = {
  /**
   * Function to extract the attribute used for sorting.
   * If not provided, the item's `value` will be used.
   */
  attrGetter?: (item: IdItem<T>) => unknown;

  /**
   * Whether to reverse the sort order.
   * If `true`, sorts in descending order; otherwise, sorts in ascending order.
   */
  reverse?: boolean;
};

/**
 * Creates a numerical sorter that arranges items based on numerical comparison.
 *
 * This sorter extracts a numerical attribute from each item, converting values to numbers
 * if necessary. Sorting can be adjusted to be in ascending or descending order via the `reverse` option.
 *
 * @param options - Options for customizing the sort behavior.
 * @returns A Sorter that performs numerical ordering on items.
 */
export function numerical<T>(options: Readonly<Options<T>> = {}): Sorter<T> {
  const attrGetter = options.attrGetter ?? ((item: IdItem<T>) => item.value);
  const alpha = options.reverse ? -1 : 1;
  return defineSorter<T>((_denops, { items }, _options) => {
    items.sort((a, b) => {
      const va = attrGetter(a);
      const vb = attrGetter(b);

      // Convert values to numbers for comparison
      const na = typeof va === "number" ? va : Number(va);
      const nb = typeof vb === "number" ? vb : Number(vb);

      // Skip comparison if either value is NaN
      if (isNaN(na) || isNaN(nb)) return 0;
      return Math.sign(na - nb) * alpha;
    });
  });
}
