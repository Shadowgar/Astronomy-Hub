from playwright.sync_api import sync_playwright
import os

HOST = 'http://localhost:5173'
OUT_DIR = 'frontend/dev/screenshots'
if not os.path.exists(OUT_DIR):
    os.makedirs(OUT_DIR, exist_ok=True)

MODES = ['Night', 'Day', 'Red']
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for mode in MODES:
        page = browser.new_page(viewport={"width": 1400, "height": 1000})
        # open blank then set localStorage so app reads mode on startup
        page.goto('about:blank')
        page.evaluate(f"localStorage.setItem('astronomyHub.mode', '{mode}')")
        page.goto(HOST)
        page.wait_for_timeout(800)
        out_path = os.path.join(OUT_DIR, f'mode-{mode.lower()}.png')
        page.screenshot(path=out_path, full_page=True)
        print('saved', out_path)
        page.close()
    browser.close()
