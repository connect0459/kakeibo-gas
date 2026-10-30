import { describe, expect, it } from "vitest";
import { startOfDayInZone } from "./startOfDayInZone";

describe("startOfDayInZone", () => {
  it("Returns midnight in a zone ahead of UTC as the previous day in UTC", () => {
    expect(startOfDayInZone("Asia/Tokyo", 2025, 9, 1)).toEqual(new Date(Date.UTC(2025, 8, 30, 15)));
  });

  it("Returns midnight in a zone behind UTC as the same day in UTC", () => {
    expect(startOfDayInZone("America/Los_Angeles", 2025, 9, 1)).toEqual(
      new Date(Date.UTC(2025, 9, 1, 7)),
    );
  });

  it("Uses the daylight saving offset in effect on that day", () => {
    expect(startOfDayInZone("Pacific/Auckland", 2025, 9, 1)).toEqual(
      new Date(Date.UTC(2025, 8, 30, 11)),
    );
    expect(startOfDayInZone("America/Los_Angeles", 2025, 2, 9)).toEqual(
      new Date(Date.UTC(2025, 2, 9, 8)),
    );
  });

  it("Rolls an out-of-range day over into the adjacent month", () => {
    expect(startOfDayInZone("Asia/Tokyo", 2025, 9, 0)).toEqual(new Date(Date.UTC(2025, 8, 29, 15)));
  });

  it("Returns the first instant of the day when midnight does not exist", () => {
    expect(startOfDayInZone("America/Havana", 2025, 2, 9)).toEqual(
      new Date(Date.UTC(2025, 2, 9, 5)),
    );
    expect(startOfDayInZone("Africa/Cairo", 2025, 3, 25)).toEqual(
      new Date(Date.UTC(2025, 3, 24, 22)),
    );
  });

  it("Returns the earlier midnight when the clock is set back across midnight", () => {
    expect(startOfDayInZone("America/Havana", 2025, 10, 2)).toEqual(
      new Date(Date.UTC(2025, 10, 2, 4)),
    );
  });
});
