# First cinematic fidelity correction — owner review pending

The owner rejected the implementation at7743ac81 across all modes. The existing
approved concepts remain authoritative; this slice implements a shared visual
foundation and substantial Solar correction, not replacement concepts.

**Working private preview:** [Solar](http://localhost:4231/solar-system?date=2026-10-27T04:00:00Z) · [before/reference/after gallery](http://localhost:4231/owner-review/visual-fidelity/).
Open in Windows Edge on this computer. `/owner-review/` also opens the new gallery.
The existing task preview remains running; localhost is not accessible from an
iPhone. Physical iPhone and owner visual acceptance remain **UNVERIFIED**.

Application commit **`703e2b472e8d9bff34726d7e9a68cd254496ca63`** on existing
`recovery/reconcile-20261026` / draft PR107; subsequent commits contain evidence/docs.
No main merge, deployment, source archive publication or branch deletion.

## Actual visual correction

- Shared identity is a restrained horizontal mark/name/mode instead of a tall
  stacked pill. Softer glass borders and consistent typography reduce competing
  chrome. The Sky scene and its native controls remain Stellarium-owned.
- Solar replaces its persistent nine-body rail with **Explore planets** and
  discloses camera presets through **View**. All destinations remain accessible;
  keyboard selection restores focus, and reduced-motion behavior is retained.
- Camera composition uses unchanged source vectors, preferring readable separation
  and actual sunlit hemispheres. Cinematic disks have materially greater presence;
  the Sun has a brighter authored photosphere/corona. Planet/ring shading and the
  bounded illustrative backdrop have richer detail. No scientific positions,
  physical radii, source time or identities were changed. Enlargement stays labeled;
  physical scale and source details remain available. Saved quality choices remain.
- Moon uses compact context and a coordinate disclosure. Initial camera intent fits
  the measured native frame; supplied/history cameras are preserved. Closed/open
  layouts avoid short-screen clipping, including narrow short screens. Native globe,
  illumination, source imagery and credits are unchanged.

| Matched measurement | Before | After |
|---|---:|---:|
| Desktop Sun screen radius |45.6px|154.7px|
| Desktop Earth / Mars screen radius |22.8 /32.5px|72.1 /64.8px|
| Desktop projected body-disk area |1.07%|8.69%|
| Portrait projected body-disk area |2.18%|8.53%|
| Landscape projected body-disk area |1.52%|4.57%|
| Desktop brand height |78px|46px|
| Desktop camera panel height |128px|70px|

Disk area is the sum of visible projected circles, not physical scale or total
universe-content occupancy. Body centers remain exact. Panel measurements are from
actual DOM rectangles; [visible footprints/typography/material samples](receipts/footprints.json)
account for closed disclosures rather than treating their hidden content as chrome.
All four [original references](../../../design/cinematic-references-2026-10-21/)
passed byte/hash verification. The [gallery](index.html) uses their exact PNG bytes;
Moon/mobile context also links original R1-A references. No reference is an app
background. Before/after epochs and viewports match; reference aspect ratios are
contained without cropping, not rewritten into new mobile concepts.

## Verification and performance

Actual headed Windows Edge156/NVIDIA RTX3060 D3D11, desktop1440×900,
portrait390×844 and landscape844×390. [Thirty original before/after captures](receipts/captures.json)
cover overview/selected Mars/Earth/Sky/Moon; all15 final views rendered without page
exceptions. A [separate reviewer](REVIEW.md) found two correctness edges—disclosure selection
focus and Moon form resizing—which were corrected and verified.

- **416/416 frontend tests**,61 files; typecheck/build pass. Existing large-chunk
  warning remains. No repository/backend/satellite/archive reconstruction suite rerun.
- **27 real integrated checks**,3/3 layouts: nine source centers/radii vs actual API,
  physical scale, camera controls, disclosure/focus, Solar→Earth system→Moon→return,
  lunar inputs/source context/disposal, Earth search/zoom/Sources and Sky observer/UTC.
  Zero recorded page or shader errors.
- **5/5 Moon disclosure layouts** also cover390×540 and480×390: nonzero frame, fitted
  globe and unchanged camera closed/open. Explicit close-ups remain intentional.
- Individual emulated touch presets/destination selection and one-finger orbit pass
  in both mobile layouts. An immediate mixed CDP-drag→tap sequence remains
  **inconclusive**; initial failure evidence is retained. This is not physical-device
  qualification or a claim that every touch sequence is accepted.

Warmed46-frame camera-control runs, same Windows GPU/source epoch, sequential old
and new preview hosts; startup/shader compilation excluded by warming quality first:

| GPU time, median /p95 | Before efficient | After balanced |
|---|---:|---:|
| Desktop |0.079 /0.434ms|1.561 /2.429ms|
| Portrait |0.142 /0.334ms|0.460 /1.161ms|
| Landscape |0.162 /0.361ms|0.857 /2.049ms|

CPU p95 remains0.7–0.8ms. Richer rendering costs GPU time; these are renderer samples,
not end-to-end FPS or phone performance. Efficient quality remains available. No
claim that the owner's earlier lag is resolved. [Raw measurements](receipts/performance-after.json).

All111 native Sky files byte-match the qualified build. Earth/Moon artifacts,
scientific packs, owner settings and protected legacy catalog are unchanged;
[hash receipt](receipts/preservation.json). Only existing task-owned nginx config was
reloaded, including a loopback baseline virtual host. Protected containers/volumes,
network exposure and firewall settings were not changed.

## Remaining slices and owner decision

This is meaningfully closer in scene presence and chrome, not complete concept
fidelity. Solar still lacks the concept's simultaneous selected-body/overview
composition and richer source-qualified giant-planet assets; its source positions
cannot be rearranged to reproduce an illustration. The belt stays opt-in and
illustrative. Earth needs a separately chosen licensed imagery/terrain strategy;
current500m overview/2016 EOX/ellipsoid limits remain. Moon remains a coarse
3.79km/pixel historical sphere; native credit grouping and detailed exploration
are next slices. Further Sky/native-panel and planetary-system cohesion remain.
The existing cold-start search latency and satellite search coverage findings
were not revisited here. Release/source/device gates remain open; new Hub changes
will need a matching source distribution before release.

**Next:** owner operates the updated preview and judges this first visual slice;
choose the next bounded correction from the remaining gaps. No visual acceptance
is declared on the owner's behalf. [Changed files](CHANGED_FILES.txt),
[commands/context/review](COMMANDS.md), [implementation plan](PLAN.md).
