# Sky Engine Port Recovery Phase 0A Design

**Goal:** Create the first real Sky Engine runtime boundary by moving Babylon lifecycle ownership and frame orchestration behind `SkyCore` while keeping React as a thin mount adapter.

**Scope:** This slice extracts runtime ownership only. It does not rewrite labels, atmosphere, stars, constellations, navigation math, or Hub UX.

## Runtime Boundary

Inside Sky Engine:
- Babylon `Engine` and `Scene` lifecycle
- runtime start/stop/update/render/dispose
- ordered module registration and execution
- runtime-owned frame orchestration
- temporary bridge for the existing direct background/object/overlay pipeline

Outside Sky Engine:
- React mount/unmount host
- engine switching and route ownership
- external prop/context updates
- pointer/input listener attachment for this slice only
- non-viewport Hub UI

## SkyCore

`SkyCore` is the engine-owned runtime shell. In Phase 0A it must:
- be instantiable without React
- create and own Babylon runtime references
- own the render loop
- own ordered module registration
- expose a narrow bridge for prop sync and temporary pointer/input forwarding
- dispose internal layers and Babylon resources

Deferred from this slice:
- dedicated observer service
- dedicated navigation service
- dedicated painter abstraction
- deeper module decomposition for stars, atmosphere, overlays, and labels

## SkyModule

Phase 0A module interface:
- `id`
- `renderOrder`
- optional `start`
- optional `update`
- optional `render`
- optional `stop`
- optional `dispose`

Registry behavior:
- `SkyCore` sorts modules by `renderOrder`
- `SkyCore.update()` calls registered module `update()` methods in order
- `SkyCore.render()` calls registered module `render()` methods in order
- the current scene behavior is wrapped as one temporary bridge module for this phase

## React Mount Adapter

After this slice, `SkyEngineScene.tsx` still:
- renders the foreground and background canvases
- creates `SkyCore`
- pushes external prop changes into the runtime
- attaches temporary pointer/wheel listeners
- forwards pointer/input to `SkyCore`

`SkyEngineScene.tsx` must no longer:
- create Babylon `Engine` or `Scene`
- own `runRenderLoop`
- own frame orchestration
- directly dispose Babylon layers

## Temporary Bridge Rules

Temporary bridge code allowed in Phase 0A:
- the current render/update behavior remains wrapped behind a `SkyCore` bridge module
- pointer/input forwarding remains in `SkyEngineScene.tsx` and is forwarded into `SkyCore`
- existing direct background/object/overlay layers remain intact and are not decomposed further yet

Next phase migration target:
- move pointer/input handling from React adapter into runtime-owned services
- split the bridge module into runtime-owned observer/navigation/render modules
