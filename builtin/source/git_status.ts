import * as fn from "@denops/std/function";
import { join } from "@std/path/join";

import { defineSource, type Source } from "../../source.ts";

type Detail = {
  /**
   * File path relative to git root
   */
  path: string;

  /**
   * Absolute file path
   */
  absolutePath: string;

  /**
   * Git status code (e.g., "M", "A", "D", "??")
   */
  status: string;

  /**
   * Human-readable status description
   */
  statusDescription: string;

  /**
   * Whether the file is staged
   */
  staged: boolean;

  /**
   * Whether the file is unstaged
   */
  unstaged: boolean;
};

export type GitStatusOptions = {
  /**
   * Whether to include untracked files.
   * @default true
   */
  includeUntracked?: boolean;

  /**
   * Whether to include ignored files.
   * @default false
   */
  includeIgnored?: boolean;

  /**
   * Whether to show status in submodules.
   * @default false
   */
  includeSubmodules?: boolean;
};

// Git status format codes
const STATUS_CODES = {
  STAGED: {
    M: "modified",
    A: "added",
    D: "deleted",
    R: "renamed",
    C: "copied",
  },
  UNSTAGED: {
    M: "modified",
    D: "deleted",
  },
  UNTRACKED: "??",
  IGNORED: "!!",
} as const;

/**
 * Creates a Source that generates items from git status.
 *
 * This Source runs `git status` and generates items for each modified,
 * staged, or untracked file in the repository.
 *
 * @param options - Options to customize git status listing.
 * @returns A Source that generates items representing git status files.
 */
export function gitStatus(
  options: Readonly<GitStatusOptions> = {},
): Source<Detail> {
  const includeUntracked = options.includeUntracked ?? true;
  const includeIgnored = options.includeIgnored ?? false;
  const includeSubmodules = options.includeSubmodules ?? false;

  return defineSource(async function* (denops, _params, { signal }) {
    // Get current working directory
    const cwd = await fn.getcwd(denops);
    signal?.throwIfAborted();

    // Build git status command
    const args = ["status", "--porcelain=v1"];
    if (includeUntracked) {
      args.push("-u");
    } else {
      args.push("-uno");
    }
    if (includeIgnored) {
      args.push("--ignored");
    }
    if (!includeSubmodules) {
      args.push("--ignore-submodules");
    }

    try {
      // Run git status
      const cmd = new Deno.Command("git", {
        args,
        cwd,
        stdout: "piped",
        stderr: "piped",
        signal,
      });

      const { stdout, stderr, success } = await cmd.output();

      if (!success) {
        // Not a git repository or git command failed
        const errorText = new TextDecoder().decode(stderr);
        if (errorText.includes("not a git repository")) {
          // Silently return empty - not an error condition
          return;
        }
        throw new Error(`git status failed: ${errorText}`);
      }

      // Parse git status output
      const output = new TextDecoder().decode(stdout);
      const lines = output.trim().split("\n").filter((line) => line);

      const items = lines.map((line, index) => {
        // Git status format: XY filename
        // X = staged status, Y = unstaged status
        const staged = line[0];
        const unstaged = line[1];
        const filename = line.substring(3);

        // Determine status code and description
        const status = `${staged}${unstaged}`;
        let statusDescription = "";
        let isStaged = false;
        let isUnstaged = false;

        // Parse status codes
        if (status === STATUS_CODES.UNTRACKED) {
          statusDescription = "untracked";
          isUnstaged = true;
        } else if (status === STATUS_CODES.IGNORED) {
          statusDescription = "ignored";
        } else {
          // Handle staged status
          const stagedDesc =
            STATUS_CODES.STAGED[staged as keyof typeof STATUS_CODES.STAGED];
          if (stagedDesc) {
            statusDescription = stagedDesc;
            isStaged = true;
          }

          // Handle unstaged status
          const unstagedDesc = STATUS_CODES
            .UNSTAGED[unstaged as keyof typeof STATUS_CODES.UNSTAGED];
          if (unstagedDesc) {
            statusDescription += isStaged ? `, ${unstagedDesc}` : unstagedDesc;
            isUnstaged = true;
          }
        }

        // Create status indicator
        const indicator = status === STATUS_CODES.UNTRACKED
          ? "[?]"
          : status === STATUS_CODES.IGNORED
          ? "[!]"
          : `[${status}]`;

        // Format display value
        const absolutePath = join(cwd, filename);
        const displayPath = filename;
        const value = `${indicator.padEnd(5)} ${displayPath}`;

        return {
          id: index,
          value,
          detail: {
            path: filename,
            absolutePath,
            status,
            statusDescription,
            staged: isStaged,
            unstaged: isUnstaged,
          },
        };
      });

      yield* items;
    } catch (err) {
      // Handle errors gracefully
      if (err instanceof Error) {
        if (err.name === "NotFound") {
          // Git not installed - silently return empty
          return;
        }
        // Re-throw other errors with context
        throw new Error(`Failed to get git status: ${err.message}`);
      }
      throw err;
    }
  });
}
