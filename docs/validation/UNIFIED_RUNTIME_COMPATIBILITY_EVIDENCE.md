# Phase B compatibility study evidence

Date: 2026-10-02. Hub baseline `0ba481f5b16f8f8637ca73628cbc2b3abaad1710`.
Branch `unified-runtime-compatibility-study-1`. Single agent; no delegation.
[Study and recommendations](../studies/GODS_EYE_SWE_COMPATIBILITY_STUDY.md).
This records source inspection and a disposable fixture, not runtime integration.

## Context and boundaries

Loaded `docs/context/CORE_CONTEXT.md`, `LIVE_SESSION_BRIEF.md`,
`CONTEXT_MANIFEST.yaml`; the complete `planning` manifest pack (document index,
validation spec, unified architecture, architecture overview, engine spec/catalog,
object model, data contracts, project state, master plan, feature execution model,
feature catalog/acceptance/tracker), and the eight explicitly requested ADRs.
The normal review additionally required the manifest-listed `docs/README.md`,
`docs/product/PRODUCT_VISION.md` and `docs/ASTRONOMY_HUB_DIAGRAM.md`, plus the
root AGENTS guardrail, to reconcile stale execution wording. No broad docs scan.
Source/history/upstream inspection was explicitly authorized.
Phase A's still-active session wording conflicted with merged PR #53 and the new
Phase B instruction; current execution notes are narrowly reconciled here.

Unrelated `.vscode/settings.json` preserved, SHA-256:
`6fd3157fba44f86fa00268bd53d0429cc2c17a697a2c196890e80934bc54bce0`.
No secrets printed, provider credentials used, provider changes, external messages,
upstream PRs, runtime installation in Hub, dependency changes or production actions.

## Baseline and upstream commands

Commands executed from Hub unless `-C` or path says otherwise:

```bash
git status --short --branch
git pull --ff-only
git status
sha256sum .vscode/settings.json
gh pr view 53 --json state,mergedAt,mergeCommit
git rev-parse HEAD
git switch -c unified-runtime-compatibility-study-1
git clone --filter=blob:none --no-checkout https://github.com/bilawalsidhu/gods-eye-view.git /tmp/gods-eye-study
git -C /tmp/gods-eye-study checkout --detach e7707d9a0f34d9fbffc300023c319f95caa5be30
git -C /tmp/gods-eye-study rev-parse origin/main
git -C /tmp/gods-eye-study rev-list --count HEAD..origin/main
git -C /tmp/gods-eye-study show -s --format='%H %cI' HEAD
git ls-remote https://github.com/Stellarium/stellarium-web-engine.git HEAD
git ls-remote https://github.com/Shadowgar/stellarium-web-engine.git HEAD
git clone --filter=blob:none --no-checkout https://github.com/Stellarium/stellarium-web-engine.git /tmp/swe-upstream-study
git -C /tmp/swe-upstream-study checkout --detach 29870744c470ddc62fa869e153178c82a7824fa4
git -C /tmp/swe-upstream-study merge-base HEAD 023e3b26
git -C /tmp/swe-upstream-study rev-list --count 023e3b26..29870744
git -C /tmp/swe-upstream-study diff --stat 023e3b26 29870744
git show -s --format='%H %P %cs %s' 023e3b26
git show -s --format='%H%n%P%n%B' 63fb3279e85782158a6df63649f1c8a1837b7846
git show ddd250ac:scripts/prepare-stellarium-reference.sh
git ls-files vendor/stellarium-web-engine
git status --ignored --short vendor/stellarium-web-engine
git ls-files frontend/public/oras-sky-engine | wc -l
```

Results: main already current, only editor settings dirty; PR #53 MERGED at
`0ba481f5…`, merge time 2026-10-02T05:16:14Z; new branch created. God's Eye pin
and observed current HEAD both `e7707d9…`, distance 0. Official SWE HEAD
`29870744…`; owner fork HEAD `63fb3279…`; ancestry anchor `023e3b26…` and 12
later official commits with only yarn.lock delta (+341/-101). Hub vendor tracks
12 files; public runtime tracks 3,843. No nested vendor Git repository.

Source inspection used bounded `rg`, `sed`, `cat`, `git show`, `git ls-tree` and
file comparisons, focusing on the source paths enumerated in study sections 7–11,
17–24 and 30. No entire upstream source tree was read. The study's pinned source
links are the durable references; the temporary clone is not committed evidence.
Official ESA ENU, Cesium Viewer and MDN postMessage documentation was also opened;
links are adjacent to the relevant conclusions in the study.

## SWE file comparison

A disposable Python inspection enumerated:

```bash
git ls-tree -r 023e3b26babf7ffddf45f39293230b14cfe96993 -- src ext_src apps/web-frontend Makefile SConstruct
git hash-object vendor/stellarium-web-engine/PATH
git diff --no-index --stat /tmp/swe-upstream-study/src/modules/stars.c vendor/stellarium-web-engine/src/modules/stars.c
```

