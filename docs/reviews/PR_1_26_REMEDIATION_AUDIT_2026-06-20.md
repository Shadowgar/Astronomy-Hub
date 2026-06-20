# PR 1-26 Review Remediation Audit

Date: 2026-06-20

## Scope

This audit reviewed GitHub review threads and check feedback for pull requests
#1 through #26, then verified each actionable finding against the current
`main` code rather than applying stale suggestions mechanically.

## Disposition

| Pull requests | Disposition |
| --- | --- |
| #1-#2, #4-#9, #12, #16-#18, #23 | No current actionable findings. |
| #3 | Active response schemas and container security corrected. Legacy-only findings were verified separately. |
| #10 | Runtime null-selection guards, logging API use, and rejected WASM import handling corrected and rebuilt. |
| #11 | Production skydata health checks, `rsync` preflight, data-neutral runtime builds, and release commands corrected. |
| #13-#15 | Catalog parsing, response contracts, and previously merged solar-system corrections verified; stale Above Me documentation updated. |
| #19-#20 | Production backend now mounts the TLE feed and receives its runtime path. |
| #21 and #25 | Compact OpenNGC IDs now normalize consistently with spaced IDs. |
| #22 | Approved query-only Pan-STARRS providers receive a narrow runtime policy classification; the general CDS prohibition remains. |
| #24 | `/api/above-me` is present and covered by current tests. |
| #26 | Review fixes were already present before merge and were revalidated. |

## Additional Failures Found During Validation

Broad regression testing exposed current-code defects not fully represented by
the original review threads:

- Production Compose used a backend build context incompatible with
  `backend/Dockerfile` and selected the uninstalled `psycopg2` driver.
- Strict Phase 1 scene responses returned unsanitized internal records.
- Sky scene star aliases were produced by the catalog but rejected by the
  strict response contract.
- Legacy target normalization omitted required provenance and silently dropped
  planet and DSO fixtures.
- Phase 2 object-detail tests discarded their deterministic scene timestamp.
- The extended DSO remote-fallback test contradicted the behavior merged in
  PR #28.

These issues are included in the same remediation because they blocked the
full test and production-build gates used to verify the review fixes.

## Preserved Product Decisions

- `/oras-sky-engine/` remains the active ORAS Stellarium runtime.
- Pan-STARRS remains explicit-query only; DSS remains the safe fallback.
- No DESI promotion or public survey selector was added.
- No bulk skydata is baked into Docker images.
- The validated satellite feed remains at 14,281 records; runtime compilation
  no longer refreshes that data as a side effect.
