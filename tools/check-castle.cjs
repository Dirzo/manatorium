// Visual regression sheet and real-game smoke check; uses a local Playwright install.
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
(async () => {
  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true });
  let page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  const root = path.resolve(__dirname, '..');
  await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
  await page.locator('#tNew').click();
  await page.locator('.dcard').first().click();
  const coach = page.getByRole('button', { name: 'Got it', exact: true });
  if (await coach.isVisible()) await coach.click();
  await page.locator('#rosterToggle').click();
  await page.locator('#beginBtn').click();
  await page.waitForFunction(() => G.phase === 'siege' && G.B.t > 3);
  await page.screenshot({ path: path.join(root, 'docs/castle-game.png') });
  // Developer preview exercises actual rendering functions at every growth stage.
  const result = await page.evaluate(() => {
    const cases = [];
    for (let tier = 0; tier <= 10; tier++) for (const el of [null, ...Object.keys(CASTLE_PAL)]) {
      const run = { tech: { walls1: 1, walls2: 1, bastion: 1, rafters1: 1, rafters2: 1, ballista1: 1, ballista2: 1, ballista3: 1, fountain: 1 }, castleEl: el, stats: { bosses: Array(tier).fill({}) } };
      const cv = buildCastle(run);
      if (cv.width !== 110 || cv.height !== H) throw Error('Castle footprint changed');
      if (buildCastle(run) !== cv) throw Error('Castle cache missed');
      const flags = R.castleFlags, torches = R.castleTorches, glow = R.castleGlow;
      castlePreviewURL(el);
      if (R.castle !== cv || R.castleFlags !== flags || R.castleTorches !== torches || R.castleGlow !== glow) throw Error('Preview corrupted live castle');
      cases.push({ tier, el });
    }
    const stages = [0, 2, 5, 10].map(tier => {
      const run = { tech: {}, castleEl: null, stats: { bosses: Array(tier).fill({}) } };
      const cv = buildCastle(run), sheet = document.createElement('canvas'); sheet.width = 110; sheet.height = 246;
      const ctx = sheet.getContext('2d'); ctx.fillStyle = '#b8d4d7'; ctx.fillRect(0, 0, 110, 246); ctx.drawImage(cv, 0, 0); drawCastleLive(ctx, 0);
      return { tier, src: sheet.toDataURL() };
    });
    return { checked: cases.length, stages };
  });
  if (errors.length) throw Error(errors.join('\n'));
  await page.close();
  page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.setContent(`<html><body style="margin:0;padding:32px;background:#172231;color:#eadfc8;font-family:system-ui"><h1 style="margin:0">The rebuilt keep</h1><p>Stone, slate and heraldry · grows with every conquered horde</p><div style="display:flex;gap:24px">${result.stages.map(s => `<div><h2>${s.tier} bosses slain</h2><img style="width:330px;height:738px;image-rendering:pixelated" src="${s.src}"></div>`).join('')}</div></body></html>`);
  await page.screenshot({ path: path.join(root, 'docs/castle-stages.png'), fullPage: true });
  if (errors.length) throw Error(errors.join('\n'));
  console.log(`Passed: ${result.checked} tier/element combinations, cache and preview isolation; real game opened without JS errors.`);
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
