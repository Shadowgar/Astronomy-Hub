# Ordinary-UI browser qualification

**Three viewports pass the bounded user journey; owner functional acceptance remains pending.**
[Open recordings and full screenshots](http://172.26.23.204:4228/evidence/satellite-observing/gallery/).
[Exact assertions and source hashes](evidence/browser/proof.json) · [Media hashes](evidence/browser/media-sha256.json).

| Viewport | Result | Unselected point FOV | Departure / arrival pixels | Symbol / label pixels | Software RAF median / p95 |
| --- | --- | --- | --- | --- | --- |
| 1440x900 | PASS · 39 assertions | 120.0° | 6 / 6 | 31 / 340 | 116.7 / 216.6 ms |
| 390x900 | PASS · 36 assertions | 60.0° | 6 / 7 | 44 / 337 | 16.7 / 50.0 ms |
| 667x390 | PASS · 36 assertions | 60.0° | 4 / 6 | 65 / 337 | 33.3 / 66.6 ms |

All actions use ordinary application buttons, keyboard, wheel or real CDP touch/pinch input. Native state is read only for assertions. Videos record the entire page from opening Sky through pass discovery, Watch, Play/Pause, restart, zoom identification, select/track/stop/deselect, Live and subsequent qualification actions. The chosen target is a real returned source-qualified passage; no test object is injected. Identity, exact source TLE, native timestamps and preservation snapshots are retained in the proof. Desktop additionally exercises Earth handoff/history return; all viewports check reload behavior and cleanup.

Motion pixels are differences between paused native epochs at a fixed camera, with predicted native projections and measured displacement retained. They are not a visibility or absolute-position precision certificate. The tested satellite's apparent brightness is unavailable in the prediction API. Portrait uses an ordinary pinch to approximately60° before playback: the initial120° phone check did not meet the unchanged point-pixel gate. No photometry alteration or threshold waiver was used. Automatic identification remains native and unselected at close zoom.

The run uses reduced-motion preference, asserts keyboard activation, touch controls, selected controls inside the viewport with at least44px height, native identification pixels clear of the simulation panel, actual Live UTC, observer/display preservation, and no fatal page exceptions. This is bounded accessibility evidence, not a complete WCAG or screen-reader audit. Physical devices and hardware GPU performance remain unqualified. RAF samples are software-rendering timing evidence, not GPU benchmarks.

Existing dense-star tile404s and console warnings are retained per run. They do not become a clean-network pass. Original failed runs remain under the preview evidence directory: microsecond UTC contract rejection, tracking-target overlay, a harness Earth-transition wait, and the120° phone point-pixel failure. Earlier passing captures are not relabeled as final-source qualification.

The final proof was captured before the delivery commit and is bound by explicit source hashes; the final committed receipt independently matches those sources and all served build bytes. Original videos remain in the task output directory, hash inventoried here, and are served by the task-only preview; they are not added as large Git binaries.
