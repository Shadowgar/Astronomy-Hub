# 📄 `PUBLIC_CHANGELOG.md` (USER-FACING)

---

# 🌌 ASTRONOMY HUB — DEVELOPMENT PROGRESS

---

## 🚀 CURRENT STATUS

**Phase 1 — Command Center (Post-Audit Baseline)**

Phase 1 backend foundation and command-center baseline are in place with canonical scene/detail routes and a stable mounted frontend surface.

---

## 🔧 CURRENT FOCUS

* Maintaining the verified Phase 1 baseline after audit fixes
* Keeping the primary mounted command-center module grid shell aligned with canonical scene-backed data
* Preparing Phase 2 documentation/checklist readiness while keeping Phase 1 runtime behavior stable

---

## 🆕 RECENT PROGRESS

### ✅ Phase 1 Validation Pass Completed

* Phase 1 command-center checks were re-run end-to-end (scene, detail, location overrides, degraded backend handling, and responsiveness).

### 🧭 Interaction Flow Confirmed

* Canonical object detail interaction is available from mounted command-center modules (targets, passes, alerts) with quick return to the same context.

### 🌠 Command-Center Mounted Surface Confirmed

* Phase 1 now reflects the mounted UI truth: the command-center module grid shell is the primary surface, fed by canonical scene-backed backend data.

### 🛰️ Object Detail Coverage Completed

* Object detail now resolves consistently for the full Phase 1 object set (satellites, planets, and deep sky objects), with visibility guidance, at least one image, and related observing context.

### 🧱 Foundation Established

* Core data contracts implemented
* Object model standardized
* Backend structure aligned with long-term architecture

### ✅ Backend Test Suite Passing

* The backend test suite is currently passing in the project runtime (`.venv/bin/python -m pytest backend/tests -q`).

### 🌌 Above Me Scene Assembled

* The canonical `/api/scene/above-me` route is now available and returns a contract-valid Phase 1 scene combining normalized targets and visible passes. This provides the backend-owned answer to “what is above me right now?”

### 📘 Object Details Available

* The backend now provides canonical object detail payloads at `/api/object/{id}` for Phase 1 objects (planets, deep-sky, satellites), including explanatory text and representative images to help users understand why an object matters now.

### 🖥️ Frontend Command Center Shell

* The frontend command-center shell is now available. It renders the mounted module grid (conditions, recommended targets, upcoming passes, alerts/events, moon/news) from backend-owned data — forming the app's primary command surface.

### 🎯 Interaction & Detail Flow

* Panel entries for targets, passes, and alerts are now interactive: users can open canonical object detail views directly from panel entries without losing the Above Me scene context. This enables quick exploration of what to observe and why.

---

## 🔄 IN PROGRESS

### 🧪 Phase 1 Stability Guardrails

* Keeping public/internal progress records synchronized with verified repository state
* Holding Phase 1 behavior stable while preparing controlled Phase 2 execution

---

## 🔜 COMING NEXT

* Phase 2 execution readiness review against updated specs/checklists
* Controlled Phase 2 planning updates that do not alter Phase 1 runtime behavior

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

* maintain Phase 1 stability
* prepare controlled Phase 2 execution
* keep changelog outputs factual and current

---

Next milestone:

Turn `PUBLIC_CHANGELOG.md` into a live in-app progress page backed by `frontend/src/content/publicChangelog.json`.
