# springer

## Overview and state

Springer is a polyphonic diatonic chord generator: one trigger note produces one diatonic chord. It is authored as a CLAP note effect and projected through clap-wrapper to an AUv2 `aumi` for Logic Pro's MIDI FX slot. Repository, binary and bundle spelling is ASCII `springer`; display text is `Springer`.

This checkout contains the repository foundation, ADRs and the verbatim v4 Scripter reference. There is no `build.zig`, `build.zig.zon`, `src/` or `cmake/` yet. The permanent [build plan](docs/plans/todo/2026-09-08-build-springer-a-diatonic-chord-generator-midi-fx.md) owns sequencing, phase gates and verification. It stays in `todo/`. Phase 1 establishes both plugin formats, including the Audio Unit, before the musical engine.

## Settled constraints

Read the relevant [ADRs](docs/adr/) before implementation; supersede decisions with a new ADR rather than relitigating them in review.

- macOS on Apple Silicon only. Zig 0.16.0 will be pinned in `build.zig.zon`, which CI reads.
- Author CLAP once; `zig build` produces the CLAP, and CMake only wraps it. Generate bindings with `translate-c` after `zig cc -E -P`, with comptime ABI layout assertions.
- `src/music/` is a pure musical core and names no CLAP type. The engine may use sample offsets and note IDs but no CLAP structs. The build plan defines the source boundary and checks.
- No WebView UI. Nothing reachable from the audio thread allocates, locks or makes syscalls.
- Parameters use stable `clap_id`, never index or name. Each macro target has Start, End and Curve parameters; v4 constants are defaults, not code-level curves.
- Chord depth is a ladder and color is orthogonal. Non-seven-note scales stack by degree, not interval. Arpeggiation is downstream.
- The GUI is deferred; parameters are the interface. Do not depend on a host reporting its octave convention.

## Permanent identifiers

Host projects persist these values: CLAP ID `com.catamount.springer`, bundle identifier `com.cboone.springer`, AU type `aumi`, subtype `Sprg`, manufacturer `Ctmn` / `Catamount`, product/display name `Springer`. CLAP `features[0]` must be `note-effect`: clap-wrapper derives `aumi` from it. Preserve identifiers when adding declarations and document them as permanent there.

## Critical implementation and verification rules

- Preserve `docs/design/diatonic-chord-trigger-v4.js` verbatim. Prettier excludes `docs/design/`; do not remove that exclusion or format the normative script.
- Degree arithmetic uses `@divFloor` and `@mod` for negative pitches. `degreeOfPitch` returning the scale size is a valid next-octave result. Preserve both behaviors in reference vectors and guards.
- Reference-vector stubs need name-based `GetParameter`, index-based `SetParameter` and `MIDI.allNotesOff()`. Set `Openness Source` to Manual when generating vectors; macro curves deliberately differ from v4.
- The wrapper needs the note-effect fixes recorded in [development reference](docs/notes/development.md): use revision `1cca996e96f29ab2be7ae9f8cfe532bbc92e1dd6` or a verified later revision. Read the reference before host or wrapper work, including `auval` limitations and draft header requirements.
- A passing check with no inputs is not coverage. Read the reference before changing CI: it records the reusable text-workflow limitation and extensionless CMake script discovery requirements.

## Development

Only static analysis runs before the build foundation exists. Node 22+ is required and `.npmrc` enforces it. Use the package-lock-pinned tools through npm; Homebrew versions can disagree with CI.

```bash
npm ci
npm run lint
npm run lint:fix
typos
actionlint
gitleaks detect --no-banner
```

The npm package exists for text tooling only. Keep design-script exclusions intact during lint fixing. Text and secret checks intentionally have no `paths-ignore`; the future build workflow can exclude docs when the build files exist.

## Navigation and instruction maintenance

Read scoped instructions before editing a directory, including from a root session:

- [docs/AGENTS.md](docs/AGENTS.md): permanent plans, ADRs, the normative design script and specialized development reference.
- [.github/workflows/AGENTS.md](.github/workflows/AGENTS.md): CI prerequisites, discovery and verification limits.
- [Development reference](docs/notes/development.md): source layout and measured implementation traps.

Keep specialized details in reference docs, this root focused on operation and critical constraints, and each complete global/root/nested chain within 32 KiB. Preserve every `CLAUDE.md -> AGENTS.md` pair.
