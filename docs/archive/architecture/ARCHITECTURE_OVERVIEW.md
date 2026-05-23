# ASTRONOMY HUB — ARCHITECTURE OVERVIEW

---

## PURPOSE

This document defines the **system architecture** of Astronomy Hub.

It describes:

* system structure
* responsibility boundaries
* runtime behavior
* data flow

It is **authoritative for system design**, but does NOT define execution order.

---

## CORE MODEL

The system follows this hierarchy:

Scope → Engine → Filter → Scene → Object → Detail

---

## SYSTEM LAYERS

### 1. HUB (DECISION LAYER)

The Hub is the **"Above Me" system**.

Responsibilities:

* collect candidate objects from engines
* filter by visibility and conditions
* rank by relevance
* output a curated list (max 5–7 items)

The Hub NEVER displays raw engine data.

---

### 2. ENGINES (DOMAIN LAYERS)

Each engine:

* owns a domain
* produces candidate objects
* provides detail views
* supports exploration

Examples:

* Solar System Engine
* Satellite Engine
* Deep Sky Engine

---

### 3. SCENE (RENDER LAYER)

The Scene is what is currently rendered.

Rules:

* only one scene active at a time
* only relevant objects are rendered
* detail loads on demand

---

### 4. OBJECTS

Objects are clickable entities:

Examples:

* planet
* satellite
* flight
* deep sky object
* event

---

## RUNTIME RULES

* Only active engine processes data
* Only active filter drives computation
* Only visible objects are rendered
* Hub limits output strictly

---

## FRONTEND / BACKEND SPLIT

### Frontend (Browser)

* rendering
* interaction
* scene control

### Backend (Pi / API)

* ingestion
* normalization
* caching
* distribution

---

## NON-GOALS

This document does NOT define:

* feature order
* UI layout details
* phase execution

---

## AUTHORITY

This document defines structure.

Execution decisions must come from execution docs.
