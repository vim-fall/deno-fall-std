import { assertEquals } from "@std/assert";
import {
  extractShortName,
  formatJumpIndicator,
  formatJumpItem,
} from "./jumplist.ts";

Deno.test("formatJumpIndicator", async (t) => {
  await t.step("formats current position", () => {
    assertEquals(formatJumpIndicator(0), ">");
  });

  await t.step("formats negative jumps", () => {
    assertEquals(formatJumpIndicator(-1), "-1");
    assertEquals(formatJumpIndicator(-10), "-10");
  });

  await t.step("formats positive jumps", () => {
    assertEquals(formatJumpIndicator(1), "+1");
    assertEquals(formatJumpIndicator(10), "+10");
  });
});

Deno.test("extractShortName", async (t) => {
  await t.step("extracts filename from path", () => {
    assertEquals(extractShortName("/home/user/file.txt"), "file.txt");
    assertEquals(extractShortName("/path/to/some/file.vim"), "file.vim");
  });

  await t.step("handles empty string", () => {
    assertEquals(extractShortName(""), "[No Name]");
  });

  await t.step("handles path without slashes", () => {
    assertEquals(extractShortName("file.txt"), "file.txt");
  });

  await t.step("handles path ending with slash", () => {
    assertEquals(extractShortName("/path/to/dir/"), "/path/to/dir/");
  });
});

Deno.test("formatJumpItem", async (t) => {
  await t.step("formats jump item correctly", () => {
    const jump = {
      bufnr: 1,
      col: 10,
      coladd: 0,
      filename: "",
      lnum: 25,
    };

    const result = formatJumpItem(
      jump,
      5,
      3,
      "/home/user/test.vim",
      "  function Test()",
    );

    assertEquals(result, {
      id: 5,
      value: "  +2 test.vim:25:10 function Test()",
      detail: {
        jump: 2,
        line: 25,
        column: 10,
        bufnr: 1,
        bufname: "/home/user/test.vim",
        text: "  function Test()",
      },
    });
  });

  await t.step("formats current jump", () => {
    const jump = {
      bufnr: 2,
      col: 1,
      coladd: 0,
      filename: "",
      lnum: 1,
    };

    const result = formatJumpItem(jump, 3, 3, "", "let g:test = 1");

    assertEquals(result, {
      id: 3,
      value: "   > [No Name]:1:1 let g:test = 1",
      detail: {
        jump: 0,
        line: 1,
        column: 1,
        bufnr: 2,
        bufname: "",
        text: "let g:test = 1",
      },
    });
  });
});
