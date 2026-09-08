<!-- markdownlint-disable MD041 -->

# Contributing to springer

This is a single-developer project, and the conventions below exist mostly so its author does the same thing twice. Contributions are welcome anyway.

Read [AGENTS.md](./AGENTS.md) first. It is the hub document: what the project is, what is settled, what is planned, and a list of traps already found.

## Reporting Issues

Open an issue with the host application and macOS version, what happened, and what you expected. For anything with a security dimension, follow [the security policy](./.github/SECURITY.md) instead.

## Settled Decisions

Thirteen decisions are recorded in [`docs/adr/`](./docs/adr/) and are not reopened in review. If one of them is wrong, the way to change it is a new ADR that supersedes it, not an edit to the original and not an exception in a pull request.

Several sections of the build plan record **refusals**: things the project has considered and declined, such as drop-2 voicing, arpeggiation, and per-degree chord overrides. Those are decisions, not gaps.

## Development Setup

### Requirements

Phase 0 needs only the static-analysis tools. The build toolchain arrives with the Phase 1 skeleton.

```bash
brew install typos-cli actionlint gitleaks shellcheck shfmt
npm ci   # markdownlint and Prettier, at the pinned versions
```

markdownlint and Prettier come from `package.json` and the committed `package-lock.json` rather than from Homebrew, so that local runs and CI agree on versions and `npm ci` can enforce per-package integrity. **Do not run the Homebrew `markdownlint-cli2`**: it will be a different version, and a rule difference will then show up only in CI.

That `package.json` exists for those two tools and nothing else. Springer is Zig.

From Phase 1 onward this also needs Zig 0.16.0 exactly (the pin lives in `build.zig.zon` as `minimum_zig_version`), CMake, and `clap-validator`.

### Checks

Everything that runs today is static analysis, and all of it runs in CI too.

```bash
npm run lint                   # markdownlint + Prettier, the pinned versions
npm run lint:fix               # the same, fixing what it can
typos                          # spell check
actionlint                     # the workflows
gitleaks detect --no-banner    # secrets
```

### Two files that must not be reformatted

`docs/design/diatonic-chord-trigger-v4.js` is the Logic Pro Scripter script this project is a rebuild of. It is preserved **verbatim**, it is the normative statement of the plugin's behavior, and Phase 2 generates its reference vectors by running that exact file under Node. `.prettierignore` excludes it. Do not tidy it, do not modernise it, and do not fix its ES5 style: it is ES5 because Scripter's engine is.

`docs/plans/done/` holds completed plans as historical records. They describe what was intended at the time and may not match what shipped. They are not updated to match.

## Code Style

Prose is one long line per paragraph; the editor handles visual wrapping. `MD013` is off and Prettier does not touch Markdown, so nothing will reflow a paragraph out from under a diff.

Tables are written in the aligned style that `MD060` pins: pad every cell so the pipes line up.

From Phase 1, `zig fmt` is the authority for Zig and there is no line-length limit.

## Commit Messages

[Conventional Commits](https://www.conventionalcommits.org/), for both commit subjects and pull request titles:

```text
<type>: <short description>
```

Types in use: `feat`, `fix`, `docs`, `refactor`, `test`, `build`, `ci`, `chore`, `style`.

All commits are GPG signed.

## Pull Request Process

Work the checklist in the pull request template. It lists the checks that exist today, and it grows a line per phase, so a stale template is itself a review finding.

### Branch Naming

`feature/*`, `fix/*`, `docs/*`, `refactor/*`, `test/*`, `chore/*`.
