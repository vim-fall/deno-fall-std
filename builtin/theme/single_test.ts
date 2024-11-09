import { assertEquals } from "@std/assert";
import { renderTheme } from "../../util/testutil.ts";
import { SINGLE_THEME } from "./single.ts";

Deno.test("SINGLE_THEME", () => {
  assertEquals(renderTheme(SINGLE_THEME), [
    "┌─────────┐┌────┬────┐",
    "│         ││    │    │",
    "├─────────┤│    │    │",
    "│         ││    │    │",
    "└─────────┘└────┴────┘",
  ]);
});
