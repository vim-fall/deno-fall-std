import type { Denops } from "@denops/std";
import { type Derivable, derive } from "@vim-fall/custom/derivable";

import type { Detail } from "./item.ts";
import { defineSource, type Source } from "./source.ts";
import { type Curator, defineCurator } from "./curator.ts";

/**
 * A type that represents a list of strings or a function which gets a denops
 * instance and returns a list of strings.
 */
type BoundArgsProvider =
  | string[]
  | ((denops: Denops) => string[] | Promise<string[]>);

/**
 * Get the value to be passed to the source as args with resolving it when it
 * is a function.
 *
 * @param denops - A denops instance.
 * @param args - A list of strings or a function that returns it.
 * @return The resolved value of `args`.
 */
async function deriveBoundArgs(
  denops: Denops,
  args: BoundArgsProvider,
): Promise<string[]> {
  return args instanceof Function ? await args(denops) : args;
}

/**
 * Creates a new source from an existing source with fixing some args.
 *
 * `args` is passed to the source as the head n number of arguments.  The
 * command-line arguments follow them.  `args` is used as is if it is a list of
 * strings.  Otherwise, when it is a function, it is evaluated each time when
 * the source is called, and the resulting value is passed to the base source.
 *
 * @param baseSource - The source to fix args.
 * @param args - The args to pass to the source.
 * @return A single source which calls the given source with given args.
 */
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

/**
 * Creates a new curator from an existing curator with fixing some args.
 *
 * `args` is passed to the curator as the head n number of arguments.  The
 * command-line arguments follow them.  `args` is used as is if it is a list of
 * strings.  Otherwise, when it is a function, it is evaluated each time when
 * the curator is called, and the resulting value is passed to the base
 * curator.
 *
 * @param baseSource - The curator to fix args.
 * @param args - The args to pass to the curator.
 * @return A single curator which calls the given curator with given args.
 */
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
