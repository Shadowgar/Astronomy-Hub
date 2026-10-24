# Astronomy Hub

**Astronomy Hub** is an actively developed, source-aware workspace for exploring the sky and planning astronomy observations. Its guiding question is: **“What is above me right now, and what should I pay attention to?”**

The project brings observing context and multiple specialized visualization engines into one evolving application. Its long-term direction is **Adaptive Explorer**: a shared, accessible experience for the Sky, Solar System, Earth, and qualified planetary surfaces.

> **Status:** Development project, not a generally available or production-qualified release. The repository includes implemented foundations alongside work that is still in progress. A roadmap item or an open pull request is **not** evidence that a feature is complete or deployed.

## What is in the repository?

- **Sky exploration:** Integration with an ORAS-hosted Stellarium Web / Stellarium Web Engine runtime. The engine retains authority over sky rendering, object selection, and camera behavior.
- **Observing context:** Dedicated Observe and Tonight experiences, with astronomy APIs and source-backed object information.
- **Earth exploration:** A separately built, Cesium-based Earth viewer integrated with the Hub through bounded interfaces. Earth imagery, provider availability, and data coverage have distinct limitations.
- **Application infrastructure:** A FastAPI/Python backend, JavaScript frontend, PostgreSQL/PostGIS, Redis, containerized development services, and data-ingestion/validation tooling.

The implemented capabilities are **not** equivalent to complete planetary travel, global high-resolution imagery, or production readiness. See the [feature tracker](docs/features/FEATURE_TRACKER.md) and [implementation evidence](docs/validation/UNIFIED_WORKSPACE_IMPLEMENTATION_EVIDENCE.md) for qualified boundaries.

## Where the project is heading

The owner-approved [Adaptive Explorer product vision](docs/product/PRODUCT_VISION.md) describes contextual Sky, Solar System, Earth, and planetary-surface exploration through a shared design system. The planned experience emphasizes the rendered scene, scientific/source accuracy, accessible navigation, and appropriately scoped controls.

These are product goals, **not a claim that all modes and transitions are implemented or validated**. The [unified architecture](docs/architecture/UNIFIED_UNIVERSE_ARCHITECTURE.md) separates current integration from proposed capabilities.

## Local development

The supported day-to-day workflow is designed for the owner's Linux/WSL and Docker environment. It is **not a one-command setup from a fresh clone**: the Sky data and the exact qualified Earth runtime artifact must already be provisioned. Runtime artifacts, required credentials, and provider rights are not automatically supplied by this repository.

With the required local artifacts and Docker services prepared:

```bash
npm run dev:local
npm run dev:local:status
npm run dev:local:logs
```

The frontend is served at `http://localhost:4173` when the local stack passes its checks. For first-time provisioning, artifact verification, and safe lifecycle details, read the [local development guide and evidence](docs/validation/LOCAL_DEVELOPMENT_REPAIR_EVIDENCE.md). Do not substitute an unqualified renderer build or install paid provider services.

## Project documentation

- [Repository documentation map](docs/README.md)
- [Product vision and acceptance requirements](docs/product/PRODUCT_VISION.md)
- [Architecture and renderer boundaries](docs/architecture/UNIFIED_UNIVERSE_ARCHITECTURE.md)
- [Feature tracker and current qualification](docs/features/FEATURE_TRACKER.md)
- [Project operating rules](AGENTS.md)

## Contributing and security

Issues and suggestions about astronomy usability, data quality, accessibility, and reliability are welcome for discussion. Proposed changes should preserve source attribution, science correctness, upstream component boundaries, and the validation requirements in the project documentation.

Please avoid publishing exploitable vulnerability details in a public issue. Use a private channel to the maintainer where available.

## Licensing and third-party material

This is a **mixed-license repository**. Original Hub-owned software is offered under the [MIT License](LICENSE), while copied or modified **Stellarium Web / Stellarium Web Engine code retains GNU AGPL v3** and other materials carry their own licenses. The MIT license does **not** extend to third-party code, catalog data, imagery, fonts, provider services, or other externally licensed assets.

See the [license scope and third-party notices](THIRD_PARTY_NOTICES.md), [open-source readiness review](docs/OPEN_SOURCE_READINESS.md), and [Stellarium source-access audit](docs/validation/STELLARIUM_AGPL_SOURCE_OFFER_AUDIT_2026-10-24.md). The checked-in Stellarium runtime has no verified build-matched corresponding-source offer yet; the live service has not been tested. Rights to every bundled dataset or compiled runtime have **not** been fully verified; public access does not itself authorize unrestricted redistribution.

Maintained by [Shadowgar](https://github.com/Shadowgar).
