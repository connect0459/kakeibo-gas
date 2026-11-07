import { STATIC_CONFIG } from "../../config";
import type { TransactionData } from "../aggregation/types";
import { parseAmount } from "../amount/parseAmount";
import { parseDateInZone } from "../date/parseDateInZone";

/**
 * Gets all data from the archive sheet
 *
 * @param ss - Spreadsheet object
 * @param archiveSheetName - Name of the archive sheet
 * @param timeZone - IANA time zone in which a text date is read
 * @param describeInvalidAmount - Error message for an amount that is negative or not a plain number
 * @returns Array of all transaction data (no period filter)
 */
export const getArchiveData = (
  ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
  archiveSheetName: string,
  timeZone: string,
  describeInvalidAmount: (sheetName: string, row: number) => string,
): TransactionData[] => {
  const archiveSheet = ss.getSheetByName(archiveSheetName);

  // When the archive sheet does not exist or is empty
  if (!archiveSheet || archiveSheet.getLastRow() === 0) {
    return [];
  }

  const lastRow = archiveSheet.getLastRow();

  // When only the header row exists
  if (lastRow === 1) {
    return [];
  }

  // Get all data (including the header row)
  const allData = archiveSheet.getDataRange().getValues();

  // Convert to TransactionData excluding the header row
  return allData.slice(1).map((row, index) => {
    const rawDate = row[STATIC_CONFIG.ARCHIVE_COLUMNS.DATE];
    let date: Date;
    if (rawDate instanceof Date) {
      date = rawDate;
    } else if (typeof rawDate === "string") {
      date = parseDateInZone(rawDate, timeZone);
    } else {
      date = new Date(rawDate);
    }
    const income = parseAmount(row[STATIC_CONFIG.ARCHIVE_COLUMNS.INCOME]);
    const expense = parseAmount(row[STATIC_CONFIG.ARCHIVE_COLUMNS.EXPENSE]);
    if (income === null || expense === null) {
      throw new Error(describeInvalidAmount(archiveSheetName, index + 2));
    }

    return {
      date,
      type: String(row[STATIC_CONFIG.ARCHIVE_COLUMNS.TYPE]),
      category: String(row[STATIC_CONFIG.ARCHIVE_COLUMNS.CATEGORY]),
      description: String(row[STATIC_CONFIG.ARCHIVE_COLUMNS.DESCRIPTION]),
      income,
      expense,
      total: income - expense,
    };
  });
};
