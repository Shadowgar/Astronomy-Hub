# Unified workspace design contract

Design version: ORA-6 / 2026-10-02. Branch: `phase-c7-unified-workspace-earth-visual-1`.
Implementation baseline: merged PR #55, `b2f9dce9bb559a1d23dc806a1b8d1927c502f084`.
Status: **design decisions locked for owner review; production implementation not started**.
ORA-7 is gated on explicit owner approval, not on delivery of this document.

## 1. Authority and deliverables

The owner explicitly waived the blocking Figma dependency: “If figma is blocking, move on without it.”
The implementation handoff is therefore this contract plus the editable, self-contained
[visual reference](UNIFIED_WORKSPACE_VISUAL_REFERENCE.html). Open that file in a browser;
`?screen=D01` isolates a named screen. The reference is design documentation, not app code
or a functioning prototype. Geometry and interaction behavior below are normative.
Renderer pictures establish composition, not current provider quality or scientific validation.

The existing [Figma file](https://www.figma.com/design/Qm4ua7OSuKGtgMxvZjJNEi)
is **partial and not the final visual authority**. Starter page limits and MCP call limits
prevented full visual review and repairs. Do not implement its unreviewed frames.
Its editable foundations/components remain useful source material:

| Figma resource | Node | Recorded construction result |
| --- | --- | --- |
| 00 — Foundations | `0:1` | 49 variables, 16 paint styles, 7 text styles, elevation style |
| 01 — Components | `6:2` | 41 components, 7 meaningful variant sets |
| 02 — Desktop | `6:3` | Desktop, large, tablet, mobile and state sections; 19 frames, 83 instances |
| Representative frames | D03 `11:760`; D10 `11:1326` | Review exposed missing reference imagery; quota blocked repair |

The requested six-page organization was not achieved. The local reference supersedes
those screen frames and includes 21 screens. This substitution is owner-authorized;
it does not imply Figma completion or owner acceptance of the design.

Current code owns Cesium Earth and uses selected pinned God's Eye modules. Historical
full-app Phase B recommendations and the old live brief's “PR #55 open” state are stale.
This design preserves the merged ownership/lifecycle architecture. It changes product
presentation only. It does not claim that proposed shell bridges already exist.

## 2. Product, hierarchy and ownership

The viewport is the product. `/` opens **Sky directly**, with one product header,
a compact Tonight summary and time controls. There is no landing hero or card wall.
Sky and Earth are renderer modes; Tonight and Observe are tools in the same workspace.
Panels overlay the renderer and never change its layout width. Selection takes context
priority; details are progressively disclosed. Empty selection means no object drawer.

Hub owns identity, modes, tools, context, chrome state, common selection/time framing,
intent and serial renderer lifetime. SWE owns rendering, math, scene, camera and native
selection. Owned Cesium Earth owns its Viewer, camera, registry, selection and attribution.
God's Eye supplies pinned feature modules, never its full app, Viewer or product chrome.
The two system models remain intact: Scope → Engine → Filter → Scene → Object → Detail → Assets;
Ingestion → Normalization → Storage → Cache → API → Client Rendering.

Default hierarchy: scene → selected object when present → Tonight/Observe → controls →
secondary source/diagnostic details. No public protocol, artifact or generation badges.

## 3. Geometry

All values are CSS px. Opaque surfaces keep text legible over bright imagery.

| Element | 1440 × 900 desktop | 1920 × 1080 large | 1024 × 768 tablet |
| --- | --- | --- | --- |
| Product header | 56 high, x0/y0/full width | Same | Same; identity shortens before tools wrap |
| Renderer | x0/y56, 1440 × 844 | x0/y56, 1920 × 1024 | x0/y56, 1024 × 712 |
| Mode switch | 184 × 44, centered, y6 | Same fixed width | Same |
| Rail | x16/y72, width52; 44 targets + 4 gaps | Same | Same |
| Layer panel | x80/y72, width288; max560 high | Same | Same; mutually exclusive with right context |
| Context | right16/y72, width320; max560 high | Same fixed maximum | right16/y72, width320; max496 high |
| Object dock | centered, width720, bottom84, 72 collapsed / 224 expanded | Same fixed width | width624, same heights/bottom |
| Time surface | centered, width720, height48, bottom24 | Same | width624 |
| Edge reveal | 16 wide/high inside each stage edge | Same | Same |
| Attribution | bottom4/left16, legal credit slot; own hit target | Same | Same |

Panel padding16; internal spacing8/12/16/24; rail-to-panel gap12; drawer-to-time gap12.
Panel paragraph max width288; focused route prose max640. Width gains go to the scene.
Only one right ContextSurface exists. Details expansion retracts that context to avoid
repeating the same data. At desktop, Layers and context may coexist only after explicit
opening; tablet permits one side panel. Scroll panel content within its height cap,
never the stage. At heights below680 use max-height `stage height - 176` and scroll.

## 4. Mobile composition

Below768 width use mobile, not compressed desktop. At390 × 844: header56; shortened
ORAS / Astronomy Hub identity; utility menu only at right. Mode switch184 × 44 centered
at y68, floated over scene. Layers launcher left16 and context launcher right16 are
44 high, bottom100. Time bar left16/right16, height48, bottom40 (34 safe area +6).
No permanent right panel, left rail or desktop object dock.

One sheet total: Layers, Tonight, Observe, Selection, Time or Diagnostics replaces the
previous sheet. Selection/context snaps **96 / 360 / 640 high** including34 bottom safe
area; Layers uses440. Clamp largest snap to `viewport height - 124`. At360 snap, frame
y484 leaves a substantial scene. Expanded content scrolls. Header/time are not nested
inside the scroll area. Sheet radius16 at top; handle36 × 4 in a44-high button target.
A collapsed selection sheet shows title and Expand; mid snap shows facts/actions.
Time stays available through the sheet's Time action; it does not sit behind the sheet.

Swipe handle downward >80px or velocity >0.5px/ms moves one snap down; below96 closes
context or collapses selection to its launcher without deselecting. Swipe upward advances
one snap. Explicit Expand/Collapse/Close buttons perform every gesture action. Swiping
content scrolls, never drags the sheet. Only a deliberate Deselect clears identity.
Safe areas use environment insets, with reference values top0/bottom34; landscape and
short windows use the same clamps. Touch targets at least44 × 44. Credits relocate to
scene top124 when a sheet covers the bottom. Credits remain readable and expandable.

## 5. Component behavior contract

Defaults describe ready, unselected Sky. Shared rules: Escape closes the topmost temporary
surface and restores its trigger; outside click closes temporary context only if it
is not handling a drag or selection gesture. Do not deselect merely by dismissing details.
Tab order follows visual reading order; focus never disappears with chrome. Session
rules in section17 apply to every “session” cell below.

| Component | Responsibility, position and default | Collapsed / expanded, interaction and keyboard | Mobile / dismissal / persistence |
| --- | --- | --- | --- |
| WorkspaceShell | Full-window layout, lifecycle and intent boundary | Coordinates surfaces; no rendered scene children inside Hub | Mobile composition; never dismissed; bounded session intent |
| ProductHeader | 56-high identity and tools; visible | ORAS identity, Astronomy Hub, modes, Tonight, Observe, Pin controls, Immersive, More; no five-tab nav | Identity + More, modes below; hides only by chrome state; no own persistence |
| RendererStage | All area below header; primary visual | Ready/checking/switching/starting/unavailable; attribution remains inside visible stage | Full mobile scene; pointer operations renderer-owned; no persisted readiness |
| ModeSwitcher | Center184 × 44; Sky active on `/` | Two90-wide segments with4 gap; selected hover fill/accent icon; focus ring. Arrow keys move roving focus, Enter/Space activates. Pending shows tiny progress + name | Same size; busy rejects duplicate activation; latest requested mode supersedes pending safely; URL persists mode |
| LayerRail | Earth left52; collapsed labels | 20 icons,44 targets,4 gaps; active surface; tooltip after500ms or focus, closes on Escape. Layers, Return to ORAS, Navigation | Layers button; not available in Sky until controls qualified; rail state transient |
| LayerPanel | Floating288, closed | Toggle four real layers; switches have44 target around36 × 22 indicator; loading/status in row; labels do not become switches |440 sheet; Escape/Close returns to Layers; enable choices session |
| ContextSurface | Right320; default Tonight summary in Sky, closed in Earth | Tonight/Observe/Selection tabs44 high, roving arrows + Enter; Selection tab appears only with selection. One shared body | One context sheet; explicit opening inhibits hide; context tab session |
| TonightSurface | Tonight summary, source-backed darkness/Moon/one target | Explicit Tonight adds second target, conditions if available and focused-route link; panel scroll at560 |360 sheet,640 expanded; follows context dismissal; date follows night contract |
| ObserveSurface | Closed; compact target rows | Name/type, altitude and azimuth with time/context; row selects, separate44 Focus action; categories are data-driven |360/640 sheet; focused-route link; no independent astronomy state |
| SelectionSurface | On valid selection, right context +72 dock | Entity-specific summary; new selection reveals. User may inspect Tonight without deselecting; next selection makes Selection primary | Selection sheet opens360; Close hides details, Deselect clears; restore only supported identity |
| SelectionDrawer | Center720 × 72; absent without object | Title/subtype, Focus, Details or Track, Deselect; Details expands224 and retracts right context; handle button toggles;180ms | Replaced by selection sheet; Escape collapses224 first; expansion transient |
| TimeSurface | Center720 × 48; Sky Live by default | Change time opens320 × 248 popover above bar; local datetime + timezone, Now and Apply; ±1h actions44 each. Enter Apply, Escape cancel |360 sheet; requested time persists, popover never does |
| ImmersiveController | Owns chrome machine, pin and reveal zones | Header Pin global; Immersive explicit; Show controls remains44 target | More menu Pin/Immersive; tap reveal; pin session, immersive transient |
| LoadingState | Center320 × 144 only until interaction possible | Text and restrained progress, no fake percent; layer/imagery progress local after Viewer ready | Width `min(320, width-32)`; status politely announced; never persisted |
| ErrorState | Center360 × 184 on unavailable renderer | Calm message, Retry current mode, Open other mode; retain requested intent | Width `width-32`; buttons44; no auto-dismiss or persistence |
| ProviderState | Affected row/context only | Text state + icon + Retry; source details on demand; provider absence does not block whole renderer | Sheet row; provider state refreshed every mount, never restored |
| DiagnosticsSurface | More → Diagnostics; closed | Right480 max640 high; versions, source/artifact, bridge, provider freshness/status; Copy diagnostics redacts tokens/URLs with secrets |640 sheet; keyboard-scoped modal on mobile, close restores More; no persistence |

Mode switch active indicator uses fill plus text/icon, not color alone. Hover lasts only
while hovered; focus ring2px accent with2px dark offset; unavailable has text and icon,
not opacity alone. A temporary capability handshake disables only dependent actions;
unsupported capabilities are omitted, not permanently disabled fantasy controls.

## 6. Tonight and Observe integration

Reuse `useTonightQuery`, `tonight.v1`, `nightClock`, `normalizeTonight`, `identityKey`,
`formatNightTime`, `duration` and `forecastAtPeak`; extract row presentation from the
current `TonightView`/TargetCard/TargetGroup. Do not reproduce calculations from cards.
`HomePage` TonightSummary supplies reusable derivation, not its dashboard framing.
Reuse `useObserveSkyQuery`, `normalizeObservePayload`, `categoriesForObjects`,
`skyEngineUrlForObject`, `getObserveContext`, `getObservePath`, `formatObserveTime` and
ObserveView data flow. Existing hooks retain cache keys, stale/refetch policies and errors.

Tonight order: date/timezone → astronomical darkness interval/duration → Moon context at
its stated time → opportunities → relevant forecast with source/time → full plan link.
“Above20° in darkness” is a planning heuristic, not physical detectability. Distinguish
civil/nautical/astronomical twilight by labels when expanded; no front-end ephemeris.
Weather absence does not erase independent darkness/target facts. No seeing/transparency
score, fabricated certainty or hardware-specific recommendation. Unknown facts are omitted
or “Unavailable”; never substituted with zeros.

Observe order: observer/time → available category filters → compact rows ordered by API
ranking → “Above the geometric horizon. Visibility does not guarantee detectability.”
Focus sends the exact canonical identity, preserving `catalog`, `source_id`, `model`,
`ra`, `dec`; large IDs remain strings. Row selection never implies a camera lock succeeded.
Failed focus keeps selection and gives “Couldn't center this object” with Retry.
Tonight “Show at peak” changes time only after explicit action and acknowledged application.

Reference facts were read from local APIs on2026-10-02: Tonight date2026-10-02, ORAS,
America/New_York; darkness20:30EDT Oct2–05:45EDT Oct3,555.3minutes; Moon54% at01:08EDT;
M31 peak01:13EDT Oct3,89.947° altitude,69.738° Moon separation. Observe fixed time
2026-10-03T02:00:00Z: Deneb80.521°/298.642°, North America Nebula83.714°/303.136°,
Vega57.342°/280.015°. Rounded labels are presentation only. Scene captures are visual
references, not proof of camera/time synchronization with the panel snapshot.

## 7. Selection and entity-specific detail

Sky DSO: catalog/name/class, supplied coordinates, magnitude if available, size if supplied,
alt/az at acknowledged time, planning peak with explicit date, Focus, Show at peak,
Copy link. Star: spectral/type facts only if sourced. Planet/Moon: validated ephemeris
and phase only if supplied. Satellite: model/time/freshness before position. Omit missing
fields. Never call a catalog image a current view.

Earth satellite: source name/NORAD string, propagation timestamp, TLE epoch/age, modeled
position and altitude reference if available; Focus, Track/Stop tracking, Source details.
Aircraft: callsign/identity if available, position age, source time, altitude type/unit,
speed/heading only from payload; Focus; no historical playback/trajectory promise.
ORAS: canonical site coordinates/elevation, Return to ORAS, Tonight and Observe.
Weather: current modeled conditions, valid time, source, units; never an observation claim.

Selection drawer owns primary actions; right Selection context owns details. Expanded
drawer replaces those details, rather than duplicating two cards. On mobile the one sheet
owns both. Deselect cancels tracking, clears selection and restores the prior context.
Provider loss retains a labeled unavailable selection; Focus/Track unavailable, Deselect
remains. Removing its layer clears selection and stops tracking with a polite announcement.
A stale entity cannot continue to appear as live.

## 8. Time semantics

Sky default is **Live**. Manual Apply shows **Requested** until engine acknowledgment;
then the label is **Set time** with local date/time/timezone, and effective time is that
acknowledged value. Failure preserves the previous effective display and says “Time wasn't
applied.” Now returns to Live. No continuously firing slider; commit on release/Apply.
Timeline is a simple selected interval in the time popover, not a new simulation engine.

Earth main badge is **Live** with “Earth layers use live source time.” Time details lists
Requested scene time, Effective scene time and per-layer source time separately. Current
protocol acceptance of a globe clock does not make satellites, aircraft or weather
historical. On Sky→Earth, retain requested intent but explain “These layers remain live.”
Never globally label different provider timestamps as one synchronized effective instant.
Unavailable timestamps say “Source time unavailable.” No fake running historical aircraft.

## 9. Chrome, pin and immersive state machine

State priority, highest first: KEYBOARD_FOCUS → MOBILE_SHEET_OPEN → PANEL_OPEN → explicit immersive suppression →
PINNED → ACTIVE_EXPLORATION → AUTO_HIDDEN → NORMAL. These are
exclusive effective states derived from orthogonal focused/open/pinned/immersive flags.
Pin is one global control, never a panel-specific setting; filled pin + “Controls pinned,”
`aria-pressed=true`. It persists across modes/routes for the tab session. Explicit
Immersive temporarily overrides pin while remembering it; exiting restores pin preference.

| State/event | Exact behavior |
| --- | --- |
| NORMAL | Header, applicable rail, summary, time and selection shown; arm4s idle timer. Default summary is not an explicitly opened panel. |
| Idle4s | If no focus/open/pin, AUTO_HIDDEN; fade180ms, translate8px toward closest edge; pointer events and tab stops disabled only after focus moved safely. |
| Renderer pointerdown/drag or wheel | ACTIVE_EXPLORATION; collapse transient default summary. After300ms sustained input hide eligible chrome. An explicitly opened panel stays until deliberately closed; never steal its focus. |
| Drag end | Stay hidden; do not reveal on every move. Ordinary scene movement resets idle but does not reveal hidden chrome. |
| Edge reveal | Inside16px stage edge, dwell120ms without active drag → NORMAL; grace1000ms before hide can rearm. No hover reveal on touch. |
| Show controls / Escape / Tab | Reveal immediately. Tab reveals before moving focus to first visible control. Show controls keeps stable44 target near top-left; at least mode name + credits remain. |
| PINNED | Suppress idle/exploration hide; layer/context dismiss rules still apply. Unpin restarts4s timer. |
| PANEL_OPEN | Explicit Layers, Tonight, Observe, Details, Time or Diagnostics inhibits hide. Close restores prior state; drag over panel never reaches renderer. |
| KEYBOARD_FOCUS | Focus within any Hub control inhibits hide. Leaving controls restarts4s; focus ring never animates away. |
| MOBILE_SHEET_OPEN | One sheet visible, no auto-hide of sheet or its controls; scene remains usable above sheet. |
| New selection | Reveal and open Selection; if explicit immersive, exit it; keep prior context for later restoration. |
| Explicit Immersive | Close temporary panels, expand stage to y0, hide header/rail/context/dock/time; never destroy renderer. Credits and Show controls remain. |
| Escape precedence | Close popover/modal → collapse expanded drawer/sheet → close temporary panel → exit immersive/reveal; one step per key. Never silently deselect. |

Use180ms `cubic-bezier(.2,0,0,1)` panel/sheet transitions;120ms hover/focus color;
mode progress crossfade120ms after old renderer disposed. Reduced motion:0ms UI motion,
no camera flight or tracking easing, no animated loader sweep/pulse. Static progress text
still conveys activity. Auto-hide never blocks cancellation of camera motion.

## 10. Sky and double-chrome boundary

Embedded SWE has only qualified renderer-specific controls not owned by the Hub.
Hide duplicate product/navigation/selection/time chrome only through a qualified generic
presentation interface; never query or mutate iframe DOM from React. Do not remove
unreplaced functional tools. Standalone `/oras-sky-engine/` keeps full functionality.

The current bridge does not expose safe Sky layer controls. Therefore Stars, DSOs,
Planets, Satellites, Constellations, Labels, Grids, Atmosphere, Landscape and Surveys are
**vocabulary reserved for future qualified capabilities**, absent from the active rail.
No disabled controls imply they work. Do not modify SWE science or camera algorithms.
Source/API identities feed supported native selection/focus. Selection and centered-camera
acceptance remain separate proofs. DSS remains safe survey fallback; no DESI promotion.
A captured landscape is not the measured ORAS horizon.

## 11. Earth visual foundation and source hierarchy

Earth must communicate detailed geography, shape, atmosphere, scale and real data.
The reference uses an archived NASA Blue Marble image to communicate global composition;
it is not live weather, terrain geometry, provider acceptance or a photorealistic 3D claim.
The configured local detail target is terrain with restrained labels and real buildings
where coverage exists. Never substitute painted terrain for tested elevation.

| Priority/state | Locked product choice | Presentation and release gate |
| --- | --- | --- |
| Best configured | Cesium ion configured imagery + Cesium World Terrain; optional OSM Buildings where licensed/available. Photorealistic3D only with separately configured licensed provider/coverage. | “Detailed imagery and terrain”; retain true credit display; each provider independently qualified for access, coverage, CORS, cost and mobile performance before enabled. No assumed existing account/configuration. |
| Best currently qualified keyless fallback | Existing local NaturalEarthII imagery + ellipsoid | “Standard imagery · terrain unavailable” in Sources & display quality. Intentional globe framing, atmosphere, sun shading; no buildings. Existing fallback baseline only; this design does not requalify it. |
| Keyless upgrade candidate | NASA GIBS `BlueMarble_ShadedRelief_Bathymetry` | Do not promote until specific endpoint/matrix/coverage/CORS/terms/performance are qualified. Not called an already qualified high-detail fallback. |
| Last resort | Shaded ellipsoid + site marker and legal data layers | Nonblocking “Imagery unavailable” + Retry imagery; no terrain/3D claim; functional but degraded. Never final visual acceptance for configured experience. |

Configured3D failure falls back through imagery/terrain independently, not a blank globe.
Terrain resolving uses ellipsoid temporarily with “Terrain loading”; camera stays above
safe provisional height and refits once, only if user has not moved. Imagery resolving
keeps coarse tiles; no global blocking loader after Viewer ready. Terrain unavailable
retains imagery; buildings unavailable retains terrain. Credits are always visible as a
compact source line with44-target expanded attribution sheet and required provider marks;
never hidden by immersive or a mobile sheet. The asset names here do not authorize new
accounts, purchases or provider calls in this design-only task.

No secrets in browser bundles, logs, URLs or copied diagnostics. Any browser-visible Cesium
access token must be a deliberately publishable, least-privilege, asset-scoped, origin-
restricted token, never an account/server secret. Server credentials remain behind the
approved FastAPI boundary where provider terms allow it. Same-origin is not a trust boundary.
Provider conditions must be checked against the actual account before implementation.
Sources: [Cesium setup](https://cesium.com/learn/cesiumjs-learn/cesiumjs-quickstart/),
[token controls](https://cesium.com/learn/ion/cesium-ion-access-tokens/),
[GIBS access](https://nasa-gibs.github.io/gibs-api-docs/access-basics/).

Enable restrained physically grounded atmosphere and globe sun lighting using effective
scene time. Do not darken labels with the night side. Fog only at terrain/horizon distances,
never a cinematic veil; renderer defaults first, tune to preserve terrain contrast.
Space background near-black `#03070B`, no decorative star wallpaper or fake spacecraft.
Low-intensity native star background is allowed only when already source-backed.
Directional hill/terrain shading supplies depth; no neon rim or glow around entities.
Labels are neutral11/14 with opaque dark halo, collision-aware and scale limited.
Weather today is one modeled current-state point at observer, not a cloud raster.

## 12. Earth camera contract

Earth initial entry: north-up full globe, North America/ORAS hemisphere facing viewer;
fit globe bounding sphere in available stage with10% margin (nominal range22,000km from
Earth center). Keep full globe visible after header; mobile deliberately crops globe edges
for a larger geographic view. Do not auto-fly on provider completion or every layer refresh.
Mode return within the same mounted Earth session preserves camera; after disposal restore
only an adapter-validated bounded Earth camera bookmark, never raw renderer internals.
If no qualified bookmark support exists, use initial entry.

Return to ORAS: canonical lat41.321903/lon−79.585394/elevation432.816m.
With qualified terrain target range8km from site, heading0°, pitch−45°; engine computes
terrain-relative safe position. With ellipsoid fallback range40km, pitch−60°, clearly no
terrain claim. Flight900ms maximum, user input interrupts immediately; reduced motion0ms.

Single entity click selects without moving. Focus is explicit. Aircraft Focus uses12km
range, pitch−35°, no tracking. Satellite Focus uses750km relative range, pitch−30°, clamps
for altitude/occlusion; Track is separate and keeps target in frame without rapid roll.
Selecting another object, renderer pointerdown/wheel, Deselect or Stop tracking cancels
tracking immediately. Never chase unavailable/stale positions. Double-click scene zooms
one step around clicked valid globe position; double-click entity selects only, no surprise
flight. Double-click empty space does nothing. Keyboard +/− works only with scene focus.

Zoom100m above qualified terrain to30,000km above ellipsoid; never below surface. Each
wheel notch changes range by factor1.18, normalize device delta, clamp each event to25%
range change. InertiaZoom0.35, InertiaSpin0.25, translate0.25 are implementation targets,
subject to deterministic camera regression (do not alter native SWE). Near ground: collision
and terrain clearance required, tilt clamped−89°..−10°, no tunneling while terrain resolves.
No continuous orbit animation. Camera smoothing never overrides new user input.

## 13. Earth layers, entity style and ORAS

Four registry layers only: ORAS on, Satellites on, Aircraft off, Current weather off by
default. Enabling starts only that adapter; disabling stops work and clears its selection.
Source status row distinguishes Off, Loading, Live, Stale, Unavailable. Timestamp and source
must justify Live; satellite positions are modeled propagation, not measurements. Current
adapters have live-only semantics. Existing source bounds/freshness policies remain intact:
station subset, TLE refresh/age policy, regional aircraft normalization and modeled weather.
No unrestricted global aircraft feed or all-satellite flood is implied.

| Entity | Global / regional / near | Selected / unavailable |
| --- | --- | --- |
| ORAS |8px landmark ring +4px center; one label “ORAS” after stable globe entry; never a giant pin |12px ring,44 hit target, selection color; context shows name and canonical coordinates/elevation. Return to ORAS available in rail and site context; one visible action per layout. |
| Satellites |6px points above20,000km camera height;14px consistent satellite glyph below; no labels except selected/hovered |18px glyph +24px selection ring; tracked adds small textual “Tracking” beside selection, not animation. Hide under globe; no invented orbit lines. |
| Aircraft | Omit below provider region availability; at>2,000km show quiet regional availability context, not every icon;14px heading glyph below |16px glyph/ring. Labels only below200km and max12 by priority/collision; selected always labeled. Stale loses Live and tracking/focus; expired positions removed, status retained. |
| Weather | One16px icon/point at observer, no continuous labels | Context presents valid-time modeled conditions; no cloud animation/raster masquerading as observation. |

All visual glyphs have44px invisible hit regions without occluding neighboring labels;
nearest valid hit wins. Selection color does not replace shape/text distinction. ORAS
Tonight/Observe actions switch context using canonical observer without leaving Earth.
The marker and generic layer rows can later accommodate more registry types without
exposing future layers now. Satellite position in the reference is a **style specimen**,
not a propagated location. No numerical flight data is fabricated for appearance.

## 14. Readiness, errors and diagnostics

| Internal readiness | Public presentation / transition |
| --- | --- |
| WORKSPACE_READY | Header, active mode and stable background immediately; no flash of dashboard |
| RUNTIME_CHECKING | “Checking Sky…” / “Checking Earth…” in small center state; existing bounded probe, no made-up completion percentage |
| RENDERER_STARTING | “Opening Sky/Earth” + “Preparing your view…”; one active renderer; old frame fully disposed first |
| VIEWER_READY | Remove blocking state as soon as navigation works |
| IMAGERY_RESOLVING | “Imagery loading” in source-quality control; coarse image remains |
| TERRAIN_RESOLVING | “Terrain loading”; independent of imagery and overlays |
| LAYER_LOADING | Spinner/static reduced-motion symbol in that row only |

| Failure | Exact public copy / action |
| --- | --- |
| Renderer unavailable | “Earth is unavailable. We couldn't open this view. Try again, or continue exploring Sky.” Retry Earth / Open Sky; symmetric for Sky |
| Runtime mismatch | “This view needs an update. Reload to try the latest version.” Reload / Open other mode; versions only in Diagnostics |
| Network | “Connection interrupted. Your view is still available.” Retry affected data; keep independent facts |
| Aircraft/provider unavailable | “Aircraft unavailable. The position source isn't responding. Other Earth layers are still available.” Retry aircraft |
| Configuration absent | “Detailed terrain requires a configured source. Standard imagery is available.” Sources & display quality; no account secrets exposed |
| Layer failure | “Couldn't load satellites.” Retry satellites; retain other enabled layers |
| No valid target | “No targets available for this time.” Change time / Return to Live; never populate fake objects |

Retry is explicit and bounded by existing adapter backoff; suppress duplicate in-flight
requests. Diagnostics is More → Diagnostics; it contains renderer/version/source/artifact,
bridge negotiation, freshness and degraded capability, grouped in selectable text. No
customer identifiers, tokens or raw credentialed URLs. “Copy diagnostics” emits sanitized
technical context only. Opening Diagnostics does not mount a second renderer.

## 15. Tokens, icons and production copy

IBM Plex Sans, weights400/500/600; self-host in later implementation under OFL. Current
production Arial is not the target. Design embeds licensed fonts for reproducibility.
No suitable coherent icon library was found in current dependencies: select **Lucide**
for later implementation,20px standard,16px metadata,24px emphasis,1.6px stroke. No emoji.
No dependency installed by this task. See [asset notices](UNIFIED_WORKSPACE_ASSET_NOTICES.md).

| Semantic color | Value | Use |
| --- | --- | --- |
| background / stage | `#070C12` / `#03070B` | Shell / space |
| floating / elevated / hover | `#111B27` / `#182535` / `#233447` | Panels / active surface / hover |
| border / divider | `#72859C` / `#2A3A4D` | Essential control boundary / decorative division |
| primary / secondary / muted text | `#F1F5F9` / `#B9C7D7` / `#96A8BC` | Hierarchy; no low-opacity metadata |
| active accent / selection | `#9BE4F2` / `#B7AEFA` | Controls / selected entity |
| live / warning / error / unavailable | `#A4DCB9` / `#EDCA89` / `#F1AAA4` / `#ABB6C3` | With icon and text |
| accent-button ink | `#09232D` | Dark text on accent |

Type sizes/line-heights: base14/20; metadata12/16 (legal reference10/14, expandable);
controls13/18 medium; panel18/24 medium; object24/30 medium; number28/34 medium;
product16/22 medium; eyebrow11/16,0.08em spacing. Use tabular numerals for times/facts.
Spacing4/8/12/16/24/32/48. Radius6 controls,8 tabs,12 floating panels,16 mobile sheets.
Shadow `0 8px 24px #00000040`; no stacked glows. Panels opaque; blur0 by default. Only
immersive reveal pill may use8px blur with opaque fallback. Motion in section9.

Locked labels: Sky, Earth, Tonight, Observe, Layers, Live, Set time, Requested, Effective,
Return to ORAS, Immersive, Show controls, Pin controls, Controls pinned, Selected, Focus,
Details, Track, Stop tracking, Deselect, Unavailable, Sources & display quality, Diagnostics.
“Provider required” is secondary source configuration copy, not a global product warning.
Use full local timezone/date on ambiguous times; coordinate precision follows source.

## 16. Accessibility

Normal text contrast≥4.5:1, large text≥3:1; essential icons/borders/focus≥3:1 against
adjacent surface. Divider is decorative, never sole boundary. Controls at least44 × 44;
hover tooltips never required to use a control. Focus2px with2px offset remains visible.
Mode and context tabs use roving arrows + Home/End and Enter/Space activation. Rail uses
Tab order, no invented navigation key interception. Dialogs trap focus only when modal;
nonmodal desktop panels allow normal Tab back to scene. Escape returns to invoking control.
Mobile expanded Earth sheets are modal to other chrome but leave an explicit Collapse action;
background Earth scene input is disabled while fully expanded, enabled above mid/collapsed sheet.
The 2026-10-05 owner correction makes Sky sheets nonmodal at every snap: the exposed
Sky canvas, native controls and attribution remain interactive. While a Sky sheet is
open, its native search is suppressed and its toolbar and credits share the visible
row below the mode switcher; search returns when the sheet closes. Native Sky
dialogs temporarily suspend Hub overlays and restore the same sheet snap on close.
Their Sky-only presentation reports are bound to origin, active frame, nonce,
generation and increasing sequence; shared frozen Earth protocol inputs stay unchanged.

Landmarks: header/banner, main “Sky workspace”/“Earth workspace”, named Layers/Context/
Selected object regions, time group. Frame has meaningful title. Announce new selection
once politely: name, type. Announce renderer ready/error once, not on every frame/provider
poll. No live announcements of continuously ticking time or satellite position. Include
text alternatives for source status, and keyboard navigation for list-selected entities.
Respect reduced motion, browser zoom200% and text resize. At zoom use responsive breakpoint,
never clip controls into overlapping columns. Runtime browser/assistive-technology proof is
required in ORA-7; the static reference does not claim that proof.

## 17. URLs, history and session state

| Route/action | Contract |
| --- | --- |
| `/` | Workspace Sky regardless of a saved last mode; Live unless explicit valid time intent supplied |
| `/sky-engine` | Same workspace, explicit Sky |
| `/earth` | Same workspace, explicit Earth |
| `/observe`, `/tonight` | Preserved focused/shareable workflows; link back to workspace with supported object/time intent |
| `/oras-sky-engine/`, `/earth-runtime/` | Preserved direct runtimes; standalone behavior not replaced |
| Mode change | Push canonical mode route exactly once; Back/Forward restores route-driven mode via serial lifecycle |
| Panel/tab/drawer open/close | Local state only, no history entry |
| Time/object share | Preserve existing validated URL contract and exact identities; Copy link serializes supported values only; do not invent universal cross-engine links |
| Applying time/selection in workspace | Replace supported query intent without remounting the renderer; bridge acknowledgment required. Existing RuntimeHost query-remount behavior must be corrected in implementation. |

Explicit URL wins over session. Session storage holds bounded UI preferences: global pin,
active context, Earth enabled layer IDs, supported time/observer/canonical selection intent.
Mode is in URL, not a remembered override of `/`. Preserve existing bounded
`oras.runtime.intent.v1` semantics; introduce a versioned UI-only key for pin/context/layer
preferences with a whitelist and small length cap. No raw entities, provider payloads,
credentials, entire camera objects or scientific caches in UI persistence.
Selections restore only after matching renderer/capability/identity validation; otherwise
clear with a restrained notice. Earth ephemeral aircraft/satellite selection expires on
provider refresh if identity no longer exists. Sky selection remains canonical, but availability
must be re-established. Do not persist immersive, panel expansion, sheet snap, focus, errors,
loading, stale provider statuses or tracking. Refresh re-probes providers; session preference
for an enabled layer never implies loaded/live. Tab closure clears these UI preferences.

## 18. Implementation module map

Proposed files below are handoff targets only, **not created in this task**. Shared directory:
`frontend/src/features/workspace/`. Keep hooks/models in their current feature directories.

| Module/component | Inputs / owned state | Data/bridge source and reuse | Forms |
| --- | --- | --- | --- |
| `WorkspaceShell.tsx` | route mode, observer/time intent; surface coordinator | Adapt OrasAppShell + RuntimeHost/productState; preserve serial queue | Desktop/tablet stage; mobile sheets |
| `ProductHeader.tsx` | mode, pending, context, pin, immersive callbacks | Reuse ORAS identity; replace five equal nav items | Full / compact |
| `RendererStage.tsx` | runtime session, status, onInteraction | RuntimeHost + runtimeProbeService; owns no renderer internals | Full viewport |
| `ModeSwitcher.tsx` | value, pending, onChange | Route-driven intent; no runtime data | Shared184 × 44 |
| `LayerRail.tsx`, `LayerPanel.tsx` | capabilities, layer snapshots, toggle callbacks | Earth list/status/set enabled adapter; no fabricated Sky registry | Rail/panel / launcher/sheet |
| `ContextSurface.tsx` | active tab, selection, open, onClose | workspace UI state; one slot | Right panel / context sheet |
| `TonightSurface.tsx` | date, observer context, onSelect/onFocus | Existing tonight hook, normalizer, clock/model; extracted TargetRow | Summary/expanded / sheet |
| `ObserveSurface.tsx` | query context, category, onSelect/onFocus | Existing Observe hook/model/API ranking + exact-link builder | Rows / sheet |
| `SelectionSurface.tsx` | discriminated entity detail, source times, capability actions | Native selection adapter event; never generic raw renderer object | Context / sheet |
| `SelectionDrawer.tsx` | selection, expanded, onFocus/onClear/onExpand | Same selection state, no second fetch/calculation |72/224 dock / BottomSheet |
| `TimeSurface.tsx` | requested/effective/live status, onApply/onNow | Existing time intent + validated ack; per-layer statuses |48bar/popover / sheet |
| `ImmersiveController.ts` | input/focus/open/pin flags; timers | Generic runtime interaction events + document focus/visibility | Shared state machine |
| `LoadingState.tsx`, `ErrorState.tsx` | discriminated readiness/failure, retry/switch | Probe/session status; no URL/version text in primary UI | Center state |
| `ProviderState.tsx` | status, time, source, retry | Adapter normalized status, not “fetch succeeded” inference | Row / sheet row |
| `DiagnosticsSurface.tsx` | sanitized session/provider metadata | Probe, lock/artifact provenance, adapter diagnostics |480panel / sheet |
| `BottomSheet.tsx` | name, snap, modal, onSnap/onClose | UI-only behavior, focus restoration, safe area | Mobile only |
| `workspaceUiState.ts` | pin/context/layers/open/snap | Small versioned session preference; productState keeps canonical intent | No engine ownership |
| `workspaceRuntimeAdapter.ts` | validated capabilities/events/commands | Existing protocol module + separately qualified additions | No renderer DOM access |

Keep `TargetRow`, `ContextTabs`, `IconButton`, `PrimaryButton`, `SecondaryButton`,
`StatusLabel`, `SheetHandle` as small reusable presentation primitives. Never migrate
Tonight/Observe science or provider policies into WorkspaceShell. Current focused routes
remain feature-owned and consume the same model outputs.

## 19. Required bridge additions and capability gates

Existing protocol1.0 exposes version/capabilities, destroy, time intent and observer intent.
It does **not** expose all actions drawn in this target. Negotiate versioned optional
capabilities; extend strict validators/tests. Preserve MessageChannel origin/nonce/session/
generation checks, bounded payloads, timeout, destroy acknowledgment and serial lifetime.
Never treat untrusted event content as authorization to execute arbitrary commands.

| Proposed capability | Minimum surface | Required by / failure behavior |
| --- | --- | --- |
| `presentation` | Set embedded presentation; report supported suppression and retained native tools | One header/selection/time surface; standalone defaults unchanged. Unsupported stays controlled qualification blocker, not DOM hacking. |
| `interactionEvents` | bounded begin/end navigation + keyboard-focus ownership events | Auto-hide and tracking cancellation across frame; timeout restores controls; no raw mouse stream needed |
| `selection` | canonical selection event/details, select canonical object, clear, focus; explicit success/failure and camera completion | Target rows/drawer. Data selection and camera proof separate. Engine materializes and centers. |
| Earth `layers` | listLayers, layerStatus event, setLayerEnabled(id,bool) with ack | Four real layers; unsupported controls omitted |
| Earth `providers` | normalized status/source/effective timestamp/configured quality; retry allowed provider/layer | Truthful partial failure; sanitized metadata only |
| Earth `navigation` | returnToOras, focusSelection, start/stop tracking, navigation preset | ORAS/focus/track; no Hub camera math. Tracking only satellite adapter capability. |
| Time acknowledgment refinement | requested/effective scene time plus applied/error; per-layer effective time separate | Truthful Sky time and Earth live semantics |

API spelling is a proposed minimal design contract, not a claim that these protocol methods
exist. Implementer may map to equivalent typed commands without changing UX. Prefer generic
upstream presentation/selection/interaction extension hooks; investigate existing SWE
extension points first. Any unavoidable SWE patch needs a tiny documented patch queue and
explicit architecture exception per repository rules. Sky layer controls, cross-engine
selection/handoff, historical providers and arbitrary camera-state serialization are deferred.

## 20. Screenshot acceptance matrix

The editable visual reference supplies all rows; the final browser review concerns design
composition only. Production acceptance must reproduce rows with real renderers/data and
include behavior checks, exact-link camera proof, keyboard/touch and console/network evidence.

| ID | Size | Required visual state | Acceptance |
| --- | --- | --- | --- |
| D01 |1440 × 900|Sky default|Single header, dominant scene, compact Tonight, time|
| D02 |1440 × 900|Tonight open|Source-backed hierarchy, bounded scroll, full-plan link|
| D03 |1440 × 900|Observe open|Compact rows, explicit observer/time and geometric caveat|
| D04 |1440 × 900|Selected M31|224drawer; right context retracted; no duplicate details|
| D05 |1440 × 900|Earth default|Geography/depth, quiet controls, no debug UI|
| D06 |1440 × 900|Earth Layers|Four real controls; floating288panel|
| D07 |1440 × 900|Earth satellite selected|Entity-specific context +72dock, explicit Track|
| D08 |1440 × 900|Provider unavailable|Layer-local error; working Earth remains|
| D09 |1920 × 1080|Sky immersive|Full viewport, reveal + credits only|
| D10 |1920 × 1080|Earth immersive|Globe gains space; no enlarged panels|
| T11 |1024 × 768|Sky tablet|320right panel,624time, no permanent columns|
| T12 |1024 × 768|Earth tablet|Shared identity/controls; one panel at a time|
| M13 |390 × 844|Sky mobile|Floating modes, context launcher, compact time|
| M14 |390 × 844|Sky selection|360sheet, scene above, explicit actions|
| M15 |390 × 844|Earth mobile|Intentional globe crop, layers launcher|
| M16 |390 × 844|Earth Layers|440sheet; one sheet; credits remain|
| M17 |390 × 844|Earth selection|Satellite facts/semantics, no fake positions|
| S18 |1440 × 900|Loading|Bounded center progress until Viewer ready|
| S19 |1440 × 900|Unavailable|Calm retry + alternate mode|
| S20 |1440 × 900|Pinned|Global pin visual state, no auto-hide|
| S21 |1440 × 900|Auto-hidden|Reveal affordance + source credit, no lost focus|

Additional implementation evidence must show configured terrain/buildings and standard-
imagery fallback at ORAS regional scale, photorealistic coverage if enabled, reduced motion,
200% zoom, all focus states and maximum sheet snap. The current reference does not contain
an invented terrain/photorealistic result. Those are provider-dependent validation gaps,
not permission to redesign geometry or claim real3D from the NASA composite.

## 21. Implementation order and non-negotiable acceptance

1. Obtain owner design approval; only then start ORA-7 in a separate conversation/branch.
2. Qualify minimal presentation, selection and interaction bridges; preserve standalone SWE.
3. Build shell/tokens/modes with serial lifecycle and truthful loading/error behavior.
4. Integrate shared Tonight/Observe models and selection/time surfaces; preserve focused routes.
5. Implement Earth layer/provider/navigation adapters and designed camera behavior.
6. Qualify configured Earth visual sources and fallback chain; enforce attribution/security.
7. Complete mobile sheets, keyboard/reduced-motion/focus/session/history behavior.
8. Run Docker production-class, browser, touch and exact-link validation against matrix;
   report configured/keyless/degraded states separately before claiming implementation done.

Reject fixed sidebars, card walls, double chrome, arbitrary icon families, stretched panels,
a blank default Earth demo, giant entity labels, prominent diagnostics, invented astronomy,
constant auto-hide flicker or touch layouts made by scaling desktop. Reject any two-heavy-
renderer overlap. Controls must execute acknowledged capabilities and failures stay truthful.
Visual polish cannot substitute for current source times, canonical identity or camera proof.

## 22. Explicit deferred scope and handoff

No ISS cross-engine handoff; no Mars/Moon surface runtime; no solar-system-scale renderer;
no measured ORAS horizon; no aurora, fireball, eclipse, light-pollution, astronomy-smoke or
telescope-FOV implementation. No future layer switches. No detailed implementation of
future God's Eye capabilities; preserve the registry extension path without UI promises.
No new science, production catalogs, provider purchases, Docker changes or runtime edits.

Sol handoff after owner approval: **Load the frontend_change pack, this design contract and
the editable visual reference. They are the approved review handoff under the owner's Figma
waiver. Do not use the incomplete Figma screens as visual authority. Implement this single
visual direction without reinterpretation; preserve the merged PR #55 architecture and
qualify every proposed bridge/provider action before presenting it as working. Follow the
screenshot matrix and repository runtime proof rules.**

The remaining external facts are provider credentials/terms/coverage and their measured
quality. They do not block delivery of this design contract, but block claims of configured
Earth runtime acceptance. Owner approval remains outstanding. See the
[validation record](UNIFIED_WORKSPACE_DESIGN_VALIDATION.md) for exact checks and limits.
