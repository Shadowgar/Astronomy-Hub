# Independent native/Skyfield trajectory comparison

Parent browser status: **PASS**. Scientific comparison uses retained motion samples only.
Input proof SHA256: `8ff7e45439ce5b00d908a48f117b3a38cc6c8f14731d5d78883d5e614eacdce2`.

| Viewport | NORAD | Samples | Native displacement ° | Geometric displacement ° | Native/geometric residual arcsec |
|---|---|---:|---:|---:|---:|
| 1440×900 | 61045 | 5 | 6.407122 | 6.407142 | 61.904–62.078 |
| 390×900 | 61045 | 5 | 6.422824 | 6.422834 | 61.921–62.096 |
| 667×390 | 61045 | 5 | 6.409757 | 6.409768 | 61.911–62.047 |

Frozen speed0 states are independently compared without modifying advancing samples:

| Viewport | Capture | UTC | Geometric residual arcsec | Apparent residual arcsec |
|---|---|---|---:|---:|
| 1440×900 | initial | 2026-10-25T10:22:00.000Z | 61.913 | 57.927 |
| 1440×900 | pointBefore.state | 2026-10-25T10:22:00.000Z | 61.913 | 57.927 |
| 1440×900 | pointAfter.state | 2026-10-25T10:22:08.063Z | 61.967 | 57.935 |
| 390×900 | initial | 2026-10-25T10:22:00.000Z | 61.913 | 57.927 |
| 390×900 | pointBefore.state | 2026-10-25T10:22:00.000Z | 61.913 | 57.927 |
| 390×900 | pointAfter.state | 2026-10-25T10:22:08.054Z | 61.921 | 57.889 |
| 667×390 | initial | 2026-10-25T10:22:00.000Z | 61.913 | 57.927 |
| 667×390 | pointBefore.state | 2026-10-25T10:22:00.000Z | 61.913 | 57.927 |
| 667×390 | pointAfter.state | 2026-10-25T10:22:08.028Z | 61.946 | 57.916 |

Current UTC inventory at **2026-10-25T07:13:43.239200Z**: 6/155 above0°, 2/155 above15°; 0 sunlit above0°, 0 sunlit above15°. Observer Sun altitude -49.096°. All 155/155 elements within14days.

Residuals do not have a newly invented precision gate. Exact apparent/astrometric residuals, per-sample positions and trajectory displacement appear in `comparison.json`. No native brightness/pixel claim; future pass replay remains simulation. This does not change parent browser pass/fail status.
