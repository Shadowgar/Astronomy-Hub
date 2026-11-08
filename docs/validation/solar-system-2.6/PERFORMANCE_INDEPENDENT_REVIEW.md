# Independent review of the mission shader correction

Reviewer: `solar26_physics`, separate from the author of the MissionScene change.
Reviewed on 2026-11-08 against starting commit
`66050b5e7f3a9cbcfccbf6258645bd1804051b28` and the working-tree candidate.
`frontend/src/features/missions/MissionScene.ts` reviewed SHA256:
`a05bbfdc87cf917e96017d66bb6f24e391083b3de75a1250be45b68683d207d5`.

**No open P0/P1/P2 finding in this correction.** This is a separate review of
the minimal shadow configuration change, not whole-PR, Beyond application,
physical-device or owner visual acceptance.

At lines29 and66, the light now retains its original `castShadow` value through
the scene lifetime. Actual shadow work follows craft visibility using
`shadow.autoUpdate` and `shadow.needsUpdate`. Inspection of installed Three r180
`WebGLShadowMap.js:120` confirms that disabling both skips shadow allocation and
drawing. When the craft becomes resolved again, both flags are restored before
the pipeline renders. Source positions, model scaling, geometry, light position,
1024×1024 shadow resolution, materials, output pipeline and resource disposal
are unchanged. Diagnostics distinguish configuration from actual visible work.

The reviewer inspected the actual baseline/candidate program receipts and reran:

```sh
node scripts/validation/verify_solar26_prepared_programs.mjs output/playwright/solar-system-2.6/performance/baseline-programs/cold.json
# FAIL as expected: 5 first-frame programs used without completed preparation.
node scripts/validation/verify_solar26_prepared_programs.mjs output/playwright/solar-system-2.6/performance/candidate-programs/cold.json
# PASS: 0 unprepared first-frame programs.
sha256sum docs/validation/solar-system-2.6/performance-gallery/baseline-voyager1-inspection.png docs/validation/solar-system-2.6/performance-gallery/candidate-voyager1-inspection.png
# Both a13fb0636f13fd7f76e62de0c3f951e105c2ebe08cf36b0730039b79e6672235.
```

The matching actual browser capture was visually inspected. Byte identity
supports preservation of this exact inspection view; it is not a broad visual
quality claim. The author/integrator's retained Windows RTX3060 receipts cover
four models, repeated inspection/overview transitions, disposal, desktop,
portrait/landscape and the pending-model context-loss regressions. Those valid
hardware runs were reviewed rather than redundantly rerun by this reviewer.

The evidence distinguishes the removed first-render shader stall from the
remaining native browser/ANGLE initialization stall. Candidate plain first-render
CPU24.0ms replaces baseline418.1/472.4ms; maximum RAF gap remains520.9ms with a
637ms native/mount task. The report correctly avoids a machine-cold claim or a
statistically reliable overall startup improvement from this small sample.
No diagnostic suppression, lower resolution or disabled major feature was used.

The reviewer made no change to the correction. Final application build identity,
hosted checks and owner/device acceptance remain the parent's separate gates.
