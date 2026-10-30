import { beforeEach, describe, expect, it, vi } from "vitest";
import { calculatePeriodDates } from "./calculatePeriodDates";
import { startOfDayInZone } from "./startOfDayInZone";

const TOKYO = "Asia/Tokyo";

describe("calculatePeriodDates", () => {
  // Mock the current time before tests
  beforeEach(() => {
    // Fixed to October 15, 2025
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.UTC(2025, 9, 15, 3))); // October 15, 2025
  });

  describe("Following the given time zone", () => {
    const LATE_OCTOBER_31_IN_UTC = new Date(Date.UTC(2025, 9, 31, 20, 0));

    it("Treats the instant as November in a zone ahead of it, where the month has already turned", () => {
      vi.setSystemTime(LATE_OCTOBER_31_IN_UTC);

      const result = calculatePeriodDates("Asia/Tokyo");

      expect(result.startDate).toBe("2025-11-01");
      expect(result.endDate).toBe("2025-11-30");
    });

    it("Treats the same instant as October in a zone behind it", () => {
      vi.setSystemTime(LATE_OCTOBER_31_IN_UTC);

      const result = calculatePeriodDates("America/Los_Angeles");

      expect(result.startDate).toBe("2025-10-01");
      expect(result.endDate).toBe("2025-10-31");
    });

    it("Returns date objects at midnight in the given zone", () => {
      vi.setSystemTime(LATE_OCTOBER_31_IN_UTC);

      const result = calculatePeriodDates("Pacific/Auckland");

      expect(result.startDateObj).toEqual(new Date(Date.UTC(2025, 9, 31, 11)));
      expect(result.endDateObj).toEqual(new Date(Date.UTC(2025, 10, 29, 11)));
    });
  });

  describe("Get the current month's period", () => {
    it("Gets the current month's period with yearOffset=0 and monthOffset=0", () => {
      // Act
      const result = calculatePeriodDates(TOKYO, 0, 0);

      // Assert
      expect(result.startDate).toBe("2025-10-01");
      expect(result.endDate).toBe("2025-10-31");
      expect(result.startDateObj).toEqual(startOfDayInZone(TOKYO, 2025, 9, 1));
      expect(result.endDateObj).toEqual(startOfDayInZone(TOKYO, 2025, 9, 31));
    });

    it("Gets the current month's period when arguments are omitted", () => {
      // Act
      const result = calculatePeriodDates(TOKYO);

      // Assert
      expect(result.startDate).toBe("2025-10-01");
      expect(result.endDate).toBe("2025-10-31");
    });
  });

  describe("Get last month's period", () => {
    it("Gets last month's period with monthOffset=-1", () => {
      // Act
      const result = calculatePeriodDates(TOKYO, 0, -1);

      // Assert
      expect(result.startDate).toBe("2025-09-01");
      expect(result.endDate).toBe("2025-09-30");
    });

    it("When run in January, gets last month's (previous year's December) period", () => {
      // Arrange
      vi.setSystemTime(new Date(Date.UTC(2025, 0, 15, 3))); // January 15, 2025

      // Act
      const result = calculatePeriodDates(TOKYO, 0, -1);

      // Assert
      expect(result.startDate).toBe("2024-12-01");
      expect(result.endDate).toBe("2024-12-31");
    });
  });

  describe("Get next month's period", () => {
    it("Gets next month's period with monthOffset=1", () => {
      // Act
      const result = calculatePeriodDates(TOKYO, 0, 1);

      // Assert
      expect(result.startDate).toBe("2025-11-01");
      expect(result.endDate).toBe("2025-11-30");
    });

    it("When run in December, gets next month's (next year's January) period", () => {
      // Arrange
      vi.setSystemTime(new Date(Date.UTC(2025, 11, 15, 3))); // December 15, 2025

      // Act
      const result = calculatePeriodDates(TOKYO, 0, 1);

      // Assert
      expect(result.startDate).toBe("2026-01-01");
      expect(result.endDate).toBe("2026-01-31");
    });
  });

  describe("Get a month of last year", () => {
    it("Gets the same month last year with yearOffset=-1", () => {
      // Act
      const result = calculatePeriodDates(TOKYO, -1, 0);

      // Assert
      expect(result.startDate).toBe("2024-10-01");
      expect(result.endDate).toBe("2024-10-31");
    });

    it("Gets last month of last year with yearOffset=-1 and monthOffset=-1", () => {
      // Act
      const result = calculatePeriodDates(TOKYO, -1, -1);

      // Assert
      expect(result.startDate).toBe("2024-09-01");
      expect(result.endDate).toBe("2024-09-30");
    });
  });

  describe("Get the full-year period", () => {
    it("Gets this year's full period with fullYear=true", () => {
      // Act
      const result = calculatePeriodDates(TOKYO, 0, 0, true);

      // Assert
      expect(result.startDate).toBe("2025-01-01");
      expect(result.endDate).toBe("2025-12-31");
      expect(result.startDateObj).toEqual(startOfDayInZone(TOKYO, 2025, 0, 1));
      expect(result.endDateObj).toEqual(startOfDayInZone(TOKYO, 2025, 11, 31));
    });

    it("Gets last year's full period with fullYear=true", () => {
      // Act
      const result = calculatePeriodDates(TOKYO, -1, 0, true);

      // Assert
      expect(result.startDate).toBe("2024-01-01");
      expect(result.endDate).toBe("2024-12-31");
    });

    it("Gets next year's full period with fullYear=true", () => {
      // Act
      const result = calculatePeriodDates(TOKYO, 1, 0, true);

      // Assert
      expect(result.startDate).toBe("2026-01-01");
      expect(result.endDate).toBe("2026-12-31");
    });

    it("monthOffset is ignored when fullYear=true", () => {
      // Act
      const result = calculatePeriodDates(TOKYO, 0, 5, true);

      // Assert (monthOffset is ignored, so the period is January to December)
      expect(result.startDate).toBe("2025-01-01");
      expect(result.endDate).toBe("2025-12-31");
    });
  });

  describe("Month-end boundary tests", () => {
    it("Correctly gets the period for February (common year)", () => {
      // Arrange
      vi.setSystemTime(new Date(Date.UTC(2025, 1, 15, 3))); // February 15, 2025 (common year)

      // Act
      const result = calculatePeriodDates(TOKYO, 0, 0);

      // Assert
      expect(result.startDate).toBe("2025-02-01");
      expect(result.endDate).toBe("2025-02-28");
    });

    it("Correctly gets the period for February (leap year)", () => {
      // Arrange
      vi.setSystemTime(new Date(Date.UTC(2024, 1, 15, 3))); // February 15, 2024 (leap year)

      // Act
      const result = calculatePeriodDates(TOKYO, 0, 0);

      // Assert
      expect(result.startDate).toBe("2024-02-01");
      expect(result.endDate).toBe("2024-02-29");
    });

    it("Correctly gets the period for a month with 30 days", () => {
      // Arrange
      vi.setSystemTime(new Date(Date.UTC(2025, 3, 15, 3))); // April 15, 2025

      // Act
      const result = calculatePeriodDates(TOKYO, 0, 0);

      // Assert
      expect(result.startDate).toBe("2025-04-01");
      expect(result.endDate).toBe("2025-04-30");
    });

    it("Correctly gets the period for a month with 31 days", () => {
      // Arrange
      vi.setSystemTime(new Date(Date.UTC(2025, 0, 15, 3))); // January 15, 2025

      // Act
      const result = calculatePeriodDates(TOKYO, 0, 0);

      // Assert
      expect(result.startDate).toBe("2025-01-01");
      expect(result.endDate).toBe("2025-01-31");
    });
  });

  describe("Multi-month offset tests", () => {
    it("Gets the period 2 months ago with monthOffset=-2", () => {
      // Act
      const result = calculatePeriodDates(TOKYO, 0, -2);

      // Assert
      expect(result.startDate).toBe("2025-08-01");
      expect(result.endDate).toBe("2025-08-31");
    });

    it("Gets the period 3 months ahead with monthOffset=3", () => {
      // Act
      const result = calculatePeriodDates(TOKYO, 0, 3);

      // Assert
      expect(result.startDate).toBe("2026-01-01");
      expect(result.endDate).toBe("2026-01-31");
    });

    it("Gets the period 13 months before January (December two years ago)", () => {
      // Arrange
      vi.setSystemTime(new Date(Date.UTC(2025, 0, 15, 3))); // January 15, 2025

      // Act
      const result = calculatePeriodDates(TOKYO, 0, -13);

      // Assert
      expect(result.startDate).toBe("2023-12-01");
      expect(result.endDate).toBe("2023-12-31");
    });
  });
});
