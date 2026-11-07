import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ALLOWED_SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets.currentonly",
  "https://www.googleapis.com/auth/script.container.ui",
];

const manifest = JSON.parse(
  readFileSync(fileURLToPath(new URL("../../appsscript.json", import.meta.url)), "utf8"),
) as { oauthScopes?: string[] };

describe("authorization scopes", () => {
  it("are declared explicitly, so Apps Script does not infer broad spreadsheet access", () => {
    expect(manifest.oauthScopes).toBeInstanceOf(Array);
    expect(manifest.oauthScopes?.length).toBeGreaterThan(0);
  });

  it("are limited to the bound spreadsheet and its UI", () => {
    const outsideAllowlist = (manifest.oauthScopes ?? []).filter(
      (scope) => !ALLOWED_SCOPES.includes(scope),
    );

    expect(outsideAllowlist).toEqual([]);
  });
});
