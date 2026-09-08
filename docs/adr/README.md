# Architecture decision records

Each file records one decision, the context that forced it, and its consequences. Decisions here are settled and should be built on rather than reopened. If one turns out to be wrong, add a new ADR superseding it rather than editing history.

Background for all of these lives in [the build plan](../plans/todo/2026-09-08-build-springer-a-diatonic-chord-generator-midi-fx.md), and the behavior they are decisions *about* is [the preserved v4 Scripter script](../design/diatonic-chord-trigger-v4.js), which is normative rather than illustrative.

0001 through 0013 were locked in the planning pass, before any code. Later numbers will record decisions a phase forced once it was under way. The distinction has no bearing on their standing: every one of them is settled.

| ADR                                                                | Decision                                                       | Status   |
| ------------------------------------------------------------------ | -------------------------------------------------------------- | -------- |
| [0001](./0001-macos-on-apple-silicon-only.md)                      | macOS on Apple Silicon only                                    | Accepted |
| [0002](./0002-zig-pinned-to-0-16-0.md)                             | Zig, pinned to 0.16.0                                          | Accepted |
| [0003](./0003-author-clap-project-outward.md)                      | Author CLAP once, project outward with clap-wrapper            | Accepted |
| [0004](./0004-clap-bindings-via-translate-c.md)                    | CLAP bindings from translate-c over a preprocessing step       | Accepted |
| [0005](./0005-a-pure-musical-core-behind-a-seam.md)                | The musical core is pure and names no CLAP type                | Accepted |
| [0006](./0006-reject-webview-ui.md)                                | No WebView UI                                                  | Accepted |
| [0007](./0007-no-allocation-on-the-audio-thread.md)                | Nothing on the audio thread allocates, locks, or syscalls      | Accepted |
| [0008](./0008-parameters-identified-by-stable-clap-id.md)          | Parameters are identified by stable `clap_id`                  | Accepted |
| [0009](./0009-macro-shaping-is-data-not-code.md)                   | Macro shaping is per-target Start, End and Curve parameters    | Accepted |
| [0010](./0010-chord-depth-is-a-ladder-color-is-orthogonal.md)      | Chord depth is a ladder; chord color is orthogonal to it       | Accepted |
| [0011](./0011-non-7-note-scales-stack-by-degree.md)                | Non-7-note scales stack by degree, not by interval             | Accepted |
| [0012](./0012-defer-arpeggiation-and-pattern-generation.md)        | Springer is a chord generator; arpeggiation is deferred        | Accepted |
| [0013](./0013-defer-the-gui.md)                                    | The GUI is deferred; the parameter set is the interface        | Accepted |
