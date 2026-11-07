import { beforeEach, describe, expect, test } from "vitest";
import { startOfDayInZone } from "../date/startOfDayInZone";
import { en } from "../locale/en";
import { ja } from "../locale/ja";
import { getArchiveData } from "./getArchiveData";

const TOKYO = "Asia/Tokyo";

describe("getArchiveData", () => {
  let mockSpreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet;
  let mockArchiveSheet: GoogleAppsScript.Spreadsheet.Sheet;

  beforeEach(() => {
    // Reset mocks
    mockArchiveSheet = {
      getDataRange: () => ({}) as GoogleAppsScript.Spreadsheet.Range,
      getLastRow: () => 0,
    } as GoogleAppsScript.Spreadsheet.Sheet;

    mockSpreadsheet = {
      getSheetByName: () => mockArchiveSheet,
    } as unknown as GoogleAppsScript.Spreadsheet.Spreadsheet;
  });

  test("Looks the archive sheet up by the given name", () => {
    const requestedNames: string[] = [];
    mockSpreadsheet.getSheetByName = ((name: string) => {
      requestedNames.push(name);
      return null;
    }) as typeof mockSpreadsheet.getSheetByName;

    getArchiveData(mockSpreadsheet, en.sheets.archive, TOKYO, en.alerts.invalidAmount);

    expect(requestedNames).toEqual(["Archive"]);
  });

  test("Retrieves all data from the archive sheet", () => {
    // Given: the archive sheet contains 3 records
    const mockData = [
      ["日付", "分類", "科目", "摘要", "収入", "支出"], // Header row
      ["2024-01-15", "現金", "食費", "ランチ", 0, 800],
      ["2024-02-20", "銀行", "給料", "1月分", 300000, 0],
      ["2024-03-10", "現金", "交通費", "電車代", 0, 500],
    ];

    mockArchiveSheet.getLastRow = () => 4;
    mockArchiveSheet.getDataRange = () =>
      ({
        getValues: () => mockData,
      }) as GoogleAppsScript.Spreadsheet.Range;

    // When: retrieving the data
    const result = getArchiveData(
      mockSpreadsheet,
      ja.sheets.archive,
      TOKYO,
      en.alerts.invalidAmount,
    );

    // Then: 3 TransactionData records excluding the header row are returned
    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({
      date: startOfDayInZone(TOKYO, 2024, 0, 15),
      type: "現金",
      category: "食費",
      description: "ランチ",
      income: 0,
      expense: 800,
      total: -800,
    });
    expect(result[1]).toMatchObject({
      date: startOfDayInZone(TOKYO, 2024, 1, 20),
      type: "銀行",
      category: "給料",
      description: "1月分",
      income: 300000,
      expense: 0,
      total: 300000,
    });
  });

  test("Returns an empty array when only the header row exists", () => {
    // Given: header row only
    const mockData = [["日付", "分類", "科目", "摘要", "収入", "支出"]];

    mockArchiveSheet.getLastRow = () => 1;
    mockArchiveSheet.getDataRange = () =>
      ({
        getValues: () => mockData,
      }) as GoogleAppsScript.Spreadsheet.Range;

    // When: retrieving the data
    const result = getArchiveData(
      mockSpreadsheet,
      ja.sheets.archive,
      TOKYO,
      en.alerts.invalidAmount,
    );

    // Then: an empty array is returned
    expect(result).toEqual([]);
  });

  test("Retrieves only columns A to F (columns G onward are ignored)", () => {
    // Given: data also exists in columns G onward
    const mockData = [
      ["日付", "分類", "科目", "摘要", "収入", "支出", "余分な列"],
      ["2024-01-15", "現金", "食費", "ランチ", 0, 800, "無視されるデータ"],
    ];

    mockArchiveSheet.getLastRow = () => 2;
    mockArchiveSheet.getDataRange = () =>
      ({
        getValues: () => mockData,
      }) as GoogleAppsScript.Spreadsheet.Range;

    // When: retrieving the data
    const result = getArchiveData(
      mockSpreadsheet,
      ja.sheets.archive,
      TOKYO,
      en.alerts.invalidAmount,
    );

    // Then: only columns A to F are retrieved (columns G onward are ignored)
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      date: startOfDayInZone(TOKYO, 2024, 0, 15),
      type: "現金",
      category: "食費",
      description: "ランチ",
      income: 0,
      expense: 800,
    });
  });

  test("Returns an empty array when the archive sheet does not exist", () => {
    // Given: the archive sheet does not exist
    mockSpreadsheet.getSheetByName = () => null;

    // When: retrieving the data
    const result = getArchiveData(
      mockSpreadsheet,
      ja.sheets.archive,
      TOKYO,
      en.alerts.invalidAmount,
    );

    // Then: an empty array is returned
    expect(result).toEqual([]);
  });

  test("Returns an empty array when the archive sheet is empty", () => {
    // Given: the archive sheet is empty (0 rows)
    mockArchiveSheet.getLastRow = () => 0;

    // When: retrieving the data
    const result = getArchiveData(
      mockSpreadsheet,
      ja.sheets.archive,
      TOKYO,
      en.alerts.invalidAmount,
    );

    // Then: an empty array is returned
    expect(result).toEqual([]);
  });

  test("Reads a text date as midnight in the given zone, not in UTC", () => {
    mockArchiveSheet.getLastRow = () => 2;
    mockArchiveSheet.getDataRange = () =>
      ({
        getValues: () => [
          ["Date", "Type", "Category", "Description", "Income", "Expense"],
          ["2025-04-01", "Cash", "Expense-Food", "lunch", 0, 800],
        ],
      }) as GoogleAppsScript.Spreadsheet.Range;

    const result = getArchiveData(
      mockSpreadsheet,
      en.sheets.archive,
      "America/Los_Angeles",
      en.alerts.invalidAmount,
    );

    expect(result[0].date).toEqual(startOfDayInZone("America/Los_Angeles", 2025, 3, 1));
  });
  describe("Amount rules shared with the input sheet", () => {
    const archiveWith = (rows: unknown[][]) => {
      const mockData = [["日付", "分類", "科目", "摘要", "収入", "支出"], ...rows];
      mockArchiveSheet.getLastRow = () => mockData.length;
      mockArchiveSheet.getDataRange = () =>
        ({ getValues: () => mockData }) as GoogleAppsScript.Spreadsheet.Range;
    };

    test("Amount text with a thousands separator counts as the same amount as on the input sheet", () => {
      archiveWith([["2024-01-15", "現金", "食費", "ランチ", "", "1,000"]]);

      const result = getArchiveData(
        mockSpreadsheet,
        en.sheets.archive,
        TOKYO,
        en.alerts.invalidAmount,
      );

      expect(result[0]).toMatchObject({ expense: 1000, total: -1000 });
    });

    test.each(["(1,000)", "▲500", "−500", "1e3", "-500", "abc"])(
      "Amount %s is rejected with an error naming the sheet and the row",
      (text) => {
        archiveWith([
          ["2024-01-15", "現金", "食費", "ランチ", 0, 800],
          ["2024-01-16", "現金", "食費", "夕食", 0, text],
        ]);

        expect(() =>
          getArchiveData(mockSpreadsheet, en.sheets.archive, TOKYO, en.alerts.invalidAmount),
        ).toThrow(en.alerts.invalidAmount("Archive", 3));
      },
    );
  });
});
