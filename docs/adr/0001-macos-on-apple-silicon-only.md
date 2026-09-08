# 0001. macOS on Apple Silicon only

**Status:** Accepted

## Context

This is a single-developer project, and every axis of platform variation multiplies the decision lattice rather than adding to it: several audio-thread contracts, several plugin-format packaging stories, several signing regimes, several installer formats.

The target host settles most of it before preference gets a say. Springer exists because a Logic Pro Scripter script outgrew Scripter, and it is meant to sit in Logic's MIDI FX slot. Logic Pro runs on macOS and nowhere else. A Windows build would serve CLAP hosts on a platform where the originating use case cannot exist.

The boutique end of the plugin market is substantially populated by Mac-first shops that build against Apple's frameworks directly, because that is the platform their author works on. It is a well-precedented place to stand.

## Decision

Target macOS on Apple Silicon as the primary and only platform. Treat Intel Mac support as a retained option, not a commitment.

## Consequences

Committing to one platform removes whole categories of work rather than merely reducing them:

- **One audio-thread contract.** Core Audio's rules, rather than the intersection of Core Audio's, MMCSS's and Linux's differing and differently strict rules. This frees the project to use macOS mechanisms directly where it needs them instead of abstracting over three implementations.
- **One signing and distribution story.** One code-signing regime, one notarization flow, one installer format, one binary architecture.
- **One packaging target beyond CLAP.** AUv2, because that is what Logic loads. Not AUv2 and VST3 and AAX, each with its own wrapper quirks.

The cost is that users of CLAP hosts on Windows and Linux are not served. That cost is smaller here than it looks, and deliberately so: [ADR 0005](./0005-a-pure-musical-core-behind-a-seam.md) keeps the entire musical engine in pure Zig that names no CLAP type and no platform API. If this decision is ever revisited, the work is porting the plugin shell, not the instrument. The part that took the thinking is already portable by construction.
