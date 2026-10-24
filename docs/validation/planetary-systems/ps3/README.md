# PS3 — Integrated planetary-system review package

Owner directive: hierarchical planetary systems and source-derived moon orbits.
Stack: PR92 → PS1 draft[PR93](https://github.com/Shadowgar/Astronomy-Hub/pull/93)
`36426905f1c178d8c8f9b8bfe9edd0b639512b04` → PS2 draft[PR94](https://github.com/Shadowgar/Astronomy-Hub/pull/94)
`26aa6111aa3ac5227215c1a19318eda10a8d8cd8` → this integration package.
Neither parent was merged or rewritten. Independent exact-head reviews of PS1 and
PS2 completed with no remaining actionable findings; review receipts are retained.

## Working preview

[Open Solar](http://172.26.23.204:4225/solar-system?date=2026-10-23T01:05:00Z)
· [Earth–Moon](http://172.26.23.204:4225/planetary-system/earth?date=2026-10-23T01:05:00Z)
· [Jupiter](http://172.26.23.204:4225/planetary-system/jupiter?date=2026-10-23T01:05:00Z).
Windows HTTP200 verified. Choose a parent in Solar, discover its moons in the
flyout or in-system selector, choose Play to advance astronomical time, select a
moon, and return through the hierarchy. Only Earth's Moon offers the native
qualified surface globe; other moons have source geometry but no detailed surface.

New task-only `oras-ps3-preview` serves the PS3 Hub and preserved native artifacts
on4225. It uses the unchanged, source-matched `oras-ps2-backend`. All mounts remain
read-only; prior preview services remain intact. No production deployment.

## Integration corrections

Playback stopped scientifically at the source endpoint, but persisting the epoch
cleared its explanatory notice. PS3 preserves that notice while at the endpoint;
independent review then reproduced an obsolete notice after Back to an earlier
epoch. The final correction clears only that endpoint notice when time moves
inward, preserving asset warnings. The speed diagnostic now reads the actual
selected speed rather than the renderer-mount closure's initial value. Source
positions, time progression, render geometry and physical/display radii are unchanged.
Both defects retain actual-browser red/green evidence.

The first direct Jupiter scene test assumed it was in the initial Inner framing.
Using the existing Outer planets control exposed its actual projected body for
picking; this was a test correction, not a change to accepted Solar framing.

## Scientific availability and appearance

[PS2 availability/source matrix](../ps2/README.md) remains authoritative: Earth–Moon
uses DE442s; five other physical-center systems have fourteen qualified moons in
the finite October2026 TDB release. Their browser-usable UTC coverage is
`2026-09-30T23:58:50.818Z`–`2026-10-31T23:58:50.817Z`. No extrapolation, automatic
reset, fabricated positions, new detailed surfaces, terrain or paid provider.
The2.4MB normalized source pack is versioned, excluded from images and mounted;
raw source archives and rollback resources are preserved. Parent centers and
barycenters are never silently interchanged across the source transition.

| Remaining visual/scientific limit | Objective reason |
| --- | --- |
| Non-Earth major moons are neutral reference-radius globes | No individually qualified imagery/shape model in this package; Phobos/Deimos are irregular in reality |
| Saturn rings omitted in local system | No qualified body-fixed ring orientation in this source contract |
| Local globe axes/texture orientation illustrative | Positional ephemeris alone does not establish body orientation; native Moon retains its qualified frame |
| Source-derived paths shown only in overview | Multi-revolution sample paths obscured small-moon close-ups; saved visibility preference is retained |
| Finite outer-system dates | Small coherent official source pack chosen instead of multi-gigabyte kernels; outside coverage remains explicitly unavailable |
| Physical GPU/mobile performance unqualified | Browser measurements use ANGLESwiftShader and emulated viewports/touch; GPU timer unavailable |
| Visual acceptance pending | Technical tests cannot establish owner acceptance |

Original NASA Mars model/UVs, historical Earth textures, lunar originals, accepted
Sky/Earth navigation, Pennsylvania landscape, native lifecycle, source pins,
scientific APIs, owner settings and volumes remain preserved. Future lunar tiled
imagery and terrain/elevation assessment retain their separate canonical roadmap.

## Evidence

[Commands/results](COMMANDS.md) · [Changed files](FILES_CHANGED.md) ·
[Independent review](REVIEW.md) · [Major-system screenshots](../ps2/README.md#actual-screenshots).
Fresh integration evidence is separated from reused PS2 science, material and
software-performance receipts. Reuse requires unchanged protected source/artifact
identities; historical runs are never relabeled as new passes.

Stop for owner functional and visual review. No merge, production deployment or
new roadmap phase is authorized by technical qualification.

Final corrected-source qualification:8cross-systemgroups,22nativeMoonreturngroups,
9resiliencegroups, focusednotice-historyregression,370frontendtests andTypeScript
passed. Three new builds match exactly and served/native/source preservation passes.
Science/API source remains byte-identical to qualified PS2; no scientific rerun is
misrepresented as fresh.

| Actual current viewport | Earth–Moon overview | Selected Moon | Native Moon |
| --- | --- | --- | --- |
| Desktop | [Overview](screenshots/1440x900-earth-moon-overview.png) | [Selected](screenshots/1440x900-selected-moon.png) | [Globe](screenshots/1440x900-native-moon.png) |
| Portrait | [Overview](screenshots/390x900-earth-moon-overview.png) | [Selected](screenshots/390x900-selected-moon.png) | [Globe](screenshots/390x900-native-moon.png) |
| Short landscape | [Overview](screenshots/667x390-earth-moon-overview.png) | [Selected](screenshots/667x390-selected-moon.png) | [Globe](screenshots/667x390-native-moon.png) |

Preserved native modes: [Earth](screenshots/earth-native-ready.png),
[Sky/Pennsylvania](screenshots/sky-native-ready.png).
