# Windows performance qualification

Same fixed Earth approach, paused UTC.40warm-up+200real camera-input RAF frames; no screenshot/video/concurrent browser during measurements. CPU/GPUrolling180samples distinct from RAF200intervals. Mobile dimensions emulate desktopGPU, not physicaldevices.

Windows Edge on NVIDIA RTX3060 laptop GPU. Twelve actual moving-camera cases passed. Phone-size layouts use this desktop GPU; physical iPhone remains unverified.

| Layout / quality | Custom CPU median / p95 ms | Takram CPU median / p95 ms | Custom GPU median / p95 ms | Takram GPU median / p95 ms | RAF median / p95 ms |
|---|---:|---:|---:|---:|---:|
| desktop / balanced | 0.90 / 1.40 | 1.10 / 1.60 | 0.80 / 0.82 | 1.32 / 1.34 | 6.90 / 7.00 |
| desktop / efficient | 0.80 / 1.10 | 0.90 / 1.30 | 0.22 / 0.91 | 0.18 / 0.22 | 6.90 / 7.00 |
| portrait / balanced | 0.90 / 1.10 | 1.00 / 1.20 | 0.47 / 1.32 | 1.18 / 1.49 | 6.90 / 7.00 |
| portrait / efficient | 0.80 / 1.20 | 0.80 / 1.10 | 0.40 / 0.91 | 0.39 / 0.89 | 6.90 / 7.10 |
| landscape / balanced | 1.10 / 1.80 | 1.20 / 1.70 | 0.38 / 0.40 | 0.46 / 0.48 | 6.90 / 7.00 |
| landscape / efficient | 0.80 / 1.20 | 0.80 / 1.20 | 0.39 / 0.84 | 0.38 / 0.87 | 6.90 / 7.00 |

Efficient mode intentionally uses the explicit fallback, so its “Takram” selection does not mean the atmosphere pass was active. Balanced comparisons use the same source epoch and initial camera; actual orbit input advances the same sequence. No frame-rate claim is derived from inverse GPU time.

Lookup assets total8,527,872bytes. Cold first-run table initialization measured1,075.6ms; later cache-disabled browser-context measurements288.0–352.3ms, with host/OS caches still possible. Startup, resources, target-byte estimates, asset ownership and raw samples are retained in `performance.json`. Target-byte estimates are tracked attachments, not total hardware VRAM.

Terrain timing/cache/LOD evidence is recorded separately in the actual Windows terrain receipt; its sourcepack47,728,870bytes is streamed by visible tiles, not loaded as one geometry. Reduced-motion, touch, cache eviction, context loss and disposal are correctness checks, not claims about a physical phone.
