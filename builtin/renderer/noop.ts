import { defineRenderer, type Renderer } from "../../renderer.ts";

/**
 * A no-operation (noop) Renderer.
 *
 * This Renderer performs no operations and provides no modifications to items.
 * It can be used as a placeholder or default where a Renderer is required but no rendering changes are needed.
 *
 * @returns A Renderer that does nothing.
 */
export function noop(): Renderer {
  return defineRenderer(() => {});
}
