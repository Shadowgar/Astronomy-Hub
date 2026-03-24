from playwright.sync_api import sync_playwright
import sys

html_path = 'file:///home/rocco/Astronomy-Hub/frontend/dev/pdp_preview.html'
out_path = 'frontend/dev/pdp_preview.png'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1200, "height": 600})
    page.goto(html_path)
    page.wait_for_timeout(500)
    page.screenshot(path=out_path, full_page=True)
    browser.close()

print('saved', out_path)
