import { describe, expect, it } from "vitest";
import { detectLocale } from "./detectLocale";
import { en } from "./en";
import { ja } from "./ja";

const spreadsheet = (sheetNames: string[], spreadsheetLocale: string) => ({
  getSheets: () => sheetNames.map((name) => ({ getName: () => name })),
  getSpreadsheetLocale: () => spreadsheetLocale,
});

describe("detectLocale", () => {
  it("uses the Japanese dictionary for a spreadsheet that already has the Japanese sheets", () => {
    const sheets = ["入力", "結果", "アーカイブ", "設定"];

    expect(detectLocale(spreadsheet(sheets, "ja_JP"))).toBe(ja);
  });

  it("keeps the language of the existing sheets when the spreadsheet locale says otherwise", () => {
    expect(detectLocale(spreadsheet(["入力", "設定"], "en_US"))).toBe(ja);
    expect(detectLocale(spreadsheet(["Input", "Config"], "ja_JP"))).toBe(en);
  });

  it("follows the spreadsheet locale when the script has not created any sheet yet", () => {
    expect(detectLocale(spreadsheet(["Sheet1"], "ja_JP"))).toBe(ja);
    expect(detectLocale(spreadsheet(["Sheet1"], "en_US"))).toBe(en);
    expect(detectLocale(spreadsheet(["シート1"], "fr_FR"))).toBe(en);
  });
});
