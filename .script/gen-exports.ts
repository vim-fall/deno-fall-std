import { dirname, fromFileUrl, globToRegExp, relative } from "@std/path";
import { walk } from "@std/fs";
import { parse } from "@std/jsonc";

const excludes = [
  ".*",
  "*_test.ts",
  "*_bench.ts",
  "_*.ts",
];

async function generateExports(
  path: string,
): Promise<Record<string, string>> {
  const patterns = excludes.map((p) => globToRegExp(p));
  const root = fromFileUrl(new URL("../", import.meta.url));
  const it = walk(path, {
    includeFiles: true,
    includeDirs: false,
    skip: [/node_modules/, /\/\..*\//],
  });
  const exports: Record<string, string> = {};
  for await (const entry of it) {
    if (!entry.name.endsWith(".ts")) continue;
    if (patterns.some((p) => p.test(entry.name))) continue;
    const exportName = [".", relative(path, normalizeExportName(entry.path))]
      .filter((v) => !!v)
      .join("/");
    const exportPath = [".", relative(root, entry.path)]
      .filter((v) => !!v)
      .join("/");
    exports[exportName] = exportPath;
  }
  return Object.fromEntries(Object.entries(exports).toSorted());
}

function normalizeExportName(name: string): string {
  if (name.endsWith("/mod.ts")) {
    name = dirname(name);
  }
  name = name.replace(/\.ts$/, "");
  name = name.replace(/_/g, "-");
  return name;
}

if (import.meta.main) {
  const exports = await generateExports(
    fromFileUrl(new URL("../", import.meta.url)),
  );
  const denoJsoncPath = new URL("../deno.jsonc", import.meta.url);
  const denoJsonc = parse(await Deno.readTextFile(denoJsoncPath)) as Record<
    string,
    unknown
  >;
  await Deno.writeTextFile(
    denoJsoncPath,
    JSON.stringify(
      {
        ...denoJsonc,
        exports,
      },
      undefined,
      2,
    ),
  );
}
