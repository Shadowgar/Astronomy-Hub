# ADR 0008: Provider and data licensing is independent of code licensing

Date: 2026-10-02. Status: accepted architecture direction; implementation planned.

## Context

The observed God's Eye LICENSE gives MIT rights for source code while explicitly excluding third-party data, runtime providers and visual models.

## Decision

Qualify source code, third-party data, third-party visual assets and runtime API terms separately. Architecture feature preservation does not authorize redistribution or public hosting of every provider or asset.

## Consequences

The future matrix records feature, provider, terms, credentials, public-host suitability, redistribution, attribution and fallback. Decisions may require configuration or alternate data. No legal audit or deployment approval occurs here.

Detailed authority and current/planned/open distinctions: [Unified Universe Architecture](../UNIFIED_UNIVERSE_ARCHITECTURE.md). Execution requires its own bounded task.
