#!/usr/bin/env node
// A smoke test of every reel's player, as a viewer gets it: after player/build.mjs, each /play/<id>/ is opened in a headless
// Chrome under the same content security policy the site serves it with (dist/_headers), and scrubbed to four moments. A reel
// fails when its page throws or logs an error, a request fails or is refused, a moment draws nothing, or all four draw the same
// picture. It is what tells, when the runtime, the player or a motion changes, which reels it broke (HUB.md, "Reels").
//
//   node player/smoke.mjs [id …]   after player/build.mjs; ids test only those. CHROME names the browser, else
//                                  the system's Chrome
import {blank, differ, launch, look, reels, serve, watch} from './chrome.mjs';

/** When in a reel to look, as fractions of its length */
const MOMENTS = [0.12, 0.37, 0.62, 0.87];

async function test(browser, base, id) {
  const page = await browser.newPage({viewport: {width: 960, height: 540}});
  // a reel thick with blur draws slowly in software: slow is not broken here, but stuck is
  page.setDefaultTimeout(120_000);
  const problems = watch(page, base);
  try {
    // asked to play, as the motion's page asks: a reel in 3D does not wait for a tap
    await page.goto(`${base}/play/${id}/?autoplay=1`, {waitUntil: 'load', timeout: 60_000});
    await page.waitForSelector('.scrub', {timeout: 30_000});
    await page.keyboard.press('k');
    const length = Number(await page.getAttribute('.scrub', 'max'));
    if (!(length > 0)) problems.push('has no length');
    const frames = [];
    for (const at of MOMENTS) {
      await page.evaluate((t) => {
        const s = document.querySelector('.scrub');
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(s, String(t));
        s.dispatchEvent(new Event('input', {bubbles: true}));
      }, length * at);
      await page.waitForTimeout(400);
      // the controls are the player's, not the reel's
      await page.evaluate(() => { for (const el of document.querySelectorAll('.bar, .big')) el.style.visibility = 'hidden'; });
      const shot = await look(await page.screenshot());
      await page.evaluate(() => { for (const el of document.querySelectorAll('.bar, .big')) el.style.visibility = ''; });
      if (blank(shot)) problems.push(`draws nothing at ${(length * at).toFixed(1)} s`);
      frames.push(shot.grey);
    }
    if (frames.length && !frames.some((f) => differ(f, frames[0]))) problems.push('draws the same picture at every moment');
  } catch (e) {
    problems.push(`does not play: ${e.message.split('\n')[0]}`);
  }
  await page.close();
  return problems;
}

const asked = process.argv.slice(2);
const ids = asked.length ? asked : reels();
if (!ids.length) { console.error('no reels in dist/play: run npm run build first'); process.exit(1); }
const server = await serve(), base = server.base;
const browser = await launch();
let failed = 0;
for (const id of ids) {
  const problems = await test(browser, base, id);
  if (problems.length) { failed++; for (const p of [...new Set(problems)]) console.log(`${id}  ${p}`); }
  else console.log(`${id}  ok`);
}
await browser.close();
server.close();
console.log(`${ids.length} reel(s), ${failed} failed`);
process.exit(failed ? 1 : 0);
