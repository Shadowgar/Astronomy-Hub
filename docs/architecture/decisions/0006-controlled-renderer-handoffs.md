# ADR 0006: Cross-engine navigation uses controlled handoffs

> Current-status addendum (2026-10-08): This is the dated 2026-10-02 decision
> record; its original text below is preserved.
> [ADR0009](0009-owned-earth-feature-reuse.md) and
> [current architecture](../UNIFIED_UNIVERSE_ARCHITECTURE.md) govern owned Earth,
> qualified feature reuse and implemented bounded Sky/Earth state/lifecycle.
> Body surfaces and broad astronomy extensions remain planned; accepted direction
> is not runtime proof or implementation authorization.


Date: 2026-10-02. Status: accepted architecture direction; implementation planned.

## Context

Different sky, Earth and body-surface domains have incompatible camera/coordinate models.

## Decision

Support explicit body exploration and later scale-driven navigation through controlled renderer handoffs carrying shared product identity, time, observer and camera intent.

## Consequences

Aim for visual/contextual continuity, not mathematically perfect camera transforms or one renderer at all scales. ISS is the first planned cross-engine slice. Phase B selected same-origin disposable frames, a versioned capability bridge and one active heavy renderer after settled switches, disposing the inactive runtime. Mobile defaults to serial teardown/start; brief desktop overlap is only a later qualified handoff option. Exact animation/prewarming, APIs and runtime qualification remain open; this lifecycle is planned, not implemented.

Detailed authority and current/planned/open distinctions: [Unified Universe Architecture](../UNIFIED_UNIVERSE_ARCHITECTURE.md). Execution requires its own bounded task.
