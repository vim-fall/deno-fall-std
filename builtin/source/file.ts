import { enumerate } from "@core/iterutil/async/enumerate";
import { SEPARATOR } from "@std/path/constants";

import { defineSource, type Source } from "../../source.ts";

type Detail = {
  /**
   * Absolute path of the file.
   */
  path: string;
};

export type FileOptions = {
  /**
   * A function to filter files based on their paths.
   *
   * If the function returns `false`, the file is excluded.
   */
  filterFile?: (path: string) => boolean;

  /**
   * A function to filter directories based on their paths.
   *
   * If the function returns `false`, the directory is excluded.
   */
  filterDirectory?: (path: string) => boolean;
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
export function file(options: Readonly<FileOptions> = {}): Source<Detail> {
  const {
    filterFile = () => true,
    filterDirectory = () => true,
  } = options;

  return defineSource(async function* (denops, { args }, { signal }) {
    const root = removeTrailingSeparator(
      await denops.eval(
        "fnamemodify(expand(path), ':p')",
        { path: args[0] ?? "." },
      ) as string,
    );
    signal?.throwIfAborted();

    // Enumerate files and apply filters
    for await (
      const [id, path] of enumerate(
        walk(root, filterFile, filterDirectory, signal),
      )
    ) {
      yield {
        id,
        value: path,
        detail: { path },
      };
    }
  });
}

async function* walk(
  root: string,
  filterFile: (path: string) => boolean,
  filterDirectory: (path: string) => boolean,
  signal?: AbortSignal,
): AsyncIterableIterator<string> {
  for await (const entry of Deno.readDir(root)) {
    const path = `${root}${SEPARATOR}${entry.name}`;
    // Follow symbolic links to recursively yield files
    let isDirectory = entry.isDirectory;
    if (entry.isSymlink) {
      try {
        const fileInfo = await Deno.stat(path);
        signal?.throwIfAborted();
        isDirectory = fileInfo.isDirectory;
      } catch (err) {
        if (isSilence(err)) {
          continue;
        }
        throw err;
      }
    }
    // Recursively yield files from directories, or yield file details
    if (isDirectory) {
      if (filterDirectory(path)) {
        yield* walk(path, filterFile, filterDirectory, signal);
      }
    } else {
      if (filterFile(path)) {
        yield path;
      }
    }
  }
}

function removeTrailingSeparator(path: string): string {
  if (path.endsWith(SEPARATOR)) {
    return path.slice(0, path.length - SEPARATOR.length);
  }
  return path;
}

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
