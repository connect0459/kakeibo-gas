/**
 * Transaction data type definition
 */
export interface TransactionData {
  date: Date | null;
  type: string;
  category: string;
  description: string;
  income: number;
  expense: number;
  total: number;
}

/**
 * Processes raw data and converts it to the standard format
 *
 * @param data - Raw data from the spreadsheet (columns A to F)
 * @returns Array of processed transaction data (entries with an empty category are excluded)
 */
export const processRawData = (data: unknown[][]): TransactionData[] => {
  const result: TransactionData[] = [];
  let lastValidDate: Date | null = null;
  let lastValidType: string | null = null;

  // Column index definitions (columns A to F)
  const COLUMN = {
    DATE: 0,
    TYPE: 1,
    CATEGORY: 2,
    DESCRIPTION: 3,
    INCOME: 4,
    EXPENSE: 5,
  } as const;

  // Process every row
  for (let i = 0; i < data.length; i++) {
    const row = data[i];

    // Skip blank rows
    if (!row[0] && !row[1] && !row[2] && !row[3] && !row[4] && !row[5]) {
      continue;
    }

    // Parse income
    let income = 0;
    const incomeValue = row[COLUMN.INCOME];
    if (incomeValue !== null && incomeValue !== "") {
      income =
        typeof incomeValue === "number"
          ? incomeValue
          : Number(String(incomeValue).replace(/[^\d.-]/g, ""));
    }

    // Parse expense
    let expense = 0;
    const expenseValue = row[COLUMN.EXPENSE];
    if (expenseValue !== null && expenseValue !== "") {
      expense =
        typeof expenseValue === "number"
          ? expenseValue
          : Number(String(expenseValue).replace(/[^\d.-]/g, ""));
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
      income: income,
      expense: expense,
      total: income - expense,
    });
  }

  // Return only data with a non-empty category
  return result.filter((item) => item.category);
};
