# Investigation attempts and limits

- The first image-analysis helper could not import Pillow (`ModuleNotFoundError`).
  No dependency was installed. The final probe uses Chromium's native PNG decode
  and an offscreen analysis canvas, which is never attached to the application.
  It compares captured screenshots; it does not overlay or modify rendered Sky.
- The first architecture-doc check ran before this new evidence target existed
  and reported its missing relative link. After creating the report, the checker
  passes; its initial output is retained as `architecture-docs-incomplete-target.txt`.
- Initial exploratory browser runs and the final asserted script all found the
  same ineffective public-color property. The final run is recorded in
  `native-api-investigation.json`, `pixel-comparison.json` and `investigation.log`.
- Temporary public-property probing occurs only in an isolated browser page. The
  property is restored before closing; native files, settings and served artifacts
  are never changed. No software fallback or native memory offset is used.
- No dark horizon implementation exists. Required successful dark-ground visual
  matrix, day/night, above-horizon object/occlusion and standalone qualification
  are not claimed. Existing navigation journeys exercise current green-ground
  controls and lifecycle only.
- Existing Chromium software rendering and touch/mobile emulation remain distinct
  from physical device qualification. Owner scrolling acceptance is the owner's
  explicit decision at `301f9eb3`, not inferred from these tests.
- No native build or Earth rebuild was performed. The unchanged Hub was rebuilt
  into a separate temporary directory, matches the served bytes and was not
  promoted. Existing Docker runtime/served-artifact checks are authoritative.
- Initial staged whitespace check found two captured logs with blank final lines.
  Their committed copies now trim only trailing blank lines; original output remains
  under `output/n1/horizon/`. The final whitespace check is rerun before delivery.
