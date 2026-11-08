# Independent final Solar 2.1 integration review

Reviewed the uncommitted candidate on `recovery/reconcile-20261026`, HEAD
`b4005ce48e9869c298de4ed019c67e4e246accda`. Reviewer did not implement the
atmosphere, terrain or handoff changes. No application edits, commit, push,
deployment, Windows browser use or source publication were performed.

**Final result: the one P2 handoff finding below was corrected and independently
rechecked; no remaining actionable P0/P1/P2 found in this bounded review.**
This result does not qualify owner acceptance,
physical devices, hosted checks or corresponding-source release.

## Context and scope

Loaded root AGENTS, CORE_CONTEXT, LIVE_SESSION_BRIEF, CONTEXT_MANIFEST's
`solar_reconstruction` pack, SYSTEM_VALIDATION_SPEC,
UNIFIED_UNIVERSE_ARCHITECTURE, ADR0010, Solar2/Solar2.1 PLAN, and the applicable
design/history/acceptance sections of the pack's cinematic reference, unified
workspace design, adaptive-explorer reference, owner-acceptance and visual-fidelity
reports. The owner's Solar2.1 attachment is the active bounded authorization.
Also read the explicitly requested EARTH_FRAME_REVIEW,
ATMOSPHERE_INTEGRATION_REVIEW and REVIEW_TERRAIN evidence. No full docs scan or
unrelated task pack was used. Historical phase limits defer to this explicit scope.

Reviewed actual Takram imports, Earth-local metre transform, pipeline scaling and
output/disposal, Solar integration/markers, actual NASA TilesRenderer setup,
local lunar frame, queues/cache/material ownership, transport cancellation,
native return contracts, Vite package boundary, Docker copies and nginx route
delivery. Existing source/frame audits were inspected, not repeated as a new
global scientific or licensing audit.

## P2, corrected: loading/error terrain departure overwrites bookmark observer

At the reviewed version, `frontend/src/features/terrain/TerrainWorkspace.tsx:35`
calls `ingestSearch` only after manifest acquisition and renderer initialization
succeed. Lines50–51 pass `product.observer` to `solarExit` on Earth/Sky departure.
`solarExit` uses that fallback observer when no saved native camera exists, and
`handoffPath` overwrites the destination URL with it.

Reproduction: enter a direct terrain bookmark with
`?date=2026-10-28T00:00:00Z&lat=40&lng=-80&elev=400` from a fresh session, then
choose Earth while the manifest is pending, or after its fetch/renderer creation
fails. The preexisting product observer remains the ORAS default. The actual
return helpers independently produced:

```text
requested observer: 40, -80, 400 m
planetModeReturn: /earth?lat=40&lng=-80&elev=400&date=2026-10-28T00%3A00%3A00.000Z
solarExit observer: 41.321903, -79.585394, 432.816 m
solarExit URL: /earth?lat=41.321903&lng=-79.585394&elev=432.816&date=2026-10-28T00%3A00%3A00.000Z&elevationSource=oras-site
```

The existing two navigation tests supply an already matching fallback observer,
so they do not cover this loading/error path. The same issue can occur when
observer query parameters change on the mounted terrain route without changing
region/epoch, because those parameters are not effect dependencies.

Narrow correction: ingest validated observer intent independently of successful
asset/GPU initialization, including same-route query changes; ensure departure
uses current validated intent. Preserve the nested native camera when appropriate.
Add a loading/failure departure regression starting with a different stored
observer. Finding was sent to the root and terrain implementer for correction.

The independent reproduction used Vite's actual SSR-loaded runtime helpers from
`frontend`:

```sh
node --input-type=module <<'JS'
import {createServer} from 'vite'
const s=await createServer({server:{middlewareMode:true}})
try {
 const {terrainMoonReturn}=await s.ssrLoadModule('/src/features/terrain/terrainContracts.ts')
 const {planetModeReturn}=await s.ssrLoadModule('/src/features/planet/planetContracts.ts')
 const {solarExit}=await s.ssrLoadModule('/src/features/solar/solarNavigation.ts')
 const {useRuntimeProductState}=await s.ssrLoadModule('/src/features/runtime/productState.ts')
 const epoch='2026-10-28T00:00:00.000Z',p=useRuntimeProductState.getState()
 const native=terrainMoonReturn(null,epoch,undefined,'?lat=40&lng=-80&elev=400')
 const d=planetModeReturn(native.state.planetReturn,'earth',epoch)
 console.log(solarExit(d.path,epoch,d.state,p.views,p.selection,false,p.observer))
} finally {await s.close()}
JS
```

