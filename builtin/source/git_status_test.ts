import { assertEquals } from "@std/assert";
import { parseGitStatusLine, parseGitStatusOutput } from "./git_status.ts";

Deno.test("parseGitStatusLine", async (t) => {
  await t.step("parses untracked file", () => {
    const result = parseGitStatusLine("?? untracked-file.txt");
    assertEquals(result, {
      staged: "?",
      unstaged: "?",
      filename: "untracked-file.txt",
      status: "??",
      statusDescription: "untracked",
      isStaged: false,
      isUnstaged: true,
      indicator: "[?]",
    });
  });

  await t.step("parses modified file", () => {
    const result = parseGitStatusLine(" M modified-file.txt");
    assertEquals(result, {
      staged: " ",
      unstaged: "M",
      filename: "modified-file.txt",
      status: " M",
      statusDescription: "modified",
      isStaged: false,
      isUnstaged: true,
      indicator: "[ M]",
    });
  });

  await t.step("parses staged file", () => {
    const result = parseGitStatusLine("A  new-file.txt");
    assertEquals(result, {
      staged: "A",
      unstaged: " ",
      filename: "new-file.txt",
      status: "A ",
      statusDescription: "added",
      isStaged: true,
      isUnstaged: false,
      indicator: "[A ]",
    });
  });

  await t.step("parses modified and staged file", () => {
    const result = parseGitStatusLine("MM both-modified.txt");
    assertEquals(result, {
      staged: "M",
      unstaged: "M",
      filename: "both-modified.txt",
      status: "MM",
      statusDescription: "modified, modified",
      isStaged: true,
      isUnstaged: true,
      indicator: "[MM]",
    });
  });

  await t.step("parses renamed file", () => {
    const result = parseGitStatusLine("R  old-name.txt -> new-name.txt");
    assertEquals(result, {
      staged: "R",
      unstaged: " ",
      filename: "old-name.txt -> new-name.txt",
      status: "R ",
      statusDescription: "renamed",
      isStaged: true,
      isUnstaged: false,
      indicator: "[R ]",
    });
  });

  await t.step("parses ignored file", () => {
    const result = parseGitStatusLine("!! ignored-file.txt");
    assertEquals(result, {
      staged: "!",
      unstaged: "!",
      filename: "ignored-file.txt",
      status: "!!",
      statusDescription: "ignored",
      isStaged: false,
      isUnstaged: false,
      indicator: "[!]",
    });
  });
});

Deno.test("parseGitStatusOutput", async (t) => {
  await t.step("parses multiple status lines", () => {
    const output = `?? untracked.txt
 M modified.txt
A  added.txt
D  deleted.txt
R  old.txt -> new.txt`;

    const result = parseGitStatusOutput(output);
    assertEquals(result.length, 5);
    assertEquals(result[0].filename, "untracked.txt");
    assertEquals(result[0].status, "??");
    assertEquals(result[1].filename, "modified.txt");
    assertEquals(result[1].status, " M");
    assertEquals(result[2].filename, "added.txt");
    assertEquals(result[2].status, "A ");
    assertEquals(result[3].filename, "deleted.txt");
    assertEquals(result[3].status, "D ");
    assertEquals(result[4].filename, "old.txt -> new.txt");
    assertEquals(result[4].status, "R ");
  });

  await t.step("handles empty output", () => {
    const result = parseGitStatusOutput("");
    assertEquals(result, []);
  });

  await t.step("ignores empty lines", () => {
    const output = `?? file1.txt

 M file2.txt

A  file3.txt`;

    const result = parseGitStatusOutput(output);
    assertEquals(result.length, 3);
    assertEquals(result[0].filename, "file1.txt");
    assertEquals(result[1].filename, "file2.txt");
    assertEquals(result[2].filename, "file3.txt");
  });
});
