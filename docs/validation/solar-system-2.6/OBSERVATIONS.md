# Solar 2.6 observational source qualification

Qualified on 2026-11-08 from branch `recovery/reconcile-20261026`, starting at
`66050b5e7f3a9cbcfccbf6258645bd1804051b28`. This is acquisition/numerical evidence;
application, Docker, Windows graphics and owner acceptance are separate gates.

The explicit Solar 2.6 directive, root/backend AGENTS and the `solar_reconstruction`
context pack govern this work. CORE/LIVE, manifest, the current Solar 2.6 plan and
parent-loaded validation/architecture/prior-phase evidence apply. The old Solar
2.5 expansion stop is superseded only within the new owner's scope. No extra
repository documentation pack, old data-pack mutation or application dependency
change was needed.

## Admitted products

| Product | Scientific meaning | Coverage | Runtime bytes |
| --- | --- | --- | ---: |
| `ibex-ena-map` | Published, processed IBEX-Hi ENA differential intensity at 2.73 keV | DR18 combined 2009–2022, 30 × 60 angular cells | 66,598 |
| `imap-magnetic-field` | Published MAG scalar magnetic-field magnitude, quality-filtered and averaged into UTC minutes | 2026-07-01 only, 2 Hz source | 126,183 |

Neither product is live telemetry, visible-light imagery, a distance measurement
or a three-dimensional heliopause reconstruction. No Ribbon/GDF separation is
claimed for the selected total-flux IBEX map. No source update/polling runs in the
browser or backend.

## IBEX: identity, calibration and angular convention

