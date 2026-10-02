# ORA-6 design validation record

Date: 2026-10-02. Single agent; no delegation. Scope: design/control only.
Owner authorized proceeding without Figma after Starter page/MCP limits blocked it.
This record validates the repository design handoff, not production implementation.

## Context and bounded inspection

Default Mode; no Stellarium or High-Definition override. Loaded mandatory context plus
planning pack and applicable frontend references, not a full documentation scan:

- `docs/context/CORE_CONTEXT.md`
- `docs/context/LIVE_SESSION_BRIEF.md`
- `docs/context/CONTEXT_MANIFEST.yaml`
- `docs/DOCUMENT_INDEX.md`
- `docs/validation/SYSTEM_VALIDATION_SPEC.md`
- `docs/architecture/UNIFIED_UNIVERSE_ARCHITECTURE.md`
- `docs/studies/GODS_EYE_SWE_COMPATIBILITY_STUDY.md`
- `docs/validation/UNIFIED_RUNTIME_COMPATIBILITY_EVIDENCE.md`
- `docs/validation/CESIUM_EARTH_PHASE_C_EVIDENCE.md`
- `docs/architecture/ARCHITECTURE_OVERVIEW.md`
- `docs/architecture/ENGINE_SPEC.md`
- `docs/architecture/ENGINE_CATALOG.md`
- `docs/architecture/OBJECT_MODEL.md`
- `docs/architecture/DATA_CONTRACTS.md`
- `docs/architecture/TONIGHT_CONTRACT.md`
- `docs/architecture/STACK_OVERVIEW.md`
- `docs/execution/PROJECT_STATE.md`
- `docs/execution/MASTER_PLAN.md`
- `docs/features/FEATURE_EXECUTION_MODEL.md`
- `docs/features/FEATURE_CATALOG.md`
- `docs/features/FEATURE_ACCEPTANCE.md`
- `docs/features/FEATURE_TRACKER.md`
- `docs/ASTRONOMY_HUB_DIAGRAM.md`

These match the planning/frontend task context. No unrelated historical documents were
loaded as authority. Repository/area AGENTS instructions and applicable skill instructions
were also read. The validation command itself checks its prescribed document links.
Prior memory routed inspection only; current code, owner instruction and live context
controlled execution. The old live brief's open-PR state was explicitly reconciled to
merged PR #55; the settled owned-Cesium architecture was not reopened.

Inspected bounded source areas: OrasAppShell/publicShell.css, RuntimeHost/productState/
runtimeProbeService, AppRouter, home/Tonight/Observe hooks/models/views, Earth core/layers,
runtime-protocol, renderer lock and God's Eye capability ledger. Findings informing design:
bridge currently exposes time/observer/destroy, not proposed layers/selection/chrome;
Earth data is live-only; canonical site and exact identity must remain source-backed;
Tonight/Observe models can be reused without duplicating calculations.

## Startup and data-reference commands

```sh
git checkout main
git pull --ff-only
git status
git merge-base --is-ancestor b2f9dce9bb559a1d23dc806a1b8d1927c502f084 HEAD
git checkout phase-c7-unified-workspace-earth-visual-1
curl -fsS 'http://127.0.0.1:8000/api/tonight?date=2026-10-02' -o /tmp/ora6-tonight.json
curl -fsS 'http://127.0.0.1:8000/api/above-me?lat=41.321903&lng=-79.585394&elev=432.816&time=2026-10-03T02%3A00%3A00Z&limit=6' -o /tmp/ora6-design/observe-at-time.json
```

Main included the merge (exit0); the requested branch already existed at that same baseline,
without divergent commits, and was reused. Both source snapshots succeeded. They support
labeled design facts only, not fresh validation of astronomy algorithms or runtime quality.
Local runtime captures supplied scene references; NASA supplied the archived globe composite.

## Visual review and correction

One deliberate review used a 21-screen contact sheet plus full-size desktop/tablet/mobile
inspection. One refinement pass corrected scene-capture chrome, Earth image compositing,
rail CSS leakage, absent-selection tabs, sheet actions/attribution, geometry consistency
and essential control-border contrast. Final screenshots check that corrected artifact.
No second visual direction or production CSS was created.

The reference contains D01–D10, T11–T12, M13–M17, S18–S21: all 17 requested screens plus
loading, renderer error, pinned and auto-hidden states. Browser screenshots are temporary
review artifacts under `/tmp/ora6-design/final-*.png`; the committed editable HTML embeds
its assets and can reproduce every frame without those temporary files.

Served design documentation only:

```sh
python3 -m http.server 4387 --bind 127.0.0.1 --directory docs/design
/home/rocco/.codex/skills/playwright/scripts/playwright_cli.sh -s=ora6 run-code '<review function below>'
```

The first final-capture attempt encountered `ERR_CONNECTION_REFUSED` because the temporary
server had stopped; no successful result was inferred. Restarted the server and repeated
the final capture. The review function visited the document, awaited `document.fonts.ready`,
iterated every `.board`, set its declared viewport, displayed that board, captured a PNG,
and returned image readiness, small button targets, out-of-frame surfaces and page errors.
Equivalent core of the exact browser check:

