import { assertEquals } from "@std/assert";
import { type AssertTrue, assertType, type IsExact } from "@std/testing/types";
import { toAsyncIterable } from "@core/iterutil/async/to-async-iterable";
import { DenopsStub } from "@denops/test/stub";

import type { DetailUnit } from "./item.ts";
import { defineSource, type Source } from "./source.ts";
import { type Curator, defineCurator } from "./curator.ts";
import {
  composeRefiners,
  defineRefiner,
  refineCurator,
  type RefineParams,
  type Refiner,
  refineSource,
} from "./refiner.ts";

type RefinerA<T> = T extends Refiner<infer A, infer _> ? A : never;
type RefinerB<T> = T extends Refiner<infer _, infer B> ? B : never;

Deno.test("defineRefiner", async (t) => {
  await t.step("without type contraint", () => {
    const refiner = defineRefiner(async function* (_denops, params) {
      type _ = AssertTrue<IsExact<typeof params, RefineParams<DetailUnit>>>;
      yield* [];
    });
    assertType<IsExact<typeof refiner, Refiner<DetailUnit>>>(true);
  });

  await t.step("with type contraint", () => {
    type C = { a: string };
    const refiner = defineRefiner<C>(async function* (_denops, params) {
      type _ = AssertTrue<IsExact<typeof params, RefineParams<C>>>;
      yield* [];
    });
    assertType<IsExact<typeof refiner, Refiner<C>>>(true);
  });
});

