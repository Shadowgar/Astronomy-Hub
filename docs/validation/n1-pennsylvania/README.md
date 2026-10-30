# PR #75 — illustrative Pennsylvania landscape correction

Branch `n1-sky-earth-navigation-1`; existing PR #75 → #74 → #73 stays OPEN/UNMERGED.
Default Mode, single agent. [Loaded documents](loaded-documents.txt) match the
frontend/docs/validation/review context packs and explicitly relevant prior evidence;
no broad docs scan or extra project documents. [Execution plan](plan.md).

The owner rejects the prior plain black circle and authorizes a natural rural
northwestern Pennsylvania woodland panorama. Accepted scrolling at `301f9eb3` is
preserved exactly. **Owner visual acceptance and final N1 acceptance remain pending.**
Preview: <http://127.0.0.1:4202/sky-engine>. No merge, production deployment or R2.

## Native format and implementation

Desktop Stellarium supports a single equirectangular spherical landscape with
transparent sky ([upstream LandscapeSpherical API](https://stellarium.org/doc/head/classLandscapeSpherical.html),
[landscape guide](https://stellarium.org/guide/)). This is format guidance, not an
assumption that desktop `landscape.ini` is accepted by the web runtime.
The pinned SWE implementation at `023e3b26babf7ffddf45f39293230b14cfe96993` is authority:
[`src/modules/landscape.c`](https://github.com/Stellarium/stellarium-web-engine/blob/023e3b26babf7ffddf45f39293230b14cfe96993/src/modules/landscape.c)
creates a hemisphere circle only for key `zero`; other keys create a native
observed-frame HiPS landscape. Native activation deactivates other landscapes,
with existing faders, visibility, fog and sunlight/moonlight brightness behavior.
[`src/hips.c`](https://github.com/Stellarium/stellarium-web-engine/blob/023e3b26babf7ffddf45f39293230b14cfe96993/src/hips.c)
uses PNG transparency and HEALPix NESTED tiles. This is the safe existing path;
no new native renderer modification or WASM rebuild is used.

Original source artwork and prompt provenance live at
[`runtimes/sky-adapter/assets/pennsylvania-woodland-v1/`](../../../runtimes/sky-adapter/assets/pennsylvania-woodland-v1/README.md). Built-in image generation
created the original; a targeted edit requested an opaque matte and seamless join.
The selected 1774×887 RGBA source is unchanged. Native-format encoding normalizes
its near-opaque alpha 250..255 to 255 and preserves partial tree-edge coverage.
The original helper resamples illustration pixels with the pinned source's
unmodified HEALPix geometry; it never creates scientific data. Twelve local
512px order-zero tiles and a 3×4 Allsky atlas provide a bounded 3.83 MB runtime
asset, separate from mounted astronomy skydata. No paid assets, external provider,
new dependency or production catalog entry is added.

The contained adapter replaces embedded `zero` selection and charcoal property
writes with one native local panorama registration/selection. Standalone remains
native; its original Guéreins assets are preserved. The visible label and asset
description say **illustrative Pennsylvania, not surveyed**. Artistic ridge heights
are decorative pixels, never scientific horizon measurements. Observer/time,
scientific math, wheel/scroll controllers, bridge and renderer lifecycle are unchanged.
The existing qualified native zero-color hook remains as historical binary
provenance, but this adapter no longer uses it. The zero circle is not active
beneath the panorama.

## Qualification

[Visual proof](visual/proof.json) passes desktop 1440×900 and mobile/touch
390×844: native yaw 0/90/180/270/359/0/1/360, day/night, Landscape ON/OFF,
Atmosphere ON/OFF, Night Mode ON/OFF, embedded policy release/reentry and fresh
standalone Guéreins. Both runs have zero JavaScript page errors and zero failed
landscape requests. All 15 served native landscape files return HTTP 200 and match
manifest hashes. No zero landscape exists/activates in these embedded instances;
textured daytime framebuffer crops contain 100+ distinct colors. Reviewed compass
and seam screenshots show wooded ridges with no obvious vertical seam or original
flat circle. Naturalness is a visual judgment reserved for the owner.

[Desktop day](visual/day-yaw-180-1440.png),
[desktop night](visual/night-yaw-0-1440.png),
[mobile day](visual/day-yaw-180-390.png),
[mobile night](visual/night-yaw-0-390.png),
[landscape OFF](visual/day-landscape-off-1440.png),
[seam 359 degrees](visual/day-yaw-359-1440.png),
[standalone](visual/standalone-guereins-390.png).

The focused adapter suite passes **3/3**, full runtime/Earth **133/133**, frontend
**241/241** across 32 files. Typecheck and Hub build pass. Two offline Sky UI builds
produce **110 identical payload files**; the identity marker makes 111 served files.
Two independent asset packaging runs reproduce **16 identical manifest/HiPS files**.
[Desktop journey proof](journeys-desktop/proof.json) and
[mobile journey proof](journeys-mobile/proof.json) pass **22 + 22 journey groups**:
ordinary/deliberate wheel, trackpad, native touch drag, ORAS/New York round trips,
reversal, repeated handoffs, loading cancellation, Back/Forward, Escape, persistent
Night Mode, fixed/live time and single-renderer disposal. Both have zero page errors
and peak one connected renderer. Every captured source hash matches final sources.
[Qualification summary](qualification.json).

[Resource limitations](resource-limitations.json) retain 639 desktop / 821 mobile
request failures/cancellations from astronomy data, existing map providers and
intentional navigation interruption. Native HiPS iterator warnings also occur.
These classes are present in historical pre-change evidence; that comparison is
not a fresh baseline run or proof of each failure's cause. No new landscape URL
fails. This bounded correction does not qualify those existing providers/data. Chromium software rendering and emulated mobile input do not
constitute physical-device or owner visual acceptance.

## Separate outstanding review findings

The three currently open P2s are reproduced and left open without production navigation changes:

- [Earth snapshot side effects](https://github.com/Shadowgar/Astronomy-Hub/pull/75#discussion_r4280215701):
  actual production bridge/controller in the existing geometric host fixture stops
  tracking and calls cancelFlight on `getNavigationState`; `resetNavigation` does
  not restore tracking. The fixture supplies the read-only navigation return to
  isolate the mutation. This is host-model proof, not physical/browser tracking proof.
- [Elevation provenance](https://github.com/Shadowgar/Astronomy-Hub/pull/75#discussion_r4280215709):
  real Chromium Sky → Earth at Central Park coordinates and 123 m accepts URL
  `elevationSource=oras-site`, despite native Sky reporting `provided`. A second
  `unavailable-zero` case retains 123 m and that label in both native Sky and Earth.
  The latter also implicates existing upstream URL interpretation in the adapter;
  it is not solely a Hub handoff issue.

- [Native attester source override](https://github.com/Shadowgar/Astronomy-Hub/pull/75#discussion_r4280522720):
  the actual attester ignores `ORAS_SKY_SOURCE_REPO` and requests `git archive`
  against its hardcoded default. A controlled git shim records that command then
  aborts before building; real git verifies the alternate path contains the pin.
  The alternate path is a symlink to the same checkout, so this proves ignored
  routing, not differing native bytes. No native rebuild is run for this audit.

Recommended separate follow-up: make snapshots nonmutating or defer interruption
until committed departure; validate elevation provenance against observer/elevation
rather than an enum alone; pass the configured source repository into attestation. This correction does not resolve those P2s and makes no
full-PR readiness claim. Stop for owner visual acceptance of this scenery first.


## Source identities and preservation

| Item | SHA-256 |
| --- | --- |
| Original selected panorama | `3c9582921ad8e774b321cc41b7d65ed7efdaaaa377e2214269fa6205c5f7c6d4` |
| New Sky application artifact | `ee789ec45b306b82aea465c4274ae0a1dcb5968ca3842d81acf1b1ab6b82068a` |
| Native WASM, unchanged | `d62afde16d3695adc1f33401a51fa715cfa7618e8a5a1b82f5cbbd40f1fad942` |
| Earth artifact, unchanged | `2f2c8530cd8499ef3c646b244d37c9a5ae8574047cabcdc751976e4908234794` |

[Preservation proof](preservation.json) verifies all 96 prior Sky files in the new
matching rollback, all 111 current files, unchanged Earth admission, native WASM,
original upstream landscape source, read-only Docker mounts, accepted navigation
source and the owner's VS Code settings. No frontend source, Earth runtime,
protocol, wheel controller or existing native patch changes. Mounted skydata is
unchanged by this task's actions and remains read-only. No astronomy catalog or
scientific data changes. Existing older rollbacks are retained.

Matching pre-change Sky/Hub/admission copies remain in local ignored
`output/n1/pennsylvania/rollback`; historical rollback directories remain intact.
The archived prior lock lists the exact application payload to restore together
with the matching runtime metadata and Hub dist. Do not restore only the lock or
only one generated chunk. This is a local preview rollback, not deployment authority.

[Attempts and limits](attempts-and-limits.md) retain failed tests, alpha checks,
initial source art, the corrected browser assumption and interrupted journeys.
The historical pre-change native-build attestation describes its own source
closure; it is not presented as a fresh native rebuild of this UI-only correction.


## Changed files and execution record

[Exact changed paths](changed-files.txt) includes the adapter, source artwork,
HiPS files/manifest/provenance, format encoder and checked integration copy,
generated Sky application files, admission metadata, focused adapter regression,
visual/navigation verification drivers, authority updates and this evidence.
[Exact commands](commands.txt) and raw logs record build/test/verification outputs.
The navigation driver's only behavioral expectation change is the selected
landscape ID; camera/input timing, thresholds and every journey remain intact.
The `.gitattributes` addition preserves raw captured diagnostics only.

Browser evidence captures the pre-commit HEAD together with exact hashes of the
new working-tree sources and admission metadata. Delivery verification compares
those hashes against committed sources and the actually served bytes. A post-commit
identity record is retained at `output/n1/pennsylvania/served-identity.json` locally.
The final owner handoff records commit and push status. No visual acceptance is
inferred from test success. Recommended next task: owner visual acceptance of this
landscape, with separate bounded P2 work still outstanding before full PR readiness.
