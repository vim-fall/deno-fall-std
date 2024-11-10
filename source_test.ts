import { assertEquals } from "@std/assert";
import { assertType, type IsExact } from "@std/testing/types";
import { DenopsStub } from "@denops/test/stub";
import type { Detail } from "./item.ts";
import { composeSources, defineSource, type Source } from "./source.ts";

Deno.test("defineSource", async (t) => {
  await t.step("without type contraint", async () => {
    const source = defineSource(async function* () {
      yield { id: 1, value: "1", detail: { a: "" } };
      yield { id: 2, value: "2", detail: { a: "" } };
      yield { id: 3, value: "3", detail: { a: "" } };
    });
    assertType<IsExact<typeof source, Source<{ a: string }>>>(true);
    const denops = new DenopsStub();
    const params = {
      args: [],
      query: "",
    };
    const items = await Array.fromAsync(source.collect(denops, params, {}));
    assertEquals(items, [
      { id: 1, value: "1", detail: { a: "" } },
      { id: 2, value: "2", detail: { a: "" } },
      { id: 3, value: "3", detail: { a: "" } },
    ]);
  });

  await t.step("with type contraint", async () => {
    type C = { a: string };
    // @ts-expect-error: 'detail' does not follow the type constraint
    defineSource<C>(async function* () {
      yield { id: 1, value: "1", detail: "invalid detail" };
    });
    const source = defineSource<C>(async function* () {
      yield { id: 1, value: "1", detail: { a: "" } };
      yield { id: 2, value: "2", detail: { a: "" } };
      yield { id: 3, value: "3", detail: { a: "" } };
    });
    assertType<IsExact<typeof source, Source<C>>>(true);
    const denops = new DenopsStub();
    const params = {
      args: [],
      query: "",
    };
    const items = await Array.fromAsync(source.collect(denops, params, {}));
    assertEquals(items, [
      { id: 1, value: "1", detail: { a: "" } },
      { id: 2, value: "2", detail: { a: "" } },
      { id: 3, value: "3", detail: { a: "" } },
    ]);
  });
});

Deno.test("composeSources", async (t) => {
  await t.step("with bear sources", async (t) => {
    await t.step("sources are applied in order", async () => {
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

    await t.step("without type constraint", () => {
      const source1 = defineSource(async function* () {});
      const source2 = defineSource(async function* () {});
      const source3 = defineSource(async function* () {});
      const source = composeSources(source2, source1, source3);
      assertType<IsExact<typeof source, Source<Detail>>>(true);
    });

    await t.step("with type constraint", () => {
      type C1 = { a: string };
      type C2 = { b: string };
      type C3 = { c: string };
      const source1 = defineSource<C1>(async function* () {});
      const source2 = defineSource<C2>(async function* () {});
      const source3 = defineSource<C3>(async function* () {});
      const source = composeSources(source2, source1, source3);
      assertType<IsExact<typeof source, Source<C1 | C2 | C3>>>(true);
    });
  });
});
