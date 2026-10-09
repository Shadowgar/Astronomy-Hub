# ADR 0002: Stellarium Web Engine remains the Sky renderer

> Current-status addendum (2026-10-08): This is the dated 2026-10-02 decision
> record; its original text below is preserved.
> [ADR0009](0009-owned-earth-feature-reuse.md) and
> [current architecture](../UNIFIED_UNIVERSE_ARCHITECTURE.md) govern owned Earth,
> qualified feature reuse and implemented bounded Sky/Earth state/lifecycle.
> Body surfaces and broad astronomy extensions remain planned; accepted direction
> is not runtime proof or implementation authorization.


Date: 2026-10-02. Status: accepted architecture direction; implementation planned.

## Context

The current ORAS runtime is SWE at `/oras-sky-engine/`; `/sky-engine` is its Hub host.

## Decision

Retain upstream/upgradable SWE for observer-centered sky, stars, DSOs, planets, atmosphere, constellations, projections and surveys. The future Hub owns visible application chrome around the embedded runtime; SWE owns rendering and scene lifecycle.

## Consequences

No React/Babylon replacement or extraction of a shared renderer. Safe chrome and selection/time/camera/layer interfaces require Phase B qualification. No chrome change is implemented here.

Detailed authority and current/planned/open distinctions: [Unified Universe Architecture](../UNIFIED_UNIVERSE_ARCHITECTURE.md). Execution requires its own bounded task.
