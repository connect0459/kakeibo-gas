import { STATIC_CONFIG } from "./config";
import { aggregateByCategory } from "./features/aggregation/aggregateByCategory";
import { filterDataByDate } from "./features/aggregation/filterDataByDate";
import { findUnlistedCategories } from "./features/aggregation/findUnlistedCategories";
import { getArchiveData } from "./features/archive/getArchiveData";
import { getOrCreateArchiveSheet } from "./features/archive/getOrCreateArchiveSheet";
import { planArchive } from "./features/archive/planArchive";
import { resolveChartRange } from "./features/chart/resolveChartRange";
import { initializeConfigSheet } from "./features/config/initializeConfigSheet";
import { readConfigSheet } from "./features/config/readConfigSheet";
import type { ConfigObject, ConfigSheetData } from "./features/config/types";
import { processRawData } from "./features/data/processRawData";
import { calculatePeriodDates } from "./features/date/calculatePeriodDates";
import { formatDateToString } from "./features/date/formatDateToString";
import { buildPeriodDialogHtml } from "./features/dialog/buildPeriodDialogHtml";
import { getOrCreateInputSheet } from "./features/input/getOrCreateInputSheet";
import { detectLocale } from "./features/locale/detectLocale";
import type { Locale } from "./features/locale/types";
import { displayResults } from "./features/result/displayResults";
import type { CategoryAggregation, SectionPosition } from "./types";

// Cache of data read from the config sheet
let cachedConfigData: ConfigSheetData | null = null;

let cachedLocale: Locale | null = null;

const getActiveLocale = (): Locale => {
  if (!cachedLocale) {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    cachedLocale = detectLocale(spreadsheet);
    console.log(
      "Language:",
      cachedLocale.id,
      "| spreadsheet locale:",
      spreadsheet.getSpreadsheetLocale(),
    );
  }
  return cachedLocale;
};

const getActiveTimeZone = (): string =>
  SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();

/**
 * Reads data from the config sheet (with caching)
 *
 * @returns Data read from the config sheet
 */
const getConfigData = (): ConfigSheetData => {
  // Return the cache if available
  if (cachedConfigData) {
    return cachedConfigData;
  }

  // Get or create the config sheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const locale = getActiveLocale();
  const configSheet = initializeConfigSheet(ss, locale);

  // Read data from the config sheet and save it to the cache
  cachedConfigData = readConfigSheet(configSheet);

  // Debug: check the config data that was read
  console.log("Data read from the config sheet:");
  console.log("  - type options:", cachedConfigData.typeOptions.length);
  console.log("  - excluded categories:", JSON.stringify(cachedConfigData.catalog.excludedNames()));

  return cachedConfigData;
};

const createConfigSheetIfMissing = (): void => {
  getConfig();
};

/**
 * Merged system settings
 *
 * Merges the static settings with the settings dynamically read from the config sheet
 */
const getConfig = (): ConfigObject => {
  const configData = getConfigData();

  return {
    ...STATIC_CONFIG,
    TYPE_OPTIONS: configData.typeOptions,
    CATEGORY_CATALOG: configData.catalog,
  };
};

/**
 * Function that runs automatically when the spreadsheet opens
 */
const onOpen = (): void => {
  try {
    // Add the period selection menu to the UI
    createCustomMenu();
    createConfigSheetIfMissing();
  } catch (error) {
    console.error("Failed while running onOpen:", error);
  }
};

// Expose as a Google Apps Script global function
(globalThis as typeof globalThis & { onOpen: typeof onOpen }).onOpen = onOpen;

/**
 * Creates the custom menu
 */
const createCustomMenu = () => {
  const ui = SpreadsheetApp.getUi();
  const { menu: text } = getActiveLocale();
  const menu = ui.createMenu(text.title);

  menu.addItem(text.currentMonth, "setCurrentMonthPeriod");
  menu.addItem(text.lastMonth, "setLastMonthPeriod");
  menu.addItem(text.currentYear, "setCurrentYearPeriod");
  menu.addItem(text.customPeriod, "showCustomPeriodDialog");
  menu.addSeparator();
  menu.addItem(text.archive, "archivePreviousMonthData");
  menu.addItem(text.initializeInput, "initializeInputSheet");

  menu.addToUi();
};

