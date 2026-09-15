# Documentation instructions

- The [build plan](plans/todo/2026-09-08-build-springer-a-diatonic-chord-generator-midi-fx.md) is permanent and stays in `plans/todo/`. It owns phase sequencing, gates and the verification program.
- ADRs record settled architecture; supersede them with new ADRs rather than rewriting them. Completed plans remain historical records.
- `design/diatonic-chord-trigger-v4.js` is the verbatim, normative Scripter source. Preserve the entire `design/` formatting exclusion and never reformat or reword the script.
- [Development reference](notes/development.md) owns the planned source layout and measured traps. Read it before phase implementation, porting reference behavior, or interpreting host verification. Update current guidance in place while retaining measurement dates.
- For reference-vector tooling, preserve negative-degree arithmetic, next-octave results, the MIDI stub and Manual openness mode described in the root.
- Keep scoped instructions paired with `CLAUDE.md` symlinks, and complete instruction chains within 32 KiB. Do not move critical invariants into tool memory.
