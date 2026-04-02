# 🌌 PHASE 4 — EXECUTION TODO (AUTHORITATIVE — NOAA RADAR)

---

# 1. EXECUTION RULES

- Execute one step at a time
- Verify first, fix minimally, re-verify, then lock
- No frontend-owned provider logic
- No scope expansion beyond NOAA radar ingestion track

---

# 2. STEP STATUS

# 🔴 STEP 1 — NOAA PROVIDER FOUNDATION (ACTIVE)

## VERIFY
- NOAA NEXRAD Level III provider fetch path exists
- fetch failures are controlled and non-fatal

## LOCK CONDITION
- provider ingestion is operational and safe

---

# 🔴 STEP 2 — ADAPTER / NORMALIZER / VALIDATOR

## VERIFY
- adapter converts NOAA payload to internal model
- normalized radar contract is stable
- validator enforces required fields

## LOCK CONDITION
- no raw NOAA payload reaches contracts

---

# 🔴 STEP 3 — CACHE + FRESHNESS

## VERIFY
- radar caching exists with explicit TTL
- freshness/staleness flags are exposed

## LOCK CONDITION
- deterministic, freshness-aware radar payloads

---

# 🔴 STEP 4 — CONDITIONS CONTRACT INTEGRATION

## VERIFY
- normalized radar block is attached to conditions payload
- degraded mode is explicit when radar unavailable

## LOCK CONDITION
- radar is backend-authoritative in conditions contract

---

# 🔴 STEP 5 — API DETERMINISM + CONTRACT TESTS

## VERIFY
- focused tests cover contract shape and deterministic responses

## LOCK CONDITION
- contract + determinism proof is established

---

# 🔴 STEP 6 — UI CONSUMPTION (ONLY WHEN EXPLICITLY REQUESTED)

## VERIFY
- UI renders backend radar contract only
- no frontend provider logic

## LOCK CONDITION
- UI boundary is preserved

