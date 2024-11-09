import { assertEquals } from "@std/assert";
import { assertType, type IsExact } from "@std/testing/types";
import { DenopsStub } from "@denops/test/stub";
import { type Action, composeActions, defineAction } from "./action.ts";

Deno.test("defineAction", () => {
  const action = defineAction(async () => {});
  assertEquals(typeof action.invoke, "function");
  assertType<IsExact<typeof action, Action<unknown>>>(true);
});

Deno.test("composeActions", async () => {
  const results: string[] = [];
  const action1 = defineAction(() => {
    results.push("action1");
  });
  const action2 = defineAction(() => {
    results.push("action2");
  });
  const action3 = defineAction(() => {
    results.push("action3");
  });
  const action = composeActions(action2, action1, action3);
  const denops = new DenopsStub();
  const params = {
    item: undefined,
    selectedItems: [],
    filteredItems: [],
  };
  await action.invoke(denops, params, {});
  assertEquals(results, ["action2", "action1", "action3"]);
});
