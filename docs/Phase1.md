# ASTRONOMY HUB — PHASE 1 EXPANDED SPEC

**Phase Name:** Local Sky MVP
**Primary Objective:** Give an ORAS member a calm, useful, location-aware “what’s happening above me right now / tonight” experience inside the ORAS ecosystem, without overwhelming them.

## 1. Purpose of Phase 1

Phase 1 is not the full command center.

Phase 1 is the **first practical field-ready layer**:

* A member opens the ORAS member area
* Clicks **Astronomy Hub**
* Sees a clean dashboard
* Enters or confirms location
* Immediately gets:

  * what is visible tonight
  * notable objects/events
  * upcoming satellite passes
  * observing conditions
  * a simple drill-down into more detail

This fits the current ORAS direction because the site already surfaces separate astronomy resources such as observing tools, Astro News, beginner material, weather links, light-pollution tools, and sky-chart references. Phase 1 consolidates the most useful “tonight / here / now” pieces into one guided experience instead of sending members to many separate links.

## 2. What Phase 1 is trying to solve

Right now, ORAS resources are useful but fragmented:

* the Tools page links to weather, AstroViewer sky charts, light-pollution information, and space-weather resources
* the Resources page links to Astro News, beginner guidance, print resources, and educational content

Phase 1 solves that by creating a **single entry point** for the member’s most immediate question:

> “What should I know before I observe tonight from where I am?”

## 3. Phase 1 success definition

Phase 1 is successful if a member can use it in the field or at home and answer these questions in under a minute:

* Is tonight worth observing?
* What are the top things to look at?
* What satellites or ISS-like passes are coming soon?
* What is the Moon doing?
* Are there any important alerts or special events?
* Where should I click next if I want more detail?

## 4. Phase 1 scope boundaries

### Included in Phase 1

* ORAS member-facing dashboard page
* location input / saved site preset
* local observing conditions summary
* tonight’s highlights
* simple visible satellite pass list
* notable sky objects / categories
* moon summary
* event feed for major nearby-relevant astronomy items
* simple “open detail” drill-down cards
* lightweight backend cache/API

### Excluded from Phase 1

* full globe satellite tracker
* real-time 3D Earth visualization
* full global observatory intelligence
* plane tracking
* solar deep dashboard
* AR mode
* advanced astrophotography planning engine
* heavy PostGIS-driven global geospatial system
* public-scale distributed ingest architecture

Those belong later.

## 5. Phase 1 user types

Phase 1 should support three users from day one:

### 5.1 Casual ORAS Member

Needs simple answers:

* what is worth seeing tonight
* when to go outside
* quick sky awareness

### 5.2 ORAS Field Observer

Needs:

* timing
* moon conditions
* cloud/clarity awareness
* quick satellite pass awareness
* what objects are relevant now

### 5.3 Beginner / Public Night Visitor

Needs:

* low jargon
* obvious navigation
* guided recommendations
* reassurance they are looking at the right things

## 6. UX philosophy for Phase 1

You were right to worry about overload.

Phase 1 must feel like a **mission control home screen with restraint**.

### UI principles

* show only the most actionable information first
* rank by usefulness, not by completeness
* allow drill-down instead of dumping everything at once
* avoid giant maps on first load
* avoid complex controls on entry
* always answer “what matters now?”

## 7. Phase 1 page structure

## 7.1 Entry point

Inside ORAS member dashboard:

* new navigation item: **Astronomy Hub**

Could later also appear on public pages in reduced mode, but Phase 1 should assume member context.

## 7.2 First-load screen layout

```text
+--------------------------------------------------------------------------------+
| ORAS Astronomy Hub                                                             |
| Tonight at [Oil City, PA / My Location]                          [Change]      |
+--------------------------------------------------------------------------------+
| Conditions Now      | Tonight's Best Targets      | Alerts / Notable Events    |
|---------------------|-----------------------------|-----------------------------|
| Cloud cover         | Moon                        | Meteor shower peak          |
| Transparency        | Planets                     | ISS visible pass            |
| Moon phase          | Bright deep-sky picks       | Space weather note          |
| Darkness window     | Beginner-friendly picks     | Special ORAS recommendation |
+--------------------------------------------------------------------------------+
| Upcoming Passes                 | Sky Snapshot                                  |
|---------------------------------|-----------------------------------------------|
| ISS / bright satellites         | Simple local sky view                         |
| Time / direction / elevation    | Compass-based, low-clutter                    |
| [View all satellites]           | [Open Sky View]                               |
+--------------------------------------------------------------------------------+
| Explore More                                                                   |
| [Sky Tonight] [Satellites] [Conditions] [Events] [Moon & Planets] [Learn More]|
+--------------------------------------------------------------------------------+
```

