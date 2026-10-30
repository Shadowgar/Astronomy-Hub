# Independent review of the bounded lunar context correction

**Final bounded review: no unresolved source or correction findings remain.**
Source/projection checks and independent27-test focused qualification pass.
Inspected final Windows evidence passes10groups with zero recorded page errors,
including tile503 Retry, camera/UTC, disposal and native-mode returns. Earlier
failed runs remain historical evidence below; owner visual acceptance and physical
iPhone qualification are not granted by this review.
This reviewer did not implement
the terrain correction or operate the Windows browser. Owner visual acceptance
and physical-device qualification remain separate.

Branch `recovery/reconcile-20261026`, baseline
`ed0c81f785c6da68183e757ff381eba2727a2007`, existing draft PR107. Context and the
source feasibility decision are recorded in [SOURCE_CONTEXT_REVIEW](SOURCE_CONTEXT_REVIEW.md).
The owner authorized this non-author review within the two Solar2.1.1 corrections.
No application edits, commit, push or deployment by the reviewer.

## Findings reported to the author before corrections

1. **P2, corrected in source — short portrait loses usable terrain area.** At width390 and height540,
   `.terrain-survey` has top274/bottom154 and its stage adds30px top/32px bottom
   insets, leaving approximately48–50px of canvas after borders. At height501,
   only approximately9px remains. The portrait rule applies for height>=501,
   while the compact layout only starts at<=500. This is a deterministic layout
   conflict in `terrain.css`, not a claim of a reviewer-operated browser result.
   The author added a compact501–700px portrait arrangement:74px locator,
   shorter header, survey top184/bottom118,24/22px stage insets and compact
   two-row controls. At390×501 this leaves151px of canvas after2px survey
   borders, versus the previous9px. Only the duplicate context-return button
   hides; header Return remains. Actual Windows measurements are152px at390×501
   and190.4px at390×540; screenshots show the region, locator and reachable
   controls without overlap or horizontal overflow. The fractional dimensions
   differ slightly from nominal CSS arithmetic due to browser scaling.
2. **P2, corrected in source — landscape hides the location-precision disclosure.** The<=500px-height
   rule hides `.terrain-context-note`, removing the visible “Approximate location
   · marker enlarged” while keeping the large locator ring and coordinates.
   The SVG accessible label is preserved, but sighted users lose the distinction
   between location context and a to-scale footprint. A later explicit
   short-layout override now displays the approximate/enlarged-marker note
   at8px. The actual844×390 screenshot visibly retains it, along with the
   distinct global-source resolution. Small text remains an owner/device
   readability limit rather than a claim of physical-iPhone qualification.
3. **P2, corrected in source — context-image failure leaves a marker without its source globe.**
   Initial `TerrainContext.tsx` has no image-error state and renders the SVG
   marker whenever a source manifest exists. A PNG404/decode failure therefore
   leaves the position ring over a missing globe. The component now gates SVG
   rendering on image `onLoad`; `onError` hides image and SVG and displays
   “Moon context unavailable.” The inspected controlled-image503 receipt records
   context failure, marker hidden and terrain still ready; its screenshot shows
   exactly that. Native Return remains visible. This successful image-failure
   check is separate from the later unsuccessful terrain-tile Retry check.

Findings were sent to the parent before corrections. The reviewer subsequently
inspected each actual code correction and the named Windows screenshots/receipts
below. No further source/context correction is requested. The initially open
tile Retry finding is closed by source review, independent original-library
reproduction and the final corrected Windows recovery evidence.

## Source, projection and geometry result

Inspected `TerrainContext.tsx`, `terrainContext.ts`, `TerrainWorkspace.tsx`,
`TerrainScene.ts`, `terrain.css`, `scripts/planetdata/build_lunar_context.py`, its
tests, the actual generated384×384PNG and `evidence/moon-context-source.json`.

The author follows the qualified bounded option: static derived WAC image plus
separate measured region; no global surface is placed behind/below the NAC crop,
no elevation blending or invented geometric continuity, and no second renderer.
The original source pack remains unchanged. The visible5m regional sampling and
~3.79km global source sampling are distinct; Sources explicitly retains the
unqualified LROC_ME/native-frame alignment and historical illumination limits.

