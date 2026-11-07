# kakeibo-gas

[![CI](https://github.com/connect0459/kakeibo-gas/actions/workflows/ci.yml/badge.svg)](https://github.com/connect0459/kakeibo-gas/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/connect0459/kakeibo-gas/blob/main/LICENSE)

A household budget (*kakeibo*) system built on Google Sheets and Google Apps Script (GAS), written in TypeScript.

## Features

- **Income and expense tracking**: record transactions and aggregate them by category
- **Multiple accounts**: manage cash, bank accounts, e-money, and other account types side by side
- **Automatic balances**: balances and per-account subtotals stay up to date
- **Monthly archive**: move past months into an archive sheet and carry balances forward
- **Statistics and charts**: income/expense breakdown for the current month, last month, the current year, or a custom period
- **Customizable**: account types, categories, and excluded categories are defined in a config sheet

## Amounts

The input sheet, the archive sheet, and the archive operation read amounts by one rule. An amount is empty (counted as 0), a number, or text of plain digits that may use `,` as a thousands separator and `.` as a decimal point, such as `1000` or `1,000`.

Anything else stops the run with an error that names the sheet and the row: negative values (`-500`), accounting styles (`(1,000)`, `▲500`), a Unicode minus (`−500`), exponent notation (`1e3`), currency symbols, and other text. Nothing is dropped or reinterpreted silently. Forms such as `.5`, `1.`, and `+5` are rejected too: write `0.5`, `1`, and `5`. Enter a refund as a positive amount in the opposite column (income instead of expense).

## Language

The menu, dialogs, sheet names, and the default config sheet are in Japanese or English. A spreadsheet that already has the script's sheets (`入力`/`結果`/`アーカイブ`/`設定`, or `Input`/`Result`/`Archive`/`Config`) keeps their language. Otherwise the spreadsheet's locale decides: Japanese for a Japanese locale, English for everything else. The decision is described in [ADR-001](docs/adrs/adr-001-locale-resolution-and-category-kind.md).

Each category in the config sheet says whether it is income or expense in column D, so category names can be written in any language.

## Installation

1. Create a new spreadsheet in [Google Sheets](https://sheets.google.com).
2. Open **Extensions → Apps Script** and delete the existing code.
3. Get the bundled script:
   - **From a release (no Node.js required)**: download `main.js` from the [latest release](https://github.com/connect0459/kakeibo-gas/releases/latest).
   - **From source**:

     ```sh
     git clone https://github.com/connect0459/kakeibo-gas.git
     cd kakeibo-gas
     npm ci
     npm run build
     ```

     The bundle is written to `dist/main.js`.

4. Paste the contents of `main.js` into the Apps Script editor and save.
5. Reload the spreadsheet. A menu appears and the config sheet is created on first run.

To deploy with [clasp](https://github.com/google/clasp) instead of copy-and-paste, see [docs/development.md](docs/development.md).

## Documentation

- [docs/adrs/](docs/adrs/) — architecture decision records
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — architecture
- [docs/development.md](docs/development.md) — development environment, build, and deploy
- [CHANGELOG.md](CHANGELOG.md) — release notes

## Contributing

See [CONTRIBUTING.md](https://github.com/connect0459/kakeibo-gas/blob/main/CONTRIBUTING.md).

## License

[MIT](https://github.com/connect0459/kakeibo-gas/blob/main/LICENSE)
