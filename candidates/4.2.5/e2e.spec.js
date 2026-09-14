const { test, expect, devices } = require('@playwright/test');

test.use({ ...devices['iPhone 13'], browserName: 'webkit' });

test('Explorer 4.2.5 — WebKit/iPhone, telemetry privacy and release integrity', async ({ page }) => {
  const telemetryPosts = [];
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.route('**/rest/v1/client_error_events**', async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'POST,OPTIONS',
        'access-control-allow-headers': 'authorization,apikey,x-client-info,content-type,prefer',
      }});
      return;
    }
    if (request.method() === 'POST') {
      const body = request.postDataJSON();
      if (Array.isArray(body)) telemetryPosts.push(...body); else telemetryPosts.push(body);
      await route.fulfill({ status: 201, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '[]' });
      return;
    }
    await route.continue();
  });

  const response = await page.goto('http://127.0.0.1:4173/candidates/4.2.5/preview-loader.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle('Explorer 4.2.5');
  await page.waitForFunction(() => Boolean(window.Explorer?.telemetry), null, { timeout: 30000 });

  await expect(page.locator('#authView')).toBeVisible();
  await expect(page.locator('#authTabLogin')).toBeVisible();
  await expect(page.locator('#authTabSignup')).toBeVisible();
  await expect(page.locator('#authTabExplore')).toBeVisible();

  const layout = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    version: window.Explorer?.config?.APP_VERSION,
    maxEvents: window.Explorer?.telemetry?.maxEventsPerSession,
  }));
  expect(layout.version).toBe('4.2.5');
  expect(layout.maxEvents).toBe(12);
  expect(layout.innerWidth).toBe(390);
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.innerWidth + 1);
  expect(pageErrors).toEqual([]);

  await page.locator('#authTabExplore').click();
  await expect(page.locator('#screen-explore')).toHaveClass(/active/);

  await page.evaluate(async () => {
    const error = new Error('qa user@example.com eyJabcdefgh.abcdefgh.abcdefgh https://example.com/path?secret=value');
    await window.Explorer.telemetry.capture(error, { source: 'qa.redaction', filename: 'https://example.com/app.js?token=secret' });
    await window.Explorer.telemetry.capture(error, { source: 'qa.redaction', filename: 'https://example.com/app.js?token=secret' });
  });

  await expect.poll(() => telemetryPosts.length).toBe(1);
  expect(telemetryPosts[0].message).toContain('[email]');
  expect(telemetryPosts[0].message).toContain('[token]');
  expect(telemetryPosts[0].message).toContain('[redacted]');
  expect(JSON.stringify(telemetryPosts[0].metadata)).not.toContain('latitude');
  expect(JSON.stringify(telemetryPosts[0].metadata)).not.toContain('longitude');

  await page.evaluate(async () => {
    for (let i = 0; i < 20; i += 1) {
      await window.Explorer.telemetry.capture(new Error('qa-unique-' + i), { source: 'qa.limit.' + i });
    }
  });
  await expect.poll(() => telemetryPosts.length).toBe(12);
  expect(pageErrors).toEqual([]);
});
