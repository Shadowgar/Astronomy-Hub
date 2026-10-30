# Solar 2.2 private preview check — 2026-10-30

At the start of this phase, the existing preview was already available. No service
restart, reconstruction, mount change or nginx change was needed during P0.
`http://localhost:4231/solar-system` and all five requested routes were verified
in actual Windows Edge on the NVIDIA RTX 3060 Laptop GPU (ANGLE/D3D11).
This establishes current availability, not a proven cause or repair of the
owner's earlier outage. Owner visual acceptance remains open.

## Existing service evidence

Docker 29.1.3 and Ubuntu WSL2 are available. Both task containers have been running
since 2026-10-30T16:58:46Z, with prior FinishedAt 16:37:10Z, exit code 0,
OOMKilled=false and no recorded error. No Docker HEALTHCHECK is configured;
readiness was checked through the source-backed API and actual renderer.
Docker journal returned `-- No entries --` for the relevant time window.
A historical host/daemon interruption cannot be established from these records.
Both restart policies remain `no`, so daemon availability alone does not guarantee
a stopped preview starts. The command below addresses that bounded case.

Both container IDs, image IDs, start times, complete mount sets and HostConfig
remain unchanged. Every mount is read-only and every source exists. Backend has
no host-published port; preview publishes only `127.0.0.1:4231 -> 8877/tcp` on
`oras-repository-recovery-20261026`. Nginx configuration passes. Its default root
is `/owner-review/hub-solar211`, not the older `/frontend` mount. The original
baseline, Solar1, Solar2 and Solar2.1 host aliases all still return HTTP 200.

## Intended build proof

Baseline Git commit: `66fff05108ca7ed7ee0ee1d5137b4b2619c28373` on
`recovery/reconcile-20261026`. The preserved Docker build-proof image contains
368 matching tracked text/build inputs from that commit; six development/test
artifact files are absent as required by `.dockerignore`. All 26 compiled
JS/CSS/HTML files match the nginx disk root **and the actual HTTP response bytes**.
This is a source-to-build/runtime comparison, not a newly claimed archive build.

- `index.html`: `c011a38cece621673340964c5f1a6a098db460160f225de03b82c5d8c12b0776`
- `assets/index-BfEfyeNO.js`: `3418b957711eae8b9eceb4c8165fc4d4c7a98f53321c6fb2ca8f30dfe60764e0`
- `assets/index-DW8EKZre.css`: `1689ca6410a6bf656257879e514677f5d75183f33674078b1e8240e3e2bf9665`

## Recovery command

From this worktree in WSL:

```bash
python3 -B scripts/validation/recover_owner_preview.py
```

It checks Docker, both existing task labels, network, private port bindings,
read-only roots/mounts, mount presence and exit/health state before startup.
It starts only cleanly stopped existing task containers, waits for the scientific
Solar API before starting nginx, then verifies the proxy API and five routes.
Already-running services are untouched. It refuses missing, unsafe or failed
containers; it never recreates, changes restart policy, removes data or chooses
another artifact. Linux HTTP readiness does not certify Windows browser/GPU or
commit identity. Those require the separate checks recorded above.

## Validation and retained evidence

Exact repeatable commands from this worktree:

```bash
docker version --format '{{json .}}'
docker inspect pr107-owner-backend pr107-owner-preview
docker network inspect oras-repository-recovery-20261026
docker exec pr107-owner-preview nginx -T
journalctl -u docker --since '2026-10-30 16:20:00' --until '2026-10-30 17:05:00' --no-pager -n 150
python3 -B -m unittest discover -s scripts/validation -p test_recover_owner_preview.py -v
python3 -B scripts/validation/recover_owner_preview.py
python3 -B scripts/validation/recover_owner_preview.py
'/mnt/c/Program Files/nodejs/node.exe' "$(wslpath -w "$PWD/output/playwright/solar-system-2.2/preview/browser.mjs")"
'/mnt/c/Program Files/nodejs/node.exe' "$(wslpath -w "$PWD/output/playwright/solar-system-2.2/preview/finish-browser.mjs")"
git diff --check
```

Five helper tests PASS, including unsafe state rejection, missing Docker,
repeat-running idempotency and starting only the stopped backend. Both live
recovery runs exited 0, reported both services already running and returned all
five HTTP 200 responses. No intentional live outage was induced.

Windows proof: 18 successful captures, no page errors, all requested routes and
all gallery images loaded. Baseline epoch `2026-10-27T04:00:00.000Z`: desktop
1440x900 overview/Jupiter/Saturn/Mars/Earth/Sun; emulated portrait390x844 and
landscape844x390 overview plus four flagship planets. Exact camera, up, target,
source state and GPU are saved with every Solar capture. This is not physical
phone qualification. The first gallery helper waited on below-fold lazy images;
it was terminated, then the bounded corrected gallery pass loaded images eagerly.
This was a capture-script issue, not a demonstrated application outage.

Raw receipts, scripts and PNGs: `output/playwright/solar-system-2.2/preview/`.
Key files: `browser.json`, `http-artifact-identity.json`, `docker-source-identity.json`,
`containers-before.json`, `preservation.json`, `recovery-tests.txt`, and the two
`recovery-*.txt` live outputs. No files were committed or pushed by the P0 worker.
Next: independent helper review and Solar2.2 rendering qualification on the
preserved baseline. PR107 stays draft; no merge/deploy/publication occurred.
