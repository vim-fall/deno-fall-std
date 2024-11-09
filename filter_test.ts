import { assertEquals } from "@std/assert";
import { assertType, type IsExact } from "@std/testing/types";

import { defineFilter, type Filter, type FilterParams } from "./filter.ts";
import type { Source } from "./source.ts";
import type { Curator } from "./curator.ts";

Deno.test("Filter", async (t) => {
  await t.step("with Source", async (t) => {
    const filter = (() => {}) as Filter<{ a: string }>;

    await t.step("passed type is equal to the type restriction", () => {
      const modified = filter({} as Source<{ a: string }>);
      assertType<
        IsExact<
          typeof modified,
          Source<{ a: string }>
        >
      >(true);
    });

    await t.step("passed type establishes the type restriction", () => {
      const modified = filter({} as Source<{ a: string; b: string }>);
      assertType<
        IsExact<
          typeof modified,
          Source<{ a: string; b: string }>
        >
      >(true);
    });

    await t.step(
      "passed type does not establish the type restriction",
      () => {
        // @ts-expect-error: 'a' is missing
        filter({} as Source<{ b: string }>);
      },
    );

    await t.step(
      "check if the type constraint correctly triggers the type checking",
      () => {
        const filter1 = (() => {}) as Filter<{ a: string }>;
        const filter2 = (() => {}) as Filter<{ b: string }>;
        const filter3 = (() => {}) as Filter<{ c: string }>;
        function strictFunction<T extends { a: string }>(_: Filter<T>) {}
        strictFunction(filter1);
        // @ts-expect-error: 'a' is missing
        strictFunction(filter2);
        // @ts-expect-error: 'a' is missing
        strictFunction(filter3);
      },
    );
  });

  await t.step("with Curator", async (t) => {
    const filter = (() => {}) as Filter<{ a: string }>;

    await t.step("passed type is equal to the type restriction", () => {
      const modified = filter({} as Curator<{ a: string }>);
      assertType<
        IsExact<
          typeof modified,
          Curator<{ a: string }>
        >
      >(true);
    });

    await t.step("passed type establishes the type restriction", () => {
      const modified = filter({} as Curator<{ a: string; b: string }>);
      assertType<
        IsExact<
          typeof modified,
          Curator<{ a: string; b: string }>
        >
      >(true);
    });

    await t.step(
      "passed type does not establish the type restriction",
      () => {
        // @ts-expect-error: 'a' is missing
        filter({} as Curator<{ b: string }>);
      },
    );

    await t.step(
      "check if the type constraint correctly triggers the type checking",
      () => {
        const filter1 = (() => {}) as Filter<{ a: string }>;
        const filter2 = (() => {}) as Filter<{ b: string }>;
        const filter3 = (() => {}) as Filter<{ c: string }>;
        function strictFunction<T extends { a: string }>(_: Filter<T>) {}
        strictFunction(filter1);
        // @ts-expect-error: 'a' is missing
        strictFunction(filter2);
        // @ts-expect-error: 'a' is missing
        strictFunction(filter3);
      },
    );
  });
});

Deno.test("defineFilter", async (t) => {
  await t.step("without type constraint", () => {
    const filter = defineFilter(async function* (_denops, params) {
      // @ts-expect-error: `params` is not type restrained
      const _: FilterParams<{ a: string }> = params;
      yield* [];
    });
    assertEquals(typeof filter, "function");
    assertType<IsExact<typeof filter, Filter<unknown>>>(true);
  });

  await t.step("without type constraint T", () => {
    const filter = defineFilter<{ a: string }>(
      async function* (_denops, params) {
        const _: FilterParams<{ a: string }> = params;
        yield* [];
      },
    );
    assertEquals(typeof filter, "function");
    assertType<IsExact<typeof filter, Filter<{ a: string }>>>(true);
  });
});
