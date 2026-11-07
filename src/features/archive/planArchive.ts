import { parseAmount } from "../amount/parseAmount";
import { formatDateToString } from "../date/formatDateToString";
import { filterZeroRecords } from "./filterZeroRecords";

export type ArchiveLabels = {
  carryoverCategory: string;
  describeCarryover: (type: string) => string;
  describeInvalidAmount: (inputRow: number) => string;
};

export type KeptRow = {
  index: number;
  row: unknown[];
};

export type ArchivePlan = {
  pastRowCount: number;
  rowsToArchive: unknown[][];
  keptRows: KeptRow[];
  archivedIndexes: number[];
  carryForwardRows: unknown[][];
};

const COLUMN = {
  DATE: 0,
  TYPE: 1,
  CATEGORY: 2,
  INCOME: 4,
  EXPENSE: 5,
} as const;

const FIRST_INPUT_ROW = 2;

const isBlankRow = (row: readonly unknown[]): boolean =>
  !row[0] && !row[1] && !row[2] && !row[3] && !row[4] && !row[5];

const isValidDate = (value: unknown): value is Date =>
  value instanceof Date && !Number.isNaN(value.getTime());

const inheritDateAndType = (inputRows: readonly unknown[][]): KeptRow[] => {
  let lastValidDate: Date | null = null;
  let lastValidType: unknown = null;
  const rows: KeptRow[] = [];

  for (const [index, original] of inputRows.entries()) {
    if (isBlankRow(original)) {
      continue;
    }

    const row = [...original];

    if (isValidDate(row[COLUMN.DATE])) {
      lastValidDate = row[COLUMN.DATE] as Date;
    } else if (lastValidDate) {
      row[COLUMN.DATE] = lastValidDate;
    }

    const type = row[COLUMN.TYPE];
    if (type && typeof type === "string" && type.trim() !== "") {
      lastValidType = type;
    } else if (lastValidType) {
      row[COLUMN.TYPE] = lastValidType;
    }

    rows.push({ index, row });
  }

  return rows;
};

export const planArchive = (
  inputRows: readonly unknown[][],
  thisMonthStart: Date,
  timeZone: string,
  labels: ArchiveLabels,
): ArchivePlan => {
  const thisMonthStartText = formatDateToString(thisMonthStart, timeZone);
  const balanceByType = new Map<string, number>();
  const rowsToMove: unknown[][] = [];
  const archivedIndexes: number[] = [];
  const keptRows: KeptRow[] = [];

  for (const { index, row } of inheritDateAndType(inputRows)) {
    const date = row[COLUMN.DATE];
    if (!isValidDate(date)) {
      keptRows.push({ index, row });
      continue;
    }

    const type = (row[COLUMN.TYPE] || "") as string;
    if (type && !balanceByType.has(type)) {
      balanceByType.set(type, 0);
    }

    if (formatDateToString(date, timeZone) >= thisMonthStartText) {
      keptRows.push({ index, row });
      continue;
    }

    archivedIndexes.push(index);

    const income = parseAmount(row[COLUMN.INCOME]);
    const expense = parseAmount(row[COLUMN.EXPENSE]);
    if (income === null || expense === null) {
      throw new Error(labels.describeInvalidAmount(index + FIRST_INPUT_ROW));
    }

    if (type) {
      balanceByType.set(type, (balanceByType.get(type) as number) + income - expense);
    }

    if (row[COLUMN.CATEGORY] === labels.carryoverCategory) {
      const zeroed = [...row];
      zeroed[COLUMN.INCOME] = 0;
      zeroed[COLUMN.EXPENSE] = 0;
      rowsToMove.push(zeroed);
    } else {
      rowsToMove.push([...row]);
    }
  }

  const carryForwardRows = [...balanceByType].map(([type, balance]) => [
    thisMonthStart,
    type,
    labels.carryoverCategory,
    labels.describeCarryover(type),
    balance > 0 ? balance : 0,
    balance < 0 ? Math.abs(balance) : 0,
  ]);

  return {
    pastRowCount: rowsToMove.length,
    rowsToArchive: filterZeroRecords(rowsToMove),
    keptRows,
    archivedIndexes,
    carryForwardRows,
  };
};
