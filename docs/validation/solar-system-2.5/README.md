# Solar System 2.5 — owner handoff

**Implemented and independently qualified within the recorded scope. Owner visual
acceptance remains pending. Release remains blocked by external/device/source
qualifications.** This is not approval of the complete consolidated PR.

Open **http://localhost:4231/missions/voyager1** on the owner's Windows computer.
The [actual screenshot gallery](gallery/index.html) and four complete recordings
are available at **http://localhost:4231/owner-review/solar25-evidence/index.html**.
These use the existing private preview; no public service was created.

1. **Branch and revision.** `recovery/reconcile-20261026`, existing draft
   [PR107](https://github.com/Shadowgar/Astronomy-Hub/pull/107). Started from verified
   `ea4d384af3aead949de7bec1947e8aff41465bca`; main remained
   `9a03d8260a529f5858c5c3298cbb9d32b721daeb`. The final commit and its hosted checks
   are recorded on PR107. [Served-build hashes](evidence/served-build.json) bind
   the final Docker artifact to reviewed implementation inputs.
2. **Solar2.4 independent review closed.** An actual unsupported-2035 seek left an
   expired Pluto path/marker. The narrow correction retires omitted source paths,
   requires current source positions, and hides invalid selection markers. Three
   2026→2035→2026 GPU cycles restore the valid577-point path with stable19geometries/
   67buffers. [Independent review and red/green evidence](REVIEW_SOLAR24.md).
3. **Delivered missions.** Separate Voyager1 and Voyager2, Cassini–Huygens and
   New Horizons have original spacecraft models, historical encounters and source
   paths. Pioneer10/11, Juno, Dawn, NEAR and Rosetta are trajectory-only. Huygens is
   explicitly distinct; no separate descent trajectory is claimed.
4. **Exact sources and coverage.** Voyager encounters use `vgr1_jup230.bsp`,
   `vgr2_jup230.bsp`, `vgr1_sat337.bsp`, `vgr2_sat337.bsp`, `vgr2.ura182.bsp` and
   `vgr2_nep097.bsp` with matched planetary chains. Voyager history extends from
   1977 to2030 with design/mixed/predicted classifications; post1992 is prediction,
   not current tracking. Cassini uses `180628RU_SCPSE_04183_17258` plus native
   cruise solutions:1997–2004 cruise and selected2004–2017 Saturn intervals.
   New Horizons spans bounded2006–2030 intervals: `nh_recon_e2j_v1.bsp` with
   original JUP260/DE413, mission PLU060 reconstruction and
   `NavSBE_2014MU69_od159` Arrokoth solution. Secondary coverage is bounded:
   Pioneer1972/73–1980; Juno2016-07-02–08; Dawn2011-07-14–20 and2015-03-05–10;
   NEAR2000-02-12–18; Rosetta2014-08-04–10. Exact source transitions, endpoints,
   request headers and hashes: [SCIENCE](SCIENCE.md) and
   [immutable manifest](mission-source-manifest.json).
5. **Frame and numerical validation.** Geometric Sun-origin ICRF; UTC navigation,
   TDB sampling; AU/AU-per-second API. 2,376fresh reference comparisons and
   1,368independent original-CSPICE comparisons pass across90segments. UTC/TDB
   difference≤44.2microseconds; client/API anchor difference≤0.266mm. These are
   numerical residuals, not physical ephemeris error bounds. Two failed fitting
   cells were refined without relaxing tolerances.
6. **Historical consistency.** Compatible native mission center chains preserve
   spacecraft-relative target geometry. Ordinary contemporary Saturn differed
   by~0.860km in the retained comparison and was not substituted. NEAR retains
   archived `eros80`/DE403. Unsupported bodies/epochs are unavailable, never frozen
   at2026. [Independent science review](REVIEW_SCIENCE.md).
7. **Models, rights and scale.** Three exact NASA VTAD GLBs serve four flagships;
   total model bytes12,274,376. Voyager twins share the documented design, not
   trajectory. Geometry, node transforms and materials remain intact. Approximate
   uniform metres/source-unit: Voyager0.970584, Cassini0.997754,
   New Horizons1.112397, anchored to documented dish dimensions. NASA/third-party
   and insignia restrictions are recorded; no endorsement is claimed.
   [Asset qualification](ASSETS.md), [independent rights/scale review](REVIEW_ASSETS.md).
8. **Attitude limits.** No CK/FK/SCLK attitude is qualified. Every spacecraft uses
   an explicitly illustrative inspection pose and bounding-box display center,
   not a reconstructed navigation reference point. Cassini's attached Huygens
   reference configuration is illustrative after separation. Target longitude,
   rings and illumination exposure are not qualified historical cartography or
   instrument photometry. Pluto/Charon black mosaic gaps and Arrokoth's reference
   sphere are explicitly disclosed.
9. **Events and navigation.** 32verified events, search, seek, play/pause/reverse,
   full/selected source trajectories, encounter/target views, physical inspection,
   orbit/follow/free camera and Solar return. Source boundaries stop playback
   visibly; no extrapolation or joining of gaps. Solar return and browser Back
   preserve applicable observer, UTC, camera and path intent. Historical native
   system entry remains unavailable outside its separate2025–2030 coverage.
10. **Actual visual evidence.** Four full headed Windows Edge/RTX3060 recordings;
    42camera captures in the journey receipts,54original PNGs in the gallery,
    desktop1440×900, portrait390×844, landscape844×390. An earlier aggregate FAIL
    is retained; its three passing journeys are combined with the corrected
    passing Voyager1 rerun. Final text-only coverage disclosure has its own
    screenshot. [Browser review and exact commands](BROWSER-JOURNEYS.md).
11. **GPU and loading.** Twelve200-frame orbit measurements after70warmup frames:
    GPU median0.268–0.733ms, p95≤1.169ms; frame interval median6.9ms, p95≤7.1ms.
    Readiness333–1568ms; shader preparation21–276ms; model decode24–58ms. Cold
    maximum506.8ms and a611ms main-thread task remain an owner-facing limitation.
    This is not hitch-free or machine-cold qualification. Peak tracked source
    texture reservation29.82MB/134.22MB; not total GPU memory. All42retired-renderer
    checks release owned resources. [Metrics](evidence/performance-performance.json).
12. **Tests.** 697frontend tests/92files;24focused mission tests; typecheck;
    64Docker backend tests (31inherited deprecation warnings);8asset tests;
    production Docker build;10mission defaults/10trajectory contracts;
    independent100actual states/90segments/32events. Four GPU lifecycle
    regressions cover pending-model context loss and full/ranged Back restoration.
    Four additional checks verify actual quality buffers, context-loss Retry and
    reload recovery, and the visible Pluto source disclosure.
    [Exact commands, results and boundaries](VALIDATION.md).
13. **Independent reviews.** Separate non-author science, rights/scale and
    application/browser reviews are complete. Confirmed identity/precision,
    disposed-pipeline, late-readiness, source-edge, path-restoration and lost-notice
    findings were corrected and rechecked. [Application findings](REVIEW_APPLICATION.md),
    [workspace findings](INDEPENDENT-WORKSPACE-REVIEW.md). No unresolved introduced
    source/runtime correctness finding remains in those scopes; cold loading and
    the explicitly unqualified visual/scientific representations remain limits.
14. **Hosted CI/security.** PR107 records exact-final-SHA Repository integrity,
    Playwright and hosted CodeQL results after push. Local tests do not replace
    those checks. Inherited CodeQL/dependency liabilities remain separate; a
    neutral/incomplete GitGuardian scan or skipped draft review is not approval.
15. **Missing coverage and uncertainty.** No full Cassini tour, Huygens descent,
    secondary models, live telemetry, universal history or NASA Eyes parity.
    Most segments have no formal covariance. New Horizons original cruise kernel
    discloses separate phase estimates:200km/3.3mm/s and10,000km/6.7mm/s,3-D1sigma;
    no per-epoch covariance is inferred. Source interpolation error is separate.
16. **Owner visual acceptance:** pending. Passing engineering checks do not grant
    it, including for earlier Solar phases.
17. **Device and source release:** physical iPhone remains unverified because the
    owner has no existing access path. The old`f7cb702c`source archive does not
    match this application. A final matching reconstruction/archive, authorized
    immutable public source/descriptor, anonymous HTTPS pairing and inherited
    combined-work/license qualifications remain outstanding. No archive published.
18. **Preservation and stop:**147/147original containers and90/90volume names,
    prior source/asset hashes and loopback4231binding preserved;10additivehelpers.
    No new host port, named volume or writable source mount. No merge, production
    deployment, branch deletion or protected-data change. Prior preview roots
    remain available, including`solar24.localhost`. [Audit](evidence/preservation-final.json).
    Next task is owner inspection and separately authorized device/source release
    qualification. Stop here; no Solar2.6 expansion.

Loaded context and exact implementation/test file inventory are recorded in
[PLAN.md](PLAN.md), [VALIDATION.md](VALIDATION.md) and [CHANGED_FILES.txt](CHANGED_FILES.txt).
