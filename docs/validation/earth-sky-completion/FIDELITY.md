# Earth/Sky visual comparison and remaining gaps

Use the exact [Earth reference](../../design/cinematic-references-2026-10-21/earth-cinematic.png)
and [Sky reference](../../design/cinematic-references-2026-10-21/sky-cinematic.png).
These are visual direction, not astronomical fixtures or measured conditions.
The Windows review gallery is
`http://172.26.23.204:4220/evidence/earth-sky-completion/gallery/index.html`.
Original PNG bytes are copied unchanged into the local gallery; their hashes and
all actual screenshots are recorded in `evidence/gallery-manifest.json`.

| State/criterion | Delivered change or verified reality | Remaining discrepancy and reason |
|---|---|---|
| Earth global scene | Native Cesium globe, real curvature, compact brand/search, explicit full-Earth action | Reference cloud layers/night lights are not in the qualified Earth imagery stack. No photographic background or invented weather added. |
| Continental/regional | Source loading now waits for actual imagery requests as well as native tiles; settled land is recognizable | A loading preview can remain coarse. NASA Blue Marble 500m and EOX2016 10m are static source limits, not a live/maximum-resolution promise. |
| City/street | Real address/place/coordinate navigation; native geographic point; compact expandable location/source card | Street detail cannot exceed source pixels. No sharpening, invented buildings or measured elevation. |
| ORAS | Qualified coordinates and source coverage inspected; NAIP footprint policy retained | PEMA publication rights remain unverified. No PEMA screenshots in this gallery. |
| Earth atmosphere/background | Existing native atmosphere and imagery preserved | Reference atmospheric/cloud complexity is not reproduced. Bundled Cesium stars are illustrative, unlike Sky catalog stars. |
| Sky dark wide field | Native exposure 2.5 and point size1 for fresh defaults; explicit adjustable native controls, original defaults resettable | Catalog magnitudes/positions unchanged. Display enhancement is not a naked-eye visibility model or measured sky brightness. |
| Star density and surveys | Existing visual-default catalog/profile retained; native Milky Way and DSS controls exposed | Wide-view density differs from the concept. Existing binocular/deep profiles require native reload; no silent profile override or new catalog ingestion. |
| Historical epoch/Moon | Actual 2026-02-28T00Z scene; Moon canonical identity and native focus now reach Hub context | Source API says nautical twilight and Moon above horizon, not dark conditions. Native close-up can appear bright at enhanced exposure; user can reduce display brightness. |
| Planet/DSO | Exact Jupiter identity, Moon, M42 and Deneb selected in native SWE; source-backed context and native close focus | Jupiter cannot look like a giant globe at wide FOV. Close-up is a separate native zoom, not exaggerated angular size. Survey photographic nebulosity is disclosed. |
| Constellations | Lines, labels and artwork remain independent native options | Positions/visibility follow actual time and observer; no forced concept arrangement. |
| Landscape | Accepted Pennsylvania woodland bytes and native controls preserved | Illustrative landscape is not surveyed terrain or a scientific horizon mask. |
| Composition/UI | Shared compact glass/brand, direct search, collapsed/expanded context; 1440×900,390×900,667×390 coverage | Mobile selected context still consumes scene area when expanded; collapsed view is provided. Reference typography/composition are not pixel-identical. |
| Accessibility/lifetime | Keyboard focus restoration, native keyboard zoom, mouse/emulated touch, reduced-motion journeys; one active renderer | Emulated touch is not physical-device qualification. Native context creation still depends on source/tile loading. |
| Performance | Actual software frame/input intervals retained, no Solar source changes | Earth remains slow on SwiftShader. No physical GPU benchmark or owner Earth/Sky performance acceptance is claimed. |

Matched comparisons use fresh browser contexts at the same viewport, route and
requested UTC, with native camera/source diagnostics alongside each capture.
Images after a fixed settle interval are not claimed fully loaded unless their
recorded native readiness confirms it. Selected/expanded scenes supplement these
comparisons; their exact source, epoch and FOV are retained in browser JSON.

Dark fixture: ORAS 41.321903,-79.585394,432.816m at 2026-08-13T04:00Z.
Docker source `jpl_de442s` reports Sun -30.788493° and Moon -31.170198°.
This establishes geometric astronomical night, not observed cloud/seeing or a
measured Bortle rating. The existing native Bortle preset is not a site measurement.
Historical fixture Sun -10.751397°, Moon +52.685545° remains separately labeled.

Visual acceptance belongs to the owner. Passing functional checks does not close
any of these visual differences.
