# ADR 0004: Astronomy Earth capabilities are additive extensions

Date: 2026-10-02. Status: accepted architecture direction; implementation planned.

## Context

Astronomy-specific additions must not create scattered edits inside God's Eye.

## Decision

Put Hub astronomy features outside upstream source through a compatibility adapter and external layer/plugin registry. Prefer qualified stable public/exported boundaries over broad internal imports.

## Consequences

Eclipse, fireball, aurora, light-pollution, observatory, smoke and ORAS-site layers are examples, not implemented modules. Initialization, time, selection, attribution and cleanup need a studied contract; no API is frozen.

Detailed authority and current/planned/open distinctions: [Unified Universe Architecture](../UNIFIED_UNIVERSE_ARCHITECTURE.md). Execution requires its own bounded task.
