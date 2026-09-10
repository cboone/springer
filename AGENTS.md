# springer

## Overview

Springer is a diatonic chord generator: one trigger note in, one diatonic chord out, polyphonically. It is authored once as a CLAP note effect and projected outward by clap-wrapper to an AUv2 of type `aumi`, which is what Logic Pro's MIDI FX slot loads.

The product name, repository, binary and bundle are all ASCII `springer`, with the display name `Springer`. There is no diacritic, so the two agree and nothing needs a separate ASCII spelling.

It is deliberately not competing with Scaler, Cthulhu or InstaChord. It is a specialized instrument that works exactly one way.

## Current state

Phase 0 of eight. The repository foundation exists: agent config, lint configuration, three CI workflows, the thirteen ADRs, and the v4 Scripter script preserved verbatim.

**Nothing builds yet, and that is on purpose.** There is no `build.zig`, no `build.zig.zon`, no `src/`, no `cmake/`. Phase 1 adds them together with `ci.yml`, which cannot exist before `build.zig.zon` does because the Zig toolchain step reads its `minimum_zig_version`.

The sequencing, the phase gates and the verification program live in [the build plan](docs/plans/todo/2026-09-08-build-springer-a-diatonic-chord-generator-midi-fx.md), which stays in `todo/` permanently as the master document.

Phase 1 is the walking skeleton in both formats, and it deliberately puts the Audio Unit first rather than last. The `aumi` path is the largest unknown in the project, and proving it against an empty pass-through plugin is far cheaper than discovering a wrapper limitation after the musical engine is written.

## Non-negotiables

These are settled decisions recorded in [`docs/adr/`](docs/adr/). Do not relitigate them in code review; supersede them with a new ADR instead.

- **macOS on Apple Silicon only.** Not a portability oversight. Logic Pro is the target host and runs nowhere else. ([ADR 0001](docs/adr/0001-macos-on-apple-silicon-only.md))
- **Zig 0.16.0, pinned in `build.zig.zon`.** That file is the single source of truth and CI reads it rather than restating the version. ([ADR 0002](docs/adr/0002-zig-pinned-to-0-16-0.md))
- **Authored once as a CLAP, projected outward.** `zig build` alone produces a loadable `.clap`; CMake exists only to run clap-wrapper. ([ADR 0003](docs/adr/0003-author-clap-project-outward.md))
- **Bindings from `translate-c` over a `zig cc -E -P` step**, with comptime layout assertions over every struct crossing the ABI. ([ADR 0004](docs/adr/0004-clap-bindings-via-translate-c.md))
- **`src/music/` names no CLAP type, and a comptime assertion enforces it.** This is the seam that makes most of the plugin testable without a host. ([ADR 0005](docs/adr/0005-a-pure-musical-core-behind-a-seam.md))
- **No WebView UI.** ([ADR 0006](docs/adr/0006-reject-webview-ui.md))
- **Nothing reachable from the audio thread allocates, locks, or makes a syscall.** ([ADR 0007](docs/adr/0007-no-allocation-on-the-audio-thread.md))
- **Parameters are identified by stable `clap_id`, never by index or by name.** ([ADR 0008](docs/adr/0008-parameters-identified-by-stable-clap-id.md))
- **No macro curve constant lives in code.** Every target has Start, End and Curve parameters; v4's numbers survive only as defaults. ([ADR 0009](docs/adr/0009-macro-shaping-is-data-not-code.md))
- **Chord depth is a ladder; chord color is orthogonal to it.** ([ADR 0010](docs/adr/0010-chord-depth-is-a-ladder-color-is-orthogonal.md))
- **Non-7-note scales stack by degree, not by interval, and this is a feature.** ([ADR 0011](docs/adr/0011-non-7-note-scales-stack-by-degree.md))
- **Springer generates chords. Arpeggiation is downstream.** ([ADR 0012](docs/adr/0012-defer-arpeggiation-and-pattern-generation.md))
- **The GUI is deferred. The parameter set is the interface until it lands.** ([ADR 0013](docs/adr/0013-defer-the-gui.md))

## Identifiers, which are permanent

A host writes these into project files, so changing one after release makes the plugin read as missing in every project that used it. They are settled, and they are doc-commented as permanent at their declaration sites.

