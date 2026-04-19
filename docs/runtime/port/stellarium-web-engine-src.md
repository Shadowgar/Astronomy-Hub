# Stellarium Web Engine — source reference (for port contracts)

This file gives an **authoritative Git reference** and **paths** into the Stellarium Web Engine C sources used by **`module-inventory.md`**. It exists so **`BLK-003`** can be closed without vendoring C files into Git when **`/study`** is gitignored (local checkouts remain optional).

## Upstream

- **Repository:** [github.com/Stellarium/stellarium-web-engine](https://github.com/Stellarium/stellarium-web-engine)
- **Pinned commit (local vendor snapshot):** `63fb3279e85782158a6df63649f1c8a1837b7846`  
  - Raw prefix: `https://raw.githubusercontent.com/Stellarium/stellarium-web-engine/63fb3279e85782158a6df63649f1c8a1837b7846/`

## Layout

After cloning or extracting the archive, sources live under:

`src/` (repository root)

A common local layout in this repo (gitignored) is:

`study/stellarium-web-engine/source/stellarium-web-engine-master/src/`

## Module 2 (`module2-stars-full`) — inventory paths

| Inventory row | Path under `src/` |
|---|---|
| `src/hip.c` | `hip.c` |
| `src/hip.h` | `hip.h` |
| `src/modules/stars.c` | `modules/stars.c` |
| `src/algos/bv_to_rgb.c` | `algos/bv_to_rgb.c` |

Example raw URL for `bv_to_rgb.c`:

`https://raw.githubusercontent.com/Stellarium/stellarium-web-engine/63fb3279e85782158a6df63649f1c8a1837b7846/src/algos/bv_to_rgb.c`

## Note on `/study` and Git

The repo root **`.gitignore`** includes `/study`, so local trees are not committed. Port work should still treat the **GitHub revision above** as the contract reference; CI and reviewers can fetch via raw URLs or clone at the pinned commit.
