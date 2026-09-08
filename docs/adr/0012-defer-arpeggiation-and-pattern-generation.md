# 0012. Springer is a chord generator; arpeggiation is deferred

**Status:** Accepted

## Context

Chord generation and pattern generation are adjacent enough that plugins routinely do both, and the existing products in this space (Scaler, Cthulhu, InstaChord) all do. Having built the chord engine, adding an arpeggiator is a visible next step.

The originating workflow already answers this. The v4 script runs in Logic's MIDI FX slot with the Arpeggiator placed directly below it, and that arrangement works because each plugin does one thing to a stream of notes and passes it on.

## Decision

Springer emits chords. Logic's Arpeggiator, or whatever note effects a CLAP host provides, does patterns. No arpeggiation, no strum patterns beyond the single strum-offset control, no rhythmic generation.

## Consequences

**Note count is load-bearing output, not an internal detail.** A downstream arpeggiator sets its pattern length from how many notes it receives. This is the direct reason [voicing folds out-of-range pitches back by octaves rather than dropping them](./0010-chord-depth-is-a-ladder-color-is-orthogonal.md): dropping would silently thin the chord at extreme spreads, and the audible result would be an arpeggio that changes length as the macro sweeps, for reasons the user cannot see. It is also why the emitted chord is de-duplicated, since two note-ons on one pitch followed by a single note-off cut a note that should still be sounding.

**Springer must be well-behaved as an upstream.** Every emitted voice carries correct timing and correct note-off pairing, because a downstream plugin will compound any error rather than absorb it. A hung note in Springer becomes a hung note in the arpeggiator's pattern.

This is a refusal recorded on purpose rather than an omission. It can be revisited with a superseding ADR, and the thing that would justify one is a pattern requirement that genuinely cannot be expressed by a separate arpeggiator downstream. Wanting the features in one window would not be such a reason.
