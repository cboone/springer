/* =============================================================================
 * Diatonic Chord Trigger — F# natural minor — v4
 * Logic Pro "Scripter" MIDI FX script
 * -----------------------------------------------------------------------------
 * New in v4: an "Open Macro" that drives five voicing controls at once, for
 * automating a section from closed and tight to open and bright. The five
 * controls remain individually settable by switching Openness Source to Manual.
 *
 * Parameter order has been reworked and should now be considered frozen:
 * automation binds to parameter INDEX, not name, so append any future
 * parameters to the end of the array rather than inserting them.
 *
 * Install: software instrument track -> MIDI FX slot -> Scripter -> Script
 * Editor, paste, "Run Script". Scripter must sit ABOVE the Arpeggiator.
 * ========================================================================== */

var NeedsTimingInfo = true;   // the minimum-length gate reads the host clock

/* ---------------------------------------------------------------------------
 * 1. The key.
 * ------------------------------------------------------------------------ */
var ROOT_PITCH = 6;                       // F#
var SCALE      = [0, 2, 3, 5, 7, 8, 10];  // natural minor
var N          = SCALE.length;

// Triad quality of each scale degree in natural minor. Used both for naming and
// for the avoid-note rule in the extension logic below.
var QUALITY = ["min", "dim", "maj", "min", "min", "maj", "maj"];

/* ---------------------------------------------------------------------------
 * 2. Tables.
 * ------------------------------------------------------------------------ */
// How far below the played note the chord root sits, in degrees.
var TRIGGER_ROLE_OFFSET = [0, 2, 4, 6];

// Minimum chord duration in quarter-note beats. "1 bar" assumes 4/4.
var MIN_LENGTH_BEATS = [0, 0.25, 0.5, 1, 2, 4, 8];

var TRIAD_NAMES   = ["F#m", "G#dim", "A",     "Bm",  "C#m", "D",     "E"];
var SEVENTH_NAMES = ["F#m7", "G#m7b5", "Amaj7", "Bm7", "C#m7", "Dmaj7", "E7"];
var ROMAN         = ["i", "ii\u00B0", "III", "iv", "v", "VI", "VII"];

var DEGREE_NOTE_NAMES = ["F#", "G#", "A", "B", "C#", "D", "E"];
var CHROMATIC_NAMES   = ["C", "C#", "D", "D#", "E", "F",
                         "F#", "G", "G#", "A", "A#", "B"];

/* ---------------------------------------------------------------------------
 * 3. Parameters.
 *
 *    ParameterChanged() receives an index, so the constants below must match
 *    the array positions. Text entries are inert dividers but still occupy an
 *    index, which is why they are counted in the comments.
 * ------------------------------------------------------------------------ */
var PARAM_ACTIVE = 0;
var PARAM_HOLD   = 11;

