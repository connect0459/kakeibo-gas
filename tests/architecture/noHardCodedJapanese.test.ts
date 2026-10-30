import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const SOURCE_ROOT = fileURLToPath(new URL("../../src", import.meta.url));

const JAPANESE_TEXT = /[\u3000-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uff00-\uffef]/;

const DICTIONARIES = ["features/locale/ja.ts"];

const JAPANESE_DEFAULT_DATA_FILES = [
  "features/config/defaultConfigRows.ja.ts",
];

const isProductionSource = (path: string): boolean =>
  path.endsWith(".ts") && !path.endsWith(".test.ts") && !path.endsWith(".d.ts");

const listSourceFiles = (): string[] =>
  readdirSync(SOURCE_ROOT, { recursive: true, encoding: "utf8" })
    .map((path) => path.split("\\").join("/"))
    .filter(isProductionSource)
    .filter((path) => !DICTIONARIES.includes(path))
    .filter((path) => !JAPANESE_DEFAULT_DATA_FILES.includes(path))
    .sort();

const textLiteralsIn = (path: string): string[] => {
  const source = ts.createSourceFile(
    path,
    readFileSync(join(SOURCE_ROOT, path), "utf8"),
    ts.ScriptTarget.ES2020,
    true,
  );
  const literals: string[] = [];
  const visit = (node: ts.Node): void => {
    if (
      ts.isStringLiteral(node) ||
      ts.isNoSubstitutionTemplateLiteral(node) ||
      ts.isTemplateHead(node) ||
      ts.isTemplateMiddle(node) ||
      ts.isTemplateTail(node)
    ) {
      literals.push(node.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return literals;
};

describe("source text", () => {
  it("lives in the locale dictionaries, not in string literals elsewhere", () => {
    const offenders = listSourceFiles().flatMap((path) =>
      textLiteralsIn(path)
        .filter((text) => JAPANESE_TEXT.test(text))
        .map((text) => `${relative(SOURCE_ROOT, join(SOURCE_ROOT, path))}: ${text}`),
    );

    expect(offenders).toEqual([]);
  });

  it("scans the production sources", () => {
    expect(listSourceFiles()).toEqual(
      expect.arrayContaining(["main.ts", "config.ts", "features/archive/planArchive.ts"]),
    );
  });
});
