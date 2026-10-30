import { describe, expect, it } from "vitest";
import { readConfigSheet } from "./readConfigSheet";

const createSheet = (rows: unknown[][]) =>
  ({
    getDataRange: () => ({ getValues: () => rows }),
  }) as unknown as GoogleAppsScript.Spreadsheet.Sheet;

const HEADER = ["分類", "科目", "集計から除外", "収支"];

describe("readConfigSheet", () => {
  describe("types", () => {
    it("reads the types of column A in order", () => {
      const { typeOptions } = readConfigSheet(
        createSheet([
          HEADER,
          ["現金", "収入-給与-本給", "", "収入"],
          ["銀行-三井住友銀行", "支出-食費-外食", "", "支出"],
        ]),
      );

      expect(typeOptions).toEqual(["現金", "銀行-三井住友銀行"]);
    });

    it("reads types and categories independently, so a row may have only one of them", () => {
      const { typeOptions, catalog } = readConfigSheet(
        createSheet([
          HEADER,
          ["現金", "", "", ""],
          ["", "収入-給与-本給", "", "収入"],
          ["銀行-三井住友銀行", "", "", ""],
        ]),
      );

      expect(typeOptions).toEqual(["現金", "銀行-三井住友銀行"]);
      expect(catalog.kindOf("収入-給与-本給")).toBe("income");
    });
  });

  describe("income and expense", () => {
    it("takes the kind of each category from column D", () => {
      const { catalog } = readConfigSheet(
        createSheet([
          HEADER,
          ["", "収入-給与-本給", "", "収入"],
          ["", "支出-食費-外食", "", "支出"],
        ]),
      );

      expect(catalog.kindOf("収入-給与-本給")).toBe("income");
      expect(catalog.kindOf("支出-食費-外食")).toBe("expense");
    });

    it("reads English words, ignoring case and spaces", () => {
      const { catalog } = readConfigSheet(
        createSheet([
          ["Type", "Category", "Exclude", "Income/Expense"],
          ["", "Income-Salary-Base", "", "Income"],
          ["", "Expense-Food-Dining", "", "  expense "],
        ]),
      );

      expect(catalog.kindOf("Income-Salary-Base")).toBe("income");
      expect(catalog.kindOf("Expense-Food-Dining")).toBe("expense");
    });

    it("does not guess the kind from the category name when column D is empty", () => {
      const { catalog } = readConfigSheet(createSheet([HEADER, ["", "収入-給与-本給", "", ""]]));

      expect(catalog.kindOf("収入-給与-本給")).toBeUndefined();
      expect(catalog.categoriesWithoutKind()).toEqual(["収入-給与-本給"]);
    });

    it("reports a category whose kind is not a recognized word", () => {
      const { catalog } = readConfigSheet(
        createSheet([
          HEADER,
          ["", "支出-食費-外食", "", "Revenue"],
          ["", "収入-その他", "", "収入"],
        ]),
      );

      expect(catalog.categoriesWithoutKind()).toEqual(["支出-食費-外食"]);
    });

    it("reports every category of a sheet that has no column D", () => {
      const { catalog } = readConfigSheet(
        createSheet([
          ["分類", "科目", "集計から除外"],
          ["現金", "収入-給与-本給", ""],
          ["", "支出-食費-外食", ""],
        ]),
      );

      expect(catalog.categoriesWithoutKind()).toEqual(["収入-給与-本給", "支出-食費-外食"]);
    });
  });

  describe("excluded categories", () => {
    it.each([
      ["TRUE", "TRUE"],
      ["true", "true"],
      ["a check mark", "✓"],
      ["boolean true", true],
      ["a padded value", "  TRUE  "],
    ])("excludes a category flagged with %s", (_label, flag) => {
      const { catalog } = readConfigSheet(createSheet([HEADER, ["", "収入-繰越金", flag, "収入"]]));

      expect(catalog.isExcluded("収入-繰越金")).toBe(true);
    });

    it.each([
      ["an empty cell", ""],
      ["FALSE", "FALSE"],
      ["boolean false", false],
      ["another word", "no"],
    ])("does not exclude a category flagged with %s", (_label, flag) => {
      const { catalog } = readConfigSheet(createSheet([HEADER, ["", "収入-繰越金", flag, "収入"]]));

      expect(catalog.isExcluded("収入-繰越金")).toBe(false);
    });

    it("excludes only the flagged category, not others that contain its last segment", () => {
      const { catalog } = readConfigSheet(
        createSheet([HEADER, ["", "収入-繰越金", "TRUE", "収入"], ["", "支出-繰越金", "", "支出"]]),
      );

      expect(catalog.isExcluded("収入-繰越金")).toBe(true);
      expect(catalog.isExcluded("支出-繰越金")).toBe(false);
    });

    it("lists the names of the excluded categories once, in sheet order", () => {
      const { catalog } = readConfigSheet(
        createSheet([
          HEADER,
          ["", "収入-分類移動", "TRUE", "収入"],
          ["", "収入-繰越金", "TRUE", "収入"],
          ["", "支出-分類移動", "TRUE", "支出"],
        ]),
      );

      expect(catalog.excludedNames()).toEqual(["分類移動", "繰越金"]);
    });
  });

  describe("sheet shape", () => {
    it("returns nothing for a sheet with only the header row", () => {
      const { typeOptions, catalog } = readConfigSheet(createSheet([HEADER]));

      expect(typeOptions).toEqual([]);
      expect(catalog.categoriesWithoutKind()).toEqual([]);
      expect(catalog.excludedNames()).toEqual([]);
    });

    it("skips blank rows, including rows that only carry an unchecked box", () => {
      const { typeOptions, catalog } = readConfigSheet(
        createSheet([
          HEADER,
          ["現金", "収入-給与-本給", false, "収入"],
          ["", "", false, ""],
          ["", "", "", ""],
          ["", "収入-繰越金", true, "収入"],
        ]),
      );

      expect(typeOptions).toEqual(["現金"]);
      expect(catalog.excludedNames()).toEqual(["繰越金"]);
      expect(catalog.categoriesWithoutKind()).toEqual([]);
    });

    it("trims whitespace around types and categories", () => {
      const { typeOptions, catalog } = readConfigSheet(
        createSheet([HEADER, ["  現金  ", "  収入-給与-本給  ", "", "収入"]]),
      );

      expect(typeOptions).toEqual(["現金"]);
      expect(catalog.kindOf("収入-給与-本給")).toBe("income");
    });
  });
});
