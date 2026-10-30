# ADR-001: Locale resolution and the income/expense key

## Status

- [ ] Proposed
- [x] Accepted
- [ ] Deprecated

## Context

The spreadsheet UI, sheet names, headers, and default data were Japanese string literals in the code. Two of them were not only text but also rules:

- **Sheet names** are how the script finds its sheets, and the maintainer's existing spreadsheet is keyed to the Japanese names.
- **Whether a category is income or expense** was decided by the category name starting with `収入` or `支出`. A category is user data, so this tied the logic to the language the user happened to write names in. Exclusion had the same problem: it matched the last part of a flagged name anywhere in a category.

The script needs to work for English-speaking users without breaking the one spreadsheet already in use, which was verified against exports of its sheets.

## Decision

### Where the language comes from

The text lives in locale dictionaries (`ja`, `en`). Which one a spreadsheet uses is decided once per execution, in this order:

1. If the spreadsheet already has a sheet named as the Japanese dictionary names them, use `ja`.
2. Otherwise, if it has a sheet named as the English dictionary names them, use `en`.
3. Otherwise, use the spreadsheet's locale: `ja` for a Japanese locale, `en` for everything else.

The result is not stored anywhere. Once the script has created its config sheet, that sheet's name decides the language from then on, so there is no second record that could disagree with the sheets.

Step 2 exists so that a spreadsheet created in English keeps finding its sheets if its locale setting is later changed to Japanese. When sheets of both languages exist, Japanese wins, because that is what the existing spreadsheet looks like.

### What decides income and expense

Each category in the config sheet carries its kind in a column of its own (column D, with a dropdown of the language's words). Aggregation asks a `CategoryCatalog` built from the sheet and no longer looks at the wording of the name.

- Exclusion matches the whole category name flagged in the sheet.
- A category whose kind is empty or not an income/expense word stops the aggregation with an error that names it. So does a category in the selected period's transactions that the config sheet does not list. The config sheet is the list of every category in use.
- The words of every dictionary are accepted in column D, so changing the language does not invalidate a sheet.
- There is no fallback that guesses the kind from the name. Compatibility with a sheet that lacks the column was deliberately not kept, because the maintainer is the only user and a guess would bring the dependency back.

## Consequences

- An existing Japanese spreadsheet behaves as before. It needs column D in its config sheet once, filled with a formula given in the changelog, before the version that reads it is deployed.
- A new spreadsheet in a non-Japanese locale gets English sheet names, text, and default config rows. A user who has a sheet named `Input`, `Result`, `Archive`, or `Config` of their own, and none of the Japanese names, is treated as English even in a Japanese spreadsheet.
- The language of an existing spreadsheet cannot be switched from inside the script; doing so means renaming its sheets and rewriting its config sheet.
- Some coupling to the shape of category names remains. Aggregation groups by the second hyphen-separated part of the name, and the carryover category is found by its name, so it has to exist in the config sheet as income.
- Removing a category from the config sheet makes periods that still contain it fail until it is added back.

## References

- <https://github.com/connect0459/kakeibo-gas/issues/28>
- <https://github.com/connect0459/kakeibo-gas/issues/34>
- <https://github.com/connect0459/kakeibo-gas/issues/35>

## Related File Paths

### Initial implementation (2026-10-20)

- src/features/locale/ (dictionaries, `resolveLocale`, `detectLocale`)
- src/features/category/ (`CategoryCatalog`, `parseKindWord`)
- src/features/config/ (`readConfigSheet`, `initializeConfigSheet`, default rows)
- src/features/aggregation/ (`aggregateByCategory`, `findUnlistedCategories`)
- src/main.ts
