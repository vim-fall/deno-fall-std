import * as fn from "@denops/std/function";

import { defineSource, type Source } from "../../source.ts";

const CHUNK_SIZE = 1000;

type Detail = {
  /**
   * Buffer number.
   */
  bufnr: number;

  /**
   * Buffer name.
   */
  bufname: string;

  /**
   * The line number within the buffer.
   */
  line: number;

  /**
   * The content of the line.
   */
  context: string;
};

/**
 * Options for the line source.
 * - `chunkSize`: Specifies the number of lines to read at once from the buffer.
 */
export type LineOptions = {
  chunkSize?: number;
};

/**
 * Source to retrieve lines from the specified buffer.
 *
 * This source reads lines from a buffer in chunks and yields each line with its
 * associated metadata, such as the buffer number, buffer name, and line content.
 *
 * @param options - Configuration options, such as `chunkSize` to specify the batch size for reading lines.
 * @returns A Source that yields each line in the buffer as an item.
 */
export function line(options: LineOptions = {}): Source<Detail> {
  const { chunkSize = CHUNK_SIZE } = options;

  return defineSource<Detail>(async function* (denops, { args }, { signal }) {
    const expr = args[0] ?? "%"; // Defaults to the current buffer if no argument is provided.
    await fn.bufload(denops, expr); // Ensure the buffer is loaded.
    signal?.throwIfAborted();
    const bufinfos = await fn.getbufinfo(denops, expr); // Retrieve buffer information.
    signal?.throwIfAborted();
    const bufinfo = bufinfos[0];

    let line = 1;
    let id = 0;

    // Loop through the buffer lines in chunks.
    while (line <= bufinfo.linecount) {
      const content = await fn.getbufline(
        denops,
        expr,
        line,
        line + chunkSize - 1, // Read a chunk of lines.
      );
      signal?.throwIfAborted();

      let offset = 0;
      for (const value of content) {
        yield {
          id: id++,
          value,
          detail: {
            line: line + offset,
            bufnr: bufinfo.bufnr,
            bufname: bufinfo.name,
            context: value,
          },
        };
        offset++;
      }
      line += chunkSize; // Move to the next chunk.
    }
  });
}
