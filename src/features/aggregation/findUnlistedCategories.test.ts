import { describe, expect, it } from "vitest";
import { CategoryCatalog } from "../category/categoryCatalog";
import { findUnlistedCategories } from "./findUnlistedCategories";
import type { TransactionData } from "./types";

const transaction = (category: string): TransactionData => ({
  date: new Date("2025-11-01"),
  type: "現金",
  category,
  description: "",
  income: 0,
  expense: 100,
  total: -100,
});

const catalog = CategoryCatalog.of([
  { name: "支出-食費-外食", kind: "expense", excluded: false },
  { name: "収入-繰越金", kind: "income", excluded: true },
  { name: "支出-その他", kind: undefined, excluded: false },
]);

describe("findUnlistedCategories", () => {
  it("lists the categories of the transactions that the catalog does not know", () => {
    const unlisted = findUnlistedCategories(
      [transaction("支出-食費-外食"), transaction("支出-交通費-電車")],
      catalog,
    );

    expect(unlisted).toEqual(["支出-交通費-電車"]);
  });

  it("lists each unknown category once, in order of appearance", () => {
    const unlisted = findUnlistedCategories(
      [transaction("支出-B"), transaction("支出-A"), transaction("支出-B")],
      catalog,
    );

    expect(unlisted).toEqual(["支出-B", "支出-A"]);
  });

  it("does not list a category the catalog knows without a kind, since that is reported separately", () => {
    expect(findUnlistedCategories([transaction("支出-その他")], catalog)).toEqual([]);
  });

  it("does not list excluded categories that the catalog knows", () => {
    expect(findUnlistedCategories([transaction("収入-繰越金")], catalog)).toEqual([]);
  });

  it("ignores transactions without a category", () => {
    expect(findUnlistedCategories([transaction("")], catalog)).toEqual([]);
  });
});