| Thing                | Value                    | Note                                                     |
| -------------------- | ------------------------ | -------------------------------------------------------- |
| Product name (ASCII) | `Springer`               | Names files, binaries and bundles                        |
| Display name         | `Springer`               | No diacritic, so the two agree                           |
| CLAP id              | `com.catamount.springer` | Vendor identity, shared with fosforo                     |
| Bundle identifier    | `com.cboone.springer`    | Signing identity, deliberately different                 |
| AU type              | `aumi`                   | MIDI processor. This is what Logic's MIDI FX slot loads. |
| AU subtype           | `Sprg`                   |                                                          |
| AU manufacturer      | `Ctmn` / `Catamount`     | Shared with fosforo                                      |
| CLAP `features[0]`   | `note-effect`            | Load-bearing: clap-wrapper derives `aumi` from it        |

## Structure

Present today:

```text
docs/
  adr/                     settled architecture decisions, 0001-0013
  design/
    diatonic-chord-trigger-v4.js   the Scripter script, verbatim and normative
  plans/todo/              active plans, including the master build plan
  plans/done/              completed plans, kept as historical records
```

Planned, from the build plan. Nothing below exists yet:

```text
build.zig                  three artifacts from one module factory
build.zig.zon              pins Zig 0.16.0; CI reads minimum_zig_version
cmake/CMakeLists.txt       clap-wrapper integration, the AUv2 build only
src/
  main.zig                 the host-facing boundary and exported entry points
  clap/                    THE ONLY PLACE A CLAP TYPE MAY BE NAMED
    c.zig                  translated ABI + comptime layout assertions
    plugin.zig             factory, descriptor, lifecycle, note ports, process
    params.zig             the clap.params extension and the parameter table
  music/                   THE SEAM. Numbers in, numbers out. No CLAP type.
    scale.zig              the scale table and degree arithmetic
    chord.zig              core + ladder construction, the avoid-note rule
    voicing.zig            inversion, spread, octave, bass, folding, de-duplication
    macro.zig              per-target start/end/curve mapping
    spelling.zig           degree-correct note names, for the eventual readout
  engine/                  sample offsets and note ids, but no CLAP struct
    scheduler.zig          fixed-capacity queue, absolute sample timestamps
    voices.zig             trigger-to-emitted-voices table, note-off matching
    transport.zig          beats from clap_process.transport; minimum-length gate
```

## Development

Everything that runs today is static analysis.

markdownlint and Prettier are pinned in `package.json` and installed from the committed `package-lock.json`, so local runs and CI agree on versions and `npm ci` enforces per-package integrity. Run them through npm rather than a Homebrew binary, which will be a different version.

Node 22 or later is required, since `markdownlint` and `markdownlint-cli2` both declare `engines.node: ">=22"`. CI runs Node 24. `.npmrc` sets `engine-strict=true`, so an older runtime fails at `npm ci` with `EBADENGINE` rather than surfacing later as a confusing error inside markdownlint.

```bash
npm ci                         # once; installs the pinned lint tools
npm run lint                   # markdownlint + prettier, the pinned versions
npm run lint:fix               # the same, fixing what can be fixed

typos                          # spell check; config in typos.toml
actionlint                     # the three workflows
gitleaks detect --no-banner    # secrets
```

`package.json` exists only for those two tools. Springer is Zig; this is not a Node project, and `node_modules/` is gitignored while both manifest files are tracked.

Three workflows exist. `text-lint.yml` runs the four tools above; `gitleaks.yml` and `trufflehog.yml` scan for secrets. None of them carries `paths-ignore`, deliberately: a check must not be able to skip the change that governs it, and in Phase 0 nearly every change is a Markdown change.

`ci.yml` arrives in Phase 1 and *will* carry `paths-ignore` for `docs/**` and `*.md`, correctly, because it is a set of macOS builds that a typo fix has no reason to trigger.

## Gotchas

Measured facts and traps, each recorded when it was found. Add to this list rather than fixing the same thing twice.

