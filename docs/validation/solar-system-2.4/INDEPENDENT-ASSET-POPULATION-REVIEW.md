# Independent Solar 2.4 asset and population review

Reviewer: science/backend agent, separate from the asset and population implementation authors. Reviewed the current uncommitted Solar 2.4 scope on `recovery/reconcile-20261026` above starting HEAD `fc1a7142b35ca791ffeddef810c93a244ad32769`. This review does not independently approve this reviewer's own destination backend or the whole PR.

## Asset scope and result

Inspected `scripts/planetdata/build_solar24_assets.py`, `test_solar24_assets.py`, the delivered v2.4 manifest, original PDS map labels, shape/source metadata, physical frame pins, and the independent CSPICE reference matrices. Independently ran:

```sh
output/playwright/solar-system-2.4/asset-tools-venv/bin/python scripts/planetdata/test_solar24_assets.py
```

**7 tests pass**. The tests and review establish:

- Eros, Vesta, 67P and historical Halley source coordinates are retained in kilometers without radius normalization; facets/topology and source uncertainty remain explicit.
- Pluto and Charon use their actual PDS center-meridian/grid metadata (180° and 0° respectively), planetocentric positive-east coordinates, original coverage holes and reference sphere radii. No invented southern imagery or relief is introduced.
- Vesta's Dawn rotation source and Eros's PDS companion rotation model match the exact mesh frame pins. Independent source-model evaluation is distinct from contemporary observational orientation accuracy.
- Pluto/Charon meridian registration, Ceres VTAD registration, 67P/Halley rotational phases and original coverage limitations are disclosed rather than silently promoted to measured current states.
- Source hosts, lengths and digests are pinned. Existing differing derivatives fail closed. Runtime images are bounded and no unqualified high-resolution detail is invented.
- PDS and NASA source/attribution links are retained. The [PDS archive policy](https://pds-ppi.igpp.ucla.edu/faq.jsp) explicitly describes archived datasets as public-domain material and requests appropriate citation; [NASA's Ceres product](https://science.nasa.gov/resource/ceres-3d-model/) identifies the source download. No source-specific conflicting restriction was found in the reviewed metadata.

One minor accounting defect was found at the builder's `raw_total` calculation: source labels/PCK/overview documents were excluded from the reported aggregate. The asset author added the document subtotal and a regression. Independent re-check: **127,851,397 raw bytes**, including **82,498 document bytes**, still below 256 MiB; image/model derivatives remain unchanged and 7 tests pass. This was not an observed memory/capacity breach.

No remaining confirmed P1/P2 source-geometry, frame, coverage, rights or bounded-acquisition defect was found in this scope. This is not a visual acceptance verdict; browser output, actual GPU behavior and product disclosure placement remain the parent's validation responsibility.

## Population scope and result

Inspected the new backend service/schema/router, `acquire_solar24_populations.py`, frontend `solarPopulations.ts`, `solarPopulation.worker.ts` and focused tests. Stable identities stay strings; exact source-index mapping survives searches and transferable buffers. The approximate ellipse solver rejects unsupported conics and all comets. Comet catalog records can join the independently qualified precise destination service without manufacturing population positions. Subset selection, absent TNO dynamical subclassification, ±180-day policy and non-population-wide accuracy are disclosed.

The backend pins and validates immutable source bytes before supplying a response. The worker bounds response size, checks source identity/frame/domain, fences stale asynchronous loads, and returns buffers rather than transferring the full catalog to the main thread. The scientific rotation into ICRF and analytic velocity units match the independent reference fixture. No confirmed P1/P2 defect was found in the reviewed scope.

Independent supporting commands:

```sh
/home/rocco/Astronomy-Hub/.venv/bin/python -m pytest -q backend/tests/test_solar_populations.py
cd frontend
npm test -- --run tests/solarPopulations.test.ts
```

Results: **26 backend tests passed**, **8 frontend tests passed**. These do not establish accuracy for every population member or every epoch and do not establish worker performance on a physical device. The parent owns integration/lifecycle and Windows GPU evidence.

The later population presentation additions were separately inspected: `SolarPopulationLayer.ts` and `SolarPopulationExplorer.tsx`. Review checked high/low AU subtraction before the compositor's model-view transform, retained symbolic units, stable picking/source indices, category/seek generations, one outstanding evaluation, visible source-epoch lag, the 500 ms stale-display limit, worker/geometry/material/timer disposal and stale detail suppression. No additional confirmed P1/P2 defect was found in these scoped flows. The parent integration must still supply the documented camera-relative AU camera and respect opaque-body picking precedence.

Independent command `cd frontend && npm test -- --run tests/solarPopulations.test.ts tests/solarPopulationLayer.test.ts tests/solarPopulationExplorer.test.ts`: **17 tests passed across 3 files**. This supplements the earlier 8-test worker-only result; it is not GPU evidence.
