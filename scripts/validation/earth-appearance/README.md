# C5.7-D matching-camera visual proof

This isolated browser harness imports the actual Hub ViewerController; it does
not expose a Viewer in the product or alter the runtime bridge. The baseline is
the exact merged-main controller at `eea3e295ed5d234edae9053b3119f61e15e8371b`.
Both variants use the same existing bundled Natural Earth fallback, scene UTC and
camera. These images do not demonstrate new imagery, terrain or physical devices.

From an isolated checkout with the existing root Playwright dependencies installed:

```sh
python3 scripts/validation/earth-appearance/prepare.py /tmp/c57d-proof-review
docker run -d --name oras-c57d-proof-review -p 127.0.0.1:4192:4192 \
  -v /tmp/c57d-proof-review:/proof:ro \
  -v "$PWD:/hub:ro" -v /var/tmp/oras-cesium/gods-eye:/source:ro \
  node:24.14.0-bookworm-slim@sha256:d8e448a56fc63242f70026718378bd4b00f8c82e78d20eefb199224a4d8e33d8 \
  node /source/node_modules/vite/bin/vite.js --configLoader native --config /proof/vite.config.mjs
node scripts/validation/earth-appearance/capture.mjs baseline
node scripts/validation/earth-appearance/capture.mjs star-only
node scripts/validation/earth-appearance/capture.mjs proposed
```

The baseline command deliberately exits nonzero on the missing/disabled skybox
assertion after capturing four views. Proposed must pass. JSON evidence includes
actual camera/time/settings, source input hash, network requests and cleanup.
PNG/JSON outputs: `output/playwright/c57d/`. Browser launch explicitly uses
ANGLE SwiftShader; physical GPU/mobile/Apple acceptance remains outstanding.
The production Docker artifact has separate full-byte serving/rollback checks;
the harness is visual comparison evidence, not artifact or feed qualification.