/**
 * Shows the custom period selection dialog
 */
const showCustomPeriodDialog = (): void => {
  const ui = SpreadsheetApp.getUi();
  const { dialog } = getActiveLocale();
  const htmlOutput = HtmlService.createHtmlOutput(buildPeriodDialogHtml(dialog))
    .setWidth(300)
    .setHeight(250);

  ui.showModalDialog(htmlOutput, dialog.title);
};

/**
 * Initializes or gets the result sheet
 */
const getOrCreateResultSheet = () => {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let resultSheet = ss.getSheetByName(getActiveLocale().sheets.result);

  // Create the result sheet if it does not exist
  if (!resultSheet) {
    resultSheet = ss.insertSheet(getActiveLocale().sheets.result);
    // Initialize the cells for entering the aggregation period
    resultSheet.getRange("A2").setValue(getActiveLocale().result.periodLabel);
    resultSheet.getRange("B2").setValue(new Date()).setNumberFormat(STATIC_CONFIG.DATE_FORMAT);
    resultSheet.getRange("C2").setValue(getActiveLocale().result.periodSeparator);
    resultSheet.getRange("D2").setValue(new Date()).setNumberFormat(STATIC_CONFIG.DATE_FORMAT);
  }

  return resultSheet;
};

/**
 * Initializes or gets the input sheet
 */
const getInputSheet = () =>
  getOrCreateInputSheet(
    SpreadsheetApp.getActiveSpreadsheet(),
    getActiveLocale(),
    () => getConfig().TYPE_OPTIONS,
  );

/**
 * Common function that sets the aggregation period and runs the aggregation immediately
 * @param startDate - Start date
 * @param endDate - End date
 * @param title - Sheet title
 */
const setStatisticsPeriod = (
  startDate: string | Date,
  endDate: string | Date,
  title: string,
): void => {
  // Set the period on the result sheet
  const resultSheet = getOrCreateResultSheet();
  resultSheet.getRange("B2").setValue(startDate);
  resultSheet.getRange("D2").setValue(endDate);

  // Set the title
  resultSheet.getRange("A1").setValue(title);
  resultSheet.getRange("A1").setFontSize(16).setFontWeight("bold");

  // Run the aggregation immediately
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const e = {
    source: ss,
    getActiveSheet: () => ss.getSheetByName(getActiveLocale().sheets.input) || resultSheet,
  };
  generateStatistics(e);
};

/**
 * Sets the current month's period
 */
const setCurrentMonthPeriod = (): void => {
  const period = calculatePeriodDates(getActiveTimeZone(), 0, 0);
  const [year, month] = period.startDate.split("-").map(Number);
  const title = getActiveLocale().titles.month(year, month);

  setStatisticsPeriod(period.startDate, period.endDate, title);
};

/**
 * Sets last month's period
 */
const setLastMonthPeriod = (): void => {
  const period = calculatePeriodDates(getActiveTimeZone(), 0, -1);
  const [year, month] = period.startDate.split("-").map(Number);
  const title = getActiveLocale().titles.month(year, month);

  setStatisticsPeriod(period.startDate, period.endDate, title);
};

/**
 * Sets this year's period
 */
const setCurrentYearPeriod = (): void => {
  const period = calculatePeriodDates(getActiveTimeZone(), 0, 0, true);
  const title = getActiveLocale().titles.year(Number(period.startDate.slice(0, 4)));

  setStatisticsPeriod(period.startDate, period.endDate, title);
};

/**
 * Sets a custom period
 */
const setCustomPeriod = (startDate: string, endDate: string): void => {
  try {
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    // Check that the dates are valid
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      throw new Error("Invalid date format");
    }

    const title = getActiveLocale().titles.range(startDate, endDate);

    setStatisticsPeriod(startDate, endDate, title);
  } catch (error) {
    console.error("Failed to set the custom period:", error);
    const ui = SpreadsheetApp.getUi();
    const { alerts } = getActiveLocale();
    ui.alert(alerts.errorTitle, alerts.invalidDate, ui.ButtonSet.OK);
  }
};

/**
 * Moves the previous months' data to the archive (adds a carryover row per type)
 */
