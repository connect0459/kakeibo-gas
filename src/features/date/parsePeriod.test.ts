import { describe, expect, it } from "vitest";
import { parsePeriod } from "./parsePeriod";

describe("parsePeriod", () => {
  it("Accepts a yyyy-MM-dd range and returns the same dates", () => {
    expect(parsePeriod("2025-01-01", "2025-12-31")).toEqual({
      startDate: "2025-01-01",
      endDate: "2025-12-31",
    });
  });

  it("Accepts a single-day period", () => {
    expect(parsePeriod("2025-06-15", "2025-06-15")).toEqual({
      startDate: "2025-06-15",
      endDate: "2025-06-15",
    });
  });

  it("Accepts February 29 only in a leap year", () => {
    expect(parsePeriod("2024-02-29", "2024-03-01")).not.toBeNull();
    expect(parsePeriod("2025-02-29", "2025-03-01")).toBeNull();
  });

  it("Rejects a range whose start is after its end", () => {
    expect(parsePeriod("2025-12-31", "2025-01-01")).toBeNull();
  });

  it("Rejects dates that do not exist on the calendar", () => {
    expect(parsePeriod("2025-13-01", "2025-12-31")).toBeNull();
    expect(parsePeriod("2025-01-01", "2025-04-31")).toBeNull();
    expect(parsePeriod("2025-00-10", "2025-12-31")).toBeNull();
    expect(parsePeriod("2025-01-00", "2025-12-31")).toBeNull();
  });

  it("Rejects years before 0100", () => {
    expect(parsePeriod("0001-01-01", "2025-12-31")).toBeNull();
    expect(parsePeriod("0099-12-31", "2025-12-31")).toBeNull();
    expect(parsePeriod("0100-01-01", "2025-12-31")).not.toBeNull();
  });

  it("Rejects text that is not in yyyy-MM-dd form", () => {
    expect(parsePeriod("Jan 5 2025", "2025-12-31")).toBeNull();
    expect(parsePeriod("2025-01-01", "Dec 31 2025")).toBeNull();
    expect(parsePeriod("2025/01/01", "2025/12/31")).toBeNull();
    expect(parsePeriod("2025-1-1", "2025-12-31")).toBeNull();
    expect(parsePeriod("2025-01-01T00:00:00Z", "2025-12-31")).toBeNull();
    expect(parsePeriod(" 2025-01-01", "2025-12-31")).toBeNull();
    expect(parsePeriod("2025-01-01\n", "2025-12-31")).toBeNull();
    expect(parsePeriod("=1+1", "2025-12-31")).toBeNull();
    expect(parsePeriod("", "")).toBeNull();
  });

  it("Rejects values that are not strings", () => {
    expect(parsePeriod(undefined as unknown as string, "2025-12-31")).toBeNull();
    expect(parsePeriod("2025-01-01", 20251231 as unknown as string)).toBeNull();
    expect(parsePeriod(null as unknown as string, null as unknown as string)).toBeNull();
  });
});
