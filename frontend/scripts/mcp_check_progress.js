// MCP init-page script for @playwright/mcp
// This file is evaluated by the MCP runner with a Playwright `page` object.
export default async function (page) {
  const url = process.env.TARGET_URL || 'http://localhost:4173/progress'
  try {
    await page.goto(url, { waitUntil: 'networkidle' })
  } catch (e) {
    console.error('NAV_ERROR', e && e.message)
    process.exit(3)
  }

  const currentUrl = page.url()
  console.log('PAGE URL:', currentUrl)
  const clientPathname = await page.evaluate(() => (window.location && window.location.pathname) || '')
  console.log('window.location.pathname:', clientPathname)
  const headings = await page.$$eval('h1', els => els.map(e => e.innerText))
  const text = await page.evaluate(() => document.body.innerText || document.body.textContent || '')

  if (headings.some(h => h.includes('Development Progress')) || (text && text.includes('Development Progress'))) {
    console.log('FOUND: Development Progress present on page')
    console.log('H1s:', JSON.stringify(headings))
    console.log('PAGE_TEXT_START')
    console.log(text.slice(0, 2000))
    console.log('PAGE_TEXT_END')
    process.exit(0)
  } else {
    console.log('NOT_FOUND: Development Progress not present')
    console.log('H1s:', JSON.stringify(headings))
    console.log('PAGE_TEXT_START')
    console.log(text.slice(0, 2000))
    console.log('PAGE_TEXT_END')
    process.exit(2)
  }
}
