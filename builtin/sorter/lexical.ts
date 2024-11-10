import type { Detail, IdItem } from "../../item.ts";
import { defineSorter, type Sorter } from "../../sorter.ts";

export type LexicalOptions<T extends Detail> = {
  /**
   * Function to extract the string attribute used for sorting.
   * If not provided, the item's `value` will be used.
   */
  attrGetter?: (item: IdItem<T>) => string;

  /**
   * Whether to reverse the sort order.
   * If `true`, sorts in descending order; otherwise, sorts in ascending order.
   */
  reverse?: boolean;
};

/**
 * Creates a lexical sorter that arranges items based on string comparison.
 *
 * This sorter compares items lexically (alphabetically) using the attribute specified by `attrGetter`.
 * Sorting can be adjusted to be in ascending or descending order via the `reverse` option.
 *
 * @param options - Options for customizing the sort behavior.
 * @returns A Sorter that performs lexical ordering on items.
 */
export function lexical<T extends Detail>(
  options: Readonly<LexicalOptions<T>> = {},
): Sorter<T> {
  const attrGetter = options.attrGetter ?? ((item: IdItem<T>) => item.value);
  const alpha = options.reverse ? -1 : 1;
  return defineSorter<T>((_denops, { items }, _options) => {
    items.sort((a, b) => {
      const va = attrGetter(a);
      const vb = attrGetter(b);
      return (va < vb ? -1 : (va > vb ? 1 : 0)) * alpha;
    });
  });
}
