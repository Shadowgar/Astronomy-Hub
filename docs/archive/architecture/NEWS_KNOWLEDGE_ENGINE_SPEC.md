# 📄 `NEWS_KNOWLEDGE_ENGINE_SPEC.md` (AUTHORITATIVE — V1)

---

# 📰 NEWS / KNOWLEDGE ENGINE — SPECIFICATION

## Status: 🔴 REQUIRED — CORE SUPPORT ENGINE

## Phase Ownership: Phase 2 (Core) → Phase 3+ (Enhancement)

---

# 🧠 PURPOSE

The News / Knowledge Engine answers:

> **“What space developments matter right now, and which are relevant to my region and what is above me?”**

---

# 🔥 CORE PRINCIPLE

> This engine does NOT emit a generic headline feed.
> It emits a **ranked, explainable, astronomy-context feed** tied to scope, location, and Above Me context.

---

# 🧱 ROLE IN SYSTEM ARCHITECTURE

```text
Authoritative Space News Sources
        +
Research/mission context feeds
        ↓
Ingestion + Canonicalization
        ↓
Deduplication + Entity Extraction
        ↓
Relevance Scoring (global + regional + Above Me linked)
        ↓
Normalized News Contract
        ↓
API (/api/v1/news)
        ↓
UI (News Digest + Detail Links + Briefing Callouts)
```

---

# 🔗 ENGINE DEPENDENCIES

### Upstream Dependencies

* space-news sources and mission feeds
* optional research-feed enrichment
* user context (time, location, scope)
* object/entity context from active scene (Above Me + selected engine scene)

### Downstream Influence

* News Digest panel
* Right-side Live Briefing callouts
* object detail tabs (news/research/media links)
* alerts/event context cross-linking

---

# 📡 DATA SOURCES (LOCKED)

## 🔹 PRIMARY (PHASE 2)

### NASA News Feeds

* mission updates
* science updates
* official agency announcements

### ESA News Feeds

* mission and science updates
* observatory and planetary announcements

### NOAA SWPC / space-weather bulletin feeds

* solar/geomagnetic operational updates with user-impact relevance

### Spaceflight News API (broad aggregator layer)

* cross-publisher space news coverage
* article metadata for ranking and dedupe

## 🔹 SECONDARY ENRICHMENT (PHASE 2+)

### Launch/Event feeds (e.g., launch schedule providers)

* launch windows
* launch site/location relevance

### Research feeds (e.g., arXiv astro categories)

* research-context expansion for object detail

## 🔹 FALLBACK

* cached normalized articles
* curated static emergency feed with explicit degraded marker

---

# ⚙️ CORE COMPUTATION MODEL

## Step 1 — Ingestion

* fetch source feeds on schedule
* keep source metadata and timestamps

## Step 2 — Canonicalization + Deduplication

* normalize title/body/source/url/published_at
* collapse near-duplicate stories across sources

## Step 3 — Entity Extraction

Extract/link entities:

* engines: sun, satellites, solar_system, deep_sky, flights, conditions, events
* objects: ISS, Jupiter, M45, etc.
* regions: launch sites, observatories, affected geographic areas

## Step 4 — Relevance Scoring

Score dimensions:

* recency
* source confidence
* engine/topic match to active scope
* regional relevance to selected location
* Above Me relevance (linked to currently visible objects/events)

## Step 5 — “Why It Matters” Generation

Examples:

* “Linked to Jupiter, currently visible in your Solar System context.”
* “Launch from your region’s night window; likely visible overhead.”
* “Solar alert with direct observing-impact implications tonight.”

## Step 6 — Contract Output

* produce bounded ranked list for digest
* produce richer records for detail drill-down

---

# 🧠 OUTPUT MODEL

## `/api/v1/news`

