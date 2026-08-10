const { test, expect, devices } = require('@playwright/test');

test.use({
  ...devices['iPhone 13'],
  browserName: 'webkit',
});

test('Explorer 4.2.4 RC1 — WebKit/iPhone, UX and privacy-safe telemetry', async ({ page }) => {
  const telemetryPosts = [];
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.route('**/rest/v1/client_error_events**', async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'POST,OPTIONS',
          'access-control-allow-headers': 'authorization,apikey,x-client-info,content-type,prefer',
        },
      });
      return;
    }
    if (request.method() === 'POST') {
      const body = request.postDataJSON();
      if (Array.isArray(body)) telemetryPosts.push(...body);
      else telemetryPosts.push(body);
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*' },
        body: '[]',
      });
      return;
    }
    await route.continue();
  });

  const response = await page.goto('http://127.0.0.1:4173/candidates/4.2.4/preview-loader.html', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle('Explorer 4.2.4');
  await page.waitForFunction(() => Boolean(window.Explorer?.telemetry), null, { timeout: 30000 });

  await expect(page.locator('#authView')).toBeVisible();
  await expect(page.locator('#authTabLogin')).toBeVisible();
  await expect(page.locator('#authTabSignup')).toBeVisible();
  await expect(page.locator('#authTabExplore')).toBeVisible();
  await expect(page.locator('#authSubmit')).toBeVisible();

  const layout = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    version: window.Explorer?.config?.APP_VERSION,
    maxEvents: window.Explorer?.telemetry?.maxEventsPerSession,
  }));
  expect(layout.version).toBe('4.2.4');
  expect(layout.maxEvents).toBe(12);
  expect(layout.innerWidth).toBe(390);
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.innerWidth + 1);
  expect(pageErrors).toEqual([]);

  await page.locator('#authTabExplore').click();
  await expect(page.locator('#screen-explore')).toHaveClass(/active/);
  await expect(page.locator('#screen-map')).not.toHaveClass(/active/);

  await page.evaluate(async () => {
    const message = 'qa-telemetry user@example.com eyJabcdefgh.abcdefgh.abcdefgh https://example.com/path?secret=value';
    const error = new Error(message);
    await window.Explorer.telemetry.capture(error, {
      source: 'qa.redaction',
      filename: 'https://example.com/app.js?token=secret',
    });
    await window.Explorer.telemetry.capture(error, {
      source: 'qa.redaction',
      filename: 'https://example.com/app.js?token=secret',
    });
  });

  await expect.poll(() => telemetryPosts.filter((row) => row?.metadata?.source === 'qa.redaction').length, { timeout: 5000 }).toBe(1);
  const redacted = telemetryPosts.find((row) => row?.metadata?.source === 'qa.redaction');
  expect(redacted.message).toContain('[email]');
  expect(redacted.message).toContain('[token]');
  expect(redacted.message).toContain('secret=[redacted]');
  expect(redacted.message).not.toContain('user@example.com');
  expect(redacted.metadata.filename).toContain('token=[redacted]');
  expect(JSON.stringify(redacted.metadata)).not.toContain('latitude');
  expect(JSON.stringify(redacted.metadata)).not.toContain('longitude');
  expect(redacted.app_version).toBe('4.2.4');

  await page.evaluate(async () => {
    const jobs = [];
    for (let index = 0; index < 20; index += 1) {
      jobs.push(window.Explorer.telemetry.capture(new Error('qa-rate-' + index), { source: 'qa.rate.' + index }));
    }
    await Promise.all(jobs);
  });
  await page.waitForTimeout(700);
  expect(telemetryPosts.length).toBeLessThanOrEqual(12);
});
