const { test, expect } = require('@playwright/test')

function jsonResponse(route, payload) {
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  })
}

test('command-center shell remains stable across desktop and mobile viewports', async ({ page }) => {
  await page.route('**/api/v1/**', async (route) => jsonResponse(route, { data: null }))

  const viewports = [
    { width: 1280, height: 800 },
    { width: 390, height: 844 },
  ]

  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    await page.goto('/')

    const sceneSection = page.locator('.section.section-scene')
    const supportingSection = page.locator('.section.section-supporting-top')

    await expect(page.locator('.app-shell')).toBeVisible()
    await expect(sceneSection).toBeVisible()
    await expect(supportingSection).toBeVisible()

    const sceneBox = await sceneSection.boundingBox()
    const supportingBox = await supportingSection.boundingBox()
    if (!sceneBox || !supportingBox) {
      throw new Error('Unable to read layout bounds for responsive shell sections')
    }
    expect(sceneBox.y).toBeLessThan(supportingBox.y)
  }
})
