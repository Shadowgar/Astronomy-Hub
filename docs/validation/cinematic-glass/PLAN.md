# Owner-directed glass implementation plan

Owner directive2026-10-23 rejects PR90 visual appearance. Approved references remain
unchanged. G1/G2/V1 are authorized directly; no new design-direction gate.

1. G1: one canonical material contract in runtimes/shared/glass.css; reusable
   translucency, blur, highlights, borders and elevation. Hub mapping overrides
   legacy opaque fills. Native document imports the same contract.
2. G2: apply to actual search, selection, menu, rail, sheet and dialog variants
   in all modes. Add an explicit persisted reduced-transparency choice through
   shared mode menu, plus OS/media, unsupported-filter and forced-color fallbacks.
3. V1: independently inspect native Earth atmosphere/lighting and existing Sky
   display capability. Admit only proven supported changes; preserve source math,
   observer/UTC, camera controllers, scientific models, settings and data/rights.
4. Capture baseline/new actual three-mode scenes at1440×900,390×900,667×390,
   selected/expanded states and bright/dark material crops. Record computed styles,
   iframe composition limits, pointer/focus/keyboard/touch and measured costs.
5. Focused regressions plus frontend/types/native suites, actual cross-mode and
   recovery journeys. Repeat builds; verify served/source identities. Draft PR
   stacked on4fa9ffd8; independent review of exact committed head. No merge/deploy/R4.

Alternative full-screen shader/refraction rejected as unnecessary perpetual GPU
work. Three mode-specific material systems rejected because consistency is the
explicit requirement. Native iframe surfaces blur their own native canvas; Hub
chrome sampling across iframe boundaries must be verified rather than assumed.
