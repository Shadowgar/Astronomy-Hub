# Limited visual-satellite pilot implementation plan

> For agentic workers: use the executing-plans skill task by task; the source-release worker owns only its delegated files.

Goal: qualify current, source-backed native satellite motion using the exact 155-record visual subset, without replacing PR101's original catalog.

Architecture: immutable GitHub transport -> independent offline audit -> explicit limited-release profile -> read-only same-release mounts for native SWE and FastAPI -> existing Hub time/tracking controls. Native engine, photometry, SGP4, source pins and 5/7-degree identification policy remain unchanged.

Tech stack: existing Python/Skyfield/FastAPI, React/TypeScript, native Stellarium, Docker and Playwright. No new dependencies.

Spec: owner directive attachment 3b11fb2e-b3ce-49aa-be41-6e1cfe7d5cfc/Pasted text.txt, 2026-10-25.

## Constraints and review focus

- Base PR101 7f5ea4d0c069463852698c836b3cd80a13bd75cf remains unchanged.
- Mirror revision 38a142645e7814b538daaf5868b814550e1f0dda; visual SHA256 63c4c833d967c26c2b3d403de42c234ff6b920969639642a3bedce15225406e2.
- Full-catalog minimum1000 remains; pilot admission requires a separate explicit profile.
- Protect native binaries/pins, original14281-record feed, seven scientific-data identities, owner settings, other previews and volumes.
- Rights admission covers basic GP data with citation; no copying/adopting the mirror workflow or other datasets. Hash consistency is not upstream whole-file authentication.
- Reject changed source/feed/manifest, stale source at build, missing required identities and accidental default-profile admission.
- Show limited coverage on desktop/portrait/short-landscape. Stale/unavailable retain priority.
- Qualify optical native points separately from geometry/sunlight and labels. Explicitly label any upcoming-pass simulation; Live always means actual currentUTC.
- Prove same source in backend/native browser, fresh process/browser caches, same TLE identity, native motion against fixed stars, accurate FOV and time/tracking independence.
- Physical-device/owner acceptance remain separate. No merge, production promotion or deployment.

## Steps

- [x] Read Default Mode packs and owner directive; confirm base and preserve worktree.
- [x] Acquire exact GitHub blob and manifest; verify SHA256, Git blob,155checksum pairs, identities and epochs; verify original full-catalog gate rejects155.
- [x] Independent primary-source rights/provenance review; bounded local pilot admission with explicit limitations.
- [x] Source worker: RED/GREEN tests, new explicit offline pilot builder/validator and profile-bound backend status; preserve full defaults.
- [x] Root: focused RED/GREEN coverage disclosure in existing time/status UI.
- [x] Create task-only Docker preview with read-only source/data and identical admitted155-record release for native/backend; no in-place replacement.
- [x] Independent current/upcoming pass computation using existing Skyfield+DE442s and exact observer.
- [x] Focused native/source/frontend/science tests and real three-viewport motion/pixel/control/lifecycle proof; source-matched unchanged evidence reused honestly.
- [x] Repeat relevant builds, verify served identities and rollback/data/settings preservation.
- [x] Reconcile evidence, exact file/command inventory and governance. Commit/push/review are recorded in the PR conversation after the qualification gate.
- [ ] Independent final exact-commit review and scoped corrections if needed; stop for owner functional review.


## Evidence-driven implementation rulings

- Generic orbital import omits existing standard magnitudes. Preserve only the133native-baseline values matched by canonicalNORAD+internationaldesignator;22objects retain unchanged native default. Originalbaseline SHA431592... remains protected; exact source storedread-only in pilotrelease for validation.
- Atomic fullbuilder writes0600 pendingitsinstaller; this separate public pilotpublisher must use0644 to allow Dockerapp/nginxusers. ActualDockerPermissionDenied and focusedRED/GREEN retained.
- Fourteen padded TLE identities produced aliases suchas NORAD00694 that nativecanonical lookup694 couldnotfind. Canonicalize pilot identity/alias metadata, retainingliteralTLEvalues andnames/COSPAR. Actual155objectnativeaudit retainedRED; fullimporterunchanged.
- Localacquired_at is the retainedverification-receipt time, not a claimed per-file CelesTrak acquisition certificate. MirrorfetchUTC comesfromrunlog; actuallocaltransportis GitHubconnector base64blob, with its APIURLdeclared separatelyfromcanonicalrawURL.
- Brightnative point19120covers green identification-symbol pixels atcloseFOV whileitslabel appears. No nativephotometry/glyphchange is justified. A bounded freshsource candidateprobe selects an opticallyeligible pointfor separate-symbolpixel evidence; failed19120symbolcapture remains retained.

- Actualnativepointerselection issued exact NORAD61045 through generic Sky search. Coldpackloading blocked its asyncroute/eventloop36.246s and queued feedstatus beyond30s. FourREDtests prove exactNORADmustuse theconfiguredlocalTLElookup before unrelatedstar/DSOsearch. FourGREENtests qualify thatnarrow lookup path; no newcoordinates/visibilityorotherquery behavior. ColdDockerandbrowserrequalification follow.
