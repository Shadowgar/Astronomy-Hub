# Satellite observing context consolidation

Read-only base: `sky-satellite-visual-pilot-1` at `d2909a52d3f747c555ca87eff112bab83c064779`. `git status --short` produced no output. No repository files edited; no tests, builds, network acquisitions or runtime mutations performed. Only `/tmp` inventory/report artifacts were written.

## Loading declaration and limits

Correct task packs: union of `frontend_change`, `backend_change`, `validation`, `review`, `debug`; CORE then LIVE were read before task evidence. The union contains **61 unique documents / 4,088,118 bytes**. All were byte-read and SHA256 inventoried. Eleven are fully read in model context; remaining documents have exact selected excerpt lines/partial-line flags in JSON. The manifest was parsed to obtain paths, not claimed fully read in model context. Three additional directly linked satellite evidence files were fully read. No broad docs scan or unlisted authority document loading occurred.

Initial combined context output was truncated; it is not counted as full-union loading. Subsequent bounded reads fully covered CORE/LIVE and priority authority/evidence. Parent explicitly authorized bounded semantic extraction for the 4 MB historical union. The exact model-read coverage is recorded in JSON, so this handoff does not claim the literal full manifest union was read. Large historical audits remain inventoried/excerpted, not fully loaded.

## Actionable scope

The owner's current instruction, relayed by the parent, supersedes the October25 stop-for-review gate only for Next Passes, native-clock Play/Pause/Restart/Live, the approximately62arcsec accuracy investigation, and a separately reviewable ongoing-refresh proposal. Create new draft work stacked on preserved PR102. No merge, production deployment, full-catalog replacement, source/pin/native science change, unrelated redesign or broader X2 expansion is authorized.

Preserve native Sky scene/math/SGP4/photometry/coordinates, original native JS/WASM, pins, accepted5°entry/7°exit identification policy/minimum close offset4, accepted navigation, Pennsylvania scenery, Solar/Moon/PS1–PS3, observer/settings/mounts/volumes/rollback. Hub owns product intent and bounded qualified adapter commands; native SWE owns scene/clock execution. Use current bridge schemas/generation/stale-client acknowledgement/lifecycle rules and one active heavy renderer. Selection/Track/Stop are independent from clock playback. Ordinary no-date Sky runs native current UTC at1×; supplied fixed-date science views and returns intentionally pause. Do not silently turn fixed-time intent into Live or imply a simulated pass is current optical visibility.

## Source and science truth

- Admitted pilot is `visual_satellite_pilot.v1`, release `visual-pilot-20261025-38a1426`,155records; native/backend must read the exact same read-only pilot directory. Original full feed14281records, original importer minimum1000 and all original bytes remain preserved.
- Pinned mirror revision `38a142645e7814b538daaf5868b814550e1f0dda`; original visual.tle SHA256 `63c4c833d967c26c2b3d403de42c234ff6b920969639642a3bedce15225406e2`; native release SHA256 `9f063125517b9a6cc990159009ec7e46b764dc6dd14afc7a4b44a651e5920185`. Do not adopt mirror workflow: it continued after404 and overfetched.
- Only ISS25544 was independently matched to official first-party TLE text; distributor hash/Gitblob does not establish whole-file first-party authentication. Unsigned commit. Epochs October20–24 were155/155 within14days on October25; current freshness must be recomputed, not quoted as current from that dated record.
-133 baseline standard magnitudes were joined by canonical NORAD plus international designator;22 omit magnitude. Native defaults are modeled behavior, never observed brightness or a visibility guarantee. Original TLE lines remain unchanged; canonical string metadata resolved14zero-padded lookup failures.
- Optical eligibility needs independent current site/Sun/satellite illumination/horizon checks. At2026-10-25T07:13:43Z six above0°, two above15°, zero sunlit above either threshold. This historical result is not today's state.
- Existing demonstration: NORAD61045,2026-10-25T10:22UTC/06:22EDT, native1× approximately8seconds, explicitly upcoming-pass simulation. No product Play control existed: test harness advanced native clock while Hub kept fixed-time intent.
- Independent exact TLE/site/UTC/native-vs-Skyfield angular displacement agreed closely (6.407122° vs6.407142° desktop); absolute geometric residual61.904–62.096arcsec. Frozen initial residual61.913arcsec; apparent57.927arcsec. Timing alone does not explain residual. No absolute precision acceptance threshold exists. Investigate frames/observer/time conventions/source outputs before proposing any native change.
- String catalog/source_id/model identity and true fallback RA/Dec remain required. Missing/unavailable/stale/provenance-rejected are distinct; a failed refresh cannot refresh source time. Six-digit NORAD support remains outside legacy slice.

