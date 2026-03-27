# Phase 2.5 — Branch & Commit Discipline (Package 0)

Note: where the repo does not declare a branching convention, the following is a minimal, phase-local project rule for Phase 2.5 only.

- Branch naming (project rule for Phase 2.5):
  - Use short, descriptive branches prefixed with `2.5/` (example: `2.5/baseline-audit` or `2.5/fastapi-entrypoint`).

- Commit size expectations:
  - Keep commits small and focused: one logical atomic change per commit (preferably a single file or a tight set of related files).
  - Prefer commits that are easy to review and revert.

- One-step-at-a-time execution discipline:
  - Work must follow the Package ordering in `docs/PHASE_2_5_IMPLEMENTATION_PLAN.md`.
  - Each Step in a Package is executed and merged before beginning the next Step in that Package.

- Docs-only commit handling:
  - Use commit message prefix `docs(2.5):` for all Phase 2.5 documentation commits.
  - Docs-only commits are allowed to be merged independently and should not contain code changes.

- Prohibition on mixing Package 0 with future packages:
  - Do not bundle changes from Packages 1..6 into Package 0 commits or branches. Package 0 must be exclusively discovery and governance artifacts.

- Reviewer handoff expectations after each atomic step:
  - Open a branch named per the rule above, push the branch, and create a PR or request a reviewer to inspect the branch.
  - Provide a short summary of what was captured in the commit and which Step it satisfies (Step 1/2/3).
  - Reviewer confirms pass/fail using the `docs/PHASE_2_5_REVIEW_CHECKLIST.md` (Package 0 checklist).
