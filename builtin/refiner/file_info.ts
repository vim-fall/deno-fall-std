import { defineRefiner, type Refiner } from "../../refiner.ts";
import { extname } from "@std/path/extname";

type Detail = {
  /**
   * File path
   */
  path: string;
};

export type FileInfoRefinerOptions = {
  /**
   * Filter by file extensions.
   * If provided, only files with these extensions will pass.
   */
  extensions?: string[];

  /**
   * Filter by file size.
   * Files must be within this range (in bytes).
   */
  sizeRange?: {
    min?: number;
    max?: number;
  };

  /**
   * Filter by modification time.
   * Files must be modified within this time range.
   */
  modifiedWithin?: {
    days?: number;
    hours?: number;
    minutes?: number;
  };

  /**
   * Whether to include directories.
   * @default true
   */
  includeDirectories?: boolean;

  /**
   * Whether to include files.
   * @default true
   */
  includeFiles?: boolean;

  /**
   * Whether to include symlinks.
   * @default true
   */
  includeSymlinks?: boolean;

  /**
   * Whether to exclude hidden files (starting with dot).
   * @default false
   */
  excludeHidden?: boolean;

  /**
   * Patterns to exclude (glob patterns).
   */
  excludePatterns?: string[];
};

/**
 * Creates a Refiner that filters items based on file information.
 *
 * This Refiner can filter files based on various criteria such as
 * file extension, size, modification time, and file type.
 *
 * @param options - Options to customize file filtering.
 * @returns A Refiner that filters items based on file information.
 */
export function fileInfo(
  options: Readonly<FileInfoRefinerOptions> = {},
): Refiner<Detail> {
  const extensions = options.extensions;
  const sizeRange = options.sizeRange;
  const modifiedWithin = options.modifiedWithin;
  const includeDirectories = options.includeDirectories ?? true;
  const includeFiles = options.includeFiles ?? true;
  const includeSymlinks = options.includeSymlinks ?? true;
  const excludeHidden = options.excludeHidden ?? false;
  const excludePatterns = options.excludePatterns ?? [];

  return defineRefiner(async function* (_denops, { items }) {
    // Process items sequentially to avoid Promise.all
    for await (const item of items) {
      const { path } = item.detail;

      // Check if hidden file should be excluded
      if (
        excludeHidden &&
        path.split("/").some((part: string) => part.startsWith("."))
      ) {
        continue;
      }

      // Check exclude patterns
      let shouldExclude = false;
      for (const pattern of excludePatterns) {
        // Simple glob pattern matching (could be enhanced)
        const regex = new RegExp(
          pattern.replace(/\*/g, ".*").replace(/\?/g, "."),
        );
        if (regex.test(path)) {
          shouldExclude = true;
          break;
        }
      }
      if (shouldExclude) {
        continue;
      }

      // Check extension filter
      if (extensions && extensions.length > 0) {
        const ext = extname(path).toLowerCase();
        if (!extensions.includes(ext)) {
          continue;
        }
      }

      try {
        // Get file stats
        const stat = await Deno.stat(path);

        // Check file type filters
        if (!includeFiles && stat.isFile) {
          continue;
        }
        if (!includeDirectories && stat.isDirectory) {
          continue;
        }
        if (!includeSymlinks && stat.isSymlink) {
          continue;
        }

        // Check size filter
        if (sizeRange && stat.isFile) {
          if (sizeRange.min !== undefined && stat.size < sizeRange.min) {
            continue;
          }
          if (sizeRange.max !== undefined && stat.size > sizeRange.max) {
            continue;
          }
        }

        // Check modification time filter
        if (modifiedWithin && stat.mtime) {
          const now = new Date();
          const mtime = stat.mtime;
          const diffMs = now.getTime() - mtime.getTime();

          let maxMs = 0;
          if (modifiedWithin.days !== undefined) {
            maxMs += modifiedWithin.days * 24 * 60 * 60 * 1000;
          }
          if (modifiedWithin.hours !== undefined) {
            maxMs += modifiedWithin.hours * 60 * 60 * 1000;
          }
          if (modifiedWithin.minutes !== undefined) {
            maxMs += modifiedWithin.minutes * 60 * 1000;
          }

          if (diffMs > maxMs) {
            continue;
          }
        }

        yield item;
      } catch {
        // If stat fails, exclude the item
        continue;
      }
    }
  });
}
