import * as opt from "@denops/std/option";
import { expandGlob } from "@std/fs/expand-glob";
import { join } from "@std/path/join";

import { defineSource, type Source } from "../../source.ts";

type Detail = {
  /**
   * The helptag identifier.
   */
  helptag: string;

  /**
   * The file where the helptag is located.
   */
  helpfile: string;

  /**
   * Optional language code for localized helptags.
   */
  lang?: string;
};

/**
 * Creates a Source for Vim helptags.
 *
 * This function retrieves helptags from the 'doc/tags' files located in
 * each directory in the runtime path, yielding helptags as items.
 * Each helptag includes optional language information if available.
 *
 * @returns A Source that yields helptags with associated details.
 */
export function helptag(): Source<Detail> {
  return defineSource(async function* (denops, _params, { signal }) {
    const runtimepaths = (await opt.runtimepath.get(denops)).split(",");
    signal?.throwIfAborted();
    const seen = new Set<string>();
    let id = 0;

    for (const runtimepath of runtimepaths) {
      for await (const helptag of discoverHelptags(runtimepath)) {
        signal?.throwIfAborted();
        const key = `${helptag.helptag}:${helptag.lang ?? ""}`;
        if (seen.has(key)) {
          continue;
        }
        yield {
          id: id++,
          value: helptag.helptag,
          detail: helptag,
        };
        seen.add(key);
      }
    }
  });
}

/**
 * Discovers helptags in the 'doc/tags' files within a given runtime path.
 *
 * This function reads helptag information from files in the `doc` directory
 * and handles both standard and localized tags files.
 *
 * @param runtimepath - The base path to search for helptag files.
 * @returns An async generator yielding helptag objects.
 */
async function* discoverHelptags(
  runtimepath: string,
): AsyncGenerator<Detail> {
  const pattern = /^tags(?:-\w{2})?$/;
  try {
    for await (
      const { path, name } of expandGlob(join(runtimepath, "doc", "*"), {
        includeDirs: false,
      })
    ) {
      if (!pattern.test(name)) {
        continue;
      }
      const lang = name.match(pattern)?.at(1);
      for (const helptag of parseHelptags(await Deno.readTextFile(path))) {
        yield {
          ...helptag,
          lang,
        };
      }
    }
  } catch (err) {
    if (isSilence(err)) return;
    throw err;
  }
}

/**
 * Parses the content of a helptag file to extract helptags and file associations.
 *
 * @param content - The raw content of the helptag file.
 * @returns A generator yielding helptag objects.
 */
function* parseHelptags(content: string): Generator<Detail> {
  const lines = content.split("\n");
  for (const line of lines) {
    if (line.startsWith("!_TAG_") || line.trim() === "") {
      continue;
    }
    const [helptag, helpfile] = line.split("\t", 3);
    yield { helptag, helpfile };
  }
}

/**
 * Determines if an error is a non-fatal, ignorable error.
 *
 * This includes errors like file not found, permission denied,
 * and filesystem loop errors, which are expected in some environments.
 *
 * @param err - The error to check.
 * @returns True if the error is ignorable, false otherwise.
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
