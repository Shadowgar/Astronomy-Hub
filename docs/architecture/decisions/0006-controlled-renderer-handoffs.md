# ADR 0006: Cross-engine navigation uses controlled handoffs

Date: 2026-10-02. Status: accepted architecture direction; implementation planned.

## Context

Different sky, Earth and body-surface domains have incompatible camera/coordinate models.

## Decision

Support explicit body exploration and later scale-driven navigation through controlled renderer handoffs carrying shared product identity, time, observer and camera intent.

## Consequences

Aim for visual/contextual continuity, not mathematically perfect camera transforms or one renderer at all scales. ISS is the first planned cross-engine slice; animation, lifetimes and bridge topology remain open.

Detailed authority and current/planned/open distinctions: [Unified Universe Architecture](../UNIFIED_UNIVERSE_ARCHITECTURE.md). Execution requires its own bounded task.
