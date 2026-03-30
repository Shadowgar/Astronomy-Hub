const { test, expect } = require('@playwright/test')

function jsonResponse(route, payload) {
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  })
}

test('navigates from command center to progress route', async ({ page }) => {
  await page.route('**/api/v1/**', async (route) => jsonResponse(route, { data: null }))

  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Progress' })).toBeVisible()

  await page.getByRole('link', { name: 'Progress' }).click()

  await expect(page).toHaveURL(/\/progress$/)
  await expect(page.getByRole('heading', { name: 'Development Progress' })).toBeVisible()
})

test('wildcard route redirects to command center root', async ({ page }) => {
  await page.route('**/api/v1/**', async (route) => jsonResponse(route, { data: null }))

  await page.goto('/not-a-real-route')

  await expect(page).toHaveURL(/\/$/)
  await expect(page.locator('.above-me-scene')).toBeVisible()
})
