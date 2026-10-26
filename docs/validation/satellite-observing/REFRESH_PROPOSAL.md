# First-party satellite refresh — proposal only

**For separate owner review. No updater, acquisition, source replacement,
production promotion, merge or deployment is authorized by this document.**
The current observing feature continues to use the admitted immutable pilot.
This proposal defines a possible later manual development-candidate workflow;
implementing or running it requires a separately bounded owner instruction.

## Scope and preserved baseline

Prefer direct CelesTrak GP acquisition for the existing limited visual subset.
The proposed request is
`https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=TLE`.
This URL was documented, **not requested**, during this proposal task. No GP
feed, Space-Track account endpoint, updater or provider-health probe was fetched.

Keep the existing `visual_satellite_pilot.v1` release separate from the original
full-catalog importer and its minimum **1000** records. The current pilot's
155-record count is a dated subset, not a completeness target or justification
for weakening the full-catalog gate. Preserve:

- Original14281-record native feed SHA256
  `431592eb5ec6db56d79c26792853f3fafe36ddf76c98834d9ddb36ddc0846436`.
- Admitted pilot release `visual-pilot-20261025-38a1426`, native-feed SHA256
  `9f063125517b9a6cc990159009ec7e46b764dc6dd14afc7a4b44a651e5920185`.
- Its original visual.tle SHA256
  `63c4c833d967c26c2b3d403de42c234ff6b920969639642a3bedce15225406e2`
  and mirror revision `38a142645e7814b538daaf5868b814550e1f0dda`.
- Existing native/backend mounts, original previews, pins, JS/WASM, SGP4,
  photometry, native hint policy, scientific data and rollback artifacts.

The baseline admission and its trust limits remain in the
[pilot source assessment](../satellite-visual-pilot/SOURCE_RIGHTS.md) and
[pilot report](../satellite-visual-pilot/README.md). A future first-party receipt
must not be relabeled with the mirror's source identity or bypass that builder's
exact-byte admission check by substituting a freshly calculated hash. Any new
source contract/profile must be explicitly reviewed and independently qualified.

## Official guidance checked for this proposal

Documentation was retrieved through the web tool between
**2026-10-26T04:37:54Z and2026-10-26T04:38:08Z**, bounded by current-UTC tool
readings. These are retrieval-session times, not wire-level timestamps or a
certificate of server freshness. No raw response/header archive was captured.

