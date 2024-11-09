import { defineFilter, type Filter } from "../../filter.ts";

/**
 * A no-operation (noop) Filter.
 *
 * This Filter does nothing and yields no items. It can be used as a placeholder
 * or a default value where a Filter is required but no action is needed.
 *
 * @returns A Filter that yields nothing.
 */
export function noop<T>(): Filter<T> {
  return defineFilter<T>(async function* () {});
}
