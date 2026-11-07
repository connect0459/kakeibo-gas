import type { TransactionData } from "../aggregation/types";
import { parseAmount } from "../amount/parseAmount";

export interface RawDataSource {
  sheetName: string;
  firstRow: number;
  describeInvalidAmount: (sheetName: string, row: number) => string;
}

/**
 * Processes raw data and converts it to the standard format
 *
 * @param data - Raw data from the spreadsheet (columns A to E)
 * @param source - Sheet name, sheet row of the first data row, and the error message for a rejected amount
 * @throws When an amount is not a plain number
 * @returns Array of processed transaction data (entries with an empty category are excluded)
 */
export const processRawData = (data: unknown[][], source: RawDataSource): TransactionData[] => {
  const result: TransactionData[] = [];
  let lastValidDate: Date | null = null;
  let lastValidType: string | null = null;

  // Column index definitions (columns A to E)
  const COLUMN = {
    DATE: 0,
    TYPE: 1,
    CATEGORY: 2,
    DESCRIPTION: 3,
    AMOUNT: 4,
  } as const;

  // Process every row
  for (let i = 0; i < data.length; i++) {
    const row = data[i];

    // Skip blank rows
    if (!row[0] && !row[1] && !row[2] && !row[3] && !row[4]) {
      continue;
    }

    const amount = parseAmount(row[COLUMN.AMOUNT]);
    if (amount === null) {
      throw new Error(source.describeInvalidAmount(source.sheetName, source.firstRow + i));
    }

    // Date handling - update if the current row has a date, otherwise use the previous valid date
    let date = row[COLUMN.DATE];
    if (date && date instanceof Date && !isNaN(date.getTime())) {
      lastValidDate = date;
    } else {
      date = lastValidDate;
    }

    // Type handling - update if the current row has a type, otherwise use the previous valid type
    let type = row[COLUMN.TYPE];
    if (type && typeof type === "string" && type.trim() !== "") {
      lastValidType = type;
    } else {
      type = lastValidType;
    }

    // Add to the result
    result.push({
      date: date as Date | null,
      type: type as string,
      category: row[COLUMN.CATEGORY] as string,
      description: row[COLUMN.DESCRIPTION] as string,
      amount,
    });
  }

  // Return only data with a non-empty category
  return result.filter((item) => item.category);
};
