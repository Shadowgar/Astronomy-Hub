# Styling Decision (Phase 2.5 Package 5 Step 2)

Decision: formalized token/CSS system (not Tailwind)

Rationale (evidence-based, short):
- The repo already contains a token-like system (`frontend/src/design/tokens.css`) and multiple theme sheets (`frontend/src/design/themes.css`) plus a single root import (`frontend/src/main.jsx`).
- Tailwind is absent and would introduce a larger tool and build change; a token/CSS approach is less disruptive and allows incremental adoption.

Do / Do Not (explicit)
- Do: consolidate and treat `frontend/src/design/tokens.css` and `frontend/src/design/themes.css` as the canonical token sources.
- Do: import a single, root-level token/system CSS file (single-line import) at the app entry before other styles.
- Do Not: introduce Tailwind or other utility frameworks in this package.
- Do Not: perform component markup or broad CSS rewrites in this package.

Rollout boundaries
- Scope of this package: documentation, token canonicalization plan, and a minimal enforcement surface (token files + single root import) only.
- Component-by-component token migration is an incremental follow-up activity and must be executed in small PRs per domain.

Allowed exceptions
- Small, localized fixes strictly necessary for accessibility or to preserve existing behavior (must be documented and approved in the PR). These are exceptions, not the norm.

Acceptance checklist (must pass to close Step 2)
- `docs/styling_audit.md` is present and referenced as evidence.
- `docs/styling_decision.md` exists in the repo and states the chosen system.
- A clear rollout boundary paragraph exists that limits implementation to token files + single root import (Step 3) and defers component changes.
- No component markup changes, no Tailwind files, and no large CSS rewrites were committed as part of Step 2.

Canonical token file (Step 3): `frontend/src/styles/tokens.css` will serve as the minimal, canonical token bridge imported at app root.

End of decision.
