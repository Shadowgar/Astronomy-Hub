import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { ObserveView, formatObserveTime } from '../src/features/observe/ObservePage'
import { normalizeObservePayload } from '../src/features/observe/model'

const objects = [
  {
    catalog: 'Messier (local)', source_id: 'M31', model: 'dso', name: 'Andromeda Galaxy',
    type: 'galaxy', alt: 52.3, az: 101.2, is_visible: true,
    magnitude: 3.4, object_type_label: 'Galaxy',
    sky_engine_url: '/oras-sky-engine/skysource/AndromedaGalaxy?catalog=Messier+%28local%29&source_id=M31&model=dso&ra=10.68&dec=41.269',
  },
  {
    catalog: 'Solar System (JPL)', source_id: 'moon', model: 'moon', name: 'Moon',
    type: 'moon', alt: 31.2, az: 250.2, is_visible: true,
    sky_engine_url: '/oras-sky-engine/skysource/Moon?catalog=Solar+System+%28JPL%29&source_id=moon&model=moon&ra=10&dec=20',
  },
]

const payload = normalizeObservePayload({
  status: 'ok', data: { objects },
  meta: { time: '2026-09-27T06:00:00Z', observer: { lat: 41.321903, lng: -79.585394, elev: 432.816 } },
})
const handlers = {
  onCategoryChange: () => {}, onSelect: () => {}, onShowMore: () => {}, onRetry: () => {},
}

function render(props: Partial<Parameters<typeof ObserveView>[0]>) {
  return renderToStaticMarkup(
    <ObserveView category="all" selectedKey={null} visibleCount={18} isOras {...handlers} {...props} />,
  )
}

