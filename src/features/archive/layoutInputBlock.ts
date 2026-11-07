import { STATIC_CONFIG } from "../../config";
import type { KeptRow } from "./planArchive";

const withFormulas = (row: readonly unknown[], formulas: readonly string[]): unknown[] =>
  row.map((value, column) => (formulas[column] ? formulas[column] : value));

const formulasOnly = (formulas: readonly string[]): unknown[] =>
  Array.from(
    { length: STATIC_CONFIG.TRANSACTION_COLUMN_COUNT },
    (_, column) => formulas[column] ?? "",
  );

export const layoutInputBlock = (params: {
  keptRows: readonly KeptRow[];
  archivedIndexes: readonly number[];
  carryForwardRows: readonly unknown[][];
  formulas: readonly (readonly string[])[];
}): unknown[][] => {
  const { keptRows, archivedIndexes, carryForwardRows, formulas } = params;
  const block = formulas.map(formulasOnly);

  for (const { index, row } of keptRows) {
    block[index] = withFormulas(row, formulas[index]);
  }

  const pending = [...carryForwardRows];
  for (const index of [...archivedIndexes].sort((a, b) => a - b)) {
    const carry = pending.shift();
    if (!carry) {
      break;
    }
    block[index] = [...carry];
  }

  return [...block, ...pending.map((carry) => [...carry])];
};
