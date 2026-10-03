# LIVE SESSION BRIEF

ORA-7 implements the owner-approved locked unified workspace on branch
`phase-c7-unified-workspace-implementation-1`, SINGLE AGENT ONLY. Its unchanged
locked design ancestor is `2a4a665bc2db8399dd0728f918f5aae695ac0cd5`; the merged
PR #55 main baseline is `b2f9dce9bb559a1d23dc806a1b8d1927c502f084`.
No runtime override mode is active. Load the `frontend_change` context pack.
The explicit owner implementation request supersedes the previous ORA-6 brief's
wait-for-approval restriction. Repository design documents remain authoritative;
the secondary Figma file remains partial under the existing owner waiver.

Implemented behavior: `/` and `/sky-engine` open Sky in one continuous workspace;
`/earth` opens Earth in the same shell. Sky/Earth are modes, Tonight/Observe are
reusable contextual tools. Focused `/observe`, `/tonight` and standalone
`/oras-sky-engine/`, `/earth-runtime/` remain. Floating surfaces, mobile sheets,
selection/time controls, session pin and immersive behavior follow the locked
[design contract](../design/UNIFIED_WORKSPACE_DESIGN_SPEC.md).

Astronomy Hub owns the independent Cesium Earth Viewer/camera/lifecycle/layers,
selection, attribution, product UI and scene-time intent. God's Eye remains an
immutable external feature dependency at
`e7707d9a0f34d9fbffc300023c319f95caa5be30`; its complete application and Viewer are
absent. SWE retains its own rendering, selection/camera and scientific math.
The authenticated versioned bridge and serial one-heavy-renderer lifetime remain.
Native Sky WASM/vendor chunks are unchanged; embedded duplicate chrome is hidden
through an owned generic overlay, with native view settings and standalone UI retained.

Earth uses qualified NASA GIBS Blue Marble static imagery over local Natural Earth
fallback, with ellipsoid terrain. Configured terrain/3D admission exists, but no
account provider or photorealistic/terrain result is claimed without credentials
and separate qualification. Live aircraft/satellite/weather clocks remain distinct
from requested astronomy scene time; no historical provider simulation is claimed.

Current qualification and limitations are recorded in
[workspace implementation evidence](../validation/UNIFIED_WORKSPACE_IMPLEMENTATION_EVIDENCE.md).
Historical Phase B/C evidence is preserved. Deliver the PR and one normal review
cycle, repair Category A with focused retests, set ORA-7 **In Review**, then stop.
Owner approval closes ORA-7. Do not merge or start another phase. Preserve unrelated
`.vscode/settings.json` unchanged and unstaged. No ISS handoff, Mars/Moon surfaces,
measured horizon or broad God's Eye feature-parity expansion is authorized.