var PluginParameters = [
  /*  0 */ { name: "Chords Active", type: "checkbox", defaultValue: 1 },

  /*  1 */ { name: "\u2500\u2500 Openness \u2500\u2500", type: "text" },
  // The one lane to automate across a section. Everything below it in this
  // group follows the macro unless Openness Source is set to Manual.
  /*  2 */ { name: "Open Macro", type: "linear", minValue: 0, maxValue: 100,
             numberOfSteps: 100, unit: "%", defaultValue: 0 },
  /*  3 */ { name: "Openness Source", type: "menu",
             valueStrings: ["Open Macro", "Manual"], defaultValue: 0 },
  /*  4 */ { name: "Chord Tones", type: "linear", minValue: 2, maxValue: 6,
             numberOfSteps: 4, defaultValue: 3 },
  /*  5 */ { name: "Voicing Spread", type: "linear", minValue: 0, maxValue: 3,
             numberOfSteps: 60, unit: "oct", defaultValue: 0 },
  /*  6 */ { name: "Inversion", type: "linear", minValue: 0, maxValue: 3,
             numberOfSteps: 3, defaultValue: 0 },
  /*  7 */ { name: "Velocity Tilt", type: "linear", minValue: 0, maxValue: 1,
             numberOfSteps: 100, defaultValue: 0 },
  /*  8 */ { name: "Strum", type: "linear", minValue: 0, maxValue: 120,
             numberOfSteps: 120, unit: "ms", defaultValue: 0 },

  /*  9 */ { name: "\u2500\u2500 Harmony \u2500\u2500", type: "text" },
  /* 10 */ { name: "Trigger Note Is", type: "menu",
             valueStrings: ["Chord Root", "Chord Third", "Chord Fifth",
                            "Chord Seventh"], defaultValue: 0 },
  /* 11 */ { name: "Chord Hold", type: "checkbox", defaultValue: 0 },
  // Harmonic rhythm is deliberately NOT driven by the macro. It is structural
  // rather than timbral, and you will usually want to step it by hand or on its
  // own automation lane at section boundaries.
  /* 12 */ { name: "Min Chord Length", type: "menu",
             valueStrings: ["Off", "1/16", "1/8", "1/4 (beat)", "1/2",
                            "1 bar", "2 bars"], defaultValue: 0 },
  /* 13 */ { name: "Chord Octave", type: "linear", minValue: -2, maxValue: 2,
             numberOfSteps: 4, defaultValue: 0 },
  /* 14 */ { name: "Bass Note", type: "menu",
             valueStrings: ["Off", "Root -1 oct", "Root -2 oct"], defaultValue: 0 },
  /* 15 */ { name: "Include Trigger Note", type: "checkbox", defaultValue: 0 },
  /* 16 */ { name: "Off-Scale Input", type: "menu",
             valueStrings: ["Snap to nearest degree", "Pass through as played"],
             defaultValue: 0 },
  /* 17 */ { name: "Chord Zone Top", type: "linear", minValue: 0, maxValue: 127,
             numberOfSteps: 127, defaultValue: 127 },

  /* 18 */ { name: "\u2500\u2500 Control & Display \u2500\u2500", type: "text" },
  /* 19 */ { name: "Toggle CC (0 = none)", type: "linear", minValue: 0,
             maxValue: 127, numberOfSteps: 127, defaultValue: 0 },
  /* 20 */ { name: "Toggle Mode", type: "menu",
             valueStrings: ["Latching", "Momentary"], defaultValue: 0 },
  /* 21 */ { name: "Trace Chord Names", type: "checkbox", defaultValue: 0 },
  /* 22 */ { name: "Middle C Is", type: "menu",
             valueStrings: ["C3 (Yamaha)", "C4 (Roland)", "C5"], defaultValue: 1 }
];

/* ---------------------------------------------------------------------------
 * 4. State.
 * ------------------------------------------------------------------------ */
var chordsActive = true;
var held      = {};    // "channel:pitch" -> [ {pitch, channel, delay}, ... ]
var sustained = null;  // { id, voices, beat }
var lastOpenSig = "";  // so the trace reports openness only when it changes

function keyFor(event) { return event.channel + ":" + event.pitch; }

function ParameterChanged(param, value) {
  if (param === PARAM_ACTIVE) {
    chordsActive = (value >= 0.5);
    if (!chordsActive) releaseSustained();
  }
  if (param === PARAM_HOLD && value < 0.5) releaseSustained();
}

/* ---------------------------------------------------------------------------
 * 5. Degree arithmetic.
 * ------------------------------------------------------------------------ */
function pitchOfDegree(degree) {
  var oct = Math.floor(degree / N);
  var idx = degree - oct * N;
  return ROOT_PITCH + 12 * oct + SCALE[idx];
}

function degreeOfPitch(pitch) {
  var rel = pitch - ROOT_PITCH;
  var oct = Math.floor(rel / 12);
  var pc  = rel - 12 * oct;
  var best = 0, bestDist = 128;
  for (var k = 0; k < N; k++) {
    var d = Math.abs(SCALE[k] - pc);
    if (d < bestDist) { bestDist = d; best = k; }
  }
  if (Math.abs(SCALE[0] + 12 - pc) < bestDist) {
    bestDist = Math.abs(SCALE[0] + 12 - pc);
    best = N;
  }
  return { degree: oct * N + best, diatonic: (bestDist === 0) };
}

function degreeIndex(degree) { return ((degree % N) + N) % N; }

