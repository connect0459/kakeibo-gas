# AGENTS.md / CLAUDE.md

## Language Convention

This project is released publicly. All of the following must be written in **English**:

- Commit messages
- Code comments
- Documentation (including `AGENTS.md`, `README.md`, etc.)
- Test names
- Error messages

User-facing spreadsheet text (menu items, dialogs, sheet names, headers) is being moved behind a locale dictionary; do not add new hard-coded literals in any language.

## Before Starting Development

Before making changes, read `CONTRIBUTING.md` and run `just --list` to learn the commands this project uses for setup, formatting, linting, building, and testing. Use those commands rather than reaching for ad-hoc equivalents.

## Development Philosophy

### Red/Green TDD (Detroit school)

- Red → Green → Refactor cycle strictly followed
- Use real objects; mocks are only permitted at external boundaries (GAS globals such as `SpreadsheetApp`)
- Write tests BEFORE implementation; run tests AFTER implementation
- Discuss coverage targets with the user before starting implementation

### Architecture

- Package by Features: `src/features/<feature>/` holds each feature's logic, types, and tests; `src/main.ts` is the GAS entry point.
- Keep spreadsheet I/O at the edges; aggregation, date, and filtering logic stays pure and testable without GAS globals.
- See `docs/ARCHITECTURE.md` and `docs/adrs/` for decisions.

### Domain Object Design

- Rich domain objects: pair data and logic in the same type
- Prefer immutability; avoid mutable state unless necessary
- Distinguish entities (identity-based) from value objects (value-based)
- Enforce the boundary between pure logic and spreadsheet I/O through plain data types; pure code never depends on GAS globals

### Evergreen Tests

- Test names describe WHAT business rule is being verified, not HOW
- Test names must not reference implementation details
- Error messages describe a concrete operation or state, not the name of the function that produced them; renaming that function must never obligate an error-string edit
- Test code serves as living documentation of the system's behavior

### Code Comments

- Do NOT write code comments unless explicitly permitted by the user
- Let the code speak for itself; let tests document the behavior
- Code = How, Tests = What, Commit messages = Why

## Git Conventions

### Format

```text
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type | Description |
| :--- | :--- |
| `feat` | New feature (source code) |
| `fix` | Bug fix (source code) |
| `docs` | Documentation only |
| `style` | Code style (formatting, whitespace) |
| `refactor` | Code change that is neither a fix nor a feature |
| `tidy` | Small, safe cleanup (< 2 min; no behavior change) |
| `test` | Adding or updating tests |
| `chore` | Build process, tooling, config, and dependency changes |
| `ci` | CI/CD pipeline changes (GitHub Actions, workflows) |
| `perf` | Performance improvement |

Do not use `fix(deps)` / `fix(ci)`; use `chore` for dependencies and build tooling and `ci` for workflows.

### Scopes

Scope is optional; use the feature directory name when the change targets a specific feature (e.g., `aggregation`, `archive`, `config`, `date`). Omit for project-wide changes.

### Type vs. Scope Precedence

The type vocabulary above mixes two axes: an **impact axis** (`feat`, `fix`, `perf`, `refactor` — the SemVer-relevant effect of a change) and a **domain axis** (`docs`, `style`, `test`, `chore`, `ci`, `tidy` — a layer with no runtime/SemVer effect). When a change is fully contained within a domain, use that domain as `type` (e.g. `docs: fix typo`); do not use it as `scope` on an impact-axis type (avoid `fix(docs): ...`). `scope` sub-divides whatever `type` already established (e.g. `feat(aggregation)`); it is not a substitute classification axis. This also matches how release automation typically bumps versions from `type` alone, without inspecting `scope`.

### Subject Line

- Imperative mood: "add", "fix", "remove"
- 72 characters max, no trailing period

### Body and Footer (optional)

- Explain **why**, not what
- `BREAKING CHANGE: <description>`, or `Closes #123`

### Branch naming

`feat/xxx`, `fix/xxx`, `docs/xxx`
