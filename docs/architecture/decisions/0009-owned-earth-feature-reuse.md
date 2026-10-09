# ADR 0009: Hub-owned Earth with preferential bounded feature reuse

Date: 2026-10-08. Status: accepted owner architecture; documentation reconciliation.
No new implementation, dependency, provider account or pin update is authorized.

## Context and supersession

Historical [ADR0003](0003-gods-eye-earth-runtime.md) and the Phase B study selected
complete-app consumption. The Phase C owner pivot implemented an independently
owned Earth Viewer instead. [Audit evidence](../../audits/GODS_EYE_CAPABILITY_IMPLEMENTATION_RECONCILIATION_2026-10-05.md) identifies
four questionable relationships, zero proven unjustified rewrites and substantial
public factories/helpers worth evaluating at function/module level.

This supersedes ADR0003's full-app/Viewer ownership and consumption topology,
while retaining its complete applicable future capability scope and upgradeability.
It clarifies [ADR0004](0004-additive-earth-extensions.md): ORAS-site/context and
bounded layer registry exist; broad astronomy extensions still require separate
source/contract/qualification work. The historical decision text remains intact.

## Decision and ownership

Astronomy Hub owns shell, product intent/canonical integration state, independently
instantiated Cesium Viewer, Earth bridge/lifecycle, layer/selection/attribution
control and justified provider/security boundaries. SWE owns its sky scene/math
and native camera/selection; no shared scene renderer or second SWE behind Earth.
God's Eye is pinned external feature code at `e7707d9a0f34d9fbffc300023c319f95caa5be30`. Source is immutable by
default. **Prefer qualified reuse/wrapping over unnecessary reimplementation.**
Never import the complete application, main startup or upstream Viewer singleton.
Preserve applicable non-astronomy features in the capability plan under their
phase/provider/license gates; absence today is not reason to delete their scope.

| Pattern | Required reasoning and proof |
| --- | --- |
| REUSE EXACTLY | Execute a qualified unchanged exported function/module; preserve notices/inputs/results. |
| WRAP | Inject owned Viewer/source/services/selection/clock and register abort/dispose; preserve upstream behavior where applicable. |
| PORT WITH MINIMAL CHANGE | Public seam genuinely unavailable; investigate generic export/hook first, then tiny documented patch/port with provenance, tests and upgrade/removal plan. |
| JUSTIFIED HUB IMPLEMENTATION | Record specific science/DTO/security/license/product/performance reason and scoped evidence; preserve stronger truth guards. |
| QUESTIONABLE HUB IMPLEMENTATION | Source behavior lost without demonstrated sufficient reason; investigate before replacement; not a proven unjustified rewrite. |
| REJECT / NOT APPLICABLE | Explicit incompatibility, unavailable rights, irrelevant restricted pack or misleading claims; document owner decision and disposition. |

Planning names map to audit `HUB IMPLEMENTATION JUSTIFIED`,
`HUB IMPLEMENTATION QUESTIONABLE` and `DO NOT USE`; audit UNKNOWN is retained
where no relationship or reason has been established. No count reclassification.

## Consequences

Evaluate provider/normalization/records/motion/render/lifecycle/tracking seams
before coding; document rejected reuse alternatives. Owned Viewer alone is not
evidence that an entire feature must be rewritten. Preserve typed altitude/TLE,
finite position/source-age guards, payload/request/density budgets and string IDs.
Do not prescribe a broad rewrite of all adapters. Source status and selected
last-known data must remain honest; unavailable data cannot receive new freshness.

FastAPI is canonical. A narrowly qualified renderer provider exception remains
possible under STACK_OVERVIEW, not an inherited Node backend. Decide credentials,
CORS, aggregate quotas/cache, streaming/validation and data/asset rights separately;
same-origin is not a security boundary. Current browser transport does not prove
unlimited/legal public deployment. Future source API changes require qualification.

Execution: [PROJECT_STATE](../../execution/PROJECT_STATE.md).
Planning: [Earth plan](../../execution/EARTH_CAPABILITY_PLAN.md),
[C5.7 proposal](../../execution/C5_7_EARTH_CORE_RECOVERY_SPEC.md),
[C6 direction](../../execution/C6_GLOBAL_MAPPING_SPEC.md).
