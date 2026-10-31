// ===== Procedural pixel sprites (original art, built from layered shapes) =====
const OUTLINE = '#1a1230';

function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgbToHex(r, g, b) { return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
function shade(h, f) { const [r, g, b] = hexToRgb(h); return f < 0 ? rgbToHex(r * (1 + f), g * (1 + f), b * (1 + f)) : rgbToHex(r + (255 - r) * f, g + (255 - g) * f, b + (255 - b) * f); }

class PixGrid {
  // ox/oy: where the 20x20 body sits inside a bigger grid (starred legends get room for their grown weapon)
  constructor(w, h, ox = 0, oy = 0) { this.w = w; this.h = h; this.ox = ox; this.oy = oy; this.p = new Array(w * h).fill(null); this.flat = new Set(); }
  set(x, y, c, flat) { x = Math.round(x) + this.ox; y = Math.round(y) + this.oy; if (x < 0 || y < 0 || x >= this.w || y >= this.h || !c) return; this.p[y * this.w + x] = c; if (flat) this.flat.add(y * this.w + x); else this.flat.delete(y * this.w + x); }
  get(x, y) { return this.raw(x + this.ox, y + this.oy); }
  raw(x, y) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null; return this.p[y * this.w + x]; }
  rect(x0, y0, x1, y1, c, flat) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, c, flat); }
  clear(x, y) { x += this.ox; y += this.oy; if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.p[y * this.w + x] = null; }
  finish() {
    // soft volume: back (left) edge darker, top edge lighter
    const out = this.p.slice();
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const i = y * this.w + x, c = this.p[i]; if (!c || this.flat.has(i)) continue;
      if (!this.raw(x - 1, y)) out[i] = shade(c, -0.22);
      else if (!this.raw(x, y - 1)) out[i] = shade(c, 0.18);
      else if (!this.raw(x, y + 1)) out[i] = shade(c, -0.12);
    }
    // outline
    const o = out.slice();
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (out[y * this.w + x]) continue;
      const n = (xx, yy) => xx >= 0 && yy >= 0 && xx < this.w && yy < this.h && out[yy * this.w + xx];
      if (n(x - 1, y) || n(x + 1, y) || n(x, y - 1) || n(x, y + 1)) o[y * this.w + x] = OUTLINE;
    }
    this.p = o; return this;
  }
  toCanvas(flip, white) {
    const c = document.createElement('canvas'); c.width = this.w; c.height = this.h;
    const ctx = c.getContext('2d'); const img = ctx.createImageData(this.w, this.h);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const col = this.p[y * this.w + x]; if (!col) continue;
      const tx = flip ? this.w - 1 - x : x; const j = (y * this.w + tx) * 4;
      const [r, g, b] = white ? [255, 255, 255] : hexToRgb(col);
      img.data[j] = r; img.data[j + 1] = g; img.data[j + 2] = b; img.data[j + 3] = 255;
    }
    ctx.putImageData(img, 0, 0); return c;
  }
}

function drawWeapon(g, s, type, hx, hy, atk) {
  const metal = s.metal || '#dfe6f5', wood = '#9a6332', gold = '#ffcf3a';
  switch (type) {
    case 'sword':
      if (!atk) { g.rect(hx + 1, hy - 8, hx + 1, hy - 2, metal); g.set(hx + 1, hy - 9, '#ffffff'); g.rect(hx, hy - 1, hx + 2, hy - 1, gold); g.set(hx + 1, hy, wood); }
      else { g.rect(hx + 2, hy, hx + 7, hy, metal); g.set(hx + 8, hy, '#ffffff'); g.rect(hx + 1, hy - 1, hx + 1, hy + 1, gold); }
      break;
    case 'axe':
      if (!atk) { g.rect(hx + 1, hy - 8, hx + 1, hy + 1, wood); g.rect(hx + 2, hy - 8, hx + 4, hy - 5, metal); g.set(hx + 4, hy - 9, metal); g.set(hx + 4, hy - 4, metal); }
      else { g.rect(hx + 1, hy, hx + 5, hy, wood); g.rect(hx + 5, hy - 3, hx + 7, hy - 1, metal); g.rect(hx + 6, hy + 1, hx + 7, hy + 1, metal); }
      break;
    case 'hammer':
      if (!atk) { g.rect(hx + 1, hy - 6, hx + 1, hy + 2, wood); g.rect(hx - 1, hy - 10, hx + 3, hy - 6, metal); g.rect(hx - 1, hy - 8, hx + 3, hy - 8, shade(metal, -0.25)); }
      else { g.rect(hx + 1, hy, hx + 4, hy, wood); g.rect(hx + 4, hy - 3, hx + 7, hy + 2, metal); g.rect(hx + 5, hy - 3, hx + 5, hy + 2, shade(metal, -0.25)); }
      break;
    case 'staff': {
      const gem = s.gem || '#7cf0ff';
      g.rect(hx + 1, hy - 8, hx + 1, hy + 5, wood);
      g.rect(hx, hy - 11, hx + 2, hy - 9, gem, true); g.set(hx + 1, hy - 10, '#ffffff', true);
      if (atk) { g.set(hx + 3, hy - 10, gem, true); g.set(hx - 1, hy - 10, gem, true); g.set(hx + 1, hy - 12, gem, true); }
      break; }
    case 'totem': {
      const gem = s.gem || '#ff5d8f';
      g.rect(hx + 1, hy - 7, hx + 1, hy + 5, wood);
      g.rect(hx - 1, hy - 11, hx + 3, hy - 8, '#f1ecdc'); g.set(hx, hy - 10, OUTLINE, true); g.set(hx + 2, hy - 10, OUTLINE, true);
      g.set(hx - 1, hy - 7, gem, true); g.set(hx + 3, hy - 7, gem, true);
      if (atk) { g.set(hx + 4, hy - 12, gem, true); g.set(hx - 2, hy - 12, gem, true); }
      break; }
    case 'bow':
      g.rect(hx + 3, hy - 5, hx + 3, hy + 3, wood); g.set(hx + 2, hy - 6, wood); g.set(hx + 2, hy + 4, wood); g.set(hx + 1, hy - 7, wood); g.set(hx + 1, hy + 5, wood);
      if (!atk) g.rect(hx + 1, hy - 6, hx + 1, hy + 4, '#f4f1ff', true);
      else { g.set(hx, hy - 5, '#f4f1ff', true); g.set(hx - 1, hy - 1, '#f4f1ff', true); g.set(hx, hy + 3, '#f4f1ff', true); g.rect(hx - 1, hy - 1, hx + 6, hy - 1, '#c9a06a'); g.set(hx + 7, hy - 1, '#e8eefc'); }
      break;
    case 'daggers':
      if (!atk) { g.rect(hx + 1, hy - 4, hx + 1, hy - 1, metal); g.set(hx + 1, hy, gold); g.rect(hx - 8, hy - 3, hx - 8, hy, metal); }
      else { g.rect(hx + 2, hy - 1, hx + 6, hy - 1, metal); g.set(hx + 1, hy - 1, gold); g.rect(hx + 1, hy + 2, hx + 4, hy + 2, metal); }
      break;
    case 'spear':
      if (!atk) { g.rect(hx + 1, hy - 10, hx + 1, hy + 5, wood); g.rect(hx + 1, hy - 13, hx + 1, hy - 11, metal); g.set(hx, hy - 11, metal); g.set(hx + 2, hy - 11, metal); }
      else { g.rect(hx - 3, hy, hx + 4, hy, wood); g.rect(hx + 5, hy, hx + 7, hy, metal); g.set(hx + 5, hy - 1, metal); g.set(hx + 5, hy + 1, metal); }
      break;
    case 'cannon':
      g.rect(hx - 3, hy - 3, hx + (atk ? 4 : 3), hy - 1, metal); g.rect(hx + (atk ? 5 : 4), hy - 4, hx + (atk ? 5 : 4), hy, shade(metal, -0.3));
      g.rect(hx - 3, hy, hx - 2, hy, wood);
      if (atk) { g.set(hx + 6, hy - 2, '#ffde3a', true); g.set(hx + 7, hy - 3, '#ff8a3a', true); g.set(hx + 7, hy - 1, '#ff8a3a', true); }
      break;
    case 'scythe': {
      const m = s.metal || '#e8ffd0';
      if (!atk) { g.rect(hx + 1, hy - 11, hx + 1, hy + 5, '#3a2a2a'); g.rect(hx - 5, hy - 12, hx + 1, hy - 12, m); g.rect(hx - 6, hy - 11, hx - 4, hy - 11, m); g.set(hx - 7, hy - 10, m); g.set(hx - 2, hy - 11, '#ffffff', true); }
      else { g.rect(hx - 2, hy - 2, hx + 6, hy - 2, '#3a2a2a'); g.rect(hx + 6, hy - 1, hx + 6, hy + 5, m); g.rect(hx + 7, hy, hx + 7, hy + 3, m); g.set(hx + 5, hy + 5, m); }
      break; }
    case 'orb': {
      const gem = s.gem || '#ffd84a', oy = atk ? -3 : -1;
      g.rect(hx + 1, hy - 3 + oy, hx + 3, hy - 1 + oy, gem, true); g.set(hx + 1, hy - 3 + oy, '#ffffff', true); g.set(hx + 2, hy - 4 + oy, gem, true); g.set(hx + 4, hy - 2 + oy, gem, true); g.set(hx + 2, hy + oy, shade(gem, -0.3), true);
      if (atk) { g.set(hx + 5, hy - 5, '#ffffff', true); g.set(hx, hy - 7, '#ffffff', true); }
      break; }
    case 'shield': {
      const off = atk ? 2 : 0, a2 = s.armor2 || '#6c7fb8';
      g.rect(hx - 1 + off, hy - 4, hx + 3 + off, hy + 2, metal); g.rect(hx + off, hy + 3, hx + 2 + off, hy + 3, metal);
      g.rect(hx + off, hy - 3, hx + 2 + off, hy + 1, a2); g.set(hx + 1 + off, hy - 1, s.cape || s.cloth || '#ffcf3a', true);
      break; }
  }
}

