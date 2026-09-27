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
})