That is the right Phase 1 shape: calm, ranked, useful.

## 8. Phase 1 information architecture

Phase 1 should be divided into **one dashboard plus five drill-down pages**.

## 8.1 Dashboard

Purpose:

* summary only
* immediate decisions
* no overload

Modules:

* observing conditions
* tonight’s best targets
* alerts/notable events
* upcoming passes
* mini sky snapshot

## 8.2 Sky Tonight

Purpose:

* what’s visible and notable in the member’s local sky

Content:

* top recommended objects
* moon info
* planets visible
* notable constellations / star regions
* “best viewing window” timing

## 8.3 Satellites

Purpose:

* practical local pass awareness

Content:

* next visible passes
* object name
* pass time
* direction
* max elevation
* brightness/importance if available
* simple detail drawer for mission/owner/type

## 8.4 Conditions

Purpose:

* should I observe tonight?

Content:

* cloud cover
* transparency / seeing if available
* light pollution reference
* darkness window
* moon interference summary
* quick “recommended / marginal / poor” observing score

This aligns well with the ORAS tools page, which already highlights the importance of weather, light pollution, and space weather for observing.

## 8.5 Events

Purpose:

* current / upcoming astronomy happenings

Content:

* meteor showers
* conjunctions
* eclipses if relevant
* comet / asteroid visibility items
* ORAS-curated special notices
* significant space-weather alerts

## 8.6 Moon & Planets

Purpose:

* quick-access planetary and lunar overview

Content:

* moon phase
* rise/set
* illumination
* visible planets tonight
* simple “good target tonight?” labels

This page is also a natural extension of the existing ORAS tools/resources approach, where planets and lunar/observing aids are already broken out into separate references.

## 9. Exact Phase 1 feature list

## 9.1 Location model

Phase 1 needs three location modes:

* **ORAS Observatory preset**
* **Use my current location**
* **Saved custom location**

Why:

* observatory use is central to the ORAS mission and current tools already center on the observatory site for local charts and weather context.

## 9.2 Conditions summary card

Show:

* cloud cover
* darkness / sunset / sunrise / astronomical twilight
* moon phase and moon brightness impact
* observing recommendation:

  * Good
  * Fair
  * Poor

## 9.3 Tonight’s best targets card

Start very simple. Do not over-engineer in Phase 1.

Buckets:

* Moon
* Planets
* Bright deep-sky objects
* Beginner-friendly picks
* ORAS featured target

Each item should show:

* name
* category
* when best viewed tonight
* why it matters

## 9.4 Upcoming passes card

Show top 3–5 passes only.

Each row:

* object name
* time
* start direction
* max elevation
* end direction
* visible/notable flag

Then:

* button to open full satellite page

## 9.5 Alerts / notable events card

A Crucix-style pattern is still useful here: not a giant news feed, but a ranked, normalized alert area. Crucix’s publicly described model is a scheduled-ingestion, normalized-feed architecture, which is a good pattern for your event card even though your domain is different.

Types:

* major astronomy event
* observing-impact event
* satellite pass of interest
* ORAS announcement/manual notice
* space weather alert

## 9.6 Mini sky snapshot

Not a full advanced map yet.

Just:

* compass-aware local sky orientation
* cardinal directions
* a few highlighted items
* click to open Sky Tonight page

## 10. Backend strategy for Phase 1

## 10.1 Goal

Keep Raspberry Pi responsibilities small:

* scheduled fetch
* normalize
* cache
* serve JSON

No heavy live calculations on every user request unless necessary.

## 10.2 Phase 1 backend responsibilities

* fetch selected astronomy/conditions/satellite data on interval
* normalize to one internal schema
* cache results for local use
* expose lightweight endpoints for the WordPress frontend

## 10.3 Phase 1 architectural pattern

```text
External Sources
   ↓
Scheduled Fetch Jobs
   ↓
Normalization Layer
   ↓
Cache / Simple Persistence
   ↓
REST JSON Endpoints
   ↓
WordPress Member Hub UI
```

This is broadly similar to the ingestion/normalization/API pattern associated with Crucix, but scaled down and made more local-first for astronomy use.

## 11. Frontend strategy for Phase 1

## 11.1 WordPress integration model

For Phase 1, the safest route is:

* add Astronomy Hub as part of the member dashboard experience
* render the UI inside a controlled plugin/module
* keep frontend app modular so it can later be split out if needed

That matches your current ORAS direction better than launching a disconnected separate system.

## 11.2 UI stack expectations

Phase 1 UI should prioritize:

* fast load
* mobile usability
* low clutter
* reusable components
* easy future migration into richer frontend tech later

