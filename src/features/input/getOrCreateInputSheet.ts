import { STATIC_CONFIG } from "../../config";
import type { Locale } from "../locale/types";

/**
 * Gets or creates the input sheet
 *
 * @param ss - Spreadsheet object
 * @param locale - Locale that names the sheet and its header row
 * @param typeOptions - Reads the type options for the dropdown; called only when the sheet is created
 * @returns Input sheet
 */
export const getOrCreateInputSheet = (
  ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
  locale: Locale,
  typeOptions: () => string[],
): GoogleAppsScript.Spreadsheet.Sheet => {
  let inputSheet = ss.getSheetByName(locale.sheets.input);

  if (!inputSheet) {
    inputSheet = ss.insertSheet(locale.sheets.input);

    const { headers } = locale;
    inputSheet.getRange("A1").setValue(headers.date);
    inputSheet.getRange("B1").setValue(headers.type);
    inputSheet.getRange("C1").setValue(headers.category);
    inputSheet.getRange("D1").setValue(headers.description);
    inputSheet.getRange("E1").setValue(headers.income);
    inputSheet.getRange("F1").setValue(headers.expense);

    inputSheet.getRange("A1:F1").setFontWeight("bold");
    inputSheet.getRange("A1:F1").setBackground("#f3f3f3");

    inputSheet.getRange("A2:A1000").setNumberFormat(STATIC_CONFIG.DATE_FORMAT);
    inputSheet.getRange("E2:F1000").setNumberFormat(STATIC_CONFIG.AMOUNT_FORMAT);

    const typeValidation = SpreadsheetApp.newDataValidation()
      .requireValueInList(typeOptions(), true)
      .build();
    inputSheet.getRange("B2:B1000").setDataValidation(typeValidation);
  }

  return inputSheet;
};
