import { getLocale } from "./getLocale";
import { resolveLocale } from "./resolveLocale";
import type { Locale } from "./types";

type DetectableSpreadsheet = {
  getSheets(): { getName(): string }[];
  getSpreadsheetLocale(): string;
};

export const detectLocale = (spreadsheet: DetectableSpreadsheet): Locale =>
  getLocale(
    resolveLocale({
      sheetNames: spreadsheet.getSheets().map((sheet) => sheet.getName()),
      spreadsheetLocale: spreadsheet.getSpreadsheetLocale(),
    }),
  );
