import { assertEquals } from "@std/assert";
import { type AssertTrue, assertType, type IsExact } from "@std/testing/types";
import { DenopsStub } from "@denops/test/stub";
import type { DetailUnit } from "./item.ts";
import {
  composeSorters,
  defineSorter,
  type Sorter,
  type SortParams,
} from "./sorter.ts";

Deno.test("defineSorter", async (t) => {
  await t.step("without type contraint", () => {
    const sorter = defineSorter((_denops, params) => {
      type _ = AssertTrue<IsExact<typeof params, SortParams<DetailUnit>>>;
    });
    assertType<IsExact<typeof sorter, Sorter<DetailUnit>>>(true);
  });

  await t.step("with type contraint", () => {
    type C = { a: string };
    const sorter = defineSorter<C>((_denops, params) => {
      type _ = AssertTrue<IsExact<typeof params, SortParams<C>>>;
    });
    assertType<IsExact<typeof sorter, Sorter<C>>>(true);
  });
});

Deno.test("composeSorters", async (t) => {
  await t.step("with bear sorters", async (t) => {
    await t.step("sorters are applied in order", async () => {
      const results: string[] = [];
      const sorter1 = defineSorter((_denops, { items }) => {
        results.push("sorter1");
        items.sort((a, b) => a.value.localeCompare(b.value));
      });
      const sorter2 = defineSorter((_denops, { items }) => {
        results.push("sorter2");
        items.sort((a, b) => a.value.localeCompare(b.value));
      });
      const sorter3 = defineSorter((_denops, { items }) => {
        results.push("sorter3");
        items.sort((a, b) => b.value.localeCompare(a.value));
      });
      const sorter = composeSorters(sorter2, sorter1, sorter3);
      const denops = new DenopsStub();
      const params = {
        items: Array.from({ length: 10 }).map((_, id) => ({
          id,
          value: id.toString(),
          detail: {},
        })),
      };
      await sorter.sort(denops, params, {});
      assertEquals(results, ["sorter2", "sorter1", "sorter3"]);
      assertEquals(params.items.map((v) => v.value), [
        "9",
        "8",
        "7",
        "6",
        "5",
        "4",
        "3",
        "2",
        "1",
        "0",
      ]);
    });

    await t.step("without type constraint", () => {
      const sorter1 = defineSorter(() => {});
      const sorter2 = defineSorter(() => {});
      const sorter3 = defineSorter(() => {});
      const sorter = composeSorters(sorter1, sorter2, sorter3);
      assertType<IsExact<typeof sorter, Sorter<DetailUnit>>>(true);
    });

    await t.step("with type constraint", () => {
      type C = { a: string };
      const sorter1 = defineSorter<C>(() => {});
      const sorter2 = defineSorter<C>(() => {});
      const sorter3 = defineSorter<C>(() => {});
      const sorter = composeSorters(sorter1, sorter2, sorter3);
      assertType<IsExact<typeof sorter, Sorter<C>>>(true);
    });
  });
});
