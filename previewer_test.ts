import { assertEquals } from "@std/assert";
import { type AssertTrue, assertType, type IsExact } from "@std/testing/types";
import { DenopsStub } from "@denops/test/stub";
import type { DetailUnit } from "./item.ts";
import {
  composePreviewers,
  definePreviewer,
  type Previewer,
  type PreviewParams,
} from "./previewer.ts";

Deno.test("definePreviewer", async (t) => {
  await t.step("without type contraint", () => {
    const previewer = definePreviewer((_denops, params) => {
      type _ = AssertTrue<IsExact<typeof params, PreviewParams<DetailUnit>>>;
    });
    assertType<IsExact<typeof previewer, Previewer<DetailUnit>>>(true);
  });

  await t.step("with type contraint", () => {
    type C = { a: string };
    const previewer = definePreviewer<C>((_denops, params) => {
      type _ = AssertTrue<IsExact<typeof params, PreviewParams<C>>>;
    });
    assertType<IsExact<typeof previewer, Previewer<C>>>(true);
  });
});

Deno.test("composePreviewers", async (t) => {
  await t.step("with bear previewers", async (t) => {
    await t.step(
      "previewers are applied in order and terminate on success",
      async () => {
        const results: string[] = [];
        const previewer1 = definePreviewer(() => {
          results.push("previewer1");
          return { content: ["Hello world"] };
        });
        const previewer2 = definePreviewer(() => {
          results.push("previewer2");
        });
        const previewer3 = definePreviewer(() => {
          results.push("previewer3");
          return { content: ["Goodbye world"] };
        });
        const previewer = composePreviewers(previewer2, previewer1, previewer3);
        const denops = new DenopsStub();
        const params = {
          item: {
            id: 0,
            value: "123",
            detail: {},
          },
        };
        const item = await previewer.preview(denops, params, {});
        assertEquals(results, ["previewer2", "previewer1"]);
        assertEquals(item, {
          content: ["Hello world"],
        });
      },
    );

    await t.step("without type constraint", () => {
      const previewer1 = definePreviewer(() => {});
      const previewer2 = definePreviewer(() => {});
      const previewer3 = definePreviewer(() => {});
      const previewer = composePreviewers(previewer2, previewer1, previewer3);
      assertType<IsExact<typeof previewer, Previewer<DetailUnit>>>(true);
    });

    await t.step("with type constraint", () => {
      type C = { a: string };
      const previewer1 = definePreviewer<C>(() => {});
      const previewer2 = definePreviewer<C>(() => {});
      const previewer3 = definePreviewer<C>(() => {});
      const previewer = composePreviewers(previewer2, previewer1, previewer3);
      assertType<IsExact<typeof previewer, Previewer<C>>>(true);
    });
  });

  await t.step("with derivable previewers", async (t) => {
    await t.step(
      "previewers are applied in order and terminate on success",
      async () => {
        const results: string[] = [];
        const previewer1 = () =>
          definePreviewer(() => {
            results.push("previewer1");
            return { content: ["Hello world"] };
          });
        const previewer2 = () =>
          definePreviewer(() => {
            results.push("previewer2");
          });
        const previewer3 = () =>
          definePreviewer(() => {
            results.push("previewer3");
            return { content: ["Goodbye world"] };
          });
        const previewer = composePreviewers(previewer2, previewer1, previewer3);
        const denops = new DenopsStub();
        const params = {
          item: {
            id: 0,
            value: "123",
            detail: {},
          },
        };
        const item = await previewer.preview(denops, params, {});
        assertEquals(results, ["previewer2", "previewer1"]);
        assertEquals(item, {
          content: ["Hello world"],
        });
      },
    );

    await t.step("without type constraint", () => {
      const previewer1 = () => definePreviewer(() => {});
      const previewer2 = () => definePreviewer(() => {});
      const previewer3 = () => definePreviewer(() => {});
      const previewer = composePreviewers(previewer2, previewer1, previewer3);
      assertType<IsExact<typeof previewer, Previewer<DetailUnit>>>(true);
    });

    await t.step("with type constraint", () => {
      type C = { a: string };
      const previewer1 = () => definePreviewer<C>(() => {});
      const previewer2 = () => definePreviewer<C>(() => {});
      const previewer3 = () => definePreviewer<C>(() => {});
      const previewer = composePreviewers(previewer2, previewer1, previewer3);
      assertType<IsExact<typeof previewer, Previewer<C>>>(true);
    });
  });
});
