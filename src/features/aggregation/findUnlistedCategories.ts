import type { CategoryCatalog } from "../category/categoryCatalog";
import type { TransactionData } from "./types";

export const findUnlistedCategories = (
  data: readonly TransactionData[],
  catalog: CategoryCatalog,
): string[] => {
  const unlisted = data
    .map((item) => item.category)
    .filter((category) => category !== "" && !catalog.lists(category));
  return [...new Set(unlisted)];
};
