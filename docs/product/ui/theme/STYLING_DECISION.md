# Styling Decision — Astronomy Hub (2.5F Step 2)

Purpose: record the canonical styling system for Astronomy Hub and establish a clear operating rule to prevent hybrid drift. This is a decision record only — no implementation or scaffold is included here.

Decision (canonical system)
- Chosen system: CSS custom-properties (design tokens) + scoped global CSS classes. Continue and formalize the current token/CSS approach rather than adopting a utility framework like Tailwind at this time.

Rationale (evidence + fit for current phase)
- The codebase already emits and consumes CSS custom properties extensively (`frontend/src/styles.css`, `frontend/src/design/tokens.css`, `frontend/src/design/themes.css`, and the compiled `frontend/dist` bundle).
- A token/CSS continuation minimizes risk and scope for Phase 2.5: it avoids adding build/config changes (Tailwind) and lets us stabilize a single source-of-truth before undertaking larger refactors.
- The audit (2.5F Step 1) found tokens and theme maps already in place and a small token bridge file (`frontend/src/styles/tokens.css`), making token-based standardization the least disruptive path.

Authoritative styling surfaces (single-source-of-truth)
- Primitive tokens: `frontend/src/design/tokens.css` (spacing, radii, typography scale, motion primitives).
- Theme maps: `frontend/src/design/themes.css` (theme-scoped variable groups).
- Runtime/global tokens & module classes: `frontend/src/styles.css` (the primary runtime-facing token set and global utility/module classes).
- Migration bridge (legacy): `frontend/src/styles/tokens.css` — treat as legacy migration artifact until explicitly consolidated.

Anti-Hybrid Rule (explicit)
- Statement: Do NOT introduce a mixed styling approach. Styling must be authored using the canonical token/CSS system above. Utility frameworks (Tailwind, etc.), component-level hard-coded tokens in arbitrary files, or distributed token copies are forbidden until a deliberate migration plan is approved.

What is allowed
- Author new styles using the canonical tokens and classes in the files listed above.
- Add component-scoped CSS files only when truly necessary for encapsulated styles, but they must consume tokens (CSS variables) for visual values (spacing, color, radius, typography).
- Use inline `style` props only for values that are computed at runtime and cannot reasonably be expressed with tokens (rare). When used, document the reason in the PR description.

What is forbidden
- Introducing Tailwind or other utility-first frameworks in this phase.
- Creating new token files outside `frontend/src/design/` or `frontend/src/styles/` without explicit approval.
- Hard-coding visual values (colors, spacing, radii, font sizes) in components or new CSS files instead of referencing tokens.
- Allowing token divergence: do not copy or redefine tokens in multiple files; reference the authoritative token names instead.

Legacy (unchanged for now)
- The existing `frontend/src/styles/tokens.css` bridge file and any component-local CSS discovered in the audit remain as legacy artifacts. They will be evaluated during Step 3 (scaffold & migration) but are not changed now.

Acceptance criteria for 2.5F (decision gate)
- `docs/STYLING_DECISION.md` exists in the repository and documents the canonical choice.
- A corresponding developer-facing guide (`frontend/README-STYLE.md`) is present.
- The anti-hybrid rule is explicit and unambiguous in both docs.
- No build, runtime, CSS, component, or config changes were introduced in this step.

Signoff
- Reviewer: ______________________  Date: ___________
- Approve (check one): [ ] Approve   [ ] Request Changes

Notes
- This document is intentionally concise and authoritative — it records the decision and the guardrails for Step 3. Implementation work (scaffold, token consolidation, or Tailwind evaluation) must be executed only after explicit approval and will be performed in subsequent steps.
