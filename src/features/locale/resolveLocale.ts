import { en } from "./en";
import { ja } from "./ja";
import type { Locale, LocaleId } from "./types";

type ResolveLocaleInput = {
  sheetNames: readonly string[];
  spreadsheetLocale: string;
};

const sheetNamesOf = (locale: Locale): string[] => Object.values(locale.sheets);

const hasAnySheetOf = (sheetNames: readonly string[], locale: Locale): boolean =>
  sheetNamesOf(locale).some((name) => sheetNames.includes(name));

export const resolveLocale = ({ sheetNames, spreadsheetLocale }: ResolveLocaleInput): LocaleId => {
  if (hasAnySheetOf(sheetNames, ja)) return "ja";
  if (hasAnySheetOf(sheetNames, en)) return "en";
  return /^ja([_-]|$)/i.test(spreadsheetLocale) ? "ja" : "en";
};
