import type { ConfigRow } from "./types";

const defaultTypeRows: readonly ConfigRow[] = [
  ["Cash", "Income-Salary-Base", false, "Income"],
  ["Bank-Checking", "Income-Salary-Bonus", false, "Income"],
  ["Bank-Savings", "Income-Investment-Dividends", false, "Income"],
  ["E-money", "Income-Investment-Interest", false, "Income"],
];

const defaultIncomeCategoryRows: readonly ConfigRow[] = [
  ["", "Income-Windfall-Gift", false, "Income"],
  ["", "Income-Cash adjustment", false, "Income"],
  ["", "Income-Type transfer", true, "Income"],
  ["", "Income-Carryover", true, "Income"],
  ["", "Income-Other", false, "Income"],
];

const defaultExpenseCategoryRows: readonly ConfigRow[] = [
  ["", "Expense-Housing-Rent", false, "Expense"],
  ["", "Expense-Housing-Repairs", false, "Expense"],
  ["", "Expense-Utilities-Electricity and gas", false, "Expense"],
  ["", "Expense-Utilities-Water", false, "Expense"],
  ["", "Expense-Communication-Phone", false, "Expense"],
  ["", "Expense-Communication-Internet", false, "Expense"],
  ["", "Expense-Food-Groceries", false, "Expense"],
  ["", "Expense-Food-Dining out", false, "Expense"],
  ["", "Expense-Daily goods-Clothing", false, "Expense"],
  ["", "Expense-Daily goods-Household", false, "Expense"],
  ["", "Expense-Transport-Public transit", false, "Expense"],
  ["", "Expense-Transport-Taxi", false, "Expense"],
  ["", "Expense-Medical-Consultation", false, "Expense"],
  ["", "Expense-Medical-Medicine", false, "Expense"],
  ["", "Expense-Learning-Books", false, "Expense"],
  ["", "Expense-Leisure-Travel", false, "Expense"],
  ["", "Expense-Leisure-Hobbies", false, "Expense"],
  ["", "Expense-Insurance-Life", false, "Expense"],
  ["", "Expense-Insurance-Health", false, "Expense"],
  ["", "Expense-Social insurance-Pension", false, "Expense"],
  ["", "Expense-Taxes-Income tax", false, "Expense"],
  ["", "Expense-Taxes-Resident tax", false, "Expense"],
  ["", "Expense-Investment-Funds", false, "Expense"],
  ["", "Expense-Savings-Time deposit", false, "Expense"],
  ["", "Expense-Gifts-Presents", false, "Expense"],
  ["", "Expense-Cash adjustment", false, "Expense"],
  ["", "Expense-Type transfer", true, "Expense"],
  ["", "Expense-Other", false, "Expense"],
];

export const ENGLISH_DEFAULT_CONFIG_ROWS: readonly ConfigRow[] = [
  ...defaultTypeRows,
  ...defaultIncomeCategoryRows,
  ...defaultExpenseCategoryRows,
];
