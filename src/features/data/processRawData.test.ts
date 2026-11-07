import { describe, expect, test } from "vitest";
import { en } from "../locale/en";
import { processRawData } from "./processRawData";

const SOURCE = { sheetName: "Input", firstRow: 2, describeInvalidAmount: en.alerts.invalidAmount };
const date = new Date("2025-01-10");

describe("processRawData", () => {
  test("Amount text with a thousands separator counts as the same amount as on the archive sheet", () => {
    const result = processRawData([[date, "Cash", "Expense-Food", "Lunch", "", "1,000"]], SOURCE);

    expect(result[0]).toMatchObject({ income: 0, expense: 1000, total: -1000 });
  });

  test.each(["(1,000)", "▲500", "−500", "1e3", "-500", -500])(
    "Amount %s is rejected with an error naming the sheet and the row",
    (amount) => {
      const rows = [
        [date, "Cash", "Expense-Food", "Lunch", "", 800],
        [],
        [date, "Cash", "Expense-Food", "Dinner", "", amount],
      ];

      expect(() => processRawData(rows, SOURCE)).toThrow(en.alerts.invalidAmount("Input", 4));
    },
  );

  test("A negative income amount is rejected instead of being dropped", () => {
    const rows = [[date, "Cash", "Income-Salary", "Refund", -500, ""]];

    expect(() => processRawData(rows, SOURCE)).toThrow(en.alerts.invalidAmount("Input", 2));
  });
});
