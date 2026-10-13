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
  g.drawImage(art.img, art.x0, art.y0, art.w, art.h, shape.x, shape.y, shape.width, shape.height);
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
