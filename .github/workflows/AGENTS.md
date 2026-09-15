# CI workflow instructions

Read [development reference](../../docs/notes/development.md) before modifying workflow reuse or script discovery. It records the measured v3.0.0 text-workflow failure and its upstream issue; verify release status before replacing the inline job.

- Use the committed npm lockfile for text tools and satisfy the Node engine requirement. Do not substitute Homebrew tools for CI's versions.
- Keep text and secret checks free of `paths-ignore`. The build workflow arrives with `build.zig.zon` and reads `minimum_zig_version` there; do not invent a build check before its inputs exist.
- Extensionless helpers in `cmake/` need shebang-based discovery from `git ls-files`, not only `*.sh` globs or selected directory names.
- A shell check with no scripts establishes wiring only. Keep shellcheck on `PATH` for actionlint so shell blocks are examined.
- Preserve the `docs/design/` formatter exclusion; the Scripter file defines reference vectors.
