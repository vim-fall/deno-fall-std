import { defineRefiner, type Refiner } from "../../refiner.ts";

/**
 * A no-operation (noop) Refiner.
 *
 * This Refiner does nothing and yields no items. It can be used as a placeholder
 * or a default value where a Refiner is required but no action is needed.
 *
 * @returns A Refiner that yields nothing.
 */
export function noop(): Refiner {
  return defineRefiner(async function* () {});
}
