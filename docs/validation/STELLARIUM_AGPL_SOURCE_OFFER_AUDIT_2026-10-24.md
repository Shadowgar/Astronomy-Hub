# Stellarium AGPL corresponding-source and visible-offer audit — 2026-10-24

**Status: BLOCKED / not qualified.** This is a repository-level, read-only licensing and release-path audit of the currently committed Sky runtime. It does **not** verify a deployed website or assert a legal conclusion that any particular deployment violates the license. No implementation, rebuild, deployment, vendor checkout, dependency, data, or production operation occurred.

**Baseline:** Astronomy Hub `main` commit `4af7b5e834c677e3000a8a4a9c9d9caf1a20ea11`, after merged licensing PRs #97 and #98.

## Applicable source requirements

[GNU AGPL v3 §13](https://www.gnu.org/licenses/agpl-3.0.en.html#section13) requires a modified network-interactive program to prominently offer interacting users the **Corresponding Source of that modified version** at no charge. Sections 0, 1, 5 and 6, including appropriate legal notices and source requirements for conveyed object code, may also apply. The [FSF's licensing guide](https://www.gnu.org/licenses/gpl-howto.html) gives a visible `Source` link to an archive as an example; the [AGPL FAQ](https://www.gnu.org/licenses/gpl-faq.html#AGPLv3CorrespondingSource) explains corresponding-source scope. The exact obligations should be checked against the covered work and distribution circumstances.

The original project's copyright remains **Stellarium Labs SRL** where marked, under its AGPL license choice; no purchased commercial license was evidenced. A GitHub-detected MIT license for original Hub-owned code is **not** a substitute for Stellarium source, license, and notice obligations.

## Reproducible repository evidence

| Check | Observed evidence | Qualification |
| --- | --- | --- |
| Upstream license texts | `vendor/stellarium-web-engine/LICENSE-AGPL-3.0.txt` and `integrations/sky-overlay/LICENSE-AGPL-3.0.txt` contain full AGPL v3; modified source retains upstream copyright headers | **PASS for checked-in license texts only**, not for deployed UI or bundles |
| Generated runtime | `frontend/public/oras-sky-engine/index.html` references `js/app.d996d430.js`, vendor chunks and the Sky bridge; generated WASM is checked in under `frontend/public/oras-sky-engine/js/` | **Source to binary link unqualified** |
| Prominent offer in checked-in standalone shell | The checked-in generated `index.html` has no source-link, license-link, or equivalent source-access entry | **NO OFFER VERIFIED in that file** |
| Offer in checked-in compiled frontend | Examined `frontend/public/oras-sky-engine/js/app.d996d430.js` (571,695 decoded characters): no `source code` wording, no `github.com/Shadowgar/Astronomy-Hub` link, and data-credit links only; AGPL appears in retained source comments | **NO PROMINENT SOURCE OFFER VERIFIED in that bundle**. Other UI surfaces and the live public website have not been interaction-tested |
| Native compiled output | `frontend/public/oras-sky-engine/js/stellarium-web-engine.f0d016d1.wasm` is tracked (1,200,810 bytes in GitHub directory metadata) | **Corresponding native buildable source not shown complete in Hub repo** |
| Source tree completeness | `docs/runtime/VENDORED_STELLARIUM_TRACKING.md` and `.gitignore` intentionally omit the full `vendor/stellarium-web-engine/` checkout. The tracked tree lacks `Makefile`, `SConstruct`, `ext_src/` and much upstream source | **BLOCKED:** fresh clone cannot be assumed to rebuild shipped WASM/JS |
| Build instructions | `scripts/prepare-stellarium-reference.sh` requires `src`, `ext_src`, `Makefile`, `SConstruct`, the Vue package, Emscripten and the native build process; `scripts/build-stellarium-safe.sh` stages and builds the runtime before `scripts/sync-stellarium-runtime.sh` updates the public tree | **Present but not reproducibly self-contained from Hub clone** |
| Source matching | Hub's `vendor/stellarium-web-engine/apps/web-frontend/src/App.vue` blob `5666a0b...` differs from `Shadowgar/stellarium-web-engine` fork master `63fb3279...` counterpart blob `796c991...`. Hub's modified `src/modules/stars.c` blob `7c0c560...` differs from that fork's `1f86afa...`. The integration `src/main.js` differs too | **Fork is a useful base, not proven exact corresponding source** |
| Build identity | `frontend/public/oras-sky-engine/oras-runtime-build.json` reports comparison anchor `023e3b26...` (verified in the upstream/fork history), artifact digest `b9c0c22e39384dfdf5e86def40eb580f0b1ec0b6b78052d5a8fb7701aadd164d`, other input digests, and no published corresponding-source archive URL or digest | **Partially traced; no published source-to-artifact release manifest** |
| Live service | ORAS public `/oras-sky-engine/` was not successfully fetched/interactively tested by this audit; installed versus committed runtime version and its notice experience cannot be established | **UNKNOWN**. Do not call production compliant or noncompliant from this repository audit |

The [source-tracking policy](../runtime/VENDORED_STELLARIUM_TRACKING.md) is reasonable for a small development checkout but **does not by itself solve release-time corresponding-source delivery**. The separate public fork `Shadowgar/stellarium-web-engine` includes a more complete upstream tree, but the checked-in Hub source modifications demonstrably differ; the fork's default branch is not an exact replacement for a released source package.

## Required remediation — explicitly separate implementation approval

### S1. Establish a build-matched source package (first; release blocker)

1. On the owner-controlled, qualified source/build workstation, identify the exact upstream/fork commit **actually used** for the released native engine and Vue frontend. The historical `comparison_anchor` is evidence of comparison, not proof of the full built input.
2. Create a complete, buildable **corresponding-source release** for the *exact* distributed/served Stellarium work, including all necessary upstream source, ORAS modifications, appropriate dependency/source material, native/frontend build scripts and configuration, and license/notice text. Include relevant source and scripts for any AGPL-covered connected work after an accurate license-boundary review.
3. Prepare it as a public versioned source archive (e.g. an immutable GitHub Release asset), or equally accessible immutable source revision with full contents and download instructions. No private WSL path, credentials, binary-only release, `main`-branch link, unqualified upstream fork, or diffs that cannot be reconstructed may stand in for the release.
4. Independently verify the archive has the needed `Makefile`, `SConstruct`, `ext_src`, `src`, frontend sources, lockfiles, ORAS modifications, build procedures, and unchanged legal notices, without incorrectly bundling unlicensed third-party data.
5. Produce a versioned manifest that pairs that exact source package and SHA-256 with the distributed artifact digest, source revision, native/frontend build inputs, generated runtime marker, and archive location. Retain immutable artifacts for the duration required by the applicable license.

Do **not** assert source completeness merely because the Hub repository and original fork are public.

### S2. Add a prominent, real link within the interactive runtime (after S1)

- Add a visible, keyboard/mobile accessible **“Source code & licenses”** entry to the **built Stellarium interactive experience**, including standalone `/oras-sky-engine/` and embedded `/sky-engine` contexts. An existing Data Credits menu/dialog is a potential location **only if actually accessible and prominent for both contexts**, including when embedded controls are hidden.
- It must link directly to the **build-matched corresponding-source package** at no charge, and provide/identify the AGPL text, Stellarium Labs attribution, no-warranty notice, and the scope of the modified software. Do not present a misleading link to generic Hub `main` or mismatched fork `master`.
- Follow the approved source-controlled runtime build: edit the authoritative upstream/integration sources, then use the existing `build:stellarium` and `prepare:stellarium-runtime` pipeline and commit only reviewed qualified generated output. **Never hand-edit `frontend/public/oras-sky-engine/js/*.js` or `index.html`** and never silently replace the WASM/source pins.
- No visual design or renderer changes beyond the reviewed legal/source-access affordance. Keep existing search, object selection, physics, assets, lifecycle, mounted skydata, and renderer artifact safeguards intact.

### S3. Verify before any public rollout

| Gate | Evidence required |
| --- | --- |
| Corresponding-source match | Every published artifact digest maps to a versioned source archive or full exact revision and complete build instructions; reviewer can reconstruct, or record and resolve any documented reproducibility differences |
| Source link | Visible and reachable in **standalone and embedded** mode with desktop, mobile, touch, keyboard and screen reader; cannot disappear behind an inaccessible drawer/iframe or focus trap |
| HTTP/source integrity | Link works anonymously over HTTPS with no payment or forced signup; actual archive bytes and SHA-256 match the release manifest |
| Licenses and notices | Stellarium copyright, applicable license, no-warranty and source offer are rendered clearly to users; third-party data/imagery notices remain intact |
| Runtime regression | Existing accepted Sky search/selection, bridge/embedding, runtime readiness, native WASM equality or approved rebuild, and owner data are preserved; verify source/asset hash changes intentionally |
| Deployment evidence | Confirm **actual served** HTML/JS/WASM identity on the ORAS site, not only locally tracked files; test the source offer on the deployed version |
| No unreviewed operations | No automatic merge, remote deploy, provider account, purchase, data replacement, Docker state change, or source pin movement in this audit |

When source proof or a live offer fails, mark the relevant gate **BLOCKED**, not “AGPL compliant.” When publishing a modified AGPL-covered service, source-access obligations should be resolved before representing the distribution as compliant.

## Decision and handoff

**This audit is complete at repository-inspection scope, but remediation S1–S3 is not complete.** Source package assembly requires access to the **full qualified local Stellarium source**, exact build inputs and runtime artifact, not present in GitHub's sparse checked-in tree. The compiled app needs a source-controlled change and a verified rebuild. Public-site behavior and deployment remain unverified.

The currently active repository execution controls describe a docs-only bounded package; this audit does not claim permission for source changes or deployment. Activate a separately approved, bounded implementation task for S1–S3. Do not merge or deploy a rebuilt runtime based solely on this audit.

This technical analysis is not legal advice. For contested combined-work or distribution questions, consult someone experienced in open-source licensing.
