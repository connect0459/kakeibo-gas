import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { en } from "../../src/features/locale/en";

type Gas = typeof globalThis & Record<string, unknown>;

const SHEET_NAMES = Object.values(en.sheets);

const buildResultSheet = (startDate: unknown, endDate: unknown) => {
  const cells: Record<string, unknown> = { B2: startDate, D2: endDate, A1: "Existing title" };
  const range = (address: string) => ({
    getValue: () => cells[address],
    setValue: vi.fn((value: unknown) => {
      cells[address] = value;
      return range(address);
    }),
    setFontSize: vi.fn().mockReturnThis(),
    setFontWeight: vi.fn().mockReturnThis(),
    clear: vi.fn(),
  });
  return {
    getRange: vi.fn((address: string) => range(address)),
    getDataRange: vi.fn(),
    getCharts: vi.fn(() => []),
    cells,
  };
};

const installGasGlobals = (resultSheet: ReturnType<typeof buildResultSheet>) => {
  const ui = {
    alert: vi.fn(),
    ButtonSet: { OK: "OK" },
  };
  const lock = { tryLock: vi.fn(() => true), releaseLock: vi.fn() };
  const cache = { get: vi.fn(() => null), put: vi.fn() };
  const spreadsheet = {
    getSheets: () => SHEET_NAMES.map((name) => ({ getName: () => name })),
    getSpreadsheetLocale: () => "en_US",
    getSpreadsheetTimeZone: () => "Asia/Tokyo",
    getSheetByName: vi.fn((name: string) => {
      if (name === en.sheets.result) return resultSheet;
      if (name === en.sheets.input) return { getLastRow: () => 1 };
      return null;
    }),
  };
  const gas = globalThis as Gas;
  gas.SpreadsheetApp = {
    getActiveSpreadsheet: () => spreadsheet,
    getUi: () => ui,
  };
  gas.LockService = { getScriptLock: () => lock };
  gas.CacheService = { getScriptCache: () => cache };
  return { ui, cache, spreadsheet };
};

describe("an aggregation period on the result sheet", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    const gas = globalThis as Gas;
    delete gas.SpreadsheetApp;
    delete gas.LockService;
    delete gas.CacheService;
  });

  const runTrigger = async (startDate: unknown, endDate: unknown) => {
    const resultSheet = buildResultSheet(startDate, endDate);
    const gasEnvironment = installGasGlobals(resultSheet);
    await import("../../src/main");
    (globalThis as Gas & { generateStatistics: () => void }).generateStatistics();
    return { resultSheet, ...gasEnvironment };
  };

  const runReversed = () =>
    runTrigger(new Date("2025-12-31T00:00:00+09:00"), new Date("2025-01-01T00:00:00+09:00"));

  describe("whose start is after its end", () => {
    it("tells the user the period is invalid", async () => {
      const { ui } = await runReversed();

      expect(ui.alert).toHaveBeenCalledTimes(1);
      expect(ui.alert).toHaveBeenCalledWith(en.alerts.errorTitle, en.alerts.invalidPeriod, "OK");
    });

    it("leaves the previous result untouched", async () => {
      const { resultSheet, spreadsheet } = await runReversed();

      expect(spreadsheet.getSheetByName).not.toHaveBeenCalledWith(en.sheets.input);
      expect(resultSheet.getDataRange).not.toHaveBeenCalled();
      expect(resultSheet.getCharts).not.toHaveBeenCalled();
      expect(resultSheet.cells.A1).toBe("Existing title");
    });

    it("does not record the run for throttling", async () => {
      const { cache } = await runReversed();

      expect(cache.put).not.toHaveBeenCalled();
    });
  });

  describe("that only becomes reversed once a missing date is filled in", () => {
    const runFilledIn = () => runTrigger("", new Date("2020-01-31T00:00:00+09:00"));

    it("is rejected without writing the filled-in date into the cell", async () => {
      const { ui, resultSheet } = await runFilledIn();

      expect(ui.alert).toHaveBeenCalledWith(en.alerts.errorTitle, en.alerts.invalidPeriod, "OK");
      expect(resultSheet.cells.B2).toBe("");
    });
  });

  describe("whose start is before its end", () => {
    it("proceeds to aggregate without an invalid-period alert", async () => {
      const { ui, spreadsheet } = await runTrigger(
        new Date("2025-01-01T00:00:00+09:00"),
        new Date("2025-12-31T00:00:00+09:00"),
      );

      expect(spreadsheet.getSheetByName).toHaveBeenCalledWith(en.sheets.input);
      expect(ui.alert).not.toHaveBeenCalledWith(
        en.alerts.errorTitle,
        en.alerts.invalidPeriod,
        "OK",
      );
    });
  });
});
