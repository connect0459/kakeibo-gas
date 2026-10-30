import { en } from "../locale/en";
import { ja } from "../locale/ja";
import { CategoryCatalog } from "./categoryCatalog";
import type { CategoryKind } from "./categoryKind";

const startsWithAny = (text: string, words: readonly string[]): boolean =>
  words.some((word) => text.startsWith(word));

const kindByWording = (category: string): CategoryKind | undefined => {
  if (startsWithAny(category, [ja.vocabulary.income, en.vocabulary.income])) return "income";
  if (startsWithAny(category, [ja.vocabulary.expense, en.vocabulary.expense])) return "expense";
  return undefined;
};

export const catalogByWording = (
  transactions: readonly { category: string }[],
  excludedNames: readonly string[] = [],
): CategoryCatalog =>
  CategoryCatalog.of(
    [...new Set(transactions.map((transaction) => transaction.category))]
      .filter((name) => name !== "")
      .map((name) => ({
        name,
        kind: kindByWording(name),
        excluded: excludedNames.some(
          (excluded) => name === excluded || name.endsWith(`-${excluded}`),
        ),
      })),
  );