The original WAC source hash is checked before decoding. Pixel-center mapping
is correct: `x=(longitude/2π+0.5)*2880−0.5`,
`y=(0.5−latitude/π)*1440−0.5`. The inverse orthographic projection uses output
pixel centers, center0°N/0°E, north up/east right, positive near-side hemisphere,
and transparent pixels outside the unit disk. Latitude clamps only source-edge
sampling; longitude wraps. The locator marker uses the matching forward
projection; Apollo17 appears upper-right. The output is a resampled locator,
not new higher-resolution imagery or a current-epoch Moon image.

Independently rebuilt from the actual served and hash-matched WAC source using
the offline cached Pillow12.3.0 tooling environment. Both current artifact and
independent output SHA256:
`1d83e67c2340369af3413005bd61cd3b05b1d2634fa404d10769f4339299fb9f`.
The reviewer inspected the actual PNG; orientation and ordinary lunar morphology
are consistent with a north-up near-side context image. This does not establish
subpixel NAC registration or owner visual acceptance.

Source no-data alpha remains available through bilinear resampling; no texture
inpainting or fabricated terrain was added. Raster resampling near masked edges
is presentation interpolation, not added observation. The PNG is bundled as a
small UI asset and introduces no provider request, active WebGL context, RAF,
GPU scene or asynchronous native-renderer ownership.

## Camera and navigation review

The original NASA tile loader, metre transforms, root ellipsoid, heights,
materials, source-local camera and clearance code are retained. The first
correction reduced ordinary zoom-out from12region-spans to1.8spans times aspect
fit, with overview1.15span and detail0.24span. Following actual edge-clipping
review, the current source fits a sphere enclosing the rectangular region in
the limiting45° frustum, adds3% margin, and sets maximum distance to the greater
of2.6spans times aspect fit or the fitted overview distance. Detail remains
0.24span times aspect fit. Resize refreshes the bound. These are deliberate
regional framing limits, not physical-coordinate changes or a full-Moon flight.

Both new context return and header return call the existing `leave()` path,
which preserves the saved native Moon route/camera and canonical UTC. No new
frame transform, native camera reinterpretation or observer replacement was
introduced. Existing regional persistence, retry/context restoration and renderer
disposal paths remain. Actual route/history and pixel behavior must still pass
the parent's current browser checks; source inspection alone is not runtime proof.

The label “Open Moon overview” returns the saved native view, which may be a
close-up rather than a fresh full globe. Preserving that camera matches the
contract; wording should not be taken as proof of automatic globe reframing.

## Earlier Windows evidence — retained partial run

Evidence directory:
`output/playwright/solar-system-2.1.1/terrain-final-r2/`.
`results.json` identifies Windows Edge156.0.4314.50 and ANGLE/NVIDIA RTX3060
Laptop GPU/D3D11, starting2026-10-29T04:58:29.221Z. The reviewer read the complete
six-group result and directly viewed these actual files:

- `1440x900-overview.png`, `1440x900-detail.png`.
- `390x844-overview.png`, `390x844-native-moon.png`.
- `844x390-overview.png`, `844x390-detail.png`.
- `390x540-compact.png`, `390x501-compact.png`.
- `context-image-unavailable.png`.

Observed correction: full-Moon context stays visible beside/above a distinctly
bounded regional stage. Apollo17's enlarged marker is in the expected upper-right
near-side location. The original measured patch remains obvious as finite data;
the UI does not pretend it continues seamlessly into coarse terrain. The
global3.79km/pixel and regional5m sources, extent and approximate-marker limits
are visible. The short layouts and controlled image failure support closure of
the three specific findings above.

**Visual limitation:** default Overview does not show every crop edge. Desktop
bottom and standard portrait left/bottom boundaries are clipped by the viewport.
This is visible in the captures and was reported to the author; no full-coverage
camera-fit claim is supported by this earlier run. The subsequent enclosing-sphere
source correction is reviewed below, with fresh captures still required.
The earlier clipping does not alter geometry or create false
continuity. The bounded-context composition is a technical correction for owner
evaluation, not proof the owner now likes the regional presentation.

