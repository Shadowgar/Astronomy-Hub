# R2 Earth UX and visual performance — owner review candidate

Branch `r2-earth-ux-performance-1`, stacked on draft PR79 at
`158a77053ea18e4d0aed8725f715ca373930fd13`. The directive'se5239e01 was an older
head; current PR79's final search evidence was preserved. No merge/deployment/R3.
Owner preview: **http://127.0.0.1:4206/earth**. Recorded-source qualification
preview4207 is separate;4206 uses the normal backend/provider path.

Default Mode context: [61-document ledger](context.json) and
[loaded document list](loaded-documents.txt), matching frontend/backend/docs,
validation/review/planning packs and explicitly requested R2 evidence. No broad
extra documentation scan. Current code and source/served identities were checked;
prior session memory did not determine the active branch/task.

## Delivered behavior

- Search Earth is immediately visible on desktop/mobile, outside Explore and
  outside a dialog. Enter/button submits; typing makes no provider requests.
  Results/context are compact, nonmodal, dismissible and reopen without losing
  query, rows or selected-place context. Selected place remains identified as the
  last searched location; panning does not mislabel it as the current camera.
- Existing genuine city/place/address/ambiguity results and independent coordinate
  parsing feed the existing native Cesium flight, acknowledgment, history/reload,
  observer/time and Sky-return contracts. Errors/no results remain explicit.
  Pending location flights block cross-mode entry through the shared header.
- Globe fills the viewport under restrained Earth-only branding/search, admitted
  regional labels, native smooth zoom controls, ORAS return and source context.
  Zoom buttons delegate to the accepted controller through an optional negotiated
  capability. Regional labels use Cesium's native terrain-level bound; no giant
  raster labels at street scale. Standalone labels remain opt-in.
- Only the measured post-settlement250ms application timer was removed. Native
  imagery scheduling/render loop/source caps/cache ownership remain intact.
  [Full before/after report](PERFORMANCE.md) separates decoded/ready textures,
  screenshot geography, network/transfer, worker/cache, refinement and idle.

## Actual browser qualification

Final delivery bytes: **desktop19/19 and emulated mobile19/19 PASS**, each with
six exact recorded-source result/native camera acknowledgments. Genuine R2-A
recording identity is checked through the real test-isolated FastAPI routes;
there is no browser response interception or invented production location.
[Proof](evidence/direct-search-proof.json), [console](evidence/direct-browser.txt).
Tests cover immediate search; no keystroke request; Enter submission; ambiguity,
place/address/coordinates/zero; invalid/no-result/unavailable/busy cases; explicit
recovery; drag/wheel/touch and zoom anchoring; dismiss/reopen; Back/Forward/reload;
source panel; active cache worker; reduced-motion mobile; actual Sky return/time/
observer/Pennsylvania panorama; one active renderer; manual Explore coordinates.

Independent review identified a mobile overlay stacking P2. Actual Sources Close
at x337/y205 was intercepted; an adjacent Tonight control was also intercepted.
Both have retained browser RED evidence. Search now yields to contextual mobile
sheets, and map controls use a touch-safe row above the existing launchers.
[Focused final GREEN](evidence/mobile-panels-green.json),
[sheet RED](evidence/mobile-panels-red.json),
[context RED](evidence/mobile-context-red.json). Final full journeys reran after
both corrections. Query/results recover after opening/closing Sources.

Separate **one live Photon smoke PASS**: normal backend returned200 and five
genuine Springfield candidates; observed browser round trip12,995ms. Coordinate
recovery passed without another provider request. [Live receipt](evidence/live-proof.json).
This ran on initial native60e97121 before the label-scale/UI-only spacing changes;
backend, parser, EarthSearch and navigation source hashes remain exact matches.
It is retained source-matched evidence, not relabeled as a final-artifact fresh
live pass. This is availability of one request, not a reliability guarantee or
an independently measured upstream HTTP timing/status.

Historical R2-B503 classification remains in
[the prior report](../r2-b-earth-imagery-cache/final-search/README.md): server-side
response-header ReadTimeout normalized by the application, cached errors and
admission distinguished, no assumption Photon itself returned503. It was not
reinvestigated. Historical N1 full navigation5/22 desktop and7/22 mobile at240s,
cause unknown, remains OWNER ACCEPTED and was not rerun or called44/44.

## Tests, artifacts and preservation

- Host runtime/Earth **231/231 PASS**; pinned Docker Earth **143/143 PASS**.
  Initial all-Earth Docker run142PASS/1FAIL was a known harness dependency:
  Node image lacks Python for export-manifest test. That test passes in the
  complete host suite; no new package/image dependency was installed.
- Frontend **293/293 PASS in42 files**; TypeScript PASS.
- Docker backend **52/52 PASS**,13 existing dependency deprecation warnings.
  Backend production code is unchanged.
- Native Earth independently built twice: **cb1f579d3f7625ad776d6182740da581c152c3a79684b4f2520477672eb12c3e**,
  513 files/51 source inputs, pinned Cesium1.138.0/upstreame7707d9a/toolchain digest.
- Hub independently built twice: **2db5ec097d9b97fd97cf8456cbabbeb31eb010910378023f8cbe37acccb77bcb**,
  130 files. [Build identity](evidence/reproducible-final-builds.json).
  Existing native dynamic-import/chunk-size notices remain visible in logs.
- Live and recorded previews serve every exact native/Hub file. Delivery verifier
  checks committed native/Hub source, served bytes, source pins, protected code,
  all Sky artifact bytes, original R2-B/N1 rollback bytes, owner settings, original
  107 container identities/mounts/states and90 volumes. No original state drift
  was observed. Scientific data/source code, read-only mounts, source pins,
  dependencies, accepted CameraController/Sky/landscape/satellite assets,
  search backend/contracts, cache policy/store and owner settings are unchanged.
  [Source/preservation receipt](evidence/delivery-source.json) is bound to its
  recorded commit; final exact-head recheck is published in the PR conversation
  and owner-local `/evidence/r2-earth-ux/delivery.json`.

[Exact commands/results](COMMANDS.md), [exact changed paths](FILES_CHANGED.txt),
[performance measurements](PERFORMANCE.md). Evidence refers to its recorded source
and artifact identities; prior successful browser tests were not called fresh.

## Review and remaining limits

Independent initial review atf24c1650 found the reproduced P2 above and no other
P1/P2. Its correction and final exact-head delta review are recorded in the draft
PR conversation after the final commit. GitHub owner review/visual acceptance
remain pending; no merge approval or production readiness is implied.

Global EOX imagery is older10m data; NASA/Natural Earth are coarse. NAIP may be
partial/unavailable. Narrow PEMA preview has unresolved broader redistribution
rights and remains local-only/nonpersistent. Native idle/texture readiness never
proves complete or sharp imagery. Matrix caches follow a shared traversal rather
than independent per-location flushes; one run per phase, software Chromium only.
Exact decode CPU and underlying causes of generic browser imagery failures remain
unknown. Scientific terrain/elevation and physical-device performance are not
qualified. No Google/new/paid provider, account, dependency, spending or bulk data.

Stop for owner review of the preview. The next task is the owner's UX/visual
acceptance decision, followed only by separately authorized imagery/rights work.
R3 and production deployment remain out of scope; original PR chain is preserved.
