import { describe, expect, it } from "vitest";
import { formatDateToString } from "./formatDateToString";

const AFTER_MIDNIGHT_IN_UTC = new Date(Date.UTC(2025, 9, 1, 2, 0));
const NOON_IN_UTC = new Date(Date.UTC(2025, 9, 1, 12, 0));

describe("formatDateToString", () => {
  describe("Formatting in the given time zone", () => {
    it("Formats the same instant as the previous day in a zone behind Japan", () => {
      expect(formatDateToString(AFTER_MIDNIGHT_IN_UTC, "Asia/Tokyo")).toBe("2025-10-01");
      expect(formatDateToString(AFTER_MIDNIGHT_IN_UTC, "America/Los_Angeles")).toBe("2025-09-30");
    });

    it("Formats the same instant as the next day in a zone ahead of Japan", () => {
      expect(formatDateToString(NOON_IN_UTC, "Asia/Tokyo")).toBe("2025-10-01");
      expect(formatDateToString(NOON_IN_UTC, "Pacific/Auckland")).toBe("2025-10-02");
    });

    it("Pads single-digit months and days with zeros", () => {
      expect(formatDateToString(new Date(Date.UTC(2025, 0, 5, 3, 0)), "Asia/Tokyo")).toBe(
        "2025-01-05",
      );
    });

    it("Keeps the leap day of a leap year", () => {
      expect(formatDateToString(new Date(Date.UTC(2024, 1, 29, 3, 0)), "Asia/Tokyo")).toBe(
        "2024-02-29",
      );
    });
  });

  describe("Formatting with a custom format", () => {
    it("Formats in yyyy/MM/dd", () => {
      expect(formatDateToString(NOON_IN_UTC, "Asia/Tokyo", "yyyy/MM/dd")).toBe("2025/10/01");
    });
  });
});
