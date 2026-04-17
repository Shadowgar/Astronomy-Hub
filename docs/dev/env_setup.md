# 📄 DOCUMENT — `env_setup.md` (FULL REWRITE)

# ASTRONOMY HUB — ENVIRONMENT SETUP (AUTHORITATIVE)

---

## 0. PURPOSE

This document defines how to set up, run, validate, and maintain the Astronomy Hub development environment.

It exists to ensure:

* reproducible setup
* stable frontend/backend integration
* consistent runtime behavior
* alignment with the current architecture and stack

This document is authoritative for environment setup, but it does not define feature order or product behavior. 

---

## 1. CORE RULE

```text
Docker is the primary development and execution environment.
```

Local ad hoc environments may be used only for debugging or isolated tooling, but they are not the authoritative runtime. 

---

## 2. REQUIRED TOOLS

---

### 2.1 System Requirements

* Linux / WSL2 / macOS
* Windows must use WSL2 for development parity
* 8 GB RAM minimum
* 16 GB RAM recommended
* 10+ GB free disk space

---

### 2.2 Required Software

Install:

* Docker Desktop or Docker Engine
* Docker Compose v2+
* Git
* Node.js
* Python 3.10+

---

### 2.3 Recommended Tooling

* VS Code
* Docker extension
* Python extension
* ESLint
* Prettier

---

## 3. EXPECTED PROJECT STRUCTURE

```text
Astronomy-Hub/
├── backend/
├── frontend/
├── docs/
├── docker-compose.yml
├── .env
```

If the local checkout does not match this structure, environment setup should be treated as suspect before debugging application behavior. 

---

## 4. ENVIRONMENT CONFIGURATION

---

### 4.1 `.env` File (REQUIRED)

A root `.env` file must exist.

Example:

```env
# Backend
BACKEND_PORT=8000

# Frontend
FRONTEND_PORT=5173

# Environment
ENV=development

# Cache / future use
CACHE_TTL=300
```

---

### 4.2 Configuration Rule

```text
All environment variables must be defined through .env or container environment configuration.
```

Rules:

* no hardcoded ports
* no hardcoded hostnames
* no hardcoded environment-dependent URLs
* no code-level overrides for local-only behavior

This aligns with the existing environment-control rules already present in the document. 

---

## 5. PRIMARY RUNTIME MODEL

Astronomy Hub runs as a multi-service system.

Current authoritative development runtime includes:

* frontend container
* backend container
* PostgreSQL / PostGIS container
* Redis container

The environment must reflect the current stack and not only the older frontend/backend-only view. This is required because the project stack now includes PostgreSQL/PostGIS and Redis as locked backend dependencies.

---

## 6. DOCKER WORKFLOW

---

### 6.1 Build and Start

From project root:

```bash
docker compose up --build
```

---

### 6.2 Normal Start

```bash
docker compose up
```

---

### 6.3 Stop

```bash
docker compose down
```

---

### 6.4 Rebuild After Dependency or Dockerfile Change

```bash
docker compose up --build
```

---

## 7. EXPECTED SERVICE BEHAVIOR

When the environment is healthy:

* backend container starts successfully
* frontend container starts successfully
* database container starts successfully
* Redis container starts successfully
* frontend can reach backend
* backend can reach database and Redis
* no crash-looping containers
* no missing environment-variable failures

---

## 8. SERVICE ACCESS

---

### Frontend

```text
http://localhost:5173
```

---

### Backend

```text
http://localhost:8000
```

---

### Backend API Base

```text
http://localhost:8000/api/v1
```

This aligns environment setup with the locked API versioning rule in the stack. 

---

### Health Check

If implemented, health checks should be exposed through the versioned API path or documented runtime route.

Preferred modern path:

```text
/api/v1/health
```

Your current setup doc still references `/api/health`; that is potentially inconsistent with the locked `/api/v1` rule and should not remain ambiguous.

---

## 9. BACKEND ENVIRONMENT RULES

The backend must:

* run through Docker in normal development
* use FastAPI as the only active runtime
* expose the API through configured environment values
* use PostgreSQL as source of truth
* use Redis only for caching/transient performance use
* consume environment configuration from `.env` / container env

The backend must not:

* rely on legacy secondary runtimes
* bypass Docker for normal execution
* hardcode ports, DSNs, or paths
* treat Redis as authoritative storage

These rules align environment setup with the locked backend stack.

---

## 10. FRONTEND ENVIRONMENT RULES

The frontend must:

* run through Docker in normal development
* connect to backend through configured endpoints
* use environment configuration for API base URLs
* reflect the current active engine/scene architecture