function noteName(pitch) {
  var located = degreeOfPitch(pitch);
  var letter  = located.diatonic ? DEGREE_NOTE_NAMES[degreeIndex(located.degree)]
                                 : CHROMATIC_NAMES[pitch % 12];
  var octave  = Math.floor(pitch / 12) - 2 + GetParameter("Middle C Is");
  return letter + octave;
}

// Fold an out-of-range pitch back by octaves rather than dropping it. Dropping
// would silently thin the chord at extreme spreads, which matters here because
// the arpeggiator's pattern length is set by how many notes it receives.
function foldIntoRange(p) {
  while (p > 127) p -= 12;
  while (p < 0)   p += 12;
  return p;
}

/* ---------------------------------------------------------------------------
 * 6. The Open macro.
 *
 *    Openness is three independent axes that happen to correlate perceptually:
 *    vertical span (spread, inversion), harmonic content (chord tones), and
 *    articulation/energy (velocity tilt, strum). The macro moves all of them
 *    along one curve so a single automation lane produces the arc.
 *
 *    The curve is baked in here rather than left to the automation lane.
 *    Perceived openness tracks roughly the logarithm of span, so a linear ramp
 *    in span arrives too early and then seems to stall; raising the macro to a
 *    power above 1 means a straight automation line sounds like an even
 *    opening. Draw the lane straight and let this do the shaping.
 * ------------------------------------------------------------------------ */
function resolveOpenness() {
  if (GetParameter("Openness Source") === 1) {          // Manual
    return {
      tones:     Math.round(GetParameter("Chord Tones")),
      spread:    GetParameter("Voicing Spread"),
      inversion: Math.round(GetParameter("Inversion")),
      tilt:      GetParameter("Velocity Tilt"),
      strum:     GetParameter("Strum"),
      macro:     null
    };
  }

  var m = GetParameter("Open Macro") / 100;             // 0..1

  return {
    // Extension depth in steps, so the chord thickens at audible moments rather
    // than crossfading. More tones also lengthens the arpeggiator's pattern.
    tones:     (m < 0.20) ? 3 : (m < 0.45) ? 4 : (m < 0.70) ? 5 : 6,
    spread:    2.2 * Math.pow(m, 1.6),
    inversion: Math.min(3, Math.floor(m * 4)),
    tilt:      Math.pow(m, 1.2),
    // Strum stays out of the first half; it is a late-arriving thickener, not
    // part of the initial opening.
    strum:     (m <= 0.5) ? 0 : ((m - 0.5) / 0.5) * 40,
    macro:     m
  };
}

/* ---------------------------------------------------------------------------
 * 7. Chord construction.
 * ------------------------------------------------------------------------ */
