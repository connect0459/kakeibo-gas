# Developer Guide

This document is a developer guide for the kakeibo-gas project, covering everything from setting up the development environment to day-to-day development workflows.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Development Environment Setup](#development-environment-setup)
4. [Project Structure](#project-structure)
5. [Development Workflow](#development-workflow)
6. [Build and Deploy](#build-and-deploy)
7. [Testing](#testing)
8. [Code Quality Management](#code-quality-management)
9. [Git Hooks](#git-hooks)
10. [Troubleshooting](#troubleshooting)
11. [References](#references)

## Overview

This project is a household budget management system built on Google Apps Script (GAS). It is developed locally in TypeScript, bundled with Rollup, and deployed to GAS with clasp.

### Main Tech Stack

- **Language**: TypeScript
- **Build tool**: Rollup
- **Test framework**: Vitest
- **Code quality**: Biome (Linter + Formatter)
- **Deployment tool**: clasp (Google's official CLI)
- **Git Hooks**: pre-commit

## Prerequisites

The following tools must be installed:

- **Node.js**: v22.12 or later (required by Vitest 5; the version CI uses is pinned in `.nvmrc`)
- **npm**: v8 or later
- **Git**: v2.30 or later
- **Google account**: An account that can enable the Google Apps Script API

## Development Environment Setup

### 1. Clone the repository

```bash
git clone https://github.com/connect0459/kakeibo-gas.git
cd kakeibo-gas
```

### 2. Install dependencies

```bash
npm install
```

### 3. Enable the Google Apps Script API

To use clasp, you need to enable the Google Apps Script API.

1. Go to the [Google Apps Script API](https://script.google.com/home/usersettings) settings
2. Turn **on** "Google Apps Script API"

### 4. Log in to clasp

Authentication with your Google account is required the first time only.

```bash
npx clasp login
```

A browser opens and asks you to log in with your Google account. Once you approve, the credentials are saved to `~/.clasprc.json`.

### 5. Create your own Apps Script project

`.clasp.json` holds the IDs of your Apps Script project and its spreadsheet, so it is not tracked by git (it is listed in `.gitignore`). Until it exists, `clasp push` has no project to push to. Create it in one of two ways:

- **New project**: create a spreadsheet-bound project and a new spreadsheet with it.

  ```bash
  npx clasp create --type sheets --title "kakeibo-gas"
  ```

- **Existing project**: copy the example and fill in your own IDs.

  ```bash
  cp .clasp.json.example .clasp.json
  ```

  `scriptId` is under Project Settings in the Apps Script editor, and `parentId` is the spreadsheet's ID in its URL (`https://docs.google.com/spreadsheets/d/<ID>/edit`).

Do not commit `.clasp.json`. After `clasp create`, run `git diff appsscript.json` and discard any change you did not mean to make; `clasp push` uploads that file to your project. Before the first push, run `npx clasp status` and check that the files listed under "Tracked files" are only `appsscript.json` and `dist/main.js`.

### 6. Set up Git Hooks

Enable the pre-commit hooks.

```bash
# Install pre-commit (if not yet installed)
brew install pre-commit  # macOS
# or
pip install pre-commit   # If you have a Python environment

# Install the hooks
pre-commit install
```

## Project Structure

```text
kakeibo-gas/
├── .clasp.json              # Your clasp configuration (not tracked; see setup step 5)
├── .clasp.json.example      # Template for .clasp.json with placeholder IDs
├── .claspignore             # Files that clasp should not push
├── .pre-commit-config.yaml  # pre-commit configuration
├── appsscript.json          # GAS project configuration
├── biome.json               # Biome configuration (lint/format)
├── package.json             # npm package configuration
├── rollup.config.js         # Rollup build configuration
├── tsconfig.json            # TypeScript configuration
├── vitest.config.ts         # Vitest test configuration
├── docs/                    # Documentation
│   ├── ARCHITECTURE.md      # Architecture design
│   ├── development.md       # Developer guide (this file)
│   └── adrs/                # Architecture Decision Records
├── src/                     # Source code
│   ├── main.ts              # Entry point
│   ├── types.ts             # Type definitions
│   ├── types/               # Type definitions (details)
│   └── features/            # Code by feature (Package by Features)
│       └── archive/         # Archive feature
├── tests/                   # Test code
│   ├── __mocks__/           # Mocks (GAS globals, etc.)
│   │   └── gas-globals.ts
│   └── integration/         # Integration tests
├── dist/                    # Build artifacts
│   └── main.js              # Bundled JS file
└── coverage/                # Test coverage reports
```

### Key Files

#### `.clasp.json`

The clasp configuration file. It contains your GAS project's script ID and the parent spreadsheet ID. It is local to each developer and ignored by git; [`.clasp.json.example`](../.clasp.json.example) is the tracked template (see [Create your own Apps Script project](#5-create-your-own-apps-script-project)).

#### `.claspignore`

Specifies the files excluded when running clasp push. Basically, only `dist/**/*.js` and `appsscript.json` are pushed.

#### `rollup.config.js`

Configuration for bundling the TypeScript source for GAS. Key points:

- `removeExports` plugin: GAS does not support ES Modules `export` statements, so they are removed after the build
- Target: ES2020 (compatible with GAS's V8 runtime)

#### `appsscript.json`

The GAS project manifest file. It specifies the time zone and runtime version.

```json
{
  "timeZone": "Asia/Tokyo",
  "runtimeVersion": "V8"
}
```

## Development Workflow

### Basic Development Flow

1. **Create a branch**

   ```bash
   git checkout -b feat-your-feature-name
   ```

2. **Edit the code**
   - Edit the TypeScript files under `src/`
   - Add tests under `tests/` as needed

3. **Run the tests**

   ```bash
   npm test                # Watch mode
   npm run test:run        # Run once
   ```

4. **Check code quality**

   ```bash
   npm run check           # Check with Biome
   npm run check:fix       # Auto-fix
   npm run typecheck       # TypeScript type check
   ```

5. **Build**

   ```bash
   npm run build           # Production build
   npm run dev             # Watch mode (during development)
   ```

6. **Deploy to GAS**

   ```bash
   npx clasp push          # Upload the code to GAS
   npx clasp open          # Open the GAS editor in the browser
   ```

7. **Commit**

   ```bash
   git add .
   git commit -m "feat: add new feature"  # Conventional Commits format
   git push origin feat-your-feature-name
   ```

### Useful Commands During Development

```bash
# Watch for file changes and build automatically
npm run dev

# View tests in the UI
npm run test:ui

# Run tests with coverage
npm run test:run -- --coverage

# Pull the GAS project locally
npx clasp pull

# Show GAS logs
npx clasp logs
```

## Build and Deploy

### Local Build

Rollup bundles the TypeScript and generates `dist/main.js`.

```bash
npm run build
```

**Build flow:**

1. Load `src/main.ts` as the entry point
2. Transpile TypeScript (ES2020)
3. Resolve dependencies and bundle
4. Remove `export` statements that GAS does not support
5. Output to `dist/main.js`

### Deploying to GAS

Upload the code to GAS using clasp.

```bash
# Build, then push
npm run build
npx clasp push

# Or develop while watching for file changes
npm run dev    # In a separate terminal
npx clasp push --watch  # Auto-push (clasp v2.4.0 or later)
```

**Notes:**

- Files other than those specified in `.claspignore` are not pushed
- Only `dist/main.js` and `appsscript.json` are uploaded to GAS
- Always run `npm run build` before pushing

### Managing Deployments

```bash
# List deployments
npx clasp deployments

# Create a new deployment
npx clasp deploy -d "v1.0.0"

# Manage versions
npx clasp versions
npx clasp version "Description of v1.0.0"
```

## Testing

### Running Tests

```bash
# Watch mode (during development)
npm test

# Run once
npm run test:run

# UI mode
npm run test:ui

# Measure coverage
npm run test:run -- --coverage
```

### Writing Tests

#### Basic Test Structure

```typescript
import { describe, it, expect } from "vitest";
import { yourFunction } from "../src/features/your-feature";

describe("yourFunction", () => {
  it("should return expected value", () => {
    const result = yourFunction("input");
    expect(result).toBe("expected");
  });
});
```

#### Mocking GAS Functions

GAS global functions (such as `SpreadsheetApp`) are mocked in `tests/__mocks__/gas-globals.ts`.

```typescript
// Use the mocks defined in tests/__mocks__/gas-globals.ts
import { describe, it, expect, vi } from "vitest";

describe("GAS function test", () => {
  it("should use mocked SpreadsheetApp", () => {
    // Mocks are loaded automatically (specified in setupFiles of vitest.config.ts)
    const sheet = SpreadsheetApp.getActiveSheet();
    expect(sheet).toBeDefined();
  });
});
```

### Test File Placement

- **Integration tests**: `tests/integration/*.test.ts`
- **Unit tests**: `src/**/*.test.ts` (in the same directory as the source code)

### Coverage Goals

The following are informal goals; they are not enforced by the test configuration:

- **Line coverage**: 80% or higher
- **Branch coverage**: 75% or higher
- **Function coverage**: 80% or higher

Coverage reports are generated in the `coverage/` directory.

## Code Quality Management

### Lint/Format with Biome

Biome is a tool that integrates a linter and a formatter.

#### Run Lint Only

```bash
npm run lint
```

#### Run Format Only

```bash
npm run format
```

#### Lint + Format + Auto-fix

```bash
npm run check           # Check only
npm run check:fix       # Auto-fix
```

### TypeScript Type Checking

```bash
npm run typecheck
```

Strict type checking is enabled:

- `strict: true`
- `noImplicitAny: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noImplicitReturns: true`

### Coding Conventions

#### Indentation and Formatting

- **Indentation**: 2 spaces
- **Line length**: 100 characters
- **Semicolons**: Required
- **Quotes**: Double quotes
- **Trailing commas**: Required

#### Naming Conventions

- **Variables/functions**: camelCase (`getUserData`)
- **Types/interfaces**: PascalCase (`UserData`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)

#### Comments

- Write all comments, documentation, and messages in English
- Describe functions and classes in **TSDoc format**

```typescript
/**
 * Retrieves user data.
 *
 * @param userId - The user ID
 * @returns The user data object
 */
function getUserData(userId: string): UserData {
  // ...
}
```

## Git Hooks

### pre-commit

The following checks run automatically before each commit:

1. **Biome check**: Code style and lint rules
2. **TypeScript type check**: Detect type errors
3. **End-of-file newline**: Auto-fixed
4. **Whitespace removal**: Remove unnecessary trailing whitespace
5. **YAML check**: Validate YAML syntax
6. **JSON check**: Validate JSON syntax
7. **Merge conflict check**: Detect conflict markers

If there are errors, the commit is aborted.

### Temporarily Disabling Hooks

Use only in emergencies.

```bash
git commit --no-verify -m "commit message"
```

## Troubleshooting

### clasp push fails

**Symptom**: An "Invalid code" error with `clasp push`

**Solution**:

1. Check that the build ran correctly

   ```bash
   npm run build
   cat dist/main.js  # Check that no export statements remain
   ```

2. Check that `.claspignore` is configured correctly
3. Check that `appsscript.json` is in the correct format

### GAS functions are not found in tests

**Symptom**: Errors such as `SpreadsheetApp is not defined`

**Solution**:

1. Check that `setupFiles` in `vitest.config.ts` is correct
2. Check that `tests/__mocks__/gas-globals.ts` exists
3. Add mocks as needed

### pre-commit hooks do not work

**Symptom**: The pre-commit hooks do not run

**Solution**:

```bash
# Reinstall the hooks
pre-commit uninstall
pre-commit install

# Run the checks manually
pre-commit run --all-files
```

### TypeScript import errors

**Symptom**: `Cannot find module 'xxx'`

**Solution**:

```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Reinstall the type definitions
npm install --save-dev @types/google-apps-script
```

### Build error: `export` remains

**Symptom**: `export` statements remain in the built file

**Solution**:

Check that the `removeExports` plugin in `rollup.config.js` is working correctly.

## References

### Official Documentation

- [Google Apps Script Official Documentation](https://developers.google.com/apps-script)
- [clasp Official Repository](https://github.com/google/clasp)
- [Biome Official Documentation](https://biomejs.dev/)
- [Vitest Official Documentation](https://vitest.dev/)
- [Rollup Official Documentation](https://rollupjs.org/)

### Articles

- [How to Develop GAS in a Local Environment - Qiita](https://qiita.com/yonaka15/items/c63653af71eb8e20c2bb)

### In-Project Documentation

- [README.md](../README.md) - Project overview and setup
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture design
- [ADRs](./adrs/) - Architecture Decision Records

---

## Feedback and Questions

If you have any problems or questions during development, please give feedback through the following channels:

- **Issue**: [GitHub Issues](https://github.com/connect0459/kakeibo-gas/issues)
- **Pull Request**: Improvement suggestions are welcome

Happy coding! 🚀
