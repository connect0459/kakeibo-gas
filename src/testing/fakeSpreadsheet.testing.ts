import { vi } from "vitest";

export type RangeState = {
  value?: unknown;
  fontWeight?: string;
  fontSize?: number;
  fontStyle?: string;
  background?: string;
  numberFormat?: string;
  horizontalAlignment?: string;
  merged?: boolean;
  validation?: FakeValidation;
};

export type FakeValidation = {
  values: readonly string[];
  showDropdown: boolean;
};

const columnLetter = (column: number): string => {
  let letters = "";
  for (let rest = column; rest > 0; rest = Math.floor((rest - 1) / 26)) {
    letters = String.fromCharCode(65 + ((rest - 1) % 26)) + letters;
  }
  return letters;
};

export class FakeSheet {
  readonly name: string;
  readonly ranges = new Map<string, RangeState>();
  readonly resizedColumns: number[] = [];

  constructor(name: string) {
    this.name = name;
  }

  state(a1: string): RangeState {
    return this.ranges.get(a1) ?? {};
  }

  getRange(rowOrA1: string | number, column?: number): GoogleAppsScript.Spreadsheet.Range {
    const a1 = typeof rowOrA1 === "string" ? rowOrA1 : `${columnLetter(column ?? 1)}${rowOrA1}`;
    const state: RangeState = this.ranges.get(a1) ?? {};
    this.ranges.set(a1, state);
    const range: Record<string, unknown> = {};
    const record =
      <K extends keyof RangeState>(key: K) =>
      (value: RangeState[K]) => {
        state[key] = value;
        return range;
      };
    range.setValue = record("value");
    range.setFontWeight = record("fontWeight");
    range.setFontSize = record("fontSize");
    range.setFontStyle = record("fontStyle");
    range.setBackground = record("background");
    range.setNumberFormat = record("numberFormat");
    range.setHorizontalAlignment = record("horizontalAlignment");
    range.setDataValidation = (validation: FakeValidation) => {
      state.validation = validation;
      return range;
    };
    range.merge = () => {
      state.merged = true;
      return range;
    };
    return range as unknown as GoogleAppsScript.Spreadsheet.Range;
  }

  autoResizeColumn(column: number): void {
    this.resizedColumns.push(column);
  }
}

export class FakeSpreadsheet {
  readonly sheets = new Map<string, FakeSheet>();

  withSheet(name: string): FakeSheet {
    const sheet = new FakeSheet(name);
    this.sheets.set(name, sheet);
    return sheet;
  }

  getSheetByName(name: string): FakeSheet | null {
    return this.sheets.get(name) ?? null;
  }

  insertSheet(name: string): FakeSheet {
    return this.withSheet(name);
  }

  asSpreadsheet(): GoogleAppsScript.Spreadsheet.Spreadsheet {
    return this as unknown as GoogleAppsScript.Spreadsheet.Spreadsheet;
  }
}

export const asSheet = (sheet: FakeSheet): GoogleAppsScript.Spreadsheet.Sheet =>
  sheet as unknown as GoogleAppsScript.Spreadsheet.Sheet;

export const stubDataValidation = (): void => {
  vi.stubGlobal("SpreadsheetApp", {
    newDataValidation: () => {
      let values: readonly string[] = [];
      let showDropdown = false;
      const builder = {
        requireValueInList: (list: readonly string[], dropdown: boolean) => {
          values = list;
          showDropdown = dropdown;
          return builder;
        },
        build: (): FakeValidation => ({ values, showDropdown }),
      };
      return builder;
    },
  });
};
