import { assertEquals } from "@std/assert";
import { assertType, type IsExact } from "@std/testing/types";
import { DenopsStub } from "@denops/test/stub";

import { bindCuratorArgs, bindSourceArgs } from "./args_binder.ts";
import { defineSource } from "./source.ts";
import { defineCurator } from "./curator.ts";

Deno.test("bindSourceArgs", async (t) => {
  await t.step("with bear args", async (t) => {
    await t.step(
      "returns a source which calls another source with given fixed args",
      async () => {
        const baseSource = defineSource(
          async function* (_denops, params, _options) {
            yield* params.args.map((v, i) => ({ id: i, value: v, detail: {} }));
          },
        );
        const source = bindSourceArgs(
          baseSource,
          ["foo", "bar", "baz"],
        );
        const denops = new DenopsStub();
        const params = { args: [] };
        const items = await Array.fromAsync(source.collect(denops, params, {}));
        assertEquals(items, [
          { id: 0, value: "foo", detail: {} },
          { id: 1, value: "bar", detail: {} },
          { id: 2, value: "baz", detail: {} },
        ]);
      },
    );

    await t.step("check type constraint", () => {
      type C = { a: string };
      const baseSource = defineSource<C>(
        async function* (_denops, params, _options) {
          yield* params.args.map((v, i) => ({
            id: i,
            value: v,
            detail: { a: "" },
          }));
        },
      );
      bindSourceArgs<{ invalidTypeConstraint: number }>(
        // @ts-expect-error: The type of 'detail' does not match the above type constraint.
        baseSource,
        [],
      );
      const implicitlyTyped = bindSourceArgs(baseSource, []);
      const explicitlyTyped = bindSourceArgs<C>(baseSource, []);
      assertType<IsExact<typeof baseSource, typeof implicitlyTyped>>(true);
      assertType<IsExact<typeof baseSource, typeof explicitlyTyped>>(true);
    });
  });

  await t.step("with derivable args", async (t) => {
    await t.step(
      "returns a source which calls another source with given fixed args",
      async () => {
        const baseSource = defineSource(
          async function* (_denops, params, _options) {
            yield* params.args.map((v, i) => ({ id: i, value: v, detail: {} }));
          },
        );
        const source = bindSourceArgs(
          baseSource,
          (_denops) => ["foo", "bar", "baz"],
        );
        const denops = new DenopsStub();
        const params = { args: [] };
        const items = await Array.fromAsync(source.collect(denops, params, {}));
        assertEquals(items, [
          { id: 0, value: "foo", detail: {} },
          { id: 1, value: "bar", detail: {} },
          { id: 2, value: "baz", detail: {} },
        ]);
      },
    );

    await t.step("check type constraint", () => {
      type C = { a: string };
      const baseSource = defineSource<C>(
        async function* (_denops, params, _options) {
          yield* params.args.map((v, i) => ({
            id: i,
            value: v,
            detail: { a: "" },
          }));
        },
      );
      bindSourceArgs<{ invalidTypeConstraint: number }>(
        // @ts-expect-error: The type of 'detail' does not match the above type constraint.
        baseSource,
        (_denops) => [],
      );
      const implicitlyTyped = bindSourceArgs(baseSource, (_denops) => []);
      const explicitlyTyped = bindSourceArgs<C>(baseSource, (_denops) => []);
      assertType<IsExact<typeof baseSource, typeof implicitlyTyped>>(true);
      assertType<IsExact<typeof baseSource, typeof explicitlyTyped>>(true);
    });

    await t.step(
      "args provider is evaluated each time when items are collected",
      async () => {
        const baseSource = defineSource(
          async function* (_denops, params, _options) {
            yield* params.args.map((v, i) => ({ id: i, value: v, detail: {} }));
          },
        );
        let called = 0;
        const source = bindSourceArgs(
          baseSource,
          (_denops) => {
            called++;
            return ["foo", "bar", "baz"];
          },
        );
        const denops = new DenopsStub();
        const params = { args: [] };
        const items = await Array.fromAsync(source.collect(denops, params, {}));
        assertEquals(items, [
          { id: 0, value: "foo", detail: {} },
          { id: 1, value: "bar", detail: {} },
          { id: 2, value: "baz", detail: {} },
        ]);
        assertEquals(called, 1);
        await Array.fromAsync(source.collect(denops, params, {}));
        assertEquals(called, 2);
      },
    );
  });
});