function buildChord(inputPitch, open) {
  var located = degreeOfPitch(inputPitch);
  if (!located.diatonic && GetParameter("Off-Scale Input") === 1) return null;

  var rootDegree = located.degree -
                   TRIGGER_ROLE_OFFSET[GetParameter("Trigger Note Is")];
  var rootIndex  = degreeIndex(rootDegree);

  // --- extension: stack thirds in degree space ------------------------------
  var degrees;
  if (open.tones <= 2) {
    degrees = [0, 4];                       // root and fifth
  } else {
    degrees = [0, 2, 4];                    // triad
    var ladder = [6, 8, 10];                // 7th, 9th, 11th
    for (var e = 0; e < open.tones - 3; e++) {
      var add = ladder[e];
      // Avoid-note rule: the eleventh sits a semitone above a major third and
      // will read as a wrong note over the major degrees (III, VI, VII here).
      // Skip to the thirteenth, which is consonant over every quality.
      if (add === 10 && QUALITY[rootIndex] === "maj") add = 12;
      degrees.push(add);
    }
  }
  for (var i = 0; i < degrees.length; i++) degrees[i] += rootDegree;

  // --- inversion: lift the lowest voice by whole octaves --------------------
  for (var v = 0; v < open.inversion; v++) {
    degrees.sort(function (a, b) { return a - b; });
    degrees[0] += N;                        // an octave is exactly N degrees
  }

  degrees.sort(function (a, b) { return a - b; });

  // --- spread: octave displacement, distributed bottom to top ---------------
  // Voice i is raised by floor(spread * i / (n-1)) octaves, so the maximum
  // displacement is floor(spread) and the chord fans out evenly as spread
  // rises. Displacement is always by whole octaves: any other interval would
  // change the chord rather than reopen it.
  var n = degrees.length;
  if (open.spread > 0 && n > 1) {
    for (var s = 0; s < n; s++) {
      degrees[s] += N * Math.floor(open.spread * s / (n - 1));
    }
  }

  var octShift = Math.round(GetParameter("Chord Octave"));

  var pitches = [];
  for (var j = 0; j < degrees.length; j++) {
    pitches.push(foldIntoRange(pitchOfDegree(degrees[j]) + 12 * octShift));
  }

  var bassMode = GetParameter("Bass Note");
  if (bassMode > 0) {
    pitches.push(foldIntoRange(pitchOfDegree(rootDegree) + 12 * (octShift - bassMode)));
  }

  if (GetParameter("Include Trigger Note")) pitches.push(inputPitch);

  // De-duplicate: two note-ons on one pitch followed by a single note-off cut a
  // note that should still be sounding.
  var seen = {}, out = [];
  for (var m2 = 0; m2 < pitches.length; m2++) {
    var p = pitches[m2];
    if (seen[p]) continue;
    seen[p] = true;
    out.push(p);
  }
  out.sort(function (a, b) { return a - b; });

  return {
    pitches:   out,
    rootIndex: rootIndex,
    diatonic:  located.diatonic,
    id:        out.join(",")
  };
}

/* ---------------------------------------------------------------------------
 * 8. Emitting and releasing.
 * ------------------------------------------------------------------------ */
function emitChord(chord, srcEvent, open) {
  var voices = [];
  var n = chord.pitches.length;

  for (var i = 0; i < n; i++) {
    var delay = open.strum * i;

    // Velocity tilt: the bass loses up to 45% and the top gains up to 25% at
    // full tilt, so the chord leans upward without simply getting quieter. With
    // velocity routed to filter cutoff in the synth, this is what turns
    // "brighter" from a registral effect into a timbral one.
    var frac  = (n > 1) ? i / (n - 1) : 1;
    var scale = 1 + open.tilt * (-0.45 + 0.70 * frac);
    var vel   = Math.max(1, Math.min(127, Math.round(srcEvent.velocity * scale)));

    var on = new NoteOn(srcEvent);
    on.pitch    = chord.pitches[i];
    on.velocity = vel;
    on.sendAfterMilliseconds(delay);
    voices.push({ pitch: chord.pitches[i], channel: srcEvent.channel, delay: delay });
  }
  return voices;
}

// Releases carry the same delay their note-on did, so a strummed upper voice
// can never be released before it was struck.
function releaseVoices(voices) {
  for (var i = 0; i < voices.length; i++) {
    var off = new NoteOff();
    off.pitch    = voices[i].pitch;
    off.channel  = voices[i].channel;
    off.velocity = 0;
    off.sendAfterMilliseconds(voices[i].delay);
  }
}

function releaseSustained() {
  if (sustained) { releaseVoices(sustained.voices); sustained = null; }
}

/* ---------------------------------------------------------------------------
 * 9. Minimum-duration gate. Beat-based so it tracks tempo; disabled when the
 *    transport is stopped, since the clock does not advance then and the gate
 *    would otherwise latch shut on the first chord you played live.
 * ------------------------------------------------------------------------ */
function nowBeats() {
  var info = GetTimingInfo();
  return info.playing ? info.blockStartBeat : null;
}

function withinMinLength() {
  var minBeats = MIN_LENGTH_BEATS[GetParameter("Min Chord Length")];
  if (minBeats <= 0 || !sustained || sustained.beat === null) return false;
  var nb = nowBeats();
  if (nb === null) return false;
  var elapsed = nb - sustained.beat;
  return (elapsed >= 0 && elapsed < minBeats);   // negative = loop jump
}

/* ---------------------------------------------------------------------------
 * 10. Tracing.
 * ------------------------------------------------------------------------ */