```js
async page => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:4387/UNIFIED_WORKSPACE_VISUAL_REFERENCE.html?screen=D01');
  await page.evaluate(() => document.fonts.ready);
  const results = [];
  for (const id of await page.locator('.board').evaluateAll(es => es.map(e => e.id))) {
    const frame = page.locator('#' + id + ' .frame');
    const dims = await frame.evaluate(e => ({
      width: parseInt(e.style.getPropertyValue('--w')),
      height: parseInt(e.style.getPropertyValue('--h'))
    }));
    await page.setViewportSize(dims);
    await page.evaluate(id => document.querySelectorAll('.board').forEach(
      e => e.classList.toggle('show', e.id === id)), id);
    await page.screenshot({path: '/tmp/ora6-design/final-' + id + '.png'});
    results.push(await frame.evaluate(e => ({
      id: e.closest('article').id,
      width: e.clientWidth, height: e.clientHeight,
      images: [...e.querySelectorAll('img')].every(i => i.complete && i.naturalWidth > 0),
      smallButtons: [...e.querySelectorAll('button')].filter(b => {
        const r = b.getBoundingClientRect();
        return r.width > 0 && (r.width < 43.9 || r.height < 43.9);
      }).map(b => b.textContent || b.getAttribute('aria-label')),
      outOfFrame: [...e.querySelectorAll('.context,.rail,.layers,.dock,.timebar,.sheet,.modes')]
        .filter(p => {
          const b = p.getBoundingClientRect(), f = e.getBoundingClientRect();
          return b.left < f.left || b.top < f.top || b.right > f.right || b.bottom > f.bottom;
        }).map(p => p.className)
    })));
  }
  return {errors, results};
}
```

PASS: all21 frames had loaded images;0 page errors;0 out-of-frame panels/rails/docks/sheets/mode switches. The target check initially found three narrow mobile text buttons (Time in M14; Track and Time in M17). A minimum44px width fixed them; the targeted final repeat across all21 frames returned `smallButtons: []`. Full-size corrected Earth Layers and mobile selection were visually inspected.

These checks validate static composition and button geometry. They do not turn the reference into a working application or prove runtime behavior.

Relative-luminance checks of all nine text/accent/status colors against four shell/surface
backgrounds: minimum5.22:1; accent-button ink11.45:1. Corrected essential border
`#72859C` against brightest hover surface:3.36:1. These are token checks, not a blanket
WCAG conformance claim. Keyboard, actual switch targets, focus trapping, reduced motion,
screen readers and live renderer behavior require implementation qualification.

## Final repository checks

```sh
git diff --check
python3 -S scripts/validation/validate_architecture_docs.py
sha256sum .vscode/settings.json
git status --short
```

PASS: `git diff --check` (exit0, no output). After explicit staging,
`git diff --cached --check` caught one trailing space copied from the upstream font
license; removed that whitespace and reran the staged check successfully. Architecture validator (exit0):

```text
PASS: manifest structure/paths/duplicates; 165 document-path entries (163 task entries + 2 global entries); 8 task packs.
PASS: 34 checkpoint Markdown documents; 70 relative links; code fences balanced; 8 expected ADRs.
```

Owner file hash before/after:
`6fd3157fba44f86fa00268bd53d0429cc2c17a697a2c196890e80934bc54bce0`.
It remains unstaged and outside the design commit. A Python check using the repository manifest parser plus `git diff --name-only` /
`git ls-files --others --exclude-standard` passed the exact six-file allowlist and
confirmed the owner file hash and empty staging area before the design commit.
The five requested manifest packs each
contain the design spec exactly once, after the mandatory context pair; no new pack.

Exactly six design/control files belong in the commit:

- `docs/design/UNIFIED_WORKSPACE_DESIGN_SPEC.md`
- `docs/design/UNIFIED_WORKSPACE_VISUAL_REFERENCE.html`
- `docs/design/UNIFIED_WORKSPACE_ASSET_NOTICES.md`
- `docs/design/UNIFIED_WORKSPACE_DESIGN_VALIDATION.md`
- `docs/context/CONTEXT_MANIFEST.yaml`
- `docs/context/LIVE_SESSION_BRIEF.md`

No frontend, runtime, backend, protocol, provider, Docker, dependency or test changes.
No production build/test/Docker run is needed for this design-only change, and none is
claimed as new runtime qualification. No push, PR, Codex review or Copilot review requested.

## Gaps and handoff status

- Figma remains partial: three pages, not the requested six; screen repair/visual review
  blocked by access limits. Owner waived this dependency. Repository visuals are the handoff.
- Configured terrain, buildings and photorealistic coverage are not proven by the NASA
  reference. Provider qualification and actual renderer screenshots remain implementation gates.
- Proposed shell bridges and accessibility interactions are specified, not implemented.
- Owner approval is outstanding. ORA-6 is delivered for owner review; ORA-7 remains
  Backlog, `startedAt: null`, and must not start before that approval.