The receipt records three completed desktop/portrait/landscape journey groups:
real LOD3/5m visible in each detail state, keyboard, resize, Back, native Moon
entry/return, touch in phone layouts and reduced motion in portrait. Actual
detail required0/1/3 ordinary zoom steps respectively after Approach; shorter
canvases have lower screen-space error at the same camera distance. This records
real NASA traversal/refinement, not a forced LOD or fabricated new resolution.
All three retain source `LROC_ME`,1737400m ellipsoid and the original manifest
SHA256 `3cfcbb6c270bbe1df4eadfacefc143e2843d5cd1d18994a72f6fb1c9ce3c3543`.
Native camera URLs and UTC before/after agree within the asserted tolerance;
disposed snapshots record zero geometry, textures and programs. The native Moon
capture is the retained coarse30km-height close-up, not new high-resolution data
or a newly fitted globe.

Two short-portrait layout groups and one image-failure group then completed.
The same receipt has **`pass:false`**, zero recorded page errors and a subsequent
30000ms `page.waitForFunction` timeout. The parent localizes this to the next
controlled terrain503 Retry group and is investigating separately; that
diagnosis is not counted as independently reproduced by this reviewer. Keep the
timeout and any remaining unrun return cases open until fresh bounded evidence
qualifies the actual correction. These inspected files are author-operated
Windows evidence, not a reviewer-operated or physical-phone test.

## Follow-up: Retry root cause and fitted overview source review

The parent retained the actual failure in `output/solar211-retry-inspect2.log`:
root-tile503, then Retry causes `TypeError: Cannot read properties of undefined
(reading 'loadingState')`. Independently inspected installed NASA0.5.3
`TilesRendererBase.js`: `resetFailedTiles()` traverses with
`ensureFullyProcessed=false` and unconditionally reads `tile.internal.loadingState`.
Children deferred after a failed root may not yet have `internal`. An independent
Node fixture using this actual class reproduced exactly the same exception;
this is now independently supported, rather than only the parent's diagnosis.

The author routes Retry tiles through the existing `retryView()` path and removes
the unused `TerrainScene.retry` API/wrapper. Source inspection confirms the saved
pose is captured before retry-state change; effect cleanup aborts the old owner
and disposes its transport/renderer before the replacement asynchronous mount.
UTC, saved native return, quality and relief state remain in their existing
contracts. No vendor source, dependency, tile state or geometry is patched.
This narrowly avoids the unsafe package method while retaining actual NASA tile
loading. Final recovery/disposal proof is recorded in the next section.

The new overview formula encloses the measured5120×5120m rectangle using
`hypot(width,height)/2`, divides by the sine of the limiting frustum half-angle
and adds3% margin. The known204.4m relief fits that margin; source geometry is
unchanged. Inspected author's red/green receipts:
`output/solar211-overview-red.log` has1failed/1passed; the old overview supplies
2253.24m angular radius versus3620.39m required. The green receipt has2/2pass.
Fresh independent focused contracts/transport/navigation/context run has27/27pass.
Final fitted overview captures are inspected in the next section.

Independent original-library reproducer (read-only fixture; no browser/network):

```sh
node --input-type=module <<'JS'
import {TilesRendererBase} from './frontend/graphics/node_modules/3d-tiles-renderer/src/core/renderer/tiles/TilesRendererBase.js';
const tiles=new TilesRendererBase();
tiles.rootTileset={root:{internal:{loadingState:-1},children:[{children:[]}]}};
tiles.stats.failed=1;
try{tiles.resetFailedTiles();throw Error('Expected original deferred-child failure was not reproduced')}
catch(error){if(!String(error).includes("reading 'loadingState'"))throw error;console.log('REPRODUCED original0.5.3 deferred-child retry:',String(error));}
JS
# REPRODUCED original0.5.3 deferred-child retry:TypeError:Cannot read properties of undefined (reading 'loadingState').
npm --prefix frontend test -- --run tests/terrainContext.test.ts tests/terrainContracts.test.ts tests/terrainNavigation.test.ts tests/terrainTransport.test.ts
# 4files PASS;27tests PASS.
```

