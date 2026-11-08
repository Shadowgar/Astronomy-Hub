# Material fidelity findings and remaining discrepancies

The owner rejected PR90. These changes are a new review candidate, not visual
acceptance. The original four approved PNGs retain their committed SHA256 values.

| Material/property | Prior observed state | Implemented/rendered state | Limit |
|---|---|---|---|
| Floating controls | Shared85–91% dark gradient, independent native opaque fills | One canonical24–52% gradient,16px blur/saturation145%, layered top/side highlights,32% luminous border | Dark space provides little bright content to refract; it still looks darker than glass over sunlit land. No synthetic scene added to brighten chrome. |
| Selected cards/menu | Mixed ordinary navy surfaces | Shared raised36–64% gradient, same edge/highlight family | Text density remains higher than the artistic concept in expanded scientific details. |
| Modal dialog | Near-opaque background | Shared66–78% material for reading long scientific/legal content; actual Earth color visible through it | Elevated dialogs intentionally give text more separation than floating controls. |
| Frosted composition | Property alone did not prove final renderer behavior | Computed built-browser16px/saturation checked; real Solar dialog raster compared against filter-disabled and opaque diagnostics | Raster difference proves composition changes, not owner taste or a similarity score. Earth/native-frame evidence includes actual captures and computed styles; no cross-frame GPU tracing claimed. |
| Native Sky | Independent opaque search/rail/popup fills | Exact canonical CSS imported into native Vue build. Search pseudo-layer avoids trapping dropdown in ancestor backdrop root | Native Night Mode stays deliberately red/opaque. SWE still owns all astronomy/rendering. |
| Menus | Brand ancestor filtering could constrain descendant backdrop sampling | Brand uses separate pseudo-surface; dropdown samples scene independently | Chooser has finite viewport; short-screen stacking correction is separately verified. |
| Accessibility | Partial media-only fallback | Manual persisted Reduce transparency, OS media, unsupported-filter fallback, forced colors, reduced motion | No blanket WCAG contrast certification across every arbitrary scene/background. Actual bright/dark captures and target/focus checks are provided. |
| Portrait/short screens | Selected Earth card covered Sources; expanded Sky sheet intercepted chooser | Portrait card beside map rail; open chooser above sheet | Expanded content remains scrollable and consumes scene area; collapse the short-screen sheet before native settings, using its44px handle. This normal progressive-disclosure path is browser-tested. |

Source evidence identified actual defects before correction: optimizer dropping
standard filter declaration; Earth selector keeping legacy20px blur; portrait
Sources occlusion; short Sky chooser occlusion; local Night tokens overriding opaque
fallback. Failed records remain labeled. A scene-test locator also initially used
visible Sources text instead of its accessible name; that harness failure is not
an application defect.

## Scene-level V1 result, separate from materials

Earth: no new rendering switch or imagery source was justified by inspection.
Native Sun-relative atmosphere, ellipsoid curvature, scene-time sunlight and
qualified sources already work. Updated chrome leaves geography perceptible.
The source probe still reports slow acquisition/settling in SwiftShader; no speed
improvement or new physical GPU qualification is claimed. Existing500m Blue Marble,
10m EOX2016, footprint-qualified NAIP and fallback/cache rules remain. PEMA is not
published. No fabricated weather/cloud/nightlight/building/terrain layer.

Sky: native exposure/Milky Way/DSS/constellation/search controls from PR90 are
preserved. No added star depth, repositioned planet, fictional nebula or new survey.
The concept cannot be replicated as an ephemeris fixture. Pennsylvania remains
illustrative, not measured terrain. Material changes are applied inside its frame.

Solar: scene/camera/ephemeris/material-source algorithms, geometry and original
assets are unchanged; only UI CSS/shared chrome changes. Artistic concept planet
arrangement, Sun scale and atmospheric detail remain different. Independent size
enlargement disclosure/physical-scale option remain. Owner-observed smoothness is
positive feedback, not general GPU or release acceptance.

Brand graphic, exact typography, artistic scene arrangement and source-dependent
cloud/terrain/background detail are not pixel-identical to the references. No
arbitrary visual similarity percentage is assigned. Owner review of the actual
three-mode preview is the next gate.
