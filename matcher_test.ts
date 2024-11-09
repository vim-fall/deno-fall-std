import { assertEquals } from "@std/assert";
import { assertType, type IsExact } from "@std/testing/types";
import { DenopsStub } from "@denops/test/stub";
import { composeMatchers, defineMatcher, type Matcher } from "./matcher.ts";

Deno.test("defineMatcher", () => {
  const matcher = defineMatcher(async function* () {});
  assertEquals(typeof matcher.match, "function");
  assertType<IsExact<typeof matcher, Matcher<unknown>>>(true);
});

Deno.test("composeMatchers", async () => {
  const results: string[] = [];
  const matcher1 = defineMatcher(async function* (_denops, { items }) {
    results.push("matcher1");
    yield* items.filter((item) => item.value.includes("1"));
  });
  const matcher2 = defineMatcher(async function* (_denops, { items }) {
    results.push("matcher2");
    yield* items.filter((item) => item.value.includes("2"));
  });
  const matcher3 = defineMatcher(async function* (_denops, { items }) {
    results.push("matcher3");
    yield* items.filter((item) => item.value.includes("3"));
  });
  const matcher = composeMatchers(matcher2, matcher1, matcher3);
  const denops = new DenopsStub();
  const params = {
    query: "",
    items: Array.from({ length: 1000 }).map((_, id) => ({
      id,
      value: id.toString(),
      detail: undefined,
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
