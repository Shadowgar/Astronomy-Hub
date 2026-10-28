# Independent obsolete G6 workflow retirement review

Reviewed the CI/documentation-only follow-up to
`527f38aedfd160f4998c085cd85f14d3ff4f4dde` on
`recovery/reconcile-20261026`. Existing Solar2.1 loaded authority and owner scope
remain controlling; no extra task pack or broad documentation scan was used.
The reviewer changed only this report and made no commit, push or runtime change.

**The two obsolete workflow deletions are justified. No live regression-test
implementation or native renderer protection is removed by their retirement.**
This is retirement of invalid jobs, not a G6 PASS or a native HiPS/star parity
claim. Final hosted results must be obtained for the subsequent commit.

## Independent evidence

- `git show f75bc9eb -- frontend/package.json` confirms that the May purge
  intentionally deleted `test:module1` and `test:module2` alongside the rejected
  Hub-owned Sky implementation and their actual test files.
- `git merge-base --is-ancestor f75bc9eb4e3785cd6d891573766b47669275bab4 origin/main`
  exits0. This is inherited workflow drift, not removal of a Solar2.1 test.
- The surviving `frontend/scripts/generate_hip_pix_order2.mjs` contains only an
  unconditional error declaring it intentionally disabled; it supplies no current
  generator/test coverage. Shared styles and package manifests remain active Hub
  inputs covered by the current frontend test/typecheck/build job.
- The reviewed diff deletes precisely `module1-hips.yml` and `module2-stars.yml`,
  preserves their main/master event coverage in Repository integrity, and adds
  factual retirement/failure evidence. It adds no empty npm script,
  `continue-on-error`, skipped assertion, fake success or native-source change.
- Repository integrity still invokes the full current frontend test suite,
  typecheck and build, plus runtime/science/source/archive contracts. Its source
  steps, Playwright and CodeQL are unchanged. The implementation's hosted500-test
  result is the root's evidence; this reviewer did not rerun the whole suite.

Fresh independent command from `frontend`:

```sh
npm test -- --run tests/skyEngineImportBoundary.test.js tests/orasDenseStars.test.ts tests/orasRuntimeDataSources.test.js tests/orasCatalogPacks.test.js tests/orasStarContractNavigation.test.js tests/orasRuntimeSearchRouting.test.js tests/orasRuntimeSpaFallback.test.js
```

**7 files /90 tests PASS**, exit0. These tests cover native source registration,
catalog identity/astrometry, DSS/provider fallback, source materialization,
missing-asset/SPA behavior and rejection of the removed renderer/Babylon concepts.
They are current integration-contract coverage, not substitutes for native C
scientific parity, Docker/browser proof or owner acceptance.

## Event scheduling correction, independently checked

At initial review, the retired workflows ran their duplicate typecheck/build
steps for matching main/master pushes and main/master-target PRs. Repository
integrity ran for all main-target PRs and recovery-branch pushes. Removing the
retired files therefore preserves the current executable test assertions but
does not by itself preserve every old event trigger. This distinction was
reported to the implementer before commit. The final correction extends only
Repository integrity's triggers to PR branches `[main, master]` and push branches
`[main, master, recovery/reconcile-20261026]`. All its actual test/build steps are
unchanged, and the real suite now covers those events without the retired jobs'
obsolete path filters. Independent diff inspection and `git diff --check` pass.
No remaining actionable finding was identified in this bounded CI correction.

No approval of merge, deployment, source publication, physical-device performance
or owner visual acceptance is implied. Recommended next step: verify the final
CI-only commit's hosted checks and report the retired jobs as retired.
