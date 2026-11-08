# Independent frontend science and precision review

Reviewer `solar26_physics` did not author the reviewed frontend files. Scope:
`beyondContracts.ts`, `beyondMath.ts`, the optional shared camera/speed extension,
`BeyondScene.ts` camera/source handling, `BeyondWorkspace.tsx`, navigation changes,
and `ObservationViews.tsx`. This is not
independent review of the reviewer's own backend. It does not replace final
browser/navigation/layout qualification or owner visual acceptance.

## Verified within scope

- The real backend context and both pinned observation JSON products pass the
  frontend validators. A deliberately relabeled simultaneous crossing date is
  rejected. Unknown product classes, unsupported angular grids, malformed masks,
  nonfinite values and incorrect pinned-product frames fail closed; IMAP also
  requires nT units. IBEX displays the pinned metadata's flux units. External source
  links require HTTPS without credentials. The read stream has explicit byte caps.
- AU, light speed and Julian-year conversions match JPL definitions. The
  ECLIPJ2000→J2000 direction transform matches independently evaluated CSPICE
  basis vectors; the inverse roundtrip and equal-area Jacobian are tested.
  No angular map is interpreted as a radius or a three-dimensional inversion.
- Positions remain CPU doubles before camera-relative float32 upload. At 100,000 AU
  the test resolves a 10 km separation to within 3 m; the code does not claim exact
  meter-scale absolute precision there. Existing Solar defaults retain 500 AU
  camera range and 5 AU/s speed unless an explicit outer-domain option is supplied.
- Historical crossing layers use each unchanged source vector/date. Comparison
  hides current-epoch planets; individual-event planets require an equal source
  epoch. Static illustrative heliosphere dimensions never rescale those vectors.
  Oort samples have no invented catalog identities or measured density claim.
- IBEX renders all 1,800 original cells with separate seam edges, finite polar
  closure, north up and east left. Flux and square-root variance remain explicit;
  unmeasured cells are distinct. IMAP retains gaps, scalar units, minute counts
  and min/max variability rather than calling the envelope uncertainty.
- The chart author's subsequent pointer correction uses the inverse SVG screen
  CTM, correctly accounting for preserveAspectRatio/letterboxing. Actual pointer
  position selection remains part of the author/integrator's browser journey.

The frozen chart source SHA256 at this review is
`49f29ee14c70cbdf53c78ef1f5d952f1c235f5574a160a6a563822a65dca2e81`.
No open P0/P1/P2 scientific finding was identified in that chart component.

## P2 — reachable camera could fail return-state validation

Original cause: `BeyondScene.ts` admitted unlimited absolute pan translation via
OrbitControls, while `beyondMath.ts:validBeyondCamera` rejected any position/target
component outside ±1,000,000 AU. Thus normal outer-scale panning could save a pose
that the return path subsequently refused. The validator also initially admitted
relative distances above OrbitControls' 1,000,000 AU maximum, causing silent clamping
when restoring an accepted pose.

Reproduction used actual Three OrbitControls without a WebGL mock: move to
918,000 AU camera-target distance, invoke the same `_pan(3000,0)` math used by a
roughly two-screen drag, then update. The resulting position component was
−3,267,247.894 AU and target component−2,349,247.894 AU; `validBeyondCamera` returned
false. The coordinate difference remained valid, proving that pan translation
was the missing bound. Potential user impact: returning from a mission/Solar
view loses the chosen outer-space camera.

The scene author added equal translation of camera and target at the domain
boundary; the root author added the matching relative-distance validation guard.
An initial mocked regression passed, but the independent real-controls recheck
found 8/100 varied pans still invalid through float64 reconstruction roundoff:
one returned x=1000000.0000000002 AU. This follow-up was reported for an inward
numerical margin or consistent domain tolerance and a real-controls regression.

