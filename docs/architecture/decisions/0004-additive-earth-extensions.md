# ADR 0004: Astronomy Earth capabilities are additive extensions

> Current-status addendum (2026-10-08): This is the dated 2026-10-02 decision
> record; its original text below is preserved.
> [ADR0009](0009-owned-earth-feature-reuse.md) and
> [current architecture](../UNIFIED_UNIVERSE_ARCHITECTURE.md) govern owned Earth,
> qualified feature reuse and implemented bounded Sky/Earth state/lifecycle.
> Body surfaces and broad astronomy extensions remain planned; accepted direction
> is not runtime proof or implementation authorization.


Date: 2026-10-02. Status: accepted architecture direction; implementation planned.

## Context

Astronomy-specific additions must not create scattered edits inside God's Eye.

## Decision

Put Hub astronomy features outside upstream source through a compatibility adapter and external layer/plugin registry. Prefer qualified stable public/exported boundaries over broad internal imports.

## Consequences

Eclipse, fireball, aurora, light-pollution, observatory, smoke and ORAS-site layers are examples, not implemented modules. Initialization, time, selection, attribution and cleanup need a studied contract; no API is frozen.

Detailed authority and current/planned/open distinctions: [Unified Universe Architecture](../UNIFIED_UNIVERSE_ARCHITECTURE.md). Execution requires its own bounded task.
