import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const origin = 'http://127.0.0.1:14329';
// Own the server process: never reuse an unrelated server on this port.
const server = spawn(process.execPath, ['node_modules/astro/bin/astro.mjs', 'preview', '--host', '127.0.0.1', '--port', '14329'], { stdio: ['ignore', 'pipe', 'pipe'], shell: false });
let logs = '';
let startupError;
server.on('error', (error) => { startupError = error; });
server.stdout.on('data', (data) => { logs += data; });
server.stderr.on('data', (data) => { logs += data; });
let browser;
try {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (startupError) throw startupError;
    if (server.exitCode !== null) throw new Error(`Preview exited: ${logs}`);
    if (logs.includes('14330') || /already in use/i.test(logs)) throw new Error(`Preview port unavailable: ${logs}`);
    if (logs.includes(origin)) break;
    await delay(100);
  }
  assert.ok(logs.includes(origin), `Preview did not start: ${logs}`);
  browser = await chromium.launch();
  await mkdir('output/playwright', { recursive: true });
  for (const mobile of [false, true]) {
    const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, isMobile: mobile, hasTouch: mobile });
    // Verification is local-only; unexpected external requests are blocked and fail.
    const errors = [];
    await context.route('**/*', (route) => {
      const url = route.request().url();
      if (url.startsWith(origin + '/')) return route.continue();
      errors.push(`External request: ${url}`);
      return route.abort();
    });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    const activate = (locator) => mobile ? locator.tap() : locator.click();
    const response = await page.goto(origin);
    assert.equal(response.status(), 200);
    await page.getByRole('heading', { level: 1 }).waitFor();
    await activate(page.getByRole('navigation').getByRole('link', { name: 'Leaderboard v2' }));
    const rows = page.locator('tbody tr');
    await rows.first().waitFor();
    const count = await rows.count();
    assert.ok(count > 0, 'Leaderboard must show preserved results');
    const search = page.getByPlaceholder('Model or provider');
    await search.fill('NO_SUCH_MODEL_SMOKE_CHECK');
    await page.waitForFunction(() => document.querySelectorAll('tbody tr').length === 0);
    await search.fill('');
    await rows.first().waitFor();
    assert.equal(await rows.count(), count);
    await activate(rows.first().getByRole('link', { name: 'Open', exact: true }));
    await activate(page.getByRole('link', { name: 'View transcripts' }));
    await page.getByText('Raw Markdown transcripts are shown only when a preserved source file exists.').waitFor();
    assert.ok(await page.locator('main').innerText().then(text => text.length > 500), 'Transcript page must contain evidence');
    for (const [route, heading] of [['methodology', 'Low-scaffold introspective latitude benchmark'], ['downloads', 'Data and methodology files']]) {
      const result = await page.goto(`${origin}/${route}/`);
      assert.equal(result.status(), 200);
      await page.getByRole('heading', { name: heading, exact: true }).waitFor();
    }
    const csv = await context.request.get(`${origin}/downloads/model-results.csv`);
    assert.equal(csv.status(), 200);
    assert.ok((await csv.text()).includes('model_id'));
    await page.screenshot({ path: `output/playwright/${mobile ? 'mobile' : 'desktop'}.png`, fullPage: true });
    assert.deepEqual(errors, [], 'Browser must have no runtime, console, HTTP, or external-request errors');
    await context.close();
    console.log(`PASS: ${mobile ? 'mobile touch' : 'desktop pointer'} navigation, search, report, transcripts, direct routes, CSV, browser errors`);
  }
} finally {
  await browser?.close();
  server.kill();
}
