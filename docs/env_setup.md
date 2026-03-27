# 📄 FULL REWRITE — `env_setup.md`

Paste this directly.

---

# 🌌 ASTRONOMY HUB — ENVIRONMENT SETUP (AUTHORITATIVE)

---

# 0. PURPOSE

This document defines:

> **How to set up, run, and maintain the Astronomy Hub development environment**

It ensures:

* consistent setup across machines
* reproducible builds
* stable backend/frontend interaction
* alignment with Phase 2.5 (Docker + FastAPI)

---

# 1. 🧠 CORE RULE

```text id="7x3lq2"
The project must run through Docker as the primary environment.

Local ad-hoc environments are not authoritative.
```

---

# 2. 🧱 REQUIRED TOOLS

---

## 2.1 System Requirements

* OS: Linux / WSL2 / macOS (Windows must use WSL2)
* RAM: 8GB minimum (16GB recommended)
* Disk: 10GB+ free

---

## 2.2 Required Software

Install:

* Docker Desktop (or Docker Engine)
* Docker Compose (v2+)
* Node.js (for local frontend dev if needed)
* Python 3.10+ (for backend tooling if needed)
* Git

---

## 2.3 Optional (Recommended)

* VS Code
* VS Code Extensions:

  * Docker
  * Python
  * ESLint
  * Prettier

---

# 3. 📁 PROJECT STRUCTURE (EXPECTED)

---

```text id="j3b7cm"
Astronomy-Hub/
├── backend/
├── frontend/
├── docs/
├── docker-compose.yml
├── .env
```

---

# 4. ⚙️ ENVIRONMENT CONFIGURATION

---

## 4.1 `.env` File (REQUIRED)

Must exist at project root.

Example:

```env
# Backend
BACKEND_PORT=8000

# Frontend
FRONTEND_PORT=5173

# Environment
ENV=development

# Future use
CACHE_TTL=300
```

---

## 4.2 Rule

```text id="m4k8zp"
All environment variables must be defined in .env

No hardcoded values allowed in code
```

---

# 5. 🐳 DOCKER SETUP

---

## 5.1 Build and Run

From project root:

```bash
docker compose up --build
```

---

## 5.2 Expected Behavior

* backend container starts
* frontend container starts
* frontend can reach backend via proxy
* no errors in logs

---

## 5.3 Stop Environment

```bash
docker compose down
```

---

# 6. 🌐 SERVICE ACCESS

---

## Frontend

```text id="9f8k1x"
http://localhost:5173
```

---

## Backend

```text id="2n7v4y"
http://localhost:8000
```

---

## Health Check (if implemented)

```text id="d5m2qz"
/api/health
```

---

# 7. 🔄 DEVELOPMENT WORKFLOW

---

## 7.1 Start System

```bash
docker compose up
```

---

## 7.2 Make Changes

* backend → restart container if needed
* frontend → hot reload (if configured)

---

## 7.3 Rebuild (when needed)

```bash
docker compose up --build
```

---

# 8. 🧠 BACKEND ENVIRONMENT RULES

---

## Must:

* run inside Docker
* use FastAPI (Phase 2.5+)
* expose API on configured port
* use `.env` variables

---

## Must NOT:

* rely on local-only dependencies
* bypass Docker for core functionality
* hardcode ports or paths

---

# 9. 🖥️ FRONTEND ENVIRONMENT RULES

---

## Must:

* connect to backend via configured endpoint
* not assume localhost hardcoded values
* use environment variables where needed

---

## Must NOT:

* mock backend in production mode
* patch backend data

---

# 10. 📦 DEPENDENCY MANAGEMENT

---

## Backend

* use requirements.txt or equivalent
* lock versions where possible

---

## Frontend

* use package.json
* run:

```bash
npm install
```

---

## Rule

```text id="3r7p9v"
Dependencies must be installable from scratch with no manual intervention
```

---

# 11. 🧪 ENVIRONMENT VALIDATION

---

After setup, verify:

---

## 11.1 System

* containers start successfully
* no crash logs

---

## 11.2 Frontend

* loads in browser
* no console errors

---

## 11.3 Backend

* responds to API requests
* endpoints return valid data

---

## 11.4 Integration

* frontend successfully calls backend
* data renders correctly

---

# 12. ⚠️ COMMON FAILURE CASES

---

## Docker Issues

* containers not building
* port conflicts
* missing environment variables

---

## Backend Issues

* server not starting
* missing dependencies
* incorrect routes

---

## Frontend Issues

* cannot reach backend
* incorrect API URL
* build errors

---

# 13. 🚫 FORBIDDEN PRACTICES

---

* running backend outside Docker (except debugging)
* hardcoding environment values
* modifying container behavior without updating docs
* using different ports without updating `.env`

---

# 14. 🔄 RESET ENVIRONMENT

---

If environment becomes unstable:

```bash
docker compose down
docker system prune -f
docker compose up --build
```

---

# 15. 🔥 FINAL STATEMENT

```text id="8u2nq5"
If the environment cannot be reproduced from this document,
the setup is considered broken.
```

---

## Where you are now

You now have:

* vision
* architecture
* phases
* execution rules
* validation system
* environment control

---

## What’s left (final step)

Now we clean up the last **UI + styling docs** that were weak earlier.

👉 Next:

**Rewrite UI_INFORMATION_ARCHITECTURE.md (properly, not compressed)**

---