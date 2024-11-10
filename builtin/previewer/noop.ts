import { definePreviewer, type Previewer } from "../../previewer.ts";

/**
 * A no-operation (noop) Previewer.
 *
 * This Previewer does nothing and provides no preview content. It can be used as a placeholder
 * or a default value where a Previewer is required but no preview functionality is needed.
 *
 * @returns A Previewer that performs no operation.
 */
export function noop(): Previewer {
  return definePreviewer(() => {});
}