## 11.3 Components needed

* location selector
* summary cards
* condition badge
* alert list
* pass list
* object cards
* mini sky view container
* tab/page navigation shell

## 12. Phase 1 data categories

Do not start with hundreds of sources.

Phase 1 should use only the minimum categories needed for value:

### Required categories

* local observing conditions
* moon data
* visible satellite pass data
* basic astronomical event data
* local sky target recommendations

### Optional if easy

* space weather summary
* ORAS manual announcements
* beginner-help content links

## 13. Phase 1 output schemas

Mini needs explicit contracts, so each module should have a stable response contract.

Examples:

### Conditions contract

```json
{
  "location_label": "Oil City, PA",
  "cloud_cover_pct": 22,
  "moon_phase": "Waxing Crescent",
  "darkness_window": {
    "start": "2026-03-22T21:14:00-04:00",
    "end": "2026-03-23T05:33:00-04:00"
  },
  "observing_score": "good",
  "summary": "Mostly clear with favorable darkness after moonset."
}
```

### Satellite pass contract

```json
{
  "object_name": "ISS",
  "start_time": "2026-03-22T21:43:00-04:00",
  "max_elevation_deg": 61,
  "start_direction": "NW",
  "end_direction": "SE",
  "visibility": "high"
}
```

### Alert contract

```json
{
  "priority": "major",
  "category": "meteor_shower",
  "title": "Peak activity tonight",
  "summary": "Best viewing after midnight under darker skies.",
  "relevance": "local_tonight"
}
```

## 14. Phase 1 recommendation engine

Not AI. Just rules.

That is the right call for this phase.

Use deterministic scoring:

* darkness
* moon interference
* cloud cover
* event timing
* visibility window
* object prominence

Output:

* top 3 to 7 recommended things for tonight

This gives a smart feel without token cost or Pi-side inference.

## 15. What to borrow conceptually from current ORAS pages

From **Tools**:

* weather-at-a-glance usefulness
* current sky orientation usefulness
* space weather relevance
* light pollution relevance

From **Resources**:

* educational support
* beginner guidance
* ORAS-curated trust layer
* not everything has to be live data; some things can be guided knowledge resources

That means the hub should not just be “data.”
It should be **data + ORAS curation**.

## 16. Phase 1 risks

### Risk 1: Too much on first page

Mitigation:

* strict summary-only homepage
* cap modules
* cap rows per module

### Risk 2: Backend drift into Phase 2 complexity

Mitigation:

* no globe
* no 3D Earth
* no global tracking in Phase 1

### Risk 3: Weak usefulness

Mitigation:

* prioritize actionable items over completeness
* ask: “does this help someone decide what to do tonight?”

### Risk 4: Mini model drift

Mitigation:

* explicit contracts
* explicit file boundaries
* phase-only docs
* validation checklist

## 17. Phase 1 validation checklist

Phase 1 is done when all are true:

* member can load Astronomy Hub from ORAS member area
* observatory preset works
* custom/current location works
* dashboard loads summary data successfully
* top recommended targets display properly
* next satellite passes display properly
* alerts render without clutter
* conditions card is understandable to a beginner
* mobile layout is usable
* frontend works from cached backend responses
* no module feels like a data dump

## 18. What documentation Phase 1 needs before coding

Before Mini starts coding, these docs should exist:

* `MASTER_PLAN.md`
* `PHASE_1_SPEC.md`
* `PHASE_1_ACCEPTANCE_CRITERIA.md`
* `ARCHITECTURE_OVERVIEW.md`
* `DATA_CONTRACTS.md`
* `UI_INFORMATION_ARCHITECTURE.md`
* `CODING_GUARDRAILS.md`
* `VALIDATION_CHECKLIST.md`
* `SESSION_CONTINUITY_BRIEF.md`

## 19. Recommendation on Phase 1 priority order

Build in this order:

1. information architecture
2. data contracts
3. mocked JSON responses
4. dashboard UI shell
5. conditions card
6. tonight’s targets card
7. passes card
8. alerts card
9. mini sky snapshot container
10. live backend hookup
11. acceptance testing

That order keeps Mini from wandering into backend complexity before the UI contract is stable.

## 20. Final Phase 1 statement

Phase 1 should feel like this:

> “An ORAS member opens one page and immediately understands whether tonight is worth observing, what is most worth looking at, and what near-term sky events matter from their location.”

If it does that well, Phase 1 succeeds.

---

The biggest adjustment I would make to the earlier master plan is this:

**Phase 1 should not be “basic sky map first.”**
It should be **decision support first**.

That means:

* conditions
* recommendations
* passes
* alerts
* then visual drill-down

That will make it far more practical for ORAS members in the field and at home.