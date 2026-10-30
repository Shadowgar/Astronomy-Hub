# Solar System 2.2 — owner review candidate

Implemented on `recovery/reconcile-20261026`, draft PR107. Application commit:
`39f73b2ff0162d491fcf65b41a0bc038dd608b65`; starting commit:
`66fff05108ca7ed7ee0ee1d5137b4b2619c28373`. Main remains
`9a03d8260a529f5858c5c3298cbb9d32b721daeb`. Subsequent evidence changes do not
change application inputs. The PR records the final published evidence SHA.

**Owner visual acceptance remains pending. This is not integration/release approval.**
No merge, production deployment, public tunnel, source-archive publication,
protected resource deletion or new branch/PR occurred.

Private preview: <http://localhost:4231/solar-system?date=2026-10-27T04:00:00Z>.
Gallery: <http://localhost:4231/owner-review/solar-system-2.2/>.
Preserved 2.1.1 application: <http://solar211.localhost:4231/solar-system>.

## Preview outcome

Docker, WSL and both existing task containers were already running. The prior
exit was clean, with no OOM/error evidence; the historical outage cause remains
inconclusive. No container restart or reconstruction was needed. Windows Edge
actually operated all five requested routes, including Apollo17 and the 2.1.1
gallery. Existing IDs, images, mounts, bindings and rollback aliases were preserved.
Only the task preview's nginx root changed to a separate 2.2 artifact directory;
the listener remains `127.0.0.1:4231`.

From this worktree, run `python3 -B scripts/validation/recover_owner_preview.py`.
It validates existing services and starts only safely stopped task containers;
it does not recreate them, modify restart policies or repair an unavailable WSL
host. Five guard tests and separate non-author review pass. [P0 evidence](PREVIEW.md).

## Operating changes

- **Textures:** compact 1024-pixel overview models retain original NASA geometry
  and UVs. Selected-body detail is fetched separately, with shared admission
  budgets, stale-request cancellation, atomic map replacement and explicit
  retirement of uncancellable image decodes. Detail waits for its matching UV
  geometry. Camera and clock ownership remain unchanged.
- **Flagship detail:** Jupiter/Saturn use their real 4096×3072 atlases, four times
  the texels previously decoded. Mars uses a qualified 4096×2048 historical
  Viking mosaic. Earth uses registered 4096×2048 Balanced and 8192×4096 Detailed
  Blue Marble imagery, retaining the original clouds, ITRS orientation and
  corrected Takram depth reconstruction. No resolution is invented by upscaling.
- **Materials:** distinct rocky/cloud-planet limb responses retain source
  geography and the actual Sun direction. Saturn scattering applies optical
  coverage once. Every quality now blends transparencies in linear space before
  one output transform; Efficient omits bloom. Unsupported float targets retain
  a disclosed linear-RGBA8 fallback with pre-blend HDR clipping.
- **Sun:** warm-white HDR photosphere, filtered illustrative granulation, limb
  shading and compact corona. The excessive ray treatment seen in an intermediate
  capture was rejected. One renderer, output transform and scientific clock remain.
- **Composition/travel:** source-derived camera search includes views above and
  below the orbital plane. No centers move to imitate the concept. Long journeys
  depart their old body, transfer at distance, then approach physical radii with
  the destination acquired. Quintic easing, ring-aware Saturn framing, input
  interruption, recentering and reduced motion preserve existing controls.

All/Inner/Outer remain camera presets. Cinematic enlargement is disclosed;
physical scale is retained. Native Sky/Earth/Moon, parent-centered systems,
Apollo17's measured regional tiles, source packs and original visual assets remain.

The original approved PNGs remain the visual authority. [NASA Eyes](https://eyes.nasa.gov/apps/solar-system/)
and its [official capability description](https://science.nasa.gov/eyes/) informed
selection, travel and time-control comparisons; no Eyes code, assets or branding
were copied. This does not claim Eyes feature parity.

## Proof

Actual headed Windows Edge156 / NVIDIA RTX3060 Laptop / ANGLE D3D11:

- 56 current captures across desktop1440×900, portrait390×844 and landscape844×390;
  16 comparisons restore the prior camera/target/up within1e-12 AU at the same UTC.
- Ten Earth day/limb/crescent/backlit/20km-horizon Takram/custom views, including
  inspection for recurrence of concentric artifacts.
- 27 integrated journey groups: physical fly-to, source time forward/reverse,
  follow/free flight, Eros, Saturn system return, resize and actual context loss/retry.
- Three shorter recorded journeys: overview→Jupiter→Saturn/rings→overview,
  wheel or emulated touch interruption, recenter and reduced motion. Source centers,
  UTC and renderer identity are checked. [Actual videos](video/). Final gallery checks load40images and all3videos at desktop/portrait with no horizontal overflow.
- Six controlled [streaming/lifecycle cases](STREAMING.md), including failed
  downloads, stale completion, atlas/geometry ordering,8k→2k retirement and Eros.
- 599 frontend tests/81files; typecheck; production Docker build; seven warning-clean
  Docker science/frame tests; four source/geometry/registration checks; five preview
  recovery guards. All284 produced runtime files match both the served artifact directory and actual HTTP responses.654 included source inputs match the application commit; documented Docker exclusions remain excluded.

[Independent review](REVIEW.md) found and prompted correction of a P1 arrival
collision, P2 Eros material mismatch and P2 nonlinear transparency composition.
All72 ordered source-backed planetary journeys now pass actual controller/swept
collision tests. Separate source/resource and preview-helper reviews also pass.
[Final pinned review](REVIEW_FINAL.md) is bounded to this change, not the entire PR.

[Performance measurements](PERFORMANCE.md), [source/license/size/hash evidence](SOURCES.md), [files changed](CHANGED_FILES.txt),
[exact commands and retained failures](COMMANDS.md), [capture manifest](capture-manifest.json)
and compressed receipts accompany the gallery. Unchanged native/terrain qualification
from2.1.1 is reused within its original scope, not represented as fresh full-suite proof.

## Remaining limitations and next gate

The clearest visible gains are Mars continuity, Saturn ring legibility and desktop framing; the matched Jupiter difference is subtler despite its fourfold texel increase. The portrait overview still clusters the inner planets; the concept's arrangement
cannot be reproduced exactly while retaining real centers. Saturn's source atlas
is intrinsically soft, and Mars has historical mosaic/polar artifacts. Earth clouds
remain static. Sun morphology, ring optical depth and non-Earth rotation remain
illustrative. No new measured terrain, live weather or photometric calibration is claimed.

Recorded travel had median6.9ms/p957ms RAF intervals on this144Hz laptop; one
desktop cold frame reached319.5ms. Recording/initialization/upload/driver work is
not isolated by that observation, and stutter-free travel is not claimed. GPU
admission estimates exclude targets, driver overhead and extra CPU bitmap memory.
See the dedicated measurements for quality costs rather than converting GPU time to FPS.

Physical iPhone remains unverified. Owner acceptance, a matching final source-only
reconstruction/public source offer and inherited source/legal/release qualifications
remain open; the oldf7cb702c archive does not match this application. Existing
repository advisory debt is not cleared by these scoped changes.

**Next task: owner inspection of this working preview and its comparisons.**
Do not merge, deploy or expand this run into another product phase.