```json
[
  {
    "id": "news:abc123",
    "title": "Falcon 9 launch updates Starlink shell",
    "summary": "Launch completed with payload deployment confirmation.",
    "source": {"name": "NASA", "type": "agency"},
    "published_at": "2026-04-03T01:20:00Z",
    "url": "https://example.org/article",
    "topics": ["launch", "satellites"],
    "related_engines": ["satellites", "events"],
    "related_objects": [{"id": "sat:starlink-group", "name": "Starlink Group"}],
    "relevance": {
      "overall": 0.89,
      "region_score": 0.72,
      "above_me_score": 0.81
    },
    "why_it_matters": "Satellite mission update connected to objects in your active sky context.",
    "trace": {"provider": "spaceflight_news_api", "fetched_at": "2026-04-03T01:30:00Z"}
  }
]
```

---

# 🖥️ UI INTEGRATION

## 🔹 News Digest Panel

* top 3–5 ranked stories
* must show source + recency + short reason

## 🔹 Right-Side Live Briefing

* one high-importance callout
* never flood briefing with raw headlines

## 🔹 Detail Panel Integration

When selecting object/event:

* show linked related stories in News tab
* preserve object ownership while adding context links

---

# ⚠️ UI RULES

* space-focused only (no unrelated general news)
* every item must include source attribution
* every item must include “why it matters”
* no raw feed dump
* bounded list size for readability

---

# 🔄 SYSTEM BEHAVIOR

## Refresh Frequency

* every 10–30 minutes (Phase 2 baseline)
* faster only for event-critical feeds

## Caching

* required
* deduplicated normalized cache
* freshness/age fields required in output

## Fallback Behavior

If live ingestion fails:

* return cached feed with degraded marker
* never fabricate “live” label without fresh source timestamp

---

# 🚀 PHASE BREAKDOWN

## 🔴 PHASE 2 (CORE)

### Build:

* ingestion from trusted space news sources
* dedupe + normalization
* engine/topic/entity extraction
* regional + Above Me relevance scoring (basic)
* digest + detail-link output

### Constraints:

* no personalized recommendation engine yet
* no LLM-generated editorial output in authoritative path
* no uncontrolled source sprawl

## 🟠 PHASE 3 (ENHANCEMENT)

### Add:

* stronger entity linking graph
* per-engine deep-dive news views
* confidence-weighted source trust tuning

## 🟡 PHASE 4+

### Add:

* richer knowledge graph traversal
* timeline playback of story evolution
* advanced relevance tuning per user mode

---

# 🔒 HARD RULES (LOCKED)

1. Must remain backend-authoritative
2. Must preserve source attribution and timestamps
3. Must rank by relevance, not raw chronology only
4. Must include regional + Above Me relevance pathways
5. Must degrade gracefully without fake “live” claims

---

# 🧠 SUCCESS CRITERIA

* News Digest shows real space-relevant stories
* stories are context-linked to selected location/scope and Above Me objects when applicable
* source provenance is clear
* output is concise, useful, and trustworthy

---

# 📌 SUMMARY

The News / Knowledge Engine is:

> **A context-aware intelligence feed that turns space headlines into actionable, location-aware and sky-relevant knowledge.**

---

# 18. MASTER PLAN ALIGNMENT + IMPLEMENTATION GUARDRAILS (ADDITIVE)

## 18.1 Master-Plan Alignment Targets

* Aligns to Master Plan §4.7 (News & Knowledge Engine) and §5 object interaction flow.
* Must support “show me everything” by attaching relevant news/research to engine objects.

## 18.2 Minimum Phase-2 Real Capability

Must provide:

* real backend `/api/v1/news` feed
* ranked digest focused on space topics only
* regional relevance scoring against active location
* Above Me linkage where a story maps to visible objects/events

## 18.3 Source Trust and Freshness Rules

* every item requires source attribution + publication time + fetch trace
* duplicate stories across sources should be collapsed before UI output
* unverifiable or stale stories must be demoted or explicitly marked

## 18.4 Panel Ownership Rule

* News panel must contain news items only (not scene objects or target rows)
* briefing/news callouts may cross-link engines but must keep news identity

## 18.5 Build-to-Proof Checklist

Prove:

* `/api/v1/news` returns non-mock normalized payload
* location/context changes relevance ordering where applicable
* digest panel output remains news-only with source + why-it-matters