| Primary source and exact URL | Retrieved evidence | Consequence |
|---|---|---|
| [CelesTrak Usage Policy](https://celestrak.org/usage-policy.php) | Published May15, updated May22,2026; rendered lines36–68. Requires needed data only, once per update; GP cadence2hours; machine clients stop on non200 and report for human review. Shared-address users should coordinate caching. | One coordinated request path; persistent cache and immediate stop on unexpected response. |
| [CelesTrak GP documentation](https://celestrak.org/NORAD/documentation/gp-data-formats.php) | Updated June23,2026; query/format lines46–69 and FAQ155–201. Documents uppercase query keys and explicit format. Cache reuse, no overlapping group harvest, and current non-TLE formats are supported guidance. Current banner reports six-digit catalog identities are outside TLE coverage. | Explicit `GROUP`/`FORMAT`; retain limited legacy coverage; no silent conversion or expanded identity claim. |
| [Space-Track Basic SSA redistribution and agreement](https://www.space-track.org/documentation#/odr) | Rendered lines548–551 grant redistribution of basic SSA with appropriate citation, explicitly including TLE/OMM. Agreement lines837–859 imposes account conditions; current website-access policy has no charge but can change. API lines22–45 distinguish GP retrieval and account limits. | Cite the basic-data lineage; do not infer rights for advanced/operator products or authorization for credentials. |

The Space-Track basic-data permission and CelesTrak's documented Space-Track GP
lineage support the same scoped redistribution inference recorded in the prior
assessment. They do not license mirror code, other datasets or operator SupGP.
Each eventual candidate should cite **USSPACECOM /18SDS basic GP data, distributed
through CelesTrak**, with exact request URL, retrieval receipt and original epochs.
Direct official HTTPS improves first-party transport provenance; it is not a
signed orbital-accuracy attestation. [Basic-data terms](https://www.space-track.org/documentation#/odr)
and [GP lineage](https://celestrak.org/NORAD/documentation/gp-data-formats.php).

The pinned mirror run continued after an HTTP404, used retries and fetched
overlapping groups; its global timestamp was not a per-file epoch certificate.
Those observed defects are retained in the prior source assessment. **Do not copy
its workflow or use it as an automatic fallback transport.**

## Proposed manual acquisition policy

The numerical transport budgets below are proposed project limits, not provider
guarantees. Qualify them with local fixtures before any separately approved run.

1. A human invokes one development-candidate attempt only when data is needed.
   No cron, background browser fetch, startup hook, CI schedule, multi-group
   harvest or automatic retry. Unit/browser tests use retained bytes or fixtures.
2. One provider-wide acquisition lock and persistent attempt ledger coordinate
   all project processes/worktrees using the same outbound address. If coordination
   with another known provider consumer cannot be established, stop. Do not start
   a second runner to bypass the lock, cooldown, source restriction or block.
3. Reuse verified cached bytes first. Permit at most one request after at least
   **2hours since the most recent attempt**, including failed attempts; after an
   error a persistent stop latch additionally requires human diagnosis and an
   explicit subsequent invocation. Waiting alone does not clear that latch.
   The cadence follows [CelesTrak policy](https://celestrak.org/usage-policy.php);
   the failure-attempt cooldown and latch are deliberately stricter project rules.
4. Restrict the client to the one canonical HTTPS URL, normal TLS verification,
   **10seconds connection,20seconds without received body progress,60seconds total,
   8MiB maximum response body**, and zero redirects/retries. Enforce streaming byte
   limits even if Content-Length is absent or false. A bounded diagnostic body is
   allowed within the same request; no follow-up diagnostic request.
5. Any non200, timeout, DNS/TLS/transport error, oversized/truncated body, unexpected
   encoding/content, parse/checksum/identity failure, write failure or interruption
   terminates the attempt and prevents publication. Retain a bounded receipt,
   latch the error and continue serving the previous qualified generation with its
   original age/status. Never treat a403 explanation as a successful refresh.
6. A later retry is manual, after human investigation, cooldown and any longer
   provider-directed wait. No request is promised to succeed after2hours; a
   firewall block can require provider resolution. A future authorized transport
   must respect the existing stop state; changing IP/host is not a workaround.

No conditional GET is proposed initially. The official pages inspected do not
establish `ETag`/`Last-Modified` support for this endpoint, and the published
stop-on-non200 rule cannot be silently replaced with generic304 handling.
Only if later official guidance and separately authorized endpoint qualification
establish support may a reviewed contract send conditional headers and accept a
matching304. Such a result reuses exact cached bytes; it does not advance element
epochs or establish new orbital freshness. It must never trigger another request
inside the same attempt. Until then,304 follows the non200 stop rule.

New provider expenditure remains **$0**: no paid runner, subscription, account,
token, chargeable trial, proxy service or provider contact is authorized here.
An owner-controlled free transport would require its own bounded approval and
quota review. Space-Track is an alternative future proposal only: no account
creation/login, credential sharing or storage is performed. Its official rules
require approved account use and separate query-rate compliance; credentials
must never enter a public manifest, log or browser bundle.
[Space-Track access conditions](https://www.space-track.org/documentation#/odr).

## Candidate integrity and paired generation design

All steps in this section are proposed future implementation, not current behavior.

**Acquire into private staging.** Hold an OS-managed exclusive lock through
acquisition, validation and candidate finalization; record lock ownership and the
attempt ID. Use a task-owned0700 staging directory and0600 partial files, never
a current mounted release path. Reject symlink escapes and destination collisions.
Persist the attempt start before network access so a crash cannot erase cooldown.
Lock contention exits without network traffic. On restart, incomplete attempts
remain failed/quarantined; do not delete an apparently stale lock without checking
the owning process and durable state.

**Preserve original bytes.** Write the response once, hash it, flush and retain it
unchanged. Record request start/end UTC, exact URL, actual HTTP status, TLS/client
configuration, byte count, transport, approved scope, policy-document URLs/check
date, source lineage and SHA256. Capture returned Date/Last-Modified/ETag only if
present, without interpreting them as TLE epochs. Any LF-normalized or native
derivative gets a distinct hash and transformation/version record. Do not relabel
retrieval time, local mtime or manifest generation time as element epoch.

**Validate independently.** Recheck complete TLE records, paired checksums,
canonical string NORAD identity, international designator, duplicates, finite
values, supported format/ranges, epoch span and existing14-day per-record freshness
logic. Preserve original element lines. No fabricated coordinates, brightness,
visibility or freshness. Stage unknown/unsupported identities as explicit failures
or reviewed exclusions, never silently truncate them. A group-count change or
loss of named pilot validation targets requires an explicit coverage diff and
review before candidate acceptance;155 is not an eternal source-count promise.
Fresh bytes can still contain stale or mixed-age elements. Report that distribution
and let the existing eligibility gate reject stale records; do not reset the gate.

**Bind a complete generation.** Generate raw-source, normalized/native payload,
manifest and validation report together under a unique immutable generation ID.
The manifest binds every filename/hash/size, source contract/profile, record counts,
identity inventory/diff, epoch/freshness summary, derived metadata provenance and
builder revision. Identical source bytes produce no claim of new orbital data.
Preserve standard magnitudes only by the already qualified identity/designator
join; a refresh does not license new photometry assumptions. Full-catalog and
limited-pilot validators remain separate, with explicit negative tests proving
that the155-record pilot still fails the original minimum1000 gate.

**Finalize atomically, then stop.** Validate the complete temporary generation,
flush its files/directory, and rename within the same filesystem to a new immutable
candidate directory; flush the containing directory. Publish no partial manifest,
overwrite no prior generation and change no active pointer. Final public data
files may be0444 or0644 with traverse-readable directories; staging, acquisition
logs and any sensitive operational receipt stay private. Verify actual container
readability before a later preview is admitted. Atomic rename alone does not
switch open files or bind mounts inside already running processes.

**Separate later preview admission.** After owner review of the candidate and
its source/science evidence, a separately authorized development preview can pin
both backend and native-serving containers to the same absolute generation
directory read-only. Stop/detach only those task consumers during transition;
create fresh processes/native frames to avoid cached old catalogs. Verify both
generation IDs/hashes, HTTP representation, decoded native contents, backend
identity/count and observed mount identities before making the pair available.
A partial startup or mismatch keeps the pair unavailable and restores the prior
task generation; never serve a mixed native/backend pair. This is not production
admission or a replacement of the original14k preview.

## Required future qualification and review gates

The future implementation should first prove offline failure behavior: lock
contention/crash recovery, backward-clock handling, durable cooldown,301/403/404/
429/5xx/304 stop behavior, timeout/oversize/partial bodies, invalid HTML returned
as200, checksum/duplicate/identity/epoch failures, interrupted writes, permissions,
destination collision and failed paired startup. Verify old bytes/manifests/mounts
remain untouched and error receipts cannot be mistaken for source success.

Only after that proof and explicit acquisition authority should one bounded live
request be attempted. If it fails, stop with diagnostic evidence. If it succeeds,
independent original-byte/science admission and read-only paired-preview proof are
still required. A new current-source browser pass must demonstrate native behavior
at the actual recorded observer/UTC, separately from simulation and source age.
Fresh source receipt does not resolve the existing approximately62arcsec absolute
comparison residual or establish physical observational accuracy.

Keep the proposal in its own reviewable commit/PR. Owner review must decide the
bounded implementation scope, candidate source/profile and approved transport
before any updater work; a later acquisition instruction must specify the allowed
attempt and stop conditions. Scheduled refresh, production promotion and full
catalog/OMM migration are separate future decisions. There is no automatic
promotion path in this proposal.

## Verification of this document

This task read the prior source assessment, rechecked the three official
documentation pages above with web open/find, and wrote only this file. No new
feed bytes, credentials, runtime assertions, tests or builds are claimed.
Document whitespace and local links are checked separately in the task handoff.
Implementation, live transport/header support, whole-file first-party receipt,
source freshness at a future run and ongoing operation remain **unqualified**.
