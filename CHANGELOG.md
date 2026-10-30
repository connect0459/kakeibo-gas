# Changelog

<!--
When cutting a new release, update THREE places in this file:

1. Rename [Unreleased] to [X.Y.Z] with today's date (above), and add a fresh empty [Unreleased] section above it.
2. Update the reference links at the very bottom of this file:
    - Change [Unreleased] to compare the new tag against HEAD.
    - Add [X.Y.Z] comparing the new tag against the previous tag (or, for the first release, linking directly to the tag).
3. After the PR is merged, push the release tag. Pull main first so HEAD is the merge commit:

    ```console
    git checkout main && git pull origin main
    git tag vX.Y.Z && git push origin vX.Y.Z
    ```

   Pushing the tag triggers `.github/workflows/release.yml`, which builds `dist/main.js`, extracts this file's `[X.Y.Z]` section, and creates the GitHub Release with `main.js` attached. Do not run `gh release create` manually; it would create the Release ahead of the workflow with hand-pasted notes.
-->

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Internal: the creation of the input sheet and the writing of the result tables moved out of `main.ts` into tested functions. Sheets look and behave as before.
- Dates now follow the spreadsheet's time zone instead of a fixed Japan time zone, so "today", the current month, the archive cut-off, and the period filter no longer shift a day for a spreadsheet in another zone. Spreadsheets set to Japan's zone behave as before, and `appsscript.json` keeps `Asia/Tokyo`. See [ADR-002](docs/adrs/adr-002-follow-the-spreadsheet-time-zone.md).
- A newly created input or archive sheet now shows amounts as `#,##0` instead of `¥#,##0`, matching the existing sheets. Existing sheets are not touched, and the result sheet keeps its `¥` format.
- A new spreadsheet now gets English sheet names, menu, dialogs, and default config rows when its locale is not Japanese. A spreadsheet that already has the script's sheets keeps their language, and a Japanese-locale spreadsheet stays Japanese, so existing spreadsheets are unchanged. See [ADR-001](docs/adrs/adr-001-locale-resolution-and-category-kind.md).
- **Breaking:** the config sheet needs an income/expense column (column D, header `収支`, values `収入` or `支出`) for every category. Whether a category is income or expense is no longer guessed from its name; the aggregation stops with an error naming any category that has no value. To fill an existing sheet, put this in D2 and fill it down, then paste the result as values: `=IF(B2="","",IF(LEFT(B2,2)="収入","収入",IF(LEFT(B2,2)="支出","支出","")))`.
- An excluded category is now matched by its whole name instead of a part of it, so flagging `収入-繰越金` no longer also excludes `支出-繰越金`.
- The aggregation stops with an error naming any category in the selected period's transactions that the config sheet does not list, so removing a category from the sheet can no longer silently shrink a summary. Add the category back to fix it.
- A newly created config sheet has the income/expense column, with a dropdown of the language's words, and shows the exclusion column as checkboxes; both reject other input when it is typed. It no longer includes the `収入-初期登録` category. The default rows are chosen by language, and there is now an English set. Existing config sheets are not changed.
- Translate source comments, test names, and documentation to English.
- Script log messages are now in English.

### Fixed

- A newly created result sheet labels its period cells `集計期間:` and `～`, matching the existing spreadsheet, instead of `期間:` and `~`.
- The Japanese message in the custom-period dialog now says the start date may be the same day as the end date, which is what the check already allowed.

---

[Unreleased]: <https://github.com/connect0459/kakeibo-gas/commits/main>
