---
applyTo: "**/*.zig,**/*.zig.zon"
---

# Reviewing this project's Zig

There is no Zig in the repository yet; it arrives in Phase 1. These entries are the conventions already settled by ADR, recorded so the first review does not relitigate them.

- **`@divFloor` and `@mod` in the degree arithmetic are deliberate and load-bearing.** Do not suggest `/` and `%`. Zig truncates toward zero on signed integers where the JavaScript original floors toward negative infinity, and the difference puts every pitch below the reference root on the wrong degree. See [ADR 0011](../docs/adr/0011-non-7-note-scales-stack-by-degree.md).
- **Nothing under `src/music/` may import `src/clap/c.zig`.** A `comptime` assertion enforces it. If a change appears to need a CLAP type there, the value should be threaded in as a plain argument instead. See [ADR 0005](../docs/adr/0005-a-pure-musical-core-behind-a-seam.md).
- **Fixed-capacity structures on the audio path are not premature optimization.** Nothing reachable from `process()` may allocate, lock, or make a syscall, so a growable container there is a defect rather than a simplification. See [ADR 0007](../docs/adr/0007-no-allocation-on-the-audio-thread.md).
- **Parameter ids are permanent.** Do not suggest renumbering, compacting, or deriving them from position, even when the enum has gaps. The gaps are deliberate. See [ADR 0008](../docs/adr/0008-parameters-identified-by-stable-clap-id.md).
- **Comptime `@sizeOf` and `@offsetOf` assertions over CLAP structs are not redundant with the translation.** A binding that compiles is not a binding whose layout is right, and the failure mode is a silent misread on the audio thread. See [ADR 0004](../docs/adr/0004-clap-bindings-via-translate-c.md).
- **There is no line-length limit.** Comments and doc comments are one long line per paragraph.
