import * as opt from "@denops/std/option";
import { join } from "@std/path/join";

import { definePreviewer, type Previewer } from "../../previewer.ts";

const helpfileCache = new Map<string, string>();

type Detail = {
  helptag: string;
  helpfile: string;
  lang?: string;
};

/**
 * Creates a Previewer that displays content for a specific helptag.
 *
 * This Previewer searches for the helptag in the specified helpfile, then displays the
 * content of the file with the line containing the helptag highlighted, if found.
 *
 * @returns A Previewer that displays the specified helpfile's content.
 */
export function helptag(): Previewer<Detail> {
  return definePreviewer(async (denops, { item }, { signal }) => {
    // Retrieve runtime paths and load the helpfile content
    const runtimepaths = (await opt.runtimepath.get(denops)).split(",");
    signal?.throwIfAborted();
    const text = await readHelpfile(
      runtimepaths,
      item.detail.helpfile,
      signal,
    );
    signal?.throwIfAborted();

    // Split content by line and locate the helptag for highlighting
    const content = text.split(/\r?\n/g);
    const index = content.findIndex((line) =>
      line.includes(`*${item.detail.helptag}*`)
    );

    return {
      content,
      line: index === -1 ? undefined : index + 1,
    };
  });
}

/**
 * Reads and caches the specified helpfile from the runtime paths.
 *
 * This function searches each runtime path for the helpfile in a "doc" folder.
 * If found, it caches the helpfile path and returns the file content as text.
 *
 * @param runtimepaths - The paths to search for the helpfile.
 * @param helpfile - The name of the helpfile to read.
 * @param signal - Optional signal to allow for abortion.
 * @returns The content of the helpfile, or an empty string if not found.
 */
async function readHelpfile(
  runtimepaths: string[],
  helpfile: string,
  signal?: AbortSignal,
): Promise<string> {
  if (helpfileCache.has(helpfile)) {
    return await Deno.readTextFile(helpfileCache.get(helpfile)!);
  }
  for (const runtimepath of runtimepaths) {
    signal?.throwIfAborted();
    try {
      const path = join(runtimepath, "doc", helpfile);
      const text = await Deno.readTextFile(path);
      signal?.throwIfAborted();

      helpfileCache.set(helpfile, path);
      return text;
    } catch (err) {
      if (isSilence(err)) continue;
      throw err;
    }
  }
  return "";
}

/**
 * Determines if an error should be silenced.
 *
 * Certain errors, such as file not found or permission denied, are common and
 * can be ignored without interrupting the process.
 *
 * @param err - The error to check.
 * @returns True if the error can be ignored, otherwise false.
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
      // on macOS, long file name will throw above error
      return true;
    }
  }
  return false;
}
