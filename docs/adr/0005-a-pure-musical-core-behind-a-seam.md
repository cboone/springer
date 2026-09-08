# 0005. The musical core is pure and names no CLAP type

**Status:** Accepted

## Context

Almost everything Springer does is arithmetic. Locating a played pitch on a scale degree, stacking alternating degrees into a chord, applying the avoid-note rule, inverting, spreading, folding back into range, and mapping a macro position onto eight target values are all functions from numbers to numbers.

None of that needs a host. All of it is where the bugs will be, and several of the hazards are the kind that only show up at specific inputs: pitches below the reference root, scales with fewer than seven degrees, extensions that collide with the third.

A plugin that can only be exercised by loading it into a digital audio workstation is a plugin whose engine is tested by ear.

## Decision

Three layers, with the dependency arrow pointing one way only:

- **`src/music/`** takes numbers and returns numbers. It may not name a CLAP type, a sample offset, or a note id.
- **`src/engine/`** knows about sample offsets, note ids and event ordering. It may not name a CLAP struct.
- **`src/clap/`** is the only place a CLAP type appears.

Enforce the innermost boundary mechanically rather than by review: a `comptime` block asserts that nothing in the `src/music/` module tree imports `src/clap/c.zig`, and that assertion runs in `zig build test`.

## Consequences

The musical engine is unit-testable in full, and the strongest available instrument becomes possible: the v4 Scripter script still runs under Node, so `src/music/` can be checked against the original implementation note for note rather than against a restatement of what the original was supposed to do. That is what the Phase 2 reference vectors are.

This mirrors what `src/gpu/iface.zig` does for fosforo, and it should be mechanized the same way. A seam maintained by intention drifts; a seam maintained by a compile error does not.

The comptime assertion is itself subject to the project's verification principle. It must be validated by planting the exact defect it claims to catch, adding an import of `clap/c.zig` somewhere under `src/music/` and confirming the build goes red, because a seam check that never fails is indistinguishable from no seam check.

The cost is that a few things are threaded as arguments which would otherwise be read from a parameter directly. `src/music/spelling.zig` taking the octave convention as a plain integer rather than reading a parameter is an instance of the rule working, not an inconvenience.
