/**
 * Mock implementations of Google Apps Script global functions
 */

const partsInZone = (date: Date, timeZone: string): Record<string, string> => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  return Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
};

const offsetInZone = (date: Date, timeZone: string): string => {
  const parts = partsInZone(date, timeZone);
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  const minutes = Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000);
  const sign = minutes < 0 ? "-" : "+";
  const abs = Math.abs(minutes);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `${sign}${hh}${mm}`;
};

// Mock implementation of Utilities
export const Utilities = {
  formatDate: (date: Date, timeZone: string, format: string): string => {
    const { year, month, day } = partsInZone(date, timeZone);

    if (format === "yyyy-MM-dd") {
      return `${year}-${month}-${day}`;
    } else if (format === "yyyy/MM/dd") {
      return `${year}/${month}/${day}`;
    } else if (format === "Z") {
      return offsetInZone(date, timeZone);
    }

    // Add here if other formats are needed
    return date.toISOString().split("T")[0];
  },
};

// Add to the global scope
(global as any).Utilities = Utilities;
