# Corrected-source commands and evidence

Default Mode context remains the64-document inventory in the parent report. Working directory: `.worktrees/r3-a-cinematic-solar-1`. Correction is limited to the independent compact camera finding and label/resize cases exposed by its focused browser test.

```bash
SOLAR_FOCUS_EVIDENCE=output/playwright/solar-refinement-focus-red timeout 90s node scripts/validation/verify_solar_compact_focus.mjs
SOLAR_FOCUS_EVIDENCE=output/playwright/solar-refinement-focus-green timeout 90s node scripts/validation/verify_solar_compact_focus.mjs
SOLAR_FOCUS_EVIDENCE=output/playwright/solar-refinement-focus-corrected timeout 90s node scripts/validation/verify_solar_compact_focus.mjs
SOLAR_FOCUS_EVIDENCE=output/playwright/solar-refinement-resize-red timeout 90s node scripts/validation/verify_solar_compact_focus.mjs
SOLAR_FOCUS_EVIDENCE=output/playwright/solar-refinement-focus-final timeout 90s node scripts/validation/verify_solar_compact_focus.mjs
npm --prefix frontend run typecheck
npm --prefix frontend test
npm --prefix frontend run build -- --emptyOutDir --outDir ../output/solar-cinematic/hub-first
npm --prefix frontend run build -- --emptyOutDir --outDir ../output/solar-refinement/hub-second
SOLAR_REFINEMENT_EVIDENCE=output/playwright/solar-refinement-corrected timeout 150s node scripts/validation/verify_solar_refinement.mjs
CINEMATIC_EVIDENCE=output/playwright/solar-refinement-corrected-cinematic timeout 90s node scripts/validation/verify_solar_cinematic.mjs
CINEMATIC_COMPACT_EVIDENCE=output/playwright/solar-refinement-corrected-compact timeout 90s node scripts/validation/verify_cinematic_compact.mjs
CINEMATIC_LIFECYCLE_EVIDENCE=output/playwright/solar-refinement-corrected-lifecycle timeout 90s node scripts/validation/verify_cinematic_lifecycle.mjs
R3_EVIDENCE=output/playwright/solar-refinement-corrected-navigation timeout 240s node scripts/validation/verify_cinematic_navigation.mjs
R3_IDENTITY_EVIDENCE=output/playwright/solar-refinement-corrected-identity timeout 90s node output/solar-cinematic/run_identity.mjs
R3_RACE_EVIDENCE=output/playwright/solar-refinement-corrected-history-race timeout 40s node output/solar-cinematic/run_history_race.mjs
R3_ENTRY_EVIDENCE=output/playwright/solar-refinement-corrected-entry-race timeout 90s node output/solar-cinematic/run_entry_race.mjs
python3 scripts/validation/verify_solar_refinement_delivery.py --candidate
python3 scripts/validation/validate_architecture_docs.py
python3 scripts/validation/validate_reconciliation_docs.py
python3 scripts/validation/verify_cinematic_references.py
python3 scripts/validation/verify_solar_assets.py
git diff --check
```

The first three RED stages respectively reproduce card occlusion, overlapping nonselected label and stale resize framing; they are not passes. Final43-case proof passes after all corrections. Cinematic18, compact40, lifecycle7, navigation28 and identity/race5 groups all pass on corrected source; frontend311/311 and TypeScript pass. Raw run commands/exits: [browser-commands.json](evidence/browser-commands.json). The source-matched Docker science15/2skips from the initial refinement was reused, not rerun or relabeled.

Pinned independent Docker reproduction used the same exact command as the [initial command record](../COMMANDS.md), writing `output/solar-refinement/hub-docker`. [Fresh log](evidence/build-corrected-docker.log). One existing large lazy-chunk warning remains unsuppressed. Builds, byte checks and browser checks used existing limits; no stalled N1 suite, infrastructure cleanup or unrelated service restart.

After commit: `python3 scripts/validation/verify_solar_refinement_delivery.py`, `git status --short`, `git log --oneline -5`, `git rev-parse HEAD`, `git ls-remote origin refs/heads/r3-a-cinematic-solar-1`. The independent final-head follow-up review and exact SHA are published separately in PR83; neither technical tests nor code review grants owner visual acceptance.

Versioned text logs remove trailing whitespace only; original raw logs remain under `output/solar-refinement`.
