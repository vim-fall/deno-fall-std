import type { DetailUnit } from "../../item.ts";
import { type Curator, defineCurator } from "../../curator.ts";

/**
 * A no-operation (noop) Curator.
 *
 * This Curator does nothing and yields no items. It can be used as a placeholder
 * or a default value where a Curator is required but no action is needed.
 *
 * @returns A Curator that yields nothing.
 */
export function noop(): Curator<DetailUnit> {
  return defineCurator(async function* () {});
}
