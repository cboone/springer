# 0010. Chord depth is a ladder; chord color is orthogonal to it

**Status:** Accepted

## Context

The v4 script offers five discrete chord shapes, and they conflate two independent ideas. "Fifths", "Triad", "Seventh" and "Ninth" are the same construction at four depths. "Shell" is a different construction entirely, a root-and-seventh pair with the third omitted.

Adding suspensions or sixths to that scheme means adding a shape per combination, and the list grows multiplicatively for no structural reason.

## Decision

Two controls, orthogonal to each other.

**Chord Tones** is a depth ladder from 2 to 6: how many rungs to take. **Chord Color** selects among Normal, Sus2, Sus4, Sixth and Shell: which rungs there are.

Each color supplies a core and a ladder in degree space, and Chord Tones takes that many entries from `core ++ ladder`:

| Color  | Core        | Ladder        | At 2 tones | At 3 tones  |
| ------ | ----------- | ------------- | ---------- | ----------- |
| Normal | `[0, 4, 2]` | `[6, 8, 10]`  | `[0, 4]`   | `[0, 2, 4]` |
| Sus2   | `[0, 4, 1]` | `[6, 8, 10]`  | `[0, 4]`   | `[0, 1, 4]` |
| Sus4   | `[0, 4, 3]` | `[6, 8, 10]`  | `[0, 4]`   | `[0, 3, 4]` |
| Sixth  | `[0, 4, 2]` | `[5, 8, 10]`  | `[0, 4]`   | `[0, 2, 4]` |
| Shell  | `[0, 6, 2]` | `[8, 10, 12]` | `[0, 6]`   | `[0, 2, 6]` |

## Consequences

**Entries are listed in the order they are added, not in pitch order.** That is what lets a two-tone chord be the structurally important pair rather than merely the lowest two, and it is why Normal's core reads `[0, 4, 2]`: at two tones the wanted interval is the root and fifth, not the root and third. The result is sorted into pitch order later, during voicing.

This pair subsumes all five of v4's shapes without special cases. Normal at 2 tones is "Fifths", Normal at 3 the triad, Normal at 4 the seventh, Normal at 5 the ninth, and Shell at 2 the root-and-seventh shell.

**The ladder is not a fixed list of three.** It continues upward by two degrees indefinitely; the three entries in the table are only the ones a six-tone chord can reach unaided. This matters because the avoid-note rule can push a rung past the end of the printed list.

**The avoid-note rule is computed rather than tabulated, which is what removes the last hand-written quality table.** v4 hardcodes "the eleventh reads as wrong over the major degrees, so skip to the thirteenth" using a per-degree `QUALITY` array valid only for natural minor. The general rule reads the scale instead: if an extension's pitch class lands exactly one semitone above the pitch class of the chord's third, skip that rung and take the next. In F# natural minor this reproduces v4 exactly, and it keeps working in every other scale, including those where no tertian third exists at all.

Chord quality is never configured per chord. It falls out of the selected scale, so degree 0 of F# Aeolian gives F#m and degree 2 gives A major with no per-chord data anywhere. Changing that would change what the plugin is.
