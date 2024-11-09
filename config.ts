import type { Denops } from "@denops/std";
import type {
  Action,
  Coordinator,
  Curator,
  Matcher,
  Previewer,
  Renderer,
  Sorter,
  Source,
  Theme,
} from "@vim-fall/core";

import type {
  Derivable,
  DerivableArray,
  DerivableMap,
} from "./util/derivable.ts";

/**
 * Represents a collection of actions that can be invoked.
 *
 * @template T - The type of items the actions operate on.
 * @template A - The type representing the default action name.
 */
export type Actions<T, A extends string> =
  & Record<string, Action<T>>
  & { [key in A]: Action<T> };

/**
 * Parameters required to configure an item picker.
 *
 * @template T - The type of items in the picker.
 * @template A - The type representing the default action name.
 */
export type ItemPickerParams<T, A extends string> = {
  name: string;
  source: Source<T>;
  actions: Actions<T, NoInfer<A>>;
  defaultAction: A;
  matchers: [Matcher<NoInfer<T>>, ...Matcher<NoInfer<T>>[]];
  sorters?: Sorter<NoInfer<T>>[];
  renderers?: Renderer<NoInfer<T>>[];
  previewers?: Previewer<NoInfer<T>>[];
  coordinator?: Coordinator;
  theme?: Theme;
};

/**
 * Parameters required to configure an action picker.
 */
export type ActionPickerParams = {
  matchers: [Matcher<Action<unknown>>, ...Matcher<Action<unknown>>[]];
  sorters?: Sorter<Action<unknown>>[];
  renderers?: Renderer<Action<unknown>>[];
  previewers?: Previewer<Action<unknown>>[];
  coordinator?: Coordinator;
  theme?: Theme;
};

/**
 * Global configuration settings.
 */
export type GlobalConfig = {
  coordinator: Coordinator;
  theme: Theme;
};

/**
 * Defines an item picker based on a source and matchers.
 *
 * @template T - The type of items handled by the picker.
 * @template A - The type representing the default action name.
 */
export type DefineItemPickerFromSource = <T, A extends string>(
  name: string,
  source: Derivable<Source<T>>,
  params: {
    actions: DerivableMap<Actions<NoInfer<T>, NoInfer<A>>>;
    defaultAction: A;
    matchers: DerivableArray<[Matcher<NoInfer<T>>, ...Matcher<NoInfer<T>>[]]>;
    sorters?: DerivableArray<Sorter<NoInfer<T>>[]>;
    renderers?: DerivableArray<Renderer<NoInfer<T>>[]>;
    previewers?: DerivableArray<Previewer<NoInfer<T>>[]>;
    coordinator?: Derivable<Coordinator>;
    theme?: Derivable<Theme>;
  },
) => void;

/**
 * Defines an item picker based on a curator.
 *
 * @template T - The type of items handled by the picker.
 * @template A - The type representing the default action name.
 */
export type DefineItemPickerFromCurator = <T, A extends string>(
  name: string,
  curator: Derivable<Curator<T>>,
  params: {
    actions: DerivableMap<Actions<NoInfer<T>, NoInfer<A>>>;
    defaultAction: A;
    sorters?: DerivableArray<Sorter<NoInfer<T>>[]>;
    renderers?: DerivableArray<Renderer<NoInfer<T>>[]>;
    previewers?: DerivableArray<Previewer<NoInfer<T>>[]>;
    coordinator?: Derivable<Coordinator>;
    theme?: Derivable<Theme>;
  },
) => void;

/**
 * Refines the configuration for an action picker.
 */
export type RefineActionPicker = (
  params: {
    matchers: DerivableArray<
      [Matcher<Action<unknown>>, ...Matcher<Action<unknown>>[]]
    >;
    sorters?: DerivableArray<Sorter<Action<unknown>>[]>;
    renderers?: DerivableArray<Renderer<Action<unknown>>[]>;
    previewers?: DerivableArray<Previewer<Action<unknown>>[]>;
    coordinator?: Derivable<Coordinator>;
    theme?: Derivable<Theme>;
  },
) => void;

/**
 * Refines the global configuration, allowing customization of global coordinator and theme.
 */
export type RefineGlobalConfig = (
  params: {
    coordinator?: Derivable<Coordinator>;
    theme?: Derivable<Theme>;
  },
) => void;

/**
 * The entrypoint for configuring the picker environment.
 *
 * @param params - An object containing various picker setup functions and the Denops instance.
 */
export type Entrypoint = (params: {
  denops: Denops;
  defineItemPickerFromSource: DefineItemPickerFromSource;
  defineItemPickerFromCurator: DefineItemPickerFromCurator;
  refineActionPicker: RefineActionPicker;
  refineGlobalConfig: RefineGlobalConfig;
}) => void | Promise<void>;
