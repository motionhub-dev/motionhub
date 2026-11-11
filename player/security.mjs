// Direct player navigation must be isolated as strongly as an embedded player.
import assert from 'node:assert/strict';
import {launch, reels, serve, DIST} from './chrome.mjs';
import {existsSync, readFileSync, statSync} from 'node:fs';
import {resolve, sep, extname} from 'node:path';
const server = await serve();
const browser = await launch();
try {
  const context = await browser.newContext();
  await context.addCookies([{name: 'securityProbe', value: 'private', url: server.base}]);
  const page = await context.newPage();
  const response = await page.goto(`${server.base}/play/${reels()[0]}/`, {waitUntil: 'load'});
  assert.match(response.headers()['content-security-policy'], /sandbox allow-scripts;/);
  const result = await page.evaluate(async () => {
    const denied = (fn) => { try { fn(); return false; } catch (e) { return e.name === 'SecurityError'; } };
    let networkDenied = false;
    try { await fetch('/api/me'); } catch { networkDenied = true; }
    return {cookieDenied: denied(() => document.cookie), storageDenied: denied(() => localStorage.getItem('securityProbe')), networkDenied, popupDenied: window.open('/you/') === null};
  });
  assert.deepEqual(result, {cookieDenied: true, storageDenied: true, networkDenied: true, popupDenied: true});
  await context.close();
  const isolated = await browser.newContext();
  const policy = /Content-Security-Policy: (.+)/.exec(readFileSync(resolve(DIST, '_headers'), 'utf8'))[1];
  await isolated.addCookies([{name: 'securityProbe', value: 'private', url: 'https://motionhub.dev'}]);
  await isolated.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin === 'https://motionhub.dev') return route.fulfill({contentType: 'text/html', body: `<iframe sandbox="allow-scripts" src="https://player.motionhub.dev/play/${reels()[0]}/"></iframe>`});
    if (url.origin !== 'https://player.motionhub.dev') return route.abort();
    let path = decodeURIComponent(url.pathname);
    if (path.endsWith('/')) path += 'index.html';
    const file = resolve(DIST, '.' + path);
    if (!file.startsWith(DIST + sep) || !existsSync(file) || !statSync(file).isFile()) return route.fulfill({status: 404, body: ''});
    const types = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2'};
    return route.fulfill({body: readFileSync(file), headers: {'content-type': types[extname(file)] ?? 'application/octet-stream', 'content-security-policy': policy, 'access-control-allow-origin': '*'}});
  });
  const host = await isolated.newPage();
  await host.goto('https://motionhub.dev');
  const frame = await (await host.waitForSelector('iframe')).contentFrame();
  assert.ok(frame, 'the isolated player frame exists');
  await frame.waitForSelector('.scrub');
  assert.ok(frame.url().startsWith('https://player.motionhub.dev/play/'));
  assert.match(await host.evaluate(() => document.cookie), /securityProbe=private/);
  assert.equal(await frame.evaluate(() => { try { document.cookie; return false; } catch (e) { return e.name === 'SecurityError'; } }), true);
  await isolated.close();
  console.log('Direct and cross-origin players load under sandbox; cookie, storage, account API and popup access is denied.');
} finally {
  await browser.close();
  await server.close();
}
