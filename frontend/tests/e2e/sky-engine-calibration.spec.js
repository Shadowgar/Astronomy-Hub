const { test, expect } = require('@playwright/test')

const PICK_TARGETS_DATA_ATTRIBUTE = 'data-sky-engine-pick-targets'

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
  const value = text?.split('Star visibility: ')[1]?.split('%')[0]

  if (!value) {
    throw new Error(`Could not parse star visibility text from: ${text}`)
  }

  return Number.parseInt(value, 10)
}

async function getPickTarget(page, expectedName) {
  const targets = await getPickTargets(page)
  return targets.find((target) => target.objectName === expectedName) ?? null
}

async function getPickTargets(page) {
  const canvas = page.locator('canvas[aria-label="Sky Engine scene"]')
  await expect(canvas).toBeVisible()
  await expect.poll(async () => {
    return canvas.getAttribute(PICK_TARGETS_DATA_ATTRIBUTE)
  }).not.toBeNull()

  return canvas.evaluate((element, attributeName) => {
    const rawTargets = element.getAttribute(attributeName)

    if (!rawTargets) {
      return []
    }

    return JSON.parse(rawTargets)
  }, PICK_TARGETS_DATA_ATTRIBUTE)
}

async function selectCanvasObjectByName(page, expectedName) {
  const canvas = page.locator('canvas[aria-label="Sky Engine scene"]')
  const box = await canvas.boundingBox()

  if (!box) {
    throw new Error('Sky Engine canvas has no bounding box.')
  }

  const pickTarget = await getPickTarget(page, expectedName)

  if (!pickTarget) {
    throw new Error(`Could not find pick target for ${expectedName}.`)
  }

  await page.mouse.click(box.x + pickTarget.screenX, box.y + pickTarget.screenY)
  return pickTarget
}

async function selectFirstComputedPickTarget(page) {
  const canvas = page.locator('canvas[aria-label="Sky Engine scene"]')
  const box = await canvas.boundingBox()

  if (!box) {
    throw new Error('Sky Engine canvas has no bounding box.')
  }

  const targets = await getPickTargets(page)
  const pickTarget = targets.find((target) => target.objectId.startsWith('sky-real-'))

  if (!pickTarget) {
    throw new Error('Could not find a computed real-sky pick target.')
  }

  await page.mouse.click(box.x + pickTarget.screenX, box.y + pickTarget.screenY)
  return pickTarget
}

test('sky engine calibrates phase state, star visibility, deterministic selection, and scene-time persistence', async ({ page }) => {
  const consoleMessages = []
  const pageErrors = []
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleMessages.push(message.text())
    }
  })
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await page.goto('/sky-engine')
  await page.waitForSelector('canvas[aria-label="Sky Engine scene"]')
  await page.waitForTimeout(1200)

  const phasePill = page.locator('.sky-engine-page__phase-pill').first()
  await expect(phasePill).toHaveText('Night')
  const nightVisibility = await extractVisibilityPercent(page)

  await selectCanvasObjectByName(page, 'Vega')
  await expect(page.locator('.sky-engine-detail-shell h2')).toHaveText('Vega')

  await clickTimeButton(page, '+1 hour', 7)
  await expect(phasePill).toHaveText('Low Sun')
  const lowSunVisibility = await extractVisibilityPercent(page)
  await expect(page.locator('.sky-engine-detail-shell h2')).toHaveText('Vega')

  await clickTimeButton(page, '+1 hour', 5)
  await expect(phasePill).toHaveText('Daylight')
  const daylightVisibility = await extractVisibilityPercent(page)
  await expect(page.locator('.sky-engine-detail-shell h2')).toHaveText('Vega')

  expect(nightVisibility).toBeGreaterThan(lowSunVisibility)
  expect(lowSunVisibility).toBeGreaterThan(daylightVisibility)
  await expect(page.locator('.sky-engine-detail-shell')).toContainText('Vega is no longer rendered at this scene time.')

  await clickTimeButton(page, '-1 day', 1)
  await clickTimeButton(page, '-1 hour', 5)
  await expect(phasePill).toHaveText('Low Sun')
  const reselectionTarget = await selectFirstComputedPickTarget(page)
  await expect(page.locator('.sky-engine-detail-shell h2')).toHaveText(reselectionTarget.objectName)
  await expect(page.locator('.sky-engine-detail-shell')).toContainText('Computed real sky')
  expect(consoleMessages).toEqual([])
  expect(pageErrors).toEqual([])
})