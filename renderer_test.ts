import { assertEquals } from "@std/assert";
import { type AssertTrue, assertType, type IsExact } from "@std/testing/types";
import { DenopsStub } from "@denops/test/stub";
import type { DetailUnit } from "./item.ts";
import {
  composeRenderers,
  defineRenderer,
  type Renderer,
  type RenderParams,
} from "./renderer.ts";

Deno.test("defineRenderer", async (t) => {
  await t.step("without type contraint", () => {
    const renderer = defineRenderer((_denops, params) => {
      type _ = AssertTrue<IsExact<typeof params, RenderParams<DetailUnit>>>;
    });
    assertType<IsExact<typeof renderer, Renderer<DetailUnit>>>(true);
  });

  await t.step("with type contraint", () => {
    type C = { a: string };
    const renderer = defineRenderer<C>((_denops, params) => {
      type _ = AssertTrue<IsExact<typeof params, RenderParams<C>>>;
    });
    assertType<IsExact<typeof renderer, Renderer<C>>>(true);
  });
});

Deno.test("composeRenderers", async (t) => {
  await t.step("with bear renderers", async (t) => {
    await t.step("renderers are applied in order", async () => {
      const results: string[] = [];
      const renderer1 = defineRenderer((_denops, { items }) => {
        results.push("renderer1");
        items.forEach((item) => {
          item.label = `${item.label}-1`;
        });
      });
      const renderer2 = defineRenderer((_denops, { items }) => {
        results.push("renderer2");
        items.forEach((item) => {
          item.label = `${item.label}-2`;
        });
      });
      const renderer3 = defineRenderer((_denops, { items }) => {
        results.push("renderer3");
        items.forEach((item) => {
          item.label = `${item.label}-3`;
        });
      });
      const renderer = composeRenderers(renderer2, renderer1, renderer3);
      const denops = new DenopsStub();
      const params = {
        items: [{
          id: 0,
          value: "Hello",
          label: "Hello",
          detail: {},
          decorations: [],
        }],
      };
      await renderer.render(denops, params, {});
      assertEquals(results, ["renderer2", "renderer1", "renderer3"]);
      assertEquals(params.items, [{
        id: 0,
        value: "Hello",
        label: "Hello-2-1-3",
        detail: {},
        decorations: [],
      }]);
    });

    await t.step("without type constraint", () => {
      const renderer1 = defineRenderer(() => {});
      const renderer2 = defineRenderer(() => {});
      const renderer3 = defineRenderer(() => {});
      const renderer = composeRenderers(renderer1, renderer2, renderer3);
      assertType<IsExact<typeof renderer, Renderer<DetailUnit>>>(true);
    });

    await t.step("with type constraint", () => {
      type C = { a: string };
      const renderer1 = defineRenderer<C>(() => {});
      const renderer2 = defineRenderer<C>(() => {});
      const renderer3 = defineRenderer<C>(() => {});
      const renderer = composeRenderers(renderer1, renderer2, renderer3);
      assertType<IsExact<typeof renderer, Renderer<C>>>(true);
    });
  });

  await t.step("with derivable renderers", async (t) => {
    await t.step("renderers are applied in order", async () => {
      const results: string[] = [];
      const renderer1 = () =>
        defineRenderer((_denops, { items }) => {
          results.push("renderer1");
          items.forEach((item) => {
            item.label = `${item.label}-1`;
          });
        });
      const renderer2 = () =>
        defineRenderer((_denops, { items }) => {
          results.push("renderer2");
          items.forEach((item) => {
            item.label = `${item.label}-2`;
          });
        });
      const renderer3 = () =>
        defineRenderer((_denops, { items }) => {
          results.push("renderer3");
          items.forEach((item) => {
            item.label = `${item.label}-3`;
          });
        });
      const renderer = composeRenderers(renderer2, renderer1, renderer3);
      const denops = new DenopsStub();
      const params = {
        items: [{
          id: 0,
          value: "Hello",
          label: "Hello",
          detail: {},
          decorations: [],
        }],
      };
      await renderer.render(denops, params, {});
      assertEquals(results, ["renderer2", "renderer1", "renderer3"]);
      assertEquals(params.items, [{
        id: 0,
        value: "Hello",
        label: "Hello-2-1-3",
        detail: {},
        decorations: [],
      }]);
    });

    await t.step("without type constraint", () => {
      const renderer1 = () => defineRenderer(() => {});
      const renderer2 = () => defineRenderer(() => {});
      const renderer3 = () => defineRenderer(() => {});
      const renderer = composeRenderers(renderer1, renderer2, renderer3);
      assertType<IsExact<typeof renderer, Renderer<DetailUnit>>>(true);
    });

    await t.step("with type constraint", () => {
      type C = { a: string };
      const renderer1 = () => defineRenderer<C>(() => {});
      const renderer2 = () => defineRenderer<C>(() => {});
      const renderer3 = () => defineRenderer<C>(() => {});
      const renderer = composeRenderers(renderer1, renderer2, renderer3);
      assertType<IsExact<typeof renderer, Renderer<C>>>(true);
    });
  });
});