const archivePreviousMonthData = (): void => {
  try {
    const ui = SpreadsheetApp.getUi();
    const { alerts } = getActiveLocale();
    const response = ui.alert(
      alerts.archiveConfirmTitle,
      alerts.archiveConfirmBody,
      ui.ButtonSet.YES_NO,
    );

    if (response !== ui.Button.YES) {
      return;
    }

    const timeZone = getActiveTimeZone();

    // Get this month's date
    const thisMonth = calculatePeriodDates(timeZone, 0, 0);
    const thisMonthStartDate = thisMonth.startDateObj;

    // Get the input sheet and the archive sheet
    const inputSheet = getInputSheet();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const locale = getActiveLocale();
    const archiveSheet = getOrCreateArchiveSheet(ss, locale.sheets.archive, locale.headers);

    // Get the input sheet data (columns A to F only)
    const lastRow = inputSheet.getLastRow();
    if (lastRow <= 1) {
      ui.alert(alerts.infoTitle, alerts.noInputData, ui.ButtonSet.OK);
      return;
    }

    const inputData = inputSheet.getRange(2, 1, lastRow - 1, 6).getValues();
    const plan = planArchive(inputData, thisMonthStartDate, timeZone, {
      carryoverCategory: locale.vocabulary.carryoverCategory,
      describeCarryover: locale.vocabulary.carryoverDescription,
    });

    // When there is no data to move
    if (plan.pastRowCount === 0) {
      ui.alert(alerts.infoTitle, alerts.noPastData, ui.ButtonSet.OK);
      return;
    }

    if (plan.rowsToArchive.length === 0) {
      ui.alert(alerts.infoTitle, alerts.nothingToArchive, ui.ButtonSet.OK);
      return;
    }

    // Get the archive sheet's last row to decide where to append
    // Get the last row with data in column A (ignoring formulas in column G onward)
    let archiveLastRow = 1; // With the header row as the minimum
    const aColumnValues = archiveSheet.getRange("A1:A" + archiveSheet.getMaxRows()).getValues();
    for (let i = 0; i < aColumnValues.length; i++) {
      if (aColumnValues[i][0] !== "") {
        archiveLastRow = i + 1; // +1 because the index is 0-based
      }
    }
    const insertRow = archiveLastRow + 1;

    // Append data to the archive sheet (columns A to F only)
    archiveSheet.getRange(insertRow, 1, plan.rowsToArchive.length, 6).setValues(plan.rowsToArchive);

    // Clear the input sheet data (columns A to F only)
    inputSheet.getRange(2, 1, lastRow - 1, 6).clearContent();

    const newInputData = [...plan.carryForwardRows, ...plan.rowsToKeep];

    // Set the new data on the input sheet
    if (newInputData.length > 0) {
      inputSheet.getRange(2, 1, newInputData.length, 6).setValues(newInputData);
    }

    // Completion message
    ui.alert(alerts.doneTitle, alerts.archived(plan.rowsToArchive.length), ui.ButtonSet.OK);

    // Update the aggregation
    setCurrentMonthPeriod();
  } catch (error) {
    console.error("Failed to archive the data:", error);
    const ui = SpreadsheetApp.getUi();
    const message = error instanceof Error ? error.message : String(error);
    const { alerts } = getActiveLocale();
    ui.alert(alerts.errorTitle, alerts.archiveFailed(message), ui.ButtonSet.OK);
  }
};

/**
 * Initializes the input sheet (keeps only the header and formatting) (columns A to F only)
 */
const initializeInputSheet = (): void => {
  try {
    const ui = SpreadsheetApp.getUi();
    const { alerts } = getActiveLocale();
    const response = ui.alert(
      alerts.initializeConfirmTitle,
      alerts.initializeConfirmBody,
      ui.ButtonSet.YES_NO,
    );

    if (response !== ui.Button.YES) {
      return;
    }

    const inputSheet = getInputSheet();

    // Clear data other than the header row (columns A to F only)
    const lastRow = inputSheet.getLastRow();
    if (lastRow > 1) {
      inputSheet.getRange(2, 1, lastRow - 1, 6).clearContent();
    }

    ui.alert(alerts.doneTitle, alerts.initialized, ui.ButtonSet.OK);
  } catch (error) {
    console.error("Failed to initialize the input sheet:", error);
    const ui = SpreadsheetApp.getUi();
    const message = error instanceof Error ? error.message : String(error);
    const { alerts } = getActiveLocale();
    ui.alert(alerts.errorTitle, alerts.initializeFailed(message), ui.ButtonSet.OK);
  }
};

