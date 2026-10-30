import { en } from "./en";
import { ja } from "./ja";
import type { Locale, LocaleId } from "./types";

const LOCALES: Readonly<Record<LocaleId, Locale>> = { ja, en };

export const getLocale = (id: LocaleId): Locale => LOCALES[id];
