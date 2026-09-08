# 0003. Author CLAP once, project outward with clap-wrapper

**Status:** Accepted

## Context

Logic Pro's MIDI FX slot loads Audio Units of type `aumi`, and that slot is the whole point of the project. Authoring an Audio Unit directly means Apple's AU framework, Objective-C++ and a component packaging story that exists nowhere else.

CLAP is a plain C API with no inheritance, no framework, and no code generation. It is also the format a development host can load directly, which makes the day-to-day loop far shorter than round-tripping through a component bundle and a host that caches its plugin registry.

clap-wrapper projects a CLAP outward into other formats, including AUv2, and its clap-first entry point builds the wrapper around a plugin that was authored as a CLAP rather than the other way around.

## Decision

Author the plugin exactly once, as a CLAP note effect. Use clap-wrapper to project it outward to an AUv2 of type `aumi`. `zig build` alone produces a loadable `Springer.clap`; CMake exists only to run clap-wrapper and emit `Springer.component`.

## Consequences

**`features[0]` is load-bearing and is not cosmetic.** clap-wrapper's `src/detail/auv2/build-helper/build-helper.cpp` maps `features[0]` to the AU type, and only `CLAP_PLUGIN_FEATURE_NOTE_EFFECT` yields `aumi`. Anything it does not recognise falls back to `aumu` with a warning, which would produce a plugin that loads in the instrument slot rather than the MIDI FX slot, and so does the wrong thing rather than failing loudly. `features` is therefore `{ note-effect, utility }` in that order, and `AUV2_INSTRUMENT_TYPE "aumi"` is passed to `make_clapfirst_plugins` as well, belt and braces.

**clap-wrapper must be pinned newer than fosforo's.** fosforo pins `35f524b771ec09f54c164720bb90f271273b37d3`, dated 2026-07-13, which predates the three pull requests that make a note effect viable as an AUv2: #493 (AUv2 MIDI 1.0 and 2.0 input and output with dialect negotiation), #497 (a silent stereo facade for effects with no audio ports, so `auval` can pass), and #498 (silence buffers created cleared). Pin `1cca996e96f29ab2be7ae9f8cfe532bbc92e1dd6`, dated 2026-08-08, or later. The reason is recorded in the CMake file itself, as fosforo records why it pins a commit rather than a tag.

**The `aumi` path is confirmed in clap-wrapper's source and unproven on this machine.** `auv2_base_classes.h` carries `AUV2_Type::aumi_noteeffect` with a real `MIDIOutput` class and `AUMIDIOutputCallbackStruct` plumbing, and #497 added the facade a plugin with no audio ports needs. None of it has been run here. This is the single largest unknown in the project, which is why Phase 1 proves it against an empty pass-through plugin rather than after the musical engine is written.

**`auval` is expected to be no help, and that is a clap-wrapper property rather than an `aumi` one.** Measured 2026-09-08: no `aumi` component is installed on this machine, which is expected, since Logic's own MIDI FX are built into Logic. The decisive measurement is fosforo's own bundle, which declares `aufx` and which Logic loads and `auval -s aufx` still does not list. Springer inherits that invisibility. Plan for Logic to be the only complete check of the Audio Unit and treat any `auval` coverage as a bonus.
