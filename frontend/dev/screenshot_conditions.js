const puppeteer = require('puppeteer')
const fs = require('fs')
;(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  const page = await browser.newPage()
  page.setViewport({ width: 1200, height: 900 })
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 60000 })

  // Wait for conditions module to render (look for its title text)
  await page.waitForSelector('text/Conditions', { timeout: 10000 }).catch(() => {})
  // Give app a moment to settle
  await page.waitForTimeout(800)

  // Try to find the Conditions module by heading text then screenshot its bounding box
  const el = await page.$x("//h2[contains(., 'Conditions')]/ancestor::div[1] | //*[contains(@class,'conditions-body')]")
  if (el && el.length) {
    const box = await el[0].boundingBox()
    if (box) {
      await page.screenshot({ path: 'frontend/dev/conditions-signal.png', clip: { x: box.x, y: box.y, width: Math.min(box.width, 1100), height: Math.min(box.height + 40, 800) } })
    } else {
      await page.screenshot({ path: 'frontend/dev/conditions-signal.png', fullPage: false })
    }
  } else {
    await page.screenshot({ path: 'frontend/dev/conditions-signal.png', fullPage: true })
  }

  await browser.close()
  console.log('saved frontend/dev/conditions-signal.png')
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