// Held weapons drawn from small pixel maps. Each map has its hand cell (o: [col,row]) and where
// that hand sits on the 20x20 body (at: [x,y], defaults below). Letters pick colours:
// M metal, D dark metal, L sheen (flat), W wood, w dark wood, G gold, g dark gold, R gem,
// S bowstring, a arrow shaft, f fletching, H hand (skin), C chain, N/I/X iron mid/light/dark,
// B armour trim, A emblem, k dark haft, F/E muzzle flash.
const WPN = {
  sword: {
    i: { o: [1, 9], r: ['.L..', '.LM.', '.LM.', '.LM.', '.LM.', '.LM.', '.LM.', '.LD.', 'GGGG', '.H..', '.g..'] },
    a: { o: [2, 5], r: ['......L', '.....LM', '....LM.', '...LM..', '.GLM...', '..HG...', '.g.....'] } },
  cutlass: {
    i: { o: [1, 9], r: ['...pP', '..pPP', '..pP.', '.pP..', '.pP..', '.pP..', '.pQ..', 'GGGG.', 'G..G.', 'GH.G.', '.g...'] },
    a: { o: [2, 5], r: ['.....pP', '.....pP', '....pP.', '...pP..', '.GpP...', 'G.HG...', '.GG....'] } },
  axe: {
    i: { o: [1, 8], r: ['.M..L', '.WMML', 'DWMML', '.WMML', '.W..L', '.W...', '.W...', '.W...', '.H...', '.W...', '.w...'] },
    a: { o: [2, 3], r: ['......L', '....MML', '....MML', 'wWHWWML', '....MML', '......L'] } },
  greataxe: {
    i: { o: [2, 12], r: ['..M...L', '.LWMMML', 'LMWMMML', 'LMWMMML', 'LMWMMML', '.LWMMML', '..W..ML', '..W...L', '..W....', '..W....', '..W....', '..W....', '..H....', '..W....', '..w....'], at: [15, 13] },
    a: { o: [2, 4], r: ['....L.L', '....MMM', '....MMM', '.....M.', 'wWHWWMW', '.....M.', '....MMM', '....MMM', '....L.L'] } },
  hammer: {
    i: { o: [1, 8], r: ['.M...', 'MMMMD', 'MGGMD', 'MMMMD', '.W...', '.W...', '.W...', '.W...', '.H...', '.W...', '.w...'] },
    a: { o: [2, 2], r: ['....MML', '....MGL', 'wWHWMGL', '....MGL', '....MML'] } },
  maul: {
    i: { o: [2, 12], r: ['.LLLL.', 'DMMMMD', 'DGGGGD', 'DMMMMD', '.DDDD.', '..W...', '..W...', '..W...', '..W...', '..W...', '..W...', '..W...', '..H...', '..W...', '..w...'] },
    a: { o: [2, 3], r: ['...DMML', '...DMML', '...DGGL', 'wWHDGGL', '...DGGL', '...DMML', '...DMML'] } },
  cleaver: {
    i: { o: [0, 7], r: ['XNNI', 'XKNI', 'XNNI', 'XNNI', 'XNNI', 'XXXI', 'W...', 'H...', 'w...'] },
    a: { o: [2, 0], r: ['wWHXXXX', '...NKNN', '...NNNN', '...NNNN', '...IIII'] } },
  flail: {
    i: { o: [0, 9], r: ['..M.', '.MLM', 'MMMD', '.MDD', '..M.', '.C..', 'C...', 'W...', 'W...', 'H...', 'w...'] },
    a: { o: [0, 4], r: ['...M.', '..MLM', '.CMMD', '.W.M.', 'H....'] } },
  scythe: {
    i: { o: [7, 13], r: ['..LLLLMM', '.LMMMMMD', 'LM.....k', 'L......k', '.......k', '.......k', '.......k', '.......k', '.......k', '.......k', '.......k', '.......k', '.......k', '.......H', '.......k', '.......k'] },
    a: { o: [5, 0], r: ['kkkkkHkkkM', '.......LMM', '......LMM.', '.....LM...', '....L.....'] } },
  daggers: {
    i: { o: [1, 4], r: ['.L.', '.LM', '.LM', 'GGG', '.H.'] },
    a: { o: [0, 1], r: ['.GLL.', 'HGMML', '.G...'] },
    b: { o: [1, 0], r: ['.H.', 'GGG', 'LM.', 'L..'] } },
  spear: {
    i: { o: [1, 12], r: ['.L.', 'LMM', 'LMD', '.M.', 'GGG', '.W.', '.W.', '.W.', '.W.', '.W.', '.W.', '.W.', '.H.', '.W.', '.W.', '.w.'] },
    a: { o: [3, 1], r: ['.....M..', 'wWWHWMML', '.....M..'] } },
  shield: {
    i: { o: [2, 5], r: ['MMMMMM', 'MBBBBM', 'MBAABM', 'MBAABM', 'MBBBBM', '.MBBM.', '.MBBM.', '..MM..'] },
    a: { o: [1, 4], r: ['MMMMMM', 'MBBBBM', 'MBAABM', 'MBAABM', 'MBBBBM', '.MBBM.', '.MBBM.', '..MM..'], at: [15, 11] } },
  bow: {
    i: { o: [3, 5], r: ['.Gw...', 'S.WW..', 'S..W..', 'S..WW.', 'S...W.', 'SaaHWL', 'S...W.', 'S..WW.', 'S..W..', 'S.WW..', '.Gw...'], at: [17, 13] },
    a: { o: [5, 5], r: ['...Gw...', '..S.WW..', '..S..W..', '.S...WW.', '.S....W.', 'SfaaaHWL', '.S....W.', '.S...WW.', '..S..W..', '..S.WW..', '...Gw...'], at: [17, 12] } },
  crossbow: {
    i: { o: [3, 4], r: ['....Gw.', '....SW.', '..aaaWL', 'wWWWWWD', 'wW.HwW.', '....SW.', '....Gw.'] },
    a: { o: [2, 4], r: ['....Gw.', '....SW.', '.....WF', 'wWWWWWD', 'wWH.wW.', '....SW.', '....Gw.'] } },
  cannon: {
    i: { o: [4, 4], r: ['.......X', '..IIIIIN', '..NNGNNN', 'wWXXGXXX', 'wW..H..X'] },
    a: { o: [4, 4], r: ['.......X.', '..IIIIINE', '..NNGNNNF', 'wWXXGXXXE', 'wW..H..X.'] } },
  kingclub: {
    i: { o: [1, 11], r: ['G.G.G', 'GGRGG', 'WWWWW', 'MWwWM', 'WWWWW', 'MWWwM', '.WWW.', '.WW..', '.W...', '.W...', '.W...', '.H...', '.w...'] },
    a: { o: [2, 3], r: ['....M.G', '...WWWG', '..WWwWR', 'wWHWWWG', '..WWWWG', '...WwWG', '....M.G'] } },
  pan: {
    i: { o: [2, 9], r: ['.XXX.', 'XNNNX', 'XNINX', 'XNNNX', '.XXX.', '..W..', '..W..', '..W..', '..W..', '..H..'], at: [17, 13] },
    a: { o: [0, 3], r: ['..XX.', '.XNNX', '.XNIX', 'HWNNX', '.XNNX', '..XX.'] } },
};
function weaponPal(s) {
  const m = s.metal || '#dfe6f5';
  return { M: [m], D: [shade(m, -0.35)], L: [shade(m, 0.6), 1], W: ['#9a6332'], w: ['#6b4022', 1], G: ['#ffcf3a'], g: ['#c8901a', 1],
    R: ['#ff3d6e', 1], S: ['#f4f1ff', 1], a: ['#c9a06a', 1], f: ['#ff5d6e', 1], H: [s.skin], C: ['#9a9ab0', 1], K: [OUTLINE, 1],
    N: ['#6a7488'], I: ['#b4bed2', 1], X: ['#3e465a'], B: [s.armor2 || '#6c7fb8'], A: [s.cape || s.cloth || '#ffcf3a', 1],
    k: ['#3a2a2a'], P: ['#dfe6f5'], p: ['#ffffff', 1], Q: ['#9aa4b8'], F: ['#ffde3a', 1], E: ['#ff8a3a', 1] };
}
function drawWpnMap(g, map, pal, ax, ay) {
  const [ox, oy] = map.o;
  map.r.forEach((row, ry) => { for (let rx = 0; rx < row.length; rx++) { const p = pal[row[rx]]; if (p) g.set(ax + rx - ox, ay + ry - oy, p[0], !!p[1]); } });
}

