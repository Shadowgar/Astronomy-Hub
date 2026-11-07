import { describe, expect, it } from 'vitest'
import { evaluateMission, validateMissionState, type Knot, type MissionEntry, type MissionState, type Vec3 } from '../src/features/missions/missionContracts'

// Independently captured actual GET /api/v1/solar/missions/voyager1?epoch=1979-03-05T12:05:26Z.
// Compact two-knot extract of preview-v1, release_id solar-missions-v1:
// manifest SHA256 1cc72e95c0397332a3427043b5b2a82823dc0cbb42903fd50eb0fb5505070ae0
// voyager1.json SHA256 9699108073b9c6ebf0acb2167f40a1e08299af7f17f04d1d0021e82d3b23238f
// Source: NASA/NAIF vgr1_jup230.bsp plus compatible jup230-1979.bsp original coefficients.
// API values below are independent server outputs, not recomputed by this test's interpolation.
const epoch = '1979-03-05T12:05:26.000000Z'
const start = '1979-03-05T11:59:09.811Z', end = '1979-03-05T12:10:24.810Z'
const craft: Knot[] = [
  { epoch: '1979-03-05T11:59:09.810979Z', jd_tdb: 2443937.9999999586, position: [-3.221854835922194, 3.828335072828598, 1.7195265998157996], velocity: [-2.3360496287305102e-7, 4.7649290137497864e-8, 2.93328965014314e-8] },
  { epoch: '1979-03-05T12:10:24.810939Z', jd_tdb: 2443938.007812458, position: [-3.2220133661655033, 3.8283659701948376, 1.7195459572648113], velocity: [-2.3607699342419368e-7, 4.3877769810897006e-8, 2.8011975495964103e-8] },
]
const jupiter: Knot[] = [
  { epoch: craft[0].epoch, jd_tdb: craft[0].jd_tdb, position: [-3.223137038037326, 3.826494581410472, 1.7188863186131211], velocity: [-7.033923286812391e-8, -4.585911504319054e-8, -1.7943524498557785e-8] },
  { epoch: craft[1].epoch, jd_tdb: craft[1].jd_tdb, position: [-3.223184516832229, 3.8264636263314324, 1.7188742066561566], velocity: [-7.033868703866345e-8, -4.5859643098317494e-8, -1.794375753110109e-8] },
]
const coverage: MissionState['coverage'] = [{ id: 'jupiter-encounter-2', start, end, quality: 'reconstructed', label: 'Voyager 1 Jupiter reconstructed encounter', target_ids: ['jupiter'] }]
const entry: MissionEntry = { id: 'voyager1', name: 'Voyager 1', naif_id: '-31', summary: 'Actual source precision regression', default_epoch: epoch, targets: [{ id: 'jupiter', naif_id: '599', appearance_id: 'jupiter' }], events: [], limitations: [], segments: coverage }
const state: MissionState = {
  schema: 'oras.mission-state.v1', mission_id: 'voyager1', epoch, jd_tdb: 2443938.004353998,
  frame: 'ICRF', origin: 'sun', position_units: 'AU', velocity_units: 'AU/s',
  segment_id: coverage[0].id, quality: 'reconstructed', source_label: coverage[0].label,
  craft: { id: 'voyager1', naif_id: '-31', position: [-3.2219429820589482, 3.8283526066973095, 1.7195374981420348], velocity: [-2.3501028342207128e-7, 4.5562676333902405e-8, 2.860452270814456e-8] },
  bodies: [{ id: 'jupiter', name: 'Jupiter', naif_id: '599', appearance_id: 'jupiter', radius_km: 69911, position: [-3.223163498827594, 3.82647732965921, 1.7188795684316567], velocity: [-7.033892814992742e-8, -4.585940936349927e-8, -1.7943654374207732e-8] }],
  tracks: [], coverage, interpolation: { max_sampled_position_error_km: 0.04910902515064196, max_sampled_velocity_error_km_s: 4.882868273050349e-05, physical_uncertainty: 'Source physical uncertainty not supplied; this test checks API/client agreement only.' },
  attitude: { status: 'unavailable', description: 'No reconstructed attitude supplied.' },
  samples: { start, end, step_seconds: null, craft, bodies: [{ id: 'jupiter', samples: jupiter }] },
}
const separationMeters = (a: Vec3, b: Vec3) => Math.hypot(...a.map((value, axis) => value - b[axis])) * 149597870700

// Additional independently evaluated server outputs at the two inward millisecond endpoints.
const endpoints = [
  { epoch: start, craft: [-3.221854835931593, 3.828335072830515, 1.7195265998169798] as Vec3, jupiter: [-3.2231370380401563, 3.8264945814086273, 1.718886318612399] as Vec3 },
  { epoch: end, craft: [-3.222013365947047, 3.828365970154235, 1.71954595723889] as Vec3, jupiter: [-3.22318451676714, 3.8264636263738696, 1.7188742066727611] as Vec3 },
]

describe('actual-source mission API/client numerical agreement', () => {
  it('reproduces the exact API epoch within one millimetre without truncating microsecond knot labels', () => {
    const admitted = validateMissionState(state, 'voyager1', epoch, entry)
    const value = evaluateMission(admitted, Date.parse(epoch))
    // Previous Date.parse(knot.epoch) fraction produced 34.2576 metres of craft error.
    expect(separationMeters(value.craft, state.craft.position)).toBeLessThan(0.001)
    expect(separationMeters(value.bodies.jupiter, state.bodies[0].position)).toBeLessThan(0.001)
  })

  it('preserves the exact anchor after forward playback and clock reversal', () => {
    const initial = evaluateMission(state, Date.parse(epoch))
    const forward = evaluateMission(state, Date.parse(epoch) + 1000)
    const backward = evaluateMission(state, Date.parse(epoch) - 1000)
    expect(forward.craft[0]).toBeLessThan(initial.craft[0])
    expect(backward.craft[0]).toBeGreaterThan(initial.craft[0])
    expect(evaluateMission(state, Date.parse(epoch))).toEqual(initial)
    expect(separationMeters(forward.craft, [-3.2219432170697786, 3.8283526522569398, 1.7195375267454214])).toBeLessThan(2)
    expect(separationMeters(backward.craft, [-3.221942747051761, 3.828352561132081, 1.7195374695366865])).toBeLessThan(2)
  })

  it.each(endpoints)('agrees with the server at the inward endpoint $epoch', expected => {
    const value = evaluateMission(state, Date.parse(expected.epoch))
    // Independently rounded Julian dates differ by up to one float64 ULP (~40us).
    // At this encounter speed the endpoint comparison therefore allows two metres.
    expect(separationMeters(value.craft, expected.craft)).toBeLessThan(2)
    expect(separationMeters(value.bodies.jupiter, expected.jupiter)).toBeLessThan(2)
  })

  it('refuses a millisecond beyond either admitted endpoint', () => {
    expect(() => evaluateMission(state, Date.parse(start) - 1)).toThrow(/coverage/)
    expect(() => evaluateMission(state, Date.parse(end) + 1)).toThrow(/coverage/)
  })
})
