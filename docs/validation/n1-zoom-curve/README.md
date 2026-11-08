# PR #75 — graduated Earth zoom, 2026-10-15

N1 remains **pending owner testing**, with no merge, deployment or N2. The owner
rejected the previous profile at `18e1ffd985e5bb86428e6343c6d5a488f379bbe1` as
too fast near Earth. This evidence qualifies the bounded curve change at
`fa29b01ce589afa689bf02ce1b196e3ab3cb33f7` on `n1-sky-earth-navigation-1`.
Subsequent evidence commits do not change application behavior. PR #75 still
bases on unmerged #74, itself dependent on unmerged #73.

Preview: <http://127.0.0.1:4202/sky-engine>. Refresh before testing.
Served-byte/commit verification: <http://127.0.0.1:4202/evidence/scroll-preview.json>.

## Change and scope

Only production source changed is `runtimes/earth-runtime/core/CameraController.mjs`.
Wheel gain is now `0.045 + 0.32*h/(h+10000) + 0.735*h/(h+200000)` for altitude
`h` in metres. The broad altitude scales reduce speed well before 40 km, while
preserving fast orbital movement and increasingly fine control below 10 km / 2 km.
The existing exponential delta scaling, per-event cap, native movement ray,
orientation, altitude limits, entry/release boundaries and continued-input guard
are unchanged. Other changes are tests, a measurement driver, artifact identity
and execution/evidence records; see [exact changed files](files-changed.txt).

## Actual Chromium measurements

Both measurements used the actual Docker-served application, Chromium 145 and the
same native viewer. Ordinary wheel input is `page.mouse.wheel(0, ±120)` with a
350 ms settling wait after each browser acknowledgement. The selected-location
approach starts at 40,000 m over Central Park (40.7829, -73.9654).
The entry band is camera altitude ≤1,500 m; entering it alone does not switch modes.

| Measurement | Previous profile | Corrected curve |
| --- | ---: | ---: |
| First inward notch from 40 km | 15,080 m | 26,190 m |
| 40 km → entry band | 7 notches / 16.803 s | **17 notches / 41.602 s** |
| Final altitude on that approach | 1,392 m | 1,480 m |
| 15,621,863 m orbit → ≤40 km | 6 notches / 19.975 s | 7 notches / 22.943 s |
| Reverse, entry band → ≥40 km | 9 notches / 20.789 s | 19 notches / 33.987 s |
| Trackpad, groups of ten −12 px events at 20 ms | 8 groups / 20.565 s | 18 groups / 42.990 s |
| Twelve rapid −120 px events at 45 ms, starting 40 km | 1,734 m | 4,971 m |

[Altitude after every ordinary notch](notch-altitudes.csv),
[before raw proof](before/proof.json), [after raw proof](after/proof.json),
[before screenshot](before/near-surface.png), [after screenshot](after/near-surface.png).
Raw proof also retains delivered native wheel packets, camera orientation and observer.
Timings include waits and software-rendering/browser acknowledgement delays; they
are measured interaction durations here, not estimates of physical-device speed.

Both runs passed. Corrected calibration meets the initial 12–18-notch target.
Small-delta and rapid input stayed in Earth during approach. Reverse zoom passed.
Deliberate continued near-surface input entered native Sky at Central Park, with
fixed UTC `2026-10-14T02:10:00.000Z` and explicitly identified 0 m observer-elevation
fallback; returning to Earth retained Central Park. Camera altitude was not used
as observer elevation. Target and orientation assertions passed, no JavaScript
page errors occurred, and ready states contained one renderer iframe.

## Validation and context

The Default Mode frontend_change + validation task packs were used; the existing
[loaded-document ledger](../n1-scroll-repair/loaded-documents.txt) lists the loaded
CORE/LIVE and manifest-required documents. No broad docs scan or additional task
pack was used. This report is the owner-requested runtime evidence.

[Commands](commands.txt) and retained outputs:

- Focused regression: previous curve fails 2 of 4 checks; corrected curve passes
  **4/4** ([red](zoom-curve-red.txt), [green](zoom-curve-green.txt)).
- Runtime/Earth **120 passed, 0 failed** ([output](zoom-curve-runtime.txt)).
- Frontend **239 passed across 32 files** ([output](zoom-curve-frontend.txt));
  typecheck exits 0 ([output](zoom-curve-typecheck.txt)).
- Pinned Docker Earth build and Hub build exit 0
  ([Earth](zoom-curve-earth-build.txt), [Hub](zoom-curve-hub-build.txt)).
  Existing chunk-size warning remains.
- Earth artifact verification passes ([output](zoom-curve-artifact.txt)); digest
  `38f6bfd71993d4282c82883d39f78f2147263a1742583e42e6091cf84b41fd65`.
- Architecture documentation validation passes ([output](zoom-curve-docs.txt));
  changed-file whitespace and served-JavaScript byte identity checks pass.

The earlier 44 desktop/mobile journey groups and five focused groups are retained
in [previous repair evidence](../n1-scroll-repair/README.md), at their original
source identity. They were **not rerun for this curve-only correction**. Native
Sky input, standalone/embedded landscape behavior, Night Mode, browser-history,
touch Explore and handoff logic were not modified. Full backend/deep-link suites
were not rerun for this curve correction.

## Limitations, preservation and rollback

The exact owner ChatGPT browser and physical mouse/trackpad/mobile hardware cannot
be automated here. These are representative real Chromium inputs using software
rendering. Owner experience remains the acceptance gate; passing calibration is
not owner acceptance. The screenshots show the actual near-surface result.

Astronomy data, native SWE WASM/vendor artifacts, installed panorama files, ORAS
home, owner settings and Docker volumes remain preserved. Sky artifact remains
`3b80bb352c8d1680d9217ce9b8e7fc5dbb8ed0b71b59c2f0f66d1143d103b50f`.
No provider, dependency, source pin, imagery, terrain, landscape discovery,
aircraft, weather, satellite or Solar System change. Provider spending remains $0.
The owner checkout's preexisting `.vscode/settings.json` remains untouched.

The PR #74 preview at port 4201 remains available. Previous Earth artifact is
preserved at `output/n1/earth-before-zoom-curve`; restoring a prior source requires
its matching artifacts and admission metadata, not copying isolated built files.
The source correction is isolated in `fa29b01c` for review/revert with its metadata.
Stop for owner testing of PR #75; N2 requires separate authorization.
