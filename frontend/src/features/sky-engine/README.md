# ORAS Sky-Engine Boundary

This folder is the official clean `/sky-engine` boundary for ORAS Sky-Engine.

- It owns the React route wrapper and runtime bridge only.
- It does not recreate the deleted custom renderer.
- It does not depend on Babylon packages or the removed owner or harness code.
- It mounts the vendored ORAS Sky-Engine runtime from `/home/rocco/Astronomy-Hub/vendor/stellarium-web-engine` through a thin host surface.