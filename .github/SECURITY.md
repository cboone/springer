# Security Policy

## Reporting a Vulnerability

Report security issues through [GitHub's private vulnerability reporting](https://github.com/cboone/springer/security/advisories/new) rather than a public issue.

### What to Include

- The version or commit affected
- The host application and macOS version
- What happens, and what you expected instead
- A minimal reproduction, including a project file or saved plugin state if one is involved

### Response Timeline

Acknowledgement within 24 hours, an initial assessment within 48 hours. This is a single-developer project, so a fix follows as soon as the assessment allows rather than on a fixed schedule.

## Threat Model

Springer is an audio plugin. It runs **in the host's process**, with the host's privileges, and it has no network access, no subprocess execution, and no filesystem access beyond the plugin bundle itself.

That shape determines what counts as a vulnerability here.

### What Qualifies

- **Anything reachable from hostile saved state.** The host hands the plugin a state blob when a project is opened, and that blob can be arbitrary bytes: hand-edited, corrupted, or carried from a different version. A crash, an out-of-bounds read or write, or unbounded allocation triggered by loading state is a security issue, not merely a bug, because opening someone else's project is a normal thing to do.
- **Memory-safety faults reachable from host-supplied events or parameter values.** Note events, parameter changes and transport data all come from outside.
- **Anything that escapes the plugin's declared capabilities**, such as unexpected filesystem or network activity.

### Out of Scope

- Denial of service through legitimate configuration, such as an extreme strum value producing a long event queue.
- Crashes in the host itself that Springer merely surfaces.
- Issues in clap-wrapper, CLAP or the host, which should be reported upstream. A report here is still welcome if the interaction is what causes the fault.
