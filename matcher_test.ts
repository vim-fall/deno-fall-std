import { assertEquals } from "@std/assert";
import { assertType, type IsExact } from "@std/testing/types";
import { DenopsStub } from "@denops/test/stub";
import type { DetailUnit } from "./item.ts";
import {
  composeMatchers,
  defineMatcher,
  type Matcher,
  type MatchParams,
} from "./matcher.ts";

Deno.test("defineMatcher", async (t) => {
  await t.step("without type constraint", () => {
    type C = { a: string };
    const matcher = defineMatcher(async function* (_denops, params) {
      // NOTE:
      // `match` method itself has `V` thus we cannot use `AssertTrue` here.
      // @ts-expect-error: `params` does not establish the type constraint
      const _: MatchParams<C> = params;
      yield* [];
    });
    assertType<IsExact<typeof matcher, Matcher<DetailUnit>>>(true);
  });

  await t.step("with type constraint", () => {
    type C = { a: string };
    const matcher = defineMatcher<C>(
      async function* (_denops, params) {
        // NOTE:
        // `match` method itself has `V` thus we cannot use `AssertTrue` here.
        // `params` should establish the type constraint
        const _: MatchParams<C> = params;
        yield* [];
      },
    );
    assertType<IsExact<typeof matcher, Matcher<{ a: string }>>>(true);
  });
});

Deno.test("composeMatchers", async (t) => {
  await t.step("with bear matchers", async (t) => {
    await t.step("matchers are applied in order", async () => {
      const results: string[] = [];
      const matcher1 = defineMatcher(
        async function* (_denops, { items }) {
          results.push("matcher1");
          yield* items.filter((item) => item.value.includes("1"));
        },
      );
      const matcher2 = defineMatcher(
        async function* (_denops, { items }) {
          results.push("matcher2");
          yield* items.filter((item) => item.value.includes("2"));
        },
      );
      const matcher3 = defineMatcher(
        async function* (_denops, { items }) {
          results.push("matcher3");
          yield* items.filter((item) => item.value.includes("3"));
        },
      );
      const matcher = composeMatchers(matcher2, matcher1, matcher3);
      const denops = new DenopsStub();
      const params = {
        query: "",
        items: Array.from({ length: 1000 }).map((_, id) => ({
          id,
          value: id.toString(),
          detail: {},
        })),
      };
      const items = await Array.fromAsync(matcher.match(denops, params, {}));
      assertEquals(results, ["matcher2", "matcher1", "matcher3"]);
      assertEquals(items.map((item) => item.value), [
        "123",
        "132",
        "213",
        "231",
        "312",
        "321",
      ]);
    });

    await t.step("without type constraint", () => {
      const matcher1 = defineMatcher(async function* () {});
      const matcher2 = defineMatcher(async function* () {});
      const matcher3 = defineMatcher(async function* () {});
      const matcher = composeMatchers(matcher1, matcher2, matcher3);
      assertType<IsExact<typeof matcher, Matcher<DetailUnit>>>(true);
    });

    await t.step("with type constraint", () => {
      type C = { a: string };
      const matcher1 = defineMatcher<C>(async function* () {});
      const matcher2 = defineMatcher<C>(async function* () {});
      const matcher3 = defineMatcher<C>(async function* () {});
      const matcher = composeMatchers(matcher1, matcher2, matcher3);
      assertType<IsExact<typeof matcher, Matcher<C>>>(true);
    });

    await t.step("with type constraint (fail)", () => {
      type C = { a: string };
      const matcher1 = defineMatcher<C>(async function* () {});
      const matcher2 = defineMatcher<C>(async function* () {});
      const matcher3 = defineMatcher<{ b: string }>(async function* () {});
      // @ts-expect-error: `matcher3` requires `{ b: string }`
      composeMatchers(matcher1, matcher2, matcher3);
    });
  });

  await t.step("with derivable matchers", async (t) => {
    await t.step("matchers are applied in order", async () => {
      const results: string[] = [];
      const matcher1 = () =>
        defineMatcher(
          async function* (_denops, { items }) {
            results.push("matcher1");
            yield* items.filter((item) => item.value.includes("1"));
          },
        );
      const matcher2 = () =>
        defineMatcher(
          async function* (_denops, { items }) {
            results.push("matcher2");
            yield* items.filter((item) => item.value.includes("2"));
          },
        );
      const matcher3 = () =>
        defineMatcher(
          async function* (_denops, { items }) {
            results.push("matcher3");
            yield* items.filter((item) => item.value.includes("3"));
          },
        );
      const matcher = composeMatchers(matcher2, matcher1, matcher3);
      const denops = new DenopsStub();
      const params = {
        query: "",
        items: Array.from({ length: 1000 }).map((_, id) => ({
          id,
          value: id.toString(),
          detail: {},
        })),
      };
      const items = await Array.fromAsync(matcher.match(denops, params, {}));
      assertEquals(results, ["matcher2", "matcher1", "matcher3"]);
      assertEquals(items.map((item) => item.value), [
        "123",
        "132",
        "213",
        "231",
        "312",
        "321",
      ]);
    });

    await t.step("without type constraint", () => {
      const matcher1 = () => defineMatcher(async function* () {});
      const matcher2 = () => defineMatcher(async function* () {});
      const matcher3 = () => defineMatcher(async function* () {});
      const matcher = composeMatchers(matcher1, matcher2, matcher3);
      assertType<IsExact<typeof matcher, Matcher<DetailUnit>>>(true);
    });

    await t.step("with type constraint", () => {
      type C = { a: string };
      const matcher1 = () => defineMatcher<C>(async function* () {});
      const matcher2 = () => defineMatcher<C>(async function* () {});
      const matcher3 = () => defineMatcher<C>(async function* () {});
      const matcher = composeMatchers(matcher1, matcher2, matcher3);
      assertType<IsExact<typeof matcher, Matcher<C>>>(true);
    });

    await t.step("with type constraint (fail)", () => {
      type C = { a: string };
      const matcher1 = () => defineMatcher<C>(async function* () {});
      const matcher2 = () => defineMatcher<C>(async function* () {});
      const matcher3 = () =>
        defineMatcher<{ b: string }>(async function* () {});
      // @ts-expect-error: `matcher3` requires `{ b: string }`
      composeMatchers(matcher1, matcher2, matcher3);
    });
  });
});
