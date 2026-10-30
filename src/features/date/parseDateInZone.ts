import { startOfDayInZone } from "./startOfDayInZone";

const DATE_TEXT = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?!\d)/;

export const parseDateInZone = (text: string, timeZone: string): Date => {
  const match = DATE_TEXT.exec(text.trim());
  if (!match) {
    return new Date(text);
  }
  return startOfDayInZone(timeZone, Number(match[1]), Number(match[2]) - 1, Number(match[3]));
};
