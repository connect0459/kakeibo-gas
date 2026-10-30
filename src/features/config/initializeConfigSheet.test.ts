import { afterEach, describe, expect, it, vi } from "vitest";
import { en } from "../locale/en";
import { ja } from "../locale/ja";
import { getDefaultConfigRows } from "./getDefaultConfigRows";
import { initializeConfigSheet } from "./initializeConfigSheet";

type Rule =
  | { kind: "checkbox"; allowInvalid: boolean }
  | { kind: "list"; values: string[]; dropdown: boolean | undefined; allowInvalid: boolean };

const stubDataValidation = () => {
  vi.stubGlobal("SpreadsheetApp", {
    newDataValidation: () => {
      let rule: Rule | undefined;
      let allowInvalid = true;
      const builder = {
        requireCheckbox: () => {
          rule = { kind: "checkbox", allowInvalid };
          return builder;
        },
        requireValueInList: (values: string[], dropdown?: boolean) => {
          rule = { kind: "list", values, dropdown, allowInvalid };
          return builder;
        },
        setAllowInvalid: (value: boolean) => {
          allowInvalid = value;
          return builder;
        },
        build: () => (rule ? { ...rule, allowInvalid } : rule),
      };
      return builder;
    },
  });
};

const createSpreadsheet = (existingSheetName: string | null = null) => {
  const writtenValues: Record<string, unknown> = {};
  const validations: Record<string, unknown> = {};
  const seeded: { range: unknown[]; rows: unknown[][] }[] = [];
  const sheet = {
    getRange: vi.fn((...range: unknown[]) => {
      const key = range.length === 1 ? String(range[0]) : "";
      const cell = {
        setValue: vi.fn((value: unknown) => {
          writtenValues[key] = value;
          return cell;
        }),
        setValues: vi.fn((rows: unknown[][]) => {
          seeded.push({ range, rows });
          return cell;
        }),
        setDataValidation: vi.fn((rule: unknown) => {
          validations[key] = rule;
          return cell;
        }),
        setFontWeight: vi.fn().mockReturnThis(),
        setBackground: vi.fn().mockReturnThis(),
      };
      return cell;
    }),
    autoResizeColumn: vi.fn(),
  };
  const spreadsheet = {
    getSheetByName: vi.fn((name: string) => (name === existingSheetName ? sheet : null)),
    insertSheet: vi.fn((_name: string) => sheet),
  };
  return {
    spreadsheet: spreadsheet as unknown as GoogleAppsScript.Spreadsheet.Spreadsheet,
    insertSheet: spreadsheet.insertSheet,
    sheet,
    writtenValues,
    validations,
    seeded,
  };
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("initializeConfigSheet", () => {
  it("returns an existing config sheet without touching it", () => {
    stubDataValidation();
    const { spreadsheet, insertSheet, sheet } = createSpreadsheet(ja.sheets.config);

    const result = initializeConfigSheet(spreadsheet, ja);

    expect(result).toBe(sheet);
    expect(insertSheet).not.toHaveBeenCalled();
    expect(sheet.getRange).not.toHaveBeenCalled();
  });

  describe.each([
    ["ja", ja, { A1: "分類", B1: "科目", C1: "集計から除外", D1: "収支" }],
    ["en", en, { A1: "Type", B1: "Category", C1: "Exclude from summary", D1: "Income/Expense" }],
  ])("creating the config sheet for %s", (_id, locale, headerRow) => {
    it("names the sheet and writes the header row from the locale", () => {
      stubDataValidation();
      const { spreadsheet, insertSheet, writtenValues } = createSpreadsheet();

      initializeConfigSheet(spreadsheet, locale);

      expect(insertSheet).toHaveBeenCalledWith(locale.sheets.config);
      expect(writtenValues).toEqual(headerRow);
    });

    it("seeds every default row of the locale in a single write", () => {
      stubDataValidation();
      const { spreadsheet, seeded } = createSpreadsheet();

      initializeConfigSheet(spreadsheet, locale);

      const rows = getDefaultConfigRows(locale.id);
      expect(seeded).toEqual([{ range: [2, 1, rows.length, 4], rows }]);
    });

    it("shows the exclusion column as checkboxes down to row 1000 and rejects anything else", () => {
      stubDataValidation();
      const { spreadsheet, validations } = createSpreadsheet();

      initializeConfigSheet(spreadsheet, locale);

      expect(validations["C2:C1000"]).toEqual({ kind: "checkbox", allowInvalid: false });
    });

    it("offers the locale's income and expense words as a dropdown in column D down to row 1000 and rejects other values", () => {
      stubDataValidation();
      const { spreadsheet, validations } = createSpreadsheet();

      initializeConfigSheet(spreadsheet, locale);

      expect(validations["D2:D1000"]).toEqual({
        kind: "list",
        values: [locale.vocabulary.income, locale.vocabulary.expense],
        dropdown: true,
        allowInvalid: false,
      });
    });
  });
});
