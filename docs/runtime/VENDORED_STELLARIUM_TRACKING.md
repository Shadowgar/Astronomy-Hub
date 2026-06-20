# Vendored Stellarium Tracking Policy

## Purpose

The ORAS Sky Engine runtime is built from vendored Stellarium Web /
Stellarium Web Engine source under:

```text
vendor/stellarium-web-engine
```

The full vendored tree is intentionally not tracked as normal repository
content because it includes large build, data, dependency, and upstream working
files. This keeps clones and package installs practical while preserving the
ability to commit exact ORAS runtime source changes when needed.

## What To Commit

Commit exact package-critical files when ORAS changes require them, including:

- edited source files under `vendor/stellarium-web-engine/apps/web-frontend/src`
- edited source files under `vendor/stellarium-web-engine/src`
- generated runtime output under `frontend/public/oras-sky-engine` when produced
  by the approved Stellarium build process
- runtime metadata such as `frontend/public/oras-sky-engine/oras-runtime-build.json`

Because the root vendor tree remains ignored, use explicit force-add commands
for edited vendored source files:

```bash
git add -f vendor/stellarium-web-engine/apps/web-frontend/src/path/to/file.js
git add -f vendor/stellarium-web-engine/src/path/to/file.c
```

Do not use broad add commands for the vendor tree.

## What Not To Commit

Do not commit:

- the full `vendor/stellarium-web-engine` tree
- vendored `node_modules`, build output, caches, or local dependency folders
- bulk Stellarium data under `vendor/stellarium-web-engine/data`
- bulk ORAS skydata under `frontend/public/oras-sky-engine/skydata`
- survey tiles, FITS files, CSV bulk, databases, logs, virtualenvs, or local env files

## Skydata Policy

Bulk skydata must stay ignored, mounted, cached, externally served, or generated
through an approved data pipeline. In particular:

```text
frontend/public/oras-sky-engine/skydata/*
```

stays ignored by default.

Small runtime data files may be tracked only when they are already part of the
approved committed runtime surface or are explicitly approved in the relevant
data pass.

## Generated Runtime Rule

Never edit generated runtime bundle files by hand.

When source changes under `vendor/stellarium-web-engine` affect the shipped
runtime, rebuild using the approved Stellarium build command and commit the
resulting generated runtime files intentionally.
