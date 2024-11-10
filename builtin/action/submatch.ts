import type {
  Coordinator,
  Detail,
  DetailUnit,
  Matcher,
  Previewer,
  Renderer,
  Size,
  Sorter,
  Theme,
} from "@vim-fall/core";

import type { Actions, GlobalConfig, ItemPickerParams } from "../../config.ts";
import { type Action, defineAction } from "../../action.ts";
import {
  type Derivable,
  type DerivableArray,
  type DerivableMap,
  derive,
  deriveArray,
  deriveMap,
} from "../../util/derivable.ts";
import { list } from "../source/list.ts";
import { fzf } from "../matcher/fzf.ts";
import { substring } from "../matcher/substring.ts";
import { regexp } from "../matcher/regexp.ts";

export type SubmatchOptions<T extends Detail, A extends string> = {
  /**
   * Actions available for the submatch picker.
   */
  actions?: DerivableMap<Actions<T, A>>;
  /**
   * Default action to invoke.
   */
  defaultAction?: A;
  /**
   * Sorters to apply to matched items.
   */
  sorters?: DerivableArray<Sorter<T>[]> | null;
  /**
   * Renderers to display matched items.
   */
  renderers?: DerivableArray<Renderer<T>[]> | null;
  /**
   * Previewers for item previews.
   */
  previewers?: DerivableArray<Previewer<T>[]> | null;
  /**
   * Coordinator to handle layout.
   */
  coordinator?: Derivable<Coordinator> | null;
  /**
   * Theme to style the picker.
   */
  theme?: Derivable<Theme> | null;
};

type Context<T extends Detail, A extends string> = {
  /**
   * The screen size.
   */
  readonly screen: Size;
  /**
   * The global configuration.
   */
  readonly globalConfig: GlobalConfig;
  /**
   * The picker parameters.
   */
  readonly pickerParams: ItemPickerParams<T, A> & GlobalConfig;
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
  matchers: DerivableArray<[Matcher<T>, ...Matcher<T>[]]>,
  options: SubmatchOptions<T, A> = {},
): Action<T> {
  return defineAction<T>(
    async (denops, { selectedItems, filteredItems, ...params }, { signal }) => {
      const context = getContext(params);

      const pickerParams: ItemPickerParams<T, string> & GlobalConfig = {
        ...context.pickerParams,
        source: list(selectedItems ?? filteredItems),
        matchers: deriveArray(matchers),
      };

      if (options.actions) {
        pickerParams.actions = deriveMap(pickerParams.actions);
      }
      if (options.defaultAction) {
        pickerParams.defaultAction = options.defaultAction;
      }
      if (options.sorters !== undefined) {
        pickerParams.sorters = options.sorters
          ? deriveArray(options.sorters)
          : undefined;
      }
      if (options.renderers !== undefined) {
        pickerParams.renderers = options.renderers
          ? deriveArray(options.renderers)
          : undefined;
      }
      if (options.previewers !== undefined) {
        pickerParams.previewers = options.previewers
          ? deriveArray(options.previewers)
          : undefined;
      }
      if (options.coordinator !== undefined) {
        pickerParams.coordinator = derive(options.coordinator) ??
          context.globalConfig.coordinator;
      }
      if (options.theme !== undefined) {
        pickerParams.theme = derive(options.theme) ??
          context.globalConfig.theme;
      }

      const result = await denops.dispatch(
        "fall",
        "picker:start",
        [],
        context.screen,
        pickerParams,
        { signal },
      );

      if (result) {
        return true;
      }
    },
  );
}

/**
 * Retrieves the context from the parameters object.
 *
 * @param params - Parameters that may contain the hidden context for submatch.
 * @returns The extracted context.
 * @throws If the required context is not present.
 */
function getContext<T extends Detail, A extends string>(
  params: unknown,
): Context<T, A> {
  if (params && typeof params === "object" && "_submatchContext" in params) {
    return params._submatchContext as Context<T, A>;
  }
  throw new Error(
    "[fall] Invoke params doesn't have required hidden context for submatch",
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
