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

---

[Unreleased]: <https://github.com/connect0459/kakeibo-gas/commits/main>
