import type { Locale } from "../locale/types";
import { getDefaultConfigRows } from "./getDefaultConfigRows";

/**
 * Initializes or gets the config sheet
 *
 * Creates a new config sheet with default data if it does not exist.
 * Returns the existing sheet as is.
 *
 * @param spreadsheet - Spreadsheet
 * @param locale - Locale that names the sheet and supplies its headers and default rows
 * @returns Config sheet
 *
 * @example
 * ```typescript
 * const ss = SpreadsheetApp.getActiveSpreadsheet();
 * const configSheet = initializeConfigSheet(ss, en);
 * ```
 */
export const initializeConfigSheet = (
  spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet,
  locale: Locale,
): GoogleAppsScript.Spreadsheet.Sheet => {
  let configSheet = spreadsheet.getSheetByName(locale.sheets.config);

  // Return the config sheet as is if it already exists
  if (configSheet) {
    return configSheet;
  }

  // Create a new config sheet
  configSheet = spreadsheet.insertSheet(locale.sheets.config);

  // Set the header row
  configSheet.getRange("A1").setValue(locale.configHeaders.type);
  configSheet.getRange("B1").setValue(locale.configHeaders.category);
  configSheet.getRange("C1").setValue(locale.configHeaders.excludeFromStats);
  configSheet.getRange("D1").setValue(locale.configHeaders.kind);

  // Header row style
  configSheet.getRange("A1:D1").setFontWeight("bold");
  configSheet.getRange("A1:D1").setBackground("#f3f3f3");

  const rows = getDefaultConfigRows(locale.id);
  configSheet.getRange(2, 1, rows.length, 4).setValues(rows.map((row) => [...row]));

  configSheet
    .getRange("C2:C1000")
    .setDataValidation(
      SpreadsheetApp.newDataValidation().requireCheckbox().setAllowInvalid(false).build(),
    );
  configSheet
    .getRange("D2:D1000")
    .setDataValidation(
      SpreadsheetApp.newDataValidation()
        .requireValueInList([locale.vocabulary.income, locale.vocabulary.expense], true)
        .setAllowInvalid(false)
        .build(),
    );

  // Auto-resize column widths
  configSheet.autoResizeColumn(1);
  configSheet.autoResizeColumn(2);
  configSheet.autoResizeColumn(3);
  configSheet.autoResizeColumn(4);

  return configSheet;
};
