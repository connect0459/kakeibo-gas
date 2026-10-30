import { describe, expect, it } from "vitest";
import { parseDateInZone } from "./parseDateInZone";
import { startOfDayInZone } from "./startOfDayInZone";

describe("parseDateInZone", () => {
  it("Reads a yyyy-MM-dd string as midnight in the given zone", () => {
    expect(parseDateInZone("2025-04-01", "America/Los_Angeles")).toEqual(
      startOfDayInZone("America/Los_Angeles", 2025, 3, 1),
    );
    expect(parseDateInZone("2025-04-01", "Asia/Tokyo")).toEqual(
      startOfDayInZone("Asia/Tokyo", 2025, 3, 1),
    );
  });

  it("Reads a yyyy/M/d string as midnight in the given zone", () => {
    expect(parseDateInZone("2025/4/1", "Pacific/Auckland")).toEqual(
      startOfDayInZone("Pacific/Auckland", 2025, 3, 1),
    );
  });

  it("Ignores a time part after the date", () => {
    expect(parseDateInZone("2025-04-01 13:45", "Asia/Tokyo")).toEqual(
      startOfDayInZone("Asia/Tokyo", 2025, 3, 1),
    );
  });

  it("Falls back to the built-in parser for other formats", () => {
    expect(parseDateInZone("Apr 1, 2025", "Asia/Tokyo")).toEqual(new Date("Apr 1, 2025"));
  });

  it("Returns an invalid date for text that is not a date", () => {
    expect(parseDateInZone("", "Asia/Tokyo").getTime()).toBeNaN();
    expect(parseDateInZone("not a date", "Asia/Tokyo").getTime()).toBeNaN();
  });
});
