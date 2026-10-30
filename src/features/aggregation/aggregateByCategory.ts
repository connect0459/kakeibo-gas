import type { CategoryCatalog } from "../category/categoryCatalog";
import type { CategoryKind } from "../category/categoryKind";
import type { CategoryAggregation, TransactionData } from "./types";

/**
 * Gets the main group from a category name
 *
 * @param category - Category name (e.g. "Income-Salary-Base")
 * @param otherGroup - Group to use when the category name is empty
 * @returns Main group (e.g. "Salary")
 *
 * @example
 * ```typescript
 * getCategoryMainGroup("Income-Salary-Base", "Other"); // "Salary"
 * getCategoryMainGroup("Expense-Food-DiningOut", "Other"); // "Food"
 * getCategoryMainGroup("", "Other"); // "Other"
 * ```
 */
const getCategoryMainGroup = (category: string, otherGroup: string): string => {
  if (!category || typeof category !== "string") return otherGroup;
  const parts = category.split("-");
  return parts.length > 1 ? parts[1] : parts[0];
};

/**
 * Aggregates by category (excluding excluded categories)
 *
 * A category counts as income or expense according to the catalog, which comes from the config
 * sheet. Categories the catalog does not list, or lists without a kind, are not aggregated.
 *
 * @param data - Transaction data
 * @param kind - "income" or "expense"
 * @param catalog - Categories of the config sheet, with their kind and exclusion flag
 * @param otherGroup - Group to use when the category name is empty
 * @returns Aggregation result by category
 *
 * @example
 * ```typescript
 * const transactions = [
 *   { category: "Income-Salary-Base", income: 300000, expense: 0, ... },
 *   { category: "Income-Carryover", income: 100000, expense: 0, ... },
 *   { category: "Expense-Food-DiningOut", income: 0, expense: 5000, ... },
 * ];
 * const catalog = CategoryCatalog.of([
 *   { name: "Income-Salary-Base", kind: "income", excluded: false },
 *   { name: "Income-Carryover", kind: "income", excluded: true },
 *   { name: "Expense-Food-DiningOut", kind: "expense", excluded: false },
 * ]);
 *
 * aggregateByCategory(transactions, "income", catalog, "Other");
 * // { "Salary": 300000 } (carryover is excluded)
 *
 * aggregateByCategory(transactions, "expense", catalog, "Other");
 * // { "Food": 5000 }
 * ```
 */
export const aggregateByCategory = (
  data: TransactionData[],
  kind: CategoryKind,
  catalog: CategoryCatalog,
  otherGroup: string,
): CategoryAggregation => {
  const result: CategoryAggregation = {};

  for (const item of data) {
    if (catalog.kindOf(item.category) !== kind || catalog.isExcluded(item.category)) {
      continue;
    }

    const mainCategory = getCategoryMainGroup(item.category, otherGroup);
    const amount = kind === "income" ? item.income : item.expense;

    // Aggregate only when the amount is valid and greater than 0
    if (mainCategory && !Number.isNaN(amount) && amount > 0) {
      result[mainCategory] = (result[mainCategory] ?? 0) + amount;
    }
  }

  return result;
};
