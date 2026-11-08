# Cross-mode reference and actual comparison gallery

Open `http://127.0.0.1:4216/evidence/cinematic-hub/gallery/index.html`.

This versioned assembly preserves original bytes and evidence attribution; it does not confer visual acceptance. The owner-approved Solar primary, Earth and Sky PNGs are copied byte-for-byte and verified against their committed manifest. Each asset has a copied-file SHA256, original source path, dimensions, evidence class and containing evidence commit in `manifest.json`.

Evidence classes remain distinct:

- **Approved reference:** original illustrative concept, with no scientific truth inferred from its labels or arrangement.
- **Historical b68:** actual retained before screenshots. The historical baseline is never relabeled as a fresh integrated pass.
- **Package actual:** actual Solar, Earth or Sky browser captures retained in the separately reviewable packages. Exact runtime source attribution follows the recorded file-hash evidence; the containing evidence commit is not invented as the original capture commit. Earth desktop/mobile precede the scoped compact correction; its provenance remains explicit in the package README.
- **Integrated capture:** separately identified actual final-integration journey screenshots. Their proof status is displayed at assembly and is not inferred from image presence. `RUNNING`, `FAIL` or missing proof does not mean qualified. Refresh the gallery after final source freeze.

The original concepts and actual captures have different native dimensions. The gallery uses `object-fit:contain`, preserves bytes, labels widths, and links full resolution. It does not crop, repaint or stretch images to make a match appear stronger. Package desktop/mobile and short-screen groups remain separate. Actual short Earth/Sky667×390 baseline captures have now been added from the preserved4211 b68 preview; no baseline is fabricated. Solar Saturn did not exist in R3-A, so its expanded view has no invented before capture; Earth collapsed provides a matched Solar body comparison.

## Remaining fidelity and qualification gaps

| Mode / area | Delivered visible direction | Specific remaining limit |
| --- | --- | --- |
| Solar composition | Shared compact brand/glass UI, real Inner and Full views, all eight planets, selected body cards and authored rings/materials | Real source geometry cannot reproduce the concept's artistic planet order/placement. Inner views can clip outer bodies; Full view makes inner bodies small. Exaggerated display radii remain disclosed. |
| Solar appearance / belt | Distinct major planets, static historical Earth clouds, original NASA Mars mapping, sparse depth and belt controls | Six new materials and Saturn rings are procedural illustrations, not current weather or precise orientation. Aggregate belt particles have no catalog identity or qualified epoch; identified asteroids remain unavailable. |
| Earth composition / search | Direct location search, globe-led native Cesium view, contextual tools and selected-location summary | Native imagery/source availability, epoch, coverage and camera frame differ from the concept. No decorative weather, invented city lights, unsupported terrain or Google-level imagery claim. |
| Earth selected details | Matched address/coordinate context, collapsed/expanded real location panels and source dialog | Unknown elevation, population, weather and imagery age remain unavailable. Compact search/tool corrections have scoped package evidence; final integrated qualification is separate. |
| Sky composition / observing | Native Stellarium sky/search/settings, Pennsylvania horizon, compact branded tools and selected Sirius details | Real sky, illumination and native source availability differ from the illustrative nebula/Jupiter arrangement. No moved objects or decorative astronomical image replaces actual sky. |
| Sky layout / input | Native source-backed selection, observer/time controls and mobile sheets | Package captures precede final keyboard/credits/chooser corrections. Later integrated/reviewer captures must be considered separately; they are not retroactively applied to package images. |
| Cross-mode cohesion | One compact brand, shared materials and contextual controls, native renderer boundaries retained | Side-by-side differences remain visible in native controls, information density and short-screen layout. Owner comparison and visual acceptance remain pending. |
| Performance / devices | Explicit display quality/LOD and recorded software browser evidence | SwiftShader CPU submission and browser timing do not certify GPU frame time, FPS, physical mobile devices or owner acceptance. |

The frozen package scene time is 2026-02-28 UTC. Earth live-source update times remain distinct from the shared astronomical epoch. Scene/navigation assertions and source identity are recorded in the relevant package and final journey proofs.

## Refresh after final source freeze

From `.worktrees/cinematic-hub-integration-1`:

```bash
python3 output/cinematic-hub/gallery/build-gallery.py
```

The builder copies available final journey images from `output/cinematic-hub/navigation/` into the **integrated** class and carries the journey proof status. Reviewer proof is retained separately under the foundation worktree's `output/cinematic-hub-review`; do not label a reviewer diagnostic screenshot as a general final layout pass without checking its recorded source and purpose. Root may curate/version the finished gallery after review.
