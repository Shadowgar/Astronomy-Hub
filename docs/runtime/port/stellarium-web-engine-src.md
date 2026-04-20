# Stellarium Web Engine — source reference (for port contracts)

This file gives an **authoritative Git reference** and **paths** into the Stellarium Web Engine C sources used by **`module-inventory.md`**.

## Upstream

- **Repository:** [github.com/Stellarium/stellarium-web-engine](https://github.com/Stellarium/stellarium-web-engine)
- **Pinned commit (local vendor snapshot):** `63fb3279e85782158a6df63649f1c8a1837b7846`  
  - Raw prefix: `https://raw.githubusercontent.com/Stellarium/stellarium-web-engine/63fb3279e85782158a6df63649f1c8a1837b7846/`

## Layout

For parity references, treat the pinned repository layout as canonical:

`src/` (repository root)

## Module 2 (`module2-stars-full`) — inventory paths

| Inventory row | Path under `src/` |
|---|---|
| `src/hip.c` | `hip.c` |
| `src/hip.h` | `hip.h` |
| `src/modules/stars.c` | `modules/stars.c` |
| `src/algos/bv_to_rgb.c` | `algos/bv_to_rgb.c` |

Example raw URL for `bv_to_rgb.c`:

`https://raw.githubusercontent.com/Stellarium/stellarium-web-engine/63fb3279e85782158a6df63649f1c8a1837b7846/src/algos/bv_to_rgb.c`

## Simple HTML toolbar assets (vendored in Hub for UI port)

The upstream demo ships toolbar SVGs under:

`apps/simple-html/static/imgs/symbols/`

Astronomy Hub copies selected icons into `frontend/public/stellarium-web/` (same pinned commit) for the sky viewport chrome; see **`frontend/src/pages/stellariumWebUiAssets.ts`** and evidence **EV-0053**.

## Reference usage rule

Port work should treat the pinned GitHub revision above as the contract reference. Runtime and active tooling in Astronomy Hub must remain self-contained and must not require a local external source tree.
