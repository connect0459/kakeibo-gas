import { describe, expect, it } from "vitest";
import { CategoryCatalog } from "../category/categoryCatalog";
import { findSignMismatches } from "./findSignMismatches";
import type { TransactionData } from "./types";

const transaction = (category: string, amount: number): TransactionData => ({
  date: new Date("2025-11-01"),
  type: "現金",
  category,
  description: "",
  amount,
});

const catalog = CategoryCatalog.of([
  { name: "支出-食費-外食", kind: "expense", excluded: false },
  { name: "収入-給与-本給", kind: "income", excluded: false },
  { name: "収入-繰越金", kind: "income", excluded: true },
  { name: "支出-その他", kind: undefined, excluded: false },
]);

describe("findSignMismatches", () => {
  it("lists an expense category with a positive amount", () => {
    expect(findSignMismatches([transaction("支出-食費-外食", 500)], catalog)).toEqual([
      "支出-食費-外食",
    ]);
  });

  it("lists an income category with a negative amount", () => {
    expect(findSignMismatches([transaction("収入-給与-本給", -500)], catalog)).toEqual([
      "収入-給与-本給",
    ]);
  });

  it("lists each category once, in order of appearance", () => {
    const mismatches = findSignMismatches(
      [
        transaction("支出-食費-外食", 1),
        transaction("収入-給与-本給", -1),
        transaction("支出-食費-外食", 2),
      ],
      catalog,
    );

    expect(mismatches).toEqual(["支出-食費-外食", "収入-給与-本給"]);
  });

  it("accepts amounts whose sign matches the kind, and zero", () => {
    const mismatches = findSignMismatches(
      [
        transaction("支出-食費-外食", -500),
        transaction("収入-給与-本給", 300000),
        transaction("支出-食費-外食", 0),
      ],
      catalog,
    );

    expect(mismatches).toEqual([]);
  });

  it("ignores an excluded category, so a carryover may hold a negative balance", () => {
    expect(findSignMismatches([transaction("収入-繰越金", -20000)], catalog)).toEqual([]);
  });

  it("ignores categories without a kind or missing from the catalog, which are reported separately", () => {
    const mismatches = findSignMismatches(
      [transaction("支出-その他", 100), transaction("支出-交通費-電車", 100)],
      catalog,
    );

    expect(mismatches).toEqual([]);
  });
});
