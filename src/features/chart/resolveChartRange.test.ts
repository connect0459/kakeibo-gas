import { describe, expect, it } from "vitest";
import { resolveChartRange } from "./resolveChartRange";

describe("resolveChartRange", () => {
  it("returns the first and last data rows of a section", () => {
    expect(resolveChartRange({ start: 12, end: 15 }, 3)).toEqual({ startRow: 12, endRow: 14 });
  });

  it("returns a single row for a section with one data row", () => {
    expect(resolveChartRange({ start: 8, end: 9 }, 1)).toEqual({ startRow: 8, endRow: 8 });
  });

  it("excludes a placeholder row written after the data rows", () => {
    expect(resolveChartRange({ start: 12, end: 14 }, 1)).toEqual({ startRow: 12, endRow: 12 });
  });

  it("returns null for a section that was not written", () => {
    expect(resolveChartRange({ start: 0, end: 0 }, 3)).toBeNull();
  });

  it("returns null when there are no data rows", () => {
    expect(resolveChartRange({ start: 12, end: 12 }, 0)).toBeNull();
  });
});
