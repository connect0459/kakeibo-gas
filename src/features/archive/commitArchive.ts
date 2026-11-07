import { STATIC_CONFIG } from "../../config";
import { layoutInputBlock } from "./layoutInputBlock";
import type { ArchivePlan } from "./planArchive";

const COLUMN_COUNT = STATIC_CONFIG.TRANSACTION_COLUMN_COUNT;

const lastUsedRow = (sheet: GoogleAppsScript.Spreadsheet.Sheet): number => {
  const column = sheet.getRange(1, 1, sheet.getMaxRows(), 1).getValues();
  let last = 1;
  column.forEach(([value], index) => {
    if (value !== "") {
      last = index + 1;
    }
  });
  return last;
};

export const commitArchive = (params: {
  inputSheet: GoogleAppsScript.Spreadsheet.Sheet;
  archiveSheet: GoogleAppsScript.Spreadsheet.Sheet;
  values: readonly (readonly unknown[])[];
  formulas: readonly (readonly string[])[];
  plan: ArchivePlan;
}): void => {
  const { inputSheet, archiveSheet, values, formulas, plan } = params;
  const appended = plan.rowsToArchive.length;
  const insertRow = lastUsedRow(archiveSheet) + 1;

  const block = layoutInputBlock({
    keptRows: plan.keptRows,
    archivedIndexes: plan.archivedIndexes,
    carryForwardRows: plan.carryForwardRows,
    values,
    formulas,
  });

  archiveSheet.getRange(insertRow, 1, appended, COLUMN_COUNT).setValues(plan.rowsToArchive);

  try {
    inputSheet.getRange(2, 1, block.length, COLUMN_COUNT).setValues(block);
  } catch (error) {
    try {
      archiveSheet.getRange(insertRow, 1, appended, COLUMN_COUNT).clearContent();
    } catch (rollbackError) {
      console.error("Failed to remove the rows appended to the archive sheet:", rollbackError);
    }
    throw error;
  }
};
