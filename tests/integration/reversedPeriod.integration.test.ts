import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { en } from "../../src/features/locale/en";

type Gas = typeof globalThis & Record<string, unknown>;

const SHEET_NAMES = Object.values(en.sheets);

const buildResultSheet = (startDate: Date, endDate: Date) => {
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

describe("an aggregation period whose start is after its end", () => {
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

  const runTrigger = async () => {
    const reversed = buildResultSheet(
      new Date("2025-12-31T00:00:00+09:00"),
      new Date("2025-01-01T00:00:00+09:00"),
    );
    const gasEnvironment = installGasGlobals(reversed);
    await import("../../src/main");
    (globalThis as Gas & { generateStatistics: () => void }).generateStatistics();
    return { reversed, ...gasEnvironment };
  };

  it("tells the user the period is invalid", async () => {
    const { ui } = await runTrigger();

    expect(ui.alert).toHaveBeenCalledTimes(1);
    expect(ui.alert).toHaveBeenCalledWith(en.alerts.errorTitle, en.alerts.invalidPeriod, "OK");
  });

  it("leaves the previous result untouched", async () => {
    const { reversed, spreadsheet } = await runTrigger();

    expect(spreadsheet.getSheetByName).not.toHaveBeenCalledWith(en.sheets.input);
    expect(reversed.getDataRange).not.toHaveBeenCalled();
    expect(reversed.getCharts).not.toHaveBeenCalled();
    expect(reversed.cells.A1).toBe("Existing title");
  });

  it("does not record the run for throttling", async () => {
    const { cache } = await runTrigger();

    expect(cache.put).not.toHaveBeenCalled();
  });
});