Deno.test("composeRefiners", async (t) => {
  await t.step("with bear refiners", async (t) => {
    await t.step("refiners are applied in order", async () => {
      const results: string[] = [];
      const refiner1 = defineRefiner<
        { a: string },
        { b: string; B: string }
      >(
        async function* (_denops, { items }) {
          results.push("refiner1");
          for await (const item of items) {
            yield {
              ...item,
              detail: {
                ...item.detail,
                b: "Hello",
                B: "World",
              },
            };
          }
        },
      );
      const refiner2 = defineRefiner<
        { b: string },
        { c: string; C: string }
      >(
        async function* (_denops, { items }) {
          results.push("refiner2");
          for await (const item of items) {
            yield {
              ...item,
              detail: {
                ...item.detail,
                c: "Hello",
                C: "World",
              },
            };
          }
        },
      );
      const refiner3 = defineRefiner<
        { c: string },
        { d: string; D: string }
      >(
        async function* (_denops, { items }) {
          results.push("refiner3");
          for await (const item of items) {
            yield {
              ...item,
              detail: {
                ...item.detail,
                d: "Hello",
                D: "World",
              },
            };
          }
        },
      );
      const refiner = composeRefiners(refiner1, refiner2, refiner3);
      const denops = new DenopsStub();
      const params = {
        items: toAsyncIterable([{
          id: 0,
          value: "123",
          detail: {
            a: "Hello",
            A: "World",
          },
        }]),
      };
      const items = await Array.fromAsync(refiner.refine(denops, params, {}));
      assertEquals(results, ["refiner3", "refiner2", "refiner1"]);
      assertEquals(items, [{
        id: 0,
        value: "123",
        detail: {
          a: "Hello",
          A: "World",
          b: "Hello",
          B: "World",
          c: "Hello",
          C: "World",
          d: "Hello",
          D: "World",
        },
      }]);
    });

    await t.step("without type constraint", () => {
      const refiner1 = defineRefiner(async function* () {});
      const refiner2 = defineRefiner(async function* () {});
      const refiner3 = defineRefiner(async function* () {});
      const refiner = composeRefiners(refiner1, refiner2, refiner3);
      assertType<IsExact<typeof refiner, Refiner<DetailUnit>>>(true);
    });

    await t.step("with type constraint", () => {
      type C1 = { a: string };
      type C2 = { b: string };
      type C3 = { c: string };
      type C4 = { d: string };
      const refiner1 = defineRefiner<C1, C2>(async function* () {});
      const refiner2 = defineRefiner<C2, C3>(async function* () {});
      const refiner3 = defineRefiner<C3, C4>(async function* () {});
      composeRefiners(
        refiner2,
        // @ts-expect-error: refiner1 requires C1 but C3 is provided
        refiner1,
        refiner3,
      );
      const refiner = composeRefiners(refiner1, refiner2, refiner3);
      // NOTE:
      // It seems `IsExact` could not properly compare the `Refiner` type
      // so compare extracted types instead.
      assertType<IsExact<RefinerA<typeof refiner>, C1>>(true);
      assertType<
        IsExact<RefinerB<typeof refiner>, {
          b: string;
          c: string;
          d: string;
        }>
      >(true);
    });

    await t.step("with type constraint (extra attributes)", () => {
      type C1 = { a: string };
      type C2 = { b: string };
      type C3 = { c: string };
      type C4 = { d: string };
      const refiner1 = defineRefiner<C1, C2 & { B: string }>(
        async function* () {},
      );
      const refiner2 = defineRefiner<C2, C3 & { C: string }>(
        async function* () {},
      );
      const refiner3 = defineRefiner<C3, C4 & { D: string }>(
        async function* () {},
      );
      composeRefiners(
        refiner2,
        // @ts-expect-error: refiner1 requires C1 but C3 is provided
        refiner1,
        refiner3,
      );
      const refiner = composeRefiners(refiner1, refiner2, refiner3);
      // NOTE:
      // It seems `IsExact` could not properly compare the `Refiner` type
      // so compare extracted types instead.
      assertType<IsExact<RefinerA<typeof refiner>, C1>>(true);
      assertType<
        IsExact<RefinerB<typeof refiner>, {
          b: string;
          c: string;
          d: string;
          B: string;
          C: string;
          D: string;
        }>
      >(true);
    });
  });

  await t.step("with derivable refiners", async (t) => {
    await t.step("refiners are applied in order", async () => {
      const results: string[] = [];
      const refiner1 = () =>
        defineRefiner<
          { a: string },
          { b: string; B: string }
        >(
          async function* (_denops, { items }) {
            results.push("refiner1");
            for await (const item of items) {
              yield {
                ...item,
                detail: {
                  ...item.detail,
                  b: "Hello",
                  B: "World",
                },
              };
            }
          },
        );
      const refiner2 = () =>
        defineRefiner<
          { b: string },
          { c: string; C: string }
        >(
          async function* (_denops, { items }) {
            results.push("refiner2");
            for await (const item of items) {
              yield {
                ...item,
                detail: {
                  ...item.detail,
                  c: "Hello",
                  C: "World",
                },
              };
            }
          },
        );
      const refiner3 = () =>
        defineRefiner<
          { c: string },
          { d: string; D: string }
        >(
          async function* (_denops, { items }) {
            results.push("refiner3");
            for await (const item of items) {
              yield {
                ...item,
                detail: {
                  ...item.detail,
                  d: "Hello",
                  D: "World",
                },
              };
            }
          },
        );
      const refiner = composeRefiners(refiner1, refiner2, refiner3);
      const denops = new DenopsStub();
      const params = {
        items: toAsyncIterable([{
          id: 0,
          value: "123",
          detail: {
            a: "Hello",
            A: "World",
          },
        }]),
      };
      const items = await Array.fromAsync(refiner.refine(denops, params, {}));
      assertEquals(results, ["refiner3", "refiner2", "refiner1"]);
      assertEquals(items, [{
        id: 0,
        value: "123",
        detail: {
          a: "Hello",
          A: "World",
          b: "Hello",
          B: "World",
          c: "Hello",
          C: "World",
          d: "Hello",
          D: "World",
        },
      }]);
    });

    await t.step("without type constraint", () => {
      const refiner1 = () => defineRefiner(async function* () {});
      const refiner2 = () => defineRefiner(async function* () {});
      const refiner3 = () => defineRefiner(async function* () {});
      const refiner = composeRefiners(refiner1, refiner2, refiner3);
      assertType<IsExact<typeof refiner, Refiner<DetailUnit>>>(true);
    });

    await t.step("with type constraint", () => {
      type C1 = { a: string };
      type C2 = { b: string };
      type C3 = { c: string };
      type C4 = { d: string };
      const refiner1 = () => defineRefiner<C1, C2>(async function* () {});
      const refiner2 = () => defineRefiner<C2, C3>(async function* () {});
      const refiner3 = () => defineRefiner<C3, C4>(async function* () {});
      composeRefiners(
        refiner2,
        // @ts-expect-error: refiner1 requires C1 but C3 is provided
        refiner1,
        refiner3,
      );
      const refiner = composeRefiners(refiner1, refiner2, refiner3);
      // NOTE:
      // It seems `IsExact` could not properly compare the `Refiner` type
      // so compare extracted types instead.
      assertType<IsExact<RefinerA<typeof refiner>, C1>>(true);
      assertType<
        IsExact<RefinerB<typeof refiner>, {
          b: string;
          c: string;
          d: string;
        }>
      >(true);
    });

    await t.step("with type constraint (extra attributes)", () => {
      type C1 = { a: string };
      type C2 = { b: string };
      type C3 = { c: string };
      type C4 = { d: string };
      const refiner1 = () =>
        defineRefiner<C1, C2 & { B: string }>(
          async function* () {},
        );
      const refiner2 = () =>
        defineRefiner<C2, C3 & { C: string }>(
          async function* () {},
        );
      const refiner3 = () =>
        defineRefiner<C3, C4 & { D: string }>(
          async function* () {},
        );
      composeRefiners(
        refiner2,
        // @ts-expect-error: refiner1 requires C1 but C3 is provided
        refiner1,
        refiner3,
      );
      const refiner = composeRefiners(refiner1, refiner2, refiner3);
      // NOTE:
      // It seems `IsExact` could not properly compare the `Refiner` type
      // so compare extracted types instead.
      assertType<IsExact<RefinerA<typeof refiner>, C1>>(true);
      assertType<
        IsExact<RefinerB<typeof refiner>, {
          b: string;
          c: string;
          d: string;
          B: string;
          C: string;
          D: string;
        }>
      >(true);
    });

    await t.step("with type constraint (complicated)", () => {
      const refiner1 = () =>
        defineRefiner<{ a: string }, { a: string; A: string }>(
          async function* () {},
        );
      const refiner2 = () =>
        defineRefiner(
          async function* () {},
        );
      const refiner3 = () =>
        defineRefiner<{ A: string }, { B: string }>(
          async function* () {},
        );
      composeRefiners(
        refiner2,
        // @ts-expect-error: refiner1 requires C1 but C3 is provided
        refiner1,
        refiner3,
      );
      const refiner = composeRefiners(refiner1, refiner2, refiner3);
      // NOTE:
      // It seems `IsExact` could not properly compare the `Refiner` type
      // so compare extracted types instead.
      assertType<IsExact<RefinerA<typeof refiner>, { a: string }>>(true);
      assertType<
        IsExact<RefinerB<typeof refiner>, {
          a: string;
          A: string;
          B: string;
        }>
      >(true);
    });
  });
});

