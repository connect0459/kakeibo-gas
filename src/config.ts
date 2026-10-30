/**
 * Static system settings - values that do not change, such as sheet layout and column definitions
 */
export const STATIC_CONFIG = {
  // Date format
  DATE_FORMAT: "yyyy-MM-dd",

  // Number format of the amount columns on the input and archive sheets
  AMOUNT_FORMAT: "#,##0",

  // Number formats of the amount and ratio cells on the result sheet
  RESULT_AMOUNT_FORMAT: "¥#,##0",
  RESULT_RATIO_FORMAT: "0.0%",

  // Input sheet column definitions (0-based index)
  INPUT_COLUMNS: {
    DATE: 0, // Column A: date
    TYPE: 1, // Column B: type (cash, bank, etc.)
    CATEGORY: 2, // Column C: category
    DESCRIPTION: 3, // Column D: description
    INCOME: 4, // Column E: income
    EXPENSE: 5, // Column F: expense
  },

  // Archive sheet column definitions (same structure as the input sheet)
  ARCHIVE_COLUMNS: {
    DATE: 0,
    TYPE: 1,
    CATEGORY: 2,
    DESCRIPTION: 3,
    INCOME: 4,
    EXPENSE: 5,
  },

  // Chart settings
  CHART: {
    COMMON_WIDTH: 400, // Common width
    COMMON_HEIGHT: 350, // Common height
    EXPENSE_Y_MARGIN: 50, // How many px below the income breakdown chart the expense breakdown chart is placed
  },
} as const;
