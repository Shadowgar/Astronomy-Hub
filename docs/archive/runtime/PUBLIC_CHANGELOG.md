# 📄 `PUBLIC_CHANGELOG.md` (USER-FACING)

---

# 🌌 ASTRONOMY HUB — DEVELOPMENT PROGRESS

---

## 🚀 CURRENT STATUS

**Phase 2 — Backend Foundation Through Step 7**

Phase 1 remains stable, and Phase 2 backend Steps 1–7 are complete (scope/engine/filter routing, internal scene generation, above_me alignment, and cross-engine object resolution).

---

## 🔧 CURRENT FOCUS

* Implementing Phase 2 Step 8 controlled endpoint exposure (scope → engine → filter) without breaking the existing pipeline
* Keeping Phase 1 runtime behavior and mounted command-center shell stable while backend expansion continues
* Keeping public/internal status records synchronized with verified Step 1–7 backend reality

---

## 🆕 RECENT PROGRESS

### ✅ Phase 2 Step 1 Completed — Spec Lock

* Scopes, engines, filters, and anti-drift rules are now explicit and locked in `PHASE_2_SPEC.md`.

### ✅ Phase 2 Steps 2–4 Completed — Routing Layer

* Backend now enforces scope routing, engine routing, and filter validation via `/api/scopes` with clean JSON 400 errors for invalid combinations.

### ✅ Phase 2 Steps 5–6 Completed — Internal Scene Pipeline

* Required engines (`deep_sky`, `planets`, `moon`, `satellites`) generate structured internal scenes with groups and reasoning.
* Existing `above_me` is aligned into the same internal Phase 2 pipeline while `/api/scene/above-me` remains stable.

### ✅ Phase 2 Step 7 Completed — Object Resolution Integrity

* `/api/object/{id}` now resolves representative objects across required engines (`above_me`, `deep_sky`, `planets`, `moon`, `satellites`) while keeping detail authority in the endpoint.
* Scene objects remain summary-level and do not duplicate detail payload fields.

### ✅ Backend Test Suite Passing

* Backend tests are currently passing in project runtime (`.venv/bin/python -m pytest backend/tests -q`).

---

## 🔄 IN PROGRESS

### 🧪 Phase 2 Step 8 Preparation

* Preparing controlled endpoint exposure for Phase 2 without bypassing the scope → engine → filter pipeline
* Holding Phase 1 runtime behavior stable while backend exposure work begins

---

## 🔜 COMING NEXT

* Phase 2 Step 8 — Scene endpoint exposure (backend)
* Phase 2 Step 9+ frontend controls (scope/engine/filter) after backend exposure is complete

---

## 🗺️ ROADMAP

### Phase 1 — Command Center (Current)

* Real-time sky view
* Object interaction
* Clean UI structure

### Phase 2 — Engine Exploration

* Explore Earth, Sun, Satellites, Solar System
* Filter-based views

### Phase 3 — Visual System

* 3D space navigation
* immersive visualization

### Phase 4 — Knowledge System

* research integration
* deep object linking

### Phase 5 — Intelligence System

* predictions
* recommendations
* alerts

---

## 🧠 VISION

Astronomy Hub aims to become:

> A complete command center for everything happening above you—
> from satellites to galaxies, all in one place.

---

## 📌 NOTE

This project is actively being developed.

Features and visuals may change as the system evolves.

---

# ⚙️ HOW THIS CONNECTS

Now you have:

| File                | Purpose              |
| ------------------- | -------------------- |
| EXECUTION_LOG.md    | internal truth       |
| PUBLIC_CHANGELOG.md | user-facing progress |
| SESSION_STATE.md    | current position     |

---

# 🚀 Next Step

Now:

👉 keep execution state and public progress synced with verified repository truth

Then we’ll:

* complete Phase 2 Step 8 endpoint exposure
* keep Phase 1 stability intact
* keep changelog outputs factual and current

---

Next milestone:

Turn `PUBLIC_CHANGELOG.md` into a live in-app progress page backed by `frontend/src/content/publicChangelog.json`.