Deno.test("bindCuratorArgs", async (t) => {
  await t.step("with bear args", async (t) => {
    await t.step(
      "returns a curator which calls another curator with given fixed args",
      async () => {
        const baseCurator = defineCurator(
          async function* (_denops, params, _options) {
            yield* params.args.map((v, i) => ({ id: i, value: v, detail: {} }));
          },
        );
        const curator = bindCuratorArgs(
          baseCurator,
          ["foo", "bar", "baz"],
        );
        const denops = new DenopsStub();
        const params = { args: [], query: "" };
        const items = await Array.fromAsync(
          curator.curate(denops, params, {}),
        );
        assertEquals(items, [
          { id: 0, value: "foo", detail: {} },
          { id: 1, value: "bar", detail: {} },
          { id: 2, value: "baz", detail: {} },
        ]);
      },
    );

    await t.step("check type constraint", () => {
      type C = { a: string };
      const baseCurator = defineCurator<C>(
        async function* (_denops, params, _options) {
          yield* params.args.map((v, i) => ({
            id: i,
            value: v,
            detail: { a: "" },
          }));
        },
      );
      bindCuratorArgs<{ invalidTypeConstraint: number }>(
        // @ts-expect-error: The type of 'detail' does not match the above type constraint.
        baseCurator,
        (_denops) => [],
      );
      const implicitlyTyped = bindCuratorArgs(baseCurator, []);
      const explicitlyTyped = bindCuratorArgs<C>(baseCurator, []);
      assertType<IsExact<typeof baseCurator, typeof implicitlyTyped>>(true);
      assertType<IsExact<typeof baseCurator, typeof explicitlyTyped>>(true);
    });
  });

  await t.step("with derivable args", async (t) => {
    await t.step(
      "returns a curator which calls another curator with given fixed args",
      async () => {
        const baseCurator = defineCurator(
          async function* (_denops, params, _options) {
            yield* params.args.map((v, i) => ({ id: i, value: v, detail: {} }));
          },
        );
        const curator = bindCuratorArgs(
          baseCurator,
          (_denops) => ["foo", "bar", "baz"],
        );
        const denops = new DenopsStub();
        const params = { args: [], query: "" };
        const items = await Array.fromAsync(
          curator.curate(denops, params, {}),
        );
        assertEquals(items, [
          { id: 0, value: "foo", detail: {} },
          { id: 1, value: "bar", detail: {} },
          { id: 2, value: "baz", detail: {} },
        ]);
      },
    );

    await t.step("check type constraint", () => {
      type C = { a: string };
      const baseCurator = defineCurator<C>(
        async function* (_denops, params, _options) {
          yield* params.args.map((v, i) => ({
            id: i,
            value: v,
            detail: { a: "" },
          }));
        },
      );
      bindCuratorArgs<{ invalidTypeConstraint: number }>(
        // @ts-expect-error: The type of 'detail' does not match the above type constraint.
        baseCurator,
        [],
      );
      const implicitlyTyped = bindCuratorArgs(baseCurator, (_denops) => []);
      const explicitlyTyped = bindCuratorArgs<C>(baseCurator, (_denops) => []);
      assertType<IsExact<typeof baseCurator, typeof implicitlyTyped>>(true);
      assertType<IsExact<typeof baseCurator, typeof explicitlyTyped>>(true);
    });

    await t.step(
      "args provider is evaluated each time when items are collected",
      async () => {
        const baseCurator = defineCurator(
          async function* (_denops, params, _options) {
            yield* params.args.map((v, i) => ({ id: i, value: v, detail: {} }));
          },
        );
        let called = 0;
        const curator = bindCuratorArgs(
          baseCurator,
          (_denops) => {
            called++;
            return ["foo", "bar", "baz"];
          },
        );
        const denops = new DenopsStub();
        const params = { args: [], query: "" };
        const items = await Array.fromAsync(
          curator.curate(denops, params, {}),
        );
        assertEquals(items, [
          { id: 0, value: "foo", detail: {} },
          { id: 1, value: "bar", detail: {} },
          { id: 2, value: "baz", detail: {} },
        ]);
        assertEquals(called, 1);
        await Array.fromAsync(curator.curate(denops, params, {}));
        assertEquals(called, 2);
      },
    );
  });
});
