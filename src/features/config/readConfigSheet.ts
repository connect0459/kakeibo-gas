import { CategoryCatalog, type CategoryEntry } from "../category/categoryCatalog";
import { parseKindWord } from "../category/parseKindWord";
import type { ConfigSheetData } from "./types";

// Config sheet column indexes
const COLUMN_INDEX = {
  TYPE: 0, // Column A: type
  CATEGORY: 1, // Column B: category
  EXCLUDE_FLAG: 2, // Column C: exclusion flag
  KIND: 3,
} as const;

// Valid exclusion flag values
const EXCLUDE_FLAG_VALUES = ["TRUE", "✓"];

const isExcludeFlag = (value: unknown): boolean =>
  value === true ||
  EXCLUDE_FLAG_VALUES.includes(
    String(value || "")
      .trim()
      .toUpperCase(),
  );

/**
 * Reads data from the config sheet
 *
 * @param sheet - Config sheet
 * @returns Data read from the config sheet
 *
 * @example
 * ```typescript
 * const ss = SpreadsheetApp.getActiveSpreadsheet();
 * const configSheet = ss.getSheetByName("Config");
 * const config = readConfigSheet(configSheet);
 * console.log(config.typeOptions); // ["Cash", "Bank-Example", ...]
 * ```
 */
export const readConfigSheet = (sheet: GoogleAppsScript.Spreadsheet.Sheet): ConfigSheetData => {
  // Skip the header row
  const dataRows = sheet.getDataRange().getValues().slice(1);

  const typeOptions: string[] = [];
  const categories: CategoryEntry[] = [];

  for (const row of dataRows) {
    if (
      !row[COLUMN_INDEX.TYPE] &&
      !row[COLUMN_INDEX.CATEGORY] &&
      !row[COLUMN_INDEX.EXCLUDE_FLAG] &&
      !row[COLUMN_INDEX.KIND]
    ) {
      continue;
    }

    const type = String(row[COLUMN_INDEX.TYPE] || "").trim();
    if (type) {
      typeOptions.push(type);
    }

    const category = String(row[COLUMN_INDEX.CATEGORY] || "").trim();
    if (category) {
      categories.push({
        name: category,
        kind: parseKindWord(row[COLUMN_INDEX.KIND]),
        excluded: isExcludeFlag(row[COLUMN_INDEX.EXCLUDE_FLAG]),
      });
    }
  }

  return { typeOptions, catalog: CategoryCatalog.of(categories) };
};