/**
 * Generates statistics for the specified period - with enhanced error handling
 */
const generateStatisticsForPeriod = (
  startDate: string,
  endDate: string,
  title: string,
): boolean => {
  try {
    console.log(`Aggregation started: ${startDate} to ${endDate}`);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const timeZone = getActiveTimeZone();

    // Get data (from the input sheet and the archive sheet)
    const inputData = getInputData();
    const archiveData = getArchiveData(ss, getActiveLocale().sheets.archive, timeZone);

    // Combine both sets of data
    const allData = [...inputData, ...archiveData];

    // Filter data within the period
    const filteredData = filterDataByDate(allData, startDate, endDate, timeZone);

    const locale = getActiveLocale();
    const catalog = getConfig().CATEGORY_CATALOG;

    const categoriesWithoutKind = catalog.categoriesWithoutKind();
    if (categoriesWithoutKind.length > 0) {
      throw new Error(
        locale.alerts.categoriesWithoutKind(locale.configHeaders.kind, categoriesWithoutKind),
      );
    }

    const unlistedCategories = findUnlistedCategories(filteredData, catalog);
    if (unlistedCategories.length > 0) {
      throw new Error(locale.alerts.categoriesNotListed(unlistedCategories));
    }

    console.log("======= Config =======");
    console.log("Excluded categories:", JSON.stringify(catalog.excludedNames()));

    // Aggregate by income/expense type
    const incomeByCategory = aggregateByCategory(
      filteredData,
      "income",
      catalog,
      locale.vocabulary.otherGroup,
    );
    const expenseByCategory = aggregateByCategory(
      filteredData,
      "expense",
      catalog,
      locale.vocabulary.otherGroup,
    );

    // Debug info for the aggregation results
    console.log("======= Aggregation result =======");
    console.log("Income by category:", JSON.stringify(incomeByCategory));
    console.log("Expense by category:", JSON.stringify(expenseByCategory));
    console.log(`Filtered records: ${filteredData.length}`);

    // Prepare the result sheet
    let resultSheet = ss.getSheetByName(getActiveLocale().sheets.result);
    if (!resultSheet) {
      resultSheet = getOrCreateResultSheet();
    } else {
      // Clear existing content but keep the period cells
      const dataRange = resultSheet.getDataRange();
      const lastRow = dataRange.getLastRow();
      const lastCol = dataRange.getLastColumn();
      if (lastRow > 4) {
        resultSheet.getRange(5, 1, lastRow - 4, lastCol).clear();
      }

      // Update the period display
      resultSheet.getRange("A3").setValue(locale.result.excludedNote(catalog.excludedNames()));
    }

    // Update the result sheet title
    resultSheet.getRange("A1").setValue(title);
    resultSheet.getRange("A1").setFontSize(16).setFontWeight("bold");

    // Display the data on the result sheet
    const sections = displayResults(resultSheet, locale, incomeByCategory, expenseByCategory);

    // Create the charts
    createCharts(resultSheet, incomeByCategory, expenseByCategory, sections);

    console.log("Aggregation finished");
    return true;
  } catch (error) {
    console.error("Failed to aggregate:", error);

    // Show the error to the user
    try {
      const ui = SpreadsheetApp.getUi();
      const message = error instanceof Error ? error.message : String(error);
      const { alerts } = getActiveLocale();
      ui.alert(alerts.errorTitle, alerts.summaryFailed(message), ui.ButtonSet.OK);
    } catch (uiError) {
      // When the UI is unavailable (e.g., background execution)
      console.error("Failed to show the error:", uiError);
    }

    return false;
  }
};

/**
 * Get the input sheet data (columns A to F only)
 */
