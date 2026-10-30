# Setup after clone
setup:
    npm ci
    pre-commit install

# Format source files in place
fmt:
    npm run format

# Lint and format check (Biome)
check:
    npm run check

# Type check
typecheck:
    npm run typecheck

# Run tests once
test:
    npm run test:run

# Bundle into dist/main.js for Google Apps Script
build:
    npm run build

# Verify code quality, types, tests, and build (mirrors CI)
verify: check typecheck test build
