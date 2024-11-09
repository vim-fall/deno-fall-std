import { assertEquals } from "@std/assert";
import { assertType, type IsExact } from "@std/testing/types";
import { DenopsStub } from "@denops/test/stub";
import { composeRenderers, defineRenderer, type Renderer } from "./renderer.ts";

Deno.test("defineRenderer", () => {
  const renderer = defineRenderer(async () => {});
  assertEquals(typeof renderer.render, "function");
  assertType<IsExact<typeof renderer, Renderer<unknown>>>(true);
});

Deno.test("composeRenderers", async () => {
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
      detail: undefined,
      decorations: [],
    }],
  };
  await renderer.render(denops, params, {});
  assertEquals(results, ["renderer2", "renderer1", "renderer3"]);
  assertEquals(params.items, [{
    id: 0,
    value: "Hello",
    label: "Hello-2-1-3",
    detail: undefined,
    decorations: [],
  }]);
});
