# PR #75 — neutral horizon investigation and owner acceptance record

The owner accepts scrolling at `301f9eb3ddfd21a22ad04378bf09ee45c59e8adc`:
"I approve the scrolling now." Accepted navigation remains unchanged.
Dark charcoal ground is approved for implementation, but **BLOCKED at the
protected native-artifact boundary**. No dark correction has been implemented.
Dark horizon visual verification remains pending; the entire N1 package is not
finalized. PR #75 remains open/unmerged, depending on #74 → #73.

Preview: <http://127.0.0.1:4202/sky-engine>. It still shows green native ground.
No merge, deploy, R2, N2, R3, providers/dependencies or spending. Default Mode,
single agent; [loaded-document ledger](loaded-documents.txt) records the exact
frontend/docs/validation/review packs. No extra project documents or broad scan.

## Root cause and explicit stop gate

Inspected the adapter `runtimes/sky-adapter/plugin.js` and pinned native
`src/modules/landscape.c`, `src/modules/circle.c`, `src/js/obj.js`, `src/module.c`
and `src/obj.c`. The full native sources in the owner checkout and the existing
build tree match byte for byte ([source hashes](native-source-identity.json)).
Build source pin: `023e3b26babf7ffddf45f39293230b14cfe96993`.

The adapter selects the native `zero` landscape only in embedded presentation.
Native `add_from_uri()` creates an anonymous observed-frame hemisphere circle,
with fill `[0.1,0.15,0.1,1]` and border `[0.2,0.4,0.1,1]` hardcoded in C.
The landscape exposes `color`, but `landscape_render()` never applies it to that
circle. The circle has no identifier: public child properties and tree traversal
skip it. `listObjs()` returns no objects because this landscape is not listable.
The public native configuration therefore cannot style the existing ground.

In the actual Docker-served application, a temporary public-property probe changes
`current.color` to `[0.02,0.02,0.02,1]`, then restores `[1,1,1,1]` before closing.
The green ground remains unchanged: **0 of 200,000 sampled ground pixels differ**.
Observer/time/projection/camera/visibility remain identical; zero page errors.
[Before screenshot](green-before.png), [ineffective color probe](public-color-no-effect.png),
[public API evidence](native-api-investigation.json), [pixel comparison](pixel-comparison.json).
These are blocker evidence, not a successful dark-ground before/after pair.

The owner explicitly requires stopping if a safe correction needs a protected
native rendering artifact change. That condition is met. No native source/binary,
geometry, CSS scene filter, overlay, panorama, star/atmosphere rendering, projection
or adapter behavior was changed. No incorrect local logic was removed/replaced.
The next implementation needs a separately authorized minimal native hook that
configures the existing zero circle's fill/border while preserving standalone
defaults, followed by a controlled native rebuild and full browser qualification.
No speculative patch or memory-layout workaround has been applied.

## P2 review and qualification

The reported stale Sky identity finding is assessed against the complete call
chain: `handoffPath('earth', ...)` calls `workspaceModePath('earth', ...)`, which
already deletes `catalog`, `source_id`, `model`, `ra`, `dec` and `fov`.
Production changes would duplicate the existing behavior. Two focused regressions
in `frontend/tests/viewNavigation.test.ts` exercise all five identity fields,
large Gaia string IDs, null/current selection, observer/time preservation and
fresh-state `ingestSearch()` of the resulting Earth URL. Neither URL can introduce
stale identity. Existing reverse-Sky string-identity coverage remains in place.
This does not claim Earth must erase intentionally retained session selection.

Focused command: `npm --prefix frontend test -- tests/viewNavigation.test.ts tests/workspaceNavigation.test.ts tests/runtimeProductState.test.ts`:
**15 tests passed in 3 files**, exit 0. Full frontend: **241 passed in 32 files**.
Runtime/Earth: **132 passed, 0 failed**. Typecheck: exit 0.
[Evidence reply in the actual P2 thread](https://github.com/Shadowgar/Astronomy-Hub/pull/75#discussion_r4280122131)
was posted before [resolving the thread](p2-resolved.json), under explicit owner
authorization. [Fresh review-thread snapshot](review-state.json): all 3 threads resolved, with
no unresolved applicable P1/P2. This does not establish review readiness for the
blocked visual requirement.

Fresh supporting checks: [frontend tests](frontend-tests.txt),
[runtime/Earth tests](runtime-tests.txt), [typecheck](typecheck.txt),
[separate Hub build](hub-build.txt), [exact rebuilt/served comparison](hub-rebuild-comparison.json),
[Earth artifact verification](artifact-verify.txt) and [documentation checks](architecture-docs.txt).
[Served identity](served-identity.json) checks Hub/Sky/Earth entries and admission
metadata against unchanged artifacts. [Preservation](preservation.json) verifies
96 locked Sky files, all 512 prior Earth rollback files, owner settings, protected
runtime source and [read-only preview mounts](preview-mounts.json).
[Exact commands](commands.txt); [attempts and limits](attempts-and-limits.md).

## Delivery limits

No native/Hub rebuild or preview replacement is appropriate while implementation
is stopped: no runtime source changed. Existing Sky/Earth artifacts, admission
metadata and accepted served JavaScript are checked directly. A successful dark
horizon matrix (Landscape ON/OFF, Night ON/OFF, desktop/mobile, another location,
standalone, day/night and above-horizon occlusion) cannot be qualified until the
native gate is resolved. The current probe only tests ORAS desktop at fixed time.
Full backend/provider and astronomy deep-link suites were not rerun for this
non-runtime investigation.
The existing navigation suite separately retests the unchanged accepted behavior.

Recommended next task: authorize the bounded native styling hook/rebuild exception,
then implement and browser-qualify dark ground and stop for owner visual approval.

## Exact change scope

[Files changed](files-changed.txt) contains only acceptance/control records,
the focused URL regression, the reproducible public API investigation driver,
and captured evidence. All runtime/renderer/admission source paths are unchanged
from the accepted application. The existing branch is
`n1-sky-earth-navigation-1`; PR #75 remains the delivery PR.

## Final unchanged-navigation browser retest

**PASS: 22 desktop + 22 mobile/touch journey groups**, zero JavaScript page
errors, one connected renderer at a time. [Raw source-bound proof](journeys/proof.json)
and [exact journey output](journeys-run.txt) exercise the real Docker-served
application: native Landscape ON/OFF, Sky-only Night ON/OFF and persistence,
wheel/trackpad outward handoff, native Earth drag, another observer (Central Park),
surface arrival safeguards, deliberate inward entry, repeated reversals/round trips,
Back/Forward, loading/snapshot cancellation, Escape and live time. All accepted
runtime inputs remain unchanged from `301f9eb3`; no sensitivity or timing adjustment.
This qualifies current navigation, not the blocked dark-horizon appearance.
Screenshots from the full journeys remain locally served at
<http://127.0.0.1:4202/evidence/horizon/journeys/>.

The navigation pass does not mean resource-complete rendering: native HiPS iterator
warnings, missing dense-star tile HTTP 404s and navigation-aborted resource requests
remain in the raw trace. [Exact warning/failure counts](browser-limits.json) separate
them from zero page errors. The earlier same-artifact motion proof also records
resource failures/warnings. Data completeness and providers were not repaired or
newly qualified here.
