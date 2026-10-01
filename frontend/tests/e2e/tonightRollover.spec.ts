import { test, expect } from '@playwright/test'

test.use({timezoneId:'Pacific/Honolulu'})

for (const [explicit,resume] of [[false,false],[true,false],[false,true]]) {
 test(`Tonight noon rollover: ${explicit ? 'explicit date stays fixed' : resume ? 'resumed tab catches up' : 'implicit date fetches new night'}`, async ({page,request}) => {
  test.setTimeout(120_000)
  const plans: Record<string,unknown> = {}
  for (const date of ['2026-10-01','2026-10-02']) plans[date] = await (await request.get(`/api/tonight?date=${date}`)).json()
  await page.clock.install({time:new Date('2026-10-02T15:59:00Z')})
  const dates: (string|null)[] = []
  await page.route('**/api/tonight*', async route => {
   const date = new URL(route.request().url()).searchParams.get('date')
   dates.push(date)
   const current = await page.evaluate(() => Date.now() >= Date.parse('2026-10-02T16:00:00Z') ? '2026-10-02' : '2026-10-01')
   await route.fulfill({json:plans[date || current]})
  })
  await page.goto(explicit ? '/tonight?date=2026-10-01' : '/tonight')
  await expect(page.locator('.observe-context-card strong')).toHaveText('2026-10-01')
  if (resume) {
   await page.clock.setSystemTime(new Date('2026-10-02T16:01:00Z'))
   await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  } else await page.clock.runFor(60_000)
  await expect(page.locator('.observe-context-card strong')).toHaveText(explicit ? '2026-10-01' : '2026-10-02')
  expect(dates).toEqual(explicit ? ['2026-10-01'] : ['2026-10-01','2026-10-02'])
  if (!explicit) {
   await page.getByRole('link',{name:'Previous night'}).click()
   await expect(page).toHaveURL(/date=2026-10-01/)
   await expect(page.locator('.observe-context-card strong')).toHaveText('2026-10-01')
   await page.goBack()
   await expect(page.locator('.observe-context-card strong')).toHaveText('2026-10-02')
   await page.goForward()
   await expect(page.locator('.observe-context-card strong')).toHaveText('2026-10-01')
  }
 })
}
