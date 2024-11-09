import { assertEquals } from "@std/assert";
import { assertType, type IsExact } from "@std/testing/types";
import { DenopsStub } from "@denops/test/stub";
import { composeSources, defineSource, type Source } from "./source.ts";

Deno.test("defineSource", () => {
  const source = defineSource(async function* () {});
  assertEquals(typeof source.collect, "function");
  assertType<IsExact<typeof source, Source<unknown>>>(true);
});

Deno.test("composeSources", async () => {
  const results: string[] = [];
  const source1 = defineSource(async function* () {
    results.push("source1");
    yield* Array.from({ length: 3 }).map((_, id) => ({
      id,
      value: `A-${id}`,
      detail: {
        a: id,
      },
    }));
  });
  const source2 = defineSource(async function* () {
    results.push("source2");
    yield* Array.from({ length: 3 }).map((_, id) => ({
      id,
      value: `B-${id}`,
      detail: {
        b: id,
      },
    }));
  });
  const source3 = defineSource(async function* () {
    results.push("source3");
    yield* Array.from({ length: 3 }).map((_, id) => ({
      id,
      value: `C-${id}`,
      detail: {
        c: id,
      },
    }));
  });
  const source = composeSources(source2, source1, source3);
  assertType<
    IsExact<
      typeof source,
      Source<{ a: number } | { b: number } | { c: number }>
    >
  >(true);
  const denops = new DenopsStub();
  const params = {
    args: [],
  };
  const items = await Array.fromAsync(source.collect(denops, params, {}));
  assertEquals(results, ["source2", "source1", "source3"]);
  assertEquals(items.map((v) => v.value), [
    "B-0",
    "B-1",
    "B-2",
    "A-0",
    "A-1",
    "A-2",
    "C-0",
    "C-1",
    "C-2",
  ]);
});
