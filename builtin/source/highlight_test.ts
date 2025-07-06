import { assertEquals } from "@std/assert";
import { parseHighlightOutput, parseHighlightOutputAll } from "./highlight.ts";

Deno.test("parseHighlightOutput", async (t) => {
  await t.step("parses normal highlight group", () => {
    const result = parseHighlightOutput(
      "Normal",
      "Normal         xxx ctermfg=145 ctermbg=235 guifg=#ABB2BF guibg=#282C34",
    );
    assertEquals(result, {
      name: "Normal",
      cleared: false,
      linked: false,
      linkTarget: undefined,
    });
  });

  await t.step("parses linked highlight group", () => {
    const result = parseHighlightOutput(
      "Question",
      "Question       xxx links to MoreMsg",
    );
    assertEquals(result, {
      name: "Question",
      cleared: false,
      linked: true,
      linkTarget: "MoreMsg",
    });
  });

  await t.step("parses cleared highlight group", () => {
    const result = parseHighlightOutput(
      "MyGroup",
      "MyGroup        xxx cleared",
    );
    assertEquals(result, {
      name: "MyGroup",
      cleared: true,
      linked: false,
      linkTarget: undefined,
    });
  });
});

Deno.test("parseHighlightOutputAll", async (t) => {
  await t.step("parses multiple highlight groups", () => {
    const output =
      `Normal         xxx ctermfg=145 ctermbg=235 guifg=#ABB2BF guibg=#282C34
Question       xxx links to MoreMsg
MyGroup        xxx cleared
Comment        xxx ctermfg=59 guifg=#5C6370 gui=italic cterm=italic`;

    const result = parseHighlightOutputAll(output);
    assertEquals(result, [
      {
        name: "Normal",
        cleared: false,
        linked: false,
        linkTarget: undefined,
      },
      {
        name: "Question",
        cleared: false,
        linked: true,
        linkTarget: "MoreMsg",
      },
      {
        name: "MyGroup",
        cleared: true,
        linked: false,
        linkTarget: undefined,
      },
      {
        name: "Comment",
        cleared: false,
        linked: false,
        linkTarget: undefined,
      },
    ]);
  });

  await t.step("handles empty output", () => {
    const result = parseHighlightOutputAll("");
    assertEquals(result, []);
  });

  await t.step("ignores invalid lines", () => {
    const output = `Normal         xxx ctermfg=145
Invalid line without xxx
Question       xxx links to MoreMsg`;

    const result = parseHighlightOutputAll(output);
    assertEquals(result, [
      {
        name: "Normal",
        cleared: false,
        linked: false,
        linkTarget: undefined,
      },
      {
        name: "Question",
        cleared: false,
        linked: true,
        linkTarget: "MoreMsg",
      },
    ]);
  });
});
