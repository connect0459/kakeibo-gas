import { describe, expect, it } from "vitest";
import { en } from "./en";
import { getLocale } from "./getLocale";
import { ja } from "./ja";

type Shape = string | { [key: string]: Shape };

const shapeOf = (value: unknown): Shape => {
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, shapeOf(child)]));
  }
  return typeof value;
};

const collectText = (value: unknown, path = ""): [string, string][] => {
  if (typeof value === "string") return [[path, value]];
  if (typeof value === "object" && value !== null) {
    return Object.entries(value).flatMap(([key, child]) =>
      collectText(child, path ? `${path}.${key}` : key),
    );
  }
  return [];
};

describe("locale dictionaries", () => {
  it("expose the same keys, with the same value kinds, in ja and en", () => {
    expect(shapeOf(en)).toEqual(shapeOf(ja));
  });

  it.each([
    ["ja", ja],
    ["en", en],
  ])("%s has no empty text", (_id, locale) => {
    const empty = collectText(locale).filter(([, text]) => text.trim() === "");
    expect(empty).toEqual([]);
  });

  it("identify themselves", () => {
    expect([ja.id, en.id]).toEqual(["ja", "en"]);
  });

  it("are looked up by id", () => {
    expect(getLocale("ja")).toBe(ja);
    expect(getLocale("en")).toBe(en);
  });
});

describe.each([
  ["ja", ja],
  ["en", en],
])("%s vocabulary", (_id, locale) => {
  const { income, expense, carryoverCategory } = locale.vocabulary;

  it("classifies the carryover category as income, which aggregation decides by prefix", () => {
    expect(carryoverCategory.startsWith(`${income}-`)).toBe(true);
  });

  it("keeps the income and expense words from being a prefix of each other", () => {
    expect(income.startsWith(expense)).toBe(false);
    expect(expense.startsWith(income)).toBe(false);
  });
});

describe("ja dictionary", () => {
  it("keeps the sheet names existing spreadsheets already use", () => {
    expect(ja.sheets).toEqual({
      input: "入力",
      result: "結果",
      archive: "アーカイブ",
      config: "設定",
    });
  });

  it("keeps the transaction column headers existing sheets already use", () => {
    expect(ja.headers).toEqual({
      date: "日付",
      type: "分類",
      category: "科目",
      description: "摘要",
      income: "収入",
      expense: "支出",
    });
  });

  it("keeps the result-sheet labels of the live spreadsheet", () => {
    expect(ja.result.periodLabel).toBe("集計期間:");
    expect(ja.result.periodSeparator).toBe("～");
    expect(ja.result.summaryTitle).toBe("集計サマリー");
    expect(ja.result.totalIncome).toBe("総収入:");
    expect(ja.result.totalExpense).toBe("総支出:");
    expect(ja.result.balance).toBe("収支:");
    expect(ja.result.sectionTitle(ja.vocabulary.income)).toBe("収入内訳");
    expect(ja.result.sectionTitle(ja.vocabulary.expense)).toBe("支出内訳");
    expect([ja.result.categoryHeader, ja.result.amountHeader, ja.result.ratioHeader]).toEqual([
      "カテゴリ",
      "金額",
      "割合",
    ]);
  });

  it("names the income/expense column of the config sheet", () => {
    expect(ja.configHeaders.kind).toBe("収支");
  });

  it("reports categories without a valid income/expense value", () => {
    expect(ja.alerts.categoriesWithoutKind("収支", ["支出-食費-外食", "支出-その他"])).toBe(
      "設定シートの「収支」列が未設定または不正な科目があります: 支出-食費-外食、支出-その他",
    );
  });

  it("reports categories in the transactions that the config sheet does not list", () => {
    expect(ja.alerts.categoriesNotListed(["支出-交通費-電車", "支出-その他"])).toBe(
      "設定シートにない科目の取引があります。設定シートに科目を追加してください: 支出-交通費-電車、支出-その他",
    );
  });

  it("keeps the carryover category and fallback group the aggregation already matches", () => {
    expect(ja.vocabulary.carryoverCategory).toBe("収入-繰越金");
    expect(ja.vocabulary.otherGroup).toBe("その他");
  });

  it("formats summary titles as before", () => {
    expect(ja.titles.month(2026, 10)).toBe("2026年10月の集計");
    expect(ja.titles.year(2026)).toBe("2026年の集計");
    expect(ja.titles.range("2026-01-01", "2026-03-31")).toBe("2026-01-01～2026-03-31の集計");
  });

  it("says the start date may be the same day as the end date, as the dialog check allows", () => {
    expect(ja.dialog.startAfterEnd).toBe("開始日は終了日以前の日付を選択してください");
  });

  it("does not zero-pad the month in summary titles", () => {
    expect(ja.titles.month(2026, 3)).toBe("2026年3月の集計");
  });

  it("formats the carryover description, archive count, and missing sheet as before", () => {
    expect(ja.vocabulary.carryoverDescription("現金")).toBe("過去データの繰越（現金）");
    expect(ja.alerts.archived(3)).toBe("3件のデータをアーカイブしました。");
    expect(ja.alerts.sheetNotFound("入力")).toBe("「入力」シートが見つかりません。");
  });

  it("formats the excluded-categories note as before", () => {
    expect(ja.result.excludedNote(["繰越金", "分類移動"])).toBe(
      "※ 集計には「繰越金」「分類移動」の項目は含まれていません",
    );
  });
});

