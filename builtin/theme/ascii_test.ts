import { assertEquals } from "@std/assert";
import { renderTheme } from "../../util/testutil.ts";
import { ASCII_THEME } from "./ascii.ts";

Deno.test("ASCII_THEME", () => {
  assertEquals(renderTheme(ASCII_THEME), [
    "+---------++---------+",
    "|         ||    |    |",
    "|---------||    |    |",
    "|         ||    |    |",
    "+---------++---------+",
  ]);
});
