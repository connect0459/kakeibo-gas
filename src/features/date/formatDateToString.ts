import { STATIC_CONFIG } from "../../config";

/**
 * Converts a date to a YYYY-MM-DD string in the given time zone
 *
 * @param date - Date object
 * @param timeZone - IANA time zone, such as the spreadsheet's (`getSpreadsheetTimeZone()`)
 * @param format - Format (default: STATIC_CONFIG.DATE_FORMAT)
 * @returns Formatted date string
 *
 * @example
 * ```ts
 * const date = new Date(Date.UTC(2025, 9, 1, 12, 0));
 * formatDateToString(date, "Asia/Tokyo"); // "2025-10-01"
 * formatDateToString(date, "Pacific/Auckland"); // "2025-10-02"
 * formatDateToString(date, "Asia/Tokyo", "yyyy/MM/dd"); // "2025/10/01"
 * ```
 */
export const formatDateToString = (
  date: Date,
  timeZone: string,
  format: string = STATIC_CONFIG.DATE_FORMAT,
): string => {
  return Utilities.formatDate(date, timeZone, format);
};
