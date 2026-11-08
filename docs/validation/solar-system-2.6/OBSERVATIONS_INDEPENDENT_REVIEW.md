# Independent observation-source review

Reviewer: `solar26_physics`, a separate agent from the author of the observation
acquisition/normalization pipeline. Date:2026-11-08. The reviewer authored the
separate Beyond backend/context, so this report does **not** independently approve
that backend or the reviewer's own changes. The observation author separately
reviews those files. This is neither owner visual acceptance nor release approval.

Reviewed `scripts/skydata/acquire_solar26_observations.py`, its ten offline tests,
`OBSERVATIONS.md`, source receipts, actual IBEX flux/variance/descriptors/README/
PNG and the original IMAP CDF. The immutable runtime manifest is
`7157a049597f164fa0b4df34d72c483401d0f7aaac5f217f3c084cec0b28f037`.

**Result: no open P0/P1/P2 defect in the reviewed source pipeline.** This result
does not cover frontend chart implementation, WebGL, navigation, Docker mounts,
hosted CI, physical devices or overall PR107.

## Evidence and independent comparisons

- Independently loaded every IBEX numeric cell with NumPy, without importing the
  builder. All1800 normalized fluxes equal the raw source; uncertainty equals the
  square root of the published variance. All actual cells are finite/positive.
- Inspected the original headers and processing descriptors: ECLIPJ2000,
  2.73keV monoenergetic interpolation, Compton–Getting correction, 1AU reference.
  The misleading inherited `e_nominal=0.71` and `flux100` names are correctly
  subordinated to the selected product and explicit processing metadata.
- The source has30×60 six-degree cells and nonidentical edge columns. Its south
  to north rows and east-longitude ordering are retained. The README's duplicate
  seam claim conflicts with actual bytes and is disclosed. Inspecting the
  official outward-looking PNG confirms north-up/east-left orientation and the
  bright southern region containing the source maximum near237°,−33°. Cell
  centers are display coordinates for angular bins, not measured point sources.
- Inspected original CDF variable/global attributes. `magnitude` is published
  magnetic scalar nT; quality flag0 is good. Nonzero bitmasks are excluded;
  fill/range/nonfinite values cannot become observations. The scalar is not
  presented as a global field or recomputed from an illustrative vector.
- Independently recomputed **all1440** minute means, minima/maxima, accepted and
  rejected counts, and bitwise quality masks directly from172800CDF records.
  All match; maximum mean difference0nT.167721records remain,5079are excluded,
  and40empty bins remain null. The min/max envelope is explicitly variability,
  not instrument uncertainty. No gaps are interpolated.
- Independently converted TT2000 using exact integer arithmetic for this specific
  non-leap UTC day, then checked first/noon/final records with CSPICE_N0067
  `unitim(TDT,TDB)` and `et2utc`, using the preserved `naif0012.tls`. All three
  match the reported UTC times, including the final23:59:59.500sample.
- Read [NASA SPDF's current data-use policy](https://spdf.gsfc.nasa.gov/data_use_policy.html)
  and original CDF rules. DefaultCC0/public-domain terms and attribution are
  accurately stated with the exception caveat. No restrictive exception was
  found in these numeric products. No third-party paper art is redistributed.
- Bounded acquisition, source hashes, immutable pack writes and no-runtime-network
  boundaries are implemented. The130MBcalibration manual was deliberately not
  acquired; the exact limitation is retained. This is not full calibration
  research or a claim of instrument uncertainty.

The initial review read transient documentation that misstated a product-size
comparison and described a NumPy version requirement before its check appeared.
Re-reading the author's frozen files confirmed both issues absent: each product
is under2MiB and the builder enforces both tool versions. No source-pack hashes
changed. These were documentation/version-consistency notes, not unresolved
scientific defects.

## Reproduction

```sh
python3 scripts/skydata/test_solar26_observations.py -v
# 10 tests passed.
output/solar26-observation-tools/bin/python scripts/skydata/acquire_solar26_observations.py
# Offline reproduction: manifest7157a049..., pack198209bytes, both product hashes unchanged.
PYTHONPATH=output/solar26-observation-tools/lib/python3.12/site-packages:output/playwright/solar-system-2.4/asset-tools-venv/lib/python3.12/site-packages:. \
 /home/rocco/Astronomy-Hub/.venv/bin/python scripts/validation/verify_solar26_observation_source.py
# All1800angular cells,1440time bins and3independent UTC conversions pass.
git diff --check
# Pass.
```

The earlier module-form unittest invocation failed because the existing
`scripts.skydata` package imports SQLAlchemy, absent from system Python. The
documented direct-file invocation above runs the full ten tests successfully;
that unrelated package import was not changed or silently counted as a pass.

Machine-readable independent results:
[`observations-independent-numerics.json`](observations-independent-numerics.json).
No implementation file belonging to the observation author was changed by this
reviewer. Docker/browser/source-release/owner acceptance remain parent/owner gates.
