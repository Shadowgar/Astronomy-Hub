# ADR 0001: Universal application state belongs to Astronomy Hub

> Current-status addendum (2026-10-08): This is the dated 2026-10-02 decision
> record; its original text below is preserved.
> [ADR0009](0009-owned-earth-feature-reuse.md) and
> [current architecture](../UNIFIED_UNIVERSE_ARCHITECTURE.md) govern owned Earth,
> qualified feature reuse and implemented bounded Sky/Earth state/lifecycle.
> Body surfaces and broad astronomy extensions remain planned; accepted direction
> is not runtime proof or implementation authorization.


Date: 2026-10-02. Status: accepted architecture direction; implementation planned.

## Context

Renderers must preserve one product context when switching domains. Existing URL inputs do not constitute a universal multi-renderer state boundary.

## Decision

The Hub will own mode, time, observer, selected entity/body, camera intent, applicable layers and history/context. Renderers realize that intent and retain their internal scene state. Keep the boundary small; the exact schema is open.

## Consequences

Adapters must report relevant changes without becoming competing product authorities. Scientific identity and renderer coordinate/math ownership remain intact.

Detailed authority and current/planned/open distinctions: [Unified Universe Architecture](../UNIFIED_UNIVERSE_ARCHITECTURE.md). Execution requires its own bounded task.
