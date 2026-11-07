import { STATIC_CONFIG } from "../../config";
import type { KeptRow } from "./planArchive";

const withFormulas = (row: readonly unknown[], formulas: readonly string[]): unknown[] =>
  row.map((value, column) => (formulas[column] ? formulas[column] : value));

const cellsOf = (values: readonly unknown[], formulas: readonly string[]): unknown[] =>
  Array.from({ length: STATIC_CONFIG.TRANSACTION_COLUMN_COUNT }, (_, column) =>
    formulas[column] ? formulas[column] : (values[column] ?? ""),
  );

const formulasOnly = (formulas: readonly string[]): unknown[] => cellsOf([], formulas);

export const layoutInputBlock = (params: {
  keptRows: readonly KeptRow[];
  archivedIndexes: readonly number[];
  carryForwardRows: readonly unknown[][];
  values: readonly (readonly unknown[])[];
  formulas: readonly (readonly string[])[];
}): unknown[][] => {
  const { keptRows, archivedIndexes, carryForwardRows, values, formulas } = params;
  const archived = new Set(archivedIndexes);
  const block = formulas.map((rowFormulas, index) =>
    archived.has(index) ? formulasOnly(rowFormulas) : cellsOf(values[index] ?? [], rowFormulas),
  );

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
