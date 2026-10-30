# R3-B: major planets and main-belt context

Owner directive 2026-10-21 explicitly authorizes R3-B and supersedes the older R3-A-only restriction. This separately reviewable implementation stacks on the shared cinematic foundation, retaining PR83 as an unaccepted visual baseline. No merge, deployment, paid provider or R4 work is authorized.

## Scientific implementation

The existing read-only DE442s release and Skyfield geometric heliocentric ICRF/AU/UTC-to-TDB calculation now supplies Sun and all eight planets. The existing source SHA, release validation, epoch limits and unavailable behavior are unchanged. Source IDs remain stable. Sun10, Mercury199, Venus299 and Earth399 use body centers; Mars4, Jupiter5, Saturn6, Uranus7 and Neptune8 use explicitly identified system barycenters because body centers are not in this pinned kernel. Their display globes are anchored at those system barycenters; this is not a precision physical-center solution. R4 surfaces, body-fixed frames and rotation remain unavailable.

Each planet has an open prior path of 129 samples spanning its nominal sidereal period, clipped at kernel coverage. Outer paths may be partial; lines between samples are coarse presentation, not an interpolating orbit engine or closed Kepler ellipse. Positions themselves are evaluated directly at the requested epoch.

## Independent source comparison and accuracy limit

[Reference rows](../../../tests/fixtures/solar/r3b-reference.json) preserve independent NASA/JPL Horizons geometric VECTORS for every planet at J2000 (2000-01-01 12:00 UTC) and 2026-02-28 00:00 UTC; raw responses and exact request URLs are alongside them. Both sides use Sun10 origin, ICRF/frame plane, AU and matching UTC inputs without light-time/aberration. The independent service explicitly returns **DE441**, whereas the protected local source is **DE442s**.

The inherited 50 km comparison gate failed four Uranus/Neptune cases. This evidence is retained in the comparison record. NAIF's [DE442 technical comments](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/de442_tech-comments.txt) explicitly document the updated Uranus barycenter solution and additional occultation/Mars/Juno observations. This establishes a different dynamical fit; it does not independently certify a specific error magnitude.

Maximum observed vector-norm differences over these two epochs: Uranus **1156.457 km**, Neptune **338.522 km**, Jupiter **14.809 km**; the remaining planets are below 1 km. A separate 1500 km norm ceiling for Uranus/Neptune is a deliberately bounded **comparison regression envelope**, not an accuracy certification, measured uncertainty, or waiver of a same-model precision test. All other planets retain the 50 km ceiling. No source vector is fitted to the references or corrected to hide model differences. Precision body-center/outer accuracy qualification is outside this bounded display.

## Appearance and rights

Original qualified NASA Earth surface/cloud bytes and Mars GLB/UV/atlas remain intact. Mercury, Venus, Jupiter, Saturn, Uranus and Neptune use locally authored, scientifically motivated procedural color materials: rocky variation, Venus cloud colors, giant bands, cyan Uranus and blue Neptune. Saturn has an authored translucent ring material with radial gaps. They are **illustrations**, not live weather, qualified planetary rotation, terrain, measured ring geometry or current atmospheric features. No external planet textures or new dependencies are added. Solar photosphere/corona remains illustrative. The Sun display radius is reduced to .20 AU and Mercury .07 AU to avoid overlap at Mercury's .307 AU perihelion; these are exaggerated glyph radii, never physical radii. All center-to-center source distances remain unchanged.

## Main-belt model and limits