For each baseline blob, compare its Git object ID with the local file's
`git hash-object` result. Repeat against the two fork SHAs and current official
upstream, using the official clone where that object is absent in Hub Git.
Enumerate extra source files under `src` and `apps/web-frontend/src`, excluding
generated `assets/js` and object/archive/cache files; intersect differences with
`git ls-files` to identify untracked inputs. Output saved outside repo to
`/tmp/swe-upstream-study/divergence.json`.

| Comparison revision | Scoped upstream files | Identical | Different | Missing |
| --- | ---: | ---: | ---: | ---: |
| `023e3b26babf7ffddf45f39293230b14cfe96993` | 506 | 486 | 20 | 0 |
| `16dbacd4b9a9973421b0438044d3536e300b3260` | 507 | 486 | 21 | 0 |
| `63fb3279e85782158a6df63649f1c8a1837b7846` | 508 | 488 | 20 | 0 |
| `29870744c470ddc62fa869e153178c82a7824fa4` | 506 | 486 | 20 | 0 |

Five additional source files; 13 differing anchor files are ignored local inputs.
Exact file list and migration categories are in study section 10. Environment-file
content was not printed; only its differing hash status was recorded. Comparisons
are read-only; `git diff --no-index` returning 1 means differences, not test failure.
No exact original import pin or fully reproducible clean build was established.

Current runtime marker read at `frontend/public/oras-sky-engine/oras-runtime-build.json`:
source hash `d29ebbfc5c80872a6e0ca4c09af6dd2d03832d807e202d67ac6e327d4fc9b2af`,
native hash `8e9288cf7dd5d7d8e4387576c7fd36a4928cc67cfe71cdb1d5d066dccf3d9599`,
built-at `2026-09-27T04:43:37.222Z`. These are existing marker declarations, not
fresh recomputation or proof of matching the local ignored source snapshot.

## Bounded external probe

Environment: Linux workspace host; Node `v22.22.0`, npm `10.9.4`.
God's Eye SHA `e7707d9a0f34d9fbffc300023c319f95caa5be30`.
Node is outside upstream's declared application engine range. Only dependency-free
ES modules were executed; this does not qualify the upstream application toolchain.
No install, expensive build, browser, provider network call or credentials.

```bash
node --version
npm --version
node /tmp/runtime-compatibility-study/probe.mjs
sha256sum /tmp/runtime-compatibility-study/probe.mjs
```

Disposable probe imports `createApplication`, `createLayerCatalog`,
`LayerLifecycle` and `expandApplicationHtml` directly from the pinned checkout.
It constructs four fixture lifecycle phases with deferred cleanup; asserts startup
and reverse stop order, idempotent destroy and terminal no-restart. It constructs
one explicitly synthetic `study-fixture` layer with init/update/enable/disable/
destroy, matching `local-only` metadata, then asserts pre-seal registration,
activation, row discovery, rejection of late/unauthorized QA registration, and
zero remaining layers after cleanup. Finally it verifies all declared export
target files exist and expands original HTML templates without mounting a DOM.

Initial probe omitted the required layer `update` method: activation returned false
and logged `entry.module.update is not a function`. Corrected the fixture only and
reran; no upstream source changed. Final output, exit 0:

```text
PASS application: startup order, reverse teardown, idempotent destroy, no restart
PASS extension: pre-seal registration, panel discovery record, activation, cleanup; late/QA rejection
PASS exports/templates: 148 export targets exist; templates expanded; root entry still requires base adaptation
```

Probe SHA-256 `c7579aca6be4734660dcecc146e01bcc3ca7529c21c0b245e7621263b19eef42`.
Three probe groups passed. Limitations: fake viewer/test layer only; no Cesium,
DOM UI rendering, full catalog composition, application build, non-root browser,
WebGL/WASM memory or real whole-app cleanup proof. Exports existing does not prove
all exports bundle successfully. Extension serialization/share-token integration
was not tested. Scratch files remain outside Hub and are not committed.

## Probe reproduction command

After the pinned clone/checkout commands above, this documented command regenerates
the disposable fixture outside the repository. No executable experiment file is
committed. The exact source is retained here solely as the evidence command input.

