# PR #75 — native neutral-horizon correction

Branch: `n1-sky-earth-navigation-1`, continuing PR #75 → #74 → #73.
Default Mode, single agent; [loaded-document ledger](loaded-documents.txt) lists
CORE/LIVE and manifest frontend/docs/validation/review packs plus the explicitly
requested prior investigation. No extra project documents or broad docs scan.
The October 15 owner directive authorizes this sole native-artifact exception.

Scrolling at `301f9eb3ddfd21a22ad04378bf09ee45c59e8adc` is **OWNER ACCEPTED**
and unchanged. Native dark-horizon implementation is **TECHNICALLY QUALIFIED**.
Appearance is **PENDING OWNER VISUAL ACCEPTANCE**; entire N1 is **NOT YET FINALIZED**.
PR #75 stays **OPEN/UNMERGED**. No merge/deployment/R2/N2/R3; no new dependency,
provider, astronomy data or spending. Preview: <http://127.0.0.1:4202/sky-engine>.

## Exact implementation and safety

The sole native modification is the downstream patch
`integrations/sky-patches/0001-configurable-zero-horizon.patch`, applied with
`--fuzz=0` to a fresh archive of unchanged SWE pin
`023e3b26babf7ffddf45f39293230b14cfe96993`. The original vendored source and
existing build-source checkout remain unchanged. No upstream upgrade or silent
baseline edit. The patch changes only `src/modules/landscape.c`:

- Adds `horizon_color` and `horizon_border_color` native RGBA properties.
- Initializes them to the original green fill `[0.1,0.15,0.1,1]` and border
  `[0.2,0.4,0.1,1]`; standalone defaults therefore remain native.
- Creation uses these values for the existing observed-frame hemisphere circle.
- A property-change callback updates that same circle's fill/border only if the
  shape exists. Panoramas have no such shape and are unaffected.

No shape allocation/replacement, owner/lifetime change, coordinate calculation,
projection, horizon clipping/occlusion, atmosphere, stars, selection, scientific
calculation, native fog/visibility fader or panorama asset is changed. Added RGBA
arrays are owned inline by the existing landscape object. Geometry/frame/size and
all rendering/visibility logic remain the pinned source's implementation.

The contained Sky adapter requests fill `[0.035,0.04,0.05,1]` and subtle border
`[0.10,0.12,0.14,1]` only during embedded neutral presentation. On release it
restores captured native zero colors even if a native landscape change arrives
before its watcher. Only the native configuration properties are set; no CSS
scene filter, overlay, scene-wide shader, invented panorama or terrain substitute.

`build_sky_horizon.sh` uses the pinned existing native Docker image, pinned
Node20 image and existing read-only npm dependencies, with Docker networking OFF.
`attest_sky_horizon.py` reconstructs expected native/frontend source from the pin,
hashed existing overlay and this one patch, rejecting unexpected compilation
units or source files. It verifies 546 inputs, the native JS/WASM and all generated
frontend files. The UI promotion script keeps its normal native-identity guard;
this exception requires the exact fresh build attestation, reverified before any
promotion. Current metadata identifies the changed binary and retains historical
baseline reconstruction proof separately.

## Source/artifact identities and reproducibility

[Full build attestation](native-horizon-attestation.json) records every source and
frontend-file hash. [Independent build comparison](reproduction.json) verifies a
second fresh complete offline build produced identical native JS/WASM and all
95 frontend payload files. No dependencies were downloaded. [Build commands](commands.txt).

| Identity | SHA-256 |
| --- | --- |
| Downstream C patch | `92711949ebf6cbc8db0853586c85a8b7f4197a622e24c4dd0c47da517d47fd35` |
| Patched landscape source | `fe67ef1bbf919fbc77523a96f6d276bae63cfb4013b468b9777b9d434ba43fa9` |
| Source input closure | `5158a4a499e74d9096c8f323bf96a41f7bc0a61864f9e26c64f8180e372956d6` |
| Native generated JS | `0310d4b3cb55a4b26713071269cb6032a169fbdf9435f8c7cf4a4a02716a9eb7` |
| Native WASM | `d62afde16d3695adc1f33401a51fa715cfa7618e8a5a1b82f5cbbd40f1fad942` |
| Final Sky artifact | `98263fecda9ed4a3b2daad74d72b142d36bb2aab97232084485e3ca14b366d45` |
| Earth artifact, unchanged | `2f2c8530cd8499ef3c646b244d37c9a5ae8574047cabcdc751976e4908234794` |

## Real visual/native evidence

[Before](before/before-green-1440.png), [after, Night Mode OFF](visual/night-off-1440.png),
[mobile, Night Mode OFF](visual/night-off-390.png). These are actual Docker-served native
runtime captures, not mock images or CSS replacements. [Pixel comparison](before-after-pixels.json)
records the ground change from `[26,38,26,255]` to `[9,10,13,255]` and native
Landscape OFF revealing bright pixels below the true horizon.

