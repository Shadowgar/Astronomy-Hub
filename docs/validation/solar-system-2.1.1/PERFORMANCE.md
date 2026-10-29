# GPU cost — actual Windows comparison

Same fixedEarth approach, paused2026-10-27T04:00:00Z. Actual visible WindowsEdge
and NVIDIA RTX3060/D3D11,40warmup+200camera-inputRAFframes percase,180rolling
CPU/GPU samples. No concurrent browser/screenshots/video/tests during these Earth
measurements.12before+12after cases PASS; sourcepositions unchanged, one output
transform and actualTakram on Balanced. Efficient intentionally retains its
existing custom fallback. This is a single-run comparison, not a statistical
performance bound or physicalphone qualification.

| Layout / quality / method | CPU median before→after ms | GPU median before→after ms | GPU p95 before→after ms | RAF median before→after ms |
|---|---:|---:|---:|---:|
|desktop/balanced/custom|0.900→1.000|1.264→0.945|1.300→0.990|6.900→6.900|
|desktop/balanced/takram|1.200→1.200|0.922→0.892|0.943→0.927|6.900→6.900|
|desktop/efficient/custom|0.800→0.800|0.160→0.240|0.263→0.953|6.900→6.900|
|desktop/efficient/takram|0.800→0.900|0.217→0.172|1.054→1.383|6.900→6.900|
|portrait/balanced/custom|0.900→0.900|0.449→0.478|0.479→0.531|6.900→6.900|
|portrait/balanced/takram|1.000→1.000|0.488→0.458|0.521→0.494|6.900→6.900|
|portrait/efficient/custom|0.900→0.700|0.359→0.374|0.843→0.894|6.900→6.900|
|portrait/efficient/takram|0.700→0.700|0.186→0.168|0.884→0.195|6.900→6.900|
|landscape/balanced/custom|1.000→1.100|0.374→0.380|0.394→0.406|6.900→6.900|
|landscape/balanced/takram|1.100→1.400|0.473→0.389|0.498→0.425|6.900→6.900|
|landscape/efficient/custom|0.800→1.100|0.139→0.371|0.162→0.857|6.900→6.900|
|landscape/efficient/takram|0.800→1.400|0.344→0.175|0.849→0.291|6.900→6.900|

Raw before/after receipts: [before](evidence/performance-before.json),
[after](evidence/performance-after.json). GPU timings are timer-query durations,
CPU timings are render submission intervals, and RAF is browser scheduling; do
not invert one of these numbers into an asserted FPS. No extra pass or texture
is added by the Earth precision correction.

Terrain adds a small static384×384MooncontextPNG in the DOM, not anotherWebGL
renderer. The survey canvas is smaller, so its work/refinement differs from the
old full-window surface; this is a deliberate context layout, not a reduced
render scale. Balanced/Efficient pixel-ratio policies remain unchanged. The final
Windows journey records actual terrain GPU/CPU/RAF timing and geometry budgets
([receipt](evidence/terrain-windows.json)); these runs include recording and
interaction and are not directly comparable to the dedicated Earth benchmark.

| Terrain viewport | Balanced orbit GPU median / p95 ms | Efficient relief orbit GPU median / p95 ms |
|---|---:|---:|
|1440×900|0.287 / 2.307|0.255 / 1.085|
|390×844|0.208 / 2.407|0.073 / 2.606|
|844×390|0.079 / 1.932|0.179 / 1.858|