```bash
mkdir -p /tmp/runtime-compatibility-study
cat > /tmp/runtime-compatibility-study/probe.mjs <<'PROBE'
import assert from 'node:assert/strict';
import {createApplication} from '/tmp/gods-eye-study/src/app/application.js';
import {createLayerCatalog} from '/tmp/gods-eye-study/src/app/catalog.js';
import {LayerLifecycle} from '/tmp/gods-eye-study/src/data/lifecycle.js';
import {expandApplicationHtml} from '/tmp/gods-eye-study/build/application-html.js';
import {readFile} from 'node:fs/promises';
let calls=[];
const factories=Object.fromEntries(['Scene','Controls','Data','Tools'].map(name=>['create'+name,({defer})=>{calls.push('start:'+name);defer(()=>calls.push('stop:'+name));return {fixture:true}}]));
const app=createApplication(factories);await app.start();assert.equal(app.getState().status,'ready');
const d=app.destroy();assert.equal(app.destroy(),d);await d;assert.deepEqual(calls,['start:Scene','start:Controls','start:Data','start:Tools','stop:Tools','stop:Controls','stop:Data','stop:Scene']);await assert.rejects(app.start(),/destroyed/);
console.log('PASS application: startup order, reverse teardown, idempotent destroy, no restart');
let cleaned=0;const layer={id:'study-fixture',name:'Study fixture',source:'TEST ONLY',async init(){},async update(){},async enable(){},async disable(){},async destroy(){cleaned++}};
const catalog=createLayerCatalog([layer],[{id:layer.id,disposition:'local-only'}]);const manager=new LayerLifecycle({});for(const l of catalog.layers)manager.register(l);manager.finalizeRegistrations(catalog.metadata);assert.throws(()=>manager.register({id:'late'}),/finalized/);assert.throws(()=>manager.registerForQa({id:'late'}),/not authorized/);assert.equal(await manager.setEnabled(layer.id,true),true);assert.equal(manager.getAll()[0].name,'Study fixture');await manager.destroyAll();assert.equal(cleaned,1);assert.equal(manager.layers.size,0);
console.log('PASS extension: pre-seal registration, panel discovery record, activation, cleanup; late/QA rejection');
const p=JSON.parse(await readFile('/tmp/gods-eye-study/package.json','utf8'));let exports=0;for(const v of Object.values(p.exports)){await readFile('/tmp/gods-eye-study/'+(typeof v==='string'?v:v.node));exports++};const html=expandApplicationHtml(await readFile('/tmp/gods-eye-study/index.html','utf8'));assert(!html.includes('gev:template'));assert(html.includes('cesiumContainer'));assert(html.includes('/src/main.js'));
console.log(`PASS exports/templates: ${exports} export targets exist; templates expanded; root entry still requires base adaptation`);
PROBE
node /tmp/runtime-compatibility-study/probe.mjs
sha256sum /tmp/runtime-compatibility-study/probe.mjs
```

## Documentation validation and review

Use the existing lightweight checkpoint helper from the prior architecture task:

```bash
python3 scripts/validation/validate_architecture_docs.py
git diff --check
git diff --name-only
git status --short
git diff --cached --check
git diff --cached --name-only
git log --oneline -5
```

The helper checks changed-file documentation/control scope, preserved editor hash,
relative Markdown links, balanced fences, manifest YAML/paths and all eight ADRs.
The final report records observed counts and PR checks. The editor file is an
explicit unrelated exception in the working-tree diff and is excluded from staging.
No committed changes under backend/frontend/vendor/scripts/data/manifests/Docker.
No local broad Hub app tests, Docker stack or browser tests were run, and no visual
improvement is claimed. Repository CI ran automatically when the PR was opened;
its checks do not qualify the proposed runtime integration.

One normal review cycle: author review against supplied Category A/B criteria,
then inspect normal PR review/check surfaces; no delegation or repeated manual
bot requests during the initial cycle. The final targeted correction explicitly
requests `@codex review` once under owner instruction. Findings and check state
are reported with the PR, not preclaimed
here. Study decisions are source-backed recommendations; Phase C runtime proof,
SWE reproducibility recovery and public provider qualification remain gates.

## Normal review correction pass

PR #54 reviewed initial commit `0d595d1b`. Codex raised two P1 authority conflicts:
PROJECT_STATE next-action/footer and AGENTS' unresolved Git/build guardrail.
Copilot flagged the same next-action conflict, three stale summary documents and
the temporary-only probe recipe. One documentation correction pass reconciled
those directives and retained a deterministic regeneration command above.
The command was extracted from this document and executed with `bash -e`:
all three probe groups passed again, with the identical recorded SHA-256.
No new upstream experiment or runtime change was introduced.

The initial review correction counts were superseded by the final authority
correction below. Repository checks are reported separately at handoff; they do
not qualify runtime integration. Review fixes do not authorize Phase C execution.


## Final reproducible documentation validation

The only tooling addition is the committed lightweight validator at
`scripts/validation/validate_architecture_docs.py`. Run it from a clean repository
checkout with the existing Python/PyYAML tooling already used for these checks;
no package dependency was added. It needs neither Git history nor owner editor
state nor scratch tooling. Its stable Markdown set is the `docs_change` pack plus
Phase A evidence, including unchanged checkpoint references. Relative links in
rendered Markdown (including image/reference targets) and balanced fences are
checked; examples inside fences are excluded. This explains why the link count
below differs from the earlier touched-document count.

