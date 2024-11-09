import { exists as exists_ } from "@std/fs/exists";

import { defineProjector, type Projector } from "../../projector.ts";

type Detail = {
  path: string;
};

export function exists(): Projector<Detail> {
  return defineProjector(async function* (_denops, { items }, { signal }) {
    for await (const item of items) {
      if (await exists_(item.detail.path)) {
        yield item;
      }
      signal?.throwIfAborted();
    }
  });
}
