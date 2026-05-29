# DSO Recovery Checkpoint - 2026-05-28

## Current Production State

- Frontend image rebuilt and recreated.
- Live runtime JS: `app.c48c01a3.js`.
- DSO now uses pack-based source behavior (base + extended), with root disabled.
- Root DSO source is disabled.
- Base DSO source is enabled.
- Extended DSO source is enabled for parity validation.
- Live validation found no legacy `/skydata/dso` requests.
- Live validation found no base `Norder2+` requests.
- Live validation found no DSO pending/hung requests.
- No `.eph` `200 text/html` corruption observed.
- DSO progress-bar behavior remains upstream-style with no forced visibility timer.

## Source Fix

Source file changed:

`vendor/stellarium-web-engine/apps/web-frontend/src/App.vue`

The rebuilt runtime now registers:

`skydata/packs/base/dso`
`skydata/packs/extended/dso`

It no longer registers:

- `skydata/dso`
- every pack DSO root automatically

Star registration was preserved.

## Reason For Fix

The legacy root DSO source used:

`hips_order = 0`

In this Stellarium code path, `hips_order = 0` is treated as effectively unset/unbounded because the upper-order guard only activates when `hips->order` is nonzero.

That allowed the legacy root DSO source to request `Norder1+` even though the root DSO data only had `Norder0`.

The base and extended pack DSO sources use explicit bounded orders:

`hips_order = 1`
`hips_order = 3`

and are used in place of the unbounded root DSO source.

## Current DSO Runtime Metadata State

Expected live results:

- `/oras-sky-engine/skydata/dso/properties` -> `404`
- `/oras-sky-engine/skydata/packs/base/dso/properties` -> `200`, includes `hips_order = 1`
- `/oras-sky-engine/skydata/packs/extended/dso/properties` -> `200`, includes `hips_order = 3`

Current file-state intent:

- `frontend/public/oras-sky-engine/skydata/dso/properties` disabled
- `frontend/public/oras-sky-engine/skydata/packs/base/dso/properties` enabled
- `frontend/public/oras-sky-engine/skydata/packs/extended/dso/properties` enabled

## Do Not Regress

Do not re-enable root + base together.

Do not re-enable legacy root DSO as a default source.

Do not add any artificial loader visibility timer or fake progress hold.

Do not add automatic DSO registration for every pack root.

Do not assume `hips_order = 0` clamps traversal.

## Known Unrelated Issues

The following are not part of the DSO recovery:

- transient DSS properties `net::ERR_ABORTED`
- satellite position errors
- DESI HiPS provider work
- build performance problems on the NTFS external drive

## Next Separate Work Items

Future work should be split into separate tasks:

1. DESI optional HiPS provider validation.
2. DSS transient abort cleanup.
3. Satellite position error cleanup.
4. Build/deployment workflow hardening.
