import { describe, expect, test } from "vitest";
import { filterZeroRecords } from "./filterZeroRecords";

const record = (amount: unknown): unknown[] => ["2024-01-01", "現金", "食費", "", amount];

describe("filterZeroRecords", () => {
  test.each([0, "", null, undefined])("Excludes a row whose amount is %s", (amount) => {
    expect(filterZeroRecords([record(amount)])).toEqual([]);
  });

  test.each([1, -1, 300000, -800, "1,000"])("Keeps a row whose amount is %s", (amount) => {
    expect(filterZeroRecords([record(amount)])).toEqual([record(amount)]);
  });

  test("Excludes only the zero-amount rows when mixed, keeping their order", () => {
    const rows = [record(500), record(0), record(-300), record("")];

    expect(filterZeroRecords(rows)).toEqual([record(500), record(-300)]);
  });

  test("Returns an empty array for empty input", () => {
    expect(filterZeroRecords([])).toEqual([]);
  });
});