- **Use `@divFloor` and `@mod` in the degree arithmetic, never `/` and `%`.** JavaScript's `Math.floor` floors toward negative infinity; Zig's `/` and `%` on signed integers truncate toward zero. Get this wrong and every pitch below the reference root lands on the wrong degree. A later refactor to `/` would compile, pass any test that only plays above the root, and be wrong, which is why this needs a source canary and not only a unit test.
- **`degreeOfPitch` returning `N` is correct, not an off-by-one.** The v4 guard at `docs/design/diatonic-chord-trigger-v4.js:146` handles a pitch class nearer the *next* octave's root than this octave's last degree by returning a degree one full step past the last index. Carry it over unchanged.
- **`features[0]` decides the AU type.** clap-wrapper's `build-helper.cpp` maps it, and only `CLAP_PLUGIN_FEATURE_NOTE_EFFECT` yields `aumi`. Anything unrecognised falls back to `aumu` with a warning, producing a plugin that loads in the instrument slot rather than the MIDI FX slot. It fails by working wrongly, not by failing.
- **clap-wrapper must be pinned newer than fosforo's.** fosforo's `35f524b7` (2026-07-13) predates PRs #493, #497 and #498, which together make a note effect viable as an AUv2. Pin `1cca996e96f29ab2be7ae9f8cfe532bbc92e1dd6` (2026-08-08) or later.
- **`auval` will probably never see this plugin, and that is a clap-wrapper property rather than an `aumi` one.** Measured 2026-09-08: fosforo's own bundle declares `aufx`, Logic loads it, and `auval -s aufx` still does not list it. Logic is the only complete check of the Audio Unit; treat `auval` coverage as a bonus.
- **`clap.octave-number/1` is specified and implemented by nobody.** Measured 2026-09-08 against CLAP 1.2.10. A code search for `set_note60_octave` returns only vendored headers and language bindings, clap-wrapper has no reference to it, and AUv2 has no equivalent. Do not plan around being told the octave convention. See [ADR 0013](docs/adr/0013-defer-the-gui.md).
- **Draft CLAP extensions are not in `clap/clap.h`.** They live only in `clap/all.h`. `src/clap/clap_all.h` must reach for one deliberately.
- **Prettier formats `.js`, and the v4 script is a historical record.** `.prettierignore` excludes `docs/design/`. This is verified rather than assumed: with the ignore the file is skipped, and with `--ignore-path /dev/null` Prettier flags it and would rewrite it. Removing that entry would silently invalidate the Phase 2 reference vectors, which are generated by running that exact file.
- **`lint-text.yml` is not used on its default inputs, so `text-lint.yml`'s first job is inlined.** Its tool-install step reads `github.job_workflow_sha`, which arrives empty here, so on the default path the job fails before any linter runs. Tracked as [cboone/gh-actions#83](https://github.com/cboone/gh-actions/issues/83), still open at v3.1.0. Measured 2026-09-08 against v3.0.0: that job failed exactly this way while `lint-shell.yml`, `lint-github-actions.yml` and `scan-for-secrets.yml`, called the same way in the same run, all passed. None of those reads the context value, which points at the value rather than the call. One detail has changed since that measurement: at v3.0.0 the step was unconditional, and at v3.1.0 every step reading `job_workflow_sha` is guarded. `use-consumer-versions: true` skips the one that matters, as long as `preset` stays empty and `run-yamllint` stays false, and this repo already has the committed `package-lock.json` that path needs. That is read off the workflow's guards, not measured on a run, so treat it as the next thing to try rather than a known fix.
- **markdownlint from Homebrew is a different version from the one CI runs.** The pinned versions live in `package.json` and install from the committed lockfile. Run `npm run lint`, not the Homebrew binary, or a rule difference will show up only in CI. Homebrew was 0.21.0 here against a pinned 0.23.2.
- **`lint-shell.yml` does not look in `cmake/`.** It discovers `*.sh` and `*.bash` anywhere, plus extensionless scripts under `bin/`, `scripts/` and `script/` only. The two extensionless scripts Phase 1 adds under `cmake/` would go unlinted, which reads exactly like passing. Switch to shebang-based discovery when they land: `git ls-files -z | xargs -0 shfmt -f | xargs -r shellcheck`.
- **The Phase 0 shell job passes by finding nothing.** There are no shell scripts yet. It is wired, not exercised.
- **The Scripter stub for the reference vectors needs two lookups and a `MIDI` object.** `GetParameter` is keyed by name throughout the v4 script, `SetParameter` by index, and `Reset()` calls `MIDI.allNotesOff()`. The build plan's list of globals to stub omits the last of these.
- **Generate the reference vectors with `Openness Source` set to Manual.** The macro's curves are deliberately not bit-compatible with v4 ([ADR 0009](docs/adr/0009-macro-shaping-is-data-not-code.md)). Running the vectors through the macro would test the parts that must match exactly together with the parts that intentionally do not, and let a defect in one hide in the other.
- **`typos` has no inline directive.** A document that spells a misspelling out in order to explain it fails the check it is explaining. Wrap it in `<!-- spellchecker:off -->` and `<!-- spellchecker:on -->`. This is not hypothetical: the Phase 0 plan tripped it while describing this very entry.
