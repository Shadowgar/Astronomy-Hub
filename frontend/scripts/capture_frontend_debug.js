const puppeteer = require('puppeteer');
(async () => {
  const url = process.argv[2] || 'http://127.0.0.1:5173/';
  const outScreenshot = process.argv[3] || 'frontend_glass.png';
  const browser = await puppeteer.launch({headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox'], executablePath: '/usr/bin/google-chrome-stable'});
  const page = await browser.newPage();
  await page.setViewport({width: 1400, height: 800});
  const consoles = [];
  const errors = [];
  page.on('console', msg => consoles.push({type: msg.type(), text: msg.text()}));
  page.on('pageerror', err => errors.push({message: err.message, stack: err.stack}));
  try {
    await page.goto(url, {waitUntil: 'load', timeout: 10000});
  } catch (e) {
    /* ignore */
  }
  await page.screenshot({path: outScreenshot, fullPage: true});
  console.log(JSON.stringify({screenshot: outScreenshot, consoles, errors}, null, 2));
  await browser.close();
})();