Manifest validation covers structure, unique YAML keys, mandatory context and
architecture, existing document paths, duplicate entries within packs, all eight
expected task packs, and study/evidence availability in the six required packs.
The entry total includes global entries as well as every task-pack load entry.
All eight specifically named ADRs must exist. Failures return nonzero.

Final scope was regenerated against PR base `origin/main`
(`0ba481f5b16f8f8637ca73628cbc2b3abaad1710`), including the new helper before staging.
After commit the same Git comparison and validator were rerun. No product/runtime
implementation or architecture decision changed.

Commands:

```bash
git rev-parse origin/main
git diff --name-only origin/main -- . ':!.vscode/settings.json'
python3 scripts/validation/validate_architecture_docs.py
git diff --check
git diff --cached --check
git status --short
sha256sum .vscode/settings.json
```

Observed validator output:

```text
PASS: manifest structure/paths/duplicates; 153 document-path entries (151 task entries + 2 global entries); 8 task packs.
PASS: 32 checkpoint Markdown documents; 67 relative links; code fences balanced; 8 expected ADRs.
```

Changed paths (25: 24 documentation/control files and one validator):

```text
AGENTS.md
docs/ASTRONOMY_HUB_DIAGRAM.md
docs/DOCUMENT_INDEX.md
docs/MASTER_PLAN.md
docs/README.md
docs/architecture/ARCHITECTURE_OVERVIEW.md
docs/architecture/ENGINE_CATALOG.md
docs/architecture/ENGINE_SPEC.md
docs/architecture/STACK_OVERVIEW.md
docs/architecture/UNIFIED_UNIVERSE_ARCHITECTURE.md
docs/architecture/decisions/0003-gods-eye-earth-runtime.md
docs/architecture/decisions/0006-controlled-renderer-handoffs.md
docs/architecture/decisions/0007-immutable-upstream-source.md
docs/context/CONTEXT_MANIFEST.yaml
docs/context/CORE_CONTEXT.md
docs/context/LIVE_SESSION_BRIEF.md
docs/execution/MASTER_PLAN.md
docs/execution/PROJECT_STATE.md
docs/features/FEATURE_CATALOG.md
docs/features/FEATURE_TRACKER.md
docs/product/PRODUCT_VISION.md
docs/studies/GODS_EYE_SWE_COMPATIBILITY_STUDY.md
docs/validation/UNIFIED_RUNTIME_COMPATIBILITY_EVIDENCE.md
docs/validation/UNIFIED_UNIVERSE_ARCHITECTURE_EVIDENCE.md
scripts/validation/validate_architecture_docs.py
```

Scope proof excludes only the preserved unrelated editor file and permits only
`AGENTS.md`, documentation Markdown/YAML, and this exact validation helper.
Whitespace checks passed with no output. The editor file remains modified and
uncommitted, unchanged at SHA-256
`6fd3157fba44f86fa00268bd53d0429cc2c17a697a2c196890e80934bc54bce0`.
No application, provider, vendor, runtime asset, package dependency or Docker
behavior changed. No application/Docker/browser validation or runtime claim.

### Bounded negative proof

The following creates a temporary manifest only; tracked docs remain unchanged:

```bash
python3 - <<'PY_NEGATIVE'
from pathlib import Path
import subprocess, tempfile, yaml
manifest = yaml.safe_load(Path('docs/context/CONTEXT_MANIFEST.yaml').read_text())
manifest['tasks']['review']['load'].append(manifest['tasks']['review']['load'][0])
with tempfile.TemporaryDirectory(prefix='architecture-docs-negative-') as directory:
    path = Path(directory) / 'duplicate.yaml'
    path.write_text(yaml.safe_dump(manifest))
    result = subprocess.run(['python3', 'scripts/validation/validate_architecture_docs.py',
                             '--manifest', str(path)], capture_output=True, text=True)
    print(result.stderr.strip())
    print('Negative proof exit:', result.returncode)
    assert result.returncode == 1
PY_NEGATIVE
```

Observed: `FAIL: review: duplicate document entry`; `Negative proof exit: 1`.
The staged tree was exported with `git write-tree` and `git archive` into a
clean temporary directory: the default validator passed with the same output.
Appending a broken relative link only to that exported copy of ENGINE_SPEC
returned exit 1: `FAIL: docs/architecture/ENGINE_SPEC.md: broken relative link
missing-architecture-negative.md`. No tracked document was changed for either
negative proof.
A clean exported committed tree is also checked with this repository command;
no temporary validator or owner settings are needed. The final review/check
state is reported separately at handoff and does not qualify Phase C.
