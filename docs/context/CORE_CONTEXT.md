# CORE CONTEXT — ASTRONOMY HUB (AUTHORITATIVE)

## 1. System Identity
Astronomy Hub is a multi-engine decision-support system.

## 2. Locked System Models
- Scope -> Engine -> Filter -> Scene -> Object -> Detail -> Assets
- Ingestion -> Normalization -> Storage -> Cache -> API -> Client Rendering

## 3. Runtime Law
- Docker is authoritative runtime
- backend: FastAPI
- frontend: React + Vite

## 4. Data Law
- normalized contracts only
- no raw provider payloads in UI
- deterministic behavior by input context

## 5. Execution Law
Execution is feature-first and runtime-truth based:
- verify behavior first
- fix only proven failures
- prove before completion

## 6. Proof Law
If it cannot be proven with runtime evidence, it is not complete.

## 7. Context Law
Load only docs allowed by `CONTEXT_MANIFEST.yaml` unless explicitly instructed.
