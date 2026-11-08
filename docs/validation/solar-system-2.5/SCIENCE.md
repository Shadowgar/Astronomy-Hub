# Solar 2.5 mission science qualification

Worktree: `repository-recovery-20261026`, branch `recovery/reconcile-20261026`.
Starting application HEAD was `ea4d384af3aead949de7bec1947e8aff41465bca`.
The owner's Solar2.5 directive and the `solar_reconstruction` context pack authorize
this isolated historical adapter. Existing Solar2025–2030 packs are unchanged.
This document qualifies the named numerical/source work, not owner acceptance,
attitude, physical phones, universal historical coverage or live telemetry.

## Immutable admitted release

- Directory: `data/runtime-packs/solar-missions/release-v3` (ignored source bulk).
- Manifest SHA256: `9b1bf0cde347536ae5d2c923684498c199444084458d72bdbccbe833c4055e94`.
- Tracked exact manifest: [mission-source-manifest.json](mission-source-manifest.json).
- Files total approximately4.9MiB; only selected mission vectors load at runtime.
- Acquisition plus fresh validation/regression fixtures:31,052,066bytes before the separate retained
  discovery receipts. The six discovery compatibility responses total well below
  64KiB; original metadata probes are also retained. All are below the explicitly
  approved128MiB aggregate; each provider response is capped at16MiB. No complete
  multigigabyte archive was acquired.
- Previous `preview-v1`, `release-v1` and `release-v2` are retained unchanged.
- `ORAS_SOLAR_MISSIONS_DIR=/app/data/runtime-packs/solar-missions/release-v3`;
  mount that directory read-only. No source bulk belongs in Docker images.

The runtime pins the manifest and each mission file, validates finite monotonic
knots and same-epoch admitted targets, caches only bounded selected releases, and
returns a controlled503 when the source changes or is absent. No runtime provider
request, orbit synthesis or fallback to a contemporary position exists.

## Sources and coverage

Every precise subinterval and source header is in the tracked manifest. The table
summarizes the admitted range, not continuous coverage through omitted intervals.

| Mission | NAIF identity | Admitted coverage and source meaning |
|---|---|---|
| Voyager1 | `-31` | September1977–January2030; reconstructed Jupiter and Saturn encounter intervals; approximate mission-design early cruise; tracking-fit/mixed1981–1992; prediction after1992 |
| Voyager2 | `-32` | August1977–January2030; separate reconstructed Jupiter, Saturn, Uranus and Neptune intervals; approximate mission-design cruise; tracking-fit/mixed1989–1992; prediction after1992 |
| Cassini | `-82` | October1997–June2004 cruise; selected Saturn arrival, TitanTa2004, EnceladusE2/E212005/2015, April2017 GrandFinale and September2017 final approach intervals |
| New Horizons | `-98` | January2006–January2030, with explicit source transitions/gaps; reconstructed Jupiter2007, Pluto–Charon2014–2015 and Arrokoth2018–2019 intervals; historical cruise/prediction labels preserved |
| Pioneer10 | `-23` | March1972–January1980, general historical Sun-relative trajectory only |
| Pioneer11 | `-24` | April1973–January1980, general historical Sun-relative trajectory only |
| Juno | `-61` | July2–8,2016 Jupiter insertion interval, reconstructed source |
| Dawn | `-203` | July14–20,2011 Vesta and March5–10,2015 Ceres arrival intervals, reconstructed mission-target solutions |
| NEAR Shoemaker | `-93` | February12–18,2000 Eros insertion interval, archived `eros80`/DE403 geometry |
| Rosetta | `-226` | August4–10,2014 comet67P arrival interval, ESA RORB/CORB mission solution; conservative mixed classification |

Launch dates are verified historical events. Exact launch instants outside these
source intervals remain unavailable; a representative later state is never called
the launch state. Selected Cassini intervals do not pretend to cover its entire
13-year Saturn orbital tour. Huygens is a distinct probe; the admitted Cassini
trajectory is always `-82`, and no Huygens descent/position is supplied.

