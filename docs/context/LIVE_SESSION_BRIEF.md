# LIVE SESSION BRIEF

ORA-6 unified workspace design handoff is the current task, single agent, branch
`phase-c7-unified-workspace-earth-visual-1`. PR #55 is **merged** at
`b2f9dce9bb559a1d23dc806a1b8d1927c502f084`; its final head was
`eaad970a4385c61cfad6c0126682e2ccb4400785`. No runtime override mode is active.
Load the planning/frontend_change packs for this design handoff.

Astronomy Hub owns the Cesium Earth Viewer, camera, viewport, lifecycle, layer
registry, selection, attribution, UI and time model. God's Eye remains an immutable
external feature-library dependency pinned to
`e7707d9a0f34d9fbffc300023c319f95caa5be30`. Reuse public aircraft, satellite and
weather exports selectively; never start its full application or Viewer.
This supersedes Phase B's full-app recommendation. FastAPI remains canonical.
SWE owns Sky rendering, scene, selection/camera and scientific math. The merged
protocol and one-heavy-renderer serial lifecycle remain the implementation baseline.

Preserve recovered C0 Sky inputs, native bytes/science and qualified regressions.
The full-app experiment on `phase-c-full-gods-eye-experiment-backup` at `dd15ae1b`
remains local reference only; never push it.

Current product design: `/` becomes a Sky-first unified workspace; Sky/Earth are
modes, Tonight/Observe are contextual tools with focused routes preserved. Floating
panels, mobile sheets, truthful time/provider states and progressive disclosure are
specified in the [design contract](../design/UNIFIED_WORKSPACE_DESIGN_SPEC.md) and
[editable visual reference](../design/UNIFIED_WORKSPACE_VISUAL_REFERENCE.html).
These describe the implementation target, not already implemented behavior.

The owner explicitly authorized proceeding without Figma when page/MCP limits
blocked it. The existing Figma file is partial and is not the final screen authority.
The repository contract and visual reference are the owner-review handoff.
ORA-6 delivery does not constitute owner approval. **ORA-7 remains not started and
must wait for explicit owner approval of this design.** No production UI, runtime,
provider, protocol, backend, Docker or test edits are authorized by this design task.
One design/control commit only; no push, PR, review request or next-phase execution.
Preserve the unrelated `.vscode/settings.json` owner change.

Prior implementation evidence remains in
[bounded qualification](../validation/CESIUM_EARTH_PHASE_C_EVIDENCE.md).
Those historical test counts are not fresh ORA-6 runtime validation. This task only
validates design documentation, visual composition and change scope; it does not
requalify providers or the merged runtime. Configured terrain/3D and proposed bridge
capabilities require separate implementation and proof. No ISS handoff, historical
satellite clock, Mars/Moon surfaces or astronomy extension phase is started here.
