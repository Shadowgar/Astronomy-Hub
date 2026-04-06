const { test, expect } = require('@playwright/test')

async function clickTimeButton(page, label, times) {
  const button = page.getByRole('button', { name: label })

  for (let count = 0; count < times; count += 1) {
    await button.evaluate((element) => {
      element.click()
    })
  }
}

async function extractVisibilityPercent(page) {
  const statusCard = page.locator('.sky-engine-page__status-card').first()
  const text = await statusCard.getByText(/Star visibility:/).textContent()
  const match = text?.match(/Star visibility:\s*(\d+)%/)

  if (!match) {
    throw new Error(`Could not parse star visibility text from: ${text}`)
  }

  return Number.parseInt(match[1], 10)
}

async function selectCanvasObjectByHeading(page, expectedHeading) {
  const canvas = page.locator('canvas[aria-label="Sky Engine scene"]')
  await expect(canvas).toBeVisible()
  const box = await canvas.boundingBox()

  if (!box) {
    throw new Error('Sky Engine canvas has no bounding box.')
  }

  const heading = page.locator('.sky-engine-detail-shell h2')
  const xPositions = [0.18, 0.28, 0.38, 0.48, 0.58, 0.68, 0.78]
  const yPositions = [0.16, 0.24, 0.32, 0.4, 0.48, 0.56]

  for (const yFactor of yPositions) {
    for (const xFactor of xPositions) {
      await page.mouse.click(box.x + box.width * xFactor, box.y + box.height * yFactor)
      await page.waitForTimeout(60)

      if ((await heading.textContent())?.trim() === expectedHeading) {
        return
      }
    }
  }

  throw new Error(`Could not select ${expectedHeading} from the rendered canvas.`)
}

test('sky engine calibrates phase state, star visibility, and canvas selection', async ({ page }) => {
  await page.goto('/sky-engine')
  await page.waitForSelector('canvas[aria-label="Sky Engine scene"]')
  await page.waitForTimeout(1200)

  const phasePill = page.locator('.sky-engine-page__phase-pill').first()
  await expect(phasePill).toHaveText('Night')
  const nightVisibility = await extractVisibilityPercent(page)

  await clickTimeButton(page, '+1 hour', 7)
  await expect(phasePill).toHaveText('Low Sun')
  const lowSunVisibility = await extractVisibilityPercent(page)

  await clickTimeButton(page, '+1 hour', 5)
  await expect(phasePill).toHaveText('Daylight')
  const daylightVisibility = await extractVisibilityPercent(page)

  expect(nightVisibility).toBeGreaterThan(lowSunVisibility)
  expect(lowSunVisibility).toBeGreaterThan(daylightVisibility)

  await clickTimeButton(page, '-1 day', 1)
  await clickTimeButton(page, '-1 hour', 5)
  await expect(phasePill).toHaveText('Low Sun')
  await selectCanvasObjectByHeading(page, 'Vega')
  await expect(page.locator('.sky-engine-detail-shell')).toContainText('Computed real sky')
})