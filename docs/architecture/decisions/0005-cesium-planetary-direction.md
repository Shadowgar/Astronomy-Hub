# ADR 0005: Cesium is the planetary surface direction

Date: 2026-10-02. Status: accepted architecture direction; implementation planned.

## Context

Earth features and datasets cannot be applied indiscriminately to other bodies.

## Decision

Use a body-aware Cesium planetary surface runtime with qualified body-specific imagery, terrain and context. First proof: Mars from a selected body in Sky. Moon and other qualified bodies may follow.

## Consequences

Implementation/data/frame feasibility remains to be qualified. Jupiter/Saturn may require atmospheric/globe visualization rather than solid terrain. Solar-system-scale renderer selection remains open.

Detailed authority and current/planned/open distinctions: [Unified Universe Architecture](../UNIFIED_UNIVERSE_ARCHITECTURE.md). Execution requires its own bounded task.
