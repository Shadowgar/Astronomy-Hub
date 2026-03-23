# Phase 2 — Structured Data, Drill-Down Depth, and Location Intelligence

---

## 1. Purpose

Phase 2 transforms Astronomy Hub from a **mock-driven decision interface** into a **structured, data-backed system with controlled depth**, while preserving the Phase 1 core:

> “What should I know about the sky right now from where I am, and what should I look at?”

Phase 2 is NOT about adding more data.

Phase 2 is about:

* **making data reliable**
* **making depth available on demand**
* **keeping the surface calm and actionable**

---

## 2. Phase Identity (Critical)

Phase 2 is:

> **Structured depth + controlled expansion + location intelligence**

Phase 2 is NOT:

* a visualization system (Phase 3)
* a global system (Phase 4)
* a platform or ecosystem (Phase 5)

---

## 3. Relationship to Phase 1

### Phase 1 Remains Authoritative For:

* Dashboard layout
* Module purpose
* Decision-support philosophy
* Active Observing Location model
* Mode system (Day/Night/Red)
* Query param override behavior

### Phase 2 Extends:

* Data depth
* Data correctness
* Drill-down capability
* Location selection UX
* Backend structure

---

## 4. Non-Negotiable Constraints

Phase 2 MUST:

* Preserve **summary-first UX**
* Preserve **low cognitive load**
* Maintain **deterministic behavior**
* Follow **contract-first design**
* Avoid **data dumping**
* Avoid **visual clutter**
* Avoid **implicit behavior changes**

---

## 5. Phase 2 Success Definition

Phase 2 is complete when:

* Dashboard still answers the core question instantly
* Every dashboard item can be explored deeper without confusion
* Data is structured, normalized, and predictable
* Failures degrade gracefully
* Location selection is intuitive and reliable
* No Phase 1 behavior regresses

---

## 6. Core Interaction Model (Expanded)

### Phase 1 Loop (unchanged)

1. Open dashboard
2. Understand conditions
3. Identify opportunity

### Phase 2 Extended Loop

4. Select item (target/pass/event)
5. Inspect deeper information
6. Understand *why it matters*
7. Return to summary OR continue exploration

---

## 7. Information Architecture

## 7.1 Dashboard (UNCHANGED STRUCTURE)

Modules:

* Conditions
* Targets
* Alerts
* Passes
* Moon Summary

### Phase 2 Rule:

> No new modules are added in Phase 2.

---

## 7.2 Drill-Down Architecture (NEW DEFINITION)

Each module supports:

### Level 1 — Summary (Dashboard)

* Minimal, decision-focused

### Level 2 — Expanded Row / Inline Detail

* Quick context expansion
* No navigation required

### Level 3 — Full Detail View

* Structured, scrollable, organized

---

## 8. Module Expansion Specifications

---

## 8.1 Targets

### Summary (existing)

* Name
* Type
* Visibility score

### Expanded (NEW)

* Visibility window
* Direction (general)
* Quick notes

### Full Detail (NEW)

* Description (plain-language)
* Visibility timeline
* Best viewing time
* Magnitude (normalized)
* Classification (enum)
* Observational notes
* Equipment suggestion (simple)

### Density Rule:

* Max 5 visible sections before collapse

---

## 8.2 Passes (ISS / Satellites)

### Summary

* Time
* Duration
* Brightness

### Expanded

* Start/end direction
* Peak altitude
* Visibility quality

### Full Detail

* Trajectory summary (textual)
* Brightness curve (optional numeric, not graph)
* Viewing conditions interaction

---

## 8.3 Events

### Summary

* Event name
* Time window

### Expanded

* Visibility likelihood
* Conditions impact

### Full Detail

* Description
* Viewing instructions
* Required conditions
* Risk factors (clouds, light pollution)

---

## 8.4 Conditions

### Summary

* Cloud cover
* Seeing
* Transparency

### Expanded

* Hourly trend (textual)
* Stability indicator

### Full Detail

* Breakdown by factor
* Interpretation (plain language)

---

