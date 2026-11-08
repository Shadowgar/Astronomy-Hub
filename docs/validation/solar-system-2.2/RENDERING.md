# Solar 2.2 material candidate

Source baseline: `66fff05108ca7ed7ee0ee1d5137b4b2619c28373`, existing
`recovery/reconcile-20261026`. Owner's attached Solar2.2 instruction supersedes the
2.1.1 expansion stop. Original approved Solar PNGs were inspected unchanged.
The `solar_reconstruction` context pack and repository rules were loaded; no
additional repository documents were loaded for material implementation.

## Implemented changes

| Area | Proven source weakness | Candidate correction |
| --- | --- | --- |
| Sun | Orange RGB endpoints, broad orange additive veil, five noise samples | Warm-white linear HDR photosphere; three derivative-filtered noise samples; static illustrative granulation and limb darkening; compact ivory corona fading to zero at2.3 solar radii |
| Planets | Shared generic response; Mars fell back to Mercury palette before model load; procedural fallback evaluated alongside real maps | Explicit Mars palette; separate particulate and cloud-disk response; bounded1.02–1.065 contrast on original linear source colors; procedural detail only in unavailable-map branch |
| Saturn | Particle-transfer radiance already integrated optical depth, then normal alpha blending multiplied optical coverage again | Normalize by view coverage before straight-alpha blend; stable divided-exponential transmission at equal paths; bounded forward-scattering term; original ring radii, broad optical depth, source radial texture and sphere/plane shadow geometry preserved |
| HDR | Low bloom threshold and broad bloom radius amplified the orange veil; direct/Efficient tone mapping happened before alpha composition | Threshold1.8, strength.13 Balanced/.18 Detailed, radius.28; all qualities composite in a linear target before one ACES/output pass; Efficient disables bloom |

Owned code changes: `frontend/src/features/solar/solarMaterials.ts`,
`solarRings.ts`, `solarRenderPipeline.ts`; focused test:
`frontend/tests/solarMaterials22.test.ts` and `solarLighting.test.ts`. `solarAtmosphere.ts`, Takram depth,
Earth orientation/cloud/surface shaders, source positions/time, geometry/UVs,
clock, render loop and resource ownership are unchanged. Scene integration is
coordinated separately: Mars must retain its shader and source map rather than
being replaced with `MeshStandardMaterial`; Eros keeps its existing material.

No assets or dependencies were added. Granulation, corona morphology, disk-response
coefficients and fine ring structure are illustrative, not measured solar activity,
weather, terrain or calibrated photometry. The source-map contrast curve does not
invent new geography, cloud structure or relief.

## Source and numerical checks

Inspected pinned Three0.180.0 `WebGLRenderer.js`, `WebGLTextures.js`, `OutputPass.js`
and `UnrealBloomPass.js`: SRGB source textures decode at sampling, offscreen targets
remain linear, and the existing output pass supplies the single HDR tone/color
transform. No extra manual gamma conversion or exposure control was introduced.
Official [ShaderMaterial documentation](https://threejs.org/docs/pages/ShaderMaterial.html)
supports custom shader use; pinned source is authoritative for this version.
[NASA's ring fact sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/satringfact.html)
was rechecked against unchanged broad ring edges and optical-depth ranges.

Commands run from `frontend`:

```text
npm test -- tests/solarLighting.test.ts tests/solarTakramDepth.test.ts tests/solarEarthFrame.test.ts
PASS: 3 files,13 tests before edits.
npm test -- tests/solarMaterials22.test.ts
RED: first pass5 failed/1 passed for missing material contracts and old bloom policy.
RED: scalar arithmetic pass3 failed/5 passed before shader function extraction.
npm test -- tests/solarMaterials22.test.ts tests/solarLighting.test.ts tests/solarTakramDepth.test.ts tests/solarEarthFrame.test.ts
PASS: 4 files,23 tests after independent-review and captured-Sun corrections.
npm run typecheck
PASS after final material/pipeline edits. An earlier intermediate run saw
concurrent in-progress texture-streaming errors; the current run is clean.
npm test
PASS: 80 files,525 tests on the integrated working tree after material corrections.
```

Scoped `git diff --check` passed. Scalar tests execute arithmetic extracted from
the actual shader functions: dark terminators, finite limb response, equal-path
transmission, bounded grazing behavior and single optical coverage. This is CPU
arithmetic/source evidence, not GPU shader compilation or pixel qualification.

Independent review found that direct/Efficient rendering mapped ring fragments
before normal alpha blending: its sample produced0.166 sRGB rather than0.583
after linear HDR composition. Corrected all three quality modes to retain the
composer and final output pass. New regression first failed2 tests, then passed:
it runs the real Three composer/passes against a recording renderer boundary,
checking the linear scene target precedes exactly one ACES/sRGB output for all
three qualities with and without float support. This is pass-order/target proof,
not a GPU pixel comparison. The bloom test title now describes parameter bounds
without claiming an unproven universal surface-luminance bound.
Independent correction review then reran23 tests across4 files, confirmed the
pinned Three OutputPass→FXAA ordering and preserved Takram support gate, and
reported P2/P3 addressed with no new actionable code issue. GPU pixels/cost and
the latest Sun appearance remain separate qualification requirements.

Without `EXT_color_buffer_float`, the fallback uses a linear RGBA8 target and
disables bloom. **Radiance above1 clips before blending**, including the Sun,
corona and bright thin rings. Diagnostics expose `hdrClipping`, target type,
composition color space and that limitation. This fallback preserves transform
ordering but is not HDR-equivalent or hardware-qualified here. Efficient mode on
float-capable hardware now needs two full-screen output/FXAA passes in addition
to the scene; actual performance must be measured, not assumed unchanged.

The first actual candidate Sun capture (`candidate-1440x900-sun.png`) looked
chalk-white with gray haze. A narrow subsequent change lowers photosphere energy
3.4→2.8, strengthens illustrative limb darkening, keeps a warm-white center with
subtle golden limb tint, reduces diffuse corona veil and increases existing
angular streamer contrast. No extra noise samples or animation were added.
The new limb test failed before implementation and passes afterward. These later
Sun pixels still require a new capture; the earlier image cannot qualify them.
The next actual overview capture exposed overly pronounced streamer fans. The
coordinator rejected that amplitude and reduced the existing corona terms to a
compact glow with weak angular variation, retaining the warmer color and
photosphere correction. Source review confirms no added geometry/noise or
lighting-state changes; its final pixel assessment remains in the visual report.

## Open qualification

Real Windows GPU compilation, matched before/after images, backlit/oblique ring
views, latest Sun appearance and all-quality linear composition, performance and Docker integration
belong to the coordinated qualification run. The local full frontend suite passes;
it does not qualify GPU pixels or runtime performance. No visual or performance gain
is claimed from these tests. Owner visual acceptance and release remain open.
No commit, push, PR state change or deployment was performed by the material agent.
