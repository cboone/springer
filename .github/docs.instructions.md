---
applyTo: "docs/**/*.md"
---

# Reviewing this project's plans and ADRs

These files are a decision record, not specification prose. Most of what looks like a defect in them is a deliberate convention.

- **Plans and ADRs state measured facts at a point in time, and that is the format working correctly.** A sentence like "measured 2026-09-08" or "no host implements it" is a record of what was true when it was written, carrying its own date so a later reader can decide whether to re-measure. **Do not suggest making them conditional, hedged, or future-proof.**
- **ADRs are superseded, not edited.** A decision that has changed gets an amendment section at the foot of the file; the original text stays standing even where a later section contradicts it. Do not suggest reconciling the two, and do not flag the contradiction as an inconsistency.
- **Refusals are recorded on purpose.** Sections that say what the project will not do, and why, are load-bearing. Drop-2 voicing, arpeggiation, per-degree chord overrides and the WebView UI are all recorded refusals rather than gaps. Do not suggest implementing them; suggest a superseding ADR if there is a genuine new reason.
- **Done plans are historical records.** Files in `docs/plans/done/` are completed plan documents preserved for reference. They may not match the final implementation. Do not flag discrepancies between done plan content and the actual codebase. **This covers `path:line` citations**, which were accurate when written. A `path:line` citation in a **todo** plan or an ADR is a claim about current code and may be checked.
- **Prose is one long line per paragraph.** `MD013` is disabled in `.markdownlint-cli2.jsonc`, and `.prettierignore` excludes `*.md` so Prettier does not reflow it either. Do not suggest hard-wrapping at any column.
- **Tables use the aligned style** that `MD060` pins. Cells are padded so the pipes line up.
- **`docs/design/diatonic-chord-trigger-v4.js` is preserved verbatim and is not maintained code.** It targets Logic Pro's Scripter, whose globals (`NoteOn`, `NoteOff`, `ControlChange`, `Trace`, `GetParameter`, `GetTimingInfo`, `MIDI`) are undeclared by design, and it is ES5 because Scripter's engine is. Do not flag `var`, the absent `'use strict'`, the undeclared identifiers, the unused parameters, or the formatting. It is the normative statement of the plugin's behavior and the input to the Phase 2 reference vectors; changing it would invalidate both. `.prettierignore` excludes it for this reason.
