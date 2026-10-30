# ADR-002: Follow the spreadsheet's time zone

## Status

- [ ] Proposed
- [x] Accepted
- [ ] Deprecated

## Context

The code assumed Japan's time zone in two places:

- `formatDateToString` formatted with `"JST"` unless a zone was passed, and every caller relied on that default. For a user in a zone ahead of Japan, a date that is midnight in their zone could be formatted as the previous day.
- `appsscript.json` sets `timeZone` to `Asia/Tokyo`. It only applies to a project deployed with `clasp`; a user who pastes the built script into the editor keeps the project's own setting.

`calculatePeriodDates` and the period filter also used the script's local dates, so "today", "this month", and the day of a row followed the project's zone rather than the spreadsheet's.

## Decision

### Which zone dates follow

Every date the script formats, compares, or computes follows the **spreadsheet's** time zone (`getSpreadsheetTimeZone()`), not the script's (`Session.getScriptTimeZone()`).

The dates in the sheets are entered and displayed in the spreadsheet's zone, and the script reads them as instants. Judging the day in any other zone can move a row across a day or month boundary. Using the spreadsheet's zone also gives the same result whether the script was deployed with `clasp` or pasted into the editor, which is the same reasoning ADR-001 applies to the language.

### How the zone reaches the code

The zone is a required argument, not a global or a default. `main.ts` reads it once per call site and passes it to:

- `formatDateToString(date, timeZone, format?)`
- `calculatePeriodDates(timeZone, yearOffset?, monthOffset?, fullYear?)`, which decides "today" in that zone and returns date objects at midnight in that zone
- `planArchive(rows, thisMonthStart, timeZone, labels)`
- `filterDataByDate(data, startDate, endDate, timeZone)`, which compares `yyyy-MM-dd` strings in that zone instead of moving local hours
- `getArchiveData(ss, sheetName, timeZone)`, which reads a text date in the archive sheet as midnight in that zone (`parseDateInZone`)

`startOfDayInZone` returns the earliest instant of a day that is valid in the zone. When daylight saving skips midnight (for example `America/Havana` on 2025-03-09), it returns the first instant of that day rather than the previous day.

The test mock of `Utilities.formatDate` honors the zone, so the tests cover a zone ahead of Japan (`Pacific/Auckland`) and one behind it (`America/Los_Angeles`).

### What the manifest says

`appsscript.json` keeps `"timeZone": "Asia/Tokyo"`. No behavior depends on it any more, so it only sets the default of a project created with `clasp push`, which is the maintainer's own setup. Changing it to a neutral value would overwrite the maintainer's project setting on the next push without making any result different.

## Consequences

- A user in any zone gets the day, month, and year of their spreadsheet's time zone. Existing spreadsheets set to Japan's zone behave as before.
- Changing the spreadsheet's time zone changes which day an existing row falls on, as it does in the sheet itself.
- The script's own time zone still affects things the script does not format, such as the time of a trigger.
- A spreadsheet whose time zone differs from the maintainer's `appsscript.json` is not affected by `clasp push`.
- A text date in the archive sheet is read in the spreadsheet's zone only in the `yyyy-MM-dd` and `yyyy/M/d` forms. Any other text goes through the built-in parser, which reads it in the script's zone; text that cannot be parsed is treated as undated and is included in every period.
- The custom period dialog passes `yyyy-MM-dd` strings, which are used as typed and are not converted through a zone.

## References

- <https://github.com/connect0459/kakeibo-gas/issues/44>
- <https://github.com/connect0459/kakeibo-gas/issues/28>
- [ADR-001](adr-001-locale-resolution-and-category-kind.md)

## Related File Paths

### Initial implementation (2026-10-21)

- src/features/date/ (`formatDateToString`, `calculatePeriodDates`, `startOfDayInZone`, `parseDateInZone`)
- src/features/archive/getArchiveData.ts
- src/features/archive/planArchive.ts
- src/features/aggregation/filterDataByDate.ts
- `tests/__mocks__/gas-globals.ts`
- src/main.ts