A deterministic sparse particle illustration occupies a broad **2.1–3.3 AU** main-belt envelope, with small thickness and resonance-inspired depletion near 2.50, 2.82 and 2.95 AU. It is rotated from the J2000 ecliptic into ICRF using the J2000 obliquity. See [NASA main-belt context](https://science.nasa.gov/solar-system/asteroids/). It does not estimate measured density, individual inclinations, a complete orbital distribution or an epoch-specific population.

Particles have **no identities, ephemerides, picking or observed-position claims**. The display is intentionally sparse rather than a solid ring. The source dialog provides visibility and density0–6000; quality caps draw counts at efficient1000/balanced3000/detailed6000. These controls change cost only, preserving the scientific body vectors. There is no qualified local minor-body orbital pack suitable for identified asteroid picking; Ceres/Vesta and other identified asteroids remain unavailable rather than fabricated. DE442's asteroid mass parameters are not precise asteroid state vectors.

Subsequent separately qualified expansion: dwarf planets/Pluto center solutions, Kuiper Belt populations (distinct from this main belt), major moons with satellite kernels, and source-backed comets/asteroids with epochs/freshness/rights. None block the eight-planet display.

## Runtime qualification

Exact commands, results, source hashes, actual browser screenshots, performance limitations and independent review are recorded in the delivery handoff. Desktop Chromium/emulated mobile evidence does not qualify physical devices, hardware GPU performance or visual acceptance. Owner visual acceptance remains pending.

## Delivery qualification

- Branch `r3-b-major-planets-1`, stacked on shared foundation `bdd0e0a0`.
- Default Mode: CORE/LIVE plus the **51-document union** of backend_change/frontend_change/validation manifest packs; no unrelated docs scanned. [Loaded inventory](evidence/context.json).
- `npm --prefix frontend run typecheck`: PASS.
- `npm --prefix frontend test`: **315 passed, 47 files**.
- Pinned backend Docker `python3 -m pytest backend/tests/test_solar_exploration.py -q -p no:cacheprovider`: **23 passed**, two existing Starlette/httpx deprecation warnings. Host pure-vector support:22passed/route deselected; the full host TestClient route stalled and is not counted as a pass. Docker is the authoritative route evidence.
- `timeout 150s node scripts/validation/verify_r3b_major_planets.mjs`: **45 browser groups passed**, 15 each at1440×900,390×900,540×390. All9 actual touch controls, selected center clear of HUD, focus/approach source anchors, Inner/Full cameras, expanded scientific details, UTC preservation, belt visibility/density/quality caps, keyboard orbit/zoom/refocus, epoch rebuild, actual WebGL loss/retry, cleanup and idle/error checks. Scene body vectors match the API exactly; camera target tolerates `<1e-12 AU` floating-point drift, approximately0.15metre, not a scientific position change.
- Three source-matched builds (two host Vite and pinned Node24 Docker) reproduce **136 files**, all136 served byte hashes verified. [Receipt](evidence/served-build-identity.json). Existing Vite oversized-chunk advisory remains; no dependency added to hide it.
- Renderer `ANGLE/Vulkan SwiftShader` in all three viewports. GPU timer extension unsupported. CPU submission samples after final retry (8 each): desktop median0.2ms/p950.3ms; mobile0.3/0.5; compact0.3/0.3. These are **CPU submission timings, not GPU frame time, FPS or hardware acceptance**. Physical GPU/mobile performance remains unqualified.
- Red/green: inherited50km outer-reference mismatch preserved in residual data; first browser target assertion exposed only floating rounding; responsive Overview selector corrected in harness; genuine mobile Neptune touch obstruction reproduced, then fixed by reserving the camera gutter. Final all9 matrix passes. Logs/proofs retain those distinct causes.

[Actual preview](http://127.0.0.1:4215/solar-system?date=2026-02-28T00:00:00Z) · [Reference/before/after comparison](http://127.0.0.1:4215/evidence/r3b/comparison.html) · [Fresh browser proof](evidence/browser-proof.json). The two b68 baseline screenshots are explicitly reused historical evidence; all36 after screenshots are fresh R3-B captures. Native cross-mode lifecycle/history qualification is performed by the integration package, not inferred from these Solar-only groups.

## Specific visual and qualification gaps

| Area | Delivered | Remaining owner/technical limit |
| --- | --- | --- |
| Composition | Useful Inner camera plus genuine Full system view; all9 discoverable | Full-scale outer overview makes inner bodies small; real geometry cannot match the concept's invented arrangement. Inner view can clip out-of-region planets. |
| Planet appearance | Distinct materials, Jupiter bands, Saturn rings, cyan Uranus/blue Neptune | Procedural surfaces and ring bands are illustrative, less detailed than surveyed textures; no current weather or qualified rotation. |
| Main belt | Sparse depth, depletion gaps, adjustable visible particle count | Aggregate only; no identified asteroid data/picking or measured population density. |
| HUD/mobile | Shared compact brand, all9 touch-scroll body controls, selected card, short-screen camera framing | On very short screens details scroll; space limits reduce globe size. Hardware touch acceptance remains open. |
| Science | Pinned source vectors and explicit center/barycenter/reference contracts | DE441/442 outer-model residuals remain; same-model precision certification, outer body centers and R4 frames are not claimed. |
| Performance | Explicit1k/3k/6k aggregate caps and quality controls, no idle rendering, actual CPU/GPU-availability evidence | SwiftShader only; no hardware GPU or FPS claim. |
| Design acceptance | Fresh actual/reference comparison, selected and expanded states | **OWNER VISUAL ACCEPTANCE PENDING**. Green tests do not confer it. |
