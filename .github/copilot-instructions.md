# GitHub Copilot Instructions for springer

For full project conventions, see AGENTS.md in the repository root.

## PR Review

- **Anything under `docs/` has its own instructions**: see `.github/docs.instructions.md` for how plans and ADRs record decisions, why point-in-time statements are deliberate, why recorded refusals are not gaps, and why the preserved Scripter script in `docs/design/` is not maintained code. The done-plans rule lives there with the rest.
- **Zig has its own instructions**: see `.github/zig.instructions.md`.
- **GitHub Actions workflows have their own instructions**: see `.github/actions.instructions.md` for the pinning conventions, why `text-lint.yml` carries no `paths-ignore`, why its first job is inlined, and the measured layout of the `typos` release tarball.
- **Prettier `printWidth: 10000` is intentional**: This project uses a high `printWidth` in `.prettierrc.json` to prevent Prettier from wrapping lines. Combined with `proseWrap: preserve`, this preserves author line breaks. Do not suggest reducing printWidth to 80 or 120.
- **Prettier does not format Markdown here, and that is deliberate**: `.prettierignore` excludes `*.md` so markdownlint owns prose uncontested. Prettier's table reflowing and emphasis normalisation contend with `MD060`, `MD049`, and `MD050`. Do not suggest removing that entry.
