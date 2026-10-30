import { STATIC_CONFIG } from "../../config";
import type { CategoryAggregation, SectionPosition, SectionsMap } from "../../types";
import type { Locale } from "../locale/types";

/**
 * Displays the aggregation results on the result sheet: the summary, then the income and expense tables
 *
 * @param sheet - Result sheet
 * @param locale - Locale that supplies the labels
 * @param incomeData - Income amounts by category
 * @param expenseData - Expense amounts by category
 * @returns Row ranges of the income and expense tables, used to place the charts
 */
export const displayResults = (
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  locale: Locale,
  incomeData: CategoryAggregation,
  expenseData: CategoryAggregation,
): { incomeSection: SectionPosition; expenseSection: SectionPosition } => {
  const summaryStartRow = 5;
  const totalIncome = Object.values(incomeData).reduce((sum: number, val: number) => sum + val, 0);
  const totalExpense = Object.values(expenseData).reduce(
    (sum: number, val: number) => sum + val,
    0,
  );
  const balance = totalIncome - totalExpense;
  const { result: text, vocabulary } = locale;
  sheet.getRange(`A${summaryStartRow}`).setValue(text.summaryTitle).setFontWeight("bold");

  const summaryData = [
    [text.totalIncome, totalIncome],
    [text.totalExpense, totalExpense],
    [text.balance, balance],
  ];

  summaryData.forEach(([label, value], index) => {
    sheet.getRange(`A${summaryStartRow + index + 1}`).setValue(label);
    sheet
      .getRange(`B${summaryStartRow + index + 1}`)
      .setValue(value)
      .setNumberFormat(STATIC_CONFIG.RESULT_AMOUNT_FORMAT);
  });

  let row = summaryStartRow + 5;
  const sections: SectionsMap = {};
  const displaySection = (
    sectionData: CategoryAggregation,
    title: string,
    total: number,
    sectionKey: string,
  ): number => {
    if (Object.keys(sectionData).length === 0) return 0;

    sheet.getRange(`A${row}`).setValue(text.sectionTitle(title)).setFontWeight("bold");
    row++;

    [text.categoryHeader, text.amountHeader, text.ratioHeader].forEach((header, index) => {
      sheet.getRange(row, index + 1).setValue(header);
    });
    sheet.getRange(`A${row}:C${row}`).setFontWeight("bold");
    row++;

    const startRow = row;

    Object.entries(sectionData).forEach(([category, amount]: [string, number]) => {
      sheet.getRange(`A${row}`).setValue(category);
      sheet
        .getRange(`B${row}`)
        .setValue(amount)
        .setNumberFormat(STATIC_CONFIG.RESULT_AMOUNT_FORMAT);
      sheet
        .getRange(`C${row}`)
        .setValue(total ? amount / total : 0)
        .setNumberFormat(STATIC_CONFIG.RESULT_RATIO_FORMAT);
      row++;
    });
    if (total === 0) {
      sheet.getRange(`A${row}`).setValue(text.emptySection(title));
      sheet
        .getRange(`A${row}:C${row}`)
        .merge()
        .setHorizontalAlignment("center")
        .setFontStyle("italic");
      row++;
    }

    sections[sectionKey] = { start: startRow, end: row };
    row++; // Leave a gap
    return startRow;
  };
  displaySection(incomeData, vocabulary.income, totalIncome, "incomeSection");
  displaySection(expenseData, vocabulary.expense, totalExpense, "expenseSection");
  [1, 2, 3].forEach((col) => sheet.autoResizeColumn(col));

  return {
    incomeSection: sections.incomeSection || { start: 0, end: 0 },
    expenseSection: sections.expenseSection || { start: 0, end: 0 },
  };
};
