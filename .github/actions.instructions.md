---
applyTo: ".github/workflows/*.yml,.github/actions/**"
---

# Reviewing this project's workflows

Most of what looks like a defect in these files is a deliberate convention, and several of the facts below have been measured rather than assumed.

- **The `typos` release tarball is a flat archive, and `tar -xzf typos.tar.gz ./typos` is correct.** Verified against `typos-v1.50.1-x86_64-unknown-linux-musl.tar.gz`, whose members are `./`, `./LICENSE-APACHE`, `./LICENSE-MIT`, `./doc/*`, `./typos` and `./README.md`. There is no top-level version directory. Do not suggest extracting the whole archive and searching for the binary.
- **Naming a single tar member is the stricter behavior, not the riskier one.** The step verifies the tarball's SHA256 *before* untarring, so the archive reaching `tar` is byte-identical to the one whose layout is recorded above or the run has already failed. Extracting one known path also fails loudly if upstream restructures the archive, where globbing for "the first binary found" would install whatever it turned up. Do not suggest replacing an exact member path with a search.
- **Pinned tool versions carry a pinned SHA256 as well, deliberately.** A release asset can be replaced in place under the same tag, so the version alone is not a pin. Do not suggest dropping the checksum as redundant, and do not suggest `latest`.
- **Third-party actions are pinned by commit SHA with a `# vX.Y.Z` trailing comment.** Do not suggest replacing the SHA with the tag; the comment is what makes the pin readable, not a substitute for it.
- **`text-lint.yml` carries no `paths-ignore`, and that is the point.** A check must not be able to skip the change that governs it: `typos.toml`, `.markdownlint-cli2.jsonc`, `.prettierignore` and the workflow itself all live inside the set these jobs scan, and nearly every change in this repository is currently a Markdown change. Do not suggest adding `paths-ignore` here. The build workflow arriving in Phase 1 *will* carry one, correctly, because it is a set of macOS builds.
- **The `text` job is inlined rather than calling `cboone/gh-actions/.../lint-text.yml`, on purpose.** That reusable workflow reads `github.job_workflow_sha`, which arrives empty, in an unconditional step, so it fails before any linter runs. Tracked as `cboone/gh-actions#83`, unfixed in any release. Do not suggest converting it back to a reusable call while that issue is open.
- **`package.json` exists for markdownlint and Prettier only.** This is a Zig project, not a Node one. The manifests are tracked so CI and local runs agree on versions and `npm ci` can enforce per-package integrity. Do not suggest removing them, adding application dependencies, or treating this as a JavaScript project.
- **There is no `ci.yml` yet, and its absence is deliberate.** The Zig build workflow reads `minimum_zig_version` from `build.zig.zon`, which does not exist until Phase 1. Do not suggest adding a build or test workflow before then.
- **Jobs run on `ubuntu-latest` unless they need macOS.** This is platform-independent static analysis and the macOS runner bills at ten times the rate. Do not suggest matrixing these jobs across operating systems.