## Conflicts and supersession

1. CORE/LIVE/PROJECT_STATE/MASTER_PLAN top sections still say stop for owner functional review and do not include new observing scope. Reconcile narrowly to current explicit owner authorization; historical bans are not fresh approval gates.
2. SYSTEM_VALIDATION and architecture have dated R3-A-only/Mars-candidate language, while newer CORE/LIVE include R4 Moon/PS1–PS3 and satellite pilots. Those activation clauses are historical; permanent proof/ownership rules remain active. Do not rewrite working native/planetary behavior to match stale text.
3. Historical PhaseB full-app God's Eye plan conflicts with current architecture/ADR0009 owned Cesium Viewer. ADR0009 expressly supersedes full-app topology; no Earth/full-app adoption belongs in this Sky task.
4. Tonight `tonight.v1` explicitly excludes artificial satellites and legacy pass providers. Next Passes should use a bounded satellite contract and source-backed computation; do not silently reinterpret/change Tonight MVP semantics.
5. ENGINE_CATALOG describes qualified passes as future/unqualified legacy behavior and separates Sky catalog from Earth stations-only path. New scoped pass qualification may supersede that capability status; it does not establish unified Sky/Earth catalog or X2 tracking scope.
6. Browser/technical passes are separate from owner acceptance and physical-device GPU qualification. Existing warnings/tiles/partial attempts remain recorded, never silently relabeled PASS.

## Validation tools and required proof

Commands below are existing recorded patterns, not executed by this context task. Adapt output paths/selection to the new task and preserve originals.

- Node22: `/home/rocco/.nvm/versions/node/v22.22.0/bin/node`; npm PATH prepend `/home/rocco/.nvm/versions/node/v22.22.0/bin`.
- Project Python: `/home/rocco/Astronomy-Hub/.venv/bin/python`. System `python` is absent; initial read-only inventory invocation failed127, then python3 succeeded. Prior launcher used project venv because system python3 lacked SQLAlchemy.
- Frontend: `npm --prefix frontend test`; `npm --prefix frontend run type-check`.
- Native contracts: `node --test tests/runtime/satellite-presentation.test.mjs tests/runtime/satellite-tracking.test.mjs`, broaden to changed bridge/clock/lifecycle tests as required.
- Docker science: read-only no-network `docker run --rm --network none --read-only --tmpfs /tmp -e PYTHONDONTWRITEBYTECODE=1 -v "$PWD:/work:ro" -w /work --entrypoint python sha256:00e343c5943ae02f94c5312d17fec4ab6c5aaa2376d27ce9ff2486793dc15c6a -m pytest backend/tests/test_satellite_visual_pilot.py backend/tests/test_satellite_norad_search.py backend/tests/test_satellite_feed_api.py backend/tests/test_satellite_propagation_service.py backend/tests/test_satellite_tle_catalog.py backend/tests/test_satellite_tle_release_pipeline.py backend/tests/test_satellite_tle_deployment.py backend/tests/test_gaia_sky_catalog.py -q -p no:cacheprovider`; new pass/science contracts need appropriate focused regressions.
- Existing source/promotion tests: `python -m pytest tests/runtime/test_sky_promotion.py tests/runtime/test_sky_source.py -q` with project venv.
- Preview launcher: `scripts/validation/start_satellite_visual_pilot_preview.py`; current preview is a historical environment-local address, verify actual state before use.
- Existing browser tools: `scripts/validation/verify_satellite_visual_pilot.mjs`, `scripts/validation/verify_satellite_visual_pilot_navigation.mjs`, `scripts/validation/verify_satellite_native_motion.mjs`. Cover actual desktop1440×900, portrait390×900, landscape667×390, real wheel/touch input, selection/Track/time independence, pass source/time disclosure, native clock advancement and pause/restart/Live transitions, history/renderer return, cleanup and stale/unavailable behavior.
- Reproduce Hub builds host/repeat/pinned Docker and compare source/served identities. Existing build image `node:24.14.0-bookworm-slim@sha256:d8e448a56fc63242f70026718378bd4b00f8c82e78d20eefb199224a4d8e33d8`. Changed Sky adapter/UI artifact requires proper contained build/admission; no C/WASM rebuild authority inferred.
- Existing independent science helper in `output/satellite-visual-pilot/independent-motion/compare_motion.py` is retained under evidence; original relative output locations must be restored before unmodified reruns. Compare native and independent exact source/UTC/site; retain raw frozen samples and transformation assumptions.
- Delivery verifier `python3 scripts/validation/verify_satellite_visual_pilot_delivery.py --candidate`, then without `--candidate` for committed source; use scoped new-task proof rather than overwriting original receipt.
- Before commit `git status --short`, `git diff --check`, relevant tests; before push status and `git log --oneline -5`. Independent exact-HEAD review, exact local/remote/served identities, file list/command outputs/gaps and owner handoff required.

