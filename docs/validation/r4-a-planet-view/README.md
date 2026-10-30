# R4-A — source-qualified Moon globe

Working bounded R4-A **draft review candidate**. Full R4, terrain, warning-clean
Docker verification, owner visual acceptance and physical-device qualification
remain incomplete. Do not merge or deploy.

Owner direction on 2026-10-23 authorizes this slice from PR91
`2080ed5130c501a7ac286fb862e99d5c9dc6cb30`. Branch `r4-a-planet-view-1`, stacked
on `cinematic-glass-1`. PR91 remains open/draft at that exact base. No existing PR
is modified or merged; no paid provider, dependency addition, data reset or X work.

Default Mode loaded CORE/LIVE, then manifest backend/frontend/planning/validation/
review/docs union. The [loaded-document inventory](loaded-documents.txt) also
records linked validation evidence and authorized task documents. No full-doc scan
or additional authority pack was used. The [read-only merge assessment](MERGE_READINESS.md)
preceded implementation; mechanical mergeability is not owner/release acceptance.

## Scientific choice and working experience

Open Solar System, select **Moon**, inspect context, and choose **Approach Moon**.
The actual native globe supports drag/touch, keyboard, zoom/orbit and validated
coordinate navigation. Return, Back/Forward and reload preserve the admitted
camera/time context. Retry retains the latest camera.

Moon was selected from actual gates: existing DE442s includes center **301** and
qualified NAIF binary PCK/FK supplies `MOON_ME_DE440_ME421`. Current Mars target4
is its system barycenter; center499/orientation are not qualified for this slice.
The independent published NAIF vector agrees within0.6m for its stated fixture,
not a global surface accuracy claim. [Science/references](SCIENCE.md),
[body-aware interfaces and lifetime](INTERFACES.md).

Original NASA PDS LROC morphology browse is8pixels/degree, about3.79km/pixel, on a
1,737,400m reference sphere. It is historical grayscale morphology, not current
imagery, calibrated reflectance or measured elevation. Explicit source no-data is
not inpainted. Geometric Sun direction drives a Lambert sphere mask without an
Earth night-light floor or invented Earthshine. Historic acquisition shadows
remain. This exploration camera is not an Earth observer's apparent lunar phase.
[Original bytes, projection, rights and limits](IMAGERY.md).

## Actual preview and screenshots

- [Solar System → Moon](http://172.26.23.204:4222/solar-system?date=2026-10-23T01:05:00Z)
- [Actual screenshot gallery](http://172.26.23.204:4222/evidence/r4-a/gallery.html)
- [Current committed-source/served identities](http://172.26.23.204:4222/evidence/r4-a/delivery.json)

Windows PowerShell observed HTTP200. Actual Chromium journeys also used this LAN
HTTP origin, where `randomUUID` is absent; the bridge uses secure random bytes
supported there. This WSL address is session-local, not production deployment.

| Actual viewport | Solar context | Moon globe | Sources |
| --- | --- | --- | --- |
| Desktop1440×900 | [capture](screenshots/1440x900-solar-moon-context.png) | [capture](screenshots/1440x900-moon-globe.png) | [capture](screenshots/1440x900-moon-sources.png) |
| Mobile390×900 | [capture](screenshots/390x900-solar-moon-context.png) | [capture](screenshots/390x900-moon-globe.png) | [capture](screenshots/390x900-moon-sources.png) |
| Landscape667×390 | [capture](screenshots/667x390-solar-moon-context.png) | [capture](screenshots/667x390-moon-globe.png) | [capture](screenshots/667x390-moon-sources.png) |

Nine unmodified actual-browser PNGs are bound to [source/screenshot hashes](screenshots/sha256.json).
Software Chromium and emulated touch are not physical GPU/device or owner acceptance.

## Qualification

| Check | Observed result |
| --- | --- |
| Frontend / TypeScript | **344 passed** in54 files / typecheck passed |
| Runtime, Earth and new lunar contracts | **258 passed**, zero failed |
| Original image pixels / no-data conversion | **2 passed** |
| Authoritative Docker lunar science + preserved Solar API | **33 passed**, **7 visible deprecation warnings** |
| Host lunar strict `-W error` | **10 passed**, supporting evidence only |
| Desktop / portrait / short landscape | **16 groups passed**, source-bound final run |
| Faults, cancellation, WebGL recovery, direct Sky return | **8 groups passed**, including latest-camera Retry |
| Native Earth search→Solar→Moon→Earth | Desktop/mobile passed; native observer/camera/UTC retained |
| Rendering, bounds, hit targets, LAN origin | **3 groups passed** |
| Actual illumination raster | Sunlit center mean44.82/255; antisolar maximum0/255 |
| Repeated/served builds | Three Hub builds:138 identical files; two native builds:4 identical files |
| Preserved engine bytes |514 Earth and111 Sky files served with unchanged hashes |
| Original design archive / Solar assets / documentation | Original bytes, UV mapping and manifest/link checks passed |

[Exact commands/evidence classes](COMMANDS.md), [browser](evidence/browser.json),
[recovery](evidence/recovery.json), [Earth return](evidence/earth-return.json),
[rendering](evidence/rendering.json), [raster](evidence/illumination-raster.json),
[pre-commit identities](evidence/candidate-identities.json),
[Docker output including warnings](evidence/docker-science.txt).
Final exact-head independent review and remote identity are published in the draft
PR delivery report; the pre-commit snapshot does not claim a future commit hash.

Earlier Earth opening and mobile Moon Back/Forward runs timed out. Their underlying
causes remain **unknown**; subsequent bounded final checks passed without increased
deadlines or unrelated resource changes. [Earlier navigation failure](evidence/earlier-navigation-timeout.json),
[earlier combined recovery failure](evidence/earlier-combined-recovery-timeout.json).
These records are not relabeled as passes. No stalled N1 suite was reopened.

## Preservation, review corrections and limits

Earth, Stellarium, Pennsylvania horizon, satellite presentation, shared glass,
source pins, scientific pipelines and original Solar materials/assets remain
unchanged. Solar changes are bounded to the satellite destination and admitted
return state. Nine primary bodies, statistical belt and the owner's enlarged-size
policy remain intact. Explicit return waits for native viewer destruction.

Data, including new lunar kernels/TIFF/PNG, are readonly runtime mounts, excluded
from bulk image content. No volume/database reset, production action or owner
settings edit occurred. Primary checkout retains its pre-existing
`.vscode/settings.json` change. No database-byte snapshot is claimed.
[Exact changed-file inventory](FILES_CHANGED.md).

Independent pre-commit review prompted corrections for Back camera/preferences,
close-up resize, stale selection reload, original Sky/Earth state and latest-camera
Retry. Qualification also corrected camera-up validation, coordinate drafts,
roundoff, HTTP channel generation, first-render readiness and Earth-oriented light.
No SDK patch or scientific source substitution was introduced.

Remaining limits: coarse historical imagery with about7.86% no-data map pixels;
no terrain/elevation or landing-site precision; no qualified Mars surface; Lambert
display is not radiometric calibration; no physical GPU/mobile acceptance.
Strict warning-clean Docker qualification remains open because Skyfield/NumPy2.5,
Starlette and HTTPX emit deprecations. Default large-chunk build warnings are also
retained. These warnings are not silently waived as a clean gate.

Recommended next R4 package: source-qualified tiled lunar detail plus an explicit
elevation-datum/terrain assessment. Keep terrain unavailable until its gates are
established. Stop for owner review; do not claim full R4 acceptance or start later
roadmap/X work.
