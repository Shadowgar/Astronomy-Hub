# ADR 0005: Cesium is the planetary surface direction

> Current-status addendum (2026-10-08): This is the dated 2026-10-02 decision
> record; its original text below is preserved.
> [ADR0009](0009-owned-earth-feature-reuse.md) and
> [current architecture](../UNIFIED_UNIVERSE_ARCHITECTURE.md) govern owned Earth,
> qualified feature reuse and implemented bounded Sky/Earth state/lifecycle.
> Body surfaces and broad astronomy extensions remain planned; accepted direction
> is not runtime proof or implementation authorization.


Date: 2026-10-02. Status: accepted architecture direction; implementation planned.

## Context

Earth features and datasets cannot be applied indiscriminately to other bodies.

## Decision

Use a body-aware Cesium planetary surface runtime with qualified body-specific imagery, terrain and context. First proof: Mars from a selected body in Sky. Moon and other qualified bodies may follow.

## Consequences

Implementation/data/frame feasibility remains to be qualified. Jupiter/Saturn may require atmospheric/globe visualization rather than solid terrain. Solar-system-scale renderer selection remains open.

Detailed authority and current/planned/open distinctions: [Unified Universe Architecture](../UNIFIED_UNIVERSE_ARCHITECTURE.md). Execution requires its own bounded task.
