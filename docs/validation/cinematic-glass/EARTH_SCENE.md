# V1 Earth scene inspection

The existing native Earth scene already implements the source-supported lighting
and atmosphere settings examined here. This package makes **no new Earth rendering
improvement claim**. The shared glass/UI correction is separately reviewable;
imagery limitations do not justify opaque Hub panels. Owner visual judgment and
physical GPU qualification remain open.

Branch: `cinematic-glass-1`; inspected baseline:
`4fa9ffd8a8a216ed9a313e4f4929d2bc336ff7f8` (PR90). No native Earth source,
camera/navigation controller, provider configuration, cache or settings changed.
No native Earth build is required for this documentation-only scene inspection.
No commit, push, merge, deployment, R4 or provider activation was performed.

## Context and authority

Loaded the owner-approved task registry `/tmp/glass-context-paths.txt` and these
listed documents: `docs/context/CORE_CONTEXT.md`,
`docs/context/LIVE_SESSION_BRIEF.md`,
`docs/architecture/UNIFIED_UNIVERSE_ARCHITECTURE.md`,
`docs/validation/SYSTEM_VALIDATION_SPEC.md` and
`docs/validation/earth-sky-completion/README.md`. These match the bounded G1/G2/V1
scope conveyed by the owner directive and coordinating agent. No other repository
documents were loaded by this investigation. CORE/LIVE still describe E1/S1/I1;
the new explicit owner directive extends presentation work without activating R4.

## Inspected implementation

| Source | Finding |
| --- | --- |
| `runtimes/earth-runtime/core/ViewerController.mjs` | Native Cesium globe lighting, ground atmosphere, dynamic atmosphere lighting and Sun-direction atmosphere lighting are already enabled. Sky atmosphere intensity18, saturation−0.12, brightness−0.08 match pinned God's Eye appearance configuration. Native fog density0.0002 and bundled illustrative stars already exist. Stars are not a scientific catalog. |
| Pinned `/var/tmp/oras-cesium/gods-eye/src/app/viewer.js` | The three atmosphere values above match the immutable upstream pin. No upstream edits. |
| Pinned Cesium `Source/Scene/Scene.js` and `SkyAtmosphere.js` | `Scene.updateEnvironment()` calls `skyAtmosphere.setDynamicLighting(DynamicAtmosphereLightingType.fromGlobeFlags(globe))`. Existing globe flags already make the sky atmosphere follow Sun direction; adding a manual private-API call would be redundant and overwritten. |
| `runtimes/earth-runtime/core/EarthRuntime.mjs` | `setTime()` sets native Cesium `clock.currentTime` from the requested ISO UTC, disables animation and requests a native render. This owns illumination time; no cosmetic Sun/terminator override was added. |
| `runtimes/earth-runtime/core/CameraController.mjs` | Existing opening camera centers the canonical ORAS site at22,000,000m geocentric distance on desktop and16,000,000m below768px. Native camera and accepted scroll/controller mechanics are preserved. |
| `runtimes/earth-runtime/core/VisualFoundation.mjs`, `displayConfig.mjs`, `display-config.json` | Public config is unqualified for ion assets. Ellipsoid terrain remains the fallback. Detailed terrain/building/photorealistic capability was not activated. |
| `runtimes/earth-runtime/core/AdmittedMapSources.mjs`, `ImagerySelectionPolicy.mjs`, `ImageryController.mjs` | Global NASA Blue Marble overview and static EOX2016 Sentinel-2 cloudless10m sources already refine through native Cesium tiles. NAIP admission remains footprint qualified. PEMA stays local-only with unverified release permission. Provider/time/cache/readiness policy is preserved. |

Pinned source identity was freshly checked:

```text
git -C /var/tmp/oras-cesium/gods-eye rev-parse HEAD
e7707d9a0f34d9fbffc300023c319f95caa5be30

node -p "require('/var/tmp/oras-cesium/gods-eye/node_modules/cesium/package.json').version"
1.138.0
```

## Validation

Fresh supporting regression command, run outside the sandbox because the existing
export-boundary fixture launches Python:

```sh
node --test tests/earth/*.test.mjs tests/runtime/protocol.test.mjs tests/runtime/channel.test.mjs tests/runtime/navigation.test.mjs tests/runtime/workspace-protocol.test.mjs tests/runtime/observer-elevation.test.mjs tests/runtime/continued-input.test.mjs > /tmp/cinematic-glass-earth-tests.tap
```

Result: **173 tests,173 pass,0 fail,0 cancelled,0 skipped**. This covers existing
source admission/fallback/readiness, DPR and lighting preservation, native tile
refinement lifetime, camera navigation, scroll motion and bridge/observer protocols.
It is local supporting evidence, not Docker/browser scene or owner acceptance.

The initial sandbox command selected an absent `tests/runtime-protocol/` path and
reported26 file-level passes plus one failure. Directly running the failed fixture
identified `spawnSync python3 EPERM`. The corrected explicit-path command above
passed outside the sandbox. The earlier attempt is not counted as a pass.

## Remaining limits

The reference's cloud layers and night illumination are not supplied by this
qualified imagery stack. No fabricated clouds, night-light texture, synthetic
terrain, sharpening, new providers or false live-imagery claim was introduced.
Native Sun illumination and atmospheric scattering are supported; satellite
photography remains the dated source imagery. This investigation found no justified
scene setting change that can be called a demonstrated visual improvement.

Fresh integrated browser/UI evidence and preview qualification belong to the
combined G1/G2/V1 report. This scene inspection alone does not claim a fresh browser
or Docker result. The recommended next gate is actual Earth glass/native-scene
comparison followed by owner visual and physical-device review.
