# 0009. Macro shaping is per-target Start, End and Curve parameters

**Status:** Accepted

## Context

The v4 script's Open Macro drives five voicing controls from one automation lane, and every curve is a literal in the source. Chord depth steps at 20%, 45% and 70%. Spread is `2.2 * m^1.6`. Tilt is `m^1.2`. Strum is zero below 50% and ramps linearly to 40 ms above it.

The script is explicit that this is a deliberate choice and says why: perceived openness tracks roughly the logarithm of span, so a linear ramp arrives too early and then seems to stall, and raising the macro to a power above 1 means a straight automation line sounds like an even opening.

The reasoning is right. Its expression as constants is what makes them unreachable. Changing where the chord thickens means editing and recompiling, and the shape cannot be automated, saved per project, or differ between two instances of the plugin.

## Decision

Every macro target gets three parameters, expressed in the target's own units: **Start**, its value at macro 0%; **End**, its value at macro 100%; and **Curve**, the interpolation exponent, roughly 0.25 to 4.0 with 1.0 linear.

The value is `Start + (End - Start) * m^Curve`, quantized afterwards by rounding to the target's own step. `Start > End` is legal, so the macro can close one axis while opening others.

No curve constant lives in code. v4's numbers survive only as the default values of these parameters.

## Consequences

**The relationships are the specification; the numbers are not.** Of the five axes carried over from v4, two reproduce it exactly (spread's `2.2` and `1.6`, tilt's `1.2`) and three are approximations: chord depth is still four front-loaded discrete steps but the later breakpoints arrive slightly differently, inversion rounds to the nearest step rather than flooring, and strum is deliberately a smooth `Curve 3.0` ramp rather than a hard knee at exactly 50%. That divergence is the intended consequence of moving shaping out of code, not a porting error.

It is also why the reference vectors are generated with `Openness Source` set to Manual. The behavior that must match v4 exactly is then tested apart from the behavior that deliberately does not, and neither can quietly absorb a defect in the other.

**Not every constant becomes a parameter.** Velocity tilt's own numbers stay in code: the bass loses up to 45% and the top gains up to 25% at full tilt. Those describe the shape of the tilt feature itself, the thing that makes a chord lean upward rather than merely get quieter, rather than how the macro reaches it. The distinction is recorded at the declaration site.

**Openness is sampled once per note-on, not per block.** Automation therefore takes effect at the next chord rather than mid-sustain, which is what stops a held chord from morphing underneath a downstream arpeggiator. This is inherited from v4 and is load-bearing rather than incidental.

The cost is 24 parameters for the eight targets, which is the bulk of the plugin's parameter count and the strongest argument for pulling the GUI forward. If Logic's generic list proves unusable, the mapping group could move into state instead, at the cost of no longer being able to automate a curve.
