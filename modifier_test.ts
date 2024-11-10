import { assertEquals } from "@std/assert";
import { assertType, type IsExact } from "@std/testing/types";

import {
  defineModifier,
  type Modifier,
  type ModifyParams,
} from "./modifier.ts";
import type { Source } from "./source.ts";
import type { Curator } from "./curator.ts";

Deno.test("Modifier", async (t) => {
  await t.step("with Source", async (t) => {
    await t.step("without type constraint U", async (t) => {
      const modifier = (() => {}) as Modifier<{ a: string }>;

      await t.step("passed type is equal to the type restriction", () => {
        const modified = modifier({} as Source<{ a: string }>);
        assertType<
          IsExact<
            typeof modified,
            Source<{ a: string }>
          >
        >(true);
      });

      await t.step("passed type establishes the type restriction", () => {
        const modified = modifier({} as Source<{ a: string; b: string }>);
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
          modifier({} as Source<{ b: string }>);
        },
      );

      await t.step(
        "check if the type constraint correctly triggers the type checking",
        () => {
          const modifier1 = (() => {}) as Modifier<{ a: string }>;
          const modifier2 = (() => {}) as Modifier<{ b: string }>;
          const modifier3 = (() => {}) as Modifier<{ c: string }>;
          function strictFunction<T extends { a: string }>(_: Modifier<T>) {}
          strictFunction(modifier1);
          // @ts-expect-error: 'a' is missing
          strictFunction(modifier2);
          // @ts-expect-error: 'a' is missing
          strictFunction(modifier3);
        },
      );
    });

    await t.step("with type constraint U", async (t) => {
      const modifier = (() => {}) as Modifier<{ a: string }, { z: string }>;

      await t.step("passed type is equal to the type restriction", () => {
        const modified = modifier({} as Source<{ a: string }>);
        assertType<
          IsExact<
            typeof modified,
            Source<{ a: string; z: string }>
          >
        >(true);
      });

      await t.step("passed type establishes the type restriction", () => {
        const modified = modifier({} as Source<{ a: string; b: string }>);
        assertType<
          IsExact<
            typeof modified,
            Source<{ a: string; b: string; z: string }>
          >
        >(true);
      });

      await t.step(
        "passed type does not establish the type restriction",
        () => {
          // @ts-expect-error: 'a' is missing
          modifier({} as Source<{ b: string }>);
        },
      );

      await t.step(
        "check if the type constraint correctly triggers the type checking",
        () => {
          const modifier1 = (() => {}) as Modifier<
            { a: string },
            { z: string }
          >;
          const modifier2 = (() => {}) as Modifier<
            { b: string },
            { z: string }
          >;
          const modifier3 = (() => {}) as Modifier<
            { c: string },
            { z: string }
          >;
          function strictFunction<T extends { a: string }>(_: Modifier<T>) {}
          strictFunction(modifier1);
          // @ts-expect-error: 'a' is missing
          strictFunction(modifier2);
          // @ts-expect-error: 'a' is missing
          strictFunction(modifier3);
        },
      );
    });
  });

  await t.step("with Curator", async (t) => {
    await t.step("without type constraint U", async (t) => {
      const modifier = (() => {}) as Modifier<{ a: string }>;

      await t.step("passed type is equal to the type restriction", () => {
        const modified = modifier({} as Curator<{ a: string }>);
        assertType<
          IsExact<
            typeof modified,
            Curator<{ a: string }>
          >
        >(true);
      });

      await t.step("passed type establishes the type restriction", () => {
        const modified = modifier({} as Curator<{ a: string; b: string }>);
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
          modifier({} as Curator<{ b: string }>);
        },
      );

      await t.step(
        "check if the type constraint correctly triggers the type checking",
        () => {
          const modifier1 = (() => {}) as Modifier<{ a: string }>;
          const modifier2 = (() => {}) as Modifier<{ b: string }>;
          const modifier3 = (() => {}) as Modifier<{ c: string }>;
          function strictFunction<T extends { a: string }>(_: Modifier<T>) {}
          strictFunction(modifier1);
          // @ts-expect-error: 'a' is missing
          strictFunction(modifier2);
          // @ts-expect-error: 'a' is missing
          strictFunction(modifier3);
        },
      );
    });

    await t.step("with type constraint U", async (t) => {
      const modifier = (() => {}) as Modifier<{ a: string }, { z: string }>;

      await t.step("passed type is equal to the type restriction", () => {
        const modified = modifier({} as Curator<{ a: string }>);
        assertType<
          IsExact<
            typeof modified,
            Curator<{ a: string; z: string }>
          >
        >(true);
      });

      await t.step("passed type establishes the type restriction", () => {
        const modified = modifier({} as Curator<{ a: string; b: string }>);
        assertType<
          IsExact<
            typeof modified,
            Curator<{ a: string; b: string; z: string }>
          >
        >(true);
      });

      await t.step(
        "passed type does not establish the type restriction",
        () => {
          // @ts-expect-error: 'a' is missing
          modifier({} as Curator<{ b: string }>);
        },
      );

      await t.step(
        "check if the type constraint correctly triggers the type checking",
        () => {
          const modifier1 = (() => {}) as Modifier<
            { a: string },
            { z: string }
          >;
          const modifier2 = (() => {}) as Modifier<
            { b: string },
            { z: string }
          >;
          const modifier3 = (() => {}) as Modifier<
            { c: string },
            { z: string }
          >;
          function strictFunction<T extends { a: string }>(_: Modifier<T>) {}
          strictFunction(modifier1);
          // @ts-expect-error: 'a' is missing
          strictFunction(modifier2);
          // @ts-expect-error: 'a' is missing
          strictFunction(modifier3);
        },
      );
    });
  });
});

Deno.test("defineModifier", async (t) => {
  await t.step("without type constraint", () => {
    const modifier = defineModifier(async function* (_denops, params) {
      // @ts-expect-error: `params` is not type restrained
      const _: ModifyParams<{ a: string }> = params;
      yield* [];
    });
    assertEquals(typeof modifier, "function");
    assertType<IsExact<typeof modifier, Modifier<unknown>>>(true);
  });

  await t.step("without type constraint T", () => {
    const modifier = defineModifier<{ a: string }>(
      async function* (_denops, params) {
        const _: ModifyParams<{ a: string }> = params;
        yield* [];
      },
    );
    assertEquals(typeof modifier, "function");

    // NOTE:
    // It seems `Modifier` is not comparable with `IsExact`.
    // So compare the result instead.
    const modified = modifier({} as Source<{ a: string }>);
    assertType<
      IsExact<typeof modified, Source<{ a: string }>>
    >(true);
  });

  await t.step("without type constraint T and U", () => {
    const modifier = defineModifier<{ a: string }, { z: string }>(
      async function* (_denops, params) {
        const _: ModifyParams<{ a: string }> = params;
        yield* [];
      },
    );
    assertEquals(typeof modifier, "function");
    // NOTE:
    // It seems `Modifier` is not comparable with `IsExact`.
    // So compare the result instead.
    const modified = modifier({} as Source<{ a: string }>);
    assertType<
      IsExact<typeof modified, Source<{ a: string; z: string }>>
    >(true);
  });
});