describe("en dictionary", () => {
  it("names the sheets in English", () => {
    expect(en.sheets).toEqual({
      input: "Input",
      result: "Result",
      archive: "Archive",
      config: "Config",
    });
  });

  it("formats summary titles in English", () => {
    expect(en.titles.month(2026, 3)).toBe("Summary for 2026-03");
    expect(en.titles.year(2026)).toBe("Summary for 2026");
    expect(en.titles.range("2026-01-01", "2026-03-31")).toBe(
      "Summary for 2026-01-01 to 2026-03-31",
    );
  });

  it("formats the excluded-categories note in English", () => {
    expect(en.result.excludedNote(["Carryover", "Transfer"])).toBe(
      'Note: items for "Carryover", "Transfer" are not included in the summary',
    );
  });

  it("names the income/expense column of the config sheet", () => {
    expect(en.configHeaders.kind).toBe("Income/Expense");
  });

  it("reports categories without a valid income/expense value", () => {
    expect(
      en.alerts.categoriesWithoutKind("Income/Expense", ["Expense-Food", "Expense-Other"]),
    ).toBe(
      'These categories in the config sheet have no valid "Income/Expense" value: Expense-Food, Expense-Other',
    );
  });

  it("reports categories in the transactions that the config sheet does not list", () => {
    expect(en.alerts.categoriesNotListed(["Expense-Transport", "Expense-Other"])).toBe(
      "These categories in the transactions are missing from the config sheet; add them there: Expense-Transport, Expense-Other",
    );
  });

  it("labels the period cells in English", () => {
    expect(en.result.periodLabel).toBe("Period:");
    expect(en.result.periodSeparator).toBe("to");
  });

  it("zero-pads the month in summary titles", () => {
    expect(en.titles.month(2026, 12)).toBe("Summary for 2026-12");
  });

  it("pluralizes the archived record count", () => {
    expect(en.alerts.archived(1)).toBe("Archived 1 record.");
    expect(en.alerts.archived(2)).toBe("Archived 2 records.");
  });

  it("lowercases the section label in the empty-section placeholder", () => {
    expect(en.result.emptySection("Income")).toBe("(No income in this period)");
  });

  it("uses a carryover category whose kind prefix is English", () => {
    expect(en.vocabulary.carryoverCategory).toBe("Income-Carryover");
    expect(en.vocabulary.otherGroup).toBe("Other");
  });
});
