# ADR 0003: God's Eye View is the complete upgradeable Earth foundation

> Current-status addendum (2026-10-08): This is the dated 2026-10-02 decision
> record; its original text below is preserved. Its full-application Earth topology is superseded by ADR0009.
> [ADR0009](0009-owned-earth-feature-reuse.md) and
> [current architecture](../UNIFIED_UNIVERSE_ARCHITECTURE.md) govern owned Earth,
> qualified feature reuse and implemented bounded Sky/Earth state/lifecycle.
> Body surfaces and broad astronomy extensions remain planned; accepted direction
> is not runtime proof or implementation authorization.


Date: 2026-10-02. Status: accepted architecture direction; implementation planned.

## Context

Earth exploration needs a mature Earth product rather than a reduced astronomy globe. No God's Eye integration has started.

## Decision

Use the complete applicable God's Eye Earth runtime, independently pinned and upgradeable. Preserve non-astronomy capabilities where provider/data/asset terms permit; do not remove them merely for lacking astronomy relevance.

## Consequences

Provider restrictions may require configuration, alternate data, attribution, or an explicitly unavailable layer. Live/simulated/estimated provenance must remain honest. Phase B selected externally SHA-pinned source, an independent full-application build and external ORAS wrapper, with upstream immutable by default. This is planned consumption, not an implemented integration; exact adapter/extension APIs and production qualification remain open.

Detailed authority and current/planned/open distinctions: [Unified Universe Architecture](../UNIFIED_UNIVERSE_ARCHITECTURE.md). Execution requires its own bounded task.