The [Horizons spacecraft documentation](https://ssd.jpl.nasa.gov/horizons/manual.html)
explains why historical target solutions must accompany mission trajectories.
Retained spacecraft metadata identify the exact source versions and limitations.
Voyager's current Horizons early legs explicitly describe rough patched-conic
mission-design trajectories. They are not relabeled reconstructed, and their paths
are separated from the following NAIF encounter reconstructions:

- `vgr1_jup230.bsp`, `vgr2_jup230.bsp`, matched1979 JUP230 excerpt.
- `vgr1_sat337.bsp`, `vgr2_sat337.bsp`, matched `sat337.bsp`.
- `vgr2.ura182.bsp`, containing the compatible URA182/DE442 target/Sun chain.
- `vgr2_nep097.bsp`, containing the compatible NEP097/DE440 target/Sun chain.

These are original [NAIF Voyager sources](https://naif.jpl.nasa.gov/pub/naif/VOYAGER/kernels/spk/).
SAT337's [source release note](https://naif.jpl.nasa.gov/pub/naif/VOYAGER/kernels/spk/readme.vgr1.sat337.txt)
describes its joint spacecraft/planet/satellite fit. The URA182
[comments](https://naif.jpl.nasa.gov/pub/naif/VOYAGER/kernels/spk/vgr2.ura182.cmt)
identify the compatible spacecraft, satellite and planetary solutions.

New Horizons Jupiter uses `nh_recon_e2j_v1.bsp` and original-coefficient JUP260 and
DE413 excerpts from the [official PDS mission archive](https://naif.jpl.nasa.gov/pub/naif/pds/data/nh-j_p_ss-spice-6-v1.0/nhsp_1000/data/spk/).
The [archive description](https://naif.jpl.nasa.gov/pub/naif/pds/data/nh-j_p_ss-spice-6-v1.0/nhsp_1000/data/spk/spkinfo.txt)
identifies this as a reconstructed launch-to-Jupiter trajectory. Kernel comments
give Earth-to-Jupiter Cruise1 inertial uncertainties of200km and3.3mm/s, and
Jupiter-to-Pluto Cruise2 uncertainties of10,000km and6.7mm/s (3-D,1σ). The admitted
Jupiter window crosses that phase boundary; no single estimate is assigned to the
whole window and no per-epoch covariance is supplied. The small interpolation
residual is not a replacement for physical uncertainty. No formal physical
covariance is available for most other admitted segments.

Cassini's final reconstructed source is `180628RU_SCPSE_04183_17258`; earlier cruise
sources and transitions remain in its retained Horizons metadata. New Horizons
Pluto uses the current mission-merged PLU060 post-encounter reconstruction; Arrokoth
uses the mission's `NavSBE_2014MU69_od159` target, not a contemporary generic TNO fit.
Future and historical prediction segments remain explicitly labeled predicted.

## Historical target consistency

All states use ICRF, geometric vectors without aberration/light-time, km/km/s at
acquisition and AU/AU-per-second in the API, with a Sun origin. UTC navigation is
converted to TDB using the installed time tables; future UTC retains their leap
second assumptions.

For Horizons missions the target state is constructed from two native merged
solutions: `craft@Sun − craft@target`. Both requests must report the same native
spacecraft center solution. The direct craft-to-target vector is preserved.
The spacecraft source itself selects the mission's compatible center solution.
Ordinary target queries are not silently substituted.

The [compatibility comparisons](historical-compatibility-checks.json) reproduce a
real trap: ordinary Saturn@Sun uses SAT441/DE441 while Cassini's native relative
geometry uses `cassini_merge`. At two2007epochs the difference is approximately
0.860km. The adapter preserves the mission geometry. Ordinary Pluto@Sun/PLU060
agrees with New Horizons native Pluto geometry to less than0.000001km in the two
retained2015checks. Voyager and New Horizons Jupiter instead evaluate spacecraft,
physical target and Sun from their explicitly matched archived SPK chains.

Archived minor-body IDs are strings: Dawn Vesta`2000004`, Ceres`2000001`, NEAR
Eros`2000433`, Rosetta comet`1000012`, Arrokoth`2486958`. They are distinct from
modern Horizons/SBDB lookups such as `433;`. Each catalog advertises only its exact
admitted target identities, separate from cosmetic appearance IDs. Unavailable
historical objects are omitted;2025–2030 bodies are never frozen beside a1979craft.

Target texture longitude/ring presentation in the mission renderer is disclosed
as illustrative pending separate historical surface-frame qualification. No
spacecraft CK/FK/SCLK attitude was acquired; models use illustrative inspection
poses. Arrokoth's11km camera/reference bound comes from the Horizons center's
11×10×3.5km reference semiaxes; it is not a measured spherical shape or model.

## Numerical and integration evidence

The acquisition script uses source position and velocity with cubic Hermite
interpolation. Each retained interval is checked at quarter/mid/three-quarter
source epochs, with adaptive subdivision near encounters. Typical encounter
acceptance is0.05km and0.00005km/s; NEAR/Rosetta use0.005km and0.000005km/s. Cruise
uses10km and0.001km/s. Source discontinuities that still fail at30seconds become
explicit coverage gaps. No curve connects them. These are sampled numerical
checks, not continuous bounds or physical orbit uncertainties.

Fresh independent golden-ratio-fraction checks found two release-v2 misses:
Voyager1 approximate cruise velocity1.234m/s and Voyager2 Uranus position52.87m.
The affected source cells alone were subdivided into release-v3; no tolerance was
increased. The [red report](mission-reference-checks-v2.json) and
[green report](mission-reference-checks.json) retain the evidence. Final checks
compare2376position/velocity states across90source segments against fresh native
Horizons queries or direct CSPICE, with zero failures. UTC/TDB comparisons at seven
historical/leap/current epochs differ by at most44.2microseconds between Skyfield
and CSPICE with `naif0012.tls`.

Independent review also corrected the following integration defects:

1. Public catalog bounds originally exposed unplayable raw source edges. Catalog
   and runtime now use identical inward millisecond bounds; every admitted public
   endpoint and default is tested.
2. Range-source transfers originally used a separate budget. The shared persisted
   ledger now accounts retained and new range bytes before HTTP transfer. The
   actual acquisition never approached the128MiB ceiling.
3. TDB→UTC roundtrip noise put some trajectory labels tens of microseconds outside
   their public bounds. Requested/admitted UTC labels are now retained exactly for
   path endpoints and ranges; numerical source states are unchanged.

DAF excerpts preserve original polynomial records. Their final physical record is
padded to1024bytes: the existing jplephem writer otherwise leaves a partial final
record that CSPICE reads incorrectly. No orbit coefficients are modified.

Focused command:

```sh
PYTHONPATH=. /home/rocco/Astronomy-Hub/.venv/bin/python -m pytest backend/tests/test_mission_exploration.py -q
```

At this checkpoint:17passed;2inherited HTTPX `app` shortcut deprecation warnings.
The tests cover finite/source identity requirements, archive integrity, target
epoch equality, adaptive numerical refinement, real gaps, UTC leap windows,
public endpoints, API error handling and shared acquisition budgets. Two retained
real-source regression fixtures prove both original off-quarter failures fail and
the source-refined cells pass, without increasing either acceptance limit.

Reproduction commands (CSPICE is an existing offline qualification dependency,
not a new backend runtime dependency):

```sh
PYTHONPATH=output/playwright/solar-system-2.4/asset-tools-venv/lib/python3.12/site-packages:. \
 /home/rocco/Astronomy-Hub/.venv/bin/python scripts/skydata/acquire_solar25_missions.py \
 --output data/runtime-packs/solar-missions/release-v3 \
 --verify-report docs/validation/solar-system-2.5/mission-reference-checks.json
```

The acquisition command requires a new output directory; `--repair-from` plus
`--repair-report` creates a new immutable release containing only independently
identified cell repairs. Original raw responses, exact POST bodies, kernel hashes
and HTTP range receipts remain in ignored `data/source-cache/solar25-missions`.
The source terms are NASA/JPL's linked provider terms and public PDS scientific
data; spacecraft model rights are qualified separately by the asset workstream.

Actual Docker/API/Windows browser results, independent reviews, final application
SHA and CI status belong to the parent integration report. No commit, push, merge,
deployment, protected-volume change or source-archive publication was performed
by the science workstream.
