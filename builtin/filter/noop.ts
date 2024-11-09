import { defineProjector, type Projector } from "../../projector.ts";

/**
 * A no-operation (noop) Projector.
 *
 * This Projector does nothing and yields no items. It can be used as a placeholder
 * or a default value where a Projector is required but no action is needed.
 *
 * @returns A Projector that yields nothing.
 */
export function noop<T>(): Projector<T> {
  return defineProjector<T>(async function* () {});
}
