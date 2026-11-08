# Retained attempts and limits

- The initial adapter tests were RED (two failures) before panorama selection was
  implemented. A first GREEN attempt used cross-realm deepEqual on a VM object;
  serializing that boundary corrected the test assertion. Final focused 3/3 and
  complete runtime/Earth 133/133 pass; no test thresholds were loosened.
- Initial and edited generated PNGs contain near-opaque alpha values (mostly 252/253)
  in terrain. An exact-255 matte assertion failed. The original selected artwork
  remains unchanged. Documented native-format encoding normalizes 250..255 to 255,
  preserving transparent sky/partial edges. Both prompt revisions, first draft,
  failed logs and final hash manifest remain available.
- The first visual matrix wrongly required release to restore Guéreins even when
  embedded startup registers its panorama before any original landscape exists.
  The corrected matrix releases policy, selects real native Guéreins, verifies
  it stays selected, reembeds and separately checks fresh standalone Guéreins.
  No production behavior was changed in response to that test assumption.
- The first combined navigation run exited 143 before final proof. Its partial
  screenshots/log are not qualification. A detached retry did not survive its
  tool process and produced no evidence. Final separate streamed desktop/mobile
  proofs are the qualifying runs. No causal attribution for the interruption.
- Chromium uses software rendering and mobile/touch emulation. Physical devices,
  the owner's exact ChatGPT browser and subjective visual acceptance remain open.
  The original illustration is 1774×887; native 512px tiles do not add source detail.
- Existing astronomy tiles/providers may produce unavailable-resource warnings;
  new landscape requests are checked separately. No provider/catalog repair is
  included. Full backend/live-provider scientific suites are not run for this
  asset/adapter-only change. The artwork supplies no surveyed horizon data.
- Three P2 review findings remain open with separate reproduction evidence. No
  full PR readiness or final N1 acceptance is claimed.
