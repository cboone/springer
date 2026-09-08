# GitHub Copilot Instructions for springer

For full project conventions, see AGENTS.md in the repository root.

## PR Review

- **Done plans are historical records**: Files in `docs/plans/done/` are completed plan documents preserved for reference. They may not match the final implementation. Do not flag discrepancies between done plan content and the actual codebase.
- **Prettier `printWidth: 10000` is intentional**: This project uses a high `printWidth` in `.prettierrc.json` to prevent Prettier from wrapping lines. Combined with `proseWrap: preserve`, this preserves author line breaks. Do not suggest reducing printWidth to 80 or 120.
- **Prettier does not format Markdown here, and that is deliberate**: `.prettierignore` excludes `*.md` so markdownlint owns prose uncontested. Prettier's table reflowing and emphasis normalisation contend with `MD060`, `MD049`, and `MD050`. Do not suggest removing that entry.