## Fresh checks

```sh
cd frontend
npm test -- --run tests/terrainContracts.test.ts tests/terrainTransport.test.ts tests/terrainNavigation.test.ts tests/solarTakram.test.ts tests/solarEarthFrame.test.ts tests/solarEarthApproach.test.ts tests/solarMotion.test.ts
```

Result: **7 files, 39 tests passed**, exit0. These are supporting contract tests,
not a new browser or scientific-frame qualification.

Independent private HTTP HEAD checks used Python3 urllib with redirects disabled
against `http://127.0.0.1:4231`:

| Path | Observed result |
| --- | --- |
| `/planet-terrain/apollo17-nac-v1` | 200, text/html, no Location |
| `/planet-terrain/apollo17-nac-v1/` | 200, text/html, no Location |
| `/planet-terrain/apollo17-nac-v1/tileset.json` | 200, application/json, 56,952 bytes |
| `/planet-terrain/apollo17-nac-v1/tiles/0/0/0.glb` | 200, application/octet-stream, 561,592 bytes |
| `/planet-terrain/apollo17-nac-v1/final-review-missing.glb` | 404, no Location |

The initial `python` invocation was unavailable (exit127); the same check with
`python3` completed successfully. No redirect/internal-port regression remains.

## Reviewed source identity

SHA256 values before the loading/error handoff correction:

| File | SHA256 |
| --- | --- |
| solarTakram.ts | `f3306dadefc76d3e1a4015da6e528e28e256b05b1102e107d062edccabd8b9de` |
| solarRenderPipeline.ts | `6ae2b04d2f47c49a4aeda3c64e030c1dc0bf58e27d2f052a9d43a199465e9f13` |
| SolarScene.ts | `5c81fed95ef8b23d28db51c630b7b113281bdbbd65b095932608b41cd6f7fa39` |
| TerrainScene.ts | `1b4fb90bafe30268f69ee4c4abf1f24224f63f8927d07f662f467d72ce402a23` |
| TerrainWorkspace.tsx | `19320dac3e30097365342e98e6de2b76f7e4c621a4cadf84f010f22aca693331` |
| terrainContracts.ts | `8e4a95d9b2747918439db064be33d4a1ff70be6d7b6a27c5113ffbb6fd981e38` |
| terrainTransport.ts | `a50589dcabccd25ead524b2231c3a6fb802b067565cb7f485da05a0f14d65aa5` |
| frontend/nginx.conf | `33bcb5552073b9c383aba18705ba4e36815a7e76d498e1ce57d3742a31248a7a` |

## Independent correction recheck

The terrain implementer moved validated query ingestion before asynchronous
initialization and added `terrainNavigation.ts`'s `terrainNativeExit`. The
workspace departure now supplies `locationRef.current.search` to that helper;
the helper revalidates the current query before reading product state and calling
the established native handoff. This also covers a direct bookmark's same-route
query update at departure without depending on a terrain renderer.

Fresh independent command from `frontend`:

```sh
npm test -- --run tests/terrainNavigation.test.ts tests/terrainContracts.test.ts tests/terrainTransport.test.ts
```

**3 files, 25 tests passed**, exit0. Independently SSR-loaded the actual new
`terrainNativeExit` helper, reset the stored observer to41,-79,457m before each
call, and exercised both `earth` and `sky` with `?lat=40&lng=-80&elev=400` and the
same UTC. Both returned the requested40,-80,400m observer in their URL and
`n1View`, with `elevationSource=provided` and unchanged UTC. No renderer was
mounted. Source wiring confirms pending manifest, failed acquisition and failed
GPU initialization all use this same helper. Actual Windows error-path/browser
proof remains the root's separate qualification.

Final corrected SHA256 identities:

| File | SHA256 |
| --- | --- |
| TerrainWorkspace.tsx | `8ed82eeaf2e04ea995c06453518224cdcc31d9f5c1e032c4bc33444626c00ba2` |
| terrainNavigation.ts | `5821f96c8bc97e98e349191ff709d38008cede527b320cf3355439563e5990e1` |
| terrainNavigation.test.ts | `62ac25af02447e00833c31281b9d201e574bfddf67913620a3fc279ac358262c` |

Next task: complete the root's separate exact-source Docker/Windows/hosted
qualification and retain the owner stop gate. This review made only this report;
all application changes belong to the implementation agents.
