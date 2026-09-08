# 0006. No WebView UI

**Status:** Accepted

## Context

Embedding a WebView is a common way to build plugin interfaces, and the appeal is real: web layout is well understood, the tooling is mature, and the same interface can be developed outside the host.

The costs are also real, and they land in the wrong places for this project. A WebView loads a browser engine into the host's process. It brings a JavaScript runtime, an asynchronous message boundary between the interface and the audio engine, a bundle of web assets to ship and sign, and a rendering path whose scheduling the plugin does not control.

Springer's interface is not document-shaped. Whatever it eventually becomes, it is a small number of controls plus a readout of the chord currently sounding, spelled in the key's own orthography. That is a drawing problem, not a layout problem.

## Decision

No WebView. When a GUI arrives it is native AppKit controls or a Metal-rendered panel, decided at that time.

## Consequences

Nothing is bundled that has to be signed, sandboxed, notarized or kept current for security reasons beyond the plugin binary itself. Under [ADR 0001](./0001-macos-on-apple-silicon-only.md) there is exactly one windowing system to target, so the portability argument for a WebView does not apply here.

There is no asynchronous boundary between the interface and the engine to design, and no serialization format between them to version.

This decision is about the *mechanism*, not the schedule. [ADR 0013](./0013-defer-the-gui.md) defers the GUI itself; this one constrains what it may be built from when it arrives.

The cost is that building the eventual interface means writing native code rather than markup, and that the interface cannot be developed or previewed outside a host. That is accepted.
