# PS2 — Major-moon systems

Separate implementation package on PS1 draft PR93 at36426905. PR92 remains
preserved and unmerged. PS1's independent exact-head follow-up reported no
remaining actionable findings after its epoch-history correction; the actual
zero-discrepancy browser receipt is retained in this package.

## Source-admitted systems

| Physical parent | Qualified moons | Other listed moons | Detailed surface |
| --- | --- | --- | --- |
| Earth399 | Moon301 (preserved DE442s) | — | Preserved R4-A Moon globe |
| Mars499 | Phobos401, Deimos402 | — | Unavailable |
| Jupiter599 | Io501, Europa502, Ganymede503, Callisto504 | Explicitly unavailable | Unavailable |
| Saturn699 | Enceladus602, Titan606 | Explicitly unavailable | Unavailable |
| Uranus799 | Ariel701, Umbriel702, Titania703, Oberon704, Miranda705 | — | Unavailable |
| Neptune899 | Triton801 | Explicitly unavailable | Unavailable |

The fourteen new moons use one finite official Horizons release, with actual
physical-parent heliocentric vectors and directly parent-relative moon vectors.
No DE442s barycenter offset is added. Solar retains its original source domain;
the local-system transition is disclosed. ICRF geometric kilometers and UTC→TDB
conversion remain explicit. [Science, source receipts and comparisons](science/README.md).

Coverage is October1–November1,2026 in **TDB**, not UTC. Published usable UTC
bounds round inward to browser milliseconds; precise TDB bounds and original
sample instants remain available. Out-of-range requests fail explicitly. The UI
allows choosing an epoch and does not silently change time. Playback pauses at
coverage end. No online runtime download, invented orbit or unqualified surface.

## Data and appearance

The versioned numeric release is2,376,055bytes plus a321-byte manifest under
`data/runtime-packs/planetary-systems/release`. It is excluded from Docker images
and mounted read-only using `ORAS_PLANETARY_SYSTEMS_DIR`. Original production,
midpoint and quarter responses remain in the ignored source archive; small source
receipts, exact query URLs and qualification results are versioned. The offline
importer reproduces the committed normalized release from that preserved archive.
A repeated live Horizons request need not reproduce retrieval-header bytes.

Mars preserves the original NASA GLB geometry, UVs and color atlas. Other parent
materials are illustrative; new moons are neutral reference-radius spheres with
no surface imagery. Phobos/Deimos shapes are not claimed spherical in reality.
System axial orientations are illustrative. Saturn rings are omitted because
orientation relative to the scientific geometry is not qualified here. Original
Earth imagery, native Moon body frame, native Earth/Sky and all source pins remain
unchanged. Cinematic radius exaggeration is persistent and physical scale remains
available. Source-derived paths appear in overview; close-up hides paths without
altering the saved visibility preference, geometry or source time.

## Qualification and limits

The final source-matched results, exact commands and review are recorded in
[COMMANDS.md](COMMANDS.md). Historical red evidence is retained and labeled.
Viewport emulation and Chromium SwiftShader are not physical mobile/GPU evidence.
CPU submission measurements do not measure GPU execution time. Same-source
interpolation comparisons are not independent dynamical-model accuracy claims or
a rigorous continuous error bound. Existing dependency/build warnings remain
visible. Owner functional/visual acceptance is open.

Preview: http://172.26.23.204:4224/solar-system?date=2026-10-23T01:05:00Z

The preview is a task-only Docker service on4224, Windows reachable, with original
runtime/data mounts read-only. No production deployment, paid provider or owner
volume mutation. PS3 remains a separate cross-system integration package; future
lunar terrain/detail retains its existing roadmap identity.

## Actual screenshots

| Parent | Desktop overview | Portrait selected moon | Short landscape overview |
| --- | --- | --- | --- |
| Mars | [Overview](screenshots/1440x900-mars-overview.png) | [Selected](screenshots/390x900-mars-selected.png) | [Landscape](screenshots/667x390-mars-overview.png) |
| Jupiter | [Overview](screenshots/1440x900-jupiter-overview.png) | [Selected](screenshots/390x900-jupiter-selected.png) | [Landscape](screenshots/667x390-jupiter-overview.png) |
| Saturn | [Overview](screenshots/1440x900-saturn-overview.png) | [Selected](screenshots/390x900-saturn-selected.png) | [Landscape](screenshots/667x390-saturn-overview.png) |
| Uranus | [Overview](screenshots/1440x900-uranus-overview.png) | [Selected](screenshots/390x900-uranus-selected.png) | [Landscape](screenshots/667x390-uranus-overview.png) |
| Neptune | [Overview](screenshots/1440x900-neptune-overview.png) | [Selected](screenshots/390x900-neptune-selected.png) | [Landscape](screenshots/667x390-neptune-overview.png) |

Final qualification:65Docker science tests (7inheritedwarnings),370frontendtests,
TypeScript,60browser assertiongroups across15system/viewportjourneys,5material/
lifecycle checks, inward-coverage boundary red/green,10software-performance cases,
three identical builds and exact served/native preservation receipts. Final
independent exact-head review follows commit; owner acceptance remains open.
