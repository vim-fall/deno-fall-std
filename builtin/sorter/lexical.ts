import type { IdItem } from "../../item.ts";
import { defineSorter, type Sorter } from "../../sorter.ts";

type Options<T> = {
  attrGetter?: (item: IdItem<T>) => string;
  reverse?: boolean;
};

export function lexical<T>(options: Readonly<Options<T>> = {}): Sorter<T> {
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