function traceChord(inputPitch, chord, open, note) {
  if (!GetParameter("Trace Chord Names")) return;

  var name = (chord.pitches.length >= 4) ? SEVENTH_NAMES[chord.rootIndex]
                                         : TRIAD_NAMES[chord.rootIndex];
  var spelled = [];
  for (var t = 0; t < chord.pitches.length; t++) {
    spelled.push(noteName(chord.pitches[t]));
  }

  // Report the resolved openness only when it actually moves, so an automation
  // ramp does not bury the chord log.
  var sig = open.tones + "/" + open.spread.toFixed(2) + "/" + open.inversion +
            "/" + open.tilt.toFixed(2) + "/" + Math.round(open.strum);
  if (sig !== lastOpenSig) {
    lastOpenSig = sig;
    Trace("    open " +
          (open.macro === null ? "manual" : Math.round(open.macro * 100) + "%") +
          ":  tones " + open.tones +
          ",  spread " + open.spread.toFixed(2) + " oct" +
          ",  inv " + open.inversion +
          ",  tilt " + open.tilt.toFixed(2) +
          ",  strum " + Math.round(open.strum) + " ms");
  }

  Trace(noteName(inputPitch) + "  ->  " + name +
        "   (" + ROMAN[chord.rootIndex] + " of F# minor)" +
        (chord.diatonic ? "" : "   [snapped]") +
        "   [ " + spelled.join("  ") + " ]" +
        (note ? "   " + note : ""));
}

/* ---------------------------------------------------------------------------
 * 11. MIDI handling.
 * ------------------------------------------------------------------------ */
function HandleMIDI(event) {

  if (event instanceof ControlChange) {
    var toggleCC = Math.round(GetParameter("Toggle CC (0 = none)"));
    if (toggleCC > 0 && event.number === toggleCC) {
      if (GetParameter("Toggle Mode") === 0) {
        if (event.value >= 64) chordsActive = !chordsActive;   // latching
      } else {
        chordsActive = (event.value >= 64);                    // momentary
      }
      if (!chordsActive) releaseSustained();
      SetParameter(PARAM_ACTIVE, chordsActive ? 1 : 0);
      return;                                                  // swallow the CC
    }
    event.send();
    return;
  }

  var isNoteOn  = (event instanceof NoteOn) && event.velocity > 0;
  var isNoteOff = (event instanceof NoteOff) ||
                  ((event instanceof NoteOn) && event.velocity === 0);
  if (!isNoteOn && !isNoteOff) { event.send(); return; }

  var k = keyFor(event);

  // Note off: always honour the record, active or not, so the toggle can be
  // thrown mid-chord without hanging notes.
  if (isNoteOff) {
    var voices = held[k];
    if (!voices) { event.send(); return; }
    releaseVoices(voices);              // empty array in hold mode
    delete held[k];
    return;
  }

  if (!chordsActive) { event.send(); return; }
  if (event.pitch > GetParameter("Chord Zone Top")) { event.send(); return; }

  // Openness is sampled once per note-on. Automation therefore takes effect at
  // the next chord rather than mid-sustain, which is what keeps a held chord
  // from morphing under the arpeggiator.
  var open  = resolveOpenness();
  var chord = buildChord(event.pitch, open);
  if (chord === null) { event.send(); return; }

  if (GetParameter("Chord Hold") < 0.5) {
    held[k] = emitChord(chord, event, open);
    traceChord(event.pitch, chord, open, null);
    return;
  }

  held[k] = [];                         // consume the trigger note

  if (sustained && sustained.id === chord.id) {
    traceChord(event.pitch, chord, open, "(unchanged, holding)");
    return;
  }
  if (withinMinLength()) {
    traceChord(event.pitch, chord, open, "(suppressed: minimum length)");
    return;
  }

  releaseSustained();
  sustained = { id: chord.id, voices: emitChord(chord, event, open), beat: nowBeats() };
  traceChord(event.pitch, chord, open, "(new chord, held)");
}

/* ---------------------------------------------------------------------------
 * 12. Reset: transport stop, bypass, recompile.
 * ------------------------------------------------------------------------ */
function Reset() {
  held        = {};
  sustained   = null;
  lastOpenSig = "";
  MIDI.allNotesOff();
}