import type { CategoryCatalog } from "../category/categoryCatalog";
import type { TransactionData } from "./types";

export const findSignMismatches = (
  data: readonly TransactionData[],
  catalog: CategoryCatalog,
): string[] => {
  const mismatched = data
    .filter((item) => {
      if (catalog.isExcluded(item.category)) return false;
      const kind = catalog.kindOf(item.category);
      return (kind === "income" && item.amount < 0) || (kind === "expense" && item.amount > 0);
    })
    .map((item) => item.category);
  return [...new Set(mismatched)];
};
