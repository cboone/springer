# 0013. The GUI is deferred; the parameter set is the interface

**Status:** Accepted

## Context

Springer has roughly 44 parameters, 24 of which are the macro mapping group from [ADR 0009](./0009-macro-shaping-is-data-not-code.md). Presented in Logic's generic parameter list that is a lot to scroll, and it is the strongest argument for building an interface early.

It is still the wrong thing to build first. A GUI cannot be designed until the parameter set is settled, and the parameter set is not settled until the engine that consumes it works. Building the interface first means building it twice.

Every parameter is reachable and automatable through the host's generic list in the meantime. The plugin is fully usable without an interface; it is merely unpleasant to configure.

## Decision

No GUI until the engine, parameters, event handling and macro are done. The parameter set is the interface until then. When the GUI arrives it is native AppKit controls or a Metal-rendered panel, decided at that time and constrained by [ADR 0006](./0006-reject-webview-ui.md).

It must show the chord currently sounding, spelled in the key's own orthography. That requirement is why `src/music/spelling.zig` exists from Phase 2 rather than from the GUI phase: degree-correct spelling is engine knowledge, not presentation.

## Consequences

**Two of v4's parameters are deferred with the GUI rather than ported.**

`Trace Chord Names` is superseded outright. Its job was to print the sounding chord to Scripter's console, and the CLAP equivalent is `src/clap/log.zig` talking to the host's `clap.log` from the main thread. That is strictly better and needs no parameter.

`Middle C Is` selects whether note 60 is displayed as C3, C4 or C5. In v4 it is read at exactly one place, the octave number appended to a note name. Since no note name is displayed until this ADR is superseded, the parameter would control nothing. `src/music/spelling.zig` therefore takes the octave convention as a plain function argument, defaulting to 3, which keeps it pure per [ADR 0005](./0005-a-pure-musical-core-behind-a-seam.md) and ready for whichever mechanism eventually supplies it.

Deferring costs nothing, and that is a consequence of [ADR 0008](./0008-parameters-identified-by-stable-clap-id.md) rather than an assumption. Parameters are keyed by stable `clap_id`, so one added later disturbs no existing automation. Under Scripter, where automation binds to array index, the same deferral would have been a one-way door.

**The host cannot be asked for the octave convention, though CLAP says it can.** Measured 2026-09-08 against CLAP 1.2.10. `clap/ext/draft/octave-number.h` defines `clap.octave-number/1`, by which a host pushes `set_note60_octave(plugin, int8_t)` on the main thread, and its own comment names exactly this problem. It is unusable today for four independent reasons:

- No implementations exist. A code search for `set_note60_octave` returns only vendored copies of the header and mechanical language bindings. No host calls it; no plugin implements it.
- clap-wrapper contains no reference to it, so even an implementing host could not reach Springer through the AUv2 path, which is the path Logic uses.
- AUv2 has no equivalent property. The only mentions of middle C in the macOS SDK are prose comments noting that note 60 is middle C.
- It is push-only and draft. There is no host query to call, and it lives in `clap/all.h` rather than `clap/clap.h`, so reaching it is a deliberate act ([ADR 0004](./0004-clap-bindings-via-translate-c.md)).

Should that change, the mapping is exact: `middle_c_param = note60_octave - 3`, since v4 computes `floor(pitch / 12) - 2 + param` and defaults the parameter to C4. Re-check the ecosystem before building the GUI rather than assuming this measurement still holds.