Deno.test("refineSource", async (t) => {
  await t.step("with bear refiners", async (t) => {
    await t.step(
      "returns a source that is refined by the refiners",
      async () => {
        const source = defineSource(async function* () {
          yield* Array.from({ length: 5 }).map((_, id) => ({
            id,
            value: id.toString(),
            detail: { a: "Hello", b: "World" },
          }));
        });
        // Modifier
        const refiner1 = defineRefiner<{ a: string }, { a: string; A: string }>(
          async function* (_denops, { items }) {
            for await (const item of items) {
              yield {
                ...item,
                detail: {
                  ...item.detail,
                  a: item.detail.a.toUpperCase(),
                  A: item.detail.a,
                },
              };
            }
          },
        );
        // Filter
        const refiner2 = defineRefiner(
          async function* (_denops, { items }) {
            for await (const item of items) {
              if (typeof item.id === "number" && item.id % 2 === 0) continue;
              yield item;
            }
          },
        );
        // Annotator
        const refiner3 = defineRefiner<{ A: string }, { B: string }>(
          async function* (_denops, { items }) {
            for await (const item of items) {
              yield {
                ...item,
                detail: { ...item.detail, B: item.detail.A.repeat(3) },
              };
            }
          },
        );
        const refinedSource = refineSource(
          source,
          refiner1,
          refiner2,
          refiner3,
        );
        const denops = new DenopsStub();
        const params = {
          args: [],
        };
        const items = await Array.fromAsync(
          refinedSource.collect(denops, params, {}),
        );
        assertEquals(items, [
          {
            detail: {
              A: "Hello",
              B: "HelloHelloHello",
              a: "HELLO",
              b: "World",
            },
            id: 1,
            value: "1",
          },
          {
            detail: {
              A: "Hello",
              B: "HelloHelloHello",
              a: "HELLO",
              b: "World",
            },
            id: 3,
            value: "3",
          },
        ]);
      },
    );

    await t.step("check type constraint", () => {
      const source = defineSource<{ a: string; b: string }>(
        async function* () {},
      );
      const refiner1 = defineRefiner<{ a: string }, { a: string; A: string }>(
        async function* () {},
      );
      const refiner2 = defineRefiner(async function* () {});
      const refiner3 = defineRefiner<{ A: string }, { B: string }>(
        async function* () {},
      );
      const refinedSource = refineSource(source, refiner1, refiner2, refiner3);
      assertType<
        IsExact<
          typeof refinedSource,
          Source<{ a: string; b: string; A: string; B: string }>
        >
      >(
        true,
      );
    });
  });

  await t.step("with derivable refiners", async (t) => {
    await t.step(
      "returns a source that is refined by the refiners",
      async () => {
        const source = () =>
          defineSource(async function* () {
            yield* Array.from({ length: 5 }).map((_, id) => ({
              id,
              value: id.toString(),
              detail: { a: "Hello", b: "World" },
            }));
          });
        // Modifier
        const refiner1 = () =>
          defineRefiner<{ a: string }, { a: string; A: string }>(
            async function* (_denops, { items }) {
              for await (const item of items) {
                yield {
                  ...item,
                  detail: {
                    ...item.detail,
                    a: item.detail.a.toUpperCase(),
                    A: item.detail.a,
                  },
                };
              }
            },
          );
        // Filter
        const refiner2 = () =>
          defineRefiner(
            async function* (_denops, { items }) {
              for await (const item of items) {
                if (typeof item.id === "number" && item.id % 2 === 0) continue;
                yield item;
              }
            },
          );
        // Annotator
        const refiner3 = () =>
          defineRefiner<{ A: string }, { B: string }>(
            async function* (_denops, { items }) {
              for await (const item of items) {
                yield {
                  ...item,
                  detail: { ...item.detail, B: item.detail.A.repeat(3) },
                };
              }
            },
          );
        const refinedSource = refineSource(
          source,
          refiner1,
          refiner2,
          refiner3,
        );
        const denops = new DenopsStub();
        const params = {
          args: [],
        };
        const items = await Array.fromAsync(
          refinedSource.collect(denops, params, {}),
        );
        assertEquals(items, [
          {
            detail: {
              A: "Hello",
              B: "HelloHelloHello",
              a: "HELLO",
              b: "World",
            },
            id: 1,
            value: "1",
          },
          {
            detail: {
              A: "Hello",
              B: "HelloHelloHello",
              a: "HELLO",
              b: "World",
            },
            id: 3,
            value: "3",
          },
        ]);
      },
    );

    await t.step("check type constraint", () => {
      const source = () =>
        defineSource<{ a: string; b: string }>(
          async function* () {},
        );
      const refiner1 = () =>
        defineRefiner<{ a: string }, { a: string; A: string }>(
          async function* () {},
        );
      const refiner2 = () => defineRefiner(async function* () {});
      const refiner3 = () =>
        defineRefiner<{ A: string }, { B: string }>(
          async function* () {},
        );
      const refinedSource = refineSource(source, refiner1, refiner2, refiner3);
      assertType<
        IsExact<
          typeof refinedSource,
          Source<{ a: string; b: string; A: string; B: string }>
        >
      >(
        true,
      );
    });
  });
});

