import type { LocaleId } from "../locale/types";
import { ENGLISH_DEFAULT_CONFIG_ROWS } from "./defaultConfigRows.en";
import { JAPANESE_DEFAULT_CONFIG_ROWS } from "./defaultConfigRows.ja";
import type { ConfigRow } from "./types";

const DEFAULT_CONFIG_ROWS: Readonly<Record<LocaleId, readonly ConfigRow[]>> = {
  ja: JAPANESE_DEFAULT_CONFIG_ROWS,
  en: ENGLISH_DEFAULT_CONFIG_ROWS,
};

export const getDefaultConfigRows = (id: LocaleId): readonly ConfigRow[] => DEFAULT_CONFIG_ROWS[id];
