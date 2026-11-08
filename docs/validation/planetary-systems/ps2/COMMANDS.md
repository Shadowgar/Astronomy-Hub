# PS2 commands and evidence

Worktree `.worktrees/ps2-major-moon-systems-1`, basePS1 `36426905`.
Host Node22.22.0 and repository Python environment; dependency locks unchanged.
Commands run from the worktree. New task containers are `oras-ps2-backend` and
`oras-ps2-preview`, independently cloned from PS1 configuration with only this
worktree,4224port and read-only Horizons release substituted. No prior service
was restarted or altered. Only the new PS2 backend is restarted after its code changes.

```sh
/home/rocco/Astronomy-Hub/.venv/bin/python -m pytest backend/tests/test_horizons_systems.py -q -W error
/home/rocco/Astronomy-Hub/.venv/bin/python -m pytest backend/tests/qualification/horizons_full_source.py -q -W error
docker exec -w /work oras-ps2-backend python -m pytest backend/tests/test_horizons_systems.py backend/tests/test_planetary_systems.py backend/tests/test_planet_view.py backend/tests/test_solar_exploration.py -q -o cache_dir=/tmp/ps2-pytest
npm --prefix frontend test -- --run
npm --prefix frontend exec tsc -- -b --pretty false
npm --prefix frontend run build -- --outDir ../output/planetary-systems/hub --emptyOutDir
npm --prefix frontend run build -- --outDir ../output/planetary-systems/hub-repeat --emptyOutDir
node scripts/validation/verify_ps2_systems.mjs
node scripts/validation/verify_ps2_material_lifecycle.mjs
node scripts/validation/measure_ps2_systems.mjs
python3 scripts/validation/verify_ps2_delivery.py --candidate
```

Pinned repeat container build uses the same absolute source path, as PS1's retained
path-relocation investigation requires, with no network or dependency installation:

```sh
docker run --rm --network none --user 1001:1001 \
 --mount type=bind,src=/home/rocco/Astronomy-Hub,dst=/home/rocco/Astronomy-Hub,readonly \
 --mount type=bind,src="$PWD/output/planetary-systems/hub-container",dst=/output \
 --tmpfs /home/rocco/Astronomy-Hub/frontend/node_modules/.vite-temp:uid=1001,gid=1001 \
 --workdir "$PWD/frontend" \
 node:24.14.0-bookworm-slim@sha256:d8e448a56fc63242f70026718378bd4b00f8c82e78d20eefb199224a4d8e33d8 \
 npm run build -- --outDir /output --emptyOutDir
```

Scoped shell escalation was necessary because the sandbox process launcher failed;
it did not authorize changes to unrelated workloads. Source data, previews and all
existing settings/volumes were preserved. Candidate receipts are explicitly marked;
postcommit verifier is run without `--candidate` and recorded in draft delivery.

## Final results

- New host source/route tests:18passed with warnings as errors. Full preserved-source qualifier:2passed, covering20,832midpoints and38quarter comparisons.
- Isolated Docker combined science:65passed,7inheritedwarnings (Starlette, Skyfield/NumPy and HTTPX); not warning-clean.
- Frontend370passed in58files; TypeScriptpassed (run from frontend with installed TypeScript `tsc -b --pretty false`).
- Final actual five-system×three-viewport journeys:15passed,60assertiongroups; no page errors, source hashes unchanged.
- Actual Mars/material/lifecycle/path regression:5passed; source and served hashes unchanged. Finite-boundary review red/green:bothpublicendpoints200 and earliestUIready aftercorrection.
- Software-renderer performance:10cases,48.34–60.00Hz observed browsercadence;0additionalidleframes each. ANGLESwiftShader, GPUtimerextensionunavailable; noGPUexecutiontimings claimed.
- ThreeidenticalHubbuilds andservedbytes:142files; preservednativeMoon4,Earth514,Sky111files; originalsourceimages,pins,protectedsource andreadonlymountspass.
- WindowsHTTP200 on4224. Primaryownercheckout retains only pre-existing `.vscode/settings.json` edit. NoDBbytesnapshotclaim.

Original successful desktop/portrait evidence before the harness's hidden-button failure remains historical. Final15-case run supersedes it; no failed run is relabeled as passing. Browser material checks retain their precise source identity and are reused across the later backend-only inward-coverage correction. No asset or renderer byte changed after those checks.
