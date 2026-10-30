# R4-A body and renderer interfaces

This implements the owner-authorized non-Earth entry slice, stacked on PR91.
It extends the approved independent, active-only renderer architecture; it does
not replace Earth or Stellarium, or establish all-body surface support.

## Body qualification

| Property | Moon contract |
| --- | --- |
| Identity | `Solar System (JPL)` / `moon` / `moon`; center **301**, not barycenter3 |
| Epoch | Explicit UTC input; DE442s/Skyfield evaluation in TDB; fixed during exploration |
| Inertial/body-fixed frame | ICRF → `MOON_ME_DE440_ME421`, NAIF31009; row-major rotation matrix |
| Shape | Reference sphere, radius1,737,400m, from pinned NAIF constants |
| Coordinates | Planetocentric north, east-positive longitude[-180,180), meters above reference sphere |
| Initial arrival | Source-derived subsolar hemisphere, nadir-facing camera; farther arrival in portrait |
| Camera | Native Moon-centered Cartesian coordinates; geographic height30km–12,000km; finite heading/pitch/roll |
| Imagery | Original historical LROC WAC morphology browse,8pixels/degree, about3.79km/pixel |
| No-data | Explicit TIFF no-data value0 becomes alpha0 over a neutral sphere; no infill |
| Terrain | **Unavailable**. No elevation, terrain datum, lander-scale detail or precision surface claim |
| Illumination | Geometric Moon→Sun vector in the qualified body frame; Lambert sphere attenuation |
| Scientific limits | Historical acquisition shadows remain; no reflectance calibration, terrain shadows or Earthshine |

The exploration camera is not an Earth-based observing line of sight. Initial
subsolar arrival therefore does not claim the Moon's apparent phase from Earth.
The Sun direction is source-derived; the Lambert material is a rendering model,
not a measured brightness or lunar photometric solution.

[Science references and numerical comparisons](SCIENCE.md) and
[original image bytes, projection and rights](IMAGERY.md) define the gates.
Mars remains unavailable: existing target4 is its system barycenter and the
center499/orientation stack is not qualified for this slice.

## Hub → native bridge

The Hub owns selection, contextual controls, route/history and return intent.
An independent Cesium1.138.0 iframe owns the Moon globe, camera and lifetime.
God's Eye source pin and the existing Earth SDK artifact are reused read-only.
No upstream renderer source or global Cesium default ellipsoid is modified.

Messages use namespace `oras.planet.v1`, the exact origin, the exact source/parent
window and a random per-frame128-bit channel. The channel uses
`crypto.getRandomValues`, including on the owner's LAN HTTP preview. No renderer
object crosses the bridge.

1. Frame sends `frameReady`; parent sends `initialize` with the validated science
   snapshot and optional validated camera.
2. Native runtime validates identity/frame/shape/illumination, loads actual image
   bytes and dimensions, and waits for a completed `postRender` with tiles loaded.
   Only then does it report `ready` with actual serializable diagnostics.
3. Parent sends commands with a request ID. `navigate` accepts latitude/longitude/
   height and optional heading/pitch/roll; `zoom` accepts a factor; `orbit` accepts
   radians; `getState` reports diagnostics; `dispose` destroys the viewer.
4. Native `ack` resolves the matching request. Command `error` rejects it;
   renderer/source errors remove the frame and expose Retry/Return controls.
   Move-end navigation reports update the reloadable camera URL. Unsubmitted
   coordinate drafts are retained until the user submits them.

Explicit return awaits the actual destroy acknowledgement before mounting Solar.
Frame departure also cancels pending initialization, removes listeners and
destroys its viewer/material. API requests use AbortController and ignore stale
responses. Missing kernels, unsupported body/time, image failure and WebGL loss
have controlled unavailable states; no Earth globe or invented surface substitutes.

The camera protocol allows1mm of floating-point roundoff at its bounds, with
native commands clamped to the stated limits. This is a numerical transport
tolerance, not cartographic or elevation accuracy.

## History and return

The departing Solar entry and the destination's return context retain the exact
epoch, selected primary body, camera/target/up/near, close-up semantics, and
admitted display preferences. Browser Back and the Return button are separate
qualification paths. Deliberate later Solar selection clears the stale return
snapshot. Direct Sky/Earth return unwraps the original observer/navigation state.

Moon camera coordinates stay in the Planet route and do not update the Earth's
observer/location. Retry reads the latest validated camera URL; reload restores
that same body-fixed view. Solar remains a nine-primary-body scene: Moon is an
explicit satellite destination, not a fabricated tenth primary globe/position.

## Native Earth assumptions removed

Lunar ellipsoids are supplied to Scene, Globe, map projection, terrain provider,
imagery tiling and camera construction. Atmosphere, fog, skybox and native
Earth Sun/Moon effects are absent. Cesium's ellipsoid-only shading normally uses
a hard-coded0.3 night floor and5× diffuse boost. A supported `Globe.material`
black alpha mask attenuates the original pixels using the actual Moon-centered
surface point and qualified Sun direction, with native Earth lighting disabled.
No SDK patch or altered source image is involved.

The material reconstructs the surface point from native eye space because
EllipsoidTerrainProvider does not supply terrain vertex normals. Independent
review inspected the pinned shader and transform behavior. Actual lit/antisolar
pixel evidence is retained; shader errors cannot count as a ready frame.
