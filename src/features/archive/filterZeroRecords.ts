import { STATIC_CONFIG } from "../../config";

/**
 * Filters out zero-amount records
 *
 * @param data - Data array to filter (values of columns A to E)
 * @returns Data array without zero-amount records
 */
export const filterZeroRecords = (data: unknown[][]): unknown[][] => {
  return data.filter((row) => {
    const amount = row[STATIC_CONFIG.INPUT_COLUMNS.AMOUNT];
    return !(amount === null || amount === undefined || amount === "" || amount === 0);
  });
};
