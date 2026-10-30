# Security Policy

## Supported Versions

Only the latest release is supported with security fixes. As this project is pre-1.0, no long-term support window is guaranteed for older releases.

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Use GitHub's [private vulnerability reporting][private-report] feature, or email <connect0459@gmail.com>, to disclose issues confidentially. You can expect an acknowledgement within 7 days and a status update within 30 days.

**What to include:**

- A minimal, reproducible example (a spreadsheet layout or input rows) that triggers the issue.
- The version of `kakeibo-gas` you are running.
- A description of the impact.

[private-report]: https://github.com/connect0459/kakeibo-gas/security/advisories/new

## Scope

`kakeibo-gas` runs as a Google Apps Script bound to a user's own spreadsheet. The following classes of issues are in scope:

- **Formula or HTML injection** — spreadsheet cell content or dialog input that causes the script to write executable formulas or unescaped HTML into the UI.
- **Data loss** — input that causes the archive or initialize operations to delete or overwrite rows the user did not confirm.
- **Excessive OAuth scopes** — a change to `appsscript.json` that requests access beyond the spreadsheet the script is bound to.

The following are **out of scope**:

- Vulnerabilities in Google Apps Script, Google Sheets, or `clasp` themselves — report those to Google.
- Issues that require the attacker to already have edit access to the spreadsheet.

## Disclosure Policy

Once a fix is released, a GitHub Security Advisory will be published with full details. The typical timeline from report to public disclosure is 30 days, though this may be extended by mutual agreement when a fix requires significant changes.
