const path = require('node:path')

const { test, expect } = require('@playwright/test')

test.setTimeout(90000)

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

async function getPickTargets(page) {
  const canvas = page.locator('canvas[aria-label="Sky Engine scene"]')
  await expect(canvas).toBeVisible()
  await expect.poll(async () => canvas.getAttribute(PICK_TARGETS_DATA_ATTRIBUTE)).not.toBeNull()

  return canvas.evaluate((element, attributeName) => {
    const rawTargets = element.getAttribute(attributeName)
    return rawTargets ? JSON.parse(rawTargets) : []
  }, PICK_TARGETS_DATA_ATTRIBUTE)
}

async function getSceneState(page) {
  const canvas = page.locator('canvas[aria-label="Sky Engine scene"]')
  await expect(canvas).toBeVisible()

  return canvas.evaluate((element, attributeName) => {
    const rawState = element.getAttribute(attributeName)
    return rawState ? JSON.parse(rawState) : null
  }, SCENE_STATE_DATA_ATTRIBUTE)
}

async function selectCanvasObjectByName(page, expectedName) {
  const canvas = page.locator('canvas[aria-label="Sky Engine scene"]')
  const box = await canvas.boundingBox()

  if (!box) {
    throw new Error('Sky Engine canvas has no bounding box.')
  }

  const targets = await getPickTargets(page)
  const pickTarget = targets.find((target) => target.objectName === expectedName)

  if (!pickTarget) {
    throw new Error(`Could not find pick target for ${expectedName}.`)
  }

  await page.mouse.click(box.x + pickTarget.screenX, box.y + pickTarget.screenY)
}

async function clickCanvasTarget(page, pickTarget) {
  const canvas = page.locator('canvas[aria-label="Sky Engine scene"]')
  const box = await canvas.boundingBox()

  if (!box) {
    throw new Error('Sky Engine canvas has no bounding box.')
  }

  await page.mouse.click(box.x + pickTarget.screenX, box.y + pickTarget.screenY)
}

async function clickCanvasTargetByObjectId(page, objectId) {
  const targets = await getPickTargets(page)
  const pickTarget = targets.find((target) => target.objectId === objectId)

  if (!pickTarget) {
    throw new Error(`Could not find pick target for object ${objectId}.`)
  }

  await clickCanvasTarget(page, pickTarget)
  return pickTarget
}

function findEmptyCanvasPoint(box, targets) {
  const margin = 28

  for (let x = margin; x <= box.width - margin; x += 36) {
    for (let y = margin; y <= box.height - margin; y += 36) {
      const overlapsTarget = targets.some((target) => {
        return Math.hypot(target.screenX - x, target.screenY - y) <= target.radiusPx + 16
      })

      if (!overlapsTarget) {
        return { x, y }
      }
    }
  }

  return null
}

async function selectFirstCanvasPickTarget(page) {
  const canvas = page.locator('canvas[aria-label="Sky Engine scene"]')
  const box = await canvas.boundingBox()

  if (!box) {
    throw new Error('Sky Engine canvas has no bounding box.')
  }

  const targets = await getPickTargets(page)
  const pickTarget = targets[0]

  if (!pickTarget) {
    throw new Error('Could not find any runtime pick targets.')
  }

  await page.mouse.click(box.x + pickTarget.screenX, box.y + pickTarget.screenY)

  return pickTarget.objectName
}

