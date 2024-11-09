import { assertEquals } from "@std/assert";
import { assertType, type IsExact } from "@std/testing/types";
import { DenopsStub } from "@denops/test/stub";
import {
  composeMatchers,
  defineMatcher,
  type Matcher,
  type MatchParams,
} from "./matcher.ts";

Deno.test("defineMatcher", async (t) => {
  await t.step("without type constraint", () => {
    const matcher = defineMatcher(async function* (_denops, params) {
      // @ts-expect-error: `params` is not type restrained
      const _: MatchParams<{ a: string }> = params;
      yield* [];
    });
    assertEquals(typeof matcher.match, "function");
    assertType<IsExact<typeof matcher, Matcher<unknown>>>(true);
  });

  await t.step("with type constraint", () => {
    const matcher = defineMatcher<{ a: string }>(
      async function* (_denops, params) {
        const _: MatchParams<{ a: string }> = params;
        yield* [];
      },
    );
    assertEquals(typeof matcher.match, "function");
    assertType<IsExact<typeof matcher, Matcher<{ a: string }>>>(true);
  });
});

Deno.test("composeMatchers", async (t) => {
  await t.step("compose matchers in order", async () => {
    const results: string[] = [];
    const matcher1 = defineMatcher<string>(
      async function* (_denops, { items }) {
        results.push("matcher1");
        yield* items.filter((item) => item.value.includes("1"));
      },
    );
    const matcher2 = defineMatcher<string>(
      async function* (_denops, { items }) {
        results.push("matcher2");
        yield* items.filter((item) => item.value.includes("2"));
      },
    );
    const matcher3 = defineMatcher<string>(
      async function* (_denops, { items }) {
        results.push("matcher3");
        yield* items.filter((item) => item.value.includes("3"));
      },
    );
    const matcher = composeMatchers(matcher2, matcher1, matcher3);
    assertType<IsExact<typeof matcher, Matcher<string>>>(true);
    const denops = new DenopsStub();
    const params = {
      query: "",
      items: Array.from({ length: 1000 }).map((_, id) => ({
        id,
        value: id.toString(),
        detail: "",
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

  await t.step("properly triggers type constraint", () => {
    const matcher1 = defineMatcher<{ a: string }>(async function* () {});
    const matcher2 = defineMatcher<{ b: string }>(async function* () {});
    const matcher3 = defineMatcher<{ c: string }>(async function* () {});
    // @ts-expect-error: `matcher2` is not assignable to `Matcher<{ a: string }>`
    composeMatchers(matcher1, matcher2);
    // @ts-expect-error: `matcher3` is not assignable to `Matcher<{ a: string }>`
    composeMatchers(matcher1, matcher3);
  });
});
