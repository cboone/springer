<!-- markdownlint-disable MD041 -->

## Description

<!-- Describe your changes -->

## Related Issue

<!-- Link to the issue this PR addresses -->

Fixes #

## Type of Change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update

## Checklist

The checks below are the ones that exist today. Each phase adds its own line as
it lands, so this list is a running record of the verification program rather
than boilerplate.

- [ ] I have read the [CONTRIBUTING](../CONTRIBUTING.md) guide
- [ ] The spell check passes (`typos`)
- [ ] markdownlint passes (`markdownlint-cli2 "**/*.md"`)
- [ ] Prettier passes (`prettier --check .`)
- [ ] `actionlint` is silent
- [ ] If I touched a shell script, `shfmt -d` and `shellcheck` are both silent
- [ ] I have updated CHANGELOG.md if this is a user-facing change
- [ ] I have updated the documentation if needed
- [ ] If this changes a settled architecture decision, I have added a superseding ADR in `docs/adr/`
- [ ] If I touched `docs/design/`, I have confirmed the preserved v4 script is byte-identical
