# 0008. Parameters are identified by stable `clap_id`

**Status:** Accepted

## Context

Scripter binds automation to a parameter's position in the `PluginParameters` array. The v4 script says so in its own header, and states the consequence as a standing instruction to its future self:

> Parameter order has been reworked and should now be considered frozen: automation binds to parameter INDEX, not name, so append any future parameters to the end of the array rather than inserting them.

That is the constraint that shaped the script and eventually helped end it. Every new control had to go at the bottom regardless of what it belonged next to, inert text dividers occupy indices and so can never be removed, and reordering the interface for legibility would silently repoint every automation lane in every project that used it.

CLAP does not have this problem. `clap_param_info` carries an explicit `clap_id`, and hosts persist that id rather than an ordinal.

## Decision

Assign every parameter a `clap_id` once, in an enum, doc-commented as permanent. Ids are never reused, never renumbered, and never derived from position. Display order is independent of them, and groups are numbered with gaps between so a later addition does not disturb the ordering of its neighbours.

## Consequences

Parameters can be reordered, regrouped, or inserted freely, because none of that is what a saved project refers to.

**A deferred parameter costs nothing.** This is the reason [ADR 0013](./0013-defer-the-gui.md) can leave `Middle C Is` out of the parameter set without foreclosing anything: adding it later disturbs no existing automation. Under Scripter that same choice would have been irreversible in one direction, appending forever to a frozen array. Springer is not subject to that constraint and should not act as though it were.

**AUv2 ordering is a separate problem and does not go away.** Parameter *order* still matters to Logic and GarageBand even when ids do not change, because those hosts present parameters in the order the Audio Unit reports them. clap-wrapper exposes `clap.plugin-auv2-param-ordering` for exactly this. Implement it from the start rather than discovering the need after the first release, when the fix would be visible to every existing project.

Ids being stable is a claim that has to be checked, not merely intended. The relevant check is a source canary over the id enum, and the by-hand verification is to confirm that an automation lane still binds to the right parameter after a rebuild.
