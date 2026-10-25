# Satellite regression investigation

Base: PR95 `9ee6d85982edb3db276490706a82af83538e5e8d`.
Default Mode packs: frontend_change, backend_change, validation, review, debug.
[Exact loaded-document inventory and bounded ranges](loaded-documents.json).
Only the owner-required N1 satellite README/evidence was added explicitly; no full
docs scan. The current owner directive narrowly supersedes PS3's stop checkpoint.

| Suspected cause | Proven? | Evidence | Correction |
|---|---|---|---|
| Paused astronomical time | Yes for fixed historical preview/return routes; no spontaneous freeze reproduced on ordinary no-date Sky | Native UTC/speed samples for six entry paths; fixed date speed0, ordinary Sky speed1 | Name frozen scenes Paused, direct Resume Live. Preserve intentional historical contracts |
| Stale TLE release | Yes, every mounted element stale | Fresh actual native count14,281;0 malformed/checksum failures; May16–June5 epochs,140–161days old at Oct24 audit | Honest Stale data and per-NORAD age. Bounded acquisitions on Oct24 and25 timed out; no release promoted |
| Native satellite propagation | Historical motion works; no renderer propagation regression reproduced | Real native coordinates at multiple times; historical source-valid controls43689/28096 compared independently with Skyfield | No SGP4/photometry/coordinate change |
| Wide-field symbol suppression | Intentional, not proof of suppressed light points | Separate native point on/off pixels at120°; no forced symbol. Native hints automatically appear after real close input | Keep5°entry/7°exit/minimumoffset4 |
| Native light-point magnitude gate | Separate native rule confirmed; eligible historical control renders | Native vmag and actual point pixels, symbol pixels counted separately | Do not brighten satellites or add decorative points |
| Discovery latency | Native bounded traversal confirmed; not established as owner failure cause | Pinned native source; bounded discovery settling in actual browser | Wait a bounded native traversal in evidence, no giant DOM catalog or per-frame Hub work |
| Tracking lock | Hub bridge missing; plus review found old lock falsely attributed to new selection | Baseline hardcoded trackable:false/tracking:false; actual TrackA→selectB retained lockA before correction | Expose native pointAndLock/setTracking; clear previous satellite lock when embedded selection changes, preserve time and standalone lock semantics |
| Runtime time restoration | No unwanted repeated/stale time-intent freeze reproduced in audited paths | Normal, historical, Solar/system/Moon return and selection/URL churn audits | Preserve existing time-intent contracts; no guessed fix |
| Renderer resource/load failure | One Sky startup failure observed; root cause not established at initial evidence | Navigation failure retained; bounded diagnostic documented in browser report | No timeout inflation or resource-management project |
| Native user preference restoration | Proven zoom and immediate-exit gaps | Unit RED for user hints-off followed by zoom/disposal; independent review | Observe external visibility/offset before restoring owned overrides; keep satellite visible preference untouched |
| Source-status truth | Proven missing manifest misreported feed as absent; nearest epoch falsely qualified mixed catalog | API RED fixtures + actual native file served200 while oldAPI said mounted:false/count0 | Distinguish mounted/parsed/manifest validated/freshness/provenance; per-record counts and current-UTC selected age |
| Date-boundary freshness metadata | Exact-head review reproduced a P3 overflow | Accepted UTC years0001/9999 producedHTTP500 when adding/subtracting14days | Clamp comparison bounds to representable UTC limits; no per-record rescan or orbital calculation change |
| Configured source-path binding | Independent review reproduced alternate configured feed borrowing canonical release provenance | Two RED fixtures: alternate native or manifest path | Validate only exact configured canonical release filenames; fallback stays truthful and unvalidated |

Native orbit/point rendering may extrapolate old elements, but this is never a claim
that an actual satellite occupies that position today. The candidate API rejects
>14day elements; geometric altitude alone does not establish optical eligibility.

Source identity: protected native gzip1,360,442bytes,
SHA256 `431592eb5ec6db56d79c26792853f3fafe36ddf76c98834d9ddb36ddc0846436`.
No adjacent release manifest, release ID, provider or acquisition provenance is
available. File mtime is not an acquisition date. The native data was not replaced.
The canonical existing status endpoint is `/api/sky/satellite-feed`; the directive's
`/api/v1/sky/satellite-feed` path is404. No unrelated alias was introduced.

Two requests, twenty hours apart and separated by the environment restart, used the existing CelesTrak active/TLE source with8MiB limit,
120second deadline, redirects disabled and no retries. Each returned no status or
bytes. Official source limits and the six-digit/TLE coverage limitation are in the
committed catalog report. No source promotion, protected release replacement or
indefinite extrapolation accuracy claim is authorized.
