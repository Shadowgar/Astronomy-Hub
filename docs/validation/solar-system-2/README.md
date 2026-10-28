# Solar System 2.0 — implementation and qualification

This run implements the owner's October28 reconstruction directive on existing
`recovery/reconcile-20261026` / draft PR107. Starting head was
`51771f06d9ffd3b919672b7542a9c84df13d92f6`; verified main was
`9a03d8260a529f5858c5c3298cbb9d32b721daeb`. The owner rejected the preceding
visual implementation. This candidate requires a new owner visual decision;
engineering tests cannot supply that decision or release approval.
Application commit: `fe3c3e87` (subsequent evidence-only head is recorded on PR107).

Private owner entry points, after qualification:
- [Solar explorer](http://localhost:4231/solar-system?date=2026-10-27T04:00:00Z)
- [Before / original reference / after gallery and recordings](http://localhost:4231/owner-review/solar-system-2/)
- [Saturn](http://localhost:4231/solar-system?date=2026-10-27T04:00:00Z&solarBody=saturn)
- [433 Eros](http://localhost:4231/solar-system?date=2026-10-27T04:00:00Z&solarBody=eros)
- [Controlled coarse lunar terrain demonstration](http://localhost:4231/owner-review/solar2-terrain/)

These URLs are private to the owner's computer. No public listener, tunnel,
firewall change, deployment, merge, branch deletion or source publication occurs.
The preserved `hub-visual` build is the immediate visual rollback; the earlier
`hub` build and old owner galleries remain available on disk.

## Working changes

One Three0.180 runtime now separates source time, CPU double-precision camera
coordinates, local GPU coordinates, camera control, resource ownership and
render passes. Planetary centers/radii remain the existing JPL contract. The
persistent scene updates source vectors without recreating WebGL. Monotonic
pause/play/reverse/rate controls use checked hourly Hermite windows and stop at
unavailable coverage. Explicit date changes update the reference trajectory
paths; playback retains those paths' reference epoch, disclosed in Sources.
Returning to current time starts1× playback after a new qualified window loads.
The inherited Solar shortcut also now reuses the established native handoff
path/view contracts: saved observing coordinates, final UTC and same-mode cameras
are preserved; direct bookmarks initialize the destination from validated intent.
Different-mode exits drop stale Earth search-history flags. The actual Windows
repeated Earth-search→Solar→Sky→Solar→Earth journey and direct bookmark pass.

Selection stays in Solar and flies to physical-scale destinations. Orbit,
follow, free flight, direct search and touch/keyboard movement share one
scheduler. Input cancels camera travel. Whole-segment surface guards cover
free flight, animated travel, mouse/pinch/pan, zoom and orbit buttons. Camera,
final UTC, quality/layers, navigation mode, asteroid visibility and selected
rate survive explicit planetary-system return. Context loss visibly destroys
the old renderer and restores the last actual epoch/camera with one new canvas.

NASA original GLBs replace coarse procedural appearance for Mercury, Venus
and all giants; original UV topology is retained, including cube atlases.
Eros uses NASA's irregular visualization mesh with explicit illustrative
scale/orientation. Existing Earth and Mars imagery remains. Resource ownership
bounds asset responses, decoded texture accounting, cancellation and disposal.
The production Hub build explicitly includes the new small visual pack.

The Sun uses authored surface emission, controlled HDR bloom and one final
ACES/sRGB transform. Planets use origin-invariant source lighting. Saturn has
source-informed radial bands, Cassini Division, a NASA radial color map,
view/incidence scattering and both planet-on-ring and ring-on-planet shadows.
Per-body atmosphere profiles remain optical approximations. Efficient uses
bounded direct rendering; Balanced/Detailed enable HDR where supported. Shared
planetary-system materials retain explicit source-Sun lighting after this
refactor, with actual GPU red/green evidence.

The JPL SBDB pack contains2,048 real diameter-ranked main-belt identities and
433Eros, a separate near-Earth destination. Positions advance through the same
TDB time using a disclosed two-body model, limited to±180days from
JD2461200.5TDB.16 independent Horizons comparisons of4 representative bodies
observed up to19,674.473km discrepancy; this is not full-population accuracy.
Out-of-coverage geometry is hidden and Eros approach is disabled with feedback.
A separate illustrative density layer stays opt-in and carries no identities.

The independent Moon experiment installs a bounded LOLA terrain provider into
the existing native Cesium runtime. Actual source LOD0–3 and signed heights
work; native culling/mesh refinement remain native. The original4pixels/degree
grid is coarse, approximately7.58km/sample. Pole caps are explicitly interpolated,
not measured detail. The normal Moon route/runtime/artifacts remain unchanged.

## Evidence and limits

- [Science/source identity, acquisition receipts and focused Docker tests](SCIENCE.md)
- [Original imagery/models, license and compatibility decisions](ASSET_SOURCES.md)
- [Materials, ring sampling and shared-system GPU regressions](GRAPHICS.md)
- [Native controlled terrain, exact resolution and independent corrections](TERRAIN_DEMO.md)
- [Windows GPU performance measurements](PERFORMANCE.md)
- [Separate non-author integration/source correction review](INDEPENDENT_REVIEW.md)
- [Exact commands, failures and final pass counts](COMMANDS.md)
- [Compact final Windows runtime/capture receipt](runtime-receipt.json)
- [Preservation receipt](evidence/preservation.json)

The shipped original NASA visual pack is23,463,267bytes, not a giant sky catalog.
Runtime GLB texture decoding is currently capped at2048pixels for every tier;
quality changes pixel ratio/effect sampling, not source resolution. No adaptive
texture promotion, temporal cloud renderer or terrain-level Solar surface is
claimed. Eros is the single shaped asteroid destination; the main-belt population
uses point markers, not individually qualified shape models. Giant/Mercury source
meshes retain UVs but are normalized to API mean-radius spheres; no oblateness,
spin, epoch-qualified pole, calibrated brightness or measured optical depth claim.
Moon terrain lighting retains the native sphere mask, without terrain self-shadow.

Saturn's accurate major moons are reached through the explicit existing
parent-centered system. They are not silently attached to the Solar Saturn
barycenter. Existing finite October2026 system-source coverage remains visible.
All/Inner/Outer remain camera framing presets, never body-visibility filters.

The four approved PNGs and their archive remain byte-identical, including primary
SHA256 `045227411f54f4e27823b465d233f35b8e0a05797aa271eeee6db97ad824c1ab`.
111 native Sky output files match the prior preview exactly. Native Sky/Earth/Moon
source/pins, existing scientific packs and dependency manifests are unchanged.
The owner checkout's pre-existing `.vscode/settings.json` modification remains.
Only existing task-owned preview/backend services were started/restarted; no
protected data or volume mutation is part of this work.

## Acceptance and release boundary

This is a substantially integrated engineering candidate for owner evaluation,
not approval of the consolidated PR. Actual Windows NVIDIA operation and emulated
mobile layouts do not qualify physical iPhone input/performance. The owner has
explicitly confirmed no private iPhone access; it remains unverified.

The previously qualified corresponding-source archive describes historical
`f7cb702c` inputs. It does **not** match this new application/build. A new matching
source reconstruction, approved immutable public source delivery, anonymous HTTPS
and deployed-identity verification, plus the inherited legal/source boundaries
remain release gates. No archive was rebuilt or published during this run.
Owner visual acceptance is still required. High-resolution terrain needs a
qualified imagery/elevation package, resolution/coverage/frame/rights, budgets,
normal/shadow treatment and device qualification before production integration.

Next task: owner operation of this exact private candidate and gallery, with
specific visual feedback; independently close matching-source/device/release
gates before considering integration. No further redesign is authorized by this
report itself.
