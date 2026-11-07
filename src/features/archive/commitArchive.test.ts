import { describe, expect, it, vi } from "vitest";
import { commitArchive } from "./commitArchive";

type Grid = unknown[][];

const BLANK = ["", "", "", "", "", ""];
const HEADER = ["h", "", "", "", "", ""];
const past = ["2026-08-15", "Cash", "Food", "lunch", "", 800];
const current = ["2026-09-05", "Cash", "Food", "dinner", "", 1200];
const carry = ["2026-09-01", "Cash", "Carry", "carry", 0, 0];

class FakeGrid {
  rows: Grid;
  failOnSetValues = false;
  failOnClearContent = false;

  constructor(rows: Grid) {
    this.rows = rows.map((row) => [...row]);
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
          values.forEach((value, i) => {
            this.rows[row - 1 + i] = [...value];
          });
        },
        clearContent: () => {
          if (this.failOnClearContent) {
            throw new Error("clear failed");
          }
          for (let i = 0; i < numRows; i++) {
            this.rows[row - 1 + i] = new Array(numColumns).fill("");
          }
        },
      }),
    } as unknown as GoogleAppsScript.Spreadsheet.Sheet;
  }
}

const plan = {
  pastRowCount: 1,
  rowsToArchive: [past],
  keptRows: [{ index: 1, row: current }],
  archivedIndexes: [0],
  carryForwardRows: [carry],
};
const values = [past, current];
const formulas = [
  ["", "", "", "", "", ""],
  ["", "", "", "", "", "=E3*0.1"],
];

describe("commitArchive", () => {
  it("appends archived rows to the archive and rewrites the input in place with its formulas", () => {
    const input = new FakeGrid([HEADER, past, current]);
    const archive = new FakeGrid([HEADER, BLANK, BLANK]);

    commitArchive({
      inputSheet: input.sheet(),
      archiveSheet: archive.sheet(),
      values,
      formulas,
      plan,
    });

    expect(archive.rows[1]).toEqual(past);
    expect(input.rows.slice(1)).toEqual([
      carry,
      ["2026-09-05", "Cash", "Food", "dinner", "", "=E3*0.1"],
    ]);
  });

  it("leaves both sheets as they were when writing the input fails", () => {
    const input = new FakeGrid([HEADER, past, current]);
    const archive = new FakeGrid([HEADER, BLANK, BLANK]);
    input.failOnSetValues = true;
    const inputBefore = input.rows.map((row) => [...row]);
    const archiveBefore = archive.rows.map((row) => [...row]);

    expect(() =>
      commitArchive({
        inputSheet: input.sheet(),
        archiveSheet: archive.sheet(),
        values,
        formulas,
        plan,
      }),
    ).toThrow("quota exceeded");

    expect(input.rows).toEqual(inputBefore);
    expect(archive.rows).toEqual(archiveBefore);
  });

  it("reports the original failure when removing the appended archive rows also fails", () => {
    const input = new FakeGrid([HEADER, past, current]);
    const archive = new FakeGrid([HEADER, BLANK, BLANK]);
    input.failOnSetValues = true;
    archive.failOnClearContent = true;
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() =>
      commitArchive({
        inputSheet: input.sheet(),
        archiveSheet: archive.sheet(),
        values,
        formulas,
        plan,
      }),
    ).toThrow("quota exceeded");
    expect(log).toHaveBeenCalled();

    log.mockRestore();
  });
});
