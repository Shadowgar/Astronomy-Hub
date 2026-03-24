# UI Master Plan

This document defines the UI track for Astronomy Hub and aligns the UI roadmap with the project Master Plan and Phase 1 objectives.

## Purpose

Treat the UI as a first-class, phased track that follows and supports the system roadmap. The UI track focuses on information architecture, accessibility, low-overload decision support, and incremental polish across phases.

## Principles (inherited from Project)
- Decision-support first
- Low cognitive overload
- Local-first (Active Observing Location)
- Drill-down over data dumping
- Astronomy-safe Red Mode

## UI Phases
- UI Phase A: Information architecture and MVP shell (dashboard layout, mode system, mock-first modules)
- UI Phase B: Polished dashboard, design tokens, responsive refinements, accessibility improvements
- UI Phase C: Interactive exploration UI (rich drill-down pages, richer satellite/target detail)
- UI Phase D/E: Advanced visualization, analytics, deployment hardening (listed here for roadmap continuity only)

## Status
- **UI Phase A:** COMPLETE
- **UI Phase B:** ACTIVE (Product UI Transformation)

## Deliverables per phase (high level)
- Phase A: Dashboard shell, header with location & mode controls, module cards (Conditions, Targets, Alerts, Passes, Moon Summary), mobile-friendly layout, red/night/day modes, mock-data compatibility.
- Phase B: Design tokens, reusable Card/Section components, refined typography, color system, improved accessibility, polished responsive behavior, visual QA.
- Phase C: Rich drill-down pages, improved interactive components, enhanced satellite and target exploration flows.

## Constraints
- Do not introduce Phase 2+ backend complexity in early UI phases.
- Mock-first development: no real external APIs until Phase 1 is validated.
- Preserve density rules (max targets/passes/alerts) through UI constraints.

## Ownership
- UI track is the responsibility of the frontend engineer(s) working from the docs in `/docs` and the mock endpoints in `/backend`.



