import { assertEquals } from "@std/assert";
import { renderTheme } from "../../util/testutil.ts";
import { MODERN_THEME } from "./modern.ts";

Deno.test("MODERN_THEME", () => {
  assertEquals(renderTheme(MODERN_THEME), [
    "╭─────────╮╭────┬────╮",
    "│         ││    ╎    │",
    "├╌╌╌╌╌╌╌╌╌┤│    ╎    │",
    "│         ││    ╎    │",
    "╰─────────╯╰────┴────╯",
  ]);
});
