# PS3 qualification commands

Worktree `.worktrees/ps3-planetary-integration-1`; basePS2 `26aa6111`.
Same Default Mode packs and loaded-document inventory as PS1; task-specific PS2/PS3
execution evidence extends the existing canonical plan, not a new roadmap.

```sh
PS_URL=http://127.0.0.1:4225 node scripts/validation/verify_ps3_cross_systems.mjs
node scripts/validation/verify_ps3_notice_history.mjs
PS_URL=http://127.0.0.1:4225 node scripts/validation/verify_ps3_earth_native.mjs
PS_URL=http://127.0.0.1:4225 PS_VIEWPORT=390x900 node scripts/validation/verify_planetary_systems.mjs
PS_URL=http://127.0.0.1:4225 PS_VIEWPORT=667x390 node scripts/validation/verify_planetary_systems.mjs
PS_URL=http://127.0.0.1:4225 node scripts/validation/verify_ps1_resilience.mjs
npm --prefix frontend test -- --run
# From frontend:
node node_modules/typescript/bin/tsc -b --pretty false
# From worktree:
npm --prefix frontend run build -- --outDir ../output/planetary-systems/hub --emptyOutDir
npm --prefix frontend run build -- --outDir ../output/planetary-systems/hub-repeat --emptyOutDir
python3 scripts/validation/verify_ps3_delivery.py --candidate
```

Pinned-container third build is the exact PS2 command in `../ps2/COMMANDS.md`,
with this worktree's absolute path and output directory. Node24.14.0 image digest,
no-network flag, readonly source mount and same-path resolution are unchanged.
Final committed verifier omits `--candidate`; exact local/remote HEAD and Windows
preview are checked at delivery. Raw output is retained under
`output/planetary-systems/ps3`; selected durable receipts/screenshots are versioned.

Scientific API/data source and renderer geometry/materials are byte-identical to
PS2; its65 Docker science tests (7 inherited warnings),18 strict new tests and2 full-source
comparison tests remain valid historical evidence. PS3 does not relabel those
runs as fresh. PS2's15 system/viewport journeys, material failure/disposal and
48.34–60 Hz SwiftShader measurements also retain their source and artifact identities.
PS3 changes only the narrow notice/diagnostic host behavior, qualified by fresh
integration/browser tests and new builds. Native data/assets/settings/pins/volumes
are unchanged; noDB-byte snapshot or physical GPU acceptance is claimed.

## Final corrected-source results

-8/8 cross-system groups passed with actual served/source hashes stable.
-1/1focused notice-history regression passed after independently reproduced red.
-22/22Earth/nativeMoon/Solarjourneygroups passed:desktop8,portrait7,shortlandscape7.
-9/9 resilience groups passed, including nativeEarth andPennsylvaniaSky readiness, sourcefailure/invaliddates, delayedactualresponses and both motionpreferences.
-370 frontend tests passed in58files; TypeScriptpassed.
-3identicalHubbuilds andservedbytes:142 files; unchangednativeMoon4,Earth514,Sky111files; immutableephemerispack andprotectedPR92resources passed.
-Windowspreview4225 returnedHTTP200.

The final runtime-sensitive assertions use the final notice-history correction.
Earlier passing and failing runs remain separately labeled; none substitute for
these final-source journeys. Scientific/backend, model/material and software
performance evidence from PS2 is reused only for unchanged protected code/data.
