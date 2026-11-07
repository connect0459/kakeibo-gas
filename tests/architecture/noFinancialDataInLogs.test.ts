import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const SOURCE_ROOT = fileURLToPath(new URL("../../src", import.meta.url));

const ROUTINE_LOG_METHODS = ["log", "info", "debug"];

const COUNT_OR_IDENTIFIER_PROPERTIES = ["length", "id"];

const isProductionSource = (path: string): boolean =>
  path.endsWith(".ts") && !path.endsWith(".test.ts") && !path.endsWith(".d.ts");

const isRoutineConsoleCall = (node: ts.CallExpression): boolean =>
  ts.isPropertyAccessExpression(node.expression) &&
  ts.isIdentifier(node.expression.expression) &&
  node.expression.expression.text === "console" &&
  ROUTINE_LOG_METHODS.includes(node.expression.name.text);

const isSafeLogArgument = (argument: ts.Expression): boolean =>
  ts.isStringLiteral(argument) ||
  ts.isNoSubstitutionTemplateLiteral(argument) ||
  (ts.isPropertyAccessExpression(argument) &&
    COUNT_OR_IDENTIFIER_PROPERTIES.includes(argument.name.text));

const unsafeRoutineLogsIn = (path: string): string[] => {
  const source = ts.createSourceFile(
    path,
    readFileSync(join(SOURCE_ROOT, path), "utf8"),
    ts.ScriptTarget.ES2020,
    true,
  );
  const offenders: string[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && isRoutineConsoleCall(node)) {
      if (!node.arguments.every(isSafeLogArgument)) {
        const { line } = source.getLineAndCharacterOfPosition(node.getStart());
        offenders.push(`${path}:${line + 1}: ${node.getText(source)}`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return offenders;
};

describe("routine logging", () => {
  it("carries only fixed messages, counts, and identifiers so financial figures and category names never reach Cloud Logging", () => {
    const offenders = readdirSync(SOURCE_ROOT, { recursive: true, encoding: "utf8" })
      .map((path) => path.split("\\").join("/"))
      .filter(isProductionSource)
      .sort()
      .flatMap(unsafeRoutineLogsIn);

    expect(offenders).toEqual([]);
  });
});
