# Coding Guardrails

## Purpose

Prevent AI drift and overengineering.

---

## Rules

- Do NOT implement Phase 2 features
- Do NOT introduce new data fields without updating contracts
- Do NOT add new pages outside defined structure
- Do NOT add complex rendering systems
- Do NOT introduce heavy libraries
- Do NOT build globe/3D systems

---

## Development Rules

- Mock-first always
- One module at a time
- Validate before moving on
- Keep files small and focused

---

## Backend Rules

- Only build required endpoints
- Return static/mock data first
- No database in Phase 1