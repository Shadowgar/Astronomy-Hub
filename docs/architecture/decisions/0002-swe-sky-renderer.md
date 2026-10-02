# ADR 0002: Stellarium Web Engine remains the Sky renderer

Date: 2026-10-02. Status: accepted architecture direction; implementation planned.

## Context

The current ORAS runtime is SWE at `/oras-sky-engine/`; `/sky-engine` is its Hub host.

## Decision

Retain upstream/upgradable SWE for observer-centered sky, stars, DSOs, planets, atmosphere, constellations, projections and surveys. The future Hub owns visible application chrome around the embedded runtime; SWE owns rendering and scene lifecycle.

## Consequences

No React/Babylon replacement or extraction of a shared renderer. Safe chrome and selection/time/camera/layer interfaces require Phase B qualification. No chrome change is implemented here.

Detailed authority and current/planned/open distinctions: [Unified Universe Architecture](../UNIFIED_UNIVERSE_ARCHITECTURE.md). Execution requires its own bounded task.
