# ADR 0003: God's Eye View is the complete upgradeable Earth foundation

Date: 2026-10-02. Status: accepted architecture direction; implementation planned.

## Context

Earth exploration needs a mature Earth product rather than a reduced astronomy globe. No God's Eye integration has started.

## Decision

Use the complete applicable God's Eye Earth runtime, independently pinned and upgradeable. Preserve non-astronomy capabilities where provider/data/asset terms permit; do not remove them merely for lacking astronomy relevance.

## Consequences

Provider restrictions may require configuration, alternate data, attribution, or an explicitly unavailable layer. Live/simulated/estimated provenance must remain honest. Consumption mechanism is open pending Phase B, not locked to a submodule.

Detailed authority and current/planned/open distinctions: [Unified Universe Architecture](../UNIFIED_UNIVERSE_ARCHITECTURE.md). Execution requires its own bounded task.