The minimal independent reproducer is now retained as
[reproduce_upstream_retry.mjs](evidence/reproduce_upstream_retry.mjs), with
[exact result and unchanged package-source hash](evidence/upstream-retry-reproduction.json).
Run `node docs/validation/solar-system-2.1.1/evidence/reproduce_upstream_retry.mjs`.
It asserts installed version0.5.3 and the exact expected exception without a
browser, download or application/package mutation.

## Final Windows correction qualification — inspected PASS

Final source-matched run:
`output/playwright/solar-system-2.1.1/terrain-final-r3/results.json`, retained
byte-identically as [terrain-windows.json](evidence/terrain-windows.json).
The reviewer independently used `cmp` to verify the retained copy. Result:
**10groups PASS, `errors:[]`**, Windows Edge156.0.4314.50,
ANGLE/NVIDIA RTX3060 Laptop GPU/D3D11, starting2026-10-29T05:03:38.341Z.

The reviewer directly viewed final `1440x900-overview.png`,
`390x844-overview.png` and `844x390-overview.png` from that directory. All four
crop edges now fit inside the stage at each recorded viewport, resolving the
earlier clipping. The region is intentionally smaller in short landscape to
fit its complete bounds; Approach and ordinary zoom remain the detailed view.
Global Moon context, source sampling, location precision note, finite coverage
and return controls remain visible. This is a deliberate bounded survey with a
separate lunar locator, not proof of seamless surrounding surface or owner taste.

The final receipt requalifies the three native Moon/terrain journeys and the
two compact layouts; image503 still hides the marker while terrain stays ready.
It additionally records successful root-tile503 Retry with `poseRetained:true`
and `utcRetained:true`. The replaced owner has `disposed:true`, transport
`disposed:true`/active0, geometry0, texture0 and program0. New actual NASA loading
recovers. This closes the unsafe-reset integration finding without changing
package source or the original terrain.

The remaining three groups reach Solar, Earth and Sky. Actual native Earth/Sky
states retain40°N,80°W,400m observer elevation and UTC2026-10-28T00:00:00Z;
ordinary native Moon return retains its saved camera/time. All detail groups
reach LOD3/5m through actual package refinement, and source manifest SHA remains
unchanged. The precise distinctions still apply: phone layouts run on this
Windows GPU, not a physical iPhone; source ME-realization alignment remains
unqualified; historical imagery is not selected-UTC illumination; native Moon
remains its original coarse globe.

These are inspected author-operated Windows results, not reviewer-operated
browser runs. Together with independent source checks, original-library
reproduction and correction-source review, they support **no unresolved findings
within this bounded terrain correction**. They do not approve the whole PR,
grant owner visual acceptance or close unrelated release/source/device gates.

## Independent commands and observed output

```sh
npm --prefix frontend test -- --run tests/terrainContext.test.ts tests/terrainContracts.test.ts tests/terrainNavigation.test.ts
# 3 files PASS;22 tests PASS.
uv run --offline --with pillow==12.3.0 python -m unittest discover -s scripts/planetdata -p test_lunar_context.py -v
# 3 tests PASS.
uv run --offline --with pillow==12.3.0 python scripts/planetdata/build_lunar_context.py /tmp/solar211-review-moon-wac.png /tmp/solar211-review-context-rebuild.png
# Source hash accepted;384×384 output;SHA2561d83e67c...9fb9f.
sha256sum frontend/src/features/terrain/assets/moon-context.png /tmp/solar211-review-context-rebuild.png
# Both1d83e67c2340369af3413005bd61cd3b05b1d2634fa404d10769f4339299fb9f.
```

The system `python3` has no PIL module; that initial environment check failed.
The explicit offline Pillow tooling command above then passed without an
application dependency or repository environment change.

Repeated the original85GLB/hash audit and checked the unchanged context PNG hash
after inspecting the Windows captures; both match their receipts. Whitespace
check passes. No fresh Docker build or browser suite was run by this reviewer.
Remaining: owner evaluates this exact regional presentation; physical-device,
matching-source release and broader repository gates remain separate. No further
terrain implementation is requested by this bounded review.
