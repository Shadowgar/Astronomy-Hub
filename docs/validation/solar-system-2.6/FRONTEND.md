# Solar 2.6 browser contracts and navigation

The new bounded `/beyond` workspace uses the existing Three0.180 renderer,
SolarCameraController, camera-relative precision, HDR compositor, SolarClock,
resource owner, GPU timer and native-runtime disposal barrier. It does not
replace Solar, mission, Stellarium, Cesium or Moon engines. Only one heavy
renderer is mounted. The IBEX and IMAP products are SVG charts in the same
workspace and add no WebGL context or external polling.

Spatial positions remain ICRF heliocentric AU, retained as CPU doubles and
subtracted from the camera before writing Float32 attributes. The defined AU is
149597870.7km; light time uses299792.458km/s and365.25day Julian years. At100000AU
CPU floating-point resolution is already of order metres; the visualization
makes no metre-scale craft/detail claim at that distance. Local spacecraft and
planet inspection return to their separately qualified scenes.

Distance presets50,150,3000,50000,100000AU frame explanatory ranges. Camera
position/target remain bounded to±1000000AU peraxis, with maximum orbit distance
1000000AU. Navigation clamps translate both camera and target together; physical
object positions never change. The serialized pose uses matching admission
limits. New optional camera parameters leave all existing Solar/mission defaults
unchanged. Reference radius is a framing preset; live camera-Sun distance is
reported separately. Camera travel duration is not physical travel time.

Individual Voyager event views always use the declared representative noon on
2012-08-25 or2018-11-05. Measured day/radius and predicted source vector are
separate fields. A historical-comparison view explicitly retains two distinct
epochs and hides same-epoch planets. It neither deletes source objects nor
connects the anchors with an empirical boundary. A mission roundtrip restores
the saved Beyond historical view, camera and context UTC; direct mission entries
cannot inherit an unrelated encounter date as the crossing UTC.

The Kuiper guide is an illustrative30–50AU ecliptic annulus, consistent with
[NASA's main-belt explanation](https://science.nasa.gov/solar-system/kuiper-belt/facts/).
It does not claim that scattered populations end at50AU. Actual qualified
catalogs and comet paths stay in Solar. No Oort particle gets a catalog identity.

The IBEX visualization preserves all1800native6°bins, per-cell original mask and
statistical uncertainty. The equal-area Mollweide projection is a spherical
angular display with east longitude increasing left, north up, and explicit
180°seam sides. The projection family is documented by
[PROJ](https://proj.org/en/stable/operations/projections/moll.html). Tests check
poles/seam, area Jacobian and CSPICE-derived ECLIPJ2000→J2000 directions. It has
no radial inversion. Every map cell has one measured value; curved edges are
geometric sampling, not flux interpolation.

IMAP is a fixed one-day MAG scalar time series. One-minute means and min/max
variation envelopes preserve missing/excluded bins. The envelope is not an
uncertainty estimate. Source vector frame is GSE; magnitude is rotation invariant.
Pointer inspection must use SVG's inverse screen matrix so letterboxing cannot
select a different UTC than the visual position. Keyboard/sliders provide the
same inspection independently of a pointer.

Context128KiB and each observation2MiB have bounded streamed reads. React text
nodes and HTTPS-only source links avoid text-to-HTML interpretation. Unknown,
malformed, missing or integrity-failed data remain unavailable; no substitute
values are rendered. In-flight loads are aborted on view/lifetime change, and
rendering also checks product identity to prevent transient stale chart labels.

Independent reviews and actual browser receipts are recorded separately. This
implementation note is not owner visual acceptance or a public-source offer.
