import { describe, expect, it } from "vitest";
import { resolveLocale } from "./resolveLocale";

describe("resolveLocale", () => {
  describe("when the spreadsheet already has sheets named by the script", () => {
    it("picks ja when a Japanese-named sheet exists, even in an English spreadsheet", () => {
      expect(resolveLocale({ sheetNames: ["入力", "Sheet1"], spreadsheetLocale: "en_US" })).toBe(
        "ja",
      );
    });

    it("picks en when an English-named sheet exists, even in a Japanese spreadsheet", () => {
      expect(resolveLocale({ sheetNames: ["Input"], spreadsheetLocale: "ja_JP" })).toBe("en");
    });

    it("picks ja when sheets of both languages exist", () => {
      expect(resolveLocale({ sheetNames: ["Input", "結果"], spreadsheetLocale: "en_US" })).toBe(
        "ja",
      );
    });

    it.each(["入力", "結果", "アーカイブ", "設定"])("recognizes the Japanese sheet %s", (name) => {
      expect(resolveLocale({ sheetNames: [name], spreadsheetLocale: "en_US" })).toBe("ja");
    });

    it.each(["Input", "Result", "Archive", "Config"])("recognizes the English sheet %s", (name) => {
      expect(resolveLocale({ sheetNames: [name], spreadsheetLocale: "ja_JP" })).toBe("en");
    });
  });

  describe("when no sheet decides the locale", () => {
    it.each(["ja", "ja_JP", "ja-JP", "JA_jp"])(
      "picks ja for the spreadsheet locale %s",
      (locale) => {
        expect(resolveLocale({ sheetNames: ["Sheet1"], spreadsheetLocale: locale })).toBe("ja");
      },
    );

    it.each(["en_US", "en_GB", "fr_FR", "jam_XX", ""])(
      "picks en for the spreadsheet locale %j",
      (locale) => {
        expect(resolveLocale({ sheetNames: [], spreadsheetLocale: locale })).toBe("en");
      },
    );
  });
});
