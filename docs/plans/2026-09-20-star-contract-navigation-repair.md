# Star contract and navigation repair implementation plan

Goal: preserve explicit source astrometry/photometry through metadata, EPHE, selection and details; restore familiar labels and prompt exact links.

Architecture: one Python canonical science contract with explicit source and render values, shared cross-ID reconciliation and generated metadata. Existing native SWE equations remain intact; bounded native schema/search/materialization changes and Vue identity lookup consume the same values. Runtime data stays mounted, receives new version IDs, validates before atomic installation, and retains previous generations.

Stack: Python/FastAPI, native C/WASM SWE, Vue, Docker, pytest, existing Node/Playwright validation.

The user's supplied repair brief authorizes implementation through PR without further architecture approval. No Observe, new catalog acquisition, Gaia scaling, WordPress, AI or Member work.

1. Record baseline source/data hashes and before screenshots/timings; preserve installed generations and runtime shell.
2. Test explicit epoch/passband/color/source identity behavior, then implement shared `backend/app/services/star_science.py` and catalog/API propagation. Check acquired Gaia/Tycho/Hipparcos coordinate definitions directly.
3. Test malformed exact EPHE names/types/offsets/units and source values using compiled real native reader; tighten `validate_oras_dense_star_tiles.py` and bounded `stars.c` behavior.
4. Adapt `build_oras_dense_star_tiles.py` to shared reconciliation and explicit epochs. Preserve familiar source-backed names only, profile limits and native brightness/radius/halo formulas.
5. Test and fix Vue candidate expansion/short circuit/bounded lookup/fallback and same-science materialization; display source band, render method, frame/epoch and units.
6. Build reproducible new catalog and dense releases from existing checked source artifacts; validate all records, native decoded examples and source checksums. Install with atomic exchange and rollback directories; reload bind mounts deliberately.
7. Build native/Vue runtime; run requested backend/frontend full suites, relevant focused checks and Docker runtime/API checks.
8. Run timing harness for nine star cases cold/warm, independent identity/camera, science/no-jump checks; capture eight controlled visual fields and planet/DSO/satellite regressions.
9. Review diff and evidence; fix material scoped regressions. Record exact files, commands, hashes, versions/counts/sizes, timings and limitations in a focused implementation report.
10. Commit tested changes, push bounded branch and open PR `Repair star identity, science contracts and navigation`; verify remote head and report PR URL. Do not merge or deploy production.
