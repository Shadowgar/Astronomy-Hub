# ADR 0007: Upstream renderer source is immutable by default

Date: 2026-10-02. Status: accepted architecture direction; implementation planned.

## Context

Deep permanent forks make SWE and God's Eye upgrades expensive and unsafe.

## Decision

Normal development treats upstream source as immutable: pinned/qualified upstream → adapter → external Hub extensions. Upgrade by qualifying newer revisions and repairing adapters.

## Consequences

For unavoidable changes, seek an extension point, prefer a generic upstream hook, then use a tiny explicit documented patch queue only with architectural exception and qualification/removal plan. Convenience is insufficient. Existing SWE divergence is not claimed absent or remediated. Phase B selected externally SHA-pinned God's Eye source, an independent full-application build/external ORAS wrapper and small shared bridge/protocol packages. This planned mechanism preserves independent runtime upgrades; exact APIs, SWE reconstruction and runtime qualification remain open.

Detailed authority and current/planned/open distinctions: [Unified Universe Architecture](../UNIFIED_UNIVERSE_ARCHITECTURE.md). Execution requires its own bounded task.
