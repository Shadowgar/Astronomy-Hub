# Independent atmosphere and integration review

Review by the lunar-source implementer, who did not author the atmosphere,
Earth-frame, render-pipeline or root integration changes. No implementation
changes were made in this review. Review scope covers `solarTakram.ts`,
`solarRenderPipeline.ts`, `SolarScene.ts`, `SolarWorkspace.tsx`, Earth approach,
Vite dependency resolution, Docker recipes and source reconstruction.

## Findings and disposition

1. **P1, fixed and independently checked:** the original production Docker
   install layer copied only the Hub manifests, so its new postinstall failed
   before the graphics lockfile existed. `production-install-review.json`
   preserves the exact failing fixture command and EUSAGE output. Root added
   the graphics manifests before installation in both production recipes and
   supplied the previously omitted `runtimes/shared/glass.css` build source in
   development/production recipes, with a narrow Docker context whitelist.
   `output/solar21-docker-build-retry.log` records the successful actual Docker
   build. Independent inspection of image
   `sha256:d5087900bd743dc789b858e3ac9202e698ae77fe4d7b1858b4d7dfde52795cd8`
   found both installed graphs, the 1,361-byte shared stylesheet, and the
   regenerated terrain manifest `3cfcbb6c270bbe1df4eadfacefc143e2843d5cd1d18994a72f6fb1c9ce3c3543`.
   The successful build retains Vite's large-chunk advisory. This image predates
   the final atmosphere review correction and does not qualify that later code.

2. **P2, fixed and independently checked:** enabling Takram
   geometric correction on a shared solar depth buffer projected distant
   opaque objects onto the Earth sphere. The exact installed-library and shader
   arithmetic reproduction is
   `node scripts/validation/review_solar21_atmosphere_geometry.mjs`; its retained
   output is `atmosphere-geometric-correction-review.json`. A physical ray with
   6,390 km impact radius, inside a 42-degree camera frustum at 20,000 km
   altitude, incorrectly became a ground-intersecting evaluation ray. The
   [pinned upstream README](https://github.com/takram-design-engineering/three-geospatial/blob/b012ad06d858fc035d88aacfd73f092f93c994e4/packages/atmosphere/README.md)
   recommends disabling this correction for objects in space. The author has
   now disabled it and routes opaque objects beyond the atmosphere through the
   upstream sky transmittance/radiance function. Independent rerun:

   ```sh
   node scripts/validation/verify_solar21_takram.mjs http://127.0.0.1:4235 output/playwright/solar21-independent-atmosphere/takram-gpu.json
   ```

   PASS in Chromium/SwiftShader: all seven views active, no console/WebGL errors,
   foreground color unchanged, and opaque/background maximum channel difference
   reduced from the retained red result of 35 to zero at a 6,388,680.77 m ray
   impact parameter. Disposal leaves zero textures/geometries. The compact
   receipt `atmosphere-independent-fix-review.json` records exact reviewed source
   hashes. Full and atmospheric captures were visually inspected; the controlled
   fixture's coarse sphere facets are visible and are not an application quality
   claim. The actual application has a separate higher-resolution Earth sphere.

3. **Root-found P1, fix independently checked:** the product route shared its
   path with the terrain asset directory. nginx's directory redirect exposed
   internal port 8877. Exact no-slash and trailing-slash locations now serve the
   SPA entrypoint, while child asset paths retain strict missing-file handling.
   Private Docker nginx was checked with redirects disabled at
   `http://127.0.0.1:4231`. Both routes return 200 HTML with no Location header;
   the tileset and root GLB return 200 assets; an absent GLB returns 404. The
   five response records and nginx source hash are in
   `terrain-nginx-independent-review.json`. The equivalent bounded checks are:

   ```sh
   curl --head http://127.0.0.1:4231/planet-terrain/apollo17-nac-v1
   curl --head http://127.0.0.1:4231/planet-terrain/apollo17-nac-v1/
   curl --head http://127.0.0.1:4231/planet-terrain/apollo17-nac-v1/tileset.json
   curl --head http://127.0.0.1:4231/planet-terrain/apollo17-nac-v1/tiles/0/0/0.glb
   curl --head http://127.0.0.1:4231/planet-terrain/apollo17-nac-v1/missing-review.glb
   ```

## Dependency and build boundary

The Hub remains React 18.3.1. The isolated graphics install contains React
19.3.1 and React Three Fiber 9.8.2 to satisfy upstream required peers; claiming
that no React 19 or R3F package is installed would be incorrect. No `--force`,
peer override or ignored peer failure is used. Installed `npm ls --all
--omit=dev --json` succeeds with no dependency problems. The application uses
vanilla imports, and the actual production module graph excludes the isolated
React/R3F modules:

```sh
node scripts/validation/review_solar21_graphics_bundle.mjs > docs/validation/solar-system-2.1/graphics-bundle-independent-review.json
```

Result: 195 bundled modules, 12 from the graphics installation, zero graphics
React/R3F modules. The receipt records exact manifest/lock/config hashes and
all bundled Takram module paths. This check builds in memory without writing
application output. The pinned Three version is 0.180.0 in both installs and
Vite resolves/deduplicates the application graph to the root copy. Source
reconstruction now explicitly installs the graphics graph because its regular
install command disables lifecycle scripts. A full source-distribution
reconstruction was not rerun by this reviewer.

## Other inspected contracts

- Source AU coordinates are rebased in CPU doubles, then the camera-relative
  raster scene and clipping planes are temporarily converted to metres. The
  render `finally` path restores AU scene/camera values. Earth-fixed scattering
  uses the corresponding metre-valued rotation/translation and source Sun
  direction. The HDR path retains one final tone/color transform.
- The adapter owns bounded hashed lookup textures and its targets, cancels
  acquisition on disposal and releases resources on context loss. It owns no
  animation loop; fallback preserves the original scene buffer.
- Earth collision clearance is 1 km above the mean-radius sphere, selected
  Earth near clipping is 100 m, and orbit minimum distance is radius plus 1 km.
  Other bodies retain their existing two-percent clearance. The whole motion
  segment remains collision checked. This permits atmospheric approach without
  asserting terrain clearance. The illustrative cloud shell is hidden when
  the camera is inside it; its historical cloud texture remains available for
  the existing surface shading.
- DOM markers are tested against displayed opaque sphere radii; foreground,
  tangent and behind-globe cases behave as intended. Frame, motion, approach
  and adapter focused tests pass 18/18 with the command recorded in
  `EARTH_FRAME_REVIEW.md`.

No additional P0/P1 scientific or lifecycle defect was found within this
bounded review. Browser/device and owner visual acceptance remain separate.
