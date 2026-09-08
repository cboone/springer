# 0011. Non-7-note scales stack by degree, not by interval

**Status:** Accepted

## Context

Springer offers 27 scales. Most have seven degrees: the diatonic modes, and all seven modes each of harmonic and melodic minor. Several do not: major and minor pentatonic have five, blues has six, whole tone has six, and both octatonic collections have eight.

The chord construction in [ADR 0010](./0010-chord-depth-is-a-ladder-color-is-orthogonal.md) stacks alternating scale degrees. On a seven-note scale that produces tertian harmony, because two degrees up a diatonic scale is a third. On any other scale it does not.

There are two coherent answers. Stack by *interval*, finding the nearest scale tone to each stacked third, which produces something recognisably chord-shaped on every scale at the cost of a rule that no longer follows from the scale. Or stack by *degree* and accept whatever the scale gives.

## Decision

Stack by degree, with `N` read from the selected scale rather than fixed at 7. Degree arithmetic generalizes directly:

```text
pitchOfDegree(d)  = root + 12 * floor(d / N) + SCALE[d - N * floor(d / N)]
degreeOfPitch(p)  = nearest degree, plus whether the input was already in key
```

## Consequences

The harmony that results is unusual by construction, and it is the reason to have these scales at all:

- On **whole tone**, two degrees is a major third, so the triad is augmented.
- On **octatonic**, two degrees is a minor third, so the stack is diminished.
- On **pentatonic**, the stack is quartal.

An octave is exactly `N` degrees whatever `N` is, which is what keeps inversion and voicing spread from leaving the key by construction rather than by check.

**Chord Tones therefore means "how many rungs", not "how many thirds", and the plugin must say so.** This is a labelling and documentation problem rather than a correctness one, and it is the one place where a user is most likely to conclude the plugin is broken when it is working exactly as designed.

**`Trigger Note Is` loses its literal meaning on short scales.** It subtracts `[0, 2, 4, 6]` degrees from the played note so the same key can be read as the chord's root, third, fifth or seventh. Six degrees down a pentatonic is more than an octave, and nothing about that interval is a seventh. The parameter's value strings therefore name the degree offset alongside the chord-tone name.

**Flooring toward negative infinity is a live hazard in the port, not a formality.** JavaScript's `Math.floor` floors; Zig's `/` and `%` on signed integers truncate toward zero. Every division and remainder in the degree arithmetic must use `@divFloor` and `@mod`, or every pitch below the reference root lands on the wrong degree. A later refactor to `/` would compile, pass any test that only plays above the root, and be wrong, which is why this gets a source canary and not only a unit test.
