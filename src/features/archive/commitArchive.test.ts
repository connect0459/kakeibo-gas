import { describe, expect, it } from "vitest";
import { commitArchive } from "./commitArchive";

type Grid = unknown[][];

class FakeGrid {
  rows: Grid;
  failOnSetValues = false;
  constructor(rows: Grid) {
    this.rows = rows.map((r) => [...r]);
  }
  sheet(): GoogleAppsScript.Spreadsheet.Sheet {
    return {
      getMaxRows: () => this.rows.length,
      getRange: (row: number, column: number, numRows: number, numColumns: number) => ({
        getValues: () =>
          this.rows
            .slice(row - 1, row - 1 + numRows)
            .map((r) => r.slice(column - 1, column - 1 + numColumns)),
        setValues: (values: Grid) => {
          if (this.failOnSetValues) {
            throw new Error("quota exceeded");
          }
          values.forEach((v, i) => {
            this.rows[row - 1 + i] = [...v];
          });
        },
        clearContent: () => {
          for (let i = 0; i < numRows; i++) {
            this.rows[row - 1 + i] = new Array(numColumns).fill("");
          }
        },
      }),
    } as unknown as GoogleAppsScript.Spreadsheet.Sheet;
  }
}

const BLANK = ["", "", "", "", "", ""];
const past = ["2026-08-15", "Cash", "Food", "lunch", "", 800];
const current = ["2026-09-05", "Cash", "Food", "dinner", "", 1200];
const carry = ["2026-09-01", "Cash", "Carry", "carry", 0, 0];

describe("commitArchive", () => {
  it("leaves the input rows untouched when writing them fails after the archive append", () => {
    const input = new FakeGrid([["h", "", "", "", "", ""], past, current, BLANK]);
    const archive = new FakeGrid([["h", "", "", "", "", ""], BLANK, BLANK]);
    const before = input.rows.map((r) => [...r]);
    const inputSheet = input.sheet();
    const failing = {
      ...inputSheet,
      getRange: (...args: [number, number, number, number]) => {
        const range = inputSheet.getRange(...args) as unknown as Record<string, unknown>;
        return {
          ...range,
          setValues: () => {
            throw new Error("quota exceeded");
          },
        };
      },
    } as unknown as GoogleAppsScript.Spreadsheet.Sheet;

    expect(() =>
      commitArchive({
        inputSheet: failing,
        archiveSheet: archive.sheet(),
        formulas: [
          ["", "", "", "", "", ""],
          ["", "", "", "", "", ""],
          ["", "", "", "", "", ""],
        ],
        plan: {
          pastRowCount: 1,
          rowsToArchive: [past],
          keptRows: [{ index: 1, row: current }],
          carryForwardRows: [carry],
        },
      }),
    ).toThrow("quota exceeded");

    expect(input.rows).toEqual(before);
  });

  it("removes the rows it appended to the archive when the input write fails", () => {
    const input = new FakeGrid([["h", "", "", "", "", ""], past, current]);
    const archive = new FakeGrid([["h", "", "", "", "", ""], BLANK, BLANK]);
    const inputSheet = input.sheet();
    const failing = {
      ...inputSheet,
      getRange: (...args: [number, number, number, number]) => {
        const range = inputSheet.getRange(...args) as unknown as Record<string, unknown>;
        return {
          ...range,
          setValues: () => {
            throw new Error("quota exceeded");
          },
        };
      },
    } as unknown as GoogleAppsScript.Spreadsheet.Sheet;

    expect(() =>
      commitArchive({
        inputSheet: failing,
        archiveSheet: archive.sheet(),
        formulas: [
          ["", "", "", "", "", ""],
          ["", "", "", "", "", ""],
        ],
        plan: {
          pastRowCount: 1,
          rowsToArchive: [past],
          keptRows: [{ index: 1, row: current }],
          carryForwardRows: [carry],
        },
      }),
    ).toThrow("quota exceeded");

    expect(archive.rows).toEqual([["h", "", "", "", "", ""], BLANK, BLANK]);
  });

  it("appends archived rows after the last used row of the archive and rewrites the input in place", () => {
    const input = new FakeGrid([["h", "", "", "", "", ""], past, current]);
    const archive = new FakeGrid([["h", "", "", "", "", ""], BLANK, BLANK]);

    commitArchive({
      inputSheet: input.sheet(),
      archiveSheet: archive.sheet(),
      formulas: [
        ["", "", "", "", "", ""],
        ["", "", "", "", "", "=E3*0.1"],
      ],
      plan: {
        pastRowCount: 1,
        rowsToArchive: [past],
        keptRows: [{ index: 1, row: current }],
        carryForwardRows: [carry],
      },
    });

    expect(archive.rows[1]).toEqual(past);
    expect(input.rows.slice(1)).toEqual([
      carry,
      ["2026-09-05", "Cash", "Food", "dinner", "", "=E3*0.1"],
    ]);
  });
});
