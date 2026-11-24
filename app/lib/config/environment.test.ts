import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const PLATFORM_VARIABLES = new Set(["NODE_ENV", "VERCEL_ENV"]);

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      return sourceFiles(path);
    }

    return /\.(?:ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

describe("environment configuration", () => {
  it("documents every application environment variable", () => {
    const root = process.cwd();
    const example = readFileSync(join(root, ".env.example"), "utf8");
    const documented = new Set(
      Array.from(example.matchAll(/^([A-Z][A-Z0-9_]*)=/gm), (match) => match[1])
    );
    const used = new Set(
      sourceFiles(join(root, "app"))
        .flatMap((file) =>
          Array.from(
            readFileSync(file, "utf8").matchAll(/process\.env\.([A-Z][A-Z0-9_]*)/g),
            (match) => match[1]
          )
        )
        .filter((name) => !PLATFORM_VARIABLES.has(name))
    );

    expect([...used].filter((name) => !documented.has(name)).sort()).toEqual([]);
  });
});
