import { enumerate } from "@core/iterutil/enumerate";
import * as vars from "@denops/std/variable";

import { defineSource, type Source } from "../../source.ts";

type Detail = {
  path: string;
};

export function oldfiles(): Source<Detail> {
  return defineSource<Detail>(async function* (denops, _params, { signal }) {
    const oldfiles = await vars.v.get(denops, "oldfiles") as string[];
    signal?.throwIfAborted();
    for (const [id, path] of enumerate(oldfiles)) {
      yield {
        id,
        value: path,
        detail: {
          path,
        },
      };
    }
  });
}
