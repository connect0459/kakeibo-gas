import { describe, expect, test } from "vitest";
import { filterZeroRecords } from "./filterZeroRecords";

/**
 * Archive data column index definitions
 */
const COLUMN_INDEX = {
  DATE: 0,
  TYPE: 1,
  CATEGORY: 2,
  NOTE: 3,
  INCOME: 4,
  EXPENSE: 5,
} as const;

/**
 * Creates a test archive record
 *
 * @param params - Record parameters
 * @returns Archive data row (array of columns A to F)
 */
const createArchiveRecord = (params: {
  date: string;
  type: string;
  category: string;
  note: string;
  income: number | string | null;
  expense: number | string | null;
}): unknown[] => {
  const record = new Array(6);
  record[COLUMN_INDEX.DATE] = params.date;
  record[COLUMN_INDEX.TYPE] = params.type;
  record[COLUMN_INDEX.CATEGORY] = params.category;
  record[COLUMN_INDEX.NOTE] = params.note;
  record[COLUMN_INDEX.INCOME] = params.income;
  record[COLUMN_INDEX.EXPENSE] = params.expense;
  return record;
};

describe("filterZeroRecords", () => {
  describe("Excluding zero-amount records", () => {
    test("Excludes rows where both income and expense are 0", () => {
      const input = [
        createArchiveRecord({
          date: "2024-01-01",
          type: "食費",
          category: "ランチ",
          note: "",
          income: 0,
          expense: 0,
        }),
        createArchiveRecord({
          date: "2024-01-02",
          type: "食費",
          category: "ディナー",
          note: "",
          income: 0,
          expense: 1000,
        }),
      ];

      const result = filterZeroRecords(input);

      expect(result).toEqual([
        createArchiveRecord({
          date: "2024-01-02",
          type: "食費",
          category: "ディナー",
          note: "",
          income: 0,
          expense: 1000,
        }),
      ]);
    });

    test("Excludes rows where both income and expense are empty strings", () => {
      const input = [
        createArchiveRecord({
          date: "2024-01-01",
          type: "食費",
          category: "ランチ",
          note: "",
          income: "",
          expense: "",
        }),
        createArchiveRecord({
          date: "2024-01-02",
          type: "給与",
          category: "月給",
          note: "",
          income: 300000,
          expense: "",
        }),
      ];

      const result = filterZeroRecords(input);

      expect(result).toEqual([
        createArchiveRecord({
          date: "2024-01-02",
          type: "給与",
          category: "月給",
          note: "",
          income: 300000,
          expense: "",
        }),
      ]);
    });

    test("Excludes rows where both income and expense are null", () => {
      const input = [
        createArchiveRecord({
          date: "2024-01-01",
          type: "食費",
          category: "ランチ",
          note: "",
          income: null,
          expense: null,
        }),
        createArchiveRecord({
          date: "2024-01-02",
          type: "給与",
          category: "月給",
          note: "",
          income: 300000,
          expense: null,
        }),
      ];

      const result = filterZeroRecords(input);

      expect(result).toEqual([
        createArchiveRecord({
          date: "2024-01-02",
          type: "給与",
          category: "月給",
          note: "",
          income: 300000,
          expense: null,
        }),
      ]);
    });

    test("Excludes the mixed pattern of income 0 and expense empty string", () => {
      const input = [
        createArchiveRecord({
          date: "2024-01-01",
          type: "食費",
          category: "ランチ",
          note: "",
          income: 0,
          expense: "",
        }),
        createArchiveRecord({
          date: "2024-01-02",
          type: "食費",
          category: "ディナー",
          note: "",
          income: "",
          expense: 0,
        }),
        createArchiveRecord({
          date: "2024-01-03",
          type: "食費",
          category: "朝食",
          note: "",
          income: null,
          expense: 0,
        }),
        createArchiveRecord({
          date: "2024-01-04",
          type: "給与",
          category: "月給",
          note: "",
          income: 300000,
          expense: 0,
        }),
      ];

      const result = filterZeroRecords(input);

      expect(result).toEqual([
        createArchiveRecord({
          date: "2024-01-04",
          type: "給与",
          category: "月給",
          note: "",
          income: 300000,
          expense: 0,
        }),
      ]);
    });
  });

  describe("Keeping valid records", () => {
    test("Keeps rows with income of 1 yen or more", () => {
      const input = [
        createArchiveRecord({
          date: "2024-01-01",
          type: "給与",
          category: "月給",
          note: "",
          income: 300000,
          expense: 0,
        }),
        createArchiveRecord({
          date: "2024-01-02",
          type: "副業",
          category: "原稿料",
          note: "",
          income: 50000,
          expense: "",
        }),
      ];

      const result = filterZeroRecords(input);

      expect(result).toEqual(input);
    });

    test("Keeps rows with expense of 1 yen or more", () => {
      const input = [
        createArchiveRecord({
          date: "2024-01-01",
          type: "食費",
          category: "ランチ",
          note: "",
          income: 0,
          expense: 800,
        }),
        createArchiveRecord({
          date: "2024-01-02",
          type: "交通費",
          category: "電車",
          note: "",
          income: "",
          expense: 200,
        }),
      ];

      const result = filterZeroRecords(input);

      expect(result).toEqual(input);
    });

    test("Keeps rows with amounts in both income and expense", () => {
      const input = [
        createArchiveRecord({
          date: "2024-01-01",
          type: "給与",
          category: "月給",
          note: "",
          income: 300000,
          expense: 0,
        }),
        createArchiveRecord({
          date: "2024-01-02",
          type: "食費",
          category: "ランチ",
          note: "",
          income: 0,
          expense: 800,
        }),
        createArchiveRecord({
          date: "2024-01-03",
          type: "副業",
          category: "原稿料",
          note: "",
          income: 50000,
          expense: 1000,
        }),
      ];

      const result = filterZeroRecords(input);

      expect(result).toEqual(input);
    });
  });

  describe("Edge cases", () => {
    test("Returns an empty array for an empty array input", () => {
      const input: unknown[][] = [];

      const result = filterZeroRecords(input);

      expect(result).toEqual([]);
    });

    test("Returns an empty array when all records are zero-amount", () => {
      const input = [
        createArchiveRecord({
          date: "2024-01-01",
          type: "食費",
          category: "ランチ",
          note: "",
          income: 0,
          expense: 0,
        }),
        createArchiveRecord({
          date: "2024-01-02",
          type: "交通費",
          category: "電車",
          note: "",
          income: "",
          expense: "",
        }),
        createArchiveRecord({
          date: "2024-01-03",
          type: "娯楽",
          category: "映画",
          note: "",
          income: null,
          expense: null,
        }),
      ];

      const result = filterZeroRecords(input);

      expect(result).toEqual([]);
    });

    test("Excludes only zero-amount records when mixed", () => {
      const input = [
        createArchiveRecord({
          date: "2024-01-01",
          type: "食費",
          category: "ランチ",
          note: "",
          income: 0,
          expense: 0,
        }),
        createArchiveRecord({
          date: "2024-01-02",
          type: "給与",
          category: "月給",
          note: "",
          income: 300000,
          expense: 0,
        }),
        createArchiveRecord({
          date: "2024-01-03",
          type: "交通費",
          category: "電車",
          note: "",
          income: "",
          expense: "",
        }),
        createArchiveRecord({
          date: "2024-01-04",
          type: "食費",
          category: "ディナー",
          note: "",
          income: 0,
          expense: 1500,
        }),
        createArchiveRecord({
          date: "2024-01-05",
          type: "娯楽",
          category: "映画",
          note: "",
          income: null,
          expense: null,
        }),
      ];

      const result = filterZeroRecords(input);

      expect(result).toEqual([
        createArchiveRecord({
          date: "2024-01-02",
          type: "給与",
          category: "月給",
          note: "",
          income: 300000,
          expense: 0,
        }),
        createArchiveRecord({
          date: "2024-01-04",
          type: "食費",
          category: "ディナー",
          note: "",
          income: 0,
          expense: 1500,
        }),
      ]);
    });
  });
});