const getInputData = () => {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const inputSheet = ss.getSheetByName(getActiveLocale().sheets.input);

  if (!inputSheet) {
    throw new Error(getActiveLocale().alerts.sheetNotFound(getActiveLocale().sheets.input));
  }

  const lastRow = inputSheet.getLastRow();
  if (lastRow <= 1) {
    return [];
  }

  const data = inputSheet.getRange(2, 1, lastRow - 1, 6).getValues();
  return processRawData(data);
};

/**
 * Creates the charts - accurately locating the data position
 */
const createCharts = (
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  incomeData: CategoryAggregation,
  expenseData: CategoryAggregation,
  sections: { incomeSection: SectionPosition; expenseSection: SectionPosition },
): void => {
  const { COMMON_WIDTH, COMMON_HEIGHT, EXPENSE_Y_MARGIN } = STATIC_CONFIG.CHART;
  const { result, vocabulary } = getActiveLocale();
  const incomeTitle = result.sectionTitle(vocabulary.income);
  const expenseTitle = result.sectionTitle(vocabulary.expense);
  try {
    // Remove existing charts
    const charts = sheet.getCharts();
    for (let i = 0; i < charts.length; i++) {
      sheet.removeChart(charts[i]);
    }

    const incomeCount = Object.keys(incomeData).length;
    const expenseCount = Object.keys(expenseData).length;

    // Create the income breakdown chart
    if (incomeCount > 0) {
      const incomeRange = resolveChartRange(sections.incomeSection, incomeCount);

      if (incomeRange) {
        const { startRow: incomeStartRow, endRow: incomeEndRow } = incomeRange;

        // Check that data actually exists
        const valueRange = sheet.getRange(`B${incomeStartRow}:B${incomeEndRow}`).getValues();
        const hasValues = valueRange.some(
          (row: unknown[]) => row[0] !== "" && row[0] !== null && !Number.isNaN(Number(row[0])),
        );

        if (hasValues) {
          // Create the income pie chart
          const incomeChart = sheet
            .newChart()
            .setChartType(Charts.ChartType.PIE)
            .addRange(sheet.getRange(`A${incomeStartRow}:A${incomeEndRow}`)) // Category name
            .addRange(sheet.getRange(`B${incomeStartRow}:B${incomeEndRow}`)) // Amount
            .setPosition(5, 5, 0, 0)
            .setOption("title", incomeTitle)
            .setOption("pieSliceText", "percentage")
            .setOption("legend", { position: "right" })
            .setOption("width", COMMON_WIDTH)
            .setOption("height", COMMON_HEIGHT)
            .build();

          sheet.insertChart(incomeChart);
          console.log(`Income chart created: rows ${incomeStartRow} to ${incomeEndRow}`);
        }
      } else {
        console.log("Income section not found");
      }
    }

    // Create the expense breakdown chart
    if (expenseCount > 0) {
      const expenseRange = resolveChartRange(sections.expenseSection, expenseCount);

      if (expenseRange) {
        const { startRow: expenseStartRow, endRow: expenseEndRow } = expenseRange;

        // Check that data actually exists
        const valueRange = sheet.getRange(`B${expenseStartRow}:B${expenseEndRow}`).getValues();
        const hasValues = valueRange.some(
          (row: unknown[]) => row[0] !== "" && row[0] !== null && !Number.isNaN(Number(row[0])),
        );

        if (hasValues) {
          // Adjust the vertical position
          const expenseChartOffset = COMMON_HEIGHT + EXPENSE_Y_MARGIN;

          // Create the expense pie chart
          const expenseChart = sheet
            .newChart()
            .setChartType(Charts.ChartType.PIE)
            .addRange(sheet.getRange(`A${expenseStartRow}:A${expenseEndRow}`)) // Category name
            .addRange(sheet.getRange(`B${expenseStartRow}:B${expenseEndRow}`)) // Amount
            .setPosition(5, 5, 0, incomeCount > 0 ? expenseChartOffset : 0) // Place below the income chart if it exists
            .setOption("title", expenseTitle)
            .setOption("pieSliceText", "percentage")
            .setOption("legend", { position: "right" })
            .setOption("width", COMMON_WIDTH)
            .setOption("height", COMMON_HEIGHT)
            .build();

          sheet.insertChart(expenseChart);
          console.log(`Expense chart created: rows ${expenseStartRow} to ${expenseEndRow}`);
        }
      } else {
        console.log("Expense section not found");
      }
    }
  } catch (error) {
    // Log the error
    console.error("Failed to create the charts:", error);

    // Record the error information on the sheet
    const errorRow = sheet.getLastRow() + 2;
    sheet.getRange(`A${errorRow}`).setValue(getActiveLocale().result.chartErrorLabel);
    const errorMessage = error instanceof Error ? error.toString() : String(error);
    sheet.getRange(`A${errorRow + 1}`).setValue(errorMessage);
  }
};