describe('Observe page states', () => {
  it('renders bounded loading, error with Retry, and honest empty state', () => {
    expect(render({ loading: true })).toContain('Loading the sky above ORAS')
    const error = render({ error: true })
    expect(error).toContain('Current observing data could not be loaded')
    expect(error).toContain('Retry')
    const empty = render({ payload: { ...payload, objects: [] } })
    expect(empty).toContain('No matching objects are currently above the horizon')
  })

  it('renders source-backed cards, exact links, and selected detail without placeholders', () => {
    const html = render({ payload })
    expect(html).toContain('Andromeda Galaxy')
    expect(html).toContain('52.3°')
    expect(html).toContain('Catalog mag. 3.4')
    expect(html).toContain('Current Sky Position')
    expect(html).toContain('Messier (local)')
    expect(html).toContain('source_id=M31')
    expect(html).not.toContain('Unknown')
    expect(html).not.toContain('placeholder')
  })

  it('filters to supported categories and changes the selected detail', () => {
    const html = render({ payload, category: 'solar-system' })
    expect(html).toContain('Moon')
    expect(html).not.toContain('Andromeda Galaxy')
    expect(html).toContain('Solar System (JPL)')
    expect(html).not.toContain('Satellites</button>')
  })

  it('shows a satellite category only when the TLE model is present', () => {
    const withSatellite = normalizeObservePayload({
      status: 'ok',
      data: { objects: [...objects, {
        catalog: 'Local TLE', source_id: '25544', model: 'tle_satellite',
        name: 'ISS', type: 'satellite', alt: 35, az: 220, is_visible: true,
        sky_engine_url: '/oras-sky-engine/skysource/ISS?catalog=Local+TLE&source_id=25544&model=tle_satellite&ra=10&dec=20',
      }] },
      meta: { time: '2026-09-27T06:00:00Z', observer: { lat: 41.321903, lng: -79.585394, elev: 432.816 } },
    })
    const html = render({ payload: withSatellite, category: 'satellites' })
    expect(html).toContain('Satellites')
    expect(html).toContain('ISS')
    expect(html).not.toContain('Andromeda Galaxy')
  })

  it('falls back to All when a refreshed category has no objects', () => {
    const html = render({ payload, category: 'satellites' })
    expect(html).toContain('Andromeda Galaxy')
    expect(html).toContain('Moon')
    expect(html).toContain('aria-pressed="true"')
    expect(html).not.toContain('No matching objects')
  })

  it('labels custom-site time in UTC instead of implying an unknown local zone', () => {
    expect(formatObserveTime('2026-09-27T06:00:00Z', false)).toContain('UTC')
    expect(formatObserveTime('2026-09-27T06:00:00Z', true)).toContain('EDT')
  })

  it('labels an explicit time override without claiming the scene is current', () => {
    const html = render({ payload, timeOverride: true })
    expect(html).toContain('Above the Horizon at Selected Time')
    expect(html).toContain('Sky Position at Selected Time')
    expect(html).not.toContain('Above the Horizon Now')
    expect(html).not.toContain('Live sky inventory')
    expect(html).not.toContain('Current altitude')
    expect(render({ error: true, timeOverride: true })).toContain('Observing data for the selected time could not be loaded')
    expect(render({ payload: { ...payload, objects: [] }, timeOverride: true })).toContain('No matching objects are above the horizon at the selected time')
  })

  it('shows factual darkness, Moon, weather, and selected target limitations', () => {
    const qualified = normalizeObservePayload({
      status: 'ok',
      data: { objects: [{ ...objects[0], above_geometric_horizon: true, observability: {
        above_geometric_horizon: true, altitude_deg: 52.3, azimuth_deg: 101.2,
        sky_state: 'astronomical_night', in_astronomical_darkness: true,
        moon_angular_separation_deg: 73.4, assessment: 'above_horizon_astronomical_night',
        limitations: ['geometric_horizon_only'],
      } }] },
      meta: {
        time: '2026-09-27T06:00:00Z', observer: { lat: 41.321903, lng: -79.585394, elev: 432.816 },
        observability_context: {
          schema_version: 'observability.v1', horizon_model: 'geometric', site_horizon_status: 'not_modeled',
          sky_darkness: { state: 'astronomical_night', sun_altitude_deg: -22.4, in_astronomical_darkness: true, source: 'jpl_de442s_local' },
          moon: { altitude_deg: 31.2, azimuth_deg: 220, above_geometric_horizon: true, ra_deg: 20, dec_deg: 30, ra_icrf_deg: 20, dec_icrf_deg: 30, source: 'jpl_de442s_local' },
          weather: { status: 'current_fresh', source: 'open_meteo_current', last_updated: '2026-09-27T06:00:00Z', cloud_cover_pct: 0 },
          limitations: [],
        },
      },
    })
    const html = render({ payload: qualified })
    expect(html).toContain('Astronomical night')
    expect(html).toContain('−22.4°')
    expect(html).toContain('Clouds 0%')
    expect(html).toContain('Observing Context')
    expect(html).toContain('73.4°')
    expect(html).toContain('Not modeled')
    expect(html).toContain('source_id=M31')
    expect(html).not.toContain('Excellent')
  })

  it('does not show current weather for selected time', () => {
    const selected = { ...payload, observabilityContext: {
      schema_version: 'observability.v1' as const, horizon_model: 'geometric' as const,
      site_horizon_status: 'not_modeled' as const,
      sky_darkness: { state: 'civil_twilight' as const, sun_altitude_deg: -3, in_astronomical_darkness: false, source: 'jpl_de442s_local' },
      moon: { altitude_deg: -2, azimuth_deg: 100, above_geometric_horizon: false, ra_deg: 20, dec_deg: 30, ra_icrf_deg: 20, dec_icrf_deg: 30, source: 'jpl_de442s_local' },
      weather: { status: 'not_evaluated_for_selected_time' as const, source: 'open_meteo_current', last_updated: null },
      limitations: [], observer: payload.observer,
    } }
    const html = render({ payload: selected, timeOverride: true })
    expect(html).toContain('Civil twilight')
    expect(html).toContain('Weather not evaluated for selected time')
    expect(html).not.toContain('Clouds 0%')
  })

  it.each([
    ['daylight', 'Daylight'],
    ['civil_twilight', 'Civil twilight'],
    ['nautical_twilight', 'Nautical twilight'],
    ['astronomical_twilight', 'Astronomical twilight'],
    ['astronomical_night', 'Astronomical night'],
  ])('renders %s without a quality claim', (state, label) => {
    const contextual = { ...payload, observabilityContext: {
      schema_version: 'observability.v1' as const, observer: payload.observer,
      horizon_model: 'geometric' as const, site_horizon_status: 'not_modeled' as const,
      sky_darkness: { state: state as 'daylight', sun_altitude_deg: -3, in_astronomical_darkness: false, source: 'jpl_de442s_local' },
      moon: { altitude_deg: null, azimuth_deg: null, above_geometric_horizon: null, ra_deg: null, dec_deg: null, ra_icrf_deg: null, dec_icrf_deg: null, source: null },
      weather: { status: 'unavailable' as const, source: 'open_meteo_current', last_updated: null }, limitations: [],
    } }
    const html = render({ payload: contextual })
    expect(html).toContain(label)
    expect(html).toContain('Weather unavailable')
    expect(html).not.toContain('Excellent')
  })
})
