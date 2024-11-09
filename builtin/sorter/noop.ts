import { defineSorter, type Sorter } from "../../sorter.ts";

/**
 * A no-operation (noop) Sorter.
 *
 * This Sorter performs no sorting operation on items. It can be used as a placeholder
 * or default where a Sorter is required but no sorting is needed.
 *
 * @returns A Sorter that does nothing.
 */
export function noop<T>(): Sorter<T> {
  return defineSorter<T>(() => {});
}