Existing evidence is historical:388frontend/58files,19native,108Docker tests;4inherited anyio/httpx warnings; browser3viewports×5groups and final navigation16checks.196tile404s,14aborts,4SwiftShader warnings,33.4–66.7ms medians/83.4–133.3ms p95 were recorded. None are new-task passes. Previous interrupted143combined browser run and37-dot localAPI run are not passes. No timeout inflation, warning suppression or physical performance claim.

## Exact pack inventory

`full` means complete content reached model context. `excerpts` means exact selected lines retained in JSON. SHA256 hashes below describe entire files regardless of model-read coverage.

| Document | Read scope | SHA256 |
|---|---|---|
| `docs/context/CORE_CONTEXT.md` | full | `f1b0583bce40dd7fa4e6e339646ce235fb3d608d12c6e1e5beea91efd78750ef` |
| `docs/context/LIVE_SESSION_BRIEF.md` | full | `58a6e6d7a50bfc96639090f3b2199f2c5ac6525424b51c39a5f48b8b31a8148f` |
| `docs/validation/r3-a-solar-system/RECONCILIATION.md` | excerpts | `028cbf733b185dd9f1af31a544e0c88b6962bfe273a475a1dc573ad64968c56b` |
| `docs/validation/r4-a-planet-view/README.md` | excerpts | `156b126caf34bccf644f606c3be4a25d1f317100d2d26a13781a49933f937fd5` |
| `docs/validation/planetary-systems/README.md` | excerpts | `a2c466b614859db5eb4b73c025a51c775da71ab7f236a5c95fd3aaea32a2ec00` |
| `docs/validation/sky-satellite-live/README.md` | full | `0a6b1b97d3bbb95d3629cff5322fc1964c288498ded1e015f2daf30e58b3445e` |
| `docs/validation/satellite-visual-pilot/README.md` | full | `3d96c369d1b9ceeaca4f5b3abd33a24667616af638d35f8db0b32b1923221f5d` |
| `docs/architecture/decisions/0010-r3-a-solar-runtime.md` | excerpts | `af2fb12c547886cd737ecfa7cade29d5ea9a38097978bda431ec421b8350b534` |
| `docs/product/PRODUCT_VISION.md` | excerpts | `9f145498e1c10ef0dd699feb84e287fa1c232081f710375e8fb8c052811c04cb` |
| `docs/validation/SYSTEM_VALIDATION_SPEC.md` | full | `93b80a01cf86005b1a35913bb5e135cc8a0ebe69c09c09456b284ad3fe5b6d82` |
| `docs/architecture/UNIFIED_UNIVERSE_ARCHITECTURE.md` | full | `adbf687f0aef0923e13c7d5533deec51fb6b6556652ffe72ad1b8a7aaee5aa2a` |
| `docs/studies/GODS_EYE_SWE_COMPATIBILITY_STUDY.md` | excerpts | `d901bff35768636b2f5d2df61f4c91d9a7310068fcdadaec1b1e7f8cdc241e22` |
| `docs/validation/UNIFIED_RUNTIME_COMPATIBILITY_EVIDENCE.md` | excerpts | `2918ec4dcfd2297e3db2a8dbf537b73afb066ed5b8d0d2959bd343bda4c706b8` |
| `docs/validation/CESIUM_EARTH_PHASE_C_EVIDENCE.md` | excerpts | `d02ffd0bd6070483ce750833e9f0701f4795a9bcd400c077f9e4afd11899f6a8` |
| `docs/validation/EARTH_CAPABILITY_EXPANSION_EVIDENCE.md` | excerpts | `1d5b205e45bf53d2517b1ea223a9d971d4c4934e5a56a8a48780e5424935e810` |
| `docs/validation/EARTH_HD_MAPPING_EVIDENCE.md` | excerpts | `f78edcd73f54b1f073ab364325a39a334e7a05c0a389fd343fc6d974249c6980` |
| `docs/architecture/ARCHITECTURE_OVERVIEW.md` | excerpts | `a162aad95657d84b5cebc06be55432d5d60eaaad05dc0709674a2b0f723b139d` |
| `docs/architecture/ENGINE_SPEC.md` | excerpts | `6d34ba6105f2bb36a856d4fe94be29638e34b3ec613ef335e4e612200f443c1f` |
| `docs/architecture/ENGINE_CATALOG.md` | excerpts | `41c9233df298530db7101c836b70b17b215488777267f7dfab264c62f112d0b9` |
| `docs/architecture/OBJECT_MODEL.md` | excerpts | `4f3554df30166abb154750fe7ce061de8769fb3454d9e002a7a07ea9a08c5082` |
| `docs/architecture/DATA_CONTRACTS.md` | full | `5449411a2f9d1ea92b4b50e58fef9f933f7db6a9a35997f90e17baa5fd0dff63` |
| `docs/architecture/TONIGHT_CONTRACT.md` | full | `63b10129bcd52d5e0571b1381bb52587278d303a294c4b22ba48377fff6fe9b0` |
| `docs/architecture/INGESTION_STRATEGY.md` | excerpts | `b6724bba3b117ee4afe3710053a6b878811799ef1b10c6ac86d32837d9aa85d6` |
| `docs/architecture/STACK_OVERVIEW.md` | excerpts | `602a82eafbd1af36bf0f40d58951a797783adf018d6067206870d7d1bb108b9b` |
| `docs/execution/PROJECT_STATE.md` | excerpts | `dfeb07a1979381ea9ac1036e918d4a1d874b908e5f25d69e8529938c04dd664f` |
| `docs/execution/MASTER_PLAN.md` | excerpts | `51f999da22029144355fbaa521c8655b321e73b52ab40233141f2db415a1f2a0` |
| `docs/features/FEATURE_EXECUTION_MODEL.md` | full | `cb194d45af7fb046482da40a7bd7bf2aa886118d28a10bb1c273de2a3bd328d5` |
| `docs/features/FEATURE_CATALOG.md` | excerpts | `0886c70a0ba5165c8df75f128246ec99166a44b3b9d8581be4e1876b1e268edb` |
| `docs/features/FEATURE_ACCEPTANCE.md` | excerpts | `58cad75048a313d9e9d8981f68ecd9bf4f75992346fa121803c5c44ad73d38f0` |
| `docs/features/FEATURE_TRACKER.md` | excerpts | `89852f0b367707cbb727bd174237d14aee4cc298381d52deee11f32c3992167d` |
| `docs/execution/EARTH_CAPABILITY_PLAN.md` | excerpts | `1931d9c4e9c16f580349ffa39bc75310eab35e35bcb431a23094871a01c8e7aa` |
| `docs/execution/C5_7_EARTH_CORE_RECOVERY_SPEC.md` | excerpts | `c96c04d6f0b054483ba6c181457ca1e15f7a42f30338c6a0c493a8f8312bcaff` |
| `docs/execution/C6_GLOBAL_MAPPING_SPEC.md` | excerpts | `f755498c6500555a7842efbb6fd8dd039edf6de0b6a26a2d99f1d58fe59629f2` |
| `docs/architecture/decisions/0009-owned-earth-feature-reuse.md` | full | `24e9e0b6402cda573cf83e412cb177b99f00626d008c1e152d5a4ecd0dd25c41` |
| `docs/audits/GODS_EYE_CAPABILITY_IMPLEMENTATION_RECONCILIATION_2026-10-05.md` | excerpts | `de2167240a4b4301f64cd19246fe72188c0ddb32ccf9eb53910468b88b7a6962` |
| `docs/audits/GODS_EYE_IMPLEMENTATION_DIVERGENCE_2026-10-05.md` | excerpts | `dcd166902aa4e961401bfb4209057fde374020f320ec9997b7ec0ac0ec4dea98` |
| `docs/design/UNIFIED_WORKSPACE_DESIGN_SPEC.md` | excerpts | `5d048654fd4807c1f47733520cffa6a13eee82197e4e10b8ae09288abeaeab6b` |
| `docs/design/ASTRONOMY_HUB_CINEMATIC_REFERENCE_2026-10-21.md` | excerpts | `8bf8b3bc4a81db22c700bb4ad612129a4b714cdefbc5e7f59883b5ebbd019a4d` |
| `docs/validation/solar-cinematic/README.md` | excerpts | `82ed4c92d94284dee0497068c36d06184c1e95497f1432ac8eff664e87e0706a` |
| `docs/validation/cinematic-acceptance/README.md` | excerpts | `f18e9d2e808500164f039b780b5a97541df678701d80ec503af9f2a9c3ce39f8` |
| `docs/validation/solar-scientific-controls/README.md` | excerpts | `d178c60bd5e38ca9be7ffd5b4b441b011763abb8198dc4788ab5c3904868dc3e` |
| `docs/validation/solar-cinematic-balance/README.md` | excerpts | `04563631b80498ed563d8e1497db7a8171eb825f40524d22d843958167b099c1` |
| `docs/validation/earth-sky-completion/README.md` | excerpts | `fe59c62fee639d3a6234908f0b1e65c04a374030d70a63a42022db40bbbd3a12` |
| `docs/validation/cinematic-glass/README.md` | excerpts | `befb0e9286ec3fadf46a1d0122e61ef45305a9c30b2c26ce76b8302efa462500` |
| `docs/design/adaptive-explorer-r1a/README.md` | excerpts | `4d70f126bc1ed046e71099a391238a0c27e0a4f600a362f81c4fdf53146cb8d6` |
| `docs/ASTRONOMY_HUB_DIAGRAM.md` | excerpts | `e3f49b30fd95f2144f987f2593ce4ed1e2c1296e337074e0988a18bdf53b25bf` |
| `docs/validation/UNIFIED_WORKSPACE_IMPLEMENTATION_EVIDENCE.md` | excerpts | `d5ae9bc77ddcbfd7cb7555c151c89dd091173feba4706d99a27648d0e9b5f9ce` |
| `docs/validation/C5_7_D_EARTH_APPEARANCE_EVIDENCE.md` | excerpts | `a4d9eeb0875bdc754182e777ceb3583fbad577fcd3cdddd172c79da28ebb55a1` |
| `docs/validation/LOCAL_DEVELOPMENT_REPAIR_EVIDENCE.md` | excerpts | `51c5f7cca44ce1d415d2e5487d92653a413aefea15d8785453588da303a998b0` |
| `docs/audits/EARTH_CAPABILITY_RECONCILIATION_INPUT_2026-10-05.md` | excerpts | `41a443d02b23c3f4452277f2a5defb51c40422e56c5e898db79444d027b3e8d6` |
| `docs/audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md` | excerpts | `459311f7d3ab0f8e84ef6ff264889b0866ab3ba78bd70234a5ef305aadc7c53a` |
| `docs/audits/GODS_EYE_PUBLIC_EXPORT_AUDIT_2026-10-05.md` | excerpts | `ff2a15587c46fd7c717d6e01e959e1f373b5dde9ea6714f41c5e762dff3a8f99` |
| `docs/audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md` | excerpts | `928d105a5a17b07b63a6d9a62a8d23cd5c567d924f04d150e06761155fba20bc` |
| `docs/audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md` | excerpts | `e450148005e82990d9827355dbee00a5404494ccf41b276761710c68fd2c60a7` |
| `docs/validation/C5_6_75_DOCUMENTATION_RECONCILIATION_EVIDENCE.md` | excerpts | `32d32448f86f64c34de181496ac9f962997bc088ce5592257fe16c21d59913b0` |
| `docs/audits/GODS_EYE_MASTER_ADOPTION_BLUEPRINT_2026-10-10.md` | excerpts | `adb795e9f39727d6058e42ceefe17e167dcb66a9588abd09d1b7428560268d1f` |
| `docs/audits/EXTERNAL_COMPONENTS_AND_DATA_GAPS_2026-10-10.md` | excerpts | `57bfae11ec71c6520abb19d5463267be4fb5b30066e302b5b29f68f3c3d8d169` |
| `docs/audits/EARTH_VISUAL_FOUNDATION_DECISION_PACKET_2026-10-10.md` | excerpts | `7fd57268a5158e7fe71d7b2148cdd654e8eed582c206a7d0353d4107836dc8e8` |
| `docs/audits/GODS_EYE_ROADMAP_REPRIORITIZATION_PROPOSAL_2026-10-10.md` | excerpts | `9fefd707b0e797b6958ec148b384d6e2e5414da8f7472813ab0eb011a900ca1d` |
| `docs/audits/MASTER_ADOPTION_AUDIT_VALIDATION_2026-10-10.md` | excerpts | `08aa5732cbe257ed16097c42622678ebe161ddaf52c04e2cba05b7339e0a0aa9` |
| `docs/runtime/FAILURE_PATTERNS.md` | full | `b7886f5f9ab0c8f4b5a513ceb8505c5cededc87d2537fdd80fbda5a70ec09093` |

## Additional direct evidence

- `docs/context/CONTEXT_MANIFEST.yaml` — manifest parsed for exact pack paths; partially displayed; SHA256 `48942816d8f49c3aa7442f906adc007806479fc223a7da6a9cfe67ddd75e24fc`. Context loading authority.
- `docs/validation/satellite-visual-pilot/COMMANDS.md` — full; SHA256 `3637fc7b4a3d1f495b6bf68d27f7e886562098e42cfe3748cde434016fefbab6`. Direct linked command or precision evidence required by current satellite README.
- `docs/validation/sky-satellite-live/COMMANDS.md` — full; SHA256 `901bee73dcbbc4c531dc5c790614cde63d228ea6d5823c81ae7ae2b6b0466893`. Direct linked command or precision evidence required by current satellite README.
- `docs/validation/satellite-visual-pilot/evidence/independent-motion/REPORT.md` — full; SHA256 `1f7c83f6a4d83f7247792299bc013540dd25e2c60ff82d29172aae0d341130aa`. Direct linked command or precision evidence required by current satellite README.

Recommended next task: finish the bounded observing/clock contract and evidence plan against the preserved PR102 head, then implement and qualify only that scope; keep refresh-source proposal independently reviewable.