## 8.5 Moon

### Summary

* Phase
* Illumination %

### Expanded

* Rise/set

### Full Detail

* Impact on observing
* Best/poor target types

---

# 9. Location Intelligence (CRITICAL ADDITION)

---

## 9.1 Purpose

Replace manual lat/lon entry with:

> **Human-friendly location selection → reliable coordinates**

---

## 9.2 UX Flow

1. User opens location selector
2. Types address/place
3. Suggestions appear (debounced)
4. User selects result
5. System resolves coordinates
6. User confirms apply
7. Dashboard updates

---

## 9.3 Rules

* No auto-apply
* Selection required
* Reset to ORAS always available
* Current location always visible

---

## 9.4 Failure Handling

| Scenario     | Behavior            |
| ------------ | ------------------- |
| No results   | Show message        |
| API error    | No state change     |
| Timeout      | Retry option        |
| Rate limit   | Disable temporarily |
| Invalid data | Reject              |

---

## 9.5 Validation

* Minimum 3 characters
* Trim whitespace
* Validate lat/lon range
* Reject malformed responses

---

## 9.6 Architecture Decision (LOCKED)

> Geocoding is **backend-mediated**

Frontend:

* calls `/api/location/search`

Backend:

* calls provider
* normalizes response
* enforces contract

---

## 10. Backend Architecture (EXPANDED)

Backend responsibilities:

* Data ingestion
* Normalization
* Contract enforcement
* Geocoding proxy
* Caching
* Failure shielding

---

## 11. Data Contracts (REQUIRED)

All endpoints must define:

### 11.1 Standard Object Rules

* predictable fields
* no provider leakage
* no dynamic keys

---

### 11.2 Example: Target Detail

```
{
  id: string,
  name: string,
  type: "galaxy" | "nebula" | "cluster" | "planet",
  visibility: {
    start: ISO,
    peak: ISO,
    end: ISO
  },
  magnitude: number,
  notes: string
}
```

---

### 11.3 Error Contract

```
{
  error: {
    code: string,
    message: string
  }
}
```

---

## 12. Normalization Rules

* Units standardized (degrees, magnitude)
* Enum-controlled types
* Unknown values → null, not omitted
* Source precedence defined
* No raw provider fields

---

## 13. Caching Strategy

### Categories

| Type       | Freshness |
| ---------- | --------- |
| Conditions | Short     |
| Passes     | Medium    |
| Events     | Medium    |
| Targets    | Long      |

---

## 14. Persistence (STRICTLY LIMITED)

Allowed:

* normalized data cache

Not allowed:

* user accounts
* saved locations
* analytics storage

---

## 15. Failure & Degraded Mode

System MUST:

* never crash UI
* show partial data when possible
* label stale data
* preserve dashboard usability

---

## 16. Performance Constraints

* debounce search
* cancel in-flight requests
* cap results (max 8)
* prevent duplicate calls

---

## 17. UX Density Rules (CRITICAL)

* No more than 5 visible sections per detail view
* No raw data tables
* No multi-column overload
* Mobile-first readability enforced

---

## 18. Compatibility Rules

* Phase 1 API behavior remains valid
* Query param override still works
* Mode system unchanged
* No breaking changes without contract update

---

## 19. Risks & Mitigations

| Risk            | Mitigation           |
| --------------- | -------------------- |
| Data overload   | Density rules        |
| API instability | Backend shielding    |
| Schema drift    | Contract enforcement |
| Slow UI         | caching              |

---

## 20. Validation Checklist

* Dashboard clarity unchanged
* Drill-down adds value, not noise
* Location search reliable
* Failures handled cleanly
* Contracts enforced
* No Phase 1 regression

---

## 21. Implementation Order (FOR LATER)

1. Contracts
2. Backend normalization
3. Drill-down UI
4. Location search
5. Caching
6. Failure handling

---

## 22. Final Definition

Phase 2 is complete when:

> The user can go from **“What should I look at?”**
> to
> **“I understand exactly why and how to observe it”**
> without ever feeling overwhelmed.