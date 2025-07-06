import * as fn from "@denops/std/function";
import { defineRenderer, type Renderer } from "../../renderer.ts";

type Detail = {
  bufnr: number;
};

export type BufferInfoOptions = {
  /**
   * Which buffer information to display.
   * @default ["modified", "type", "line_count"]
   */
  fields?: Array<"modified" | "readonly" | "type" | "line_count" | "path">;

  /**
   * Whether to show buffer variables.
   * @default false
   */
  showVariables?: boolean;

  /**
   * Whether to colorize output (using ANSI codes).
   * @default false
   */
  colorize?: boolean;
};

/**
 * Creates a Renderer that appends buffer information to item labels.
 *
 * This Renderer adds buffer metadata such as modification status,
 * file type, line count, and other properties to each item's label.
 *
 * @param options - Options to customize buffer info display.
 * @returns A Renderer that adds buffer information to item labels.
 */
export function bufferInfo(
  options: Readonly<BufferInfoOptions> = {},
): Renderer<Detail> {
  const fields = options.fields ?? ["modified", "type", "line_count"];
  const showVariables = options.showVariables ?? false;
  const colorize = options.colorize ?? false;

  return defineRenderer(async (denops, { items }) => {
    // Process items in parallel
    await Promise.all(
      items.map(async (item) => {
        const { bufnr } = item.detail;
        const parts: string[] = [];

        try {
          // Get buffer information
          const bufinfo = await fn.getbufinfo(denops, bufnr);
          if (!bufinfo || bufinfo.length === 0) {
            return;
          }

          const buf = bufinfo[0];

          // Add requested fields
          for (const field of fields) {
            switch (field) {
              case "modified": {
                if (buf.changed) {
                  parts.push("[+]");
                }
                break;
              }

              case "readonly": {
                // Check if buffer is readonly
                const readonly = await denops.eval(
                  `getbufvar(${bufnr}, "&readonly")`,
                ) as number;
                if (readonly) {
                  parts.push("[RO]");
                }
                break;
              }

              case "type": {
                // Get filetype
                const filetype = await denops.eval(
                  `getbufvar(${bufnr}, "&filetype")`,
                ) as string;
                if (filetype) {
                  parts.push(`(${filetype})`);
                }
                break;
              }

              case "line_count": {
                const lineCount = buf.linecount;
                if (lineCount !== undefined) {
                  parts.push(`${lineCount}L`);
                }
                break;
              }

              case "path": {
                // Get full path
                const fullpath = await fn.fnamemodify(
                  denops,
                  buf.name,
                  ":p",
                ) as string;
                if (fullpath && fullpath !== buf.name) {
                  parts.push(fullpath);
                }
                break;
              }
            }
          }

          // Add buffer variables if requested
          if (showVariables) {
            const varNames = [
              "&modified",
              "&readonly",
              "&modifiable",
              "&buflisted",
            ];
            const vars: string[] = [];

            for (const varName of varNames) {
              const value = await denops.eval(
                `getbufvar(${bufnr}, "${varName}")`,
              );
              if (value) {
                vars.push(`${varName.substring(1)}=${value}`);
              }
            }

            if (vars.length > 0) {
              parts.push(`{${vars.join(",")}}`);
            }
          }

          // Combine parts and append to label
          if (parts.length > 0) {
            const info = parts.join(" ");
            if (colorize) {
              // Add color based on buffer state
              if (buf.changed) {
                item.label = `${item.label}  \x1b[33m${info}\x1b[0m`; // Yellow for modified
              } else if (
                fields.includes("readonly") && parts.includes("[RO]")
              ) {
                item.label = `${item.label}  \x1b[31m${info}\x1b[0m`; // Red for readonly
              } else {
                item.label = `${item.label}  \x1b[90m${info}\x1b[0m`; // Gray for normal
              }
            } else {
              item.label = `${item.label}  ${info}`;
            }
          }
        } catch {
          // If buffer info fails, skip
        }
      }),
    );
  });
}
