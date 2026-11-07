import { describe, expect, test } from "vitest";
import { en } from "../locale/en";
import { processRawData } from "./processRawData";

const SOURCE = { sheetName: "Input", firstRow: 2, describeInvalidAmount: en.alerts.invalidAmount };
const date = new Date("2025-01-10");

describe("processRawData", () => {
  test("Amount text with a thousands separator counts as the same amount as on the archive sheet", () => {
    const result = processRawData([[date, "Cash", "Expense-Food", "Lunch", "-1,000"]], SOURCE);

    expect(result[0]).toMatchObject({ amount: -1000 });
  });

  test.each(["(1,000)", "▲500", "−500", "1e3", "abc"])(
    "Amount %s is rejected with an error naming the sheet and the row",
    (amount) => {
      const rows = [
        [date, "Cash", "Expense-Food", "Lunch", -800],
        [],
        [date, "Cash", "Expense-Food", "Dinner", amount],
      ];

      expect(() => processRawData(rows, SOURCE)).toThrow(en.alerts.invalidAmount("Input", 4));
    },
  );

  test("A negative amount is read as an expense instead of being rejected", () => {
    const result = processRawData([[date, "Cash", "Expense-Food", "Lunch", -500]], SOURCE);

    expect(result[0].amount).toBe(-500);
  });

  test("A positive amount is read as income", () => {
    const result = processRawData([[date, "Cash", "Income-Salary", "Pay", 500]], SOURCE);

    expect(result[0].amount).toBe(500);
  });
});
