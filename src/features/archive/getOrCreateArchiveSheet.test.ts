import { describe, expect, test, vi } from "vitest";
import { en } from "../locale/en";
import { ja } from "../locale/ja";
import { getOrCreateArchiveSheet } from "./getOrCreateArchiveSheet";

/**
 * Tests for the single archive sheet get/create function
 */
describe("getOrCreateArchiveSheet", () => {
  /**
   * Creates a mock Spreadsheet object
   */
  const createMockSpreadsheet = (existingSheetName: string | null = null) => {
    const writtenValues: Record<string, unknown> = {};
    const mockSheet = {
      getRange: vi.fn((range: string) => {
        const cell = {
          setValue: vi.fn((value: unknown) => {
            writtenValues[range] = value;
            return cell;
          }),
          setFontWeight: vi.fn().mockReturnThis(),
          setBackground: vi.fn().mockReturnThis(),
          setNumberFormat: vi.fn().mockReturnThis(),
        };
        return cell;
      }),
    };

    const mockSpreadsheet = {
      getSheetByName: vi.fn((name: string) => {
        return name === existingSheetName ? mockSheet : null;
      }),
      insertSheet: vi.fn((_name: string) => mockSheet),
    };

    return { mockSpreadsheet, mockSheet, writtenValues };
  };

  describe("When the archive sheet does not exist", () => {
    test("Creates a new archive sheet", () => {
      const { mockSpreadsheet, mockSheet } = createMockSpreadsheet();

      const result = getOrCreateArchiveSheet(
        mockSpreadsheet as unknown as GoogleAppsScript.Spreadsheet.Spreadsheet,
        ja.sheets.archive,
        ja.headers,
      );

      expect(mockSpreadsheet.getSheetByName).toHaveBeenCalledWith("アーカイブ");
      expect(mockSpreadsheet.insertSheet).toHaveBeenCalledWith("アーカイブ");
      expect(result).toBe(mockSheet);
    });

    test("Sets the header row on the created sheet", () => {
      const { mockSpreadsheet, mockSheet } = createMockSpreadsheet();

      getOrCreateArchiveSheet(
        mockSpreadsheet as unknown as GoogleAppsScript.Spreadsheet.Spreadsheet,
        ja.sheets.archive,
        ja.headers,
      );

      // Verify the header row settings
      expect(mockSheet.getRange).toHaveBeenCalledWith("A1");
      expect(mockSheet.getRange).toHaveBeenCalledWith("B1");
      expect(mockSheet.getRange).toHaveBeenCalledWith("C1");
      expect(mockSheet.getRange).toHaveBeenCalledWith("D1");
      expect(mockSheet.getRange).toHaveBeenCalledWith("E1");
      expect(mockSheet.getRange).toHaveBeenCalledWith("F1");
    });

    test("Writes the Japanese header row for the ja locale", () => {
      const { mockSpreadsheet, writtenValues } = createMockSpreadsheet();

      getOrCreateArchiveSheet(
        mockSpreadsheet as unknown as GoogleAppsScript.Spreadsheet.Spreadsheet,
        ja.sheets.archive,
        ja.headers,
      );

      expect(writtenValues).toEqual({
        A1: "日付",
        B1: "分類",
        C1: "科目",
        D1: "摘要",
        E1: "収入",
        F1: "支出",
      });
    });

    test("Names the sheet and writes the header row from the given locale", () => {
      const { mockSpreadsheet, writtenValues } = createMockSpreadsheet();

      getOrCreateArchiveSheet(
        mockSpreadsheet as unknown as GoogleAppsScript.Spreadsheet.Spreadsheet,
        en.sheets.archive,
        en.headers,
      );

      expect(mockSpreadsheet.insertSheet).toHaveBeenCalledWith("Archive");
      expect(writtenValues).toEqual({
        A1: "Date",
        B1: "Type",
        C1: "Category",
        D1: "Description",
        E1: "Income",
        F1: "Expense",
      });
    });

    test("Sets the header row style", () => {
      const { mockSpreadsheet, mockSheet } = createMockSpreadsheet();

      getOrCreateArchiveSheet(
        mockSpreadsheet as unknown as GoogleAppsScript.Spreadsheet.Spreadsheet,
        ja.sheets.archive,
        ja.headers,
      );

      // Verify the header row style settings
      expect(mockSheet.getRange).toHaveBeenCalledWith("A1:F1");
    });

    test("Sets the formats of the date and amount columns", () => {
      const { mockSpreadsheet, mockSheet } = createMockSpreadsheet();

      getOrCreateArchiveSheet(
        mockSpreadsheet as unknown as GoogleAppsScript.Spreadsheet.Spreadsheet,
        ja.sheets.archive,
        ja.headers,
      );

      // Verify the format settings
      expect(mockSheet.getRange).toHaveBeenCalledWith("A2:A1000");
      expect(mockSheet.getRange).toHaveBeenCalledWith("E2:F1000");
    });
  });

  describe("Amount column format", () => {
    test("Formats the income and expense columns without a currency sign, like the live archive sheet", () => {
      const formats: Record<string, string> = {};
      const mockSheet = {
        getRange: vi.fn((range: string) => {
          const cell = {
            setValue: vi.fn().mockReturnThis(),
            setFontWeight: vi.fn().mockReturnThis(),
            setBackground: vi.fn().mockReturnThis(),
            setNumberFormat: vi.fn((format: string) => {
              formats[range] = format;
              return cell;
            }),
          };
          return cell;
        }),
      };
      const mockSpreadsheet = {
        getSheetByName: vi.fn(() => null),
        insertSheet: vi.fn(() => mockSheet),
      };

      getOrCreateArchiveSheet(
        mockSpreadsheet as unknown as GoogleAppsScript.Spreadsheet.Spreadsheet,
        ja.sheets.archive,
        ja.headers,
      );

      expect(formats["E2:F1000"]).toBe("#,##0");
    });
  });

  describe("When the archive sheet already exists", () => {
    test("Returns the existing sheet", () => {
      const { mockSpreadsheet, mockSheet } = createMockSpreadsheet("アーカイブ");

      const result = getOrCreateArchiveSheet(
        mockSpreadsheet as unknown as GoogleAppsScript.Spreadsheet.Spreadsheet,
        ja.sheets.archive,
        ja.headers,
      );

      expect(mockSpreadsheet.getSheetByName).toHaveBeenCalledWith("アーカイブ");
      expect(mockSpreadsheet.insertSheet).not.toHaveBeenCalled();
      expect(result).toBe(mockSheet);
    });

    test("Does not change the header of the existing sheet", () => {
      const { mockSpreadsheet, mockSheet } = createMockSpreadsheet("アーカイブ");

      getOrCreateArchiveSheet(
        mockSpreadsheet as unknown as GoogleAppsScript.Spreadsheet.Spreadsheet,
        ja.sheets.archive,
        ja.headers,
      );

      // Verify getRange was not called (header was not set)
      expect(mockSheet.getRange).not.toHaveBeenCalled();
    });
  });
});
