import { assertEquals } from "@std/assert";
import { DenopsStub } from "@denops/test/stub";
import { assertType, type IsExact } from "@std/testing/types";
import type { Detail } from "./item.ts";
import { composeCurators, type Curator, defineCurator } from "./curator.ts";

Deno.test("defineCurator", async (t) => {
  await t.step("without type contraint", async () => {
    const curator = defineCurator(async function* () {
      yield { id: 1, value: "1", detail: { a: "" } };
      yield { id: 2, value: "2", detail: { a: "" } };
      yield { id: 3, value: "3", detail: { a: "" } };
    });
    assertType<IsExact<typeof curator, Curator<{ a: string }>>>(true);
    const denops = new DenopsStub();
    const params = {
      args: [],
      query: "",
    };
    const items = await Array.fromAsync(curator.curate(denops, params, {}));
    assertEquals(items, [
      { id: 1, value: "1", detail: { a: "" } },
      { id: 2, value: "2", detail: { a: "" } },
      { id: 3, value: "3", detail: { a: "" } },
    ]);
  });

  await t.step("with type contraint", async () => {
    type C = { a: string };
    // @ts-expect-error: 'detail' does not follow the type constraint
    defineCurator<C>(async function* () {
      yield { id: 1, value: "1", detail: "invalid detail" };
    });
    const curator = defineCurator<C>(async function* () {
      yield { id: 1, value: "1", detail: { a: "" } };
      yield { id: 2, value: "2", detail: { a: "" } };
      yield { id: 3, value: "3", detail: { a: "" } };
    });
    assertType<IsExact<typeof curator, Curator<C>>>(true);
    const denops = new DenopsStub();
    const params = {
      args: [],
      query: "",
    };
    const items = await Array.fromAsync(curator.curate(denops, params, {}));
    assertEquals(items, [
      { id: 1, value: "1", detail: { a: "" } },
      { id: 2, value: "2", detail: { a: "" } },
      { id: 3, value: "3", detail: { a: "" } },
    ]);
  });
});

Deno.test("composeCurators", async (t) => {
  await t.step("with bear curators", async (t) => {
    await t.step("curators are applied in order", async () => {
      const results: string[] = [];
      const curator1 = defineCurator(async function* () {
        results.push("curator1");
        yield* Array.from({ length: 3 }).map((_, id) => ({
          id,
          value: `A-${id}`,
          detail: {
            a: id,
          },
        }));
      });
      const curator2 = defineCurator(async function* () {
        results.push("curator2");
        yield* Array.from({ length: 3 }).map((_, id) => ({
          id,
          value: `B-${id}`,
          detail: {
            b: id,
          },
        }));
      });
      const curator3 = defineCurator(async function* () {
        results.push("curator3");
        yield* Array.from({ length: 3 }).map((_, id) => ({
          id,
          value: `C-${id}`,
          detail: {
            c: id,
          },
        }));
      });
      const curator = composeCurators(curator2, curator1, curator3);
      const denops = new DenopsStub();
      const params = {
        args: [],
        query: "",
      };
      const items = await Array.fromAsync(curator.curate(denops, params, {}));
      assertEquals(results, ["curator2", "curator1", "curator3"]);
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
      const curator1 = defineCurator(async function* () {});
      const curator2 = defineCurator(async function* () {});
      const curator3 = defineCurator(async function* () {});
      const curator = composeCurators(curator2, curator1, curator3);
      assertType<IsExact<typeof curator, Curator<Detail>>>(true);
    });

    await t.step("with type constraint", () => {
      type C1 = { a: string };
      type C2 = { b: string };
      type C3 = { c: string };
      const curator1 = defineCurator<C1>(async function* () {});
      const curator2 = defineCurator<C2>(async function* () {});
      const curator3 = defineCurator<C3>(async function* () {});
      const curator = composeCurators(curator2, curator1, curator3);
      assertType<IsExact<typeof curator, Curator<C1 | C2 | C3>>>(true);
    });
  });
});
