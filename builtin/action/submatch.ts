import type {
  Coordinator,
  Detail,
  DetailUnit,
  Matcher,
  Previewer,
  Renderer,
  Sorter,
  Theme,
} from "@vim-fall/core";
import type { ItemPickerParams } from "@vim-fall/config/item-picker";
import {
  type Derivable,
  type DerivableArray,
  type DerivableMap,
  derive,
  deriveArray,
  deriveMap,
} from "@vim-fall/config/derivable";
import { unnullish } from "@lambdalisue/unnullish";

import { type Action, defineAction } from "../../action.ts";
import { fzf } from "../matcher/fzf.ts";
import { substring } from "../matcher/substring.ts";
import { regexp } from "../matcher/regexp.ts";

export type SubmatchOptions<T extends Detail, A extends string> = {
  /**
   * Actions available for the submatch picker.
   */
  actions?: DerivableMap<ItemPickerParams<T, A>["actions"]>;
  /**
   * Default action to invoke.
   */
  defaultAction?: A;
  /**
   * Sorters to apply to matched items.
   */
  sorters?: DerivableArray<readonly Sorter<T>[]>;
  /**
   * Renderers to display matched items.
   */
  renderers?: DerivableArray<readonly Renderer<T>[]>;
  /**
   * Previewers for item previews.
   */
  previewers?: DerivableArray<readonly Previewer<T>[]>;
  /**
   * Coordinator to handle layout.
   */
  coordinator?: Derivable<Coordinator>;
  /**
   * Theme to style the picker.
   */
  theme?: Derivable<Theme>;
};

/**
 * Creates an action to perform submatching on items using specified matchers.
 *
 * This action initializes a picker with the provided matchers and optional configuration,
 * allowing users to refine or filter selections within a secondary picker context.
 *
 * @param matchers - Matchers to use for item filtering.
 * @param options - Additional configuration options for the picker.
 * @returns An action that performs submatching.
 */
export function submatch<T extends Detail, A extends string>(
  matchers: DerivableArray<readonly [Matcher<T>, ...Matcher<T>[]]>,
  options: SubmatchOptions<T, A> = {},
): Action<T> {
  const submatchParams = {
    matchers: deriveArray(matchers),
    actions: unnullish(options.actions, deriveMap),
    defaultAction: options.defaultAction,
    sorters: unnullish(options.sorters, deriveArray),
    renderers: unnullish(options.renderers, deriveArray),
    previewers: unnullish(options.previewers, deriveArray),
    coordinator: unnullish(options.coordinator, derive),
    theme: unnullish(options.theme, derive),
  };
  return defineAction<T>(
    async (denops, params, { signal }) => {
      const result = await denops.dispatch(
        "fall",
        "submatch",
        params,
        submatchParams,
        { signal },
      );
      if (result) {
        return true;
      }
    },
  );
}

/**
 * Default submatching actions with common matchers.
 */
export const defaultSubmatchActions: {
  "sub:fzf": Action<DetailUnit>;
  "sub:substring": Action<DetailUnit>;
  "sub:regexp": Action<DetailUnit>;
} = {
  "sub:fzf": submatch([fzf]),
  "sub:substring": submatch([substring]),
  "sub:regexp": submatch([regexp]),
};
