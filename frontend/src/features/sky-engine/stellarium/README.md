# ORAS Sky-Engine Runtime Integration

Selected relocation strategy: Option C.

- The working ORAS Sky-Engine source now lives in `/home/rocco/Astronomy-Hub/vendor/stellarium-web-engine`.
- The React boundary in `frontend/src/features/sky-engine/` does not absorb the third-party source tree.
- The moved runtime keeps its own Vue app, Make and SCons build flow, sky data assets, and wasm build artifacts.
- `/sky-engine` mounts the running vendor app instead of recreating rendering logic inside React.