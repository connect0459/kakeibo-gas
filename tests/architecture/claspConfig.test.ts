import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoPath = (path: string): string =>
  fileURLToPath(new URL(`../../${path}`, import.meta.url));

const readRepoFile = (path: string): string =>
  readFileSync(repoPath(path), "utf8");

describe("clasp configuration", () => {
  it("is not tracked, so a contributor's project IDs stay out of the repository", () => {
    const tracked = execFileSync("git", ["ls-files", ".clasp.json"], {
      cwd: repoPath(""),
      encoding: "utf8",
    });

    expect(tracked.trim()).toBe("");
  });

  it("is ignored by the repository's own ignore rules", () => {
    const isIgnored = (): boolean => {
      try {
        execFileSync(
          "git",
          ["-c", "core.excludesFile=/dev/null", "check-ignore", "--no-index", "-q", ".clasp.json"],
          { cwd: repoPath("") },
        );
        return true;
      } catch {
        return false;
      }
    };

    expect(isIgnored()).toBe(true);
  });

  it("has an example with placeholder IDs that a contributor copies and fills in", () => {
    const example = JSON.parse(readRepoFile(".clasp.json.example"));

    expect(example.scriptId).toBe("YOUR_SCRIPT_ID");
    expect(example.parentId).toBe("YOUR_SPREADSHEET_ID");
  });
});
