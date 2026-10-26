# Native satellite position discrepancy investigation

**Cause localized; no runtime fix or precision acceptance claimed.** The retained
61.904–62.096 arcsecond difference is predominantly native TEME frame handling,
combined with native observer Earth-rotation/time handling and its relative
light-time convention. Applying the actual pinned source operations to the same
TLE reproduces all 24 retained vectors within 0.007–0.050 arcseconds. This is a
numerical causal reconstruction, not an invented passing tolerance.

## Scope, authority, and preservation

Evidence baseline: `sky-satellite-visual-pilot-1`, `d2909a52`. Output branch:
`sky-satellite-observing-1`. Only this output directory was written by this
investigation. No source/catalog update, native source change, runtime binary
change, container restart, deployment, or repeated historical browser campaign.
The two `.so` files here are isolated analysis helpers and are never installed or
served by the application. No commit, push, or PR was performed by this task.

Loaded task documents: `docs/context/CORE_CONTEXT.md`,
`docs/context/LIVE_SESSION_BRIEF.md`, `docs/context/CONTEXT_MANIFEST.yaml`,
`docs/validation/SYSTEM_VALIDATION_SPEC.md`,
`docs/architecture/UNIFIED_UNIVERSE_ARCHITECTURE.md`, and the explicitly requested
`docs/validation/satellite-visual-pilot/evidence/independent-motion/REPORT.md`,
`comparison.json`, and `compare_motion.py`. Debug context applies; no unrelated
document pack or broad documentation scan. The owner-authorized new investigation
supersedes the older pilot stop checkpoint only for this bounded work.

Inputs are the existing three-viewport browser proof, its independent comparison,
and exact source TLE for NORAD `61045`, SPACEMOBILE-003. All 24 captures are from
the same approximately eight-second simulated pass on 2026-10-25, including 13
captures with native speed zero. They are not 24 independent physical passes.
Observer: 41.3219030000159°, -79.58539400000345°, elevation 432.816 m.

The proof SHA256 remains
`8ff7e45439ce5b00d908a48f117b3a38cc6c8f14731d5d78883d5e614eacdce2`.
TLE transport SHA256 remains
`63c4c833d967c26c2b3d403de42c234ff6b920969639642a3bedce15225406e2`.
`investigation.json` records input hashes, per-capture vectors, commands, versions,
and hashes for 12 inspected native files verified byte-for-byte against upstream
Git revision `023e3b26babf7ffddf45f39293230b14cfe96993` in the existing local source
repository. No upstream fetch was required. The old worktree omits these ignored
native files, so the verified copies under the primary checkout were read.

## Findings

| Diagnostic | Result across 24 retained captures |
| --- | ---: |
| Original native vs Skyfield instantaneous geometric | 61.9039–62.0964 arcsec |
| Proper-frame reference plus native-style relative light correction | 57.8885–58.0754 arcsec |
| Pinned native operations reconstructed vs native capture | 0.0070–0.0504 arcsec |
| Native vs Python SGP4, raw TEME position | 0.000129–0.003762 m |
| Native vs Python SGP4, raw TEME velocity | 0.000000143–0.000004162 m/s |
| Best projected timing-only adjustment, residual remaining | 36.0099–36.1792 arcsec |
| Exact vector match after native 12-decimal AU serialization | 19/24 |

The other five serialized reconstructions differ by one last decimal in one or
two components. Native `src/obj.c:288–298` exports vectors with `%.12f`; the
unrounded numerical residuals above are therefore near the captured precision
floor. These measurements do not assert a precision gate or exact agreement of
all runtime internals.

