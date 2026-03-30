const { test, expect } = require('@playwright/test')

function jsonResponse(route, payload) {
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  })
}

test('app loads, scene renders, and selecting an object opens detail', async ({ page }) => {
  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url())
    const { pathname } = url

    if (pathname.endsWith('/scene/above-me')) {
      return jsonResponse(route, {
        data: {
          objects: [
            { id: 'mars', name: 'Mars', type: 'planet', direction: 'SE' },
            { id: 'iss', name: 'ISS', type: 'satellite', direction: 'W' },
          ],
        },
      })
    }

    if (pathname.endsWith('/conditions')) {
      return jsonResponse(route, {
        data: {
          location_label: 'ORAS Observatory',
          observing_score: 78,
          cloud_cover_pct: 22,
          moon_phase: 'Waxing Gibbous',
          darkness_window: {
            start: '2026-03-30T02:00:00Z',
            end: '2026-03-30T04:00:00Z',
          },
          summary: 'Clear windows expected',
          last_updated: '2026-03-30T01:00:00Z',
        },
      })
    }

    if (pathname.endsWith('/targets')) {
      return jsonResponse(route, {
        data: [{ id: 'mars', name: 'Mars', type: 'planet', direction: 'SE' }],
      })
    }

    if (pathname.endsWith('/alerts')) {
      return jsonResponse(route, {
        data: [{ title: 'Meteor chance', category: 'Sky', relevance: 'high', priority: 'low', summary: 'Watch NE sky' }],
      })
    }

    if (pathname.endsWith('/passes')) {
      return jsonResponse(route, {
        data: [{ object_name: 'ISS', visibility: 'Good', max_elevation_deg: 65, start_direction: 'W', end_direction: 'E' }],
      })
    }

    if (pathname.includes('/object/')) {
      return jsonResponse(route, {
        data: {
          name: 'Mars',
          type: 'planet',
          summary: 'Red planet',
          description: 'Bright and prominent in the evening sky.',
          media: [],
        },
      })
    }

    return jsonResponse(route, { data: null })
  })

  await page.goto('/')
  await expect(page.locator('.above-me-scene')).toBeVisible()
  await expect(page.locator('.above-me-scene__sky')).toBeVisible()

  const firstObject = page.locator('.above-me-scene__object').first()
  await expect(firstObject).toBeVisible()
  await firstObject.click()

  await expect(page.getByText('Selected target details')).toBeVisible()
  await expect(page.locator('.object-detail')).toContainText('Mars')
})