The frontend must not:

* assume hardcoded localhost values inside application logic
* patch backend truth in the browser
* rely on fake production data in active product paths

The current environment rules already prohibit hardcoded assumptions and backend patching; this rewrite preserves that but aligns it with the current system. 

---

## 11. LOCAL DEBUG EXCEPTIONS

Running services outside Docker is permitted only for limited debugging or tooling work.

Examples:

* isolated frontend debugging
* isolated backend pytest run
* linting / formatting
* schema generation

Rule:

```text
Local debugging does not redefine the authoritative runtime model.
```

This keeps the useful exception from your current document while preserving Docker as primary authority. 

---

## 12. DEPENDENCY MANAGEMENT

---

### Backend

* use requirements files or equivalent locked dependency mechanism
* installable from scratch
* reproducible inside container

---

### Frontend

* use `package.json` / lockfile
* installable from scratch

Example:

```bash
npm install
```

---

### Rule

```text
Dependencies must be installable from scratch without manual undocumented intervention.
```

This preserves the existing dependency rule. 

---

## 13. ENVIRONMENT VALIDATION

After setup, validate the following.

---

### 13.1 Containers

* all required containers start
* no crash loops
* no missing dependency failures

---

### 13.2 Frontend

* frontend loads in browser
* no fatal console errors
* active app shell renders

---

### 13.3 Backend

* FastAPI app responds
* versioned API path is reachable
* health route works if implemented
* no startup tracebacks

---

### 13.4 Integration

* frontend successfully reaches backend
* backend successfully reaches database
* backend successfully reaches Redis
* API data renders without contract errors

---

## 14. COMMON FAILURE CASES

---

### Docker

* image build failures
* compose service mismatch
* port conflicts
* stale containers or volumes

### Stellarium reference runtime

Use the repo-owned Docker service instead of ad hoc local `docker run` commands.

Commands:

```bash
npm run docker:stellarium:up
npm run docker:reference-stack:up
npm run docker:stellarium:down

docker compose up -d --build stellarium-reference
docker compose up -d --build backend frontend stellarium-reference
docker compose rm -sf stellarium-reference
```

Expected endpoints:

* Astronomy Hub frontend: `http://127.0.0.1:4173/`
* Astronomy Hub backend: `http://127.0.0.1:8000/`
* Stellarium reference: `http://127.0.0.1:8080/`

Implementation notes:

* preferred agent entrypoints are the root `package.json` scripts above
* `scripts/prepare-stellarium-reference.sh` patches the vendored Stellarium frontend package definition to the known-good Vue/compiler pair and generates missing `stellarium-web-engine.js` / `stellarium-web-engine.wasm` assets from the vendored source tree before startup
* that preparation step builds its own repo-tracked Emscripten helper image from `scripts/Dockerfile.stellarium-jsbuild` so it does not depend on the stale vendored `Dockerfile.jsbuild` apt sources
* the service builds from `study/stellarium-web-engine/source/stellarium-web-engine-master/apps/web-frontend`
* the service patches the vendored Stellarium `package.json` to the known-good Vue 2.6.12 / `vue-template-compiler` 2.6.12 pair before running `yarn install`
* `apps/test-skydata` is mounted at both `/skydata` and `/test-skydata`
* `node_modules` is stored in a Docker-managed named volume so agents do not need local permission workarounds

---

### Backend

* missing environment variables
* DB connection failure
* Redis connection failure
* incorrect route prefix
* dependency import failures

---

### Frontend

* wrong API base URL
* proxy/config mismatch
* build failures
* runtime contract mismatch

---

## 15. FORBIDDEN PRACTICES

Do not:

* treat non-Docker runtime as authoritative
* hardcode ports, URLs, or environment-dependent paths
* change compose/runtime behavior without updating docs
* use different runtime conventions across machines
* hide broken setup behind mocks or placeholder behavior

These preserve the anti-drift intent already present in the original doc. 

---

## 16. RESET PROCEDURE

If the environment becomes unstable:

```bash
docker compose down
docker system prune -f
docker compose up --build
```

If database state or volumes are suspected, a more targeted cleanup may also be required based on current compose configuration.

---

## 17. FINAL VALIDATION CHECKLIST

The environment is considered valid only if all are true:

* Docker is the primary runtime
* frontend, backend, DB, and Redis all start correctly
* backend serves versioned API routes
* frontend reaches backend successfully
* environment values come from configuration, not code
* setup is reproducible on a fresh machine

---

## 18. FINAL STATEMENT

```text
If the environment cannot be reproduced from this document,
the setup is broken.
```

---

