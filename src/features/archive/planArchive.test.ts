import { describe, expect, it } from "vitest";
import { startOfDayInZone } from "../date/startOfDayInZone";
import { planArchive } from "./planArchive";

const TOKYO = "Asia/Tokyo";
const THIS_MONTH_START = startOfDayInZone(TOKYO, 2026, 9, 1);

const labels = {
  carryoverCategory: "Income-Carryover",
  describeCarryover: (type: string) => `Carryover (${type})`,
  describeInvalidAmount: (inputRow: number) => `Invalid amount in input row ${inputRow}`,
};

const row = (
  date: Date | string,
  type: string,
  category: string,
  description: string,
  amount: number | string,
): unknown[] => [date, type, category, description, amount];

const BLANK_ROW = ["", "", "", "", ""];
const SEPTEMBER = startOfDayInZone(TOKYO, 2026, 8, 15);
const OCTOBER = startOfDayInZone(TOKYO, 2026, 9, 5);

describe("planArchive", () => {
  describe("splitting rows by month", () => {
    it("archives rows dated before this month and keeps the rest", () => {
      const past = row(SEPTEMBER, "Cash", "Expense-Food", "lunch", -800);
      const current = row(OCTOBER, "Cash", "Expense-Food", "dinner", -1200);

      const plan = planArchive([past, current], THIS_MONTH_START, TOKYO, labels);

      expect(plan.rowsToArchive).toEqual([past]);
      expect(plan.keptRows).toEqual([{ index: 1, row: current }]);
    });

    it("treats the first day of this month as this month", () => {
      const first = row(THIS_MONTH_START, "Cash", "Expense-Food", "", -100);

      const plan = planArchive([first], THIS_MONTH_START, TOKYO, labels);

      expect(plan.keptRows).toEqual([{ index: 0, row: first }]);
      expect(plan.pastRowCount).toBe(0);
    });

    it("keeps a row from the first day of this month in the given zone, even where it is still the previous day in Japan", () => {
      const auckland = "Pacific/Auckland";
      const monthStart = startOfDayInZone(auckland, 2026, 9, 1);
      const first = row(monthStart, "Cash", "Expense-Food", "", -100);

      const plan = planArchive([first], monthStart, auckland, labels);

      expect(plan.keptRows).toEqual([{ index: 0, row: first }]);
      expect(plan.pastRowCount).toBe(0);
    });

    it("archives a row from the last day of the previous month in the given zone", () => {
      const losAngeles = "America/Los_Angeles";
      const monthStart = startOfDayInZone(losAngeles, 2026, 9, 1);
      const lastDay = row(
        startOfDayInZone(losAngeles, 2026, 8, 30),
        "Cash",
        "Expense-Food",
        "",
        -100,
      );

      const plan = planArchive([lastDay], monthStart, losAngeles, labels);

      expect(plan.pastRowCount).toBe(1);
    });

    it("keeps each kept row at the position it had in the input", () => {
      const past = row(SEPTEMBER, "Cash", "Expense-Food", "lunch", -800);
      const current = row(OCTOBER, "Cash", "Expense-Food", "dinner", -1200);

      const plan = planArchive(
        [BLANK_ROW, past, BLANK_ROW, current],
        THIS_MONTH_START,
        TOKYO,
        labels,
      );

      expect(plan.keptRows).toEqual([{ index: 3, row: current }]);
    });

    it("reports the positions of the rows it moves, including rows that are not written to the archive", () => {
      const past = row(SEPTEMBER, "Cash", "Expense-Food", "lunch", -800);
      const zero = row(SEPTEMBER, "Cash", "Expense-Food", "none", 0);
      const current = row(OCTOBER, "Cash", "Expense-Food", "dinner", -1200);

      const plan = planArchive([past, BLANK_ROW, zero, current], THIS_MONTH_START, TOKYO, labels);

      expect(plan.archivedIndexes).toEqual([0, 2]);
    });

    it("drops blank rows from both sides", () => {
      const plan = planArchive([BLANK_ROW], THIS_MONTH_START, TOKYO, labels);

      expect(plan.rowsToArchive).toEqual([]);
      expect(plan.keptRows).toEqual([]);
      expect(plan.carryForwardRows).toEqual([]);
    });

    it("keeps a row that has no usable date and nothing to inherit it from", () => {
      const undated = row("not a date", "Cash", "Expense-Food", "", -100);

      const plan = planArchive([undated], THIS_MONTH_START, TOKYO, labels);

      expect(plan.keptRows).toEqual([{ index: 0, row: undated }]);
      expect(plan.pastRowCount).toBe(0);
    });
  });

  describe("inheriting blank cells from the row above", () => {
    it("fills a missing date from the last valid date", () => {
      const dated = row(SEPTEMBER, "Cash", "Expense-Food", "lunch", -800);
      const undated = row("", "Cash", "Expense-Food", "snack", -200);

      const plan = planArchive([dated, undated], THIS_MONTH_START, TOKYO, labels);

      expect(plan.rowsToArchive[1][0]).toBe(SEPTEMBER);
    });

    it("fills a missing type from the last valid type", () => {
      const typed = row(SEPTEMBER, "Bank", "Expense-Food", "lunch", -800);
      const untyped = row(SEPTEMBER, "", "Expense-Food", "snack", -200);

      const plan = planArchive([typed, untyped], THIS_MONTH_START, TOKYO, labels);

      expect(plan.rowsToArchive[1][1]).toBe("Bank");
    });

    it("moves an undated row together with the past date it inherits", () => {
      const dated = row(SEPTEMBER, "Cash", "Expense-Food", "lunch", -800);
      const undated = row("", "Cash", "Expense-Food", "snack", -200);

      const plan = planArchive([dated, undated], THIS_MONTH_START, TOKYO, labels);

      expect(plan.pastRowCount).toBe(2);
    });

    it("writes an inherited date into a kept row that left it blank", () => {
      const dated = row(OCTOBER, "Cash", "Expense-Food", "dinner", -1200);
      const undated = row("", "", "Expense-Food", "snack", -200);

      const plan = planArchive([dated, undated], THIS_MONTH_START, TOKYO, labels);

      expect(plan.keptRows[1].row.slice(0, 2)).toEqual([OCTOBER, "Cash"]);
    });

    it("does not modify the rows it was given", () => {
      const dated = row(SEPTEMBER, "Cash", "Expense-Food", "lunch", -800);
      const undated = row("", "", "Expense-Food", "snack", -200);

      planArchive([dated, undated], THIS_MONTH_START, TOKYO, labels);

      expect(undated[0]).toBe("");
      expect(undated[1]).toBe("");
    });
  });

  describe("carrying balances forward", () => {
    it("writes one carryover row per type with the balance of its past rows", () => {
      const rows = [
        row(SEPTEMBER, "Cash", "Income-Salary-Base", "", 300000),
        row(SEPTEMBER, "Cash", "Expense-Food", "", -50000),
        row(SEPTEMBER, "Bank", "Income-Salary-Base", "", 100000),
      ];

      const plan = planArchive(rows, THIS_MONTH_START, TOKYO, labels);

      expect(plan.carryForwardRows).toEqual([
        [THIS_MONTH_START, "Cash", "Income-Carryover", "Carryover (Cash)", 250000],
        [THIS_MONTH_START, "Bank", "Income-Carryover", "Carryover (Bank)", 100000],
      ]);
    });

    it("writes a negative balance as one signed carryover amount", () => {
      const rows = [row(SEPTEMBER, "Cash", "Expense-Food", "", -5000)];

      const plan = planArchive(rows, THIS_MONTH_START, TOKYO, labels);

      expect(plan.carryForwardRows).toEqual([
        [THIS_MONTH_START, "Cash", "Income-Carryover", "Carryover (Cash)", -5000],
      ]);
    });

    it("writes zero for a balance of zero", () => {
      const rows = [
        row(SEPTEMBER, "Cash", "Income-Salary-Base", "", 1000),
        row(SEPTEMBER, "Cash", "Expense-Food", "", -1000),
      ];

      const plan = planArchive(rows, THIS_MONTH_START, TOKYO, labels);

      expect(plan.carryForwardRows[0].slice(4)).toEqual([0]);
    });

    it("reads a negative amount as an outflow that reduces the carried balance", () => {
      const rows = [
        row(SEPTEMBER, "Cash", "Income-Salary-Base", "", "1,000"),
        row(SEPTEMBER, "Cash", "Expense-Food", "", "-1,500"),
      ];

      const plan = planArchive(rows, THIS_MONTH_START, TOKYO, labels);

      expect(plan.carryForwardRows).toEqual([
        [THIS_MONTH_START, "Cash", "Income-Carryover", "Carryover (Cash)", -500],
      ]);
    });

    it("counts earlier carryover rows in the balance", () => {
      const rows = [
        row(SEPTEMBER, "Cash", "Income-Carryover", "", 70000),
        row(SEPTEMBER, "Cash", "Expense-Food", "", -20000),
      ];

      const plan = planArchive(rows, THIS_MONTH_START, TOKYO, labels);

      expect(plan.carryForwardRows[0].slice(4)).toEqual([50000]);
    });

    it("orders carryover rows by the first appearance of each type", () => {
      const rows = [
        row(SEPTEMBER, "Bank", "Income-Salary-Base", "", 1),
        row(SEPTEMBER, "Cash", "Income-Salary-Base", "", 1),
        row(SEPTEMBER, "Bank", "Income-Salary-Base", "", 1),
      ];

      const plan = planArchive(rows, THIS_MONTH_START, TOKYO, labels);

      expect(plan.carryForwardRows.map((carryover) => carryover[1])).toEqual(["Bank", "Cash"]);
    });

    it("also writes a zero carryover row for a type that only appears this month", () => {
      const rows = [
        row(SEPTEMBER, "Cash", "Income-Salary-Base", "", 1000),
        row(OCTOBER, "Bank", "Income-Salary-Base", "", 2000),
      ];

      const plan = planArchive(rows, THIS_MONTH_START, TOKYO, labels);

      expect(plan.carryForwardRows[1]).toEqual([
        THIS_MONTH_START,
        "Bank",
        "Income-Carryover",
        "Carryover (Bank)",
        0,
      ]);
    });

    it("rejects amounts that are not numbers instead of ignoring them", () => {
      const rows = [
        row(SEPTEMBER, "Cash", "Income-Salary-Base", "", "n/a"),
        row(SEPTEMBER, "Cash", "Expense-Food", "", -300),
      ];

      expect(() => planArchive(rows, THIS_MONTH_START, TOKYO, labels)).toThrow(
        labels.describeInvalidAmount(2),
      );
    });
  });

  describe("what reaches the archive", () => {
    it("leaves zero-amount rows out of the archive but still counts them as past rows", () => {
      const rows = [row(SEPTEMBER, "Cash", "Expense-Food", "free sample", 0)];

      const plan = planArchive(rows, THIS_MONTH_START, TOKYO, labels);

      expect(plan.pastRowCount).toBe(1);
      expect(plan.rowsToArchive).toEqual([]);
    });

    it("zeroes an old carryover row, which the zero-amount filter then drops", () => {
      const rows = [
        row(SEPTEMBER, "Cash", "Income-Carryover", "", 70000),
        row(SEPTEMBER, "Cash", "Expense-Food", "", -20000),
      ];

      const plan = planArchive(rows, THIS_MONTH_START, TOKYO, labels);

      expect(plan.pastRowCount).toBe(2);
      expect(plan.rowsToArchive).toEqual([rows[1]]);
    });
  });
  describe("amounts read by the shared rule", () => {
    it("reads amount text with a thousands separator into the carried balance", () => {
      const past = row(SEPTEMBER, "Cash", "Income-Salary", "", "1,000");

      const plan = planArchive([past], THIS_MONTH_START, TOKYO, labels);

      expect(plan.carryForwardRows[0].slice(4)).toEqual([1000]);
    });

    it.each(["(1,000)", "▲500", "−500", "1e3", "abc"])(
      "rejects an archived row with amount %s and names its input row",
      (amount) => {
        const rows = [
          row(SEPTEMBER, "Cash", "Expense-Food", "lunch", -800),
          BLANK_ROW,
          row(SEPTEMBER, "Cash", "Expense-Food", "dinner", amount),
        ];

        expect(() => planArchive(rows, THIS_MONTH_START, TOKYO, labels)).toThrow(
          labels.describeInvalidAmount(4),
        );
      },
    );

    it("rejects an invalid amount in an archived row that has no account type", () => {
      const rows = [row(SEPTEMBER, "", "Expense-Food", "lunch", "▲500")];

      expect(() => planArchive(rows, THIS_MONTH_START, TOKYO, labels)).toThrow(
        labels.describeInvalidAmount(2),
      );
    });
  });
});
