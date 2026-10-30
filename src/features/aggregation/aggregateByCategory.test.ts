import { describe, expect, test } from "vitest";
import { catalogByWording } from "../category/catalogByWording.testing";
import { CategoryCatalog } from "../category/categoryCatalog";
import { en } from "../locale/en";
import { ja } from "../locale/ja";
import { aggregateByCategory } from "./aggregateByCategory";
import type { TransactionData } from "./types";

describe("aggregateByCategory", () => {
  /**
   * Test helper: creates mock transaction data
   */
  const createTransaction = (
    category: string,
    income: number,
    expense: number,
  ): TransactionData => ({
    date: new Date("2025-01-01"),
    type: "現金",
    category,
    description: "テスト",
    income,
    expense,
    total: income - expense,
  });

  describe("Happy path: income aggregation rules", () => {
    test("Income category data is grouped and aggregated by main group", () => {
      // Arrange
      const transactions: TransactionData[] = [
        createTransaction("収入-給与-本給", 250000, 0),
        createTransaction("収入-給与-賞与", 100000, 0),
        createTransaction("収入-給与-手当", 50000, 0),
        createTransaction("収入-投資収入-配当金", 5000, 0),
      ];
      const excludedCategories: string[] = [];

      // Act
      const result = aggregateByCategory(
        transactions,
        "income",
        catalogByWording(transactions, excludedCategories),
        ja.vocabulary.otherGroup,
      );

      // Assert: aggregated by main group (salary, investment income)
      expect(result).toEqual({
        給与: 400000, // 250000 + 100000 + 50000
        投資収入: 5000,
      });
    });

    test("Expense category data is ignored when aggregating income", () => {
      // Arrange
      const transactions: TransactionData[] = [
        createTransaction("収入-給与-本給", 300000, 0),
        createTransaction("支出-食費-外食", 0, 5000),
      ];
      const excludedCategories: string[] = [];

      // Act
      const result = aggregateByCategory(
        transactions,
        "income",
        catalogByWording(transactions, excludedCategories),
        ja.vocabulary.otherGroup,
      );

      // Assert: only income is aggregated
      expect(result).toEqual({
        給与: 300000,
      });
    });
  });

  describe("Happy path: expense aggregation rules", () => {
    test("Expense category data is grouped and aggregated by main group", () => {
      // Arrange
      const transactions: TransactionData[] = [
        createTransaction("支出-食費-食料品", 0, 30000),
        createTransaction("支出-食費-外食", 0, 10000),
        createTransaction("支出-住居費-家賃", 0, 80000),
        createTransaction("支出-水道光熱費-電気・ガス", 0, 15000),
      ];
      const excludedCategories: string[] = [];

      // Act
      const result = aggregateByCategory(
        transactions,
        "expense",
        catalogByWording(transactions, excludedCategories),
        ja.vocabulary.otherGroup,
      );

      // Assert: aggregated by main group (food, housing, etc.)
      expect(result).toEqual({
        食費: 40000, // 30000 + 10000
        住居費: 80000,
        水道光熱費: 15000,
      });
    });

    test("Income category data is ignored when aggregating expenses", () => {
      // Arrange
      const transactions: TransactionData[] = [
        createTransaction("支出-食費-外食", 0, 5000),
        createTransaction("収入-給与-本給", 300000, 0),
      ];
      const excludedCategories: string[] = [];

      // Act
      const result = aggregateByCategory(
        transactions,
        "expense",
        catalogByWording(transactions, excludedCategories),
        ja.vocabulary.otherGroup,
      );

      // Assert: only expenses are aggregated
      expect(result).toEqual({
        食費: 5000,
      });
    });
  });

  describe("Happy path: excluded category handling rules", () => {
    test("Data in excluded categories is excluded from aggregation", () => {
      // Arrange
      const transactions: TransactionData[] = [
        createTransaction("収入-給与-本給", 300000, 0),
        createTransaction("収入-繰越金", 100000, 0),
        createTransaction("収入-分類移動", 50000, 0),
      ];
      const excludedCategories = ["繰越金", "分類移動"];

      // Act
      const result = aggregateByCategory(
        transactions,
        "income",
        catalogByWording(transactions, excludedCategories),
        ja.vocabulary.otherGroup,
      );

      // Assert: excluded categories are not aggregated
      expect(result).toEqual({
        給与: 300000,
      });
      expect(result.繰越金).toBeUndefined();
      expect(result.分類移動).toBeUndefined();
    });

    test("All categories are aggregated when excluded categories are empty", () => {
      // Arrange
      const transactions: TransactionData[] = [
        createTransaction("収入-給与-本給", 300000, 0),
        createTransaction("収入-繰越金", 100000, 0),
      ];
      const excludedCategories: string[] = [];

      // Act
      const result = aggregateByCategory(
        transactions,
        "income",
        catalogByWording(transactions, excludedCategories),
        ja.vocabulary.otherGroup,
      );

      // Assert: all categories are aggregated
      expect(result).toEqual({
        給与: 300000,
        繰越金: 100000,
      });
    });
  });

  describe("Happy path: amount handling rules", () => {
    test("Multiple transactions in the same main group are summed correctly", () => {
      // Arrange: multiple transactions in the salary category
      const transactions: TransactionData[] = [
        createTransaction("収入-給与-本給", 200000, 0),
        createTransaction("収入-給与-本給", 50000, 0),
        createTransaction("収入-給与-賞与", 100000, 0),
      ];
      const excludedCategories: string[] = [];

      // Act
      const result = aggregateByCategory(
        transactions,
        "income",
        catalogByWording(transactions, excludedCategories),
        ja.vocabulary.otherGroup,
      );

      // Assert: amounts in the same main group are summed
      expect(result).toEqual({
        給与: 350000, // 200000 + 50000 + 100000
      });
    });

    test("Zero-amount transactions are excluded from aggregation", () => {
      // Arrange
      const transactions: TransactionData[] = [
        createTransaction("収入-給与-本給", 300000, 0),
        createTransaction("収入-投資収入-配当金", 0, 0), // Zero amount
      ];
      const excludedCategories: string[] = [];

      // Act
      const result = aggregateByCategory(
        transactions,
        "income",
        catalogByWording(transactions, excludedCategories),
        ja.vocabulary.otherGroup,
      );

      // Assert: zero-amount transactions are not aggregated
      expect(result).toEqual({
        給与: 300000,
      });
      expect(result.投資収入).toBeUndefined();
    });

    test("Negative amounts are excluded from aggregation", () => {
      // Arrange
      const transactions: TransactionData[] = [
        createTransaction("収入-給与-本給", 300000, 0),
        createTransaction("収入-投資収入-配当金", -1000, 0), // Negative amount
      ];
      const excludedCategories: string[] = [];

      // Act
      const result = aggregateByCategory(
        transactions,
        "income",
        catalogByWording(transactions, excludedCategories),
        ja.vocabulary.otherGroup,
      );

      // Assert: negative amounts are not aggregated
      expect(result).toEqual({
        給与: 300000,
      });
      expect(result.投資収入).toBeUndefined();
    });
  });

  describe("Edge cases", () => {
    test("An empty object is returned for an empty transaction list", () => {
      // Arrange
      const transactions: TransactionData[] = [];
      const excludedCategories: string[] = [];

      // Act
      const result = aggregateByCategory(
        transactions,
        "income",
        catalogByWording(transactions, excludedCategories),
        ja.vocabulary.otherGroup,
      );

      // Assert
      expect(result).toEqual({});
    });

    test("An empty category name is excluded from aggregation", () => {
      // Arrange
      const transactions: TransactionData[] = [
        createTransaction("", 10000, 0),
        createTransaction("収入-給与-本給", 300000, 0),
      ];
      const excludedCategories: string[] = [];

      // Act
      const result = aggregateByCategory(
        transactions,
        "income",
        catalogByWording(transactions, excludedCategories),
        ja.vocabulary.otherGroup,
      );

      // Assert: an empty string is neither income nor expense, so it is not aggregated
      expect(result).toEqual({
        給与: 300000,
      });
      expect(result.その他).toBeUndefined();
    });

    test("A category name without a hyphen that does not start with the income or expense prefix is excluded from aggregation", () => {
      // Arrange
      const transactions: TransactionData[] = [
        createTransaction("その他", 5000, 0),
        createTransaction("収入-給与-本給", 300000, 0),
      ];
      const excludedCategories: string[] = [];

      // Act
      const result = aggregateByCategory(
        transactions,
        "income",
        catalogByWording(transactions, excludedCategories),
        ja.vocabulary.otherGroup,
      );

      // Assert: "Other" is neither income nor expense, so it is not aggregated
      expect(result).toEqual({
        給与: 300000,
      });
      expect(result.その他).toBeUndefined();
    });

    test("NaN amounts are excluded from aggregation", () => {
      // Arrange
      const transactions: TransactionData[] = [
        createTransaction("収入-給与-本給", 300000, 0),
        // biome-ignore lint/suspicious/noExplicitAny: bypass type checking for testing
        createTransaction("収入-投資収入-配当金", Number.NaN as any, 0),
      ];
      const excludedCategories: string[] = [];

      // Act
      const result = aggregateByCategory(
        transactions,
        "income",
        catalogByWording(transactions, excludedCategories),
        ja.vocabulary.otherGroup,
      );

      // Assert: NaN is not aggregated
      expect(result).toEqual({
        給与: 300000,
      });
      expect(result.投資収入).toBeUndefined();
    });
  });

  describe("Business rules: real-world usage scenarios", () => {
    test("Monthly statistics: only regular income and expenses are aggregated, and adjustment items such as carryover are excluded", () => {
      // Arrange: realistic monthly data
      const transactions: TransactionData[] = [
        // Carryover at start of month (excluded)
        createTransaction("収入-繰越金", 500000, 0),
        // Regular income
        createTransaction("収入-給与-本給", 250000, 0),
        createTransaction("収入-給与-手当", 50000, 0),
        // Regular expense
        createTransaction("支出-食費-外食", 0, 15000),
        createTransaction("支出-住居費-家賃", 0, 80000),
        // Transfer between types (excluded)
        createTransaction("収入-分類移動", 10000, 0),
        createTransaction("支出-分類移動", 0, 10000),
      ];
      const excludedCategories = ["繰越金", "分類移動"];

      // Act: aggregate income
      const incomeResult = aggregateByCategory(
        transactions,
        "income",
        catalogByWording(transactions, excludedCategories),
        ja.vocabulary.otherGroup,
      );
      // Act: aggregate expenses
      const expenseResult = aggregateByCategory(
        transactions,
        "expense",
        catalogByWording(transactions, excludedCategories),
        ja.vocabulary.otherGroup,
      );

      // Assert: only regular income and expenses are aggregated
      expect(incomeResult).toEqual({
        給与: 300000, // 250000 + 50000
      });
      expect(expenseResult).toEqual({
        食費: 15000,
        住居費: 80000,
      });

      // Assert: excluded categories are not included
      expect(incomeResult.繰越金).toBeUndefined();
      expect(incomeResult.分類移動).toBeUndefined();
      expect(expenseResult.分類移動).toBeUndefined();
    });

    test("Multi-month aggregation: each month's data is summed correctly", () => {
      // Arrange: multi-month data
      const transactions: TransactionData[] = [
        // January
        createTransaction("収入-給与-本給", 250000, 0),
        createTransaction("支出-食費-外食", 0, 10000),
        // February
        createTransaction("収入-給与-本給", 250000, 0),
        createTransaction("支出-食費-外食", 0, 12000),
        // March
        createTransaction("収入-給与-本給", 250000, 0),
        createTransaction("支出-食費-外食", 0, 15000),
      ];
      const excludedCategories: string[] = [];

      // Act
      const incomeResult = aggregateByCategory(
        transactions,
        "income",
        catalogByWording(transactions, excludedCategories),
        ja.vocabulary.otherGroup,
      );
      const expenseResult = aggregateByCategory(
        transactions,
        "expense",
        catalogByWording(transactions, excludedCategories),
        ja.vocabulary.otherGroup,
      );

      // Assert: multi-month data is summed correctly
      expect(incomeResult).toEqual({
        給与: 750000, // 250000 × 3
      });
      expect(expenseResult).toEqual({
        食費: 37000, // 10000 + 12000 + 15000
      });
    });

    test("Transactions with different detailed categories are aggregated under the same main group", () => {
      // Arrange: detailed food categories
      const transactions: TransactionData[] = [
        createTransaction("支出-食費-食料品", 0, 30000),
        createTransaction("支出-食費-外食", 0, 15000),
        createTransaction("支出-食費-飲料", 0, 5000),
      ];
      const excludedCategories: string[] = [];

      // Act
      const result = aggregateByCategory(
        transactions,
        "expense",
        catalogByWording(transactions, excludedCategories),
        ja.vocabulary.otherGroup,
      );

      // Assert: aggregated under the main group "Food" even when detailed categories differ
      expect(result).toEqual({
        食費: 50000, // 30000 + 15000 + 5000
      });
    });

    test("Balance check: income and expenses are aggregated independently", () => {
      // Arrange: income and expense data for the same month
      const transactions: TransactionData[] = [
        createTransaction("収入-給与-本給", 300000, 0),
        createTransaction("収入-投資収入-配当金", 5000, 0),
        createTransaction("支出-食費-外食", 0, 15000),
        createTransaction("支出-住居費-家賃", 0, 80000),
        createTransaction("支出-水道光熱費-電気・ガス", 0, 10000),
      ];
      const excludedCategories: string[] = [];

      // Act
      const incomeResult = aggregateByCategory(
        transactions,
        "income",
        catalogByWording(transactions, excludedCategories),
        ja.vocabulary.otherGroup,
      );
      const expenseResult = aggregateByCategory(
        transactions,
        "expense",
        catalogByWording(transactions, excludedCategories),
        ja.vocabulary.otherGroup,
      );

      // Assert: total income
      const totalIncome = Object.values(incomeResult).reduce((sum, value) => sum + value, 0);
      expect(totalIncome).toBe(305000);

      // Assert: total expenses
      const totalExpense = Object.values(expenseResult).reduce((sum, value) => sum + value, 0);
      expect(totalExpense).toBe(105000);

      // Assert: income-expense difference
      const balance = totalIncome - totalExpense;
      expect(balance).toBe(200000);
    });
  });

  describe("classification by the catalog", () => {
    test("A category counts as the kind the catalog records, whatever its wording says", () => {
      const transactions = [createTransaction("収入-臨時収入-払戻金", 0, 3000)];
      const catalog = CategoryCatalog.of([
        { name: "収入-臨時収入-払戻金", kind: "expense", excluded: false },
      ]);

      expect(
        aggregateByCategory(transactions, "expense", catalog, ja.vocabulary.otherGroup),
      ).toEqual({ 臨時収入: 3000 });
      expect(
        aggregateByCategory(transactions, "income", catalog, ja.vocabulary.otherGroup),
      ).toEqual({});
    });

    test("A category listed as income is aggregated as income", () => {
      const transactions = [createTransaction("Income-Salary-Base", 300000, 0)];
      const catalog = CategoryCatalog.of([
        { name: "Income-Salary-Base", kind: "income", excluded: false },
      ]);

      expect(
        aggregateByCategory(transactions, "income", catalog, en.vocabulary.otherGroup),
      ).toEqual({ Salary: 300000 });
    });

    test("A category that is not in the catalog is not aggregated", () => {
      const transactions = [createTransaction("支出-食費-外食", 0, 5000)];

      expect(
        aggregateByCategory(
          transactions,
          "expense",
          catalogByWording([]),
          ja.vocabulary.otherGroup,
        ),
      ).toEqual({});
    });

    test("A category without a kind is not aggregated as either kind", () => {
      const transactions = [createTransaction("支出-食費-外食", 0, 5000)];
      const catalog = CategoryCatalog.of([
        { name: "支出-食費-外食", kind: undefined, excluded: false },
      ]);

      expect(
        aggregateByCategory(transactions, "expense", catalog, ja.vocabulary.otherGroup),
      ).toEqual({});
      expect(
        aggregateByCategory(transactions, "income", catalog, ja.vocabulary.otherGroup),
      ).toEqual({});
    });

    test("Only the flagged category is excluded, not another that ends the same way", () => {
      const transactions = [
        createTransaction("収入-繰越金", 100000, 0),
        createTransaction("収入-臨時収入-繰越金", 2000, 0),
      ];
      const catalog = CategoryCatalog.of([
        { name: "収入-繰越金", kind: "income", excluded: true },
        { name: "収入-臨時収入-繰越金", kind: "income", excluded: false },
      ]);

      expect(
        aggregateByCategory(transactions, "income", catalog, ja.vocabulary.otherGroup),
      ).toEqual({ 臨時収入: 2000 });
    });
  });
});
