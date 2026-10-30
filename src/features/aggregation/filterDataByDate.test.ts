import { describe, expect, it } from "vitest";
import { startOfDayInZone } from "../date/startOfDayInZone";
import { filterDataByDate } from "./filterDataByDate";
import type { TransactionData } from "./types";

const transaction = (date: Date | null): TransactionData => ({
  date,
  type: "Cash",
  category: "Expense-Food",
  description: "",
  income: 0,
  expense: 100,
  total: -100,
});

describe("filterDataByDate", () => {
  it("includes both the first and the last day of the period", () => {
    const first = transaction(startOfDayInZone("Asia/Tokyo", 2025, 9, 1));
    const last = transaction(startOfDayInZone("Asia/Tokyo", 2025, 9, 31));
    const outside = transaction(startOfDayInZone("Asia/Tokyo", 2025, 10, 1));

    const result = filterDataByDate(
      [first, last, outside],
      "2025-10-01",
      "2025-10-31",
      "Asia/Tokyo",
    );

    expect(result).toEqual([first, last]);
  });

  it("includes rows without a date", () => {
    const undated = transaction(null);

    expect(filterDataByDate([undated], "2025-10-01", "2025-10-31", "Asia/Tokyo")).toEqual([
      undated,
    ]);
  });

  it("judges the day in the given zone, where midnight is the previous day in UTC", () => {
    const firstOfMonth = transaction(startOfDayInZone("Asia/Tokyo", 2025, 9, 1));

    const result = filterDataByDate([firstOfMonth], "2025-10-01", "2025-10-01", "Asia/Tokyo");

    expect(result).toEqual([firstOfMonth]);
  });

  it("judges the day in a zone ahead of Japan", () => {
    const firstOfMonth = transaction(startOfDayInZone("Pacific/Auckland", 2025, 9, 1));
    const lastOfPrevious = transaction(startOfDayInZone("Pacific/Auckland", 2025, 8, 30));

    const result = filterDataByDate(
      [lastOfPrevious, firstOfMonth],
      "2025-10-01",
      "2025-10-31",
      "Pacific/Auckland",
    );

    expect(result).toEqual([firstOfMonth]);
  });

  it("judges the day in a zone behind Japan", () => {
    const firstOfMonth = transaction(startOfDayInZone("America/Los_Angeles", 2025, 9, 1));
    const lastOfPrevious = transaction(startOfDayInZone("America/Los_Angeles", 2025, 8, 30));

    const result = filterDataByDate(
      [lastOfPrevious, firstOfMonth],
      "2025-10-01",
      "2025-10-31",
      "America/Los_Angeles",
    );

    expect(result).toEqual([firstOfMonth]);
  });
});
