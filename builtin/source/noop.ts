import type { DetailUnit } from "../../item.ts";
import { defineSource, type Source } from "../../source.ts";

/**
 * A no-operation source that yields no items.
 *
 * This source produces an empty stream, effectively performing no action.
 * It can be used as a placeholder when a source is required, but no actual
 * data needs to be provided.
 *
 * @returns A source that yields no items.
 */
export function noop(): Source<DetailUnit> {
  return defineSource(async function* () {});
}
