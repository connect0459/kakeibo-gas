import { describe, expect, it } from "vitest";
import { layoutInputBlock } from "./layoutInputBlock";

const BLANK = ["", "", "", "", "", ""];
const NO_FORMULAS = (count: number): string[][] =>
  Array.from({ length: count }, () => [...BLANK] as string[]);
const withFormulaInF = (count: number, formula: string): string[][] =>
  Array.from({ length: count }, () => ["", "", "", "", "", formula]);

const NO_VALUES = (count: number): unknown[][] => Array.from({ length: count }, () => [...BLANK]);

const kept = (index: number, row: unknown[]) => ({ index, row });

describe("layoutInputBlock", () => {
  it("leaves a kept row at the position it had in the input", () => {
    const row = ["d", "Cash", "Food", "dinner", "", 1200];

    const block = layoutInputBlock({
      keptRows: [kept(2, row)],
      archivedIndexes: [],
      carryForwardRows: [],
      values: NO_VALUES(3),
      formulas: NO_FORMULAS(3),
    });

    expect(block).toEqual([BLANK, BLANK, row]);
  });

  it("writes back a formula instead of its computed value on a kept row", () => {
    const row = ["d", "Cash", "Food", "dinner", 500, 50];

    const block = layoutInputBlock({
      keptRows: [kept(0, row)],
      archivedIndexes: [],
      carryForwardRows: [],
      values: NO_VALUES(1),
      formulas: [["", "", "", "", "", "=E2*0.1"]],
    });

    expect(block[0]).toEqual(["d", "Cash", "Food", "dinner", 500, "=E2*0.1"]);
  });

  it("keeps the formulas of rows that are blank and not archived", () => {
    const block = layoutInputBlock({
      keptRows: [],
      archivedIndexes: [],
      carryForwardRows: [],
      values: NO_VALUES(2),
      formulas: withFormulaInF(2, "=E2*0.1"),
    });

    expect(block).toEqual([
      ["", "", "", "", "", "=E2*0.1"],
      ["", "", "", "", "", "=E2*0.1"],
    ]);
  });

  it("keeps the formulas of archived rows that no carryover row takes over", () => {
    const block = layoutInputBlock({
      keptRows: [],
      archivedIndexes: [0],
      carryForwardRows: [],
      values: NO_VALUES(1),
      formulas: withFormulaInF(1, "=E2*0.1"),
    });

    expect(block).toEqual([["", "", "", "", "", "=E2*0.1"]]);
  });

  it("places carryover rows in archived positions, earliest first, replacing their formulas", () => {
    const current = ["d", "Cash", "Food", "dinner", "", 1200];
    const carryA = ["m", "Cash", "Carry", "carry A", 10, 0];
    const carryB = ["m", "Bank", "Carry", "carry B", 20, 0];

    const block = layoutInputBlock({
      keptRows: [kept(2, current)],
      archivedIndexes: [0, 1],
      carryForwardRows: [carryA, carryB],
      values: NO_VALUES(3),
      formulas: withFormulaInF(3, "=E2*0.1"),
    });

    expect(block.slice(0, 2)).toEqual([carryA, carryB]);
  });

  it("does not place carryover rows over a blank row that was not archived", () => {
    const carry = ["m", "Cash", "Carry", "carry", 10, 0];

    const block = layoutInputBlock({
      keptRows: [],
      archivedIndexes: [],
      carryForwardRows: [carry],
      values: NO_VALUES(2),
      formulas: NO_FORMULAS(2),
    });

    expect(block).toEqual([BLANK, BLANK, carry]);
  });

  it("appends carryover rows after the block when archived positions run out", () => {
    const current = ["d", "Cash", "Food", "dinner", "", 1200];
    const carryA = ["m", "Cash", "Carry", "carry A", 10, 0];
    const carryB = ["m", "Bank", "Carry", "carry B", 20, 0];

    const block = layoutInputBlock({
      keptRows: [kept(0, current)],
      archivedIndexes: [1],
      carryForwardRows: [carryA, carryB],
      values: NO_VALUES(2),
      formulas: NO_FORMULAS(2),
    });

    expect(block).toEqual([current, carryA, carryB]);
  });

  it("keeps the values of a row that is neither kept nor archived", () => {
    const stray = ["", "", "", "note", 0, ""];

    const block = layoutInputBlock({
      keptRows: [],
      archivedIndexes: [],
      carryForwardRows: [],
      values: [stray],
      formulas: NO_FORMULAS(1),
    });

    expect(block).toEqual([stray]);
  });

  it("clears the values of an archived row", () => {
    const block = layoutInputBlock({
      keptRows: [],
      archivedIndexes: [0],
      carryForwardRows: [],
      values: [["2026-08-15", "Cash", "Food", "lunch", "", 800]],
      formulas: NO_FORMULAS(1),
    });

    expect(block).toEqual([BLANK]);
  });
});
