import type { CategoryCatalog } from "../category/categoryCatalog";

/**
 * System settings - centrally manages values such as sheet layout and column definitions
 */
export type ConfigObject = {
  // Date format
  DATE_FORMAT: string;

  // Input sheet column definitions (0-based index)
  INPUT_COLUMNS: {
    DATE: number; // Column A: date
    TYPE: number; // Column B: type (cash, bank, etc.)
    CATEGORY: number; // Column C: category
    DESCRIPTION: number; // Column D: description
    INCOME: number; // Column E: income
    EXPENSE: number; // Column F: expense
  };

  // Archive sheet column definitions (same structure as the input sheet)
  ARCHIVE_COLUMNS: {
    DATE: number;
    TYPE: number;
    CATEGORY: number;
    DESCRIPTION: number;
    INCOME: number;
    EXPENSE: number;
  };

  // Type options
  TYPE_OPTIONS: string[];

  CATEGORY_CATALOG: CategoryCatalog;

  // Chart settings
  CHART: {
    COMMON_WIDTH: number; // Common width
    COMMON_HEIGHT: number; // Common height
    EXPENSE_Y_MARGIN: number; // How many px below the income breakdown chart the expense breakdown chart is placed
  };
};

/**
 * Type of data read from the config sheet
 *
 * The config sheet has a multi-section structure and manages the following:
 * - Type options (ways of holding money: cash, bank account, e-money)
 * - Categories (income-salary, expense-food, etc.), each with its income/expense kind and
 *   whether it is excluded from aggregation
 *
 * Note: types and categories are independent options and have no mapping between them
 */
export type ConfigSheetData = {
  // Type options (cash, bank-SBI Shinsei Bank, e-money-PayPay, etc.)
  typeOptions: string[];
  catalog: CategoryCatalog;
};

export type ConfigRow = readonly [type: string, category: string, excluded: boolean, kind: string];
