import { describe, expect, it } from "vitest";
import { en } from "../locale/en";
import { ja } from "../locale/ja";
import type { Locale } from "../locale/types";
import { getDefaultConfigRows } from "./getDefaultConfigRows";
import { readConfigSheet } from "./readConfigSheet";

const readBack = (locale: Locale) => {
  const rows = getDefaultConfigRows(locale.id);
  const header = [
    locale.configHeaders.type,
    locale.configHeaders.category,
    locale.configHeaders.excludeFromStats,
    locale.configHeaders.kind,
  ];
  return {
    rows,
    ...readConfigSheet({
      getDataRange: () => ({ getValues: () => [header, ...rows.map((row) => [...row])] }),
    } as unknown as GoogleAppsScript.Spreadsheet.Sheet),
  };
};

describe.each([
  ["ja", ja, ["分類移動", "繰越金"]],
  ["en", en, ["Type transfer", "Carryover"]],
])("default config rows for %s", (_id, locale, excludedNames) => {
  const { rows, catalog, typeOptions } = readBack(locale);
  const categories = rows.map(([, category]) => category).filter((category) => category !== "");

  it("classifies every default category", () => {
    expect(catalog.categoriesWithoutKind()).toEqual([]);
  });

  it("excludes the carryover and type transfer categories, and nothing else", () => {
    expect(catalog.excludedNames()).toEqual(excludedNames);
  });

  it("lists the carryover category as an excluded income category", () => {
    const carryover = locale.vocabulary.carryoverCategory;

    expect(catalog.lists(carryover)).toBe(true);
    expect(catalog.kindOf(carryover)).toBe("income");
    expect(catalog.isExcluded(carryover)).toBe(true);
  });

  it("puts the locale's income or expense word on every category row", () => {
    for (const [, category, , kind] of rows.filter(([, name]) => name !== "")) {
      expect(kind, category).toBe(
        category.startsWith(locale.vocabulary.income)
          ? locale.vocabulary.income
          : locale.vocabulary.expense,
      );
    }
  });

  it("names every category <kind>-<group> or <kind>-<group>-<item>", () => {
    for (const category of categories) {
      const segments = category.split("-");
      expect(segments.length, category).toBeGreaterThanOrEqual(2);
      expect(segments.length, category).toBeLessThanOrEqual(3);
      expect(
        segments.every((segment) => segment.trim() !== ""),
        category,
      ).toBe(true);
    }
  });

  it("lists each category and each type once", () => {
    expect(new Set(categories).size).toBe(categories.length);
    expect(new Set(typeOptions).size).toBe(typeOptions.length);
  });

  it("flags exclusion with a boolean, which the sheet shows as a checkbox", () => {
    expect(rows.every(([, , excluded]) => typeof excluded === "boolean")).toBe(true);
  });

  it("leaves the kind empty on rows that only carry a type", () => {
    expect(
      rows.filter(([, category]) => category === "").every(([, , , kind]) => kind === ""),
    ).toBe(true);
  });
});

describe("Japanese default config rows", () => {
  it("has the Japanese types and no initial registration category", () => {
    const { typeOptions, rows } = readBack(ja);

    expect(typeOptions).toHaveLength(7);
    expect(rows).toHaveLength(76);
    expect(rows.some(([, category]) => category.includes("初期登録"))).toBe(false);
  });
});

describe("English default config rows", () => {
  const { typeOptions, rows } = readBack(en);

  it("offers four generic types", () => {
    expect(typeOptions).toEqual(["Cash", "Bank-Checking", "Bank-Savings", "E-money"]);
  });

  it("lists the reviewed categories", () => {
    expect(rows.map(([, category]) => category).filter((category) => category !== "")).toEqual([
      "Income-Salary-Base",
      "Income-Salary-Bonus",
      "Income-Investment-Dividends",
      "Income-Investment-Interest",
      "Income-Windfall-Gift",
      "Income-Cash adjustment",
      "Income-Type transfer",
      "Income-Carryover",
      "Income-Other",
      "Expense-Housing-Rent",
      "Expense-Housing-Repairs",
      "Expense-Utilities-Electricity and gas",
      "Expense-Utilities-Water",
      "Expense-Communication-Phone",
      "Expense-Communication-Internet",
      "Expense-Food-Groceries",
      "Expense-Food-Dining out",
      "Expense-Daily goods-Clothing",
      "Expense-Daily goods-Household",
      "Expense-Transport-Public transit",
      "Expense-Transport-Taxi",
      "Expense-Medical-Consultation",
      "Expense-Medical-Medicine",
      "Expense-Learning-Books",
      "Expense-Leisure-Travel",
      "Expense-Leisure-Hobbies",
      "Expense-Insurance-Life",
      "Expense-Insurance-Health",
      "Expense-Social insurance-Pension",
      "Expense-Taxes-Income tax",
      "Expense-Taxes-Resident tax",
      "Expense-Investment-Funds",
      "Expense-Savings-Time deposit",
      "Expense-Gifts-Presents",
      "Expense-Cash adjustment",
      "Expense-Type transfer",
      "Expense-Other",
    ]);
  });
});
