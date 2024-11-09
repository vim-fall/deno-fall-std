import { assertEquals } from "@std/assert";
import { assertType, type IsExact } from "@std/testing/types";
import { type Curator, defineCurator } from "./curator.ts";

Deno.test("defineCurator", () => {
  const curator = defineCurator(async function* () {});
  assertEquals(typeof curator.curate, "function");
  assertType<IsExact<typeof curator, Curator<unknown>>>(true);
});
