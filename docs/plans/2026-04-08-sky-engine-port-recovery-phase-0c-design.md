# Sky Engine Port Recovery Phase 0C Design

**Goal:** Move raw input/listener ownership and runtime clock/time ownership under `SkyCore`, leaving `SkyEngineRuntimeBridge.ts` more purely render-oriented.

**Scope:** This slice changes runtime ownership only. It does not rewrite visual behavior, data contracts, or perform module/painter decomposition.

## SkyInputService

Responsibilities:
- own raw wheel/pointer listener attachment and detachment for the runtime canvas
- translate DOM input events into runtime navigation calls
- read projected pick targets from runtime state and route selection back through the host callback boundary
- keep raw input listener ownership out of `SkyEngineScene.tsx`

Owned state:
- attached listener cleanup
- attached canvas boundary

Deferred:
- keyboard input
- multi-touch or pinch gestures
- a broader reusable input framework

## SkyClockService

Responsibilities:
- own runtime frame animation time
- own last-frame delta tracking
- own the current scene timestamp boundary used by rendering helpers
- accept host-synced scene time when props change and expose it back to bridge/render paths

Owned state:
- `animationTimeSeconds`
- `lastFrameDeltaSeconds`
- `sceneTimestampIso`

Deferred:
- TT/UTC/UT1 parity
- time playback modeling inside the runtime
- refraction/time-system coupling

## Bridge Shrink Target

This slice removes from `SkyEngineRuntimeBridge.ts`:
- raw input/listener ownership
- exported temporary input forwarding helpers
- ad hoc timestamp extraction ownership
- frame animation time ownership

The bridge keeps temporarily:
- projected object preparation
- direct background/object/overlay orchestration
- scene-state reporting
- pick-target writing for DOM proof hooks

## React Boundary After 0C

`SkyEngineScene.tsx` still:
- creates `SkyCore`
- provides canvas mount refs
- syncs external props into the runtime
- mounts and unmounts the runtime host

`SkyEngineScene.tsx` no longer owns:
- wheel/pointer listener attachment
- resize listener attachment
- direct runtime input forwarding
- runtime frame/clock state

## SkyCore Wiring

`SkyCore` explicitly constructs and owns:
- `SkyObserverService`
- `SkyNavigationService`
- `SkyProjectionService`
- `SkyInputService`
- `SkyClockService`

`SkyCore` also owns lifecycle hooks for:
- starting runtime services
- advancing service-owned frame cadence
- stopping runtime services
- disposing runtime services
