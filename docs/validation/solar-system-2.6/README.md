# Solar System 2.6 — Beyond the Planets

Delivered for owner review on `recovery/reconcile-20261026`, existing **draft
PR107**. Starting local/remote SHA was
`66050b5e7f3a9cbcfccbf6258645bd1804051b28`; unchanged main baseline was
`9a03d8260a529f5858c5c3298cbb9d32b721daeb`. The final pushed SHA and hosted checks
are recorded on [PR107](https://github.com/Shadowgar/Astronomy-Hub/pull/107).
This is scoped engineering qualification, not owner visual acceptance or
independent approval of the entire consolidated PR.

1. **Application:** Solar discovery and Voyager mission views enter `/beyond`.
   The shared Three camera/HDR/resource layer serves outer context, separate
   historical crossings, conceptual heliosphere, actual observations and Oort
   scale. It never mounts a second heavy renderer beside a native engine.
2. **Voyager1:** observed2012-08-25, approximately121.6AU; predicted source-vector
   radius121.60740036459656AU at representative noon. **Voyager2:** observed
   2018-11-05, approximately119AU; source radius119.02172745622927AU. The vectors
   are unchanged2.5predictions based on tracking through1992, not measured3-D
   crossing coordinates. No vector is rescaled to the published radius.
3. **Crossing sources:** [NASA Voyager](https://science.nasa.gov/mission/voyager/interstellar-mission/),
   [Voyager1 analysis](https://doi.org/10.22323/1.395.0032),
   [Voyager2 measurements](https://doi.org/10.1038/s41550-019-0929-2), and existing
   [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) mission identities/segments.
   Noon is a declared representative time; observations resolve a day, not that
   instant. Comparison mode explicitly shows two historical epochs and hides
   same-epoch planet markers. Actual mission timelines remain available.
4. **Heliosphere:** translucent conceptual regions explain solar wind,
   termination shock, heliosheath, heliopause and interstellar plasma. Shape,
   direction and dimensions are artistic. The Sun's gravitational system extends
   beyond the heliopause. Opher2020pickup-ion MHD and Kleimann2022model comparison
   are cited with assumptions; numerical grids, coefficients, reproduction and
   redistribution are **not qualified**. No mesh is sold as their result or a
   complete empirical boundary. [Science and model limitations](SCIENCE.md).
5. **IBEX:** real IBEX-Hi DR18, 2009–2022, 2.73 keV CG-corrected ENA intensity and
   original variance,1AU reference. All 1,800 native 6°ECLIPJ2000cells, masks and
   sqrt-variance uncertainty remain intact. Interactive equal-area Mollweide
   display is angular flux, neither visible-light imagery nor a3-D inversion.
6. **IMAP:** real MAG L2 norm-GSE version 002.0003, 2026-07-01. Source 172,800 samples at 2 Hz
   samples contain 167,721 accepted and 5,079 excluded samples. Display 1,440 one-minute
   means and min/max variability in nT; missing bins remain missing. The GSE
   vector's magnitude is rotation invariant. No live polling. [Observation
   acquisition, calibration, rights and exact source URLs](OBSERVATIONS.md).
7. **Oort:** sparse unnamed illustrations and range guides show inner extent
   2000–5000AU, outer10000–100000AU. These are theoretical estimates, not measured
   boundaries/density or invented catalog objects. Long-period comet examples
   are explanatory links; their orbits are not invented. Existing qualified
   comet paths and catalog populations remain separately available in Solar.
8. **Scale/navigation:** presets50→150→3000→50000→100000AU; physical source
   positions remain CPU doubles before camera-relative Float32 GPU writes. AU,
   km, light-hours/days/years use defined constants. Live camera-Sun distance is
   distinct from reference radius. Pan/orbit serialization is bounded and tested
   with100actual OrbitControls boundary cases; source positions never move to
   improve framing. No metre-scale craft precision is claimed at Oort distances.
9. **Data/resources:** normalized pack 198,209 bytes; manifest SHA256
   `7157a049597f164fa0b4df34d72c483401d0f7aaac5f217f3c084cec0b28f037`.
   Retained observation source bytes 4,227,350; new reference replies 10,936 bytes.
   Declared 128 MiB acquisition / 32 MiB response / 16 MiB pack / 2 MiB product transfer budgets
   are respected. Read-only optional mount; no observation data in Docker images
   or frontend bundles. Geometry 378,340 bytes / 64 MiB; driver/compositor memory is
   separate. Original hashes, attribution and rights remain attached.
10. **Scientific checks:** six fresh Horizons states compared with existing
    mission interpolation at each event's day-start/noon/day-end: maximum8.638m,
    2.582e-8km/s,42.8µs UTC/TDB difference. Same predicted solution checks numeric
    interpolation, not new tracking. Independent CSPICE directions, all 1,800 IBEX
    cells and 1,440 IMAP bins checked; IMAP recomputation differs by 0 nT.
    [Independent observation review](OBSERVATIONS_INDEPENDENT_REVIEW.md).
11. **Private preview:** [actual exploration](http://localhost:4231/beyond?date=2026-10-27T04%3A00%3A00.000Z&view=outer)
    and [owner gallery](http://localhost:4231/owner-review/solar26/index.html).
    Existing preview routes/rollback copies remain. Only loopback4231 is exposed.
12. **Actual evidence:** four complete Windows Edge / RTX 3060 recordings cover A–E,
    with desktop 1440×900, portrait 390×844 and landscape 844×390 captures. Gallery
    contains 14 original PNGs plus private recordings/hash manifest. Voyager
    timeline roundtrips, model/observation distinction,100000AU travel, original
    Solar camera, Saturn system and native Sky/Earth returns pass. Observer
    numeric roundoff is below3e-11degrees and UTC stays exact.
13. **Performance:** mission first-render CPU 418–472 ms → 24 ms after removing five
    unprepared shader variants; before/after spacecraft images are byte-identical.
    Twelve mission cases and four-model shadow/lifecycle checks pass. Beyond
    six cases / 1,200 frames: GPU median 0.367–1.186 ms, p95 ≤1.219 ms; RAF p95 ≤7 ms.
    **Cold 632–650 ms tasks remain.** Native graphics startup still causes stalls;
    no hitch-free or device-wide guarantee is claimed. [Exact metrics](PERFORMANCE.md).
14. **Tests/build:** 726 frontend tests / 97 files; TypeScript; 39 Docker backend tests
    with 4 inherited deprecation warnings; 10 acquisition tests; independent source,
    real-controls and browser checks. Docker source/served bundle bindings are
    recorded. [Exact commands, results and failed-attempt accounting](VALIDATION.md).
15. **Independent findings corrected:** event UTC inherited from an unrelated
    encounter, zero-microsecond URL padding, mission-switch return state, camera
    domain/roundoff, IMAP letterbox picking, stale observation ownership,
    post-disposal readiness, crowded labels and offscreen planetary flyout.
    Final visual inspection also corrected long crossing text under tabs and
    selected-hover contrast. [Non-author UI review](INDEPENDENT_UI_REVIEW.md),
    [science/frontend review](FRONTEND_SCIENCE_INDEPENDENT_REVIEW.md), and the
    navigation/layout receipts give precise evidence and qualification limits.
16. **Hosted/security:** final-SHA hosted checks are external and recorded on
    PR107 after push. Before this milestone: 28 open PR-ref CodeQL findings and
    204 visible Dependabot alerts. No dependency lockfile changed, no inherited
    alert was dismissed, and neutral/incomplete scans are not approval.
17. **Remaining science:** no uniquely measured heliosphere shape or qualified
    time-varying MHD surface; no empirical Oort shell, individual Oort catalog,
    new Voyager tracking/covariance, live IMAP telemetry or lunar/Earth redesign.
18. **Preservation:** original 157 containers and 90 volumes retained; no new named
    volume, changed protected mount, deletion or new host port. Existing science,
    texture/model packs and native Sky/Earth/Moon implementations remain intact.
    Native Sky's 58 expected-empty dense-star404s reuse prior qualification;
    they are reported separately from successful2.6API/graphics tests.
19. **Owner acceptance:** **pending**, including previously rejected visual work.
    Actual screenshots support inspection; passing engineering checks cannot
    decide the owner's visual acceptance. No PR-wide approval is inferred.
20. **Device/source release:** physical iPhone remains unverified because no
    existing access path is available. The old`f7cb702c`source archive does not
    match this code. A final matching reconstruction/archive, authorized immutable
    public source and descriptor, anonymous HTTPS pairing, and inherited
    combined-work/license qualifications remain outstanding. Nothing published.

No merge, production deployment, public tunnel or protected-resource deletion.
The next task is owner visual acceptance and separately authorized device/source
release qualification. Stop at this milestone; no further product expansion.
