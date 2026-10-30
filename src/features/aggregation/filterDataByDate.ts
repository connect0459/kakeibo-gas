import { formatDateToString } from "../date/formatDateToString";
import type { TransactionData } from "./types";

export const filterDataByDate = (
  data: TransactionData[],
  startDate: string,
  endDate: string,
  timeZone: string,
): TransactionData[] =>
  data.filter((item) => {
    if (!(item.date instanceof Date) || Number.isNaN(item.date.getTime())) {
      return true;
    }
    const day = formatDateToString(item.date, timeZone);
    return day >= startDate && day <= endDate;
  });
