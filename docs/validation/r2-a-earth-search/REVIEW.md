# R2-A bounded source review

Independent read-only reviewer inspected the candidate against integrated base
`d1e3a75c`, using the mandatory Default Mode context and R2 ledger/plan.
Two P2 findings were reproduced in real tests and corrected within R2 scope:

1. Valid Essen/postcode address queries were classified as malformed coordinates.
   New frontend tests first failed3 cases; all15 search tests now pass as part of
   the final289-test suite. Browser journeys also use real Essen source results.
2. Invalid nonempty provider data became a cached empty success on retry.
   Docker RED reproduced503 then200; the correction retains an unavailable sentinel.
   Two503 responses/one provider call pass in the final43-test Docker bundle.

Reviewer follow-up: both findings resolved; no new finding in that bounded review.
The reviewer separately inspected the legal-asset allowlist/test correction and
confirmed it fixes the omitted served MIT notice. No additional proven P1/P2 was
reported. No source fix outside this R2 scope, native controller edit or N1
acceptance question was introduced. Exact delivery SHA identity is checked after
commit; its final review result is reported in the delivery handoff/PR.

Raw failed and passing output remains under output/r2-a; committed readable log
copies normalize trailing whitespace only. Browser proof/screenshot bytes are
copied unchanged. This review is not physical-device, full imagery/cache,
production, or N1 full-navigation qualification.
