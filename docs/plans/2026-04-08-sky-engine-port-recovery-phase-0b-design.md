# Sky Engine Port Recovery Phase 0B Design

**Goal:** Reduce the temporary Sky runtime bridge by extracting runtime-owned observer, navigation, and projection services under `SkyCore`.

**Scope:** This slice changes runtime structure only. It does not rewrite visuals, labels, atmosphere, stars, or the React host boundary from Phase 0A.

## SkyObserverService

Responsibilities:
- own the host-driven `SkyEngineObserver` snapshot inside the runtime
- expose update/get access for runtime consumers
- keep observer ownership out of the React mount adapter and out of the bridge

Deferred:
- runtime-owned time service
- ERFA-like observer/time system
- pressure/refraction state ownership

## SkyNavigationService

Responsibilities:
- own center direction, target vector, selection target state, and pointer drag state
- own runtime navigation updates each frame
- own forwarded wheel/pointer input handling
- keep navigation state out of React even while React still forwards raw events

Deferred:
- fully moving pointer listener attachment out of React
- separate interaction and picking services

## SkyProjectionService

Responsibilities:
- own projection mode
- own viewport sizing config
- own current/desired FOV state
- build projection views and wrap projection/unprojection helpers

Deferred:
- deeper painter-facing projection abstraction
- runtime-owned time/projection coupling

## Bridge Shrink Target

This slice removes from `SkyEngineRuntimeBridge.ts`:
- host observer ownership
- navigation state ownership
- pointer drag state ownership
- projection-mode/FOV/view construction ownership

The bridge keeps temporarily:
- timestamp derivation
- projected object preparation
- direct background/object/overlay orchestration
- scene-state proof writing and pick-target writing

Timestamp/time ownership remains deferred to a later runtime phase and must not be absorbed into `SkyObserverService` in Phase 0B.
