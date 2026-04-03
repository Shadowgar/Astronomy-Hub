# Feature Tracker (Authoritative State Record)

## Status Legend
- `REAL`: complete and proven
- `PARTIAL`: implemented but missing required proof/coverage
- `FAKE`: placeholder or non-authoritative behavior
- `BLOCKED`: cannot proceed due dependency/conflict

## Active Feature Slice
- Feature: Above Me Orchestration
- Status: PARTIAL
- Why: panel ownership/feed-boundary consistency is still incomplete.

## Runtime-Truth Inventory
| Feature | UI visible? | Real backend path? | Real data source? | Mock active? | Status |
|---|---|---|---|---|---|
| Command Center Shell | yes | yes | n/a | no | PARTIAL |
| Scope/Engine/Filter Control Surface | yes | yes | mixed | yes | PARTIAL |
| Scene Authority Rendering | yes | yes | mixed | yes | PARTIAL |
| Above Me Orchestration | yes | yes | mixed | yes | PARTIAL |
| Conditions Decision Support | yes | yes | yes | partial | PARTIAL |
| Satellite Pass Intelligence | yes | yes | yes | partial | PARTIAL |
| Solar System Context | yes | yes | yes | partial | PARTIAL |
| Deep Sky Targeting | yes | yes | mixed | yes | PARTIAL |
| Sun Activity Awareness | yes | yes | mixed | yes | PARTIAL |
| Alerts/Events Intelligence | yes | yes | mixed | yes | PARTIAL |
| Flight Awareness | yes | yes | mixed | yes | PARTIAL |
| Object Detail Resolution | yes | yes | mixed | yes | PARTIAL |
| News/Knowledge Feed | limited | no dedicated feed | no | yes | FAKE |
| Asset/Media Reliability | partial | partial | mixed | yes | PARTIAL |
| Performance and Cache Freshness | partial | partial | n/a | n/a | PARTIAL |

## Feature Evidence Card Template
For each feature slice, record in session brief:
- Feature
- User-visible output
- Endpoint or UI entry
- Backend service chain
- Data source(s)
- Remaining fake behavior
- Proof commands and outcomes
- Status change decision

## Update Rule
After each validated slice:
1. update row(s) above
2. update active feature slice
3. append evidence in `docs/context/LIVE_SESSION_BRIEF.md`
4. mirror factual summary in `docs/execution/SESSION_STATE.md`
