<!-- # PULL_REQUEST_TEMPLATE -->

<!-- Remove unnecessary sections to keep the review focused -->

## Related Links

- Issues
  - <!-- <https://github.com/connect0459/kakeibo-gas/issues/xxx> -->
- PRs
  - <!-- <https://github.com/connect0459/kakeibo-gas/pull/xxx> -->

## [Required] Overview

- Describe the problem being solved, its background, and what changes when this PR is merged.

## Scope of Change

- [ ] `src/features/*`
- [ ] `src/main.ts` (menu, sheet I/O)
- [ ] Spreadsheet layout (sheet names, columns, config sheet schema)
- [ ] Tooling / CI
- [ ] Documentation

## Breaking Changes

- [ ] No breaking changes
- [ ] Breaking changes (describe below)

<!--
If this changes the spreadsheet layout or the config sheet schema, describe what existing users must do to migrate.
-->

## Deferred Items and TODOs

- Items intentionally deferred and the reasons why.

```txt
If you deferred something due to time constraints, document it here.
Reviewers cannot tell whether something was intentionally skipped or overlooked
without this information.
```

## Test Items

- Describe the tests added, following Red/Green TDD.
- Confirm `npm run check`, `npm run typecheck`, and `npm run test:run` all pass.

## [Required] Quality Checklist

**Please check all items before merging.**

- [ ] **CI Workflow Execution**: Full quality check completed by manually running `Run workflow` in [Actions](../actions/workflows/ci.yml)
- [ ] **Code Comments**: Code comments and function/method-level doc-comments are in sync with the changes
- [ ] **Documentation**: README / `docs/` / `CHANGELOG.md` updated when behavior changes.

> **Important**: This checklist ensures quality. Please verify all items before requesting review.