test('sky engine proves moon, labels, aids, guidance, and time controls in runtime', async ({ page }) => {
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
  await expect(page.locator('.sky-engine-page__phase-band-segment--active')).toHaveCount(1)
  await expect(page.getByLabel('Guided sky targets').locator('button')).toHaveCount(5)
  await expect(page.getByLabel('Guided sky targets').getByRole('button', { name: 'Andromeda Galaxy' })).toBeVisible()

  const fullProofPath = path.resolve(__dirname, '../../test-results/sky-engine-proof.png')
  await page.screenshot({ path: fullProofPath, fullPage: true })

  await expect.poll(async () => (await getSceneState(page))?.moonObjectId ?? null).toBe('sky-real-moon')
  const initialState = await getSceneState(page)
  expect(initialState.moonObjectId).toBe('sky-real-moon')
  expect(initialState.guidanceObjectIds.length).toBeGreaterThanOrEqual(3)
  expect(initialState.guidanceObjectIds.length).toBeLessThanOrEqual(5)
  expect(initialState.controlledLabelCount).toBeLessThanOrEqual(initialState.labelCap)
  const pickTargets = await getPickTargets(page)
  expect(pickTargets.length).toBeGreaterThan(0)
  expect(initialState.aidVisibility).toEqual({
    constellations: true,
    azimuthRing: true,
    altitudeRings: true,
  })

  const starTargets = pickTargets.filter((target) => target.objectType === 'star')
  expect(starTargets.length).toBeGreaterThanOrEqual(2)
  const firstStarTarget = starTargets[0]

  await clickCanvasTargetByObjectId(page, firstStarTarget.objectId)
  await expect(page.locator('.sky-engine-detail-shell h2')).toHaveText(firstStarTarget.objectName)
  await expect.poll(async () => (await getSceneState(page))?.selectedObjectId ?? null).toBe(firstStarTarget.objectId)

  const secondStarTarget = (await getPickTargets(page)).find(
    (target) => target.objectType === 'star' && target.objectId !== firstStarTarget.objectId,
  )
  expect(secondStarTarget).toBeTruthy()

  await clickCanvasTargetByObjectId(page, secondStarTarget.objectId)
  await expect(page.locator('.sky-engine-detail-shell h2')).toHaveText(secondStarTarget.objectName)
  await expect.poll(async () => (await getSceneState(page))?.selectedObjectId ?? null).toBe(secondStarTarget.objectId)

  await page.getByLabel('Guided sky targets').getByRole('button', { name: 'Andromeda Galaxy' }).click()
  await expect.poll(async () => (await getSceneState(page))?.selectedObjectId ?? null).toBe('sky-seed-andromeda')

  await expect.poll(async () => {
    return (await getPickTargets(page)).some((target) => target.objectName === 'Andromeda Galaxy')
  }).toBe(true)

  const andromedaTarget = (await getPickTargets(page)).find((target) => target.objectName === 'Andromeda Galaxy')
  expect(andromedaTarget).toBeTruthy()
  expect(secondStarTarget.objectName).not.toBe('Andromeda Galaxy')

  await clickCanvasTargetByObjectId(page, andromedaTarget.objectId)
  await expect(page.locator('.sky-engine-detail-shell h2')).toHaveText('Andromeda Galaxy')
  await expect.poll(async () => (await getSceneState(page))?.selectedObjectId ?? null).toBe(andromedaTarget.objectId)

  const pickedObjectName = await selectFirstCanvasPickTarget(page)
  await expect(page.locator('.sky-engine-detail-shell h2')).toHaveText(pickedObjectName)

  await page.getByLabel('Guided sky targets').getByRole('button', { name: 'Moon' }).click()
  await expect(page.locator('.sky-engine-detail-shell h2')).toHaveText('Moon')
  await expect(page.locator('.sky-engine-detail-shell')).toContainText('Computed ephemeris')
  await expect(page.locator('.sky-engine-detail-shell')).toContainText('12h ephemeris arc')
  await expect(page.locator('.sky-engine-detail-shell')).toContainText('Phase:')

  await expect.poll(async () => (await getSceneState(page))?.selectedObjectId ?? null).toBe('sky-real-moon')
  await expect.poll(async () => (await getSceneState(page))?.trajectoryObjectId ?? null).toBe('sky-real-moon')
  await expect.poll(async () => (await getSceneState(page))?.visibleLabelIds ?? []).toContain('sky-real-moon')

  const offsetBeforePlayback = await page.locator('.sky-engine-page__bottom-hud-offset').textContent()
  await page.getByRole('button', { name: '+1m/s' }).click()
  await page.waitForTimeout(900)
  await page.getByRole('button', { name: 'Pause' }).click()
  await expect(page.locator('.sky-engine-page__bottom-hud-offset')).not.toHaveText(offsetBeforePlayback ?? 'Now')

  await setSceneTimeOffset(page, -3600)
  await expect(page.locator('.sky-engine-page__top-bar')).toContainText('-1h')

  await page.getByRole('button', { name: 'Compass' }).click()
  await expect.poll(async () => (await getSceneState(page))?.aidVisibility?.azimuthRing).toBe(false)

  const canvas = page.locator('canvas[aria-label="Sky Engine scene"]')
  const box = await canvas.boundingBox()

  if (!box) {
    throw new Error('Sky Engine canvas has no bounding box.')
  }

  const emptyPoint = findEmptyCanvasPoint(box, await getPickTargets(page))
  expect(emptyPoint).toBeTruthy()
  await page.mouse.click(box.x + emptyPoint.x, box.y + emptyPoint.y)
  await expect.poll(async () => (await getSceneState(page))?.selectedObjectId ?? null).toBeNull()
  await expect(page.locator('.sky-engine-detail-shell h2')).toHaveText('Select a rendered object')

  const selectedProofPath = path.resolve(__dirname, '../../test-results/sky-engine-selected-proof.png')
  await page.screenshot({ path: selectedProofPath, fullPage: true })

  const finalState = await getSceneState(page)
  expect(finalState.visibleLabelIds.length).toBeLessThanOrEqual(finalState.labelCap)
  expect(finalState.guidanceObjectIds.length).toBeGreaterThanOrEqual(3)
  expect(consoleMessages).toEqual([])
  expect(pageErrors).toEqual([])
})