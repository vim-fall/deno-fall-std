import { assertEquals } from "@std/assert";
import { assertType, type IsExact } from "@std/testing/types";
import { DenopsStub } from "@denops/test/stub";
import { range } from "@core/iterutil";
import { map } from "@core/iterutil/async";
import {
  composeProjectors,
  defineProjector,
  pipeProjectors,
  type Projector,
} from "./projector.ts";
import { defineSource, type Source } from "./source.ts";
import { type Curator, defineCurator } from "./curator.ts";

Deno.test("defineProjector", () => {
  const projector = defineProjector(async function* () {});
  assertEquals(typeof projector.project, "function");
  assertType<IsExact<typeof projector, Projector<unknown>>>(true);
});

Deno.test("composeProjectors", async () => {
  const results: string[] = [];
  const projector1 = defineProjector(
    async function* (_denops, { items }) {
      results.push("projector1");
      yield* map(items, (item) => ({
        ...item,
        detail: {
          a: item.detail,
        },
      }));
    },
  );
  const projector2 = defineProjector(
    async function* (_denops, { items }) {
      results.push("projector2");
      yield* map(items, (item) => ({
        ...item,
        detail: {
          b: item.detail,
        },
      }));
    },
  );
  const projector3 = defineProjector(
    async function* (_denops, { items }) {
      results.push("projector3");
      yield* map(items, (item) => ({
        ...item,
        detail: {
          c: item.detail,
        },
      }));
    },
  );
  const projector = composeProjectors(projector2, projector1, projector3);
  assertType<
    IsExact<
      typeof projector,
      Projector<unknown, { c: unknown }>
    >
  >(true);
  const denops = new DenopsStub();
  const params = {
    items: map(range(1, 3), (id) => ({
      id,
      value: `item-${id}`,
      detail: undefined,
    })),
  };
  const items = await Array.fromAsync(projector.project(denops, params, {}));
  assertEquals(results, ["projector3", "projector1", "projector2"]);
  assertEquals(items, [
    {
      id: 1,
      value: "item-1",
      detail: {
        c: {
          a: {
            b: undefined,
          },
        },
      },
    },
    {
      id: 2,
      value: "item-2",
      detail: {
        c: {
          a: {
            b: undefined,
          },
        },
      },
    },
    {
      id: 3,
      value: "item-3",
      detail: {
        c: {
          a: {
            b: undefined,
          },
        },
      },
    },
  ]);
});

Deno.test("pipeProjectors", async (t) => {
  const projector1 = defineProjector(
    async function* (_denops, { items }) {
      yield* map(items, (item) => ({
        ...item,
        detail: {
          a: item.detail,
        },
      }));
    },
  );
  const projector2 = defineProjector(
    async function* (_denops, { items }) {
      yield* map(items, (item) => ({
        ...item,
        detail: {
          b: item.detail,
        },
      }));
    },
  );
  const projector3 = defineProjector(
    async function* (_denops, { items }) {
      yield* map(items, (item) => ({
        ...item,
        detail: {
          c: item.detail,
        },
      }));
    },
  );

  await t.step("Source", async () => {
    const source = defineSource(async function* () {
      yield* map(range(1, 3), (id) => ({
        id,
        value: `item-${id}`,
        detail: undefined,
      }));
    });
    const pipedSource = pipeProjectors(
      source,
      projector2,
      projector1,
      projector3,
    );
    assertType<IsExact<typeof pipedSource, Source<{ c: unknown }>>>(true);
    const denops = new DenopsStub();
    const params = {
      args: [],
    };
    const items = await Array.fromAsync(
      pipedSource.collect(denops, params, {}),
    );
    assertEquals(items, [
      {
        id: 1,
        value: "item-1",
        detail: {
          c: {
            a: {
              b: undefined,
            },
          },
        },
      },
      {
        id: 2,
        value: "item-2",
        detail: {
          c: {
            a: {
              b: undefined,
            },
          },
        },
      },
      {
        id: 3,
        value: "item-3",
        detail: {
          c: {
            a: {
              b: undefined,
            },
          },
        },
      },
    ]);
  });

  await t.step("Curator", async () => {
    const curator = defineCurator(async function* () {
      yield* map(range(1, 3), (id) => ({
        id,
        value: `item-${id}`,
        detail: undefined,
      }));
    });
    const pipedCurator = pipeProjectors(
      curator,
      projector2,
      projector1,
      projector3,
    );
    assertType<IsExact<typeof pipedCurator, Curator<{ c: unknown }>>>(true);
    const denops = new DenopsStub();
    const params = {
      args: [],
      query: "",
    };
    const items = await Array.fromAsync(
      pipedCurator.curate(denops, params, {}),
    );
    assertEquals(items, [
      {
        id: 1,
        value: "item-1",
        detail: {
          c: {
            a: {
              b: undefined,
            },
          },
        },
      },
      {
        id: 2,
        value: "item-2",
        detail: {
          c: {
            a: {
              b: undefined,
            },
          },
        },
      },
      {
        id: 3,
        value: "item-3",
        detail: {
          c: {
            a: {
              b: undefined,
            },
          },
        },
      },
    ]);
  });
});
