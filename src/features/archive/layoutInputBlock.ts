import type { KeptRow } from "./planArchive";

const COLUMN_COUNT = 6;

const blankRow = (): unknown[] => new Array(COLUMN_COUNT).fill("");

const withFormulas = (row: readonly unknown[], formulas: readonly string[]): unknown[] =>
  row.map((value, column) => (formulas[column] ? formulas[column] : value));

export const layoutInputBlock = (params: {
  keptRows: readonly KeptRow[];
  carryForwardRows: readonly unknown[][];
  formulas: readonly (readonly string[])[];
}): unknown[][] => {
  const { keptRows, carryForwardRows, formulas } = params;
  const block: unknown[][] = formulas.map(blankRow);
  const occupied = new Set<number>();

  for (const { index, row } of keptRows) {
    block[index] = withFormulas(row, formulas[index] ?? []);
    occupied.add(index);
  }

  const vacated = block.map((_, index) => index).filter((index) => !occupied.has(index));
  const pending = [...carryForwardRows];

  for (const index of vacated) {
    const carry = pending.shift();
    if (!carry) {
      break;
    }
    block[index] = [...carry];
  }

  return [...block, ...pending.map((carry) => [...carry])];
};