[Source-bound visual matrix](visual/proof.json) verifies desktop 1440×900 and
mobile/touch 390×844: native Landscape ON/OFF, Atmosphere ON/OFF, Night ON/OFF,
ORAS at nighttime/daytime, Sydney at daytime, standalone Guéreins and original
native zero colors, embedded release/reentry and the demonstrated release-order
regression. Zero JavaScript page errors. The native color-only comparison keeps
all **184 desktop / 42 mobile bright-star pixels** in the sampled above-horizon
region identical while changing the horizon. Opaque ground contains no bright-star
pixels in its sampled below-horizon region. Native Landscape OFF exposes them.
This sampling supports the unchanged geometry/occlusion source; it is not a
catalog-wide visibility or astronomical scientific-validation claim.

An initial comparison used an early after-capture with zero sampled bright pixels
and failed; it is retained without a causal claim. The later visible-star capture
matches **175/175** baseline bright pixels in its sampled region. Controlled
same-runtime color-only comparisons are separate evidence. See [attempts/limits](attempts-and-limits.md).

## Preservation, rollback and review boundary

[Preservation](preservation.json) verifies original upstream source hash, source pin,
owner settings, unchanged accepted camera/protocol/Hub source, all 96 prior Sky
files, all 96 current Sky files, all 512 earlier Earth rollback files and unchanged
read-only preview/data mounts. No astronomy data or Docker volume mutation.
[Rollback identity](rollback.json) records the matched prior Sky/Hub/admission set:
`output/n1/sky-before-native-horizon`, `output/n1/hub-before-native-horizon`, plus
saved lock/runtime-version metadata. Earlier rollback artifacts remain intact;
PR #74 fallback stays <http://127.0.0.1:4201/sky-engine>. Restore matched source,
Sky/Hub artifacts and admission metadata together if rollback is required.

The previously reported P2 identity finding was already resolved with focused
regression evidence in the prior investigation. This correction makes no URL,
selection, handoff, threshold, damping, wheel accumulation or camera changes.
No merge/deployment authorized. Recommended next task: owner visual review of the
charcoal horizon at the preview URL; keep the full N1 acceptance decision open.

## Final verification and delivery

| Check | Result |
| --- | --- |
| Runtime/protocol/Earth | **134 passed, 0 failed** ([output](runtime-tests-final.txt)) |
| Frontend | **241 passed in 32 files** ([output](frontend-tests-final.txt)) |
| Typecheck | **exit 0** ([output](typecheck-final.txt)) |
| Complete offline fresh native + UI build | **PASS**, reproduced all payload bytes ([output](reproduction-build.txt)) |
| Hub build with new locked Sky | **exit 0** ([output](hub-build-final.txt)) |
| Native desktop/mobile visual matrix | **PASS**, zero page errors ([proof](visual/proof.json)) |
| Accepted wheel/return/lifecycle journeys | **22 desktop + 22 mobile groups PASS**, zero page errors, peak renderer count 1 ([proof](journeys/proof.json), [output](journeys-run.txt)) |
| Exact served JS/admission | **PASS** ([identity](served-identity.json), [output](served-verify.txt)) |
| Exact served native WASM | **PASS**, 1,200,963 bytes / HTTP 200 / no-store ([identity](served-native-wasm.json)) |
| Unchanged Earth artifact | **PASS** ([output](earth-verify.txt)) |
| Authority/link validation | **PASS** ([output](architecture-docs.txt)) |

The final journey exercises genuine wheel/trackpad inputs, native drag, another
observer, inward/outward safeguards, round trips/reversals, Back/Forward, Escape,
loading and snapshot interruption, live/fixed time, native controls and serial
renderer ownership. Source inputs stayed unchanged during each final browser run.
No camera calibration or navigation changes. Emulated/software browser evidence
is distinct from physical-device or owner visual acceptance.

All existing data/HiPS/provider failures remain documented in
[browser limits](browser-limits.json) and the raw proofs; zero page errors does not
mean every external request succeeded. Review and failed-attempt details are kept
in [attempts/limits](attempts-and-limits.md). [Exact changed files](files-changed.txt)
include only this patch, contained style adapter, generated native/UI artifacts,
attestation/validation tools, tests and scoped acceptance/evidence records.
STOP for owner visual review. PR #75 remains open/unmerged; do not begin R2/N2/R3.

## New outstanding PR review comments

The final read found two new P2 comments against the prior head `f9a56194`:
[Earth navigation snapshot side effects](https://github.com/Shadowgar/Astronomy-Hub/pull/75#discussion_r4280215701)
and [elevation provenance override](https://github.com/Shadowgar/Astronomy-Hub/pull/75#discussion_r4280215709).
Both remain OPEN. They concern existing navigation/source state, which this sole
native-horizon correction preserves. They were not implemented or independently
reproduced here. [Current review snapshot](review-state-before-push.json).
The earlier stale-identity P2 remains resolved. No full PR readiness claim is made;
assess these comments in a separate bounded follow-up before final N1 acceptance.
The requested next step remains owner visual review of the dark horizon.
