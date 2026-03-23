# Phase 2 — Structured Data, Drill-Down Depth, and Location Intelligence

---

## Implementation Order (With Rationale)

1. Data Contracts
  → Prevent schema drift

2. Backend Normalization
  → Ensure consistent structure

3. Drill-Down UI
  → Validate UX before complexity

4. Location Search
  → Integrate into stable system

5. Caching Layer
  → Improve performance after correctness

6. Failure Handling
  → Harden system last


## 1. Purpose

Phase 2 transforms Astronomy Hub from a **mock-driven decision interface** into a **structured, data-backed system with controlled depth**, while preserving the Phase 1 core:

> “What should I know about the sky right now from where I am, and what should I look at?”

Phase 2 is NOT about adding more data.

Phase 2 is about:

* **making data reliable**
* **making depth available on demand**
* **keeping the surface calm and actionable**

---

### Phase 2 Preservation Rules

Phase 2 MUST preserve all Phase 1 behavioral guarantees:

* The dashboard remains the primary entry point
* The system remains decision-support first
* Summary modules remain minimal and readable
* No Phase 2 feature may increase initial cognitive load
* No Phase 2 feature may introduce required interaction before insight

Phase 2 adds depth **only after user intent is expressed**.


## 2. Phase Identity (Critical)

Phase 2 is:

> **Structured depth + controlled expansion + location intelligence**


## 11.4 Contract Enforcement Rules

All Phase 2 data must follow strict contract rules:

* All responses must match defined schema exactly
* Unknown fields must be ignored
* Missing required fields must result in rejection of that object
* No dynamic or inferred fields
* All schema changes must be documented before use

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

### Phase 2 Scope Enforcement

The following rules define the boundary of Phase 2:

Allowed in Phase 2:

* richer structured data
* drill-down depth
* normalized backend data
* controlled ingestion
* location selection via address search
* caching and freshness awareness

Not allowed in Phase 2:

* interactive sky maps (Phase 3)
* time scrubbing / time navigation (Phase 3)
* multi-location comparison (Phase 4)
* saved user locations (Phase 4+)
* global awareness systems (Phase 4)
* plugin systems or extensibility layers (Phase 5)
* AI-driven recommendations (Phase 5)


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

## Phase 2 Core Interaction Model (Extended)

Phase 2 extends the Phase 1 interaction loop into an explicit observable model that must be preserved by implementations. This model defines intent, action, and response semantics for all added behaviors in Phase 2:

1. User intent is explicit (selection, apply location, or refresh)
2. System validates intent and requests minimal enrichment
3. System surfaces structured detail; heavy enrichment is loaded on demand
4. User may act on insight but no write actions are introduced in Phase 2
5. System returns to the user with clear affordances for next steps

All Phase 2 features must reinforce this loop and must not introduce implicit behavior that changes the user's mental model.

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

## Detail View Behavior Rules

All drill-down views must follow strict structure rules:

* Sections must appear in a consistent order
* Maximum of 5 visible sections at once
* Additional sections must be collapsed by default
* No horizontal scrolling
* No nested scroll regions
* No tab-based navigation in Phase 2
* No graphs or charts (reserved for Phase 3)
* Every detail view must have a clear return path

Detail views must **explain**, not overwhelm.

## State Management Rules

Phase 2 introduces additional state and must remain deterministic:

* Active Observing Location changes ONLY on explicit confirmation
* Pending selections must never affect system data
* Failed requests must NOT change system state
* Partial data must NOT overwrite complete data
* Cached data must NOT silently override fresh data

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

## Location Selection — Extended Rules

### Application Rules

* Selecting a suggestion does NOT update location
* Resolving coordinates does NOT update location
* ONLY explicit “Apply” updates Active Observing Location

### Refresh Behavior

* Applying a new location triggers full module refresh
* Refresh must be atomic (no mixed-location state)
* If refresh fails:

  * system reverts to previous valid state

### Edge Cases

* Selecting the same location results in no update
* Invalid coordinates must be rejected
* Partial failures must not corrupt active state


## 10. Backend Architecture (EXPANDED)

Backend responsibilities:

* Data ingestion
* Normalization
* Contract enforcement
* Geocoding proxy
* Caching
* Failure shielding

---

## 10.1 Normalization Enforcement

* All external data must be normalized before exposure
* No raw provider data may reach frontend
* Units must be standardized
* Enums must be controlled and documented
* Unknown values must be represented as null (not omitted)


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


### Module Contract Examples

Each module must publish a clear, minimal contract for both summary and detail shapes. Example detail shapes (illustrative only):

#### Target (Detail Example)

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

#### Pass (Detail Example)

```
{
  id: string,
  start_time: ISO,
  end_time: ISO,
  peak_altitude: number,
  brightness: number,
  direction_start: string,
  direction_end: string
}
```

#### Event (Detail Example)

```
{
  id: string,
  name: string,
  start_time: ISO,
  end_time: ISO,
  description: string,
  visibility_likelihood: number
}
```

### UI Consistency Rules

- All modules must use consistent labeling terminology.
- Similar data types must be displayed in the same format across modules.
- Time values must follow a single system-wide format (ISO + local display rules).
- Units must not change between summary, expanded, and detail views.
- No module may introduce unique UI patterns not used elsewhere (controls, affordances, or verbs).

### Transparency Rules

- All displayed values must be explainable and traceable to input fields or documented derivations.
- No hidden scoring systems or opaque heuristics without a short explanation visible to the user.
- Derived values must include their basis (inputs and timestamp) in the detail view metadata.
- System must not make unexplained recommendations; any ranking or prioritization must be surfaced with reasoning.

### Regression Protection

- All Phase 1 module outputs must remain valid and renderable by the dashboard.
- Existing API shapes must not break without explicit versioning and documented migration steps.
- Any behavior change that affects Phase 1 workflows must be documented and approved prior to rollout.
- Automated or manual tests must include at least one check per Phase 1 module verifying parity of core outputs.

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

## 13.1 Caching Behavior Rules

* Caching must never alter correctness
* Cached data must be clearly replaceable by fresh data
* Cache expiration must align with data type
* Cache must not introduce stale-first rendering


## Data Freshness & Trust Rules

Phase 2 introduces real or structured data and must maintain user trust:

* All datasets must include a timestamp
* Stale data must be indicated (subtle, non-intrusive)
* System must never present stale data as current without marking
* No aggressive warnings or alerts
* Freshness indicators must not clutter UI

## Module Isolation Rules

Each module must function independently:

* A failure in one module must not block others
* No shared blocking requests across modules
* No global failure state unless system-wide
* Modules must render with partial data when necessary


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

## Failure & Degraded Mode Rules (Expanded)

System behavior under failure must follow:

* UI must never crash
* Partial data must render where possible
* Missing detail must collapse cleanly
* Summary must remain available even if detail fails
* Errors must be contained and not cascade

## Anti-Patterns (Strictly Prohibited)

The following must NOT be introduced in Phase 2:

* New dashboard modules
* Raw provider/API data exposure
* Graphs, charts, or visual plotting
* Time navigation controls
* Auto-applied location changes
* Saved or favorite locations
* Multi-location comparisons
* Sorting/filtering systems
* Background refresh that alters context unexpectedly
* UI density increases beyond defined limits


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