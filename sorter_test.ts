import { assertEquals } from "@std/assert";
import { assertType, type IsExact } from "@std/testing/types";
import { DenopsStub } from "@denops/test/stub";
import { composeSorters, defineSorter, type Sorter } from "./sorter.ts";

Deno.test("defineSorter", () => {
  const sorter = defineSorter(async () => {});
  assertEquals(typeof sorter.sort, "function");
  assertType<IsExact<typeof sorter, Sorter<unknown>>>(true);
});

Deno.test("composeSorters", async () => {
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
      detail: undefined,
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
