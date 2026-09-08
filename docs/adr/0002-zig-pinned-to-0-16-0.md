# 0002. Zig, pinned to 0.16.0

**Status:** Accepted

## Context

The plugin format is a plain C API ([ADR 0003](./0003-author-clap-project-outward.md)) and the musical engine is small integer arithmetic over scale degrees. The language that fits is one with frictionless C interoperability and no runtime to get in the way of the audio thread.

Zig provides three things that fit this problem unusually well:

- **C interoperability with no binding layer.** A C header becomes a Zig module with no glue to write or maintain, which matters when the entire host interface is a header.
- **An explicit-allocator convention.** If nothing on the audio path is handed an allocator, then "does the audio path touch the heap" becomes a fact about the call graph rather than a convention that was hopefully honored. This is what makes [ADR 0007](./0007-no-allocation-on-the-audio-thread.md) checkable instead of aspirational.
- **`comptime`.** The scale tables, the parameter table, and the ABI layout assertions are all things that can be computed and checked at compile time rather than tested at run time.

The cost is that Zig is pre-1.0 and moves.

## Decision

Use Zig, pinned to 0.16.0. The pin lives in `build.zig.zon` as `minimum_zig_version`, and CI reads that file as the single source of truth rather than restating the version in a workflow.

Treat compiler upgrades as scheduled, deliberate work, never as incidental churn absorbed mid-feature.

## Consequences

One string is read four ways: `minimum_zig_version` in `build.zig.zon`, the `zig-version-file` input to the reusable CI workflow, the `version-file` input to `mlugg/setup-zig` inside it, and the developer's own toolchain. They cannot drift, because there is only one of them.

0.16.0 is an unusually disruptive release, and the consequences are concrete rather than hypothetical:

- `@cImport` is **deprecated** in favour of `b.addTranslateC()` in the build system. This is what forces [ADR 0004](./0004-clap-bindings-via-translate-c.md) rather than the conventional approach.
- `std.fs.File` moved to `std.Io.File`, and I/O now takes an `std.Io` parameter. This is why `src/platform/io.zig` exists at all: one instance, threaded through, rather than ambient file access.
- `@Type` is **removed**, replaced by the `@Fn` and `@Tuple` builtins.
- Runtime indexing into a vector is **forbidden**.

The practical consequence is that essentially every third-party Zig audio project predates this release and does not build against it. The project therefore keeps its dependency surface minimal and verifies each dependency against 0.16.0 before adopting it.
