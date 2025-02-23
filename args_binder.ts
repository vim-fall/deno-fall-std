import type { Denops } from "@denops/std";
import { type Derivable, derive } from "@vim-fall/custom/derivable";

import type { Detail } from "./item.ts";
import { defineSource, type Source } from "./source.ts";
import { type Curator, defineCurator } from "./curator.ts";

type BoundArgsProvider =
  | string[]
  | ((denops: Denops) => string[] | Promise<string[]>);

async function deriveBoundArgs(
  denops: Denops,
  args: BoundArgsProvider,
): Promise<string[]> {
  return args instanceof Function ? await args(denops) : args;
}

export function bindSourceArgs<T extends Detail = Detail>(
  baseSource: Derivable<Source<T>>,
  args: BoundArgsProvider,
): Source<T> {
  const source = derive(baseSource);

  return defineSource(async function* (denops, params, options) {
    const boundArgs = await deriveBoundArgs(denops, args);
    const iter = source.collect(
      denops,
      { ...params, args: [...boundArgs, ...params.args] },
      options,
    );
    for await (const item of iter) {
      yield item;
    }
  });
}

export function bindCuratorArgs<T extends Detail = Detail>(
  baseCurator: Derivable<Curator<T>>,
  args: BoundArgsProvider,
): Curator<T> {
  const curator = derive(baseCurator);

  return defineCurator(async function* (denops, params, options) {
    const boundArgs = await deriveBoundArgs(denops, args);
    const iter = curator.curate(
      denops,
      { ...params, args: [...boundArgs, ...params.args] },
      options,
    );
    for await (const item of iter) {
      yield item;
    }
  });
}
