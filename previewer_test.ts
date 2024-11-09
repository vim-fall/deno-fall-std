import { assertEquals } from "@std/assert";
import { assertType, type IsExact } from "@std/testing/types";
import { DenopsStub } from "@denops/test/stub";
import {
  composePreviewers,
  definePreviewer,
  type Previewer,
} from "./previewer.ts";

Deno.test("definePreviewer", () => {
  const previewer = definePreviewer(async () => {});
  assertEquals(typeof previewer.preview, "function");
  assertType<IsExact<typeof previewer, Previewer<unknown>>>(true);
});

Deno.test("composePreviewers", async () => {
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
      detail: undefined,
    },
  };
  const item = await previewer.preview(denops, params, {});
  assertEquals(results, ["previewer2", "previewer1"]);
  assertEquals(item, {
    content: ["Hello world"],
  });
});
