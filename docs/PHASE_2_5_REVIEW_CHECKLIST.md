# Phase 2.5 — Package 0 Review Checklist

Purpose: explicit, observable checks a reviewer must perform to approve Package 0 (Steps 1–3).

General rule: reviewer may only rely on repository contents and visible commits. If an item is not present or is ambiguous, mark it as `Needs clarification` and request a corrective small commit.

Step 1 — Baseline audit verification
- Check file exists: `docs/PHASE_2_5_BASELINE_AUDIT.md`.
- Confirm the file documents:
  - current backend startup path (a `python3 backend/server.py` usage line or equivalent);
  - current frontend startup path and npm scripts (presence of `frontend/package.json` scripts referenced);
  - current backend and frontend run commands (listed verbatim or by script name);
  - ports in use (backend default 8000, frontend preview 4173 or note of unknown dev port);
  - visible environment/config assumptions (e.g., `PORT`, `LOG_LEVEL`, Vite proxy to 127.0.0.1:8000);
  - current test command(s) observed in repo (pytest references).
- Exit criteria for Step 1: all the above items are present in the baseline file; missing items must be marked `unknown` explicitly in the file.

Step 2 — Inventory verification
- Check files exist:
  - `docs/PHASE_2_5_ENDPOINT_INVENTORY.md`
  - `docs/PHASE_2_5_BACKEND_INVENTORY.md`
  - `docs/PHASE_2_5_FRONTEND_INVENTORY.md`
  - `docs/PHASE_2_5_KNOWN_INSTABILITIES.md`
- For `PHASE_2_5_ENDPOINT_INVENTORY.md`: confirm it lists observable endpoints and, for each, includes route, method (if visible), implementing file, response summary (or `unknown`), and degraded/error behavior (or `unknown`).
- For `PHASE_2_5_BACKEND_INVENTORY.md`: confirm presence of runtime entry file (`backend/server.py`), listed normalizers/validators and their paths, cache/service modules, and backend tests references.
- For `PHASE_2_5_FRONTEND_INVENTORY.md`: confirm it lists entry files (`frontend/package.json`, `frontend/vite.config.mjs`, `frontend/src/main.jsx`), adapters/utilities touching backend payloads, major components consuming backend data, and primary CSS/theme files.
- For `PHASE_2_5_KNOWN_INSTABILITIES.md`: confirm each instability is phrased as an observed risk and tied to evidence files (file paths or tests listed).
- Exit criteria for Step 2: all four files exist and contain the required observable items; ambiguous fields must be labeled `unknown` within the document.

Step 3 — Governance verification
- Check file exists: `docs/PHASE_2_5_BRANCH_DISCIPLINE.md`.
- Confirm it documents at minimum:
  - a phase-local branch naming rule (or notes the repo rule if observed);
  - commit size guidance and one-step-per-commit discipline;
  - docs-only commit handling (use of `docs(2.5):` prefix);
  - explicit prohibition on mixing Package 0 with later packages;
  - reviewer handoff expectation referencing this checklist.
- Check file exists: `docs/PHASE_2_5_REVIEW_CHECKLIST.md` (this file) and ensure reviewer uses it to approve Steps 1–3.
- Exit criteria for Step 3: all governance items present and actionable; if any governance item relies on an unobservable repo policy, it must be explicitly labeled as a Phase 2.5 project rule.

Final Package 0 exit gate (observable checks)
- The reviewer must confirm all of the following by inspecting the repo state and the committed artifacts:
  - `docs/PHASE_2_5_BASELINE_AUDIT.md` exists and documents baseline runtime truth (Step 1 pass).
  - Endpoint inventory file `docs/PHASE_2_5_ENDPOINT_INVENTORY.md` exists and enumerates observed endpoints.
  - Backend inventory file `docs/PHASE_2_5_BACKEND_INVENTORY.md` exists and lists runtime entry, normalizers, cache, and relevant tests.
  - Frontend inventory file `docs/PHASE_2_5_FRONTEND_INVENTORY.md` exists and lists adapters, components, and CSS files.
  - `docs/PHASE_2_5_KNOWN_INSTABILITIES.md` exists and records observed risks with evidence.
  - `docs/PHASE_2_5_BRANCH_DISCIPLINE.md` exists and documents phase-local branch/commit discipline.
  - No source code files were changed in Package 0 commits (verify by reviewing the commit diff for doc-only files).

If all checks pass, the reviewer may mark Package 0 as approved and provide a short review note linking to this checklist and the commit/PR used for approval.
