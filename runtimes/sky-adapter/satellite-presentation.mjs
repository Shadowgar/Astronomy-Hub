// Restore Stellarium-native satellite presentation in ordinary Sky viewing.
// Native satellites.c owns positions, SGP4, photometry, rendering and visibility.
// Hub controls may enhance identification at close FOV, never hide normal native
// indicators at wide FOV or alter the underlying satellite point renderer.
export function satellitePresentation(core) {
  const sats = core.satellites;
  let originalVisible = null;
  let appliedVisible = null;
  let originalOffset = null;
  let appliedOffset = null;
  let close = false;
  const set = (key, value) => { if (sats[key] !== value) sats[key] = value; };
  const visible = value => { appliedVisible = value; set('hints_visible', value); };
  function observeNativePreferences() {
    if (originalVisible === null || (appliedVisible !== null && sats.hints_visible !== appliedVisible)) {
      originalVisible = !!sats.hints_visible;
    }
  }
  function applyCloseOffset() {
    if (originalOffset === null || sats.hints_mag_offset !== appliedOffset) originalOffset = sats.hints_mag_offset;
    appliedOffset = Math.max(originalOffset, 4);
    set('hints_mag_offset', appliedOffset);
  }
  function restoreOffset() {
    if (originalOffset === null) return;
    if (sats.hints_mag_offset !== appliedOffset) originalOffset = sats.hints_mag_offset;
    const value = originalOffset;
    originalOffset = null;
    appliedOffset = null;
    set('hints_mag_offset', value);
  }
  function release() {
    if (!sats || originalVisible === null) return;
    observeNativePreferences();
    restoreOffset();
    visible(originalVisible);
    originalVisible = null;
    appliedVisible = null;
    close = false;
  }
  function update(embedded, fovRad, selectedSatellite) {
    if (!sats) return;
    if (!embedded) { release(); return; }
    observeNativePreferences();
    // Native JSON radians can differ by ~1e-12. Preserve accepted hysteresis,
    // but it governs only close-view label enhancement, never wide visibility.
    const degrees = fovRad * 180 / Math.PI;
    close = Number.isFinite(degrees) && (close ? degrees < 7 - 1e-8 : degrees <= 5 + 1e-8);
    if (close && originalVisible) applyCloseOffset();
    else restoreOffset();
    // In normal/wide Sky keep the native visibility setting. The previous
    // 'originalVisible && close' branch concealed native hints at normal FOV.
    // Selection/tracking must not lower hint magnitude to -30 either.
    visible(originalVisible);
    void selectedSatellite;
  }
  return {update, release};
}