Deno.test("refineCurator", async (t) => {
  await t.step("with bear refiners", async (t) => {
    await t.step(
      "returns a curator that is refined by the refiners",
      async () => {
        const curator = defineCurator(async function* () {
          yield* Array.from({ length: 5 }).map((_, id) => ({
            id,
            value: id.toString(),
            detail: { a: "Hello", b: "World" },
          }));
        });
        // Modifier
        const refiner1 = defineRefiner<{ a: string }, { a: string; A: string }>(
          async function* (_denops, { items }) {
            for await (const item of items) {
              yield {
                ...item,
                detail: {
                  ...item.detail,
                  a: item.detail.a.toUpperCase(),
                  A: item.detail.a,
                },
              };
            }
          },
        );
        // Filter
        const refiner2 = defineRefiner(
          async function* (_denops, { items }) {
            for await (const item of items) {
              if (typeof item.id === "number" && item.id % 2 === 0) continue;
              yield item;
            }
          },
        );
        // Annotator
        const refiner3 = defineRefiner<{ A: string }, { B: string }>(
          async function* (_denops, { items }) {
            for await (const item of items) {
              yield {
                ...item,
                detail: { ...item.detail, B: item.detail.A.repeat(3) },
              };
            }
          },
        );
        const refinedCurator = refineCurator(
          curator,
          refiner1,
          refiner2,
          refiner3,
        );
        const denops = new DenopsStub();
        const params = {
          args: [],
          query: "",
        };
        const items = await Array.fromAsync(
          refinedCurator.curate(denops, params, {}),
        );
        assertEquals(items, [
          {
            detail: {
              A: "Hello",
              B: "HelloHelloHello",
              a: "HELLO",
              b: "World",
            },
            id: 1,
            value: "1",
          },
          {
            detail: {
              A: "Hello",
              B: "HelloHelloHello",
              a: "HELLO",
              b: "World",
            },
            id: 3,
            value: "3",
          },
        ]);
      },
    );

    await t.step("check type constraint", () => {
      const curator = defineCurator<{ a: string; b: string }>(
        async function* () {},
      );
      const refiner1 = defineRefiner<{ a: string }, { a: string; A: string }>(
        async function* () {},
      );
      const refiner2 = defineRefiner(async function* () {});
      const refiner3 = defineRefiner<{ A: string }, { B: string }>(
        async function* () {},
      );
      const refinedCurator = refineCurator(
        curator,
        refiner1,
        refiner2,
        refiner3,
      );
      assertType<
        IsExact<
          typeof refinedCurator,
          Curator<{ a: string; b: string; A: string; B: string }>
        >
      >(
        true,
      );
    });
  });

  await t.step("with derivable refiners", async (t) => {
    await t.step(
      "returns a curator that is refined by the refiners",
      async () => {
        const curator = () =>
          defineCurator(async function* () {
            yield* Array.from({ length: 5 }).map((_, id) => ({
              id,
              value: id.toString(),
              detail: { a: "Hello", b: "World" },
            }));
          });
        // Modifier
        const refiner1 = () =>
          defineRefiner<{ a: string }, { a: string; A: string }>(
            async function* (_denops, { items }) {
              for await (const item of items) {
                yield {
                  ...item,
                  detail: {
                    ...item.detail,
                    a: item.detail.a.toUpperCase(),
                    A: item.detail.a,
                  },
                };
              }
            },
          );
        // Filter
        const refiner2 = () =>
          defineRefiner(
            async function* (_denops, { items }) {
              for await (const item of items) {
                if (typeof item.id === "number" && item.id % 2 === 0) continue;
                yield item;
              }
            },
          );
        // Annotator
        const refiner3 = () =>
          defineRefiner<{ A: string }, { B: string }>(
            async function* (_denops, { items }) {
              for await (const item of items) {
                yield {
                  ...item,
                  detail: { ...item.detail, B: item.detail.A.repeat(3) },
                };
              }
            },
          );
        const refinedCurator = refineCurator(
          curator,
          refiner1,
          refiner2,
          refiner3,
        );
        const denops = new DenopsStub();
        const params = {
          args: [],
          query: "",
        };
        const items = await Array.fromAsync(
          refinedCurator.curate(denops, params, {}),
        );
        assertEquals(items, [
          {
            detail: {
              A: "Hello",
              B: "HelloHelloHello",
              a: "HELLO",
              b: "World",
            },
            id: 1,
            value: "1",
          },
          {
            detail: {
              A: "Hello",
              B: "HelloHelloHello",
              a: "HELLO",
              b: "World",
            },
            id: 3,
            value: "3",
          },
        ]);
      },
    );

    await t.step("check type constraint", () => {
      const curator = () =>
        defineCurator<{ a: string; b: string }>(
          async function* () {},
        );
      const refiner1 = () =>
        defineRefiner<{ a: string }, { a: string; A: string }>(
          async function* () {},
        );
      const refiner2 = () => defineRefiner(async function* () {});
      const refiner3 = () =>
        defineRefiner<{ A: string }, { B: string }>(
          async function* () {},
        );
      const refinedCurator = refineCurator(
        curator,
        refiner1,
        refiner2,
        refiner3,
      );
      assertType<
        IsExact<
          typeof refinedCurator,
          Curator<{ a: string; b: string; A: string; B: string }>
        >
      >(
        true,
      );
    });
  });
});
