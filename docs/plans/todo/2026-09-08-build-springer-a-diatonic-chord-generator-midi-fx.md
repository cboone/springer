# Build Springer, a diatonic chord generator MIDI FX

## Context

A Logic Pro Scripter script has been in daily use and has grown past what Scripter can comfortably carry. It takes one note in and emits one diatonic chord out, with the key hard-wired to F# natural minor, and it now carries an "Open Macro" that drives five voicing axes at once so a section can be automated from closed and tight to open and bright. The script is reproduced verbatim as `docs/design/diatonic-chord-trigger-v4.js`; it is the normative statement of what the plugin must do, not a sketch.

Scripter's limits are the reason to leave it. Parameters bind to array **index**, so the parameter order is frozen and every future control must be appended. Scale and key are constants in the source. There is no persistent state beyond a Scripter preset. There is no way to show the chord currently sounding. And the script only exists inside Logic.

Springer is that script, rebuilt as a real plugin: key and scale selectable, the macro's shaping made into data rather than constants, and the whole thing authored once as a CLAP so it runs in Logic's MIDI FX slot as an Audio Unit and in a CLAP host for development. It is deliberately not competing with Scaler, Cthulhu, or InstaChord. It is a specialized instrument that works exactly one way.

The sibling project [`fosforo`](https://github.com/cboone/fosforo) (`~/Development/fosforo`) is the precedent for everything structural: Zig 0.16.0, CLAP authored directly against the C API, clap-wrapper projecting outward to an AUv2, and a documentation and verification culture that this plan adopts wholesale.

## What we are building

One trigger note produces one diatonic chord, polyphonically: several held triggers give several simultaneous chords. The whole keyboard is the chord zone. Chord quality is never configured per chord; it falls out of the selected scale, so degree 0 of F# Aeolian gives F#m and degree 2 gives A major with no per-chord data anywhere.

Two controls define the chord itself and they are orthogonal. **Chord Tones** is a depth ladder from 2 to 6, stacking alternating scale degrees. **Chord Color** selects among Normal, Sus2, Sus4, Sixth, and Shell. That pair subsumes all five of the older script's discrete shapes: Normal at 2 tones is the root-and-fifth "Fifths" voicing, Normal at 3 is the triad, Normal at 4 the seventh, Normal at 5 the ninth, and Shell at 2 the root-and-seventh shell.

**Open Macro** is the performance control. One lane, automated across a section, moves chord depth, voicing spread, inversion, velocity tilt, strum, chord color, bass note, and minimum chord length together along per-target curves. Unlike the script, none of the shaping is baked into code: every target has Start, End, and Curve parameters, and v4's numbers survive only as their default values.

## Locked decisions

These become numbered ADRs in `docs/adr/` during Phase 0, following fosforo's format (`## Context` / `## Decision` / `## Consequences`, superseded by amendment rather than edited).

| ADR  | Decision                                                                                                |
| ---- | ------------------------------------------------------------------------------------------------------- |
| 0001 | macOS on Apple Silicon only. Not a portability oversight.                                               |
| 0002 | Zig pinned to 0.16.0; `build.zig.zon` is the single source of truth and CI reads it.                    |
| 0003 | The plugin is authored once, as a CLAP note effect. clap-wrapper projects it outward to an AUv2 `aumi`. |
| 0004 | CLAP bindings come from `translate-c` over a `zig cc -E -P` preprocessing step.                         |
| 0005 | The musical core is pure and names no CLAP type. `src/music/` is the seam.                              |
| 0006 | No WebView UI.                                                                                          |
| 0007 | Nothing reachable from the audio thread may allocate, lock, or make a syscall.                          |
| 0008 | Parameters are identified by stable `clap_id`, never by index or by name.                               |
| 0009 | Macro shaping is per-target Start, End, and Curve parameters. No curve constant lives in code.          |
| 0010 | Chord depth is a ladder; chord color is orthogonal to it.                                               |
| 0011 | Non-7-note scales stack by degree, not by interval, and this is a feature.                              |
| 0012 | Springer is a chord generator. Arpeggiation and pattern generation are deferred.                        |
| 0013 | The GUI is deferred. The parameter set is the interface until it lands.                                 |

## Identifiers, which are permanent

A host writes these into project files, so changing one after release makes the plugin read as missing in every project that used it. They are settled here and doc-commented as permanent at their declaration sites, exactly as `fosforo` does in `src/clap/plugin.zig`.

| Thing                | Value                    | Note                                                     |
| -------------------- | ------------------------ | -------------------------------------------------------- |
| Repository           | `scaler`                 | Stays as-is; the product name diverges on purpose.       |
| Product name (ASCII) | `Springer`               | Names files, binaries, and bundles.                      |
| Display name         | `Springer`               | No diacritic, so the two agree.                          |
| CLAP id              | `com.catamount.springer` | Vendor identity shared with fosforo.                     |
| Bundle identifier    | `com.cboone.springer`    | Signing identity, deliberately different.                |
| AU type              | `aumi`                   | MIDI processor. This is what Logic's MIDI FX slot loads. |
| AU subtype           | `Sprg`                   |                                                          |
| AU manufacturer      | `Ctmn` / `Catamount`     | Shared with fosforo.                                     |
| CLAP `features[0]`   | `note-effect`            | Load-bearing: clap-wrapper derives `aumi` from it.       |

`features` is `{ note-effect, utility }`. The first entry is not cosmetic. `src/detail/auv2/build-helper/build-helper.cpp` in clap-wrapper maps `features[0]` to the AU type, and only `CLAP_PLUGIN_FEATURE_NOTE_EFFECT` yields `aumi`; anything unrecognized falls back to `aumu` with a warning. The `AUV2_INSTRUMENT_TYPE "aumi"` argument to `make_clapfirst_plugins` is set as well, belt and braces.

## Build architecture

Follows fosforo's shape closely enough that `build.zig`, `cmake/CMakeLists.txt`, `macos/Info.plist`, `packaging/distribution.xml`, and most of `scripts/` start as adaptations rather than new work.

- `build.zig` is the primary build and the task runner. Three artifacts from one module factory: a static `springer_impl` (all CMake wants), a dynamic library exporting `clap_entry` and packaged as `Springer.clap`, and an offline-host harness executable.
- `cmake/CMakeLists.txt` exists only to run clap-wrapper and emit `Springer.component`. `set(SPRINGER_FORMATS CLAP AUV2)`.
- Deployment target macOS 11.0, stated in `build.zig`, `cmake/CMakeLists.txt`, `macos/Info.plist`, and `packaging/distribution.xml`, which must stay in step.
- Ad-hoc code signing is a build step, `/usr/bin/codesign` by absolute path, `--timestamp --options runtime` added only when a real identity is supplied.
- Build provenance stamped at configure time via `b.runAllowFail`, read back by `scripts/read-provenance`. This solves the multi-worktree, one-plug-in-folder hazard, which is identical here.
- Every `install-*` step builds exactly what it installs, copies it to `~/Library/Audio/Plug-Ins`, and prints the hash of what landed. Every other step stays in the worktree.

**clap-wrapper must be pinned to a newer commit than fosforo's.** fosforo pins `35f524b771ec09f54c164720bb90f271273b37d3`, dated 2026-07-13, which predates the three PRs that make a note effect viable as an AUv2:

| PR   | Merged     | What it adds                                                                         |
| ---- | ---------- | ------------------------------------------------------------------------------------ |
| #493 | 2026-07-30 | AUv2 full MIDI 1.0 and MIDI 2.0 (UMP) input and output, dialect negotiation          |
| #497 | 2026-07-30 | A silent stereo in/out facade for effects with no audio ports, so `auval` passes     |
| #498 | 2026-08-03 | Silence buffers created cleared, so reconfiguration cannot feed uninitialized memory |

Pin `1cca996e96f29ab2be7ae9f8cfe532bbc92e1dd6` (2026-08-08) or later, which contains all three. Record the reason in the CMake file the way fosforo records why it pins a commit rather than a tag.

## Source layout

```text
src/
  main.zig               the host-facing boundary and exported entry points
  build_info.zig         branch, commit, dirty state           (adapted from fosforo)
  canary.zig             reads a file's own source as text      (adapted from fosforo)
  host_harness.zig       offline host: drives process() with synthetic events
  clap/
    c.zig                translated CLAP ABI + comptime layout assertions
    clap_all.h           umbrella header fed through zig cc -E
    plugin.zig           factory, descriptor, lifecycle, note ports, process
    params.zig           the clap.params extension and the parameter table
    state.zig            versioned save/load                    (adapted from fosforo)
    log.zig              diagnostics through the host's clap.log (adapted from fosforo)
  music/                 THE SEAM. No CLAP type may be named at or above this level.
    scale.zig            the scale table and degree arithmetic
    chord.zig            core + ladder construction, the avoid-note rule
    voicing.zig          inversion, spread, octave, bass, folding, de-duplication
    macro.zig            per-target start/end/curve mapping
    spelling.zig         degree-correct note names, for the eventual readout
  engine/
    scheduler.zig        fixed-capacity event queue with absolute sample timestamps
    voices.zig           trigger-to-emitted-voices table and note-off matching
    transport.zig        beats from clap_process.transport; the minimum-length gate
  platform/
    io.zig               the one std.Io instance               (adapted from fosforo)
```

`src/music/` is the load-bearing seam and the reason most of this plugin is testable without a host: it takes numbers and returns numbers. `src/engine/` knows about sample offsets and note ids but not about CLAP structs. Only `src/clap/` names a CLAP type. This mirrors what `src/gpu/iface.zig` does for fosforo, and it should be mechanized the same way, with a `comptime` block in `src/music/scale.zig` asserting that nothing in the module tree imports `clap/c.zig`.

## The musical engine

### Scales and degrees

Twenty-seven scales, all selected by a `Key Root` (12 chromatic values) and a `Scale` menu. The seven diatonic modes; harmonic minor and melodic minor with all seven of each of their modes; and the non-7-note scales: major and minor pentatonic, blues, whole tone, and both octatonic collections.

Degree arithmetic generalizes the script's, with `N` read from the selected scale rather than fixed at 7:

```text
pitchOfDegree(d)  = root + 12 * floor(d / N) + SCALE[d - N * floor(d / N)]
degreeOfPitch(p)  = nearest degree, plus whether the input was already in key
```

Flooring toward negative infinity is what makes degrees below the reference root work, and this is a live hazard in the port rather than a formality. JavaScript's `Math.floor` floors; Zig's `/` and `%` on signed integers truncate toward zero. Every division and remainder in the degree arithmetic must therefore use `@divFloor` and `@mod`, or every pitch below the reference root lands on the wrong degree. The script's other subtlety, its guard for a pitch class just under 12 being nearer the *next* octave's root than this octave's last degree, carries over unchanged. Both deserve a named unit test, and the negative-degree case deserves a source canary, since a later refactor to `/` would compile, pass any test that only plays above the root, and be wrong.

Stacking alternating degrees on a non-7-note scale does not produce tertian harmony, and that is the point rather than a defect. On whole tone, `+2` degrees is a major third and the triad is augmented. On octatonic, `+2` is a minor third and the stack is diminished. On pentatonic, the stack is quartal. `Chord Tones` therefore means "how many rungs", not "how many thirds", and the plugin should say so in its parameter documentation.

### Chord construction

Each color supplies a core and a ladder in degree space, and `Chord Tones` takes that many entries from `core ++ ladder`. **Entries are listed in the order they are added, not in pitch order.** That is what lets a two-tone chord be the structurally important pair rather than merely the lowest two, and it is why Normal's core reads `[0, 4, 2]`: at two tones you want the root and fifth, not the root and third. The result is sorted into pitch order afterwards, during voicing.

| Color  | Core        | Ladder        | At 2 tones | At 3 tones  |
| ------ | ----------- | ------------- | ---------- | ----------- |
| Normal | `[0, 4, 2]` | `[6, 8, 10]`  | `[0, 4]`   | `[0, 2, 4]` |
| Sus2   | `[0, 4, 1]` | `[6, 8, 10]`  | `[0, 4]`   | `[0, 1, 4]` |
| Sus4   | `[0, 4, 3]` | `[6, 8, 10]`  | `[0, 4]`   | `[0, 3, 4]` |
| Sixth  | `[0, 4, 2]` | `[5, 8, 10]`  | `[0, 4]`   | `[0, 2, 4]` |
| Shell  | `[0, 6, 2]` | `[8, 10, 12]` | `[0, 6]`   | `[0, 2, 6]` |

The ladder is not a fixed list of three. It continues upward by two degrees indefinitely, and the three entries shown are only the ones a six-tone chord can reach unaided. This matters because the avoid-note rule can push a rung past the end of the printed list.

The script's avoid-note rule is generalized and stops needing a hand-written `QUALITY` table. v4 hardcodes "the eleventh reads as wrong over the major degrees, so skip to the thirteenth" with a per-degree quality array valid only for natural minor. The general rule is computed from the scale: **if an extension's pitch class lands exactly one semitone above the pitch class of the chord's third, skip that rung and take the next.** In F# natural minor this reproduces v4 exactly (over A major the eleventh D sits a semitone above the third C#; over F# minor the eleventh B sits two semitones above the third A, and is not skipped) and it keeps working in every other scale, including the ones where no tertian third exists.

`Trigger Note Is` subtracts `[0, 2, 4, 6]` degrees from the played note so the same key can be read as the chord's root, third, fifth, or seventh. On a scale with fewer than seven degrees those names stop being literally true, since six degrees down a pentatonic is more than an octave, so the parameter's value strings should name the degree offset alongside the chord-tone name.

### Voicing

Applied in this order, which matters:

1. **Inversion** (0 to 3): sort, lift the lowest voice by `N` degrees, repeat. An octave is exactly `N` degrees, so the chord cannot leave the key by construction.
2. **Voicing Spread** (0 to 3 octaves, continuous), applied to the re-sorted degrees, since inversion leaves them out of order: voice `i` rises by `N * floor(spread * i / (n - 1))` degrees, so the chord fans out evenly from the bottom. Displacement is always by whole octaves; any other interval would change the chord rather than reopen it.
3. **Chord Octave** (-2 to +2), applied in semitones after conversion to pitch.
4. **Bass Note** (off, root -1 oct, root -2 oct), taken from the chord's own root degree so it tracks `Trigger Note Is` and inversions rather than becoming an inverted bass.
5. **Include Trigger Note**, optional.
6. **Fold into range**, never drop. An out-of-range pitch is folded back by octaves. Dropping would silently thin the chord at extreme spreads, and note count is load-bearing for a downstream arpeggiator.
7. **De-duplicate.** Two note-ons on one pitch followed by a single note-off cut a note that should still be sounding.

Drop-2 is deliberately not carried over. v4 replaced it with Voicing Spread and the two are not the same gesture (spread fans upward from the bottom; drop-2 lowers the second voice from the top), so this is a recorded refusal rather than an oversight, and it can be revisited with an ADR amendment.

### The macro

Eight targets: Chord Tones, Voicing Spread, Inversion, Velocity Tilt, Strum, Chord Color, Bass Note, and Minimum Chord Length. Each gets three parameters, expressed in the target's own units:

- **Start**, the target's value at macro 0%.
- **End**, its value at macro 100%.
- **Curve**, the interpolation exponent, roughly 0.25 to 4.0 with 1.0 linear.

The value is `Start + (End - Start) * m^Curve`, quantized afterwards by rounding to the target's own step, which is what turns a continuous ramp into the discrete thickening the script gets from hard breakpoints. `Start > End` is legal, so the macro can close one axis while opening others.

`Openness Source` chooses between the macro and the eight manual axis values. Manual is the escape hatch, and it is the mode the reference vectors run in.

Every relationship the script encodes survives as a **default parameter value** rather than a constant:

| Target         | Start  | End     | Curve | Relationship, and how closely it matches v4                                                                                                                                                                     |
| -------------- | ------ | ------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Voicing Spread | 0      | 2.2 oct | 1.6   | Exact. v4's `2.2 * m^1.6`. Perceived openness tracks the log of span, so it eases in.                                                                                                                           |
| Velocity Tilt  | 0      | 1.0     | 1.2   | Exact. v4's `m^1.2`.                                                                                                                                                                                            |
| Chord Tones    | 3      | 6       | 0.68  | Approximate. Still four discrete steps, front-loaded, and the first breakpoint lands on v4's 20%; the later ones arrive a little later, and the ladder now tops out at 100% instead of stalling above v4's 70%. |
| Inversion      | 0      | 3       | 1.0   | Approximate. v4 uses `floor(m * 4)`; rounding to the nearest step puts the transitions in slightly different places.                                                                                            |
| Strum          | 0 ms   | 40 ms   | 3.0   | Deliberately different. About 5 ms at the halfway point rather than v4's hard knee at exactly 50%, which is smoother and easier to automate through.                                                            |
| Chord Color    | Normal | Normal  | 1.0   | New target, inert by default.                                                                                                                                                                                   |
| Bass Note      | Off    | Off     | 1.0   | New target, inert by default.                                                                                                                                                                                   |
| Min Length     | Off    | Off     | 1.0   | New target, inert by default. v4 excludes this on purpose as structural rather than timbral, so it ships reachable but not reached.                                                                             |

Two of the five carried-over axes are bit-exact and three are approximations, and that is the intended consequence of moving the shaping out of code: **the relationships are the specification, the numbers are not.** It is also why the reference vectors are generated with `Openness Source` set to Manual, so the behavior that must match v4 exactly is tested apart from the behavior that deliberately does not.

Openness is sampled **once per note-on**, not per block. Automation therefore takes effect at the next chord rather than mid-sustain, which is what stops a held chord from morphing underneath a downstream arpeggiator.

Velocity tilt keeps its own constants: the bass loses up to 45% and the top gains up to 25% at full tilt, so the chord leans upward rather than merely getting quieter. Those are the shape of the tilt feature, not macro shaping, and they stay in code with the reasoning doc-commented.

## Parameters

Forty-four, in stable-id groups with gaps left between groups so a later addition does not disturb ordering:

| Group              | Count | Contents                                                                                               |
| ------------------ | ----- | ------------------------------------------------------------------------------------------------------ |
| Global             | 1     | Chords Active                                                                                          |
| Openness           | 2     | Open Macro, Openness Source                                                                            |
| Manual axis values | 8     | Chord Tones, Voicing Spread, Inversion, Velocity Tilt, Strum, Chord Color, Bass Note, Min Chord Length |
| Macro mappings     | 24    | Start, End, Curve for each of the eight targets                                                        |
| Harmony            | 7     | Key Root, Scale, Trigger Note Is, Chord Hold, Chord Octave, Include Trigger Note, Off-Scale Input      |
| Control            | 2     | Toggle CC, Toggle Mode                                                                                 |

Two constraints CLAP does not remove:

- **Stable ids, not indices.** Scripter binds automation to array position, which is why the script's parameter order is frozen. CLAP binds to `clap_id`, so parameters can be reordered for display without breaking automation, as long as ids never move. Ids are assigned once, in an enum, and doc-commented as permanent.
- **AUv2 ordering is a separate problem.** Parameter order still matters in Logic and GarageBand even when ids do not change. clap-wrapper exposes `clap.plugin-auv2-param-ordering` for exactly this. Implement it from the start rather than discovering the need after the first release.

`Chord Zone Top` is dropped: the whole keyboard is the chord zone. `Off-Scale Input` is kept, with its snap-to-nearest-degree default and its pass-through alternative.

## The event engine

The parts with no analogue in fosforo, which has no note ports, no parameters, and no scheduling.

**Note ports.** One input, one output, each supporting both the CLAP and MIDI dialects, with **CLAP preferred**. Preferring CLAP costs nothing where it is unavailable and gains `note_id` where it is: a host that sends note ids lets every emitted voice carry its own, which makes note-off matching exact even when two held triggers produce the same pitch, a case the script's `channel:pitch` keying cannot distinguish. Through the AUv2 wrapper events arrive as MIDI regardless, so the fallback is the path Logic exercises. Matching therefore uses `note_id` when the host supplies one and falls back to channel-and-key when it is `-1`, which is the only mode the script has.

**Scheduling.** Strum places voices at increasing offsets and their note-offs must carry the same offset, or a strummed upper voice is released before it is struck and hangs forever. At 120 ms of strum across eight voices the span exceeds a single process block at any normal buffer size, so pending events must survive across blocks. A fixed-capacity ring of events with absolute sample timestamps is drained into the output queue each `process()` call. Capacity is bounded by construction: 6 tones plus bass plus trigger note, times 16 simultaneous triggers, times two for on and off, is 256 entries. Overflow drops the newest and reports through `clap.log` from the main thread. Nothing on this path allocates.

**Transport.** `clap_process.transport` supplies `song_pos_beats` in `CLAP_BEATTIME_FACTOR` fixed point and the `CLAP_TRANSPORT_IS_PLAYING` flag, replacing `GetTimingInfo()`. The minimum-length gate stays beat-based so it tracks tempo, and stays disabled while the transport is stopped, since the clock does not advance then and the gate would otherwise latch shut on the first chord played live. A negative elapsed value means a loop jump and does not suppress.

**Hold.** A sustained chord carries an identity derived from its emitted pitches. Retriggering the same chord is a no-op; a different chord releases the old one and takes over, unless the minimum-length gate suppresses the change.

**The CC toggle.** The configured CC is intercepted and swallowed. Latching flips on values at or above 64 and ignores the release; momentary follows the control. The script's comment about `SetParameter` not being visible to the next `GetParameter` has a direct CLAP analogue: the plugin owns `chords_active` in a plain field and pushes it outward by emitting a parameter value event on the output queue and calling `request_flush`, so the host, automation lane, and eventual GUI all agree.

**Release discipline.** The note-off path consults the voice table before it consults `chords_active`, so a note-off always releases whatever its note-on actually produced. The toggle can be thrown mid-chord and the chord rings out and releases normally. `reset()` and `deactivate()` release everything.

## Phases

| Phase | Work                                                                                                                                                                                                                                                   | Gate                                                                                                      |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| 0     | Repo foundation: AGENTS.md and CLAUDE.md symlink, `.claude/`, `.github/` workflows and `*.instructions.md`, lint configs, `docs/{adr,design,plans}`, the v4 script preserved verbatim as `docs/design/diatonic-chord-trigger-v4.js`, the thirteen ADRs | CI green on the scaffolding: markdownlint, typos, gitleaks, shellcheck                                    |
| 1     | The shell, in **both** formats: `build.zig`, CLAP bindings, entry, factory, descriptor, note ports, pass-through `process()`, state stub, `cmake/` with the newer clap-wrapper pin, signing, provenance, install steps                                 | `clap-validator` green on both bundles; Logic lists Springer in the MIDI FX slot and passes notes through |
| 2     | The musical core in `src/music/`, pure Zig, no CLAP: scales, degrees, snapping, core-plus-ladder, the generalized avoid-note rule, voicing, folding                                                                                                    | Unit tests plus the reference vectors                                                                     |
| 3     | Parameters and state: `clap.params`, the full table with stable ids, versioned save and load, AUv2 param ordering                                                                                                                                      | Round-trips a saved state; Logic's generic UI shows and automates every parameter                         |
| 4     | The event engine: scheduler, voice table, transport gate, hold, velocity tilt, strum, the CC toggle                                                                                                                                                    | The offline host harness; no hung notes under a planted-defect matrix                                     |
| 5     | The macro: `src/music/macro.zig`, start/end/curve mapping, defaults reproducing v4's relationships                                                                                                                                                     | A macro sweep produces the documented axis values at documented macro positions                           |
| 6     | Release plumbing: installer, notarization scripts, README, CHANGELOG                                                                                                                                                                                   | A signed and notarized `.pkg` installs and loads                                                          |
| 7     | The GUI, behind ADR 0013                                                                                                                                                                                                                               | Deferred; not part of this plan                                                                           |

Phase 1 deliberately puts the Audio Unit first rather than last. The `aumi` path is the single largest unknown in the project, and proving it against an empty pass-through plugin is far cheaper than discovering a wrapper limitation after the musical engine is written.

## The verification program

Adopting fosforo's principle directly: *a test asserts a property of the code; planting a defect asserts a property of the test, and the second does not follow from the first.* Each instrument below should be validated by planting the exact defect it claims to catch and confirming it goes red.

| Layer             | Command                            | What it sees                                                                                           | In CI |
| ----------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------ | ----- |
| Build             | `zig build`                        | `Springer.clap` assembles                                                                              | yes   |
| Format            | `zig fmt --check build.zig src/`   | Formatting                                                                                             | yes   |
| Unit tests        | `zig build test`                   | Degree arithmetic, chord construction, voicing, macro mapping, state round-trips                       | yes   |
| Bindings          | inside `zig build test`            | Comptime `@sizeOf` / `@offsetOf` over every CLAP struct crossing the ABI                               | yes   |
| Seam              | inside `zig build test`            | A comptime assertion that nothing under `src/music/` imports `clap/c.zig`                              | yes   |
| Reference vectors | inside `zig build test`            | The Zig engine reproduces the Scripter script, note for note                                           | yes   |
| Offline host      | `zig build smoke`                  | `process()` driven with synthetic events: strum spans blocks, no hung notes, transport gate, CC toggle | yes   |
| Source canaries   | inside `zig build test`            | Ordering-critical declarations, via an adapted `src/canary.zig`                                        | yes   |
| CLAP conformance  | `clap-validator validate <bundle>` | Both bundles, the Zig-built one and the wrapper-built one                                              | yes   |
| Audio Unit        | `auval -v aumi Sprg Ctmn`          | Probably nothing. See Risks: clap-wrapper bundles are not enumerated by `auval` on this machine.       | no    |
| Logic             | by hand                            | The only complete check of the MIDI FX slot                                                            | no    |
| Signatures        | `scripts/assert-adhoc-signature`   | That the default build stays offline and ad-hoc                                                        | yes   |
| Provenance        | `scripts/read-provenance --check`  | That an installed bundle is the one just built                                                         | yes   |

### Reference vectors

The strongest instrument available here, and one fosforo could not have: the old implementation still runs. Node 24 is on this machine. `scripts/reference-vectors` is a small harness that stubs Scripter's globals (`NoteOn`, `NoteOff`, `ControlChange`, `GetParameter`, `SetParameter`, `GetTimingInfo`, `sendAfterMilliseconds`, `Trace`), runs the preserved v4 script over a matrix of parameter settings and input notes, and writes the emitted pitches, delays, and velocities as a data file. Zig tests read that file through an anonymous import, the same trick `build.zig` in fosforo uses to let Zig tests check constants restated in Python and shell, and assert the engine reproduces it exactly.

Two limits, worth stating in the harness header so they are not forgotten. The vectors only cover F# natural minor and only the v4 feature set, so every new scale, the color control, and the macro mappings need tests of their own. And where Springer deliberately diverges, the divergence must be recorded rather than papered over: the macro curves are now data, `Chord Zone Top` is gone, and the avoid-note rule is computed rather than tabulated. The vectors should be generated with the macro bypassed (`Openness Source: Manual`) so the parts that must match exactly are tested separately from the parts that intentionally do not.

## Explicitly deferred

Recorded here so they are visibly refusals rather than omissions.

- **Arpeggiation and pattern generation.** Springer emits chords; Logic's Arpeggiator, placed below it, does patterns. Note count is preserved by octave-folding precisely because the arpeggiator's pattern length is set by how many notes it receives. In a CLAP host the chain is whatever note effects that host provides.
- **VST3, AUv3, AAX, standalone.** A later clap-wrapper toggle, not a design problem.
- **Automatic voice leading and register windows.** Considered and declined; the manual model of inversion plus spread is what is wanted.
- **Drop-2.** Superseded by Voicing Spread, as above.
- **Per-degree chord overrides, modal interchange, secondary dominants.** Chord quality falls out of the scale. Changing that would change what the plugin is.
- **The GUI.** ADR 0013. When it arrives it is native AppKit controls or a Metal-rendered panel, decided then, and it must show the chord currently sounding, spelled in the key's own orthography, which is why `src/music/spelling.zig` exists from Phase 2.

## Risks

- **`aumi` through clap-wrapper is confirmed in source but unproven here.** `build-helper.cpp` maps `note-effect` to `aumi`, `auv2_base_classes.h` carries `AUV2_Type::aumi_noteeffect` with a real `MIDIOutput` class and `AUMIDIOutputCallbackStruct` plumbing, and PR #497 added the silent-bus facade that a plugin with no audio ports needs. None of that has been run on this machine. Phase 1 exists to find out early.
- **`auval` will probably never see this plugin, and that is a clap-wrapper property rather than an `aumi` one.** Measured on 2026-09-08: no `aumi` component is installed on this machine (`auval -s aumi` reports "No plugins found of type: 'aumi'", and none of the 28 components in the two `Plug-Ins/Components` folders declares that type), which is expected, since Logic's own MIDI FX are built into Logic rather than shipped as Audio Units. `auval` does recognize `aumi` as a searchable type, so it enumerates the category. The decisive measurement is fosforo's own bundle: it declares `type = aufx`, `subtype = Fsfr`, `manufacturer = Ctmn`, Logic loads it, and `auval -s aufx` still does not list it. So the invisibility fosforo records is not about the type code, and Springer inherits it. Plan for Logic to be the only complete check of the Audio Unit, and treat any `auval` coverage as a bonus. Worth one bounded investigation during Phase 1 into *why* clap-wrapper bundles are not enumerated, since an answer would benefit both projects.
- **Parameter count.** Around 44 parameters in Logic's generic list is a lot to scroll, and it is the strongest argument for pulling the GUI forward from Phase 7. The macro mapping group is 24 of those and could move into state instead of parameters if the list proves unusable, at the cost of not being able to automate a curve.
- **Reference vectors lock in one key.** They prove the port, not the generalization.
- **Non-7-note scales are unusual by construction.** Quartal and diminished stacks from a control labelled "Chord Tones" will surprise until documented. This is a labelling and documentation problem, not a correctness one.

## Verification

End to end, once Phase 5 lands:

```bash
zig build                                    # assembles zig-out/Springer.clap
zig fmt --check build.zig src/
zig build test                               # unit tests, canaries, seam, reference vectors
zig build smoke                              # the offline host harness
zig build validate                           # clap-validator over the Zig-built bundle
scripts/build-audio-unit                     # build/assets/Springer.component, via CMake
clap-validator validate build/assets/Springer.clap
auval -v aumi Sprg Ctmn                      # expected to find nothing; see Risks
zig build --release=fast install-plugins     # both bundles into ~/Library/Audio/Plug-Ins
```

Then, by hand in Logic, on a software instrument track with Springer in the MIDI FX slot above the Arpeggiator:

1. Play a single key and confirm one diatonic chord sounds, with the trigger note itself suppressed by default.
2. Hold three keys at once and confirm three chords sound and each releases independently.
3. Move `Key Root` and `Scale` and confirm the chord quality follows the scale with no per-chord configuration.
4. Sweep `Open Macro` from 0 to 100% and confirm the chord thickens in discrete steps, fans upward, tilts its velocity toward the top, and picks up strum only in the upper half.
5. Set `Strum` to 120 ms and confirm no note hangs when the trigger is released during the strum.
6. Enable `Chord Hold` with `Min Chord Length` at one bar and confirm chord changes faster than a bar are suppressed while the transport runs, and are not suppressed while it is stopped.
7. Assign a footswitch to `Toggle CC`, throw it mid-chord, and confirm the sounding chord releases cleanly rather than hanging.
8. Save the project, reopen it, and confirm every parameter returns.
9. Confirm the automation lane binds to the right parameters after a rebuild, which is the check that the stable-id scheme is actually working.