/**
 * Function that runs when the spreadsheet is edited
 * Gets the period from the result sheet and aggregates
 */
const generateStatistics = (_e?: unknown): void => {
  try {
    // Skip if it just ran (wait until the edit is reflected)
    const cache = CacheService.getScriptCache();
    const lastRunKey = "lastRun_generateStats";
    const lastRun = cache.get(lastRunKey);

    const now = new Date().getTime();
    if (lastRun && now - parseInt(lastRun) < 10000) {
      // Throttle re-runs within 10 seconds
      console.log("Skipped because it ran recently");
      return;
    }

    // Get the aggregation period from the result sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const timeZone = getActiveTimeZone();
    let resultSheet = ss.getSheetByName(getActiveLocale().sheets.result);

    // Create the result sheet if it does not exist
    if (!resultSheet) {
      resultSheet = getOrCreateResultSheet();
      // Set the initial period
      setCurrentMonthPeriod();
      return; // generateStatistics is called inside setCurrentMonthPeriod, so finish here
    }

    // Get the aggregation period
    const startDate = resultSheet.getRange("B2").getValue();
    const endDate = resultSheet.getRange("D2").getValue();

    // Check that the date is in a valid format
    let startDateStr: string;
    let endDateStr: string;
    if (startDate instanceof Date && !isNaN(startDate.getTime())) {
      startDateStr = formatDateToString(startDate, timeZone);
    } else {
      // Set the first day of this month if it is not a date
      const period = calculatePeriodDates(timeZone);
      startDateStr = period.startDate;
      resultSheet.getRange("B2").setValue(startDateStr);
    }

    if (endDate instanceof Date && !isNaN(endDate.getTime())) {
      endDateStr = formatDateToString(endDate, timeZone);
    } else {
      // Set the last day of this month if it is not a date
      const period = calculatePeriodDates(timeZone);
      endDateStr = period.endDate;
      resultSheet.getRange("D2").setValue(endDateStr);
    }

    // Get or generate the title
    let title = resultSheet.getRange("A1").getValue();
    if (!title) {
      title = getActiveLocale().titles.range(startDateStr, endDateStr);
      resultSheet.getRange("A1").setValue(title);
    }

    // Run the aggregation
    generateStatisticsForPeriod(startDateStr, endDateStr, title);

    // Record the last run time
    cache.put(lastRunKey, now.toString(), 60); // Cache for 60 seconds
    console.log("Aggregation completed");
  } catch (error) {
    console.error("Failed to aggregate:", error);
  }
};

// Expose as a Google Apps Script global function
const gas = globalThis as typeof globalThis & {
  showCustomPeriodDialog: typeof showCustomPeriodDialog;
  setCurrentMonthPeriod: typeof setCurrentMonthPeriod;
  setLastMonthPeriod: typeof setLastMonthPeriod;
  setCurrentYearPeriod: typeof setCurrentYearPeriod;
  setCustomPeriod: typeof setCustomPeriod;
  archivePreviousMonthData: typeof archivePreviousMonthData;
  initializeInputSheet: typeof initializeInputSheet;
  generateStatistics: typeof generateStatistics;
};
gas.showCustomPeriodDialog = showCustomPeriodDialog;
gas.setCurrentMonthPeriod = setCurrentMonthPeriod;
gas.setLastMonthPeriod = setLastMonthPeriod;
gas.setCurrentYearPeriod = setCurrentYearPeriod;
gas.setCustomPeriod = setCustomPeriod;
gas.archivePreviousMonthData = archivePreviousMonthData;
gas.initializeInputSheet = initializeInputSheet;
gas.generateStatistics = generateStatistics;
