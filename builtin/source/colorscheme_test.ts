import { assertEquals } from "@std/assert";
import { parseColorschemeList } from "./colorscheme.ts";

Deno.test("parseColorschemeList", async (t) => {
  await t.step("parses comma-separated colorscheme list", () => {
    const result = parseColorschemeList("desert,gruvbox,molokai,nord");
    assertEquals(result, ["desert", "gruvbox", "molokai", "nord"]);
  });

  await t.step("handles empty string", () => {
    const result = parseColorschemeList("");
    assertEquals(result, []);
  });

  await t.step("handles single colorscheme", () => {
    const result = parseColorschemeList("gruvbox");
    assertEquals(result, ["gruvbox"]);
  });

  await t.step("handles whitespace between colorschemes", () => {
    const result = parseColorschemeList("desert, gruvbox , molokai,  nord");
    assertEquals(result, ["desert", "gruvbox", "molokai", "nord"]);
  });

  await t.step("filters out empty strings", () => {
    const result = parseColorschemeList("desert,,gruvbox,,,molokai");
    assertEquals(result, ["desert", "gruvbox", "molokai"]);
  });
});