The final scene correction translates both endpoints to an inward margin of
0.000001 AU only when crossing the absolute boundary. This is a camera navigation
margin, approximately 149.6 km at a million-AU domain limit; it does not modify
source positions. Repeating the independent real-controls harness now yields
**100 cases, zero failures**, with restored endpoints agreeing within 1e-8 AU.
The added `beyondCameraDomain.test.ts` also uses real Three/OrbitControls and
retains a failing pre-margin run; the final focused suite passes.

**Status: correction independently qualified at the camera/controller level.**
The reviewer did not edit implementation files under review. Final browser
navigation remains a distinct integration evidence item.

## Focused command

```sh
cd frontend
npx vitest run tests/beyondContracts.test.ts tests/beyondMath.test.ts tests/beyondObservationViews.test.tsx tests/beyondScene.test.ts tests/beyondCameraDomain.test.ts tests/solarCameraController.test.ts tests/solarFoundation.test.ts
# 41 tests / 7 files passed after the final timestamp-admission correction.
```

The initial 32 passing focused tests did not conceal the separate real-controls
counterexample. The stronger retained real-controls regression now covers it.
The mission shadow/performance correction has its own
[independent review](PERFORMANCE_INDEPENDENT_REVIEW.md), with no open finding.

## Final workspace source review

- A shader-preparation completion cannot revive a disposed or replaced scene:
  the continuation checks abort, instance ownership, disposed state and ready
  state before enabling the workspace. The separate non-author Windows review
  retained the failing before run and passing after run for context loss during
  pending preparation.
- Observation rendering and diagnostics require the requested product identity;
  aborted completions cannot publish stale data. The separate Windows review
  also records the corrected IMAP pointer selecting the first bin at the actual
  rendered plot start. These two assertions pass in
  `output/playwright/solar-system-2.6/workspace-review-after/workspace-review.json`
  with no captured browser errors, on the NVIDIA RTX 3060 laptop GPU.
- Individual crossing URLs canonicalize to their declared representative noon
  UTC. Same-epoch planets are guarded independently; historical comparison
  preserves its context UTC and keeps planetary markers hidden. Returning from
  the mission preserves the saved Beyond view/camera/context UTC.
- Existing Solar camera defaults remain unchanged; the extension is an explicit
  option for the Beyond scene. The scene has bounded geometry allocation and a
  single active shared-renderer lifecycle. Source vectors, catalog identities
  and the original science packs were not changed by the frontend corrections.
- Transparent conceptual shells are openly illustrative. Their artistic
  dimensions/direction do not qualify the missing scientific heliosphere model.
  Final owner visual acceptance and physical iPhone testing remain separate.

Exact reviewed source hashes, command results and the remaining scope limits
are recorded in `frontend-science-independent-review.json`.

## Final navigation corrections

A P2 origin-state loss was found at `MissionWorkspace.tsx:67`: choosing another
mission copied only `missionReturn`, dropping `beyondReturn`. A user returning
to a Voyager after a mission switch would lose the original Beyond view/camera.
The author now retains `beyondReturn`; the one-field correction was independently
reviewed. The other reviewer's actual browser mission-switch assertion remains
the final integration evidence for that journey.

A separate browser integration run found that Python's six-digit zero fractional
UTC padding (`.000000Z`) was rejected by the Mission route's millisecond-precision
parser. The correction at `beyondContracts.ts:17,35` removes only trailing zero
microseconds while admitting the context. It rejects nonzero microseconds rather
than silently rounding them. The reviewer independently ran both actual backend
crossings through the corrected frontend validator, `missionPath` and
`parseSceneDate`: both routes now parse, epoch difference is zero milliseconds,
and position, velocity, `jd_tdb` and source-manifest identity are unchanged.
The frontend regression explicitly rejects `.000001Z`.

No confirmed unresolved P0/P1/P2 source issue remains within the reviewed bytes.
This statement does not replace complete browser journeys, owner acceptance,
source-model qualifications, physical-device testing or whole-PR review.
