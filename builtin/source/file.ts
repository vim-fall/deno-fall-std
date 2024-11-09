import * as fn from "@denops/std/function";
import { enumerate } from "@core/iterutil/async/enumerate";
import { join } from "@std/path/join";

import { defineSource, type Source } from "../../source.ts";

type Options = {
  /**
   * Patterns to include files matching specific paths.
   */
  includes?: RegExp[];

  /**
   * Patterns to exclude files matching specific paths.
   */
  excludes?: RegExp[];
};

type Detail = {
  /**
   * Absolute path of the file.
   */
  path: string;

  /**
   * File information including metadata like size, permissions, etc.
   */
  stat: Deno.FileInfo;
};

/**
 * Creates a Source that generates items from files in a specified directory.
 *
 * This Source retrieves files from a given directory and its subdirectories,
 * applying optional `includes` and `excludes` patterns to filter results.
 *
 * @param options - Options to filter files based on patterns.
 * @returns A Source that generates items representing filtered files.
 */
export function file(options: Readonly<Options> = {}): Source<Detail> {
  const { includes, excludes } = options;
  return defineSource(async function* (denops, { args }, { signal }) {
    const path = await fn.expand(denops, args[0] ?? ".") as string;
    signal?.throwIfAborted();
    const abspath = await fn.fnamemodify(denops, path, ":p");
    signal?.throwIfAborted();

    // Enumerate files and apply filters
    for await (
      const [id, detail] of enumerate(
        collect(abspath, includes, excludes, signal),
      )
    ) {
      yield {
        id,
        value: detail.path,
        detail,
      };
    }
  });
}

/**
 * Recursively collects files from a given directory, applying optional filters.
 *
 * @param root - The root directory to start collecting files.
 * @param includes - Patterns to include files.
 * @param excludes - Patterns to exclude files.
 * @param signal - Optional signal to handle abort requests.
 */
async function* collect(
  root: string,
  includes: RegExp[] | undefined,
  excludes: RegExp[] | undefined,
  signal?: AbortSignal,
): AsyncIterableIterator<Detail> {
  for await (const entry of Deno.readDir(root)) {
    const path = join(root, entry.name);

    // Apply include and exclude filters
    if (includes && !includes.some((p) => p.test(path))) {
      continue;
    } else if (excludes && excludes.some((p) => p.test(path))) {
      continue;
    }

    let fileInfo: Deno.FileInfo;
    if (entry.isSymlink) {
      // Handle symbolic links by resolving their real path
      try {
        const realPath = await Deno.realPath(path);
        signal?.throwIfAborted();
        fileInfo = await Deno.stat(realPath);
        signal?.throwIfAborted();
      } catch (err) {
        if (isSilence(err)) continue;
        throw err;
      }
    } else {
      // Get file info for regular files and directories
      try {
        fileInfo = await Deno.stat(path);
        signal?.throwIfAborted();
      } catch (err) {
        if (isSilence(err)) continue;
        throw err;
      }
    }

    // Recursively yield files from directories, or yield file details
    if (fileInfo.isDirectory) {
      yield* collect(path, includes, excludes, signal);
    } else {
      yield {
        path,
        stat: fileInfo,
      };
    }
  }
}

/**
 * Determines if an error is silent (non-fatal) and should be ignored.
 *
 * This includes errors like file not found or permission denied.
 *
 * @param err - The error to check.
 * @returns Whether the error should be silently ignored.
 */
function isSilence(err: unknown): boolean {
  if (err instanceof Deno.errors.NotFound) {
    return true;
  }
  if (err instanceof Deno.errors.PermissionDenied) {
    return true;
  }
  if (err instanceof Deno.errors.FilesystemLoop) {
    return true;
  }
  if (err instanceof Error) {
    if (err.message.startsWith("File name too long (os error 63)")) {
      return true;
    }
  }
  return false;
}
