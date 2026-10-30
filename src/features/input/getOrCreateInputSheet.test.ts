import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { FakeSpreadsheet, stubDataValidation } from "../../testing/fakeSpreadsheet.testing";
import { en } from "../locale/en";
import { ja } from "../locale/ja";
import { getOrCreateInputSheet } from "./getOrCreateInputSheet";

describe("getOrCreateInputSheet", () => {
  const typeOptions = ["Cash", "Bank"];

  beforeEach(() => {
    stubDataValidation();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("When the input sheet does not exist", () => {
    test("Creates a sheet named after the locale", () => {
      const spreadsheet = new FakeSpreadsheet();

      const sheet = getOrCreateInputSheet(spreadsheet.asSpreadsheet(), ja, () => typeOptions);

      expect(sheet).toBe(spreadsheet.getSheetByName("入力"));
    });

    test("Names the sheet in English for the en locale", () => {
      const spreadsheet = new FakeSpreadsheet();

      getOrCreateInputSheet(spreadsheet.asSpreadsheet(), en, () => typeOptions);

      expect(spreadsheet.getSheetByName("Input")).not.toBeNull();
    });

    test("Writes the Japanese header row for the ja locale", () => {
      const spreadsheet = new FakeSpreadsheet();

      getOrCreateInputSheet(spreadsheet.asSpreadsheet(), ja, () => typeOptions);

      const sheet = spreadsheet.getSheetByName("入力");
      expect(["A1", "B1", "C1", "D1", "E1", "F1"].map((a1) => sheet?.state(a1).value)).toEqual([
        "日付",
        "分類",
        "科目",
        "摘要",
        "収入",
        "支出",
      ]);
    });

    test("Writes the English header row for the en locale", () => {
      const spreadsheet = new FakeSpreadsheet();

      getOrCreateInputSheet(spreadsheet.asSpreadsheet(), en, () => typeOptions);

      const sheet = spreadsheet.getSheetByName("Input");
      expect(["A1", "B1", "C1", "D1", "E1", "F1"].map((a1) => sheet?.state(a1).value)).toEqual([
        "Date",
        "Type",
        "Category",
        "Description",
        "Income",
        "Expense",
      ]);
    });

    test("Leaves column G untouched because it is reserved for formulas", () => {
      const spreadsheet = new FakeSpreadsheet();

      getOrCreateInputSheet(spreadsheet.asSpreadsheet(), ja, () => typeOptions);

      const touched = [...(spreadsheet.getSheetByName("入力")?.ranges.keys() ?? [])];
      expect(touched.filter((a1) => a1.startsWith("G"))).toEqual([]);
    });

    test("Styles the header row bold on a grey background", () => {
      const spreadsheet = new FakeSpreadsheet();

      getOrCreateInputSheet(spreadsheet.asSpreadsheet(), ja, () => typeOptions);

      const header = spreadsheet.getSheetByName("入力")?.state("A1:F1");
      expect(header).toMatchObject({ fontWeight: "bold", background: "#f3f3f3" });
    });

    test("Formats the date column as yyyy-MM-dd", () => {
      const spreadsheet = new FakeSpreadsheet();

      getOrCreateInputSheet(spreadsheet.asSpreadsheet(), ja, () => typeOptions);

      expect(spreadsheet.getSheetByName("入力")?.state("A2:A1000").numberFormat).toBe("yyyy-MM-dd");
    });

    test("Formats the income and expense columns without a currency sign", () => {
      const spreadsheet = new FakeSpreadsheet();

      getOrCreateInputSheet(spreadsheet.asSpreadsheet(), ja, () => typeOptions);

      expect(spreadsheet.getSheetByName("入力")?.state("E2:F1000").numberFormat).toBe("#,##0");
    });

    test("Restricts the type column to the configured type options as a dropdown", () => {
      const spreadsheet = new FakeSpreadsheet();

      getOrCreateInputSheet(spreadsheet.asSpreadsheet(), ja, () => typeOptions);

      expect(spreadsheet.getSheetByName("入力")?.state("B2:B1000").validation).toEqual({
        values: typeOptions,
        showDropdown: true,
      });
    });
  });

  describe("When the input sheet already exists", () => {
    test("Returns the existing sheet without creating another", () => {
      const spreadsheet = new FakeSpreadsheet();
      const existing = spreadsheet.withSheet("入力");
      const insertSheet = vi.spyOn(spreadsheet, "insertSheet");

      const sheet = getOrCreateInputSheet(spreadsheet.asSpreadsheet(), ja, () => typeOptions);

      expect(sheet).toBe(existing);
      expect(insertSheet).not.toHaveBeenCalled();
    });

    test("Does not change the existing sheet", () => {
      const spreadsheet = new FakeSpreadsheet();
      const existing = spreadsheet.withSheet("入力");

      getOrCreateInputSheet(spreadsheet.asSpreadsheet(), ja, () => typeOptions);

      expect(existing.ranges.size).toBe(0);
    });

    test("Does not read the type options, so the config sheet is not needed", () => {
      const spreadsheet = new FakeSpreadsheet();
      spreadsheet.withSheet("入力");
      const readTypeOptions = vi.fn(() => typeOptions);

      getOrCreateInputSheet(spreadsheet.asSpreadsheet(), ja, readTypeOptions);

      expect(readTypeOptions).not.toHaveBeenCalled();
    });
  });
});
