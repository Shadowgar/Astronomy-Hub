# INGESTION STRATEGY

---

## PURPOSE

Defines how data enters the system.

---

## SOURCES

Use:

* authoritative APIs
* verified datasets

Avoid:

* scraped unreliable data
* inconsistent sources

---

## RULES

* normalize all data
* no duplication
* no fabricated values
* cache aggressively

---

## PIPELINE

Fetch → Normalize → Cache → Serve

---

## FAILURE HANDLING

* missing data = explicit null
* no guessing
* no synthetic replacements

---

## PERFORMANCE

* precompute summaries
* cache frequent queries
* avoid runtime-heavy processing

---

## GOAL

Provide:

* consistent
* reliable
* explainable data
