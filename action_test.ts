import { assertEquals } from "@std/assert";
import { type AssertTrue, assertType, type IsExact } from "@std/testing/types";
import { DenopsStub } from "@denops/test/stub";
import type { DetailUnit } from "./item.ts";
import {
  type Action,
  composeActions,
  defineAction,
  type InvokeParams,
} from "./action.ts";

Deno.test("defineAction", async (t) => {
  await t.step("without type contraint", () => {
    const action = defineAction((_denops, params) => {
      type _ = AssertTrue<IsExact<typeof params, InvokeParams<DetailUnit>>>;
    });
    assertType<IsExact<typeof action, Action<DetailUnit>>>(true);
  });

  await t.step("with type contraint", () => {
    type C = { a: string };
    const action = defineAction<C>((_denops, params) => {
      type _ = AssertTrue<IsExact<typeof params, InvokeParams<C>>>;
    });
    assertType<IsExact<typeof action, Action<C>>>(true);
  });
});

Deno.test("composeActions", async (t) => {
  await t.step("with bear actions", async (t) => {
    await t.step("actions are invoked in order", async () => {
      const results: string[] = [];
      const action1 = defineAction(() => void results.push("action1"));
      const action2 = defineAction(() => void results.push("action2"));
      const action3 = defineAction(() => void results.push("action3"));
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

    await t.step("without type contraint", () => {
      const action1 = defineAction(() => {});
      const action2 = defineAction(() => {});
      const action3 = defineAction(() => {});
      const action = composeActions(action2, action1, action3);
      assertType<IsExact<typeof action, Action<DetailUnit>>>(true);
    });

    await t.step("with type contraint", () => {
      type C = { a: string };
      const action1 = defineAction<C>(() => {});
      const action2 = defineAction<C>(() => {});
      const action3 = defineAction<C>(() => {});
      const action = composeActions(action2, action1, action3);
      assertType<IsExact<typeof action, Action<C>>>(true);
    });
  });

  await t.step("with derivable actions", async (t) => {
    await t.step("actions are invoked in order", async () => {
      const results: string[] = [];
      const action1 = () => defineAction(() => void results.push("action1"));
      const action2 = () => defineAction(() => void results.push("action2"));
      const action3 = () => defineAction(() => void results.push("action3"));
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

    await t.step("without type contraint", () => {
      const action1 = () => defineAction(() => {});
      const action2 = () => defineAction(() => {});
      const action3 = () => defineAction(() => {});
      const action = composeActions(action2, action1, action3);
      assertType<IsExact<typeof action, Action<DetailUnit>>>(true);
    });

    await t.step("with type contraint", () => {
      type C = { a: string };
      const action1 = () => defineAction<C>(() => {});
      const action2 = () => defineAction<C>(() => {});
      const action3 = () => defineAction<C>(() => {});
      const action = composeActions(action2, action1, action3);
      assertType<IsExact<typeof action, Action<C>>>(true);
    });
  });
});
