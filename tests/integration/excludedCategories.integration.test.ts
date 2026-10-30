import { describe, expect, test } from "vitest";
import { aggregateByCategory } from "../../src/features/aggregation/aggregateByCategory";
import type { TransactionData } from "../../src/features/aggregation/types";
import { readConfigSheet } from "../../src/features/config/readConfigSheet";
import { en } from "../../src/features/locale/en";
import { ja } from "../../src/features/locale/ja";

const createConfigSheet = (rows: unknown[][]) =>
  ({
    getDataRange: () => ({ getValues: () => rows }),
  }) as unknown as GoogleAppsScript.Spreadsheet.Sheet;

const createTransaction = (category: string, income: number, expense: number): TransactionData => ({
  date: new Date("2025-11-01"),
  type: "現金",
  category,
  description: "",
  income,
  expense,
  total: income - expense,
});

const HEADER = ["分類", "科目", "集計から除外", "収支"];

describe("Aggregating with categories read from the config sheet", () => {
  describe("excluded categories", () => {
    test("Income carryover is not included in aggregation", () => {
      const { catalog } = readConfigSheet(
        createConfigSheet([
          HEADER,
          ["現金", "収入-給与-本給", "", "収入"],
          ["", "収入-繰越金", "TRUE", "収入"],
        ]),
      );
      const transactions = [
        createTransaction("収入-給与-本給", 300000, 0),
        createTransaction("収入-繰越金", 100000, 0),
      ];

      const income = aggregateByCategory(transactions, "income", catalog, ja.vocabulary.otherGroup);

      expect(income).toEqual({ 給与: 300000 });
    });

    test("A type transfer is excluded from income and from expense", () => {
      const { catalog } = readConfigSheet(
        createConfigSheet([
          HEADER,
          ["", "収入-分類移動", "TRUE", "収入"],
          ["", "支出-分類移動", "TRUE", "支出"],
          ["", "収入-給与-本給", "", "収入"],
          ["", "支出-食費-外食", "", "支出"],
        ]),
      );
      const transactions = [
        createTransaction("収入-給与-本給", 300000, 0),
        createTransaction("収入-分類移動", 20000, 0),
        createTransaction("支出-食費-外食", 0, 5000),
        createTransaction("支出-分類移動", 0, 20000),
      ];

      expect(aggregateByCategory(transactions, "income", catalog, ja.vocabulary.otherGroup)).toEqual(
        { 給与: 300000 },
      );
      expect(aggregateByCategory(transactions, "expense", catalog, ja.vocabulary.otherGroup)).toEqual(
        { 食費: 5000 },
      );
    });

    test("Everything is aggregated when nothing is flagged as excluded", () => {
      const { catalog } = readConfigSheet(
        createConfigSheet([
          HEADER,
          ["", "収入-給与-本給", "", "収入"],
          ["", "収入-繰越金", "", "収入"],
        ]),
      );
      const transactions = [
        createTransaction("収入-給与-本給", 300000, 0),
        createTransaction("収入-繰越金", 100000, 0),
      ];

      const income = aggregateByCategory(transactions, "income", catalog, ja.vocabulary.otherGroup);

      expect(income).toEqual({ 給与: 300000, 繰越金: 100000 });
    });

    test("Carryover rows written by monthly archiving are left out while the month's income counts", () => {
      const { catalog } = readConfigSheet(
        createConfigSheet([
          HEADER,
          ["現金", "収入-給与-本給", "", "収入"],
          ["", "収入-繰越金", true, "収入"],
          ["", "支出-食費-食料品", false, "支出"],
        ]),
      );
      const transactions = [
        createTransaction("収入-繰越金", 2438239, 0),
        createTransaction("収入-繰越金", 1021136, 0),
        createTransaction("収入-給与-本給", 300000, 0),
        createTransaction("支出-食費-食料品", 0, 1182),
      ];

      expect(aggregateByCategory(transactions, "income", catalog, ja.vocabulary.otherGroup)).toEqual(
        { 給与: 300000 },
      );
      expect(aggregateByCategory(transactions, "expense", catalog, ja.vocabulary.otherGroup)).toEqual(
        { 食費: 1182 },
      );
    });
  });

  describe("income and expense kinds", () => {
    test("A config sheet in English aggregates English categories", () => {
      const { catalog } = readConfigSheet(
        createConfigSheet([
          ["Type", "Category", "Exclude from summary", "Income/Expense"],
          ["Cash", "Income-Salary-Base", false, "Income"],
          ["", "Income-Carryover", true, "Income"],
          ["", "Expense-Food-Dining", false, "Expense"],
        ]),
      );
      const transactions = [
        createTransaction("Income-Salary-Base", 300000, 0),
        createTransaction("Income-Carryover", 100000, 0),
        createTransaction("Expense-Food-Dining", 0, 5000),
      ];

      expect(aggregateByCategory(transactions, "income", catalog, en.vocabulary.otherGroup)).toEqual(
        { Salary: 300000 },
      );
      expect(aggregateByCategory(transactions, "expense", catalog, en.vocabulary.otherGroup)).toEqual(
        { Food: 5000 },
      );
    });

    test("A config sheet without the income/expense column aggregates nothing and names the categories", () => {
      const { catalog } = readConfigSheet(
        createConfigSheet([
          ["分類", "科目", "集計から除外"],
          ["現金", "収入-給与-本給", ""],
          ["", "支出-食費-外食", ""],
        ]),
      );
      const transactions = [
        createTransaction("収入-給与-本給", 300000, 0),
        createTransaction("支出-食費-外食", 0, 5000),
      ];

      expect(aggregateByCategory(transactions, "income", catalog, ja.vocabulary.otherGroup)).toEqual(
        {},
      );
      expect(catalog.categoriesWithoutKind()).toEqual(["収入-給与-本給", "支出-食費-外食"]);
    });
  });
});
