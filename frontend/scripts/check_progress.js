const { chromium } = require('playwright');

(async () => {
  const url = process.argv[2] || 'http://localhost:4173/progress';
  try {
    const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    try {
      await page.waitForSelector('h1', { timeout: 5000 });
    } catch (e) {
      // continue if h1 does not appear quickly
    }
    const currentUrl = page.url();
    console.log('PAGE URL:', currentUrl);
    const clientPathname = await page.evaluate(() => (window.location && window.location.pathname) || '');
    console.log('window.location.pathname:', clientPathname);
    const headings = await page.$$eval('h1', els => els.map(e => e.innerText));
    const text = await page.evaluate(() => document.body.innerText || document.body.textContent || '');
    if (headings.some(h => h.includes('Development Progress')) || (text && text.includes('Development Progress'))) {
      console.log('FOUND: Development Progress present on page');
      await browser.close();
      process.exit(0);
    } else {
      console.log('NOT_FOUND: Development Progress not present');
      console.log('H1s:', headings);
      console.log('PAGE_TEXT_START');
      console.log(text.slice(0, 2000));
      console.log('PAGE_TEXT_END');
      await browser.close();
      process.exit(2);
    }
  } catch (err) {
    console.error('ERROR', err);
    process.exit(3);
  }
})();
