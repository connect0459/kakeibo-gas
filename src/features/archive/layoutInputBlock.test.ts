import { describe, expect, it } from "vitest";
import { layoutInputBlock } from "./layoutInputBlock";

const BLANK = ["", "", "", "", "", ""];
const NO_FORMULAS = (count: number): string[][] =>
  Array.from({ length: count }, () => ["", "", "", "", "", ""]);

const kept = (index: number, row: unknown[]) => ({ index, row });

describe("layoutInputBlock", () => {
  it("leaves a kept row at the position it had in the input", () => {
    const row = ["d", "Cash", "Food", "dinner", "", 1200];

    const block = layoutInputBlock({
      keptRows: [kept(2, row)],
      carryForwardRows: [],
      formulas: NO_FORMULAS(3),
    });

    expect(block).toEqual([BLANK, BLANK, row]);
  });

  it("writes back a formula instead of its computed value", () => {
    const row = ["d", "Cash", "Food", "dinner", 500, 50];
    const formulas = [["", "", "", "", "", "=E2*0.1"]];

    const block = layoutInputBlock({
      keptRows: [kept(0, row)],
      carryForwardRows: [],
      formulas,
    });

    expect(block[0]).toEqual(["d", "Cash", "Food", "dinner", 500, "=E2*0.1"]);
  });

  it("keeps a value that fills a blank cell inherited from the row above", () => {
    const filled = ["d", "Cash", "Food", "snack", "", 200];

    const block = layoutInputBlock({
      keptRows: [kept(0, filled)],
      carryForwardRows: [],
      formulas: NO_FORMULAS(1),
    });

    expect(block[0][0]).toBe("d");
  });

  it("places carry-forward rows in the vacated positions, earliest first", () => {
    const current = ["d", "Cash", "Food", "dinner", "", 1200];
    const carryA = ["m", "Cash", "Carry", "carry A", 10, 0];
    const carryB = ["m", "Bank", "Carry", "carry B", 20, 0];

    const block = layoutInputBlock({
      keptRows: [kept(2, current)],
      carryForwardRows: [carryA, carryB],
      formulas: NO_FORMULAS(3),
    });

    expect(block).toEqual([carryA, carryB, current]);
  });

  it("appends carry-forward rows after the block when there are more than vacated positions", () => {
    const current = ["d", "Cash", "Food", "dinner", "", 1200];
    const carryA = ["m", "Cash", "Carry", "carry A", 10, 0];
    const carryB = ["m", "Bank", "Carry", "carry B", 20, 0];

    const block = layoutInputBlock({
      keptRows: [kept(0, current)],
      carryForwardRows: [carryA, carryB],
      formulas: NO_FORMULAS(1),
    });

    expect(block).toEqual([current, carryA, carryB]);
  });
});
