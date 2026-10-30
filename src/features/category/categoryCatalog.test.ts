import { describe, expect, it } from "vitest";
import { CategoryCatalog, type CategoryEntry } from "./categoryCatalog";

const entry = (name: string, kind: CategoryEntry["kind"], excluded = false): CategoryEntry => ({
  name,
  kind,
  excluded,
});

describe("CategoryCatalog", () => {
  describe("kindOf", () => {
    const catalog = CategoryCatalog.of([
      entry("収入-給与-本給", "income"),
      entry("支出-食費-外食", "expense"),
    ]);

    it("returns the kind recorded for a listed category", () => {
      expect(catalog.kindOf("収入-給与-本給")).toBe("income");
      expect(catalog.kindOf("支出-食費-外食")).toBe("expense");
    });

    it("returns undefined for a category that is not listed", () => {
      expect(catalog.kindOf("支出-その他")).toBeUndefined();
    });

    it("does not guess the kind from the wording of the category", () => {
      const withoutKind = CategoryCatalog.of([entry("収入-給与-本給", undefined)]);

      expect(withoutKind.kindOf("収入-給与-本給")).toBeUndefined();
    });

    it("keeps the first entry when a category is listed twice", () => {
      const duplicated = CategoryCatalog.of([
        entry("収入-その他", "income"),
        entry("収入-その他", "expense", true),
      ]);

      expect(duplicated.kindOf("収入-その他")).toBe("income");
      expect(duplicated.isExcluded("収入-その他")).toBe(false);
    });
  });

  describe("lists", () => {
    const catalog = CategoryCatalog.of([
      entry("収入-給与-本給", "income"),
      entry("支出-食費-外食", undefined),
    ]);

    it("is true for a listed category, with or without a kind", () => {
      expect(catalog.lists("収入-給与-本給")).toBe(true);
      expect(catalog.lists("支出-食費-外食")).toBe(true);
    });

    it("is false for a category that is not listed", () => {
      expect(catalog.lists("支出-その他")).toBe(false);
    });
  });

  describe("isExcluded", () => {
    const catalog = CategoryCatalog.of([
      entry("収入-繰越金", "income", true),
      entry("支出-食費-外食", "expense"),
    ]);

    it("is true for a category flagged as excluded", () => {
      expect(catalog.isExcluded("収入-繰越金")).toBe(true);
    });

    it("is false for a listed category that is not flagged", () => {
      expect(catalog.isExcluded("支出-食費-外食")).toBe(false);
    });

    it("matches the whole category name, not a part of it", () => {
      expect(catalog.isExcluded("支出-繰越金")).toBe(false);
      expect(catalog.isExcluded("繰越金")).toBe(false);
      expect(catalog.isExcluded("収入-繰越金-前年")).toBe(false);
    });

    it("is false for a category that is not listed", () => {
      expect(catalog.isExcluded("収入-その他")).toBe(false);
    });
  });

  describe("excludedNames", () => {
    it("lists the last segment of each excluded category once, in sheet order", () => {
      const catalog = CategoryCatalog.of([
        entry("収入-分類移動", "income", true),
        entry("支出-食費-外食", "expense"),
        entry("収入-繰越金", "income", true),
        entry("支出-分類移動", "expense", true),
      ]);

      expect(catalog.excludedNames()).toEqual(["分類移動", "繰越金"]);
    });

    it("uses the whole name of an excluded category that has no hyphen", () => {
      const catalog = CategoryCatalog.of([entry("Adjustment", "income", true)]);

      expect(catalog.excludedNames()).toEqual(["Adjustment"]);
    });

    it("is empty when nothing is excluded", () => {
      expect(CategoryCatalog.of([entry("収入-その他", "income")]).excludedNames()).toEqual([]);
    });
  });

  describe("categoriesWithoutKind", () => {
    it("lists the categories that have no valid kind, in sheet order", () => {
      const catalog = CategoryCatalog.of([
        entry("収入-給与-本給", "income"),
        entry("支出-食費-外食", undefined),
        entry("支出-その他", undefined),
      ]);

      expect(catalog.categoriesWithoutKind()).toEqual(["支出-食費-外食", "支出-その他"]);
    });

    it("is empty when every category has a kind", () => {
      expect(CategoryCatalog.of([entry("収入-その他", "income")]).categoriesWithoutKind()).toEqual(
        [],
      );
    });
  });

  describe("category names with surrounding whitespace", () => {
    const catalog = CategoryCatalog.of([
      entry("収入-繰越金", "income", true),
      entry("支出-食費-外食", "expense"),
    ]);

    it("finds a listed category whatever whitespace surrounds the name asked for", () => {
      expect(catalog.lists("支出-食費-外食 ")).toBe(true);
      expect(catalog.kindOf("  支出-食費-外食")).toBe("expense");
      expect(catalog.isExcluded(" 収入-繰越金\t")).toBe(true);
    });

    it("stores a listed name without the whitespace around it", () => {
      const padded = CategoryCatalog.of([entry("  収入-繰越金 ", "income", true)]);

      expect(padded.lists("収入-繰越金")).toBe(true);
      expect(padded.excludedNames()).toEqual(["繰越金"]);
    });

    it("does not ignore whitespace inside a name", () => {
      expect(catalog.lists("支出- 食費-外食")).toBe(false);
    });
  });

  it("is not changed by later changes to the entries it was built from", () => {
    const entries = [entry("収入-その他", "income")];
    const catalog = CategoryCatalog.of(entries);

    entries.push(entry("支出-その他", "expense"));

    expect(catalog.kindOf("支出-その他")).toBeUndefined();
  });
});
