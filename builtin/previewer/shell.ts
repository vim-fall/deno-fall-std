import { unnullish } from "@lambdalisue/unnullish";

import { definePreviewer, type Previewer } from "../../previewer.ts";
import { splitText } from "../../util/stringutil.ts";

type Detail = {
  /**
   * Command to execute
   */
  command?: string;

  /**
   * Arguments to pass to the command
   */
  args?: string[];

  /**
   * Current working directory for command execution
   */
  cwd?: string;

  /**
   * Environment variables
   */
  env?: Record<string, string>;

  /**
   * Timeout in milliseconds
   */
  timeout?: number;
};

export type ShellOptions = {
  /**
   * Default shell to use if no command is specified.
   * @default ["sh", "-c"]
   */
  shell?: string[];

  /**
   * Default timeout in milliseconds.
   * @default 5000
   */
  defaultTimeout?: number;

  /**
   * Maximum number of lines to display.
   * @default 1000
   */
  maxLines?: number;
};

/**
 * Creates a Previewer that executes shell commands and displays their output.
 *
 * This Previewer runs a specified command and shows its stdout/stderr output.
 * It supports custom working directories, environment variables, and timeouts.
 *
 * @param options - Options to customize shell command execution.
 * @returns A Previewer that shows the command output.
 */
export function shell(options: Readonly<ShellOptions> = {}): Previewer<Detail> {
  const shell = options.shell ?? ["sh", "-c"];
  const defaultTimeout = options.defaultTimeout ?? 5000;
  const maxLines = options.maxLines ?? 1000;

  return definePreviewer(async (_denops, { item }, { signal }) => {
    // Get command from detail or use item value as command
    const command = item.detail.command ?? item.value;
    const args = item.detail.args ?? [];
    const cwd = item.detail.cwd;
    const env = item.detail.env;
    const timeout = item.detail.timeout ?? defaultTimeout;

    // Prepare command array
    let cmd: string[];
    if (args.length > 0) {
      cmd = [command, ...args];
    } else {
      // Use shell to execute the command string
      cmd = [...shell, command];
    }

    try {
      // Create subprocess
      const process = new Deno.Command(cmd[0], {
        args: cmd.slice(1),
        cwd: unnullish(cwd, (v) => v),
        env: unnullish(env, (v) => v),
        stdout: "piped",
        stderr: "piped",
        signal,
      });

      // Set up timeout
      const timeoutId = setTimeout(() => {
        try {
          process.spawn().kill();
        } catch {
          // Ignore errors when killing
        }
      }, timeout);

      try {
        // Execute command
        const { stdout, stderr, success } = await process.output();
        clearTimeout(timeoutId);

        // Decode output
        const decoder = new TextDecoder();
        const stdoutText = decoder.decode(stdout);
        const stderrText = decoder.decode(stderr);

        // Combine stdout and stderr
        let content: string[] = [];

        if (stdoutText) {
          content.push(...splitText(stdoutText));
        }

        if (stderrText) {
          if (content.length > 0) {
            content.push("--- stderr ---");
          }
          content.push(...splitText(stderrText));
        }

        // Add status line if command failed
        if (!success) {
          content.push("", `[Command failed with non-zero exit code]`);
        }

        // Limit output lines
        if (content.length > maxLines) {
          content = content.slice(0, maxLines);
          content.push("", `[Output truncated to ${maxLines} lines]`);
        }

        // Handle empty output
        if (content.length === 0) {
          content = ["[No output]"];
        }

        return {
          content,
          filename: `$ ${cmd.join(" ")}`,
        };
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (err) {
      // Handle command execution errors
      return {
        content: [
          `Error executing command: ${command}`,
          "",
          ...String(err).split("\n"),
        ],
        filename: `$ ${cmd.join(" ")}`,
      };
    }
  });
}
