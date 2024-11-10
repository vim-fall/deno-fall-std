import { defineMatcher, type Matcher } from "../../matcher.ts";

/**
 * A no-operation (noop) Matcher.
 *
 * This Matcher does nothing and yields no items. It can be used as a placeholder
 * or a default value where a Matcher is required but no action is needed.
 *
 * @returns A Matcher that yields nothing.
 */
export function noop(): Matcher {
  return defineMatcher(async function* () {});
}
