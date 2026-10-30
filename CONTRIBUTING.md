# Contributing

## Prerequisites

- [Node.js](https://nodejs.org/) 22.12 or later (pinned in `.nvmrc`; run `nvm use` to switch)
- [just](https://just.systems/) — task runner
- [pre-commit](https://pre-commit.com/) — hook runner
- A Google account with the Apps Script API enabled (only needed to deploy with `clasp`)

## Setup

```sh
git clone https://github.com/connect0459/kakeibo-gas
cd kakeibo-gas
just setup
```

`just setup` runs `npm ci` and installs the pre-commit hooks. To deploy with `clasp`, you need your own Apps Script project: `.clasp.json` is not tracked, so create it from `.clasp.json.example` or with `clasp create`. See [docs/development.md](docs/development.md) for `clasp` login and deployment.

## Development workflow

This mirrors the CI pipeline (`.github/workflows/ci.yml`), in order:

| Command | Purpose |
| :--- | :--- |
| `npm run check` | Biome lint and format check |
| `npm run typecheck` | TypeScript type check |
| `npm run test:run` | Run all tests once |
| `npm run build` | Bundle into `dist/main.js` |

`just verify` runs all of the above. To run every pre-commit hook manually:

```sh
pre-commit run --all-files
```

## Testing guidelines

This project follows **Red → Green → Refactor** (Detroit-school TDD):

- Write a failing test first, then implement.
- Use real objects; mocks are only permitted at external boundaries (the GAS globals such as `SpreadsheetApp`, mocked in `tests/__mocks__/gas-globals.ts`).
- Test names describe the business rule being verified, not how it is implemented.
- Unit tests live next to the source (`src/**/*.test.ts`); integration tests live in `tests/integration/`.

## Commit format

```text
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `tidy`, `test`, `chore`, `ci`, `perf`

- `feat` / `fix` describe changes to the source code. Use `chore` for dependencies and build tooling and `ci` for workflows rather than `fix(deps)` or `fix(ci)`.
- **Scope** is optional: a feature directory name such as `aggregation`, `archive`, `config`, or `date`.
- **Subject**: imperative mood, 72 characters max, no trailing period.
- **Body** (optional): explain **why**, not what.
- **Footer** (optional): `BREAKING CHANGE: <description>`, or `Closes #123`.

## Pull request process

1. Fork the repository and create a branch: `feat/xxx`, `fix/xxx`, `docs/xxx`.
2. Follow Red → Green → Refactor; keep one concern per commit.
3. Run `just verify` and `pre-commit run --all-files`, and make sure both pass.
4. Open a pull request using the repository's PR template. CI runs automatically.
5. Add a user-facing entry to the `[Unreleased]` section of `CHANGELOG.md`.

## Code style

- Package by Features: code is organized by feature under `src/features/<feature>/`; `src/main.ts` is the GAS entry point that wires features together.
- Prefer immutable data and pure functions; keep spreadsheet I/O at the edges (`src/main.ts` and the `get*Sheet` helpers).
- Avoid code comments unless the **why** is genuinely non-obvious — let tests document behavior.
- All identifiers, test names, comments, error messages, and documentation must be in **English** (see [AGENTS.md](AGENTS.md)).
