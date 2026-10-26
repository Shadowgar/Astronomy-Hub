# Independent immutable refresh-proposal review

**PASS for bounded docs-only review: no actionable P1/P2 findings.** This is not approval to implement, acquire data, promote a candidate, merge or deploy.

Reviewed commit: `e5efd5ca2ecfc3344b57f4262023157f1e7d1763` on `sky-satellite-refresh-proposal-1`, against `d2909a52d3f747c555ca87eff112bab83c064779`. Parent identifies draft PR103; this reviewer did not change or independently query PR metadata.

The immutable diff adds exactly one file, `docs/validation/satellite-observing/REFRESH_PROPOSAL.md` (210 lines). There are no application, acquisition script, scheduler, workflow, environment, mount, source-pin or data changes. Its opening and closing gates explicitly require separate owner authority for implementation and acquisition, and later independent candidate/paired-preview admission. Finalization does not change an active pointer.

## Review conclusions

- Source-policy treatment is supported by independently reopened official documentation. The proposed needed-data-only request, cache reuse, provider coordination, two-hour interval and immediate machine stop on non200 align with [CelesTrak Usage Policy](https://celestrak.org/usage-policy.php). Failed-attempt cooldown, durable human-cleared latch, zero redirects/retries and the numerical byte/time budgets are correctly labeled stricter project proposals rather than provider guarantees.
- Explicit query/format selection and continued limited legacy coverage are consistent with [CelesTrak GP documentation](https://celestrak.org/NORAD/documentation/gp-data-formats.php). The proposal acknowledges six-digit limitations and separates any future OMM/full-catalog migration. No silent format conversion or complete-catalog claim is introduced.
- The basic-GP redistribution conclusion remains expressly an inference from documented lineage and scoped basic-data permission, with citation; it is not asserted as a license for all CelesTrak products or mirror code. [Space-Track basic SSA terms and User Agreement](https://www.space-track.org/documentation#/odr) support keeping basic TLE/OMM redistribution separate from advanced products, account authorization and credential handling.
- Transport design is bounded: one canonical HTTPS request, verified TLS, explicit connect/progress/total limits, streaming byte cap, durable attempt state, no automatic diagnostics/retry/fallback acquisition, and stop behavior for unexpected responses or interrupted writes. Unknown conditional-GET support is correctly left unqualified, with304 treated as non200 until a separately reviewed contract exists.
- Admission preserves original bytes and epochs, independently validates identity/checksums/ranges, binds immutable raw/derived manifests, preserves baseline magnitude joins, retains the original minimum1000 gate, and requires review of count/identity changes. It does not allow a fresh locally calculated hash to bypass the current pinned-byte validator.
- Candidate publication and later preview switching are separated. Same-generation read-only native/backend mounts, fresh processes/frames, decoded/native/API/hash verification and fail-closed rollback address mixed-generation and cached-catalog risks. The existing absolute-position residual and physical accuracy remain unresolved rather than being excused by fresh acquisition.

These conclusions assess proposal language and scope only. No implementation exists in this commit to prove locks, cooldown persistence, bounded streaming, source validation or paired admission operationally. The proposed offline failure tests and separate acquisition authority remain required future work.

## Loaded context

Proposal-worktree `docs/context/CORE_CONTEXT.md`, `docs/context/LIVE_SESSION_BRIEF.md`, bounded review references from `docs/context/CONTEXT_MANIFEST.yaml`; the exact committed proposal; its two local references `docs/validation/satellite-visual-pilot/SOURCE_RIGHTS.md` and `README.md`. The validation/architecture rules already loaded for the preceding parent-task review remain applicable: `docs/validation/SYSTEM_VALIDATION_SPEC.md` and relevant `docs/architecture/UNIFIED_UNIVERSE_ARCHITECTURE.md` sections. No unrelated document pack or broad docs scan. Parent explicitly authorized review of this proposal and its policy/links.

## Commands and observed results

Repository commands ran in `/home/rocco/Astronomy-Hub/.worktrees/sky-satellite-refresh-proposal-1`:

- `git rev-parse HEAD` → `e5efd5ca2ecfc3344b57f4262023157f1e7d1763`.
- `git status --short` → no output, clean worktree.
- `git diff --stat d2909a52 e5efd5ca2ecfc3344b57f4262023157f1e7d1763` → one file,210 insertions.
- `git diff --name-only d2909a52 e5efd5ca2ecfc3344b57f4262023157f1e7d1763` → only `docs/validation/satellite-observing/REFRESH_PROPOSAL.md`.
- `git show e5efd5ca2ecfc3344b57f4262023157f1e7d1763:docs/validation/satellite-observing/REFRESH_PROPOSAL.md` → immutable proposal read in full.
- `git diff --check d2909a52 e5efd5ca2ecfc3344b57f4262023157f1e7d1763` → exit0, no whitespace errors.
- Inline `python3` parsed Markdown links from that exact `git show`, normalized relative destinations and ran `git cat-file -e <sha>:<path>` for each local destination →9 Markdown links total;2 local links,2 PASS,0 FAIL. Both local paths exist at the reviewed commit.
- Targeted `cat`, `sed` and `rg -n` read the declared context/source-assessment references.
- Web `open` retrieved only the three official documentation URLs linked above; focused opens checked usage lines36–68, GP query/format/FAQ sections, Space-Track redistribution lines548–551 and agreement lines837–859. All three documentation pages were accessible. No proposed GP endpoint, feed, health probe, account or credential endpoint was requested.

Reviewer output only: `output/satellite-observing/proposal-review.md` in the observing worktree. Proposal files were not edited. No runtime/browser/tests/builds required or run for this docs-only review; no runtime behavior is claimed. No commit, push, PR mutation, source acquisition or activation performed by reviewer.

Recommended next task: owner review of the separate proposal; implement or acquire only after a separately bounded instruction. The implementation branch's exact-HEAD review remains a separate task.
