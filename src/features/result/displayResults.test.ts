import { describe, expect, test } from "vitest";
import { asSheet, FakeSpreadsheet } from "../../testing/fakeSpreadsheet.testing";
import { en } from "../locale/en";
import { ja } from "../locale/ja";
import { displayResults } from "./displayResults";

describe("displayResults", () => {
  const render = (income: Record<string, number>, expense: Record<string, number>, locale = ja) => {
    const sheet = new FakeSpreadsheet().withSheet(locale.sheets.result);
    const sections = displayResults(asSheet(sheet), locale, income, expense);
    return { sheet, sections };
  };

  describe("Summary", () => {
    test("Shows the total income, total expense, and their balance", () => {
      const { sheet } = render({ Salary: 300000 }, { Food: 80000, Rent: 70000 });

      expect(sheet.state("A5").value).toBe("集計サマリー");
      expect(["A6", "A7", "A8"].map((a1) => sheet.state(a1).value)).toEqual([
        "総収入:",
        "総支出:",
        "収支:",
      ]);
      expect(["B6", "B7", "B8"].map((a1) => sheet.state(a1).value)).toEqual([
        300000, 150000, 150000,
      ]);
    });

    test("Formats the summary amounts with a yen sign and thousands separators", () => {
      const { sheet } = render({ Salary: 300000 }, { Food: 80000 });

      expect(["B6", "B7", "B8"].map((a1) => sheet.state(a1).numberFormat)).toEqual([
        "¥#,##0",
        "¥#,##0",
        "¥#,##0",
      ]);
    });

    test("Shows a negative balance when expenses exceed income", () => {
      const { sheet } = render({ Salary: 100 }, { Food: 250 });

      expect(sheet.state("B8").value).toBe(-150);
    });

    test("Uses the English labels for the en locale", () => {
      const { sheet } = render({ Salary: 100 }, { Food: 50 }, en);

      expect(sheet.state("A5").value).toBe(en.result.summaryTitle);
      expect(sheet.state("A6").value).toBe(en.result.totalIncome);
    });

    test("Makes the summary title bold", () => {
      const { sheet } = render({ Salary: 100 }, { Food: 50 });

      expect(sheet.state("A5").fontWeight).toBe("bold");
    });
  });

  describe("Category sections", () => {
    test("Lists each income category with its amount under a bold header row", () => {
      const { sheet } = render({ Salary: 300000, Bonus: 100000 }, { Food: 80000 });

      expect(sheet.state("A10").value).toBe(ja.result.sectionTitle(ja.vocabulary.income));
      expect(sheet.state("A10").fontWeight).toBe("bold");
      expect([
        sheet.state("A11").value,
        sheet.state("B11").value,
        sheet.state("C11").value,
      ]).toEqual(["カテゴリ", "金額", "割合"]);
      expect(sheet.state("A11:C11").fontWeight).toBe("bold");
      expect([sheet.state("A12").value, sheet.state("B12").value]).toEqual(["Salary", 300000]);
      expect([sheet.state("A13").value, sheet.state("B13").value]).toEqual(["Bonus", 100000]);
    });

    test("Formats each amount with a yen sign and thousands separators", () => {
      const { sheet } = render({ Salary: 300000 }, { Food: 80000 });

      expect(sheet.state("B12").numberFormat).toBe("¥#,##0");
    });

    test("Shows each category's share of its section total with one decimal place", () => {
      const { sheet } = render({ Salary: 750, Bonus: 250 }, { Food: 80000 });

      expect([sheet.state("C12").value, sheet.state("C13").value]).toEqual([0.75, 0.25]);
      expect(sheet.state("C12").numberFormat).toBe("0.0%");
      expect(sheet.state("C13").numberFormat).toBe("0.0%");
    });

    test("Lists the expense section below the income section after a gap row", () => {
      const { sheet } = render({ Salary: 300000 }, { Food: 80000 });

      expect(sheet.state("A14").value).toBe(ja.result.sectionTitle(ja.vocabulary.expense));
      expect([sheet.state("A16").value, sheet.state("B16").value]).toEqual(["Food", 80000]);
    });

    test("Returns the row range of each section", () => {
      const { sections } = render({ Salary: 750, Bonus: 250 }, { Food: 80000 });

      expect(sections).toEqual({
        incomeSection: { start: 12, end: 14 },
        expenseSection: { start: 17, end: 18 },
      });
    });

    test("Returns an empty range for a section without categories and does not draw it", () => {
      const { sheet, sections } = render({}, { Food: 80000 });

      expect(sections.incomeSection).toEqual({ start: 0, end: 0 });
      expect(sheet.state("A10").value).toBe(ja.result.sectionTitle(ja.vocabulary.expense));
    });

    test("Returns an empty range for an expense section without categories and does not draw it", () => {
      const { sheet, sections } = render({ Salary: 750, Bonus: 250 }, {});

      expect(sections.expenseSection).toEqual({ start: 0, end: 0 });
      expect(sheet.state("A15").value).toBeUndefined();
    });

    test("Shows a ratio of zero instead of dividing by a zero total", () => {
      const { sheet } = render({ Salary: 0 }, { Food: 80000 });

      expect(sheet.state("C12").value).toBe(0);
    });

    test("Adds a merged, centered, italic placeholder row when the section total is zero", () => {
      const { sheet, sections } = render({ Salary: 0 }, { Food: 80000 });

      expect(sheet.state("A13").value).toBe(ja.result.emptySection(ja.vocabulary.income));
      expect(sheet.state("A13:C13")).toMatchObject({
        merged: true,
        horizontalAlignment: "center",
        fontStyle: "italic",
      });
      expect(sections.incomeSection).toEqual({ start: 12, end: 14 });
    });

    test("Does not add a placeholder row when the section has a non-zero total", () => {
      const { sheet } = render({ Salary: 100 }, { Food: 80000 });

      expect(sheet.state("A13:C13").merged).toBeUndefined();
    });
  });

  test("Resizes the three table columns to fit their content", () => {
    const { sheet } = render({ Salary: 100 }, { Food: 50 });

    expect(sheet.resizedColumns).toEqual([1, 2, 3]);
  });
});
