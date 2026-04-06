const { test, expect } = require('@playwright/test')

const PICK_TARGETS_DATA_ATTRIBUTE = 'data-sky-engine-pick-targets'
const SCENE_STATE_DATA_ATTRIBUTE = 'data-sky-engine-scene-state'

async function setSceneTimeOffset(page, value) {
  const slider = page.getByLabel('Scene time offset')

  await slider.evaluate((element, nextValue) => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis.HTMLInputElement.prototype, 'value')

    if (!descriptor?.set) {
      throw new Error('Could not resolve native range input setter.')
    }

    descriptor.set.call(element, String(nextValue))
    element.dispatchEvent(new Event('input', { bubbles: true }))
    element.dispatchEvent(new Event('change', { bubbles: true }))
  }, value)
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

async function getSceneState(page) {
  const canvas = page.locator('canvas[aria-label="Sky Engine scene"]')
  await expect(canvas).toBeVisible()

  return canvas.evaluate((element, attributeName) => {
    const rawState = element.getAttribute(attributeName)

    if (!rawState) {
      return null
    }

    return JSON.parse(rawState)
  }, SCENE_STATE_DATA_ATTRIBUTE)
}

async function expectSceneState(page, expectedState) {
  await expect.poll(async () => getSceneState(page)).toEqual(expectedState)
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

test('sky engine renders horizon framing, slider-driven time changes, trajectory state, and deterministic selection', async ({ page }) => {
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

  await expect(page.locator('.sky-engine-page__top-bar')).toContainText('EDT')
  const phasePill = page.locator('.sky-engine-page__phase-pill').first()
  await expect(phasePill).toHaveText('Night')

  await expectSceneState(page, {
    horizonVisible: true,
    cardinals: ['N', 'E', 'S', 'W'],
    selectedObjectId: null,
    trajectoryObjectId: null,
    visibleLabelIds: ['sky-real-altair', 'sky-real-arcturus', 'sky-real-vega'],
    groundTextureMode: 'imgp0911.jpg_tiled',
  })

  await selectCanvasObjectByName(page, 'Deneb')
  await expect(page.locator('.sky-engine-detail-shell h2')).toHaveText('Deneb')
  await expect(page.locator('.sky-engine-detail-shell')).toContainText('12h arc active')
  await expectSceneState(page, {
    horizonVisible: true,
    cardinals: ['N', 'E', 'S', 'W'],
    selectedObjectId: 'sky-real-deneb',
    trajectoryObjectId: 'sky-real-deneb',
    visibleLabelIds: ['sky-real-altair', 'sky-real-arcturus', 'sky-real-deneb', 'sky-real-vega'],
    groundTextureMode: 'imgp0911.jpg_tiled',
  })

  await setSceneTimeOffset(page, 7)
  await expect(phasePill).toHaveText('Low Sun')
  await expect(page.locator('.sky-engine-detail-shell h2')).toHaveText('Deneb')

  await setSceneTimeOffset(page, 12)
  await expect(phasePill).toHaveText('Daylight')
  await expect(page.locator('.sky-engine-detail-shell h2')).toHaveText('Deneb')
  await expect(page.locator('.sky-engine-detail-shell')).toContainText('12h arc active')
  await expectSceneState(page, {
    horizonVisible: true,
    cardinals: ['N', 'E', 'S', 'W'],
    selectedObjectId: 'sky-real-deneb',
    trajectoryObjectId: 'sky-real-deneb',
    visibleLabelIds: ['sky-real-deneb', 'sky-real-polaris'],
    groundTextureMode: 'imgp0911.jpg_tiled',
  })

  await setSceneTimeOffset(page, 7)
  await expect(phasePill).toHaveText('Low Sun')
  await expect(page.locator('.sky-engine-detail-shell h2')).toHaveText('Deneb')

  const reselectionTarget = await selectFirstComputedPickTarget(page)
  await expect(page.locator('.sky-engine-detail-shell h2')).toHaveText(reselectionTarget.objectName)
  await expect(page.locator('.sky-engine-detail-shell')).toContainText('Computed real sky')
  expect(consoleMessages).toEqual([])
  expect(pageErrors).toEqual([])
})