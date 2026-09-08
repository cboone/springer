# 0007. Nothing on the audio thread allocates, locks, or makes a syscall

**Status:** Accepted

## Context

Memory safety is not real-time safety. A heap allocation, a mutex acquisition, or a file read compiles perfectly, passes every test, and still produces an audible dropout when the allocator happens to take a slow path or the lock happens to be contended. The failure is intermittent, load-dependent, and does not reproduce under a debugger.

Springer has more state on this path than a typical effect. It maintains a table mapping each held trigger to the voices it produced, and a queue of pending events that must survive across process blocks, because a strummed chord's span exceeds a single buffer at any normal size.

## Decision

Nothing reachable from `process()` allocates, takes a lock, or makes a syscall. Every structure it touches is fixed-capacity and sized before the audio thread ever runs.

Diagnostics from this path do not write anywhere. They set state that the main thread reports later through `clap.log`.

## Consequences

Capacity is bounded by construction rather than guessed. Six chord tones plus a bass note plus the trigger note, times sixteen simultaneous triggers, times two for note-on and note-off, is 256 scheduler entries. The number is derived in one place and the derivation is written down beside it, so a later change to the maximum chord depth has a visible consequence rather than a silent one.

Overflow is a defined behavior rather than an assertion. The scheduler drops the newest event and records that it did; the main thread reports it through `clap.log`. Dropping the newest rather than the oldest is deliberate: the oldest pending events include note-offs for notes already sounding, and dropping one of those hangs a note.

[ADR 0002](./0002-zig-pinned-to-0-16-0.md) is what makes this checkable rather than aspirational. Nothing on the audio path is handed an allocator, so "does this allocate" is a question about the call graph that can be answered by reading it, rather than a convention that was hopefully honored.

The cost is that some things are more awkward than their allocating equivalents, and that the fixed capacities are real limits rather than soft ones. A seventeenth simultaneous trigger is not served. That is the correct trade for an instrument played from a keyboard.
