import { formatDateToString } from "./formatDateToString";
import { startOfDayInZone } from "./startOfDayInZone";

/**
 * Calculates the dates of a period
 *
 * @param timeZone - IANA time zone that decides what "today" is and where each day starts
 * @param yearOffset - Year offset (0=this year, -1=last year)
 * @param monthOffset - Month offset (0=this month, -1=last month)
 * @param fullYear - Whether to get the full-year period
 * @returns Object with the start date and end date
 *
 * @example
 * ```ts
 * // Get this month's period
 * const thisMonth = calculatePeriodDates(timeZone, 0, 0);
 * // thisMonth = { startDate: "2025-10-01", endDate: "2025-10-31", startDateObj: Date, endDateObj: Date }
 *
 * // Get last month's period
 * const lastMonth = calculatePeriodDates(timeZone, 0, -1);
 *
 * // Get this year's full period
 * const thisYear = calculatePeriodDates(timeZone, 0, 0, true);
 * // thisYear = { startDate: "2025-01-01", endDate: "2025-12-31", startDateObj: Date, endDateObj: Date }
 * ```
 */
export const calculatePeriodDates = (
  timeZone: string,
  yearOffset: number = 0,
  monthOffset: number = 0,
  fullYear: boolean = false,
): { startDate: string; endDate: string; startDateObj: Date; endDateObj: Date } => {
  const [todayYear, todayMonth] = formatDateToString(new Date(), timeZone, "yyyy-MM-dd")
    .split("-")
    .map(Number);
  const targetYear = todayYear + yearOffset;

  let startYear: number;
  let startMonth: number;
  let endYear: number;
  let endMonth: number;
  let endDay: number;

  if (fullYear) {
    startYear = targetYear;
    startMonth = 0;
    endYear = targetYear;
    endMonth = 11;
    endDay = 31;
  } else {
    const monthIndex = todayMonth - 1 + monthOffset;
    const monthStart = new Date(Date.UTC(targetYear, monthIndex, 1));
    startYear = monthStart.getUTCFullYear();
    startMonth = monthStart.getUTCMonth();
    endYear = startYear;
    endMonth = startMonth;
    endDay = new Date(Date.UTC(startYear, startMonth + 1, 0)).getUTCDate();
  }

  const startDate = startOfDayInZone(timeZone, startYear, startMonth, 1);
  const endDate = startOfDayInZone(timeZone, endYear, endMonth, endDay);

  return {
    startDate: formatDateToString(startDate, timeZone),
    endDate: formatDateToString(endDate, timeZone),
    startDateObj: startDate,
    endDateObj: endDate,
  };
};
