const { test, expect } = require('@playwright/test')

function jsonResponse(route, payload, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  })
}

test('shows object-detail error fallback when detail request fails', async ({ page }) => {
  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url())
    const { pathname } = url

    if (pathname.endsWith('/scene/above-me')) {
      return jsonResponse(route, {
        data: {
          objects: [{ id: 'mars', name: 'Mars', type: 'planet', direction: 'SE' }],
        },
      })
    }

    if (pathname.endsWith('/conditions')) {
      return jsonResponse(route, {
        data: {
          location_label: 'ORAS Observatory',
          observing_score: 72,
          cloud_cover_pct: 28,
          moon_phase: 'Waxing Gibbous',
          darkness_window: {
            start: '2026-03-30T02:00:00Z',
            end: '2026-03-30T04:00:00Z',
          },
          summary: 'Mostly clear',
          last_updated: '2026-03-30T01:00:00Z',
        },
      })
    }

    if (pathname.endsWith('/targets') || pathname.endsWith('/alerts') || pathname.endsWith('/passes')) {
      return jsonResponse(route, { data: [] })
    }

    if (pathname.includes('/object/')) {
      return jsonResponse(
        route,
        { error: { code: 'OBJECT_DETAIL_UNAVAILABLE', message: 'Object detail unavailable' } },
        500
      )
    }

    return jsonResponse(route, { data: null })
  })

  await page.goto('/')
  const firstObject = page.locator('.above-me-scene__object').first()
  await expect(firstObject).toBeVisible()
  await firstObject.click()

  await expect(page.getByText('Selected target details')).toBeVisible()
  await expect(page.getByText('Error loading detail: Object detail unavailable')).toBeVisible({ timeout: 20000 })
})