// Star levels (Cam 2026-10-24): a 2★ legend is polished silver, a 3★ legend gilded gold, and each step grows the weapon.
// Starred sprites are built on a 32x34 grid with the 20x20 body at (6,10), so a grown weapon has room past the body.
const STAR_PAD = { w: 32, h: 34, l: 6, t: 10 };
const STAR_LOOK = [null,
  { ws: 1.3, metal: '#eef6ff', trim: '#c8d6f8', trimMix: 0.8, tint: '#e8f0ff', tintMix: 0.18, gem: 0.35 },
  { ws: 1.6, metal: '#ffd94a', trim: '#f0b030', trimMix: 0.9, tint: '#ffe08a', tintMix: 0.22, gem: '#fff3a0', cape: '#ffcf3a' }];
function starSpec(spec, star, ws) {
  const L = STAR_LOOK[star - 1]; if (!L) return spec;
  const lerp = (a, b, k) => { const A = hexToRgb(a), B = hexToRgb(b); return rgbToHex(A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k, A[2] + (B[2] - A[2]) * k); };
  const o = Object.assign({}, spec, { star, ws: ws || L.ws, metal: L.metal });
  o.armor = lerp(spec.armor, L.tint, L.tintMix); o.armor2 = lerp(spec.armor2 || shade(spec.armor, -0.3), L.trim, L.trimMix);
  if (spec.gem) o.gem = typeof L.gem === 'string' ? L.gem : shade(spec.gem, L.gem);
  if (spec.cape && L.cape) o.cape = lerp(spec.cape, L.cape, 0.45);
  if (spec.plume && L.cape) o.plume = L.cape;
  return o;
}
// draws a weapon scaled up around the hand (nearest-neighbour, so it stays pixel art); ws 1 draws it as is
function growWeapon(g, ws, ax, ay, draw) {
  if (!ws || ws <= 1) return draw(g, ax, ay);
  const N = 64, C = 32, T = new PixGrid(N, N); draw(T, C, C);
  let x0 = N, x1 = -1, y0 = N, y1 = -1;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (T.p[y * N + x]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  if (x1 < 0) return;
  for (let Y = Math.floor(ay + (y0 - C - 0.5) * ws); Y <= Math.ceil(ay + (y1 - C + 0.5) * ws); Y++)
    for (let X = Math.floor(ax + (x0 - C - 0.5) * ws); X <= Math.ceil(ax + (x1 - C + 0.5) * ws); X++) {
      let sx = C + Math.round((X - ax) / ws), sy = C + Math.round((Y - ay) / ws);
      // the hand stays one pixel: stretched copies of it take the haft next to it instead
      if (sx === C && sy === C && (X !== ax || Y !== ay)) { const dx = Math.sign(X - ax), dy = Math.sign(Y - ay);
        const n = [[0, dy], [dx, 0], [0, -dy || 1], [0, 1], [0, -1]].find(([a, b]) => (a || b) && T.raw(C + a, C + b)); if (!n) continue; sx += n[0]; sy += n[1]; }
      const i = sy * N + sx, c = sx >= 0 && sy >= 0 && sx < N && sy < N ? T.p[i] : null; if (c) g.set(X, Y, c, T.flat.has(i));
    }
}
// where a sprite frame lands when its 20x20 body is drawn fs pixels tall with its feet at (cx, by), as in drawUnit
function frameBox(img, cx, by, fs) {
  const hd = img.hd || 1, iw = img.width / hd, ih = img.height / hd;
  if (iw !== STAR_PAD.w || ih !== STAR_PAD.h) return { x: cx - fs / 2, y: by - fs + 1, w: fs, h: fs };
  const k = fs / 20, w = Math.round(iw * k), h = Math.round(ih * k);
  return { x: cx - w / 2, y: by + 1 - fs - Math.round(STAR_PAD.t * k), w, h };
}

function genHumanoid(s, frame) {
  const g = s.star ? new PixGrid(STAR_PAD.w, STAR_PAD.h, STAR_PAD.l, STAR_PAD.t) : new PixGrid(20, 20), ws = s.ws || 1;
  const by = frame === 'idle1' ? 1 : 0, atk = frame === 'atk';
  const skin = s.skin, a1 = s.armor, a2 = s.armor2 || shade(a1, -0.3), cl = s.cloth || a2, hair = s.hair || shade(skin, -0.4);
  const gob = s.head === 'goblin', hy = gob ? 2 : 0;
  // wings (behind everything): feathered, flat-lit so they read as light
  if (s.wings) { const w = s.wings, wy = by + (frame === 'walk0' || frame === 'atk' ? -1 : 0);
    g.rect(2, 8 + wy, 5, 13 + wy, w); g.rect(1, 7 + wy, 3, 9 + wy, w); g.set(0, 6 + wy, w); g.set(1, 6 + wy, w); g.rect(1, 13 + wy, 3, 14 + wy, w); g.set(2, 15 + wy, w);
    g.set(2, 10 + wy, shade(w, -0.25), true); g.set(3, 12 + wy, shade(w, -0.25), true); g.set(1, 8 + wy, '#ffffff', true); }
  // cape
  if (s.cape) g.rect(4, 11 + by, 5, 17, s.cape);
  // legs
  const boot = shade(a2, -0.35);
  const leg = (x, lift) => { g.rect(x, 16, x + 1, 18 - lift, cl); g.rect(x, 18 - lift, x + 2, 18 - lift, boot); };
  if (frame === 'walk0') { leg(6, 0); leg(11, 1); } else if (frame === 'walk1') { leg(8, 1); leg(10, 0); } else if (atk) { leg(6, 0); leg(11, 0); } else { leg(7, 0); leg(10, 0); }
  // back arm
  g.rect(5, 12 + by, 5, 14 + by, a2); g.set(5, 15 + by, skin);
  // torso
  if (s.head === 'skeleton' && !s.armor) { g.rect(8, 11, 10, 15, skin); }
  g.rect(6, 11 + by, 12, 15, a1); g.rect(6, 11 + by, 12, 11 + by, a2); g.rect(6, 14, 12, 14, cl); g.set(9, 12 + by, shade(a1, 0.35)); g.set(9, 14, '#ffcf3a', true);
  if (s.head === 'toad') g.rect(8, 12 + by, 11, 13 + by, s.belly || shade(skin, 0.4));
  // head
  const hx0 = gob ? 6 : 5, hx1 = gob ? 12 : 13, hy0 = 3 + by + hy, hy1 = 10 + by;
  if (s.head === 'toad') {
    g.rect(4, 4 + by, 14, 10 + by, skin); g.clear(4, 4 + by); g.clear(14, 4 + by);
    g.rect(6, 8 + by, 13, 10 + by, s.belly || shade(skin, 0.4));
    g.rect(6, 1 + by, 8, 4 + by, skin); g.rect(11, 1 + by, 13, 4 + by, skin);
    g.rect(7, 2 + by, 8, 3 + by, '#ffffff', true); g.set(8, 3 + by, OUTLINE, true);
    g.rect(12, 2 + by, 13, 3 + by, '#ffffff', true); g.set(13, 3 + by, OUTLINE, true);
    g.rect(8, 8 + by, 14, 8 + by, shade(skin, -0.5), true); g.set(5, 7 + by, '#ff8fb0', true);
  } else {
    g.rect(hx0, hy0, hx1, hy1, skin); g.clear(hx0, hy0); g.clear(hx1, hy0); g.clear(hx0, hy1); g.clear(hx1, hy1);
    const eye = s.eye || OUTLINE;
    if (s.head === 'skeleton') {
      g.rect(8, 5 + by, 9, 6 + by, OUTLINE, true); g.rect(11, 5 + by, 12, 6 + by, OUTLINE, true);
      g.set(9, 6 + by, s.eye || '#ff5d8f', true); g.set(12, 6 + by, s.eye || '#ff5d8f', true);
      g.set(10, 7 + by, OUTLINE, true); g.rect(8, 9 + by, 12, 9 + by, shade(skin, -0.25), true); g.set(9, 9 + by, OUTLINE, true); g.set(11, 9 + by, OUTLINE, true);
      if (!s.armor || s.cloth) { g.rect(7, 12 + by, 11, 12 + by, shade(a1, 0.1)); }
    } else if (gob) {
      g.set(9, 7 + by, '#ffde3a', true); g.set(11, 7 + by, '#ffde3a', true); g.set(9, 8 + by, OUTLINE, true); g.set(11, 8 + by, OUTLINE, true);
      g.rect(3, 6 + by, 5, 6 + by, skin); g.set(4, 5 + by, skin); g.set(3, 5 + by, skin); g.rect(13, 6 + by, 15, 6 + by, skin); g.set(14, 5 + by, skin); g.set(15, 5 + by, skin);
      g.set(12, 8 + by, shade(skin, -0.2)); g.rect(9, 10 + by, 11, 10 + by, shade(skin, -0.45), true); g.set(10, 10 + by, '#ffffff', true);
    } else {
      g.rect(10, 6 + by, 10, 7 + by, eye, true); g.rect(12, 6 + by, 12, 7 + by, eye, true);
      if (s.head !== 'orc' && s.head !== 'beast') g.set(13, 8 + by, '#ff9aa8', true);
      g.set(11, 9 + by, shade(skin, -0.3), true);
    }
    if (s.head === 'elf') { g.set(4, 6 + by, skin); g.set(4, 5 + by, skin); g.set(3, 4 + by, skin); g.set(3, 5 + by, skin); g.set(2, 3 + by, skin); }
    if (s.head === 'orc') { g.rect(14, 6 + by, 14, 9 + by, skin); g.set(10, 9 + by, '#ffffff', true); g.set(10, 8 + by, '#ffffff', true); g.set(13, 9 + by, '#ffffff', true); g.set(13, 8 + by, '#ffffff', true); g.rect(9, 5 + by, 13, 5 + by, shade(skin, -0.35), true); }
    if (s.head === 'beast') {
      const sn = s.snout || shade(skin, 0.4);
      g.rect(12, 7 + by, 15, 9 + by, sn); g.set(15, 7 + by, OUTLINE, true); g.set(13, 9 + by, shade(sn, -0.3), true);
      if (s.ears === 'round') { g.rect(5, 1 + by, 7, 3 + by, skin); g.rect(10, 1 + by, 12, 3 + by, skin); g.set(6, 2 + by, '#ff9aa8', true); g.set(11, 2 + by, '#ff9aa8', true); }
      else { g.set(6, 1 + by, skin); g.rect(6, 2 + by, 7, 2 + by, skin); g.set(11, 1 + by, skin); g.rect(10, 2 + by, 11, 2 + by, skin); g.set(6, 2 + by, '#ff9aa8', true); }
    }
    if (s.head === 'dwarf') { g.rect(7, 8 + by, 14, 11 + by, hair); g.rect(8, 12 + by, 13, 13 + by, hair); g.rect(9, 14 + by, 12, 14 + by, hair); g.set(11, 8 + by, skin); g.set(12, 8 + by, skin); }
    // hair
    if (s.head === 'human' || s.head === 'elf' || s.head === 'dwarf' || (s.head === 'orc' && s.hairStyle)) {
      if (s.head !== 'orc' || s.hairStyle === 'long') {
        g.rect(hx0, hy0, hx1, hy0 + 1, hair); g.rect(hx0, hy0 + 2, hx0 + 1, hy0 + 5, hair); g.set(hx1, hy0 + 2, hair);
        if (s.hairStyle === 'long') g.rect(4, 5 + by, 6, 13 + by, hair);
        if (s.hairStyle === 'bun') { g.rect(3, 2 + by, 5, 4 + by, hair); }
      }
      if (s.hairStyle === 'mohawk') g.rect(7, 0 + by, 10, 3 + by, hair);
    }
  }
  // hats
  const hatY = (s.head === 'toad' ? 1 : 0) + by + hy;
  switch (s.hat) {
    case 'helm': {
      const m = s.metal && s.weapon !== 'shield' ? s.metal : shade(a1, 0.15);
      g.rect(5, 2 + hatY, 13, 5 + hatY, m); g.clear(5, 2 + hatY); g.clear(13, 2 + hatY);
      g.rect(5, 6 + hatY, 6, 9 + hatY, m); g.rect(7, 5 + hatY, 13, 5 + hatY, shade(m, -0.35), true);
      if (s.plume || s.cape) { g.rect(7, 0 + hatY, 10, 1 + hatY, s.plume || s.cape); }
      break; }
    case 'hood':
      g.rect(4, 2 + hatY, 12, 4 + hatY, cl); g.rect(4, 5 + hatY, 7, 10 + hatY, cl); g.set(3, 3 + hatY, cl); g.set(13, 4 + hatY, cl); g.set(8, 5 + hatY, shade(cl, -0.4), true); break;
    case 'wizard':
      g.rect(3, 4 + hatY, 15, 4 + hatY, cl); g.rect(5, 2 + hatY, 13, 3 + hatY, cl); g.rect(6, 1 + hatY, 11, 1 + hatY, cl); g.rect(7, 0 + hatY, 9, 0 + hatY, cl);
      g.rect(5, 3 + hatY, 13, 3 + hatY, '#ffcf3a', true); break;
    case 'crown':
      g.rect(6, 2 + hatY, 12, 3 + hatY, '#ffcf3a'); g.set(6, 1 + hatY, '#ffcf3a'); g.set(9, 1 + hatY, '#ffcf3a'); g.set(12, 1 + hatY, '#ffcf3a'); g.set(9, 0 + hatY, '#ffcf3a');
      g.set(9, 2 + hatY, '#ff3d6e', true); g.set(7, 3 + hatY, '#5fd3ff', true); g.set(11, 3 + hatY, '#5fd3ff', true); break;
    case 'horns': {
      const hc = s.hornCol || '#f1ecdc';
      g.set(6, 3 + hatY, hc); g.set(5, 2 + hatY, hc); g.set(4, 1 + hatY, hc); g.set(4, 0 + hatY, hc);
      g.set(12, 3 + hatY, hc); g.set(13, 2 + hatY, hc); g.set(14, 1 + hatY, hc); g.set(14, 0 + hatY, hc); break; }
    case 'antlers': {
      const hc = s.hornCol || '#c9a06a';
      g.rect(6, 0 + hatY, 6, 3 + hatY, hc); g.set(5, 1 + hatY, hc); g.set(4, 0 + hatY, hc); g.set(7, 1 + hatY, hc);
      g.rect(12, 0 + hatY, 12, 3 + hatY, hc); g.set(13, 1 + hatY, hc); g.set(14, 0 + hatY, hc); g.set(11, 1 + hatY, hc); break; }
    case 'tricorn':
      g.rect(4, 3 + hatY, 14, 4 + hatY, cl); g.rect(6, 1 + hatY, 12, 2 + hatY, cl); g.set(3, 2 + hatY, cl); g.set(15, 2 + hatY, cl); g.rect(6, 3 + hatY, 12, 3 + hatY, '#ffcf3a', true); break;
    case 'bandana':
      g.rect(5, 3 + hatY, 13, 4 + hatY, cl); g.set(4, 4 + hatY, cl); g.set(3, 5 + hatY, cl); g.set(3, 6 + hatY, cl); g.set(11, 3 + hatY, '#ffffff', true); break;
  }
  // halo floats above whatever is on the head
  if (s.halo) { const hy0 = Math.max(0, hatY - (s.hat && s.hat !== 'none' ? 1 : -1)); g.rect(7, hy0, 11, hy0, s.halo, true); g.set(6, hy0 + 1, s.halo, true); g.set(12, hy0 + 1, s.halo, true); }
  // front arm + weapon
  const wp = WPN[s.weapon];
  if (wp) {
    const map = atk ? wp.a : wp.i, [ax, ay0] = map.at || (atk ? [15, 12] : [16, 13]), ay = ay0 + by, pal = weaponPal(s);
    if (atk) g.rect(12, 12 + by, ax - 1, 12 + by, a2);
    else { g.rect(12, 12 + by, 13, 13 + by, a2); if (ax > 14) g.rect(14, ay, ax - 1, ay, a2); }
    g.set(ax, ay, skin); growWeapon(g, ws, ax, ay, (G, x, y) => drawWpnMap(G, map, pal, x, y));
    if (wp.b) growWeapon(g, ws, 5, 15 + by, (G, x, y) => drawWpnMap(G, wp.b, pal, x, y));
  } else if (atk) { g.rect(12, 12 + by, 14, 12 + by, a2); g.set(15, 12 + by, skin); growWeapon(g, ws, 15, 12 + by, (G, x, y) => drawWeapon(G, s, s.weapon, x - 1, y, true)); }
  else { g.rect(12, 12 + by, 13, 13 + by, a2); g.set(13, 14 + by, skin); growWeapon(g, ws, 13, 14 + by, (G, x, y) => drawWeapon(G, s, s.weapon, x - 1, y, false)); }
  if (s.weapon === 'none' && atk) { g.set(16, 12 + by, skin); }
  return g.finish();
}

function genSlime(s, frame) {
  const g = new PixGrid(20, 20), c = s.body, sm = s.small;
  const sq = frame === 'idle1' || frame === 'walk1' ? 1 : 0, at = frame === 'atk';
  const x0 = sm ? 6 : 3 - sq, x1 = sm ? 14 : 16 + sq + (at ? 1 : 0), y0 = (sm ? 11 : 6) + sq, y1 = 18;
  for (let y = y0; y <= y1; y++) {
    const t = (y - y0) / (y1 - y0), inset = Math.round((1 - Math.min(1, t * 2.2)) * (sm ? 3 : 4));
    g.rect(x0 + inset, y, x1 - inset, y, c);
  }
  g.rect(x0 + 2, y1, x1 - 2, y1, shade(c, -0.3));
  g.set(x0 + (sm ? 3 : 4), y0 + 2, '#ffffff', true); g.set(x0 + (sm ? 3 : 4), y0 + 3, shade(c, 0.5), true);
  const ey = y0 + (sm ? 3 : 5);
  g.rect(x1 - (sm ? 5 : 7), ey, x1 - (sm ? 5 : 7), ey + 1, s.eye, true); g.rect(x1 - (sm ? 3 : 4), ey, x1 - (sm ? 3 : 4), ey + 1, s.eye, true);
  g.rect(x1 - (sm ? 5 : 6), ey + 3, x1 - (sm ? 3 : 4), ey + 3, shade(c, -0.5), true);
  if (s.crown) { g.rect(x0 + 6, y0 - 2, x0 + 11, y0 - 1, '#ffcf3a'); g.set(x0 + 6, y0 - 3, '#ffcf3a'); g.set(x0 + 9, y0 - 3, '#ffcf3a'); g.set(x0 + 11, y0 - 3, '#ffcf3a'); g.set(x0 + 8, y0 - 2, '#ff3d6e', true); }
  return g.finish();
}

function genQuad(s, frame) {
  const g = new PixGrid(20, 20), b = s.body, be = s.belly || shade(b, 0.3);
  const lift = frame === 'walk0' ? 1 : 0, lift2 = frame === 'walk1' ? 1 : 0, bob = frame === 'idle1' ? 1 : 0, at = frame === 'atk' ? 1 : 0;
  if (s.wings) { const wy = frame === 'walk0' || frame === 'idle1' ? 1 : 0; g.rect(5, 3 + wy, 10, 8, shade(b, 0.15)); g.rect(3, 2 + wy, 6, 4 + wy, shade(b, 0.15)); g.rect(6, 5 + wy, 9, 7, shade(be, -0.1)); }
  // tail
  g.set(2, 10 + bob, b); g.set(1, 9 + bob, b); g.set(3, 11 + bob, b);
  // body
  g.rect(3, 10 + bob, 13, 14 + bob, b); g.rect(5, 14 + bob, 12, 15 + bob, be);
  // legs
  g.rect(4, 15, 5, 18 - lift, shade(b, -0.2)); g.rect(7, 15, 8, 18 - lift2, b); g.rect(10, 15, 11, 18 - lift2, shade(b, -0.2)); g.rect(12, 15, 13, 18 - lift, b);
  // head
  const hx = 12 + at;
  g.rect(hx, 7 + bob, hx + 4, 12 + bob, b); g.rect(hx + 4, 10 + bob, hx + 6, 12 + bob, be);
  g.set(hx + 1, 6 + bob, b); g.set(hx + 1, 5 + bob, b); g.set(hx + 3, 6 + bob, b);
  g.set(hx + 3, 9 + bob, s.eye || '#ffde3a', true); g.set(hx + 6, 10 + bob, OUTLINE, true);
  g.rect(hx + 4, 12 + bob, hx + 6, 12 + bob, '#ffffff', true); if (at) g.set(hx + 6, 13 + bob, '#ffffff', true);
  if (s.horns) { g.set(hx, 6 + bob, '#ffe9b0'); g.set(hx - 1, 5 + bob, '#ffe9b0'); g.set(hx - 1, 4 + bob, '#ffe9b0'); }
  if (s.fire) { g.set(4, 9 + bob, '#ffde3a', true); g.set(6, 8 + bob, '#ff8a3a', true); g.set(8, 9 + bob, '#ffde3a', true); g.set(10, 8 + bob, '#ff8a3a', true); }
  if (s.rider) {
    const r = s.rider, rc = s.riderCloth || '#c94a3a';
    g.rect(7, 6 + bob, 10, 9 + bob, rc); g.rect(7, 1 + bob, 10, 5 + bob, r); g.set(9, 3 + bob, '#ffde3a', true); g.set(10, 3 + bob, OUTLINE, true);
    g.set(6, 2 + bob, r); g.set(5, 1 + bob, r); g.set(11, 2 + bob, r);
    g.rect(11, 4 + bob, 11, 8 + bob, '#9a6332'); g.set(11, 3 + bob, '#dfe6f5');
  }
  return g.finish();
}

function genFlyer(s, frame) {
  const g = new PixGrid(20, 20), b = s.body, w = s.wing;
  const up = frame === 'walk0' || frame === 'idle0' || frame === 'atk';
  const by = frame === 'idle1' ? 1 : 0;
  if (s.rotor) { g.rect(3, 3 + by, 16, 3 + by, up ? w : shade(w, -0.3)); g.rect(9, 4 + by, 10, 5 + by, '#5a5a6e'); }
  else if (up) { g.rect(2, 4 + by, 6, 6 + by, w); g.rect(1, 3 + by, 3, 4 + by, w); g.rect(13, 4 + by, 17, 6 + by, w); g.rect(16, 3 + by, 18, 4 + by, w); }
  else { g.rect(2, 9 + by, 6, 11 + by, w); g.rect(1, 11 + by, 3, 12 + by, w); g.rect(13, 9 + by, 17, 11 + by, w); g.rect(16, 11 + by, 18, 12 + by, w); }
  g.rect(6, 6 + by, 13, 13 + by, b); g.clear(6, 6 + by); g.clear(13, 6 + by); g.clear(6, 13 + by); g.clear(13, 13 + by);
  if (s.glow) { g.rect(8, 13 + by, 11, 15 + by, shade(b, 0.2)); g.rect(9, 16 + by, 10, 16 + by, shade(b, 0.4)); }
  g.set(10, 8 + by, s.eye, true); g.set(12, 8 + by, s.eye, true); g.set(10, 9 + by, s.eye, true); g.set(12, 9 + by, s.eye, true);
  if (frame === 'atk') g.rect(10, 11 + by, 12, 11 + by, '#ffffff', true); else g.set(11, 11 + by, shade(b, -0.5), true);
  if (s.horns) { g.set(7, 5 + by, '#ffe9b0'); g.set(7, 4 + by, '#ffe9b0'); g.set(12, 5 + by, '#ffe9b0'); g.set(12, 4 + by, '#ffe9b0'); }
  if (s.rotor) { g.rect(13, 10 + by, 15, 10 + by, '#5a5a6e'); }
  return g.finish();
}

function genGolem(s, frame) {
  const g = new PixGrid(20, 20), b = s.body, t = s.trim, sm = s.small;
  const by = frame === 'idle1' ? 1 : 0, at = frame === 'atk';
  const l0 = frame === 'walk0' ? 1 : 0, l1 = frame === 'walk1' ? 1 : 0;
  if (sm) {
    g.rect(6, 15, 7, 18 - l0, t); g.rect(11, 15, 12, 18 - l1, t);
    g.rect(5, 8 + by, 13, 15, b); g.rect(5, 11 + by, 13, 11 + by, t);
    g.rect(10, 9 + by, 12, 10 + by, OUTLINE, true); g.set(11, 9 + by, s.eye, true);
    g.rect(8, 6 + by, 10, 7 + by, t); g.set(9, 5 + by, '#ffcf3a');
    g.rect(14, 11 + by, 15 + (at ? 2 : 0), 12 + by, t);
    return g.finish();
  }
  g.rect(5, 15, 7, 18 - l0, t); g.rect(11, 15, 13, 18 - l1, t);
  g.rect(4, 6 + by, 14, 15, b); g.rect(4, 10 + by, 14, 10 + by, t); g.rect(8, 12 + by, 10, 14 + by, shade(b, 0.3));
  g.rect(7, 2 + by, 12, 6 + by, b); g.rect(9, 3 + by, 12, 4 + by, OUTLINE, true); g.set(11, 3 + by, s.eye, true); g.set(12, 3 + by, s.eye, true);
  g.set(5, 5 + by, '#c8c8d8'); g.set(5, 4 + by, '#c8c8d8'); g.set(4, 3 + by, '#e8e8f0');
  g.rect(2, 7 + by, 3, 13 + by, t); g.rect(1, 13 + by, 3, 14 + by, b);
  if (s.cannon) { g.rect(13, 8 + by, 18, 10 + by, '#4a5a70'); g.rect(18, 7 + by, 18, 11 + by, OUTLINE); if (at) g.set(19, 9 + by, '#ffde3a', true); }
  else { if (at) { g.rect(15, 8 + by, 18, 10 + by, t); g.rect(17, 7 + by, 19, 11 + by, b); } else { g.rect(15, 7 + by, 16, 13 + by, t); g.rect(15, 13 + by, 17, 15 + by, b); } }
  if (s.crown) { g.rect(7, 0 + by, 12, 1 + by, '#ffcf3a'); g.set(9, 0 + by, '#ff3d6e', true); }
  return g.finish();
}

function genBird(s, frame) {
  const g = new PixGrid(20, 20), b = s.body, w = s.wing, bk = s.beak;
  const by = frame === 'idle1' ? 1 : 0, at = frame === 'atk', l0 = frame === 'walk0' ? 1 : 0, l1 = frame === 'walk1' ? 1 : 0;
  // legs
  g.rect(8, 15, 8, 18 - l0, bk); g.rect(11, 15, 11, 18 - l1, bk); g.set(9, 18 - l0, bk); g.set(12, 18 - l1, bk);
  // body
  g.rect(5, 10 + by, 13, 15, b); g.rect(4, 11 + by, 4, 13 + by, b); g.rect(3, 10 + by, 3, 11 + by, b);
  g.rect(6, 11 + by, 10, 13 + by, w);
  if (s.neck) { g.rect(12, 4 + by, 13, 10 + by, b); g.rect(12, 2 + by, 15, 5 + by, b); g.rect(16, 3 + by + (at ? 1 : 0), 18, 4 + by + (at ? 1 : 0), bk); g.set(14, 3 + by, OUTLINE, true); }
  else { g.rect(11, 6 + by, 15, 10 + by, b); g.rect(16, 8 + by, 17 + (at ? 1 : 0), 9 + by, bk); g.set(14, 7 + by, OUTLINE, true); if (s.comb) { g.rect(12, 4 + by, 14, 5 + by, s.comb); g.set(16, 10 + by, s.comb); } }
  if (s.crown) { const cy = (s.neck ? 0 : 3) + by, cx = s.neck ? 12 : 11; g.rect(cx, cy, cx + 3, cy + 1, s.crown); g.set(cx, cy - 1, s.crown); g.set(cx + 2, cy - 1, s.crown); g.set(cx + 1, cy, '#ff3d6e', true); }
  if (at) g.set(19, 2 + by, '#ffffff', true);
  return g.finish();
}
const GENS = { humanoid: genHumanoid, slime: genSlime, quad: genQuad, flyer: genFlyer, golem: genGolem, bird: genBird };
const FRAMES = ['idle0', 'idle1', 'walk0', 'walk1', 'atk'];
const SPR = {};   // key -> { frames: {name: canvas}, white: {name: canvas}, scale }

function buildSprite(key, spec, flip, scale = 1) {
  const gen = GENS[spec.gen || 'humanoid'];
  const out = { frames: {}, white: {}, scale };
  for (const f of FRAMES) { const g = gen(spec, f); out.frames[f] = g.toCanvas(flip); out.white[f] = g.toCanvas(flip, true); }
  SPR[key] = out; return out;
}

function buildAllSprites() {
  for (const h of HEROES) buildSprite('h:' + h.id, h.spr, false);
  for (const [id, e] of Object.entries(ENEMIES)) buildSprite('e:' + id, e.spr, true, e.scale || 1);
  buildSprite('thrall', { head: 'skeleton', skin: SK.bone, hat: 'none', armor: '#6a5a8a', armor2: '#3a2f5a', cloth: '#3a2f5a', weapon: 'sword', metal: '#c8c0b0' }, false);
  buildSprite('spirit', { gen: 'quad', body: '#9ff6ff', belly: '#ffffff', eye: '#2a4a8a', horns: true }, false);
  buildSprite('crit:ghost', { gen: 'flyer', body: '#ffffff', wing: '#e8e4ff', eye: '#1a1230', glow: true }, false);
  buildSprite('crit:meatman', { gen: 'golem', body: '#ff8a8a', trim: '#ffd0b0', eye: '#1a1230', small: true }, false);
  buildSprite('crit:dog', { gen: 'quad', body: '#c98a4a', belly: '#f3dcc0', eye: '#1a1230' }, false);
  buildSprite('npc:chicken', ENEMIES.chicken.spr, false);
}
// elemental variations are built on demand: key 'h:<id>:<element>'
function ensureSprite(key) {
  if (SPR[key]) return SPR[key];
  // 'h:<id>', 'h:<id>:<element>', either with '~<star>' (2 or 3) and optionally '@<weapon scale>' for the star-up show
  // a '|<temper>' suffix builds the hi-detail champion (hdart.js) wearing that temper's face
  const m = /^h:([a-z]+)(?::([a-z]+))?(?:~([23])(?:@([\d.]+))?)?(?:\|([a-z]+))?$/.exec(key); if (!m) return null;
  const d = HERO_BY_ID[m[1]], E = m[2] && ELEMENTS[m[2]]; if (!d || (m[2] && !E)) return null;
  let spec = d.spr;
  if (E) { const dark = c => shade(c, -0.35);
    spec = Object.assign({}, d.spr, { armor: E.col, armor2: dark(E.col), cloth: E.col2, gem: E.col, plume: E.col2, hornCol: E.col2 });
    if (d.spr.cape) spec.cape = E.col2;
    if (d.spr.hair) spec.hair = E.col2 === '#0f0a2a' ? '#5a3aff' : E.col2; }
  if (m[3]) spec = starSpec(spec, +m[3], m[4] ? +m[4] : 0);
  if (m[5] && typeof buildSpriteHD === 'function' && (spec.gen || 'humanoid') === 'humanoid') return buildSpriteHD(key, spec, m[5]);
  return buildSprite(key, spec, false);
}

// ===== tiny icon art (8x8) =====
const ICONS = {
  coin:    ['..yyyy..', '.yYYYYy.', 'yYyyyyYy', 'yYyYYyYy', 'yYyYYyYy', 'yYyyyyYy', '.yYYYYy.', '..yyyy..'],
  diamond: ['........', '.cCCCCc.', 'cCwCCwCc', '.cCCCCc.', '..cCCc..', '...cc...', '........', '........'],
  heart:   ['.rr..rr.', 'rRRrrRRr', 'rRwRRRRr', 'rRRRRRRr', '.rRRRRr.', '..rRRr..', '...rr...', '........'],
  sword:   ['......wW', '.....wW.', '....wW..', '.y.wW...', '..yW....', '..by....', '.b..y...', 'b.......'],
  shield:  ['.SSSSSS.', 'SsssssssS'.slice(0, 8), 'SsRRRRsS', 'SsRyyRsS', 'SsRRRRsS', '.SsRRsS.', '..SssS..', '...SS...'],
  boots:   ['........', '..bb....', '..bb....', '..bb....', '..bbb...', '..bbbbb.', '.ByyyyB.', '........'],
  belt:    ['........', '........', 'bbbbbbbb', 'bByyyyBb', 'bByBByBb', 'bbbbbbbb', '........', '........'],
  gem:     ['...cc...', '..cCCc..', '.cCwCCc.', 'cCCCCCCc', '.cCCCCc.', '..cCCc..', '...cc...', '........'],
  fang:    ['........', 'wwwwwwww', '.wWwwWw.', '.wW..Ww.', '.w....w.', '.r....r.', '........', '........'],
  lens:    ['..SSSS..', '.ScccCS.', 'ScwcccCS'.slice(0, 8), 'SccccCS.', '.SCCCS..', '..SSS.b.', '......bb', '.......b'],
  thorns:  ['.g..g...', 'gGgGGg.g', '.GGGGGG.', 'gGgGGgG.', '.GGGGGGg', 'gGgGGg..', '.g..g...', '........'],
  feather: ['.....rR.', '....rRy.', '...rRy..', '..rRy...', '.rRy....', '.Ry.....', 'y.......', '........'],
  ring:    ['..cwc...', '...c....', '.yyyyy..', 'y.....y.', 'y.....y.', 'y.....y.', '.yyyyy..', '........'],
  snow:    ['...c....', '.c.c.c..', '..ccc...', 'cccwccc.', '..ccc...', '.c.c.c..', '...c....', '........'],
  hammer:  ['.SSSSS..', '.SsssS..', '.SSSSS..', '...b....', '...b....', '...b....', '...b....', '...b....'],
  skull:   ['.wwwww..', 'wwwwwww.', 'wkkwkkw.', 'wkkwkkw.', 'wwwkwww.', '.wwwww..', '.wkwkw..', '........'],
  bow:     ['..b.....', '.b.w....', 'b...w...', 'b...wyy.', 'b...w...', '.b.w....', '..b.....', '........'],
  rod:     ['......pP', '.....pPp', '....bpp.', '...b....', '..b.....', '.b......', 'b.......', '........'],
  tear:    ['...c....', '...c....', '..cCc...', '.cCwCc..', '.cCCCc..', '.cCCCc..', '..ccc...', '........'],
  vest:    ['.S....S.', 'SsS..SsS', 'SssSSssS', 'SsssssssS'.slice(0, 8), 'SsSssSsS', 'SssssssS', '.SSSSSS.', '........'],
  cloak:   ['...pp...', '..pPPp..', '.pPkkPp.', '.pPPPPp.', 'pPPPPPPp', 'pPpPPpPp', 'pp.pp.pp', '........'],
  glove:   ['.r.r.r..', '.r.r.r..', '.rrrrr.r', '.rRRRRrr', '.rRRRRr.', '.rRRRr..', '..yyy...', '..yyy...'],
  shard:   ['....w...', '...pPp..', '..pPwPp.', '..pPPPp.', '..pPPPp.', '...pPp..', '....p...', 'w.......'],
  scroll:  ['.YYYYYY.', 'Yy....yY', '.Y.kk.Y.', '.Y....Y.', '.Y.kk.Y.', '.Y....Y.', 'Yy....yY', '.YYYYYY.'],
  mic:     ['..SSS...', '.SsssS..', '.SsssS..', '.SsssS..', 'S.SSS.S.', '.S...S..', '..SSS...', '...S....'],
  crown:   ['........', 'y..y..y.', 'yy.y.yy.', 'yyyyyyy.', 'yrycyry.', 'yyyyyyy.', '........', '........'],
};
const ICON_PAL = { p: '#a98aff', P: '#d8c8ff', o: '#ff8a3a', O: '#ffd0b0', y: '#ffcf3a', Y: '#fff1a8', c: '#5fd3ff', C: '#bff4ff', w: '#ffffff', W: '#c9d4ee', r: '#ff3d6e', R: '#ff7a9a', b: '#9a6332', B: '#5a3a1a', S: '#8a94b8', s: '#c9d0ea', g: '#3a9a4a', G: '#7ce05a', k: '#1a1230' };
const ICON_CACHE = {};
function iconCanvas(name, px = 1) {
  const k = name + px; if (ICON_CACHE[k]) return ICON_CACHE[k];
  const rows = ICONS[name]; const c = document.createElement('canvas'); c.width = 10 * px; c.height = 10 * px; const ctx = c.getContext('2d');
  const g = new PixGrid(10, 10);
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ICON_PAL[ch]) g.set(x + 1, y + 1, ICON_PAL[ch], true); }));
  g.finish();
  for (let y = 0; y < 10; y++) for (let x = 0; x < 10; x++) { const col = g.get(x, y); if (col) { ctx.fillStyle = col; ctx.fillRect(x * px, y * px, px, px); } }
  ICON_CACHE[k] = c; return c;
}
function iconURL(name, px = 3) { return iconCanvas(name, px).toDataURL(); }
// canvas for a component or finished item; super items layer two finished ones in a gem frame
function itemIconCanvas(it, px = 3) {
  const k = 'itc:' + it.parts.join('+') + (it.sup ? '|' + it.sub.parts.join('+') : '') + px; if (ICON_CACHE[k]) return ICON_CACHE[k];
  if (it.sup) {
    const c = document.createElement('canvas'); c.width = c.height = 16 * px; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    g.fillStyle = '#2a1846'; g.fillRect(px, px, 14 * px, 14 * px);
    g.fillStyle = '#b06cff'; g.fillRect(0, px, px, 14 * px); g.fillRect(15 * px, px, px, 14 * px); g.fillRect(px, 0, 14 * px, px); g.fillRect(px, 15 * px, 14 * px, px);
    g.fillStyle = '#ffcf3a'; for (const [x, y] of [[0, 0], [15, 0], [0, 15], [15, 15], [1, 1], [14, 1], [1, 14], [14, 14]]) g.fillRect(x * px, y * px, px, px);
    const a = itemIconCanvas({ parts: it.parts }, px), b = itemIconCanvas({ parts: it.sub.parts }, px);
    g.drawImage(a, px, px, 11 * px, 11 * px); g.drawImage(b, 7 * px, 7 * px, 8 * px, 8 * px);
    g.fillStyle = '#ffffff'; g.fillRect(13 * px, 2 * px, px, px); g.fillRect(2 * px, 13 * px, px, px); g.fillStyle = '#ffe680'; g.fillRect(12 * px, 2 * px, px, px); g.fillRect(13 * px, 3 * px, px, px);
    return (ICON_CACHE[k] = c);
  }
  if (it.parts.length < 2) return (ICON_CACHE[k] = iconCanvas(COMPONENTS[it.parts[0]].glyph, px));
  const art = typeof ITEM_ART !== 'undefined' && ITEM_ART[itemKey(it.parts[0], it.parts[1])];
  if (art) {
    const g = new PixGrid(14, 14);
    art.forEach((r, y) => [...r].forEach((ch, x) => { const col = ITEM_PAL[ch] || ICON_PAL[ch]; if (col) g.set(x + 1, y + 1, col, true); }));
    g.finish();
    const c = document.createElement('canvas'); c.width = c.height = 14 * px; const ctx = c.getContext('2d');
    for (let y = 0; y < 14; y++) for (let x = 0; x < 14; x++) { const col = g.get(x, y); if (col) { ctx.fillStyle = col; ctx.fillRect(x * px, y * px, px, px); } }
    return (ICON_CACHE[k] = c);
  }
  const a = iconCanvas(COMPONENTS[it.parts[0]].glyph, px), b = iconCanvas(COMPONENTS[it.parts[1]].glyph, px);
  const c = document.createElement('canvas'); c.width = c.height = 10 * px; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  g.fillStyle = '#ffcf3a'; g.fillRect(0, 0, 10 * px, px); g.fillRect(0, 9 * px, 10 * px, px); g.fillRect(0, 0, px, 10 * px); g.fillRect(9 * px, 0, px, 10 * px);
  g.drawImage(a, px, px, 7 * px, 7 * px); g.drawImage(b, 4 * px, 4 * px, 6 * px, 6 * px);
  return (ICON_CACHE[k] = c);
}
function itemIconURL(it, px = 3) {
  const k = 'it:' + it.parts.join('+') + (it.sup ? '|' + it.sub.parts.join('+') : '') + px; if (ICON_CACHE[k]) return ICON_CACHE[k];
  return (ICON_CACHE[k] = itemIconCanvas(it, px).toDataURL());
}
function spriteURL(key, frame = 'idle0', px = 3) {
  ensureSprite(key);
  const s = SPR[key].frames[frame], c = document.createElement('canvas'), ctx = c.getContext('2d');
  // starred legends: crop the 32x34 frame to 26x26 around the body so portraits keep their size and still show the weapon
  const [sx, sy, sw, sh] = s.width === STAR_PAD.w ? [3, 4, 26, 26] : [0, 0, s.width, s.height];
  c.width = sw * px; c.height = sh * px; ctx.imageSmoothingEnabled = false; ctx.drawImage(s, sx, sy, sw, sh, 0, 0, c.width, c.height); return c.toDataURL();
}
