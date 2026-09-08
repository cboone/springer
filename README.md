# Springer

A diatonic chord generator MIDI FX plugin for macOS. One trigger note in, one diatonic chord out, authored as a CLAP and projected outward to an Audio Unit (`aumi`) for Logic Pro's MIDI FX slot.

Play one key and a diatonic chord sounds. Hold three and three chords sound, each releasing independently. Chord quality is never configured: it falls out of the selected key and scale, so degree 0 of F# Aeolian gives F#m and degree 2 gives A major, with no per-chord data anywhere.

Springer is deliberately not competing with Scaler, Cthulhu or InstaChord. It is a specialized instrument that works exactly one way, rebuilt from a Logic Pro Scripter script that had been in daily use and had outgrown what Scripter can carry.

## Status

**Nothing loads yet.** The project is at Phase 0 of eight, and Phase 0 is the repository foundation: agent configuration, lint configuration, CI, the thirteen architecture decision records, and the original Scripter script preserved verbatim as the normative statement of what the plugin must do.

There is no build yet. `build.zig`, the CLAP bindings and the plugin skeleton arrive together in Phase 1, which deliberately proves the Audio Unit path first, against an empty pass-through plugin, because that path is the largest unknown in the project.

The design is settled and written down. [The build plan](docs/plans/todo/2026-09-08-build-springer-a-diatonic-chord-generator-midi-fx.md) is the master document; [`docs/adr/`](docs/adr/) holds the decisions; [AGENTS.md](AGENTS.md) is the working hub.

## Roadmap

| Phase | Scope                                                                              | Status      |
| ----- | ---------------------------------------------------------------------------------- | ----------- |
| 0     | Repository foundation: agent config, CI, lint configuration, the thirteen ADRs     | Complete    |
| 1     | The shell in both formats: build, CLAP bindings, note ports, pass-through process  | Next        |
| 2     | The musical core: scales, degrees, chord construction, voicing                     | Planned     |
| 3     | Parameters and state, with stable ids and AUv2 parameter ordering                  | Planned     |
| 4     | The event engine: scheduler, voice table, transport gate, hold, strum, CC toggle   | Planned     |
| 5     | The macro: per-target start, end and curve mapping                                 | Planned     |
| 6     | Release plumbing: installer, notarization, documentation                           | Planned     |
| 7     | The GUI                                                                            | Deferred    |

The GUI is deferred by [ADR 0013](docs/adr/0013-defer-the-gui.md) rather than merely unscheduled, and arpeggiation is declined outright by [ADR 0012](docs/adr/0012-defer-arpeggiation-and-pattern-generation.md): Springer emits chords, and Logic's Arpeggiator placed below it does patterns.

## Requirements

- macOS 11.0 or later on Apple Silicon. This is a decision rather than an oversight; see [ADR 0001](docs/adr/0001-macos-on-apple-silicon-only.md).
- Logic Pro, for the Audio Unit, or any CLAP host for the `.clap` build.
- To build: Zig 0.16.0 exactly, plus CMake for the Audio Unit. Neither is needed yet.

## Installation

There is nothing to install yet. From Phase 6 the project ships a signed and notarized installer package carrying both the `.clap` and the `.component`.

## Usage

Place Springer in a software instrument track's MIDI FX slot, above the Arpeggiator if one is used. The whole keyboard is the chord zone.

Two controls define the chord and they are orthogonal. **Chord Tones** is a depth ladder from 2 to 6. **Chord Color** selects among Normal, Sus2, Sus4, Sixth and Shell. **Open Macro** is the performance control: one automation lane that moves chord depth, voicing spread, inversion, velocity tilt, strum, color, bass note and minimum chord length together, each along its own configurable curve.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). The thirteen decisions in [`docs/adr/`](docs/adr/) are settled and are superseded by a new ADR rather than reopened.

## License

[MIT License](./LICENSE). TL;DR: Do whatever you want with this software, just keep the copyright notice included. The authors aren't liable if something goes wrong.
