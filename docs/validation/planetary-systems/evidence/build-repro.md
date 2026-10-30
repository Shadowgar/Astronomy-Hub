# Bounded preload-order reproducibility diagnosis

Confirmed cause: source absolute-path sensitivity in emitted chunk-import metadata,
which Vite walks in insertion order to form runtime preload dependencies. Changing
the Node version alone did not reproduce the difference. No application edits.

The retained original `hub-repeat` and `hub-container` entry filenames were both
`index-CtriYa9y.js`. Their byte differences were exclusively the preload table and
corresponding mapDeps indices. However, the semantic CSS preload sequence differed:
host loaded solar CSS before solarMaterials CSS; relocated container reversed them.
Therefore arbitrary whole-table/CSS sorting is not an evidence-safe fix.

Installed Vite 8.0.16 `dist/node/chunks/node.js:28536` walks
`chunk.imports.forEach(addDeps)` and then `chunk.viteMetadata.importedCss.forEach`
into an insertion-ordered Set. Lines 28569–28577 pass only non-CSS dependencies to
the resolveDependencies hook, then append CSS separately.

## Controlled comparison

Temporary instrumentation: `/tmp/ps2-scene/repro.mjs`, config copied to /tmp with
only absolute import/__dirname resolution needed for configFile:false. No source
patches, dependency edits, downloads, network or persistent image changes.

- Two host Node22.22.0 builds at original absolute source path: same entry SHA.
- Two pinned Node24.14.0 container builds at that identical source path: same SHA.
- One Node24.14.0 build with only source root relocated to `/hub/frontend`: same
  entry filename but reversed SystemWorkspace chunk imports and a different SHA.

First four entry SHA256:
`58acde52bb3e7bd59f81abda1bfab993ad55a9e0fd5ecbf410c7402e541d308b`.
Relocated source entry SHA256:
`5d3c37eacb2531843c2f8cbffd1837a3087ce8936e980ef7a0a96fd2e324ea62`.
Exact tables, Node versions and import arrays: `preload-order-comparison.json`.

This localizes the responsible metadata/path boundary; it does not claim to prove
the underlying Rust hash/graph algorithm or determinism for every future source graph.

## Smallest safe correction

Use the same absolute source root in host and container builds. Preserve dependency
symlink targets at their original absolute paths. Do not alter application CSS order
or sort Vite metadata as a workaround.

Final normal build (no instrumentation) used the existing pinned offline image:

```sh
docker run --rm --network none --user 1001:1001 \
  --mount type=bind,src=/home/rocco/Astronomy-Hub,dst=/home/rocco/Astronomy-Hub,readonly \
  --mount type=bind,src=/home/rocco/Astronomy-Hub/.worktrees/ps1-earth-moon-system-1/output/planetary-systems/hub-container,dst=/output \
  --tmpfs /home/rocco/Astronomy-Hub/frontend/node_modules/.vite-temp:uid=1001,gid=1001 \
  --workdir /home/rocco/Astronomy-Hub/.worktrees/ps1-earth-moon-system-1/frontend \
  node:24.14.0-bookworm-slim@sha256:d8e448a56fc63242f70026718378bd4b00f8c82e78d20eefb199224a4d8e33d8 \
  npm run build -- --outDir /output --emptyOutDir
```

Current host `hub` versus final `hub-container`: **142 files each, identical bytes**;
no missing/additional/changed files. Receipt: `final-container-comparison.json`.
Container log retained in worktree `output/planetary-systems/build-container.log`.
The existing large-chunk build warning remains visible and is not a clean gate.

Earlier instrumentation attempts failed on an incorrect `.js` config filename and
runner loader's handling of existing `__dirname`. Those were corrected in the
temporary harness only; the final normal Docker command uses the original config.
