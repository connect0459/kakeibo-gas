import { describe, test, expect, vi, beforeEach } from "vitest";
import { getOrCreateArchiveSheet } from "../../src/features/archive/getOrCreateArchiveSheet";
import { getArchiveData } from "../../src/features/archive/getArchiveData";
import { filterZeroRecords } from "../../src/features/archive/filterZeroRecords";
import { ja } from "../../src/features/locale/ja";

/**
 * Integration tests for the single archive sheet feature
 */
describe("singleArchive integration", () => {
  let mockSpreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet;
  let mockArchiveSheet: GoogleAppsScript.Spreadsheet.Sheet;
  let mockSheetData: unknown[][];

  beforeEach(() => {
    mockSheetData = [
      ["日付", "分類", "科目", "摘要", "収入", "支出"], // Header row
    ];

    mockArchiveSheet = {
      getRange: vi.fn((range: string) => {
        if (range === "A1:F1") {
          return {
            setFontWeight: vi.fn().mockReturnThis(),
            setBackground: vi.fn().mockReturnThis(),
          } as unknown as GoogleAppsScript.Spreadsheet.Range;
        }
        if (range === "A2:A1000" || range === "E2:F1000") {
          return {
            setNumberFormat: vi.fn().mockReturnThis(),
          } as unknown as GoogleAppsScript.Spreadsheet.Range;
        }
        // Individual cells (A1, B1, etc.)
        return {
          setValue: vi.fn().mockReturnThis(),
        } as unknown as GoogleAppsScript.Spreadsheet.Range;
      }),
      getDataRange: vi.fn(() => ({
        getValues: () => mockSheetData,
      })) as unknown as () => GoogleAppsScript.Spreadsheet.Range,
      getLastRow: vi.fn(() => mockSheetData.length),
      appendRow: vi.fn((row: unknown[]) => {
        mockSheetData.push(row);
      }),
    } as unknown as GoogleAppsScript.Spreadsheet.Sheet;

    mockSpreadsheet = {
      getSheetByName: vi.fn((name: string) => {
        return name === ja.sheets.archive ? mockArchiveSheet : null;
      }),
      insertSheet: vi.fn((_name: string) => mockArchiveSheet),
    } as unknown as GoogleAppsScript.Spreadsheet.Spreadsheet;
  });

  test("Multiple years of data can be stored in a single archive sheet", () => {
    // Given: the archive sheet does not exist
    mockSpreadsheet.getSheetByName = vi.fn(() => null);

    // When: adding data for 2024 and 2025
    const archiveSheet = getOrCreateArchiveSheet(mockSpreadsheet, ja.sheets.archive, ja.headers);

    // Add 2024 data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (archiveSheet.appendRow as any)(["2024-01-15", "現金", "食費", "ランチ", 0, 800]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (archiveSheet.appendRow as any)(["2024-12-31", "銀行", "給料", "12月分", 300000, 0]);

    // Add 2025 data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (archiveSheet.appendRow as any)(["2025-01-10", "現金", "交通費", "電車代", 0, 500]);

    // Then: all data is stored in the single sheet
    expect(mockSheetData).toHaveLength(4); // Header + 3 records
    expect(mockSheetData[1]).toEqual(["2024-01-15", "現金", "食費", "ランチ", 0, 800]);
    expect(mockSheetData[2]).toEqual(["2024-12-31", "銀行", "給料", "12月分", 300000, 0]);
    expect(mockSheetData[3]).toEqual(["2025-01-10", "現金", "交通費", "電車代", 0, 500]);
  });

  test("getArchiveData retrieves all data and filterZeroRecords excludes zero-amount records", () => {
    // Given: the archive sheet contains data from multiple periods, including zero-amount records
    mockSheetData = [
      ["日付", "分類", "科目", "摘要", "収入", "支出"],
      ["2024-01-15", "現金", "食費", "ランチ", 0, 800],
      ["2024-02-20", "銀行", "繰越金", "繰越", 0, 0], // Zero-amount record (excluded by filterZeroRecords)
      ["2024-12-31", "銀行", "給料", "12月分", 300000, 0],
      ["2025-01-10", "現金", "交通費", "電車代", 0, 500],
      ["2025-02-01", "現金", "空データ", "空", 0, 0], // Zero-amount record (excluded by filterZeroRecords)
    ];

    // When: retrieving all data
    const allData = getArchiveData(mockSpreadsheet, ja.sheets.archive);

    // filterZeroRecords takes sheet-format data (unknown[][]),
    // so use mockSheetData excluding the header row
    const rawData = mockSheetData.slice(1);
    const filteredRawData = filterZeroRecords(rawData);

    // Then: data other than zero-amount records is retrieved
    expect(allData).toHaveLength(5); // All records (including zero-amount records)
    expect(filteredRawData).toHaveLength(3); // Exclude zero-amount records
    expect(filteredRawData[0]).toEqual(["2024-01-15", "現金", "食費", "ランチ", 0, 800]);
    expect(filteredRawData[1]).toEqual(["2024-12-31", "銀行", "給料", "12月分", 300000, 0]);
    expect(filteredRawData[2]).toEqual(["2025-01-10", "現金", "交通費", "電車代", 0, 500]);
  });

  test("Period filtering is done by the caller (getArchiveData returns everything)", () => {
    // Given: data from 2024 and 2025 is mixed
    mockSheetData = [
      ["日付", "分類", "科目", "摘要", "収入", "支出"],
      ["2024-01-15", "現金", "食費", "ランチ", 0, 800],
      ["2024-12-31", "銀行", "給料", "12月分", 300000, 0],
      ["2025-01-10", "現金", "交通費", "電車代", 0, 500],
      ["2025-12-20", "銀行", "給料", "12月分", 350000, 0],
    ];

    // When: retrieving all data
    const allData = getArchiveData(mockSpreadsheet, ja.sheets.archive);

    // Then: all records are returned without period filtering
    expect(allData).toHaveLength(4);

    // When: the caller filters by period (2024 only)
    const data2024 = allData.filter((data) => {
      const year = data.date?.getFullYear();
      return year === 2024;
    });

    // Then: only 2024 data is extracted
    expect(data2024).toHaveLength(2);
    expect(data2024[0].date?.getFullYear()).toBe(2024);
    expect(data2024[1].date?.getFullYear()).toBe(2024);
  });

  test("Retrieving from an empty archive sheet returns an empty array", () => {
    // Given: an archive sheet with only a header row
    mockSheetData = [["日付", "分類", "科目", "摘要", "収入", "支出"]];

    // When: retrieving the data
    const result = getArchiveData(mockSpreadsheet, ja.sheets.archive);

    // Then: an empty array is returned
    expect(result).toEqual([]);
  });

  test("filterZeroRecords excludes only records where both income and expense are 0", () => {
    // Given: sheet-format data with various patterns
    const testData: unknown[][] = [
      ["2024-01-15", "現金", "食費", "ランチ", 0, 800], // Has expense (kept)
      ["2024-02-20", "銀行", "繰越金", "繰越", 0, 0], // Income and expense both 0 (excluded)
      ["2024-03-10", "銀行", "給料", "給料", 300000, 0], // Has income (kept)
      ["2024-04-05", "現金", "空データ", "空", 0, 0], // Income and expense both 0 (excluded)
    ];

    // When: excluding zero-amount records
    const filtered = filterZeroRecords(testData);

    // Then: only records where both income and expense are 0 are excluded
    expect(filtered).toHaveLength(2);
    expect(filtered[0][2]).toBe("食費"); // Column C (category)
    expect(filtered[1][2]).toBe("給料"); // Column C (category)
  });
});