The [official Princeton release index](https://ibex.princeton.edu/DataRelease)
links [Data Release 18](https://ibex.princeton.edu/DataRelease18), its fourteen-year
data and McComas et al. (2023). The bounded numerical source is the
[NASA SPDF DR18 directory](https://spdf.gsfc.nasa.gov/pub/data/ibex/release18/Hi/hvset_cg_2009-2022/).
Its three selected monoenergetic files are:

- `hv60.hide-trp-mono_80-2.73-flux.txt`, 19,748 bytes,
  SHA256 `3e748f5888549e72d6940bf5c30124d53455414f9c4f424b5afd7a930d117ddf`.
- `hv60.hide-trp-mono_80-2.73-fvar.txt`, 17,923 bytes,
  SHA256 `883d3ccfdd4a9abfc1307f8cbf56889f3ab67c1b1f24c57025ecce6b2f776a8a`.
- `hv60.hide-trp-mono_80-desc.txt`, 1,647 bytes,
  SHA256 `222218f96dc697552c5b26cd9c69fb73e33c9b0f0aae2275735943a02213bda5`.

Flux units are ENA / (cm² s sr keV). `e_approx=2.73`, the filename and processing
descriptor identify the selected monoenergetic energy; the inherited
`e_nominal=0.71` header describes the first contributing input channel and is
**not** substituted for the selected product energy. The source uses piecewise
linear interpolation in log(flux)–log(energy), after the published
Compton–Getting correction into the solar inertial frame. This is an already
processed observational product; no new energy fit is performed here.

`hs_radius=1`, the official PNG and the underlying channel descriptor identify
a 1 AU reference. The descriptor `hv60.hide-trp-flux100-hi-5-desc.txt` explicitly
states transport from 1 AU to 1.0 AU. Its historical `flux100` filename therefore
does **not** imply an actual 100 AU survival-probability correction. That 153,777
byte descriptor is pinned at
`ca585b856d003479868536d8fd83fd8144838f757db0ad76d6ab87045ac2f17b`.

The source explicitly declares `skyframe=ECLIPJ2000`, despite generic RA/Dec
axis labels. Its 6° cells cover longitude [0°,360°] and latitude [−90°,90°].
Normalized arrays retain original south-to-north row order and east-increasing
column order; displayed bin centers are longitude 3°..357° and latitude
−87°..87°. North-up, outward-looking sky displays should increase longitude
toward the left. A rectangular/equirectangular display is a visualization of
these angular cells, not an equal-area projection.

**Upstream documentation conflict:** the DR18 README says first/last columns are
identical. These actual 60-column files have different first/last values, and
their own descriptors state 6° cells. Sixty cells already cover the full 360°;
all sixty are preserved without an extra seam column or removal of real data.
The official source PNG was visually inspected as an orientation/reference
check. It labels ECLIPJ2000, 2.73 keV and 1 AU. No pixel measurements were
extracted from that image.

The nominal outer release interval is 2008-12-25 through 2022-12-26. This is not
a per-pixel exposure interval. The selected header lists first arc 0011 and
last contributing arc 0591b, with 978 input files; the last nominal release arc
592a must not be inferred as present in every pixel. Source processing and
non-simultaneous observations remain disclosed.

All 1,800 selected cells are finite and positive, spanning 2.275443..27.074915
in the source units. The companion variance is preserved through square root
as statistical 1-sigma uncertainty. It does not account for every calibration
systematic, temporal variation or inferred source distance. Invalid/nonfinite
or negative cells in this log-interpolated product would become explicit
`mask=true`, `flux=null`, `uncertainty=null`; there is no angular interpolation.

## IMAP: actual public file, quality and gaps

The [Princeton data page](https://imap.princeton.edu/data) lists public releases
on July 29 and October 28, 2026. [CDAWeb](https://cdaweb.gsfc.nasa.gov/) independently
announces availability of IMAP in-situ instrument data in its August 2026 update.
Those notices were discovery evidence, not proof that any required variable
existed. The actual admitted file was downloaded and inspected:

[imap_mag_l2_norm-gse_20260701_v002.0003.cdf](https://spdf.gsfc.nasa.gov/pub/data/imap/mag/l2/norm-gse/2026/imap_mag_l2_norm-gse_20260701_v002.0003.cdf),
3,781,231 bytes, SHA256
`4a594a3a9a79b78ea1e0db926e53c6820db8be0f32245cd002ad8b36f3e4427f`.

The published `magnitude` scalar has units nT; it is not recomputed from the
vector for display. Its associated vector `b_gse` is Geocentric Solar Ecliptic;
the scalar is invariant under coordinate rotations. This local field near IMAP
does not measure a global heliosphere surface. The
[official MAG instrument description](https://imap.princeton.edu/mission/instruments/magnetometer-mag)
explains that local measurement context.

The CDF contains 172,800 records from 00:00:00 through 23:59:59.500 UTC at 2 Hz.
Epochs are CDF TT2000, converted with cdflib's leap-second-aware routine, never
treated as Unix UTC nanoseconds. The first TT2000 value is
836136069184000000 ns. Qualification checks strictly increasing epochs within
the one UTC day and no more than 120 input samples per minute.

Version 002.0003 was generated on 2026-10-10. Its `MODS` describes corrected spin
tables/SPICE spin axis and phase. Original parents include calibration v006 dated
2026-03-01 and normal-mode offsets v004 for this day; all parents and original
global attributes are retained in the receipt. No new calibration was invented.

Only `quality_flags=0`, `quality_bitmask=0` and valid finite magnitudes in the
CDF's [0,100000] nT range are admitted. This excludes 5,079 records: 4,440 with
bit 1 (thruster signals removed) and 639 with bit 2 (spacecraft interference).
The source itself marks these records bad quality; they are not silently
plotted as good. 167,721 records remain. Arithmetic means, minima, maxima,
accepted counts, rejected counts and bitwise quality OR are retained for each
of 1,440 UTC minute-start bins. Forty empty bins stay null; four bins are
partially sampled. No gap interpolation, smooth fill or uncertainty estimate
is manufactured. The min/max envelope is variability, **not uncertainty**.

The 130 MB CMAD was not downloaded because it exceeds the declared limits.
Qualification uses the actual file's quality/range/parent/version/usage metadata
and official instrument documentation; full calibration-manual review is not
claimed. This limitation remains in runtime metadata.

## Rights, failed probes and bounded storage

[NASA SPDF's data-use policy](https://spdf.gsfc.nasa.gov/data_use_policy.html)
provides default public-domain/CC0 treatment unless an exception is identified,
while retaining citation and attribution expectations. No restrictive exception
appears in these selected numeric products. The IMAP CDF explicitly describes
its products as publicly released and citable and requests attribution to the
instrument team, PI David J. McComas/Princeton, NASA contract 80GSFC19C0027 and
appropriate source references. IBEX team and NASA SPDF acknowledgements are
retained. Neither the NASA identity/logo nor third-party publication artwork is
relicensed here. No public source archive is published by this work.

The raw cache currently retains 4,227,350 bytes including discovery receipts.
The declared acquisition stream budget was 96 MiB: IBEX32, IMAP56, metadata8;
each response≤32 MiB. The six necessary pinned originals total 4,052,472 bytes.
The source script checks lengths, hashes, per-category/aggregate budgets and
records failed/partial transfers. Cached corrupt files are rejected. Acquisition
requires explicit `--download`; runtime never contacts these providers.

SwRI's requested public-data URL failed TLS hostname verification in Python
and timed out in the web reader; TLS verification was not bypassed. Princeton's
publication host gave a web-reader502 but a normal Python HTTPS200 directory
listing. Those failures and the declined CMAD are recorded rather than called
missing science. Official SPDF files provided the qualified alternatives.
Raw data stay under ignored `data/source/solar26-observations/`. The new immutable
pack lives under ignored `data/runtime-packs/heliophysics/release-v1/`; no prior
pack was edited. Existing bytes may only be verified, not overwritten by the
builder. No scientific bulk enters Docker images or frontend bundles.

Manifest SHA256:
`7157a049597f164fa0b4df34d72c483401d0f7aaac5f217f3c084cec0b28f037`.
Total pack198,209 bytes, below16 MiB runtime/8 MiB optional-transfer budgets;
either lazy product is below2 MiB. The observation charts require no extra
WebGL renderer or scientific GPU volume.

## Reproduction and numerical evidence

Acquisition-only tools were installed in ignored `output/solar26-observation-tools`:

```sh
python3 -m venv output/solar26-observation-tools
output/solar26-observation-tools/bin/pip install cdflib==1.3.6 pypdf==6.1.1
```

Resolved NumPy was2.5.4, reused from the local pip cache; the builder requires
that version. Exact fresh-environment reproduction should also pin
`numpy==2.5.4`. pypdf was used only to read the78,146-byte IBEX README because
`pdftotext` is unavailable. Application requirements and lockfiles are unchanged.

```sh
python3 scripts/skydata/test_solar26_observations.py -v
output/solar26-observation-tools/bin/python scripts/skydata/acquire_solar26_observations.py
git diff --check
```

Results:10 offline tests pass; repeated offline builds reproduce the same three
pack hashes; diff check passes. The initial module-form unittest command loaded
the existing skydata package's SQLAlchemy import in system Python and failed;
direct execution above avoids that unrelated package initializer. No test was
silently skipped. Tests cover incomplete/corrupt/wrong-frame or wrong-energy
data, uncertainty, masks, seam/poles, missing times, quality flags, range/fill
values, cadence/order, immutable output and streamed-size rejection.

Independent directional references used existing SpiceyPy8.0.0/CSPICE_N0067
`pxform('ECLIPJ2000','J2000',0)` and `latrec`, not the builder's trigonometric
rotation. Six reference directions agree within1e-14 per Cartesian component.
The 1,800 cell solid angles sum to4π, independently checking polar/seam coverage.

Independent NumPy means calculated directly from source CDF records agree with
five normalized minutes within1e-12 nT. Comparing the source scalar with norms
of the independent source-vector variable gives a maximum1.906603458223799e-6 nT
difference, consistent with stored float32 precision. Source quality totals and
first/last UTC records are checked against the actual CDF.

All source hashes, successful/failed probes, original CDF global attributes,
numerical comparison values, budgets and pack hashes are in
[`observation-source-receipts.json`](observation-source-receipts.json).
Independent non-author source review and application/browser qualification are
recorded by the integration reviewers; this document does not claim owner
acceptance or public-release qualification.
