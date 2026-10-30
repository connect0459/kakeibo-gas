/**
 * Google Apps Script global type definitions
 */

// Type extension for globalThis
declare global {
  interface Window {
    onOpen: () => void;
    showCustomPeriodDialog: () => void;
    setCurrentMonthPeriod: () => void;
    setLastMonthPeriod: () => void;
    setCurrentYearPeriod: () => void;
    setCustomPeriod: (startDate: string, endDate: string) => void;
    archivePreviousMonthData: () => void;
    initializeInputSheet: () => void;
    generateStatistics: (e?: unknown) => void;
  }
}

export {};
