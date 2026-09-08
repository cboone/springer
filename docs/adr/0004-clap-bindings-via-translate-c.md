# 0004. CLAP bindings from translate-c over a preprocessing step

**Status:** Accepted

## Context

The CLAP headers are the entire host interface, and they must become Zig types that match the C ABI exactly. Getting a field offset wrong does not produce a compile error; it produces a plugin that reads the wrong bytes out of a host-supplied struct at run time.

`@cImport` is the conventional answer and is deprecated in Zig 0.16.0 ([ADR 0002](./0002-zig-pinned-to-0-16-0.md)), which forces the question rather than leaving it to taste. Hand-writing the bindings is the alternative and is worse: the headers are large, they change between CLAP versions, and every hand-transcribed field is a chance to introduce a silent layout mismatch.

## Decision

Generate the bindings with `b.addTranslateC()` in `build.zig`, fed a preprocessed umbrella header rather than the CLAP headers directly. `src/clap/clap_all.h` includes what the project uses; a `zig cc -E -P` step preprocesses it; `translate-c` consumes the result and produces `src/clap/c.zig`.

Assert the result. `src/clap/c.zig` carries `comptime` `@sizeOf` and `@offsetOf` checks over every CLAP struct that crosses the ABI, and those assertions run as part of `zig build test`.

## Consequences

The indirection through an umbrella header is what makes the surface explicit. It is a list, in one file, of exactly which parts of CLAP this plugin depends on, rather than a wildcard over whatever the SDK happens to ship.

That matters more here than it would elsewhere, because **CLAP's draft extensions are not in `clap/clap.h`.** They live only in `clap/all.h`, and reaching one is a deliberate act rather than a side effect of including the SDK. This is not academic: `clap.octave-number/1`, the extension by which a host would tell the plugin whether note 60 is C3, C4 or C5, is a draft. See [ADR 0013](./0013-defer-the-gui.md) for why the project does not reach for it yet.

The comptime assertions are the point of the exercise and not a formality. A binding that compiles is not a binding that is correct, and the failure mode of an incorrect one is silent memory misreads on the audio thread. Verifying the assertions themselves is part of the verification program: planting a deliberately wrong `@offsetOf` must turn the build red, which asserts a property of the check rather than of the code.
