import { defineRenderer, type Renderer } from "../../renderer.ts";

type Detail = {
  path: string;
};

export type FileInfoOptions = {
  /**
   * Which file information to display.
   * @default ["size", "modified"]
   */
  fields?: Array<"size" | "modified" | "permissions" | "type">;

  /**
   * Whether to show relative timestamps (e.g., "2 hours ago").
   * @default true
   */
  relativeTime?: boolean;

  /**
   * Width of each field in characters.
   * @default { size: 8, modified: 16, permissions: 10, type: 4 }
   */
  fieldWidths?: {
    size?: number;
    modified?: number;
    permissions?: number;
    type?: number;
  };

  /**
   * Whether to colorize output (using ANSI codes).
   * @default false
   */
  colorize?: boolean;
};

/**
 * Creates a Renderer that appends file information to item labels.
 *
 * This Renderer adds file metadata such as size, modification time,
 * permissions, and file type to each item's label in a formatted manner.
 *
 * @param options - Options to customize file info display.
 * @returns A Renderer that adds file information to item labels.
 */
export function fileInfo(
  options: Readonly<FileInfoOptions> = {},
): Renderer<Detail> {
  const fields = options.fields ?? ["size", "modified"];
  const relativeTime = options.relativeTime ?? true;
  const fieldWidths = {
    size: 8,
    modified: 16,
    permissions: 10,
    type: 4,
    ...options.fieldWidths,
  };
  const colorize = options.colorize ?? false;

  return defineRenderer(async (_denops, { items }) => {
    // Process items sequentially to avoid file system issues
    for (const item of items) {
      const { path } = item.detail;
      const parts: string[] = [];

      try {
        // Get file stats
        const stat = await Deno.stat(path);

        // Add requested fields
        for (const field of fields) {
          switch (field) {
            case "size": {
              const sizeStr = stat.isFile
                ? formatBytes(stat.size)
                : stat.isDirectory
                ? "-"
                : "0B";
              parts.push(sizeStr.padStart(fieldWidths.size));
              break;
            }

            case "modified": {
              const mtime = stat.mtime;
              let timeStr: string;
              if (mtime && relativeTime) {
                timeStr = formatRelativeTime(mtime);
              } else if (mtime) {
                timeStr = formatDate(mtime);
              } else {
                timeStr = "-";
              }
              parts.push(timeStr.padEnd(fieldWidths.modified));
              break;
            }

            case "permissions": {
              const permsStr = formatPermissions(stat.mode);
              parts.push(permsStr.padEnd(fieldWidths.permissions));
              break;
            }

            case "type": {
              const typeStr = stat.isDirectory
                ? "dir"
                : stat.isFile
                ? "file"
                : stat.isSymlink
                ? "link"
                : "other";
              parts.push(typeStr.padEnd(fieldWidths.type));
              break;
            }
          }
        }

        // Combine parts and append to label
        const info = parts.join(" ");
        if (colorize) {
          // Add color based on file type
          if (stat.isDirectory) {
            item.label = `${item.label}  \x1b[34m${info}\x1b[0m`;
          } else if (stat.isSymlink) {
            item.label = `${item.label}  \x1b[36m${info}\x1b[0m`;
          } else if ((stat.mode ?? 0) & 0o111) {
            // Executable
            item.label = `${item.label}  \x1b[32m${info}\x1b[0m`;
          } else {
            item.label = `${item.label}  \x1b[90m${info}\x1b[0m`;
          }
        } else {
          item.label = `${item.label}  ${info}`;
        }
      } catch {
        // If stat fails, add placeholder
        const placeholder = fields.map((field) => {
          const width = fieldWidths[field as keyof typeof fieldWidths] ?? 10;
          return "-".padEnd(width);
        }).join(" ");
        item.label = `${item.label}  ${placeholder}`;
      }
    }
  });
}

/**
 * Formats bytes to a human-readable string.
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(1)}${units[i]}`;
}

/**
 * Formats a date to a relative time string.
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) {
    return `${years}y ago`;
  } else if (months > 0) {
    return `${months}mo ago`;
  } else if (days > 0) {
    return `${days}d ago`;
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else {
    return "just now";
  }
}

/**
 * Formats a date to a standard string.
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

/**
 * Formats file permissions to a Unix-style string.
 */
function formatPermissions(mode: number | null): string {
  if (mode === null) {
    return "---------";
  }

  const perms = [];
  const types = ["---", "--x", "-w-", "-wx", "r--", "r-x", "rw-", "rwx"];

  // User permissions
  perms.push(types[(mode >> 6) & 7]);
  // Group permissions
  perms.push(types[(mode >> 3) & 7]);
  // Other permissions
  perms.push(types[mode & 7]);

  return perms.join("");
}
