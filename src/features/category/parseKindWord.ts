import { en } from "../locale/en";
import { ja } from "../locale/ja";
import type { CategoryKind } from "./categoryKind";

const KIND_WORDS: ReadonlyMap<string, CategoryKind> = new Map(
  [ja, en].flatMap((locale): [string, CategoryKind][] => [
    [locale.vocabulary.income.toLowerCase(), "income"],
    [locale.vocabulary.expense.toLowerCase(), "expense"],
  ]),
);

export const parseKindWord = (value: unknown): CategoryKind | undefined =>
  typeof value === "string" ? KIND_WORDS.get(value.trim().toLowerCase()) : undefined;
