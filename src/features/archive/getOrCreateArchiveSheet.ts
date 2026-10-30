import { STATIC_CONFIG } from "../../config";
import type { Locale } from "../locale/types";

/**
 * Gets or creates the single archive sheet
 *
 * @param ss - Spreadsheet object
 * @param sheetName - Name of the archive sheet
 * @param headers - Header labels for the transaction columns
 * @returns Archive sheet
 */
export const getOrCreateArchiveSheet = (
  ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
  sheetName: string,
  headers: Locale["headers"],
): GoogleAppsScript.Spreadsheet.Sheet => {
  let archiveSheet = ss.getSheetByName(sheetName);

  // Create the archive sheet if it does not exist
  if (!archiveSheet) {
    archiveSheet = ss.insertSheet(sheetName);

    // Set the header row (columns A to F only)
    archiveSheet.getRange("A1").setValue(headers.date);
    archiveSheet.getRange("B1").setValue(headers.type);
    archiveSheet.getRange("C1").setValue(headers.category);
    archiveSheet.getRange("D1").setValue(headers.description);
    archiveSheet.getRange("E1").setValue(headers.income);
    archiveSheet.getRange("F1").setValue(headers.expense);
    // Do not touch column G (reserved for formulas)

    // Header row style
    archiveSheet.getRange("A1:F1").setFontWeight("bold");
    archiveSheet.getRange("A1:F1").setBackground("#f3f3f3");

    // Set the date column format
    archiveSheet.getRange("A2:A1000").setNumberFormat(STATIC_CONFIG.DATE_FORMAT);

    // Set the amount column format
    archiveSheet.getRange("E2:F1000").setNumberFormat(STATIC_CONFIG.AMOUNT_FORMAT);
  }

  return archiveSheet;
};
