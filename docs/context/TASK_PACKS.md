# Task Packs (Reference)

This file describes how to use `docs/context/CONTEXT_MANIFEST.yaml` for feature-first work.

## Core Rule
Use only manifest-defined packs unless explicitly instructed otherwise.

## Pack Selection
- `docs_change`: authority docs, migration, reconciliation
- `backend_change`: backend feature slice implementation
- `frontend_change`: frontend feature slice implementation
- `validation`: acceptance/proof checks
- `debug`: failure diagnosis and bounded recovery
- `review`: classify `REAL/PARTIAL/FAKE/BLOCKED`
- `reconciliation`: resolve doc-vs-runtime conflicts
- `planning`: select next bounded feature slice

## Required Session Declaration
Before execution, declare:
1. selected task pack
2. loaded docs from manifest
3. confirmation that no extra docs were loaded (unless explicitly requested)

## Mapping to Feature Workflow
- inspect runtime truth -> `review` or `debug`
- implement bounded fix -> `backend_change` or `frontend_change`
- verify completion -> `validation`
- update state/tracker -> `docs_change`