1. **The dominant error is TEME conversion, not SGP4 propagation.**
   `src/modules/satellites.c:407–426` propagates SGP4 and sends its TEME output to
   `true_equator_to_j2000` (`:372–379`). That helper applies `obs->rnp` without the
   TEME mean-equinox to true-equinox rotation. `observer.c:135–142` constructs
   `rnp` from ERFA precession/nutation. The actual effective matrix is
   `rn.T @ rp.T`, because SWE's matrix helpers use column-major conventions on
   ERFA row-major arrays. The reconstruction preserves that exact operation;
   it does not silently replace it with a preferred matrix order.

   At the initial epoch the equation of equinoxes is about 7.082 arcseconds.
   A geocentric displacement of approximately 179.08 m becomes much more visible
   from the observing site at only 526.36 km range. Replacing the proper reference
   transform with the native transform shifts the topocentric direction by
   70.1547–70.3258 arcseconds in these captures. Frame bias, matrix ordering, and
   epoch differences are included in this measured full native-transform effect;
   the entire number is not attributed solely to one omitted rotation term.

   TEME means **true equator, mean equinox**, not true equator and true equinox.
   This is explicitly documented by [Skyfield's TEME API](https://rhodesmill.org/skyfield/api-satellites.html)
   and [Vallado et al., Appendix C](https://celestrak.org/publications/AIAA/2006-6753/AIAA-2006-6753.pdf).

2. **Native observer rotation/time handling adds a second, partly cancelling effect.**
   `observer.c:208–209` explicitly uses UTC for Earth rotation in the full update,
   with an upstream comment acknowledging UT1 should be used. The fast update
   uses `obs->ut1`, but the pinned ERFA and time-conversion policy matter here:
   `ext_src/erfa/erfa.c:6119` sets `IYV=2020`, and `:6215` marks years after 2025
   dubious. Compiling the unchanged library and calling `eraDat` gives:

   ```text
   2025-10-25: status 0, TAI-UTC 37.0 seconds
   2026-10-25: status 1, TAI-UTC 37.0 seconds
   ```

   `src/algos/utctt.c:25–29,54–61` treats any nonzero status as unknown leap
   seconds and assumes UTC=UT1. The reconstructed native TT-UTC is approximately
   74.1742 seconds from its Delta-T model; Skyfield's is 69.184 seconds, with
   UT1-UTC approximately +0.0890935 seconds. Native TT/DUT1 were not exported by
   the retained proof; these internal values are source-derived and numerically
   corroborated, not a new browser measurement.

   At the initial captured epoch the reconstructed observer position differs by
   about 31.168 m. Across captures, changing only the observer convention shifts
   the predicted satellite direction by 12.2090–12.2674 arcseconds. Earth rotation
   uses UT1; see the [ERFA observing-station routine](https://github.com/liberfa/erfa/blob/master/src/pvtob.c).

3. **Apparent/geometric conventions explain several arcseconds, not the whole discrepancy.**
   `src/frames.c:12–49` subtracts observer position/velocity and applies a linear
   relative light-time correction. This moves the native-model direction by
   4.9988–5.0483 arcseconds. The previously retained full Skyfield apparent-place
   calculation still left approximately 58 arcseconds, consistent with this new
   diagnostic. The native satellite helper rotates position but leaves velocity
   in its original frame; rotating that velocity changes these results by only
   0.0057–0.0063 arcseconds and is not the 62-arcsecond cause.

   These effects are **vectors**, so their angular magnitudes must not be added
   as scalar error budgets. The script retains vectors for each isolated
   hypothesis and the combined reconstruction. [Skyfield explains the
   geometric/astrometric/apparent distinctions](https://rhodesmill.org/skyfield/positions.html).

4. **The evidence does not support a timing-only or raw-propagator explanation.**
   The 61.913-arcsecond initial offset exists in the frozen state. A tangent-based
   timing adjustment near -0.01764 seconds at the initial epoch still leaves
   36.170 arcseconds perpendicular to the motion. That diagnostic is not applied
   to evidence and does not select a new validation threshold. The unchanged
   pinned native SGP4 compiled locally agrees with Python SGP4 at raw TEME level
   to at most 3.8 mm for these samples. No changed elements or alternate orbit
   model were needed to reproduce the discrepancy.

## Reproduction and validation

From this directory:

```sh
/home/rocco/Astronomy-Hub/.venv/bin/python investigate.py > run-output.json
```

The script executes these isolated helper builds:

```sh
g++ -shared -fPIC -O2 /home/rocco/Astronomy-Hub/vendor/stellarium-web-engine/src/sgp4.cpp -o /home/rocco/Astronomy-Hub/.worktrees/sky-satellite-observing-1/output/satellite-observing/accuracy/libnative_sgp4.so
gcc -shared -fPIC -O2 /home/rocco/Astronomy-Hub/vendor/stellarium-web-engine/ext_src/erfa/erfa.c -lm -o /home/rocco/Astronomy-Hub/.worktrees/sky-satellite-observing-1/output/satellite-observing/accuracy/libnative_erfa.so
```

It verifies each of 12 inspected source files with the exact command pattern
`git -C /var/tmp/oras-phase-c/sky-reconstruction/upstream show 023e3b26babf7ffddf45f39293230b14cfe96993:<path>`;
the complete path list is in `investigation.json.source_receipt`. Exit status 0;
12/12 source identities match; 24/24 retained captures analyzed; proof and prior
comparison unchanged at end. Exact numerical output: `run-output.json`.

The data products are `investigate.py`, `investigation.json`, `run-output.json`,
this report, and the two isolated helper libraries. Runtime and browser
revalidation were deliberately not run for this source-read-only investigation.
The existing browser proof is retained input, not newly executed proof. DE442s
was used by the prior comparison; the new raw-frame/observer diagnosis does not
need to rerun a barycentric ephemeris calculation or download ephemerides.

## Remaining gaps and next task

The native position discrepancy is **not repaired**, and absolute orbit accuracy
is **not accepted**. This is one same-TLE implementation comparison, not an
independent optical/radar truth measurement; source age and physical TLE error
remain separate. No other epochs, satellites, eccentricities, ranges, or observer
locations have been newly qualified. The small residual is not a new tolerance.
Skyfield uses its installed built-in Earth-orientation data for this comparison.

Recommended next task: a separately authorized native science correction with a
documented upstream exception/hook strategy. Predefine external frame/time
references and tolerances, then qualify TEME position and velocity conversion,
UTC/UT1/TT behavior across the ERFA warning boundary, multiple orbit geometries,
and actual rebuilt native browser output. Keep any satellite observing UI claim
separate from absolute precision until that work is complete.
