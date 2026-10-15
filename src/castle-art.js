// Original element-specific raster sprites, embedded by the single-file build.
// Decode once; scale each whole sprite uniformly and cache the finished game canvas.
const CASTLE_ART = {};
async function loadCastleArt() {
  await Promise.all(Object.entries(CASTLE_ART_SOURCES).map(async ([el, src]) => {
    try {
      const img = new Image(); img.src = src; await img.decode();
      const scan = document.createElement('canvas'); scan.width = img.width; scan.height = img.height;
      const ctx = scan.getContext('2d'); ctx.drawImage(img, 0, 0);
      const pixels = ctx.getImageData(0, 0, img.width, img.height).data;
      let x0 = img.width, y0 = img.height, x1 = 0, y1 = 0;
      for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) {
        if (pixels[(y * img.width + x) * 4 + 3] < 128) continue;
        x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
      }
      CASTLE_ART[el] = { img, x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
      // Measure new assets themselves; each element has its own natural height.
      CASTLE_SHAPES[el].aspect = (x1-x0+1)/(y1-y0+1);
    } catch (error) { console.warn('Castle sprite could not load; using procedural fallback:', el, error); }
  }));
}
// Turn the detailed painting into game pixels that sit with the 16px heroes: area-average down to
// the on-screen size, hard alpha, a small per-castle palette, speckles merged, a little extra pop,
// and the same dark 1px outline every hero and foe wears. Cached per size.
function pixelCastle(art, w, h) {
  const key = w + 'x' + h; art.px = art.px || {}; if (art.px[key]) return art.px[key];
  const cv = document.createElement('canvas'); cv.width = w + 2; cv.height = h + 2;
  const g = cv.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  // two-step downscale keeps thin highlights from vanishing
  const mid = document.createElement('canvas'); mid.width = w * 2; mid.height = h * 2;
  const mg = mid.getContext('2d'); mg.imageSmoothingEnabled = true; mg.imageSmoothingQuality = 'high';
  mg.drawImage(art.img, art.x0, art.y0, art.w, art.h, 0, 0, w * 2, h * 2);
  g.drawImage(mid, 1, 1, w, h);
  const im = g.getImageData(0, 0, w + 2, h + 2), d = im.data, W2 = w + 2, N = W2 * (h + 2);
  const on = new Uint8Array(N), px = [];
  for (let i = 0; i < N; i++) if (d[i * 4 + 3] >= 110) {
    on[i] = 1;
    // a touch more saturation and lift, toward the brighter whimsical palette
    let r = d[i * 4], gg = d[i * 4 + 1], b = d[i * 4 + 2]; const l = (r + gg + b) / 3, sat = 1.22;
    r = l + (r - l) * sat; gg = l + (gg - l) * sat; b = l + (b - l) * sat;
    const lift = v => Math.max(0, Math.min(255, v * 1.06 + 6));
    d[i * 4] = lift(r); d[i * 4 + 1] = lift(gg); d[i * 4 + 2] = lift(b); px.push(i);
  }
  // k-means palette, seeded across the brightness range
  const K = 16, sorted = px.slice().sort((a, b) => (d[a*4]+d[a*4+1]+d[a*4+2]) - (d[b*4]+d[b*4+1]+d[b*4+2]));
  let cen = Array.from({ length: K }, (_, k) => { const i = sorted[Math.floor((k + 0.5) / K * sorted.length)]; return [d[i*4], d[i*4+1], d[i*4+2]]; });
  const lab = new Int16Array(N).fill(-1);
  for (let it = 0; it < 10; it++) {
    const acc = cen.map(() => [0, 0, 0, 0]);
    for (const i of px) { let best = 0, bd = 1e9; for (let k = 0; k < K; k++) { const c = cen[k], dr = d[i*4]-c[0], dg = d[i*4+1]-c[1], db = d[i*4+2]-c[2], dd = dr*dr*0.3 + dg*dg*0.59 + db*db*0.11; if (dd < bd) { bd = dd; best = k; } } lab[i] = best; const a = acc[best]; a[0] += d[i*4]; a[1] += d[i*4+1]; a[2] += d[i*4+2]; a[3]++; }
    cen = cen.map((c, k) => acc[k][3] ? [acc[k][0] / acc[k][3], acc[k][1] / acc[k][3], acc[k][2] / acc[k][3]] : c);
  }
  // merge lone speckles into their most common neighbour colour
  const nb = [-1, 1, -W2, W2];
  for (let pass = 0; pass < 2; pass++) for (const i of px) {
    const cnt = {}; let same = 0, n = 0;
    for (const o of nb) { const j = i + o; if (!on[j]) continue; n++; if (lab[j] === lab[i]) same++; cnt[lab[j]] = (cnt[lab[j]] || 0) + 1; }
    if (n >= 3 && same === 0) { let bk = lab[i], bc = 0; for (const k in cnt) if (cnt[k] > bc) { bc = cnt[k]; bk = +k; } lab[i] = bk; }
  }
  for (let i = 0; i < N; i++) {
    if (on[i]) { const c = cen[lab[i]]; d[i*4] = c[0]; d[i*4+1] = c[1]; d[i*4+2] = c[2]; d[i*4+3] = 255; }
    else d[i*4+3] = 0;
  }
  // 1px outline around the silhouette, like the sprites
  const o = [0x1a, 0x12, 0x30];
  for (let y = 0; y < h + 2; y++) for (let x = 0; x < W2; x++) { const i = y * W2 + x; if (on[i]) continue;
    if ((x > 0 && on[i-1]) || (x < W2-1 && on[i+1]) || (y > 0 && on[i-W2]) || (y < h+1 && on[i+W2])) { d[i*4] = o[0]; d[i*4+1] = o[1]; d[i*4+2] = o[2]; d[i*4+3] = 255; } }
  g.putImageData(im, 0, 0);
  return (art.px[key] = cv);
}
function drawArtCastle(run) {
  const el = run.castleEl, art = CASTLE_ART[el], T = run.tech || {};
  const tier = Math.min(10, castleTier(run)), rf = rafterSlots(run);
  const key = ['sprite16', el, tier, rf, ...['walls1', 'walls2', 'bastion', 'ballista1', 'ballista2', 'ballista3', 'fountain'].map(k => !!T[k])].join();
  if (R.castleKey === key) return R.castle;
  const cv = document.createElement('canvas'); cv.width = 110; cv.height = H;
  const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  // One uniform scale for the entire sprite: no sliced or stretched sections.
  const shape = castleShape(run);
  const base = shape.baseY;
  g.drawImage(pixelCastle(art, shape.width, shape.height), shape.x - 1, shape.y - 1);
  R.castleFlags = []; R.castleTorches = []; R.castleGlow = [];
  const p = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const deck = { fire: ['#73727e', '#b99b77', '#393644'], water: ['#c7d2cd', '#edf0d9', '#6c8b91'], nature: ['#987044', '#c69c64', '#58432d'] }[el] || [CASTLE_PAL[el][1], CASTLE_PAL[el][0], CASTLE_PAL[el][2]];
  if (rf) {
    // Mark unlocked positions on the sprite's own decks; don't redraw its architecture.
    for (let i = 0; i < rf; i++) { const slot = rafterPosition(run, i); p(slot.x - 2, slot.y + 1, 5, 1, '#e6ba63'); }
  }
  if (T.walls1) {
    for (const x of [shape.x + 4, shape.x + shape.width - 13]) { p(x, base - 31, 3, T.walls2 ? 21 : 11, deck[0]); p(x, base - 31, 1, T.walls2 ? 21 : 11, deck[1]); }
  }
  if (T.ballista1) {
    const by = castleRafterY(run) + 25;
    p(78, by, 18, 3, deck[2]); p(80, by + 3, 2, 7, deck[2]); p(91, by + 3, 2, 7, deck[2]);
    p(82, by - 3, 17, 2, '#c6cfcd'); p(94, by - 7, 2, 12, T.ballista3 ? '#e3b764' : T.ballista2 ? '#99c5d2' : '#aaa7a0');
  }
  if (T.fountain) { const x = Math.min(100, shape.x + shape.width - 7); p(x, base - 13, 8, 4, deck[2]); p(x + 1, base - 13, 6, 2, '#92dfea'); p(x + 3, base - 20, 2, 8, '#d8f9ed'); }
  for (let y = base + 7; y < H; y += 8) { p(90, y - 8, 7, 14, deck[2]); p(92, y - 10, 3, 3, deck[1]); }
  if (T.bastion) for (let y = base + 6; y < H; y += 9) { p(97, y, 4, 2, '#c3b888'); p(99, y, 2, 1, '#eef0da'); }
  if (el === 'fire') R.castleTorches.push({ x: 29, y: shape.y + 15 });
  if (tier >= 5) R.castleGlow.push({ x: shape.x + (el === 'nature' ? 28 : 18), y: shape.y + 22, col: ELEMENTS[el].col });
  for (let i = 0; i < tier; i++) drawTrophy(g, shape.x + 3 + i * 7, base - 2, i);
  R.castleKey = key; R.castle = cv; return cv;
}
