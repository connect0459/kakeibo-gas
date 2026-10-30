export type LocaleId = "ja" | "en";

type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

export type Locale = DeepReadonly<{
  id: LocaleId;
  sheets: {
    input: string;
    result: string;
    archive: string;
    config: string;
  };
  headers: {
    date: string;
    type: string;
    category: string;
    description: string;
    income: string;
    expense: string;
  };
  configHeaders: {
    type: string;
    category: string;
    excludeFromStats: string;
    kind: string;
  };
  vocabulary: {
    income: string;
    expense: string;
    otherGroup: string;
    carryoverCategory: string;
    carryoverDescription: (type: string) => string;
  };
  titles: {
    month: (year: number, month: number) => string;
    year: (year: number) => string;
    range: (startDate: string, endDate: string) => string;
  };
  menu: {
    title: string;
    currentMonth: string;
    lastMonth: string;
    currentYear: string;
    customPeriod: string;
    archive: string;
    initializeInput: string;
  };
  dialog: {
    title: string;
    startDateLabel: string;
    endDateLabel: string;
    submit: string;
    enterBothDates: string;
    startAfterEnd: string;
  };
  result: {
    periodLabel: string;
    periodSeparator: string;
    summaryTitle: string;
    totalIncome: string;
    totalExpense: string;
    balance: string;
    sectionTitle: (label: string) => string;
    categoryHeader: string;
    amountHeader: string;
    ratioHeader: string;
    emptySection: (label: string) => string;
    excludedNote: (excludedCategories: readonly string[]) => string;
    chartErrorLabel: string;
  };
  alerts: {
    errorTitle: string;
    infoTitle: string;
    doneTitle: string;
    invalidDate: string;
    archiveConfirmTitle: string;
    archiveConfirmBody: string;
    noInputData: string;
    noPastData: string;
    nothingToArchive: string;
    archived: (count: number) => string;
    initializeConfirmTitle: string;
    initializeConfirmBody: string;
    initialized: string;
    archiveFailed: (message: string) => string;
    initializeFailed: (message: string) => string;
    summaryFailed: (message: string) => string;
    sheetNotFound: (sheetName: string) => string;
    categoriesWithoutKind: (kindColumn: string, categories: readonly string[]) => string;
    categoriesNotListed: (categories: readonly string[]) => string;
  };
}>;
