/**
 * Filters out zero-amount records
 *
 * @param data - Data array to filter (values of columns A to F)
 * @returns Data array without zero-amount records
 */
export const filterZeroRecords = (data: unknown[][]): unknown[][] => {
  return data.filter((row) => {
    const income = row[4]; // Column E (income)
    const expense = row[5]; // Column F (expense)

    // Function that determines whether a value is 0 or blank
    const isZeroOrEmpty = (value: unknown): boolean => {
      return value === null || value === undefined || value === "" || value === 0;
    };

    // Exclude when both income and expense are 0 or blank (return false)
    // Keep otherwise (return true)
    return !(isZeroOrEmpty(income) && isZeroOrEmpty(expense));
  });
};
