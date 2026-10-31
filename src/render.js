// ===== Arena renderer =====
const R = { cv: null, ctx: null, lo: null, lctx: null, k: 3, bg: {}, castleKey: '', castle: null, clouds: [], t: 0 };
function hash(x, y) { let h = x * 374761393 + y * 668265263; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967295; }
// the call-back chip over the selected champion during a siege (tap it to pull them into the keep)
function recallChipPos(u) { return { x: Math.round(u.x) + 10, y: Math.round(u.y - 30 * (u.vscale || 1) - (u.z || 0)) }; }
function drawRecallChip(g, u, t) {
  const p = recallChipPos(u), hot = u.hp < u.maxHp * 0.35 && Math.floor(t * 4) % 2;
  g.fillStyle = OUTLINE; g.fillRect(p.x - 1, p.y - 1, 11, 10); g.fillStyle = hot ? '#ffd84a' : '#9fd8ff'; g.fillRect(p.x, p.y, 9, 8);
  g.fillStyle = OUTLINE; g.fillRect(p.x + 3, p.y + 2, 4, 1); g.fillRect(p.x + 6, p.y + 2, 1, 4); g.fillRect(p.x + 3, p.y + 5, 4, 1); g.fillRect(p.x + 2, p.y + 1, 1, 3); g.fillRect(p.x + 1, p.y + 2, 1, 1);
}
// star level over each champion: 1 bronze, 2 silver, 3 gold stars (Cam 2026-10-23)
const STAR_PX = ['..#..', '#####', '.###.', '.#.#.'], STAR_COL = ['#e0a060', '#e8f0ff', '#ffd94a'];
function drawStars(g, u, t) {
  const h = u.inst; if (!h || u.temp) return; const n = heroStar(h), sc = u.scale || 1;
  const x0 = Math.round(u.x - (n * 6 - 1) / 2), y0 = Math.round(u.y - (u.z || 0) - 21 * sc + (u.flying ? -2 : 0)) - 2 - (u.st && u.st.sigOn ? 2 : 0) - 7;
  const px = (col, ox, oy) => { g.fillStyle = col; for (let s = 0; s < n; s++) for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) if (STAR_PX[r][c] === '#') g.fillRect(x0 + s * 6 + c + ox, y0 + r + oy, 1, 1); };
  for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) px(OUTLINE, ox, oy);
  px(STAR_COL[n - 1], 0, 0);
  if (n === 3 && Math.floor(t * 3) % 3 === 0) { g.fillStyle = '#ffffff'; g.fillRect(x0 + 2, y0 + 1, 1, 1); }
}
// a frame filled with one colour, for star borders (cached per frame and colour)
const TINTS = new WeakMap();
function tintFrame(img, col) {
  let m = TINTS.get(img); if (!m) TINTS.set(img, m = {}); if (m[col]) return m[col];
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d');
  x.drawImage(img, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height);
  return (m[col] = c);
}
function mix(a, b, t) { const A = hexToRgb(a), B = hexToRgb(b); return rgbToHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }

function initRender(canvas) {
  R.cv = canvas; R.ctx = canvas.getContext('2d');
  R.lo = document.createElement('canvas'); R.lo.width = W; R.lo.height = H; R.lctx = R.lo.getContext('2d');
  for (let i = 0; i < 7; i++) R.clouds.push({ x: rand(0, W), y: rand(6, 50), w: randi(18, 40), s: rand(3, 8) });
  resizeRender();
}
function resizeRender() {
  const r = R.cv.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1;
  const k = Math.max(1, Math.ceil(r.width * dpr / W)); if (k === R.k && R.cv.width === W * k) return;
  R.k = k; R.cv.width = W * k; R.cv.height = H * k;
  // resizing wipes the canvas; put the last frame back at once so a paused game (title, menus) never shows a bare field
  if (R.lo && R.painted) { R.ctx.imageSmoothingEnabled = false; R.ctx.drawImage(R.lo, 0, 0, W * k, H * k); }
}

function buildBackground(fi, el) {
  const F = FACTIONS[fi], c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const scene = ELEMENT_SCENES[el];
  const sky = scene ? scene.sky.map((col,i) => mix(col,F.sky[i],.18)) : F.sky;
  const ground = scene ? scene.ground : '#74d35a';
  // sky in bands
  const bands = 8; for (let i = 0; i < bands; i++) { g.fillStyle = mix(sky[0], sky[1], i / (bands - 1)); g.fillRect(0, Math.floor(i * 92 / bands), W, Math.ceil(92 / bands) + 1); }
  // sun
  if (!['dark','void'].includes(el)) {
  g.fillStyle = '#fff6c0'; for (let y = -9; y <= 9; y++) { const w = Math.round(Math.sqrt(81 - y * y)); g.fillRect(410 - w, 26 + y, w * 2, 1); }
  g.fillStyle = '#ffe680'; for (let y = -6; y <= 6; y++) { const w = Math.round(Math.sqrt(36 - y * y)); g.fillRect(410 - w, 26 + y, w * 2, 1); }
  }
  // hills (two layers)
  const hill = (base, amp, freq, col, seed) => { g.fillStyle = col; for (let x = 0; x < W; x++) { const h = base - Math.round(amp * (0.5 + 0.5 * Math.sin(x * freq + seed)) + amp * 0.4 * Math.sin(x * freq * 2.7 + seed * 3)); g.fillRect(x, h, 1, 96 - h); } };
  hill(76, 16, 0.025, mix(scene ? scene.hill : F.hill, sky[1], 0.45), 1.3); hill(86, 12, 0.04, scene ? scene.hill : F.hill, 4.1);
  // ground
  g.fillStyle = ground; g.fillRect(0, 92, W, H - 92);
  g.fillStyle = scene ? scene.edge : '#86de66'; g.fillRect(0, 92, W, 3);
  for (let y = 95; y < H; y += 2) for (let x = 0; x < W; x += 2) { const r = hash(x, y); if (r < 0.06) { g.fillStyle = scene ? scene.grass : '#5cbf45'; g.fillRect(x, y, 1, 2); g.fillRect(x + 1, y - 1, 1, 2); } else if (r < 0.085) { g.fillStyle = scene ? scene.fleck : '#a2ec7e'; g.fillRect(x, y, 1, 1); } }
  const cx0 = GRID.x - 8, cx1 = GRID.x + GRID.courtCols * GRID.cell, cy0 = GRID.y - 8, cy1 = GRID.y + GRID.rows * GRID.cell + 8;
  if (!scene) {
  // road
  for (let x = CASTLE_X; x < W; x++) { const y0 = 168 + Math.round(Math.sin(x * 0.03) * 3); g.fillStyle = scene ? scene.road : '#e8c07a'; g.fillRect(x, y0, 1, 22); g.fillStyle = '#d4a65e'; if (hash(x, 7) < 0.3) g.fillRect(x, y0 + Math.floor(hash(x, 9) * 20), 1, 1); g.fillStyle = '#c99a50'; g.fillRect(x, y0 + 22, 1, 1); g.fillStyle = '#f4d69a'; g.fillRect(x, y0, 1, 1); }
  // courtyard cobbles
  // courtyard: rounded, shaded cobbles of warm stone, a low kerb around the edge
  g.fillStyle = '#9a8a6a'; g.fillRect(cx0, cy0, cx1 - cx0, cy1 - cy0);
  for (let y = cy0, row = 0; y < cy1; y += 6, row++) for (let x = cx0 - (row % 2 ? 4 : 0); x < cx1; x += 8) {
    const h = hash(x * 7 + 3, y * 11 + 5), bx = Math.max(cx0, x + 1), bw = Math.min(x + 7, cx1) - bx; if (bw <= 0) continue;
    g.fillStyle = h < 0.2 ? '#d8c49a' : h < 0.75 ? '#e8d8b0' : h < 0.92 ? '#f2e6c4' : '#cfc0a8'; g.fillRect(bx, y + 1, bw, 4);
    g.fillStyle = '#fff4d8'; g.fillRect(bx, y + 1, Math.max(1, bw - 2), 1); g.fillStyle = '#b8a47a'; g.fillRect(bx + 1, y + 4, Math.max(1, bw - 1), 1);
    if (h > 0.97) { g.fillStyle = '#74d35a'; g.fillRect(bx + 2, y, 2, 1); } }
  // worn path from the gate to the front
  g.globalAlpha = 0.18; g.fillStyle = '#8a6a3a'; for (let x = cx0; x < cx1; x++) { const y = 180 + Math.round(Math.sin(x * 0.05) * 3); g.fillRect(x, y - 6, 1, 14); } g.globalAlpha = 1;
  // kerb
  g.fillStyle = OUTLINE; g.fillRect(cx0 - 1, cy0 - 3, cx1 - cx0 + 4, 3); g.fillRect(cx1, cy0 - 3, 3, cy1 - cy0 + 6); g.fillRect(cx0 - 1, cy1, cx1 - cx0 + 4, 3);
  g.fillStyle = '#c8bca0'; g.fillRect(cx0, cy0 - 2, cx1 - cx0 + 2, 1); g.fillRect(cx1 + 1, cy0 - 2, 1, cy1 - cy0 + 4); g.fillRect(cx0, cy1 + 1, cx1 - cx0 + 2, 1);
  for (let y = cy0; y < cy1; y += 9) { g.fillStyle = OUTLINE; g.fillRect(cx1, y, 3, 1); }
  }
  if (scene) drawElementTerrain(g, el);
  drawElementScenery(g, el);
  drawHordeCamp(g, fi);
  // flowers on our side
  for (let i = 0; i < (scene ? 0 : 70); i++) { const x = Math.floor(hash(i, 1) * 240) + 96, y = Math.floor(hash(i, 2) * 170) + 98; if (x > cx0 - 2 && x < cx1 + 2 && y > cy0 - 2 && y < cy1 + 2) continue; g.fillStyle = pick(['#ff7aa8', '#ffd84a', '#ffffff', '#a98aff']); g.fillRect(x, y, 1, 1); g.fillStyle = '#4fae3a'; g.fillRect(x, y + 1, 1, 1); }
  // horde side tint
  for (let x = 300; x < W; x++) { const a = Math.min(0.42, (x - 300) / 180 * 0.42); g.fillStyle = F.tint; g.globalAlpha = a; g.fillRect(x, 92, 1, H - 92); }
  g.globalAlpha = 1;
  // faction props
  for (let i = 0; i < 14; i++) { const x = 350 + Math.floor(hash(i, fi + 11) * 125), y = 100 + Math.floor(hash(i, fi + 23) * 160); if (!ELEMENT_SCENES[el]) drawProp(g, fi, x, y, i); }
  // front line stakes
  const fx = GRID.x + GRID.cols * GRID.cell + 4;
  for (let y = GRID.y - 6; y < GRID.y + GRID.rows * GRID.cell + 6; y += 9) { g.fillStyle = '#8a5a2a'; g.fillRect(fx, y, 2, 5); g.fillStyle = '#c98a4a'; g.fillRect(fx, y, 2, 1); }
  return c;
}

function drawProp(g, fi, x, y, i) {
  const px = (dx, dy, c, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x + dx, y + dy, w, h); };
  switch (fi) {
    case 0: if (i % 3 === 0) { px(-4, -6, '#8a5a3a', 9, 6); px(-3, -9, '#a8703f', 7, 3); px(-1, -11, '#c98a4a', 3, 2); px(0, -3, '#2a1a12', 2, 3); } else { px(0, 0, '#6a6a7a', 4, 3); px(1, -1, '#8a8aa0', 2, 1); } break;
    case 1: px(-4, 0, '#3a8a7a', 9, 3); px(-3, 1, '#5ac0b0', 6, 1); if (i % 2) { px(3, -5, '#3a6a2a', 1, 5); px(2, -7, '#7a4a2a', 3, 3); } break;
    case 2: px(0, -6, '#8a8aa8', 5, 6); px(1, -7, '#a8a8c8', 3, 1); px(2, -5, '#5a5a7a', 1, 3); px(1, -4, '#5a5a7a', 3, 1); break;
    case 3: if (i % 2) { px(0, -2, '#3a2a3a', 5, 2); px(1, -5, '#ff8a3a', 3, 3); px(2, -7, '#ffde3a', 1, 2); } else { px(-3, -8, '#ff5d8f', 1, 8); px(3, -8, '#ffd84a', 1, 8); px(-3, -9, '#ffffff', 7, 1); } break;
    case 4: px(-5, 0, '#f4f8ff', 11, 3); px(-3, -1, '#ffffff', 7, 1); if (i % 3 === 0) { px(0, -6, '#9ad8ff', 3, 6); px(1, -8, '#c8f0ff', 1, 2); } break;
    case 5: px(-2, -2, '#8a6a2a', 5, 5); px(-1, -1, '#d8a84a', 3, 3); px(0, 0, '#3a2a1a', 1, 1); px(-3, 0, '#8a6a2a', 1, 1); px(3, 0, '#8a6a2a', 1, 1); px(0, -3, '#8a6a2a', 1, 1); px(0, 3, '#8a6a2a', 1, 1); break;
  }
}

const CASTLE_PAL = {
  fire: ['#ffcfb0', '#e09070', '#b0503a', '#ff5a2a', '#c02a1a', '#ffd23a'], water: ['#c8e8ff', '#90c0e8', '#5a8ac0', '#2a8aff', '#1a5ac0', '#bff4ff'],
  ice: ['#eaf8ff', '#bfe0f0', '#8ab0d0', '#9af0ff', '#5fa8ff', '#ffffff'], lightning: ['#d8e0ff', '#a0a8e0', '#6a70b0', '#4a8aff', '#2a4ac0', '#9ff6ff'],
  nature: ['#d8f0c0', '#a8d090', '#6a9a5a', '#3fae3a', '#2a7a2a', '#ffd84a'], dark: ['#8a7aa8', '#5a4a7a', '#3a2a5a', '#3a1a6a', '#1a0a3a', '#c8a0ff'],
  light: ['#fffaf0', '#f0e0b0', '#c8b080', '#ffcf3a', '#d8a020', '#ffffff'], void: ['#5a4a8a', '#3a2a6a', '#1a1040', '#5a3aff', '#2a1a8a', '#9a8aff'],
  salty: ['#f4f6fa', '#d0d8e8', '#a0aac0', '#8a9ab8', '#5a6a88', '#ffffff'], sweet: ['#ffe0f4', '#ffb0e0', '#d880b8', '#ff8ad8', '#d85ab8', '#7cf0ff'],
  meat: ['#ffc8b8', '#e89080', '#b05a4a', '#ff6a6a', '#c03a3a', '#ffd0b0'], treat: ['#ffe0b0', '#e8b070', '#a8703a', '#ffb02e', '#c87a1a', '#ff5d8f'],
};
function castlePreviewURL(el) {
  const saved = { castleKey: R.castleKey, castle: R.castle, castleFlags: R.castleFlags, castleTorches: R.castleTorches, castleGlow: R.castleGlow }; R.castleKey = null;
  const c = buildCastle({ tech: { walls1: 1, rafters1: 1, ballista1: 1 }, castleEl: el, maxhpMul: 1 });
  const crop = document.createElement('canvas'); crop.width = 110; crop.height = 240; crop.getContext('2d').drawImage(c, 0, 0, 110, 240, 0, 0, 110, 240);
  Object.assign(R, saved); return crop.toDataURL();
}
// the castle alone, trimmed to its visible pixels (playtest menu thumbnails)
const CASTLE_THUMBS = {};
function castleThumbURL(el) {
  if (CASTLE_THUMBS[el]) return CASTLE_THUMBS[el];
  const saved = { castleKey: R.castleKey, castle: R.castle, castleFlags: R.castleFlags, castleTorches: R.castleTorches, castleGlow: R.castleGlow }; R.castleKey = null;
  const c = buildCastle({ tech: {}, castleEl: el, maxhpMul: 1, stats: { bosses: [] } }); Object.assign(R, saved);
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 20) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const sh = typeof castleShape === 'function' && castleShape({ castleEl: el, stats: { bosses: [] } }); if (sh) y1 = Math.min(y1, sh.baseY + 1); // drop the palisade below the keep
  if (x1 < x0) return castlePreviewURL(el);
  const t = document.createElement('canvas'); t.width = x1 - x0 + 1; t.height = y1 - y0 + 1; t.getContext('2d').drawImage(c, x0, y0, t.width, t.height, 0, 0, t.width, t.height);
  return CASTLE_THUMBS[el] = t.toDataURL();
}
// one 5×5 trophy per conquered horde, hung on the keep's trophy ledge
const TROPHIES = [
  ['y.y.y', 'yyyyy', 'yryry', 'yyyyy', '.....'], ['.www.', 'w...w', 'wgggw', 'wgggw', '.www.'], ['.bbb.', 'bkbkb', 'bbbbb', '.b.b.', '.....'], ['.rrr.', 'rwrrr', '.rrr.', '..k..', '..k..'],
  ['.rrr.', 'rwrwr', 'rrrrr', '..w..', '..w..'], ['c.c.c', '.ccc.', 'ccccc', '.ccc.', 'c.c.c'], ['..s..', 'sssss', 's.s.s', 's.s.s', 'sssss'], ['.y.y.', 'yyyyy', 'yy.yy', 'yyyyy', '.y.y.'],
  ['..k..', '.kkk.', '..k..', 'k.k.k', '.kkk.'], ['.yy..', 'yyyy.', 'yyyyy', 'yyyyy', '.yyy.'],
];
const TROPHY_COL = { y: '#ffcf3a', r: '#ff3d3d', w: '#ffffff', g: '#7fe05a', b: '#f0ead8', k: '#2a2440', c: '#bfeeff', s: '#8a94b0' };
function drawTrophy(g, x, y, i) { const T = TROPHIES[i % TROPHIES.length]; x = Math.round(x); for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) { const ch = T[r][c]; if (ch === '.') continue; g.fillStyle = TROPHY_COL[ch]; g.fillRect(x + c, y + r, 1, 1); } }
// the living parts of the castle: flags flutter, torches flicker, the beacon pulses
function drawCastleLive(g, t) {
  for (const f of R.castleFlags || []) for (let i = 0; i < f.w; i++) { const wv = Math.round(Math.sin(t * 6 - i * 0.8) * (i / f.w) * 1.6), x = f.x + i, y = f.y + wv;
    g.fillStyle = OUTLINE; g.fillRect(x, y - 1, 1, 7 - Math.floor(i / 3)); g.fillStyle = f.col; g.fillRect(x, y, 1, 5 - Math.floor(i / 3)); if (i < 2) { g.fillStyle = '#ffffff'; g.fillRect(x, y + 1, 1, 1); } }
  for (const tc of R.castleTorches || []) { const fl = Math.floor(t * 12 + tc.x) % 3; g.fillStyle = '#ff5a2a'; g.fillRect(tc.x - 1, tc.y - 1 - fl % 2, 3, 3); g.fillStyle = '#ffd23a'; g.fillRect(tc.x, tc.y - 2 - fl, 1, 3); g.globalAlpha = 0.18; g.fillStyle = '#ffd23a'; g.fillRect(tc.x - 4, tc.y - 5, 9, 9); g.globalAlpha = 1; }
  for (const b of R.castleGlow || []) { const a = 0.25 + 0.2 * Math.sin(t * 3); g.globalAlpha = a; g.fillStyle = b.col || '#9ff6ff'; g.fillRect(b.x - 6, b.y - 6, 12, 12); g.globalAlpha = a * 0.5; g.fillRect(b.x - 10, b.y - 10, 20, 20); g.globalAlpha = 1; }
}

// ----- per-frame -----
function unitFrame(u, t) {
  if (u.atkT > 0) return 'atk';
  if (u.moving || u.flying) return Math.floor((t + (u.phase || 0)) * 6) % 2 ? 'walk0' : 'walk1';
  return Math.floor((t + (u.phase || 0)) * 2) % 2 ? 'idle1' : 'idle0';
}

// a red-flushed copy of a sprite frame, made once and cached
function redFrame(S, fr) {
  S.red = S.red || {}; if (S.red[fr]) return S.red[fr];
  const src = S.frames[fr], c = document.createElement('canvas'); c.width = src.width; c.height = src.height; const x = c.getContext('2d');
  x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(255,40,40,0.55)'; x.fillRect(0, 0, c.width, c.height);
  return (S.red[fr] = c);
}
function drawUnit(g, u, t, opts = {}) {
  const S = SPR[u.key] || ensureSprite(u.key); if (!S) return;
  const sc = (S.scale || u.scale || 1) * (u.vscale || 1), size = Math.round(20 * sc);
  const fr = opts.frame || unitFrame(u, t);
  const nativeFace = u.nativeFace || (u.side === 'enemy' ? -1 : 1);
  const flip = (u.facing || nativeFace) !== nativeFace;
  const bob = u.flying ? Math.round(Math.sin((t + (u.phase || 0)) * 6) * 1.5) : 0;
  const x = Math.round(u.x), y = Math.round(u.y - (u.z || 0) + bob);
  // shadow
  g.fillStyle = 'rgba(26,18,48,0.28)'; const sw = Math.round(8 * sc); g.fillRect(Math.round(u.x) - sw / 2, Math.round(u.y), sw, 2); g.fillRect(Math.round(u.x) - sw / 2 + 1, Math.round(u.y) - 1, sw - 2, 1);
  // rarity: a coloured ring at the feet, glowing for Mythic and up
  const rr = u.inst && u.inst.rarity; if (rr && u.alive !== false) { const rc = RARITY[rr].col, rw = Math.round(10 * sc) + 2, uy = Math.round(u.y);
    g.save(); g.globalAlpha = rr >= 3 ? 0.65 + 0.3 * Math.sin(t * 5 + (u.phase || 0)) : 0.75; g.fillStyle = rc;
    g.fillRect(x - rw / 2 + 2, uy + 1, rw - 4, 1); g.fillRect(x - rw / 2 + 2, uy - 3, rw - 4, 1); g.fillRect(x - rw / 2, uy - 2, 1, 3); g.fillRect(x + rw / 2 - 1, uy - 2, 1, 3);
    if (rr >= 5 && Math.random() < 0.15) { g.fillStyle = '#ffffff'; g.fillRect(x + Math.round((Math.random() - 0.5) * rw), y - Math.round(Math.random() * size), 1, 1); }
    g.restore(); }
  if (opts.selected) { g.fillStyle = '#ffd84a'; g.fillRect(x - 7, Math.round(u.y) + 1, 14, 1); g.fillRect(x - 6, Math.round(u.y) - 2, 1, 3); g.fillRect(x + 5, Math.round(u.y) - 2, 1, 3); }
  // an angry boss winding up: it swells, trembles and flushes red
  const fu = u.fury && u.alive !== false ? Math.min(1, u.fury.t / u.fury.dur) : 0;
  const img0 = u.hitT > 0 && u.alive !== false ? S.white[fr] : fu && Math.floor(t * 12) % 2 ? redFrame(S, fr) : S.frames[fr];
  // a Dark shade is the fallen foe as a purple silhouette
  const img = u.shade ? tintFrame(img0, u.hitT > 0 ? '#b48aff' : '#4a2a7a') : img0;
  const fs = fu ? Math.round(size * (1 + 0.14 * fu + 0.04 * Math.sin(t * 30))) : size, fx = fu ? x + randi(-1, 1) : x;
  // a champion standing still plays its own little idle (src/idles.js)
  const idle = !fu && !opts.frame && u.alive !== false && (fr === 'idle0' || fr === 'idle1') && typeof idleFor === 'function' ? idleFor(u, t, fr) : null;
  g.save(); if (opts.alpha != null) g.globalAlpha = opts.alpha;
  // star level (Cam 2026-10-23): 2★ and 3★ champions get a silver or gold border around the body instead of stars overhead
  const star = u.inst && !u.temp && u.alive !== false && u.side === 'hero' ? heroStar(u.inst) : u.alive !== false && u.wstar || 1;
  if (star > 1) { const col = STAR_COL[star - 1], o = Math.max(1, Math.round(fs / 20)), sil = tintFrame(img, col), I2 = idle && Object.assign({}, idle, { def: Object.assign({}, idle.def, { back: null, front: null }) });
    const a0 = g.globalAlpha;
    for (const [dx, dy, aa] of [[-2 * o, 0, 0.45], [2 * o, 0, 0.45], [0, -2 * o, 0.45], [0, 2 * o, 0.45], [-o, -o, 1], [o, -o, 1], [-o, o, 1], [o, o, 1], [-o, 0, 1], [o, 0, 1], [0, -o, 1], [0, o, 1]]) { g.globalAlpha = a0 * aa * (star === 3 ? 0.8 + 0.2 * Math.sin(t * 4 + (u.phase || 0)) : 0.95);
      if (I2) drawIdleUnit(g, sil, fx + dx, y + dy, fs, flip, I2);
      else if (flip) { const b = frameBox(sil, 0, y + dy, fs); g.save(); g.translate(fx + dx, 0); g.scale(-1, 1); g.drawImage(sil, b.x, b.y, b.w, b.h); g.restore(); }
      else { const b = frameBox(sil, fx + dx, y + dy, fs); g.drawImage(sil, b.x, b.y, b.w, b.h); } }
    g.globalAlpha = a0; }
  if (idle) drawIdleUnit(g, img, fx, y, fs, flip, idle);
  else if (flip) { const b = frameBox(img, 0, y, fs); g.translate(fx, 0); g.scale(-1, 1); g.drawImage(img, b.x, b.y, b.w, b.h); }
  else { const b = frameBox(img, fx, y, fs); g.drawImage(img, b.x, b.y, b.w, b.h); }
  g.restore();
  if (u.frozen > 0 && u.alive !== false) { g.globalAlpha = 0.45; g.fillStyle = '#bfeeff'; g.fillRect(x - size / 2 + 3, y - size + 4, size - 6, size - 4); g.globalAlpha = 1; }
  if (u.hat) { const hx = x + (u.facing === 1 ? 1 : -1), hy = y - Math.round(size * 0.86); g.fillStyle = OUTLINE; g.fillRect(hx - 3, hy, 7, 1); g.fillStyle = Math.floor(hx) % 2 ? '#ff5d8f' : '#5fd3ff'; g.fillRect(hx - 2, hy - 2, 5, 2); g.fillRect(hx - 1, hy - 4, 3, 2); g.fillStyle = '#ffd84a'; g.fillRect(hx, hy - 6, 1, 2); g.fillRect(hx - 1, hy - 1, 1, 1); }
  const inst = u.inst; if (inst && inst.mustache) { const mx = x + (flip ? -1 : 1) * Math.round(2 * sc), my = y - Math.round(12 * sc); g.fillStyle = '#3a2410'; g.fillRect(mx - 2, my, 5, 1); g.fillRect(mx - 3, my + 1, 2, 1); g.fillRect(mx + 2, my + 1, 2, 1); }
  if (u.els && u.els.length && u.alive !== false && Math.random() < 0.18) { const E = ELEMENTS[pick(u.els)]; FXS.parts.push({ x: x + rand(-5, 5), y: y - rand(2, size - 2), vx: rand(-4, 4), vy: rand(-16, -6), life: rand(0.4, 0.8), t: 0, color: Math.random() < 0.5 ? E.col : E.col2, size: 1, grav: -10 }); }
  if (u.shield > 1 && u.alive !== false) { g.strokeStyle = 'rgba(159,246,255,0.75)'; g.lineWidth = 1; g.strokeRect(x - 7.5 * sc, y - 17.5 * sc, 15 * sc, 18 * sc); }
  if (u.stun > 0 && u.alive !== false) { for (let i = 0; i < 3; i++) { const a = t * 6 + i * 2.1; g.fillStyle = '#ffde3a'; g.fillRect(Math.round(x + Math.cos(a) * 6), Math.round(y - size - 1 + Math.sin(a) * 2), 1, 1); } }
  if (u.taunt && u.alive !== false) { g.fillStyle = '#ff3d6e'; g.fillRect(x - 1, y - size - 4, 2, 3); g.fillRect(x - 1, y - size, 2, 1); }
  if (u.poison && u.poison.length) { if (Math.floor(t * 8) % 3 === 0) { g.fillStyle = '#9be05a'; g.fillRect(x + randi(-4, 4), y - randi(4, 14), 1, 1); } }
}

// ----- the hex field (Cam 2026-10-24) -----
// flat-topped hexes, a pixel gap between them so the grid reads as tiles; half-width at row dy shrinks towards the flat top
function hexHalf(dy) { return Math.round(14 - 7 * Math.abs(dy) / 11); }
function fillHex(g, cx, cy, inset) { for (let dy = -10 + inset; dy <= 10 - inset; dy++) { const w = hexHalf(dy) - inset; g.fillRect(cx - w, cy + dy, w * 2, 1); } }
function hexCentre(c, r) { const p = cellPos(c, r); return { x: Math.round(p.x), y: Math.round(p.y - 6) }; }
// prep: every hex, the hovered one, and the two-hex circle the dragged or selected champion will guard
function drawHexGrid(g, t, run, V) {
  let zone = null;
  if (V.hover && V.hover.type === 'grid') zone = V.hover;
  else if (V.selected) { const h = run.roster.find(x => x.uid === V.selected && x.place && x.place.type === 'grid'); if (h) zone = h.place; }
  for (let c = 0; c < GRID.cols; c++) for (let r = 0; r < hexRows(c); r++) {
    const p = hexCentre(c, r), hov = V.hover && V.hover.type === 'grid' && V.hover.c === c && V.hover.r === r, inZ = zone && hexDist(zone, { c, r }) <= HEX.guard;
    const court = c < GRID.courtCols;
    // a dark rim, then the tile: warm on the courtyard stones, green out on the field
    g.fillStyle = court ? 'rgba(60,40,20,0.30)' : 'rgba(20,50,20,0.22)'; fillHex(g, p.x, p.y, 0);
    g.fillStyle = hov ? (V.hoverOk ? 'rgba(124,240,154,0.6)' : 'rgba(255,93,143,0.6)') : inZ ? 'rgba(255,216,74,' + (0.38 + 0.08 * Math.sin(t * 4)).toFixed(3) + ')' : court ? 'rgba(255,240,200,0.20)' : 'rgba(200,255,170,0.14)';
    fillHex(g, p.x, p.y, 1);
    g.fillStyle = inZ ? 'rgba(255,240,170,0.7)' : 'rgba(255,255,255,0.35)'; const w = hexHalf(-9) - 1; g.fillRect(p.x - w, p.y - 9, w * 2, 1);
  }
}
// battle: a faint ring of hexes under the selected champion, so you can see what it will hold
function drawGuardRing(g, t, B, V) {
  const u = V.selected && B.heroes.find(h => h.alive && !h.temp && !h.rafter && h.inst && h.inst.uid === V.selected); if (!u || u.hx == null) return;
  const home = hexAt(u.hx, u.hy); if (!home) return;
  for (let c = 0; c < GRID.cols; c++) for (let r = 0; r < hexRows(c); r++) if (hexDist(home, { c, r }) <= HEX.guard) { const p = hexCentre(c, r); g.fillStyle = 'rgba(255,216,74,0.12)'; fillHex(g, p.x, p.y, 1); }
}

// ----- the horde's camp and attack plan, shown before the siege -----
// what each gate will send: the real wave the scouts rolled, counted by foe
function planGroups(run) {
  const plan = planOf(run); if (!plan) return null;
  const wave = planWave(run), groups = plan.routes.map(() => ({ n: 0, ids: {}, elite: 0, fly: 0 }));
  for (const q of wave) if (q.id && !q.boss && q.route != null) { const G0 = groups[q.route]; G0.n++; G0.ids[q.id] = (G0.ids[q.id] || 0) + 1; if (ENEMIES[q.id].elite) G0.elite++; if (ENEMIES[q.id].kind === 'flyer') G0.fly++; }
  const wb = warbandFighters(run); if (wb.length) groups[plan.elite].wb = wb;
  const boss = wave.find(q => q.boss);
  return { plan, groups, boss: boss && boss.id };
}
function drawCampGate(g, x, y, F, t) {
  // two sharpened posts, a crossbar and the horde's banner
  g.fillStyle = OUTLINE; g.fillRect(x - 1, y - 21, 4, 22); g.fillRect(x + 15, y - 21, 4, 22); g.fillRect(x - 1, y - 18, 20, 3);
  g.fillStyle = '#8a5a2a'; g.fillRect(x, y - 20, 2, 20); g.fillRect(x + 16, y - 20, 2, 20); g.fillStyle = '#b07a3a'; g.fillRect(x, y - 17, 18, 1);
  g.fillStyle = '#e8e2d0'; g.fillRect(x, y - 22, 2, 1); g.fillRect(x + 16, y - 22, 2, 1);
  const wv = Math.round(Math.sin(t * 3 + y) * 1); g.fillStyle = OUTLINE; g.fillRect(x + 5, y - 16, 8, 9 + wv); g.fillStyle = F.tint; g.fillRect(x + 6, y - 16, 6, 8 + wv); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x + 6, y - 16, 6, 1);
}
// the horde's camp wall along the right edge, with a gap for every gate the scouts saw
function drawCampWall(g, t, plan) {
  const gaps = plan ? plan.routes.map(r => r.y0) : [];
  // two staggered rows of sharpened logs, the back row taller; each log is drawn from its foot up
  for (const [x, h0, dy] of [[W - 8, 16, 0], [W - 13, 11, 2]]) for (let y = GRID.y + dy; y < H + 8; y += 5) { if (gaps.some(gy => y > gy - 14 && y < gy + 8)) continue; const h = h0 + ((y * 7) % 4);
    g.fillStyle = OUTLINE; g.fillRect(x - 1, y - h - 1, 6, h + 2); g.fillStyle = '#7a4a2a'; g.fillRect(x, y - h, 4, h); g.fillStyle = '#a8703a'; g.fillRect(x, y - h, 1, h); g.fillStyle = '#5a3418'; g.fillRect(x + 3, y - h, 1, h);
    g.fillStyle = OUTLINE; g.fillRect(x + 1, y - h - 2, 2, 1); g.fillStyle = '#e8e2d0'; g.fillRect(x + 1, y - h - 1, 2, 1); }
}
function drawAttackPlan(g, t, run) {
  const P = planGroups(run); if (!P) return;
  const F = FACTIONS[factionIndex(run.siege)], x1 = CASTLE_X + 14;
  drawCampWall(g, t, P.plan); for (const rt of P.plan.routes) drawCampGate(g, W - 22, rt.y0 + 4, F, t);
  P.plan.routes.forEach((rt, i) => {
    const K = ROUTE_KINDS[rt.kind], grp = P.groups[i], thick = rt.w > 0.45 ? 3 : rt.w > 0.25 ? 2 : 1;
    // the path: a dotted trail of chevrons marching from the gate to the wall
    for (let x = W - 46; x > x1; x -= 3) { const y = Math.round(routeY(rt, x)), ph = ((W - x) / 3 + Math.floor(t * 8)) % 6;
      g.fillStyle = OUTLINE; g.globalAlpha = 0.35; g.fillRect(x, y + 1, 2, thick); g.globalAlpha = ph < 2 ? 0.95 : 0.45; g.fillStyle = K.col; g.fillRect(x, y, 2, thick); }
    g.globalAlpha = 1;
    // arrowhead where the column hits the wall
    const ay = Math.round(routeY(rt, x1)); g.fillStyle = OUTLINE; for (let d = -4; d <= 4; d++) g.fillRect(x1 - 1 + Math.abs(d), ay + d, 3, 1); g.fillStyle = K.col; for (let d = -3; d <= 3; d++) g.fillRect(x1 + Math.abs(d), ay + d, 2, 1);
    // the column itself, standing in front of its gate: the commonest foes first, an elite or turncoat at the head
    const ids = Object.entries(grp.ids).sort((a, b) => (ENEMIES[b[0]].elite ? 99 : b[1]) - (ENEMIES[a[0]].elite ? 99 : a[1])).map(e => e[0]);
    const show = []; for (const id of ids) for (let k = 0; k < Math.min(grp.ids[id], ENEMIES[id].elite ? 1 : 3) && show.length < 5; k++) show.push({ key: 'e:' + id, d: ENEMIES[id] });
    if (grp.wb) for (const w of grp.wb.slice(0, 2)) show.unshift({ key: 'h:' + w.id, hero: true });
    show.slice(0, 6).forEach((m, j) => { const u = { key: m.key, x: W - 36 - (j % 3) * 9 - Math.floor(j / 3) * 4, y: rt.y0 + (j < 3 ? -3 : 5) + (j % 2), side: 'enemy', facing: -1, phase: i + j * 0.37, scale: m.d ? m.d.scale || 1 : 1.05, flying: m.d && m.d.kind === 'flyer', z: m.d && m.d.kind === 'flyer' ? 8 : 0, nativeFace: m.hero ? 1 : undefined, alive: true };
      drawUnit(g, u, t); });
    if (i === P.plan.elite && (grp.elite || grp.wb)) { const cx = W - 40, cy = rt.y0 - 26; g.fillStyle = OUTLINE; g.fillRect(cx - 1, cy - 1, 9, 6); g.fillStyle = '#ffd84a'; g.fillRect(cx, cy + 1, 7, 3); g.fillRect(cx, cy - 1, 1, 2); g.fillRect(cx + 3, cy - 1, 1, 2); g.fillRect(cx + 6, cy - 1, 1, 2); }
  });
  if (P.boss) drawUnit(g, { key: 'e:' + P.boss, x: W - 70, y: GRID.y + GRID.rows * GRID.cell / 2 + 6, side: 'enemy', facing: -1, phase: 0, scale: ENEMIES[P.boss].scale || 1, alive: true }, t);
}
// hi-res labels for the plan: how many foes each gate sends and what that column goes for
function drawPlanLabels(ctx, k, run) {
  const P = planGroups(run); if (!P) return;
  ctx.save(); ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.lineWidth = 1.5 * k; ctx.strokeStyle = OUTLINE; ctx.lineJoin = 'round';
  P.plan.routes.forEach((rt, i) => { const K = ROUTE_KINDS[rt.kind], grp = P.groups[i], x = (W - 46) * k, y = (rt.y0 - 21) * k;
    ctx.font = `700 ${5 * k}px "Fredoka", "Atkinson Hyperlegible", sans-serif`; ctx.fillStyle = '#ffffff';
    const head = `${grp.n + (grp.wb ? grp.wb.length : 0)} foes${grp.fly ? ` · ${grp.fly} flying` : ''}`; ctx.strokeText(head, x, y); ctx.fillText(head, x, y);
    ctx.font = `600 ${4.5 * k}px "Fredoka", "Atkinson Hyperlegible", sans-serif`; ctx.fillStyle = K.col; const sub = K.name.toUpperCase(); ctx.strokeText(sub, x, y + 5.5 * k); ctx.fillText(sub, x, y + 5.5 * k); });
  if (P.boss) { const x = (W - 70) * k, y = (GRID.y + GRID.rows * GRID.cell / 2 - 30) * k; ctx.textAlign = 'center'; ctx.font = `700 ${5 * k}px "Fredoka", "Atkinson Hyperlegible", sans-serif`; ctx.fillStyle = '#ff9a9a'; ctx.strokeText(ENEMIES[P.boss].name, x, y); ctx.fillText(ENEMIES[P.boss].name, x, y); }
  ctx.restore();
}
// during the siege: pulsing chevrons at each gate while the horde is still coming
function drawSpawnArrows(g, t, live, plan) {
  const ys = plan ? plan.routes.map(r => r.y0 - 6) : [0, 1, 2].map(i => Math.round(GRID.y + 4 + (GRID.rows * GRID.cell - 4) * (i + 0.5) / 3));
  ys.forEach((cy, i) => { const n = plan ? (plan.routes[i].w > 0.45 ? 3 : plan.routes[i].w > 0.25 ? 2 : 1) : 3, col = plan ? ROUTE_KINDS[plan.routes[i].kind].col : '#ff4a6a';
    for (let j = 0; j < n; j++) {
      const ph = (t * 1.6 + j / 3) % 1, x = Math.round(W - 6 - ph * 22), a = Math.sin(ph * Math.PI);
      g.globalAlpha = a * (live ? 0.9 : 0.75);
      g.fillStyle = OUTLINE; for (let d = -5; d <= 5; d++) g.fillRect(x + Math.abs(d) - 1, cy + d, 4, 1);
      g.fillStyle = col; for (let d = -4; d <= 4; d++) g.fillRect(x + Math.abs(d), cy + d, 2, 1);
    } });
  g.globalAlpha = 1;
}
function drawBar(g, u, sc) {
  const hero = u.side === 'hero' && !u.temp, bh = hero ? 3 : 2;
  const w = Math.round((hero ? 18 : 14) * Math.min(sc, 1.6)), x = Math.round(u.x - w / 2), y = Math.round(u.y - (u.z || 0) - 21 * sc + (u.flying ? -2 : 0)) - (hero ? 2 : 0);
  const mana = hero && u.st && u.st.sigOn;
  g.fillStyle = OUTLINE; g.fillRect(x - 1, y - 1, w + 2, bh + 2 + (mana ? 2 : 0));
  g.fillStyle = '#3a2a4a'; g.fillRect(x, y, w, bh);
  const f = Math.max(0, u.hp / u.maxHp);
  g.fillStyle = hero ? (f < 0.3 ? '#ffb02e' : '#5ee07a') : (u.def && u.def.elite ? '#ffb02e' : '#ff4a6a'); g.fillRect(x, y, Math.max(0, Math.round(w * f)), bh);
  if (hero) { g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(x, y, Math.max(0, Math.round(w * f)), 1); g.fillStyle = OUTLINE; for (let k = 1; k < 4; k++) g.fillRect(x + Math.round(w * k / 4), y + 1, 1, bh - 1); }
  if (u.shield > 1) { g.fillStyle = '#9ff6ff'; g.fillRect(x, y, Math.min(w, Math.round(w * u.shield / u.maxHp)), 1); }
  if (mana) { g.fillStyle = '#2a3a6a'; g.fillRect(x, y + bh + 1, w, 1); g.fillStyle = u.mana >= u.maxMana ? '#ffffff' : '#5fa8ff'; g.fillRect(x, y + bh + 1, Math.round(w * u.mana / u.maxMana), 1); }
}

function drawProj(g, p) {
  if (p.o && p.o.vfx) return; // signature projectiles draw on the hi-res pass
  const x = Math.round(p.x), y = Math.round(p.y), ang = Math.atan2(p.ty - p.sy, p.tx - p.sx);
  const c = Math.cos(ang), s = Math.sin(ang);
  if (p.o && p.o.rafter) { // rafter shots leave a long golden streak so you can see the wall firing
    const n = 16; for (let i = 2; i < n; i++) { g.globalAlpha = 0.75 * (1 - i / n); g.fillStyle = i < 6 ? '#fff6c0' : '#ffd84a'; g.fillRect(Math.round(x - c * i * 1.5), Math.round(y - s * i * 1.5), 2, 1); }
    g.globalAlpha = 1; }
  switch (p.type) {
    case 'arrow': case 'arrowGold': case 'bolt': { const col = p.type === 'arrowGold' ? '#ffde3a' : p.type === 'bolt' ? '#dfe6f5' : '#c9a06a', L = p.type === 'bolt' ? 8 : 6;
      for (let i = 0; i < L; i++) { g.fillStyle = i < 2 ? '#ffffff' : col; g.fillRect(Math.round(x - c * i), Math.round(y - s * i), 1, 1); } g.fillStyle = '#ff5d8f'; g.fillRect(Math.round(x - c * L), Math.round(y - s * L), 1, 1); break; }
    case 'fire': g.fillStyle = '#ff3d3d'; g.fillRect(x - 2, y - 2, 4, 4); g.fillStyle = '#ffde3a'; g.fillRect(x - 1, y - 1, 2, 2); break;
    case 'fireBig': g.fillStyle = '#ff3d3d'; g.fillRect(x - 4, y - 4, 8, 8); g.fillStyle = '#ff8a3a'; g.fillRect(x - 3, y - 3, 6, 6); g.fillStyle = '#ffde3a'; g.fillRect(x - 2, y - 2, 4, 4); g.fillStyle = '#ffffff'; g.fillRect(x - 1, y - 1, 2, 2);
      for (let i = 1; i < 6; i++) { g.fillStyle = i % 2 ? '#ff8a3a' : '#ffde3a'; g.fillRect(Math.round(x - c * i * 2), Math.round(y - s * i * 2 + Math.sin(R.t * 30 + i)), 2, 2); } break;
    case 'spark': g.fillStyle = '#9ff6ff'; g.fillRect(x - 1, y - 1, 3, 3); g.fillStyle = '#ffffff'; g.fillRect(x, y, 1, 1); g.fillRect(x - 2, y, 1, 1); g.fillRect(x + 2, y, 1, 1); break;
    case 'soul': g.fillStyle = '#9dff6a'; g.fillRect(x - 1, y - 1, 3, 3); g.fillStyle = '#e8ffd0'; g.fillRect(x, y, 1, 1); g.fillStyle = '#5ab03a'; g.fillRect(Math.round(x - c * 3), Math.round(y - s * 3), 1, 1); break;
    case 'heal': g.fillStyle = '#7cf09a'; g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); g.fillStyle = '#ffffff'; g.fillRect(x, y, 1, 1); break;
    case 'spit': g.fillStyle = '#9be05a'; g.fillRect(x - 1, y - 1, 3, 3); g.fillStyle = '#d8ff9a'; g.fillRect(x, y - 1, 1, 1); break;
    case 'bubble': g.fillStyle = '#5fd3ff'; g.fillRect(x - 2, y - 1, 5, 3); g.fillRect(x - 1, y - 2, 3, 5); g.fillStyle = '#ffffff'; g.fillRect(x - 1, y - 1, 1, 1); break;
    case 'rock': g.fillStyle = '#8a8aa0'; g.fillRect(x - 1, y - 1, 3, 3); g.fillStyle = '#c8c8d8'; g.fillRect(x - 1, y - 1, 1, 1); break;
    case 'ice': for (let i = 0; i < 5; i++) { g.fillStyle = i < 2 ? '#ffffff' : '#9af0ff'; g.fillRect(Math.round(x - c * i), Math.round(y - s * i), 1, 1); } break;
    case 'bullet': g.fillStyle = OUTLINE; g.fillRect(x - 2, y - 2, 4, 4); g.fillStyle = '#5a5a6e'; g.fillRect(x - 1, y - 1, 2, 2); break;
    case 'ham': g.fillStyle = OUTLINE; g.fillRect(x - 6, y - 4, 12, 9); g.fillStyle = '#ff6a6a'; g.fillRect(x - 5, y - 3, 9, 7); g.fillStyle = '#ffd0b0'; g.fillRect(x - 4, y - 3, 3, 2); g.fillStyle = '#f4f0e8'; g.fillRect(x + 4, y - 1, 3, 2); g.fillRect(x + 6, y - 2, 1, 4); break;
    case 'cannon': g.fillStyle = OUTLINE; g.fillRect(x - 3, y - 3, 6, 6); g.fillStyle = '#5a5a6e'; g.fillRect(x - 2, y - 2, 4, 4); g.fillStyle = '#a8a8c0'; g.fillRect(x - 2, y - 2, 1, 1); g.fillStyle = '#ffde3a'; g.fillRect(Math.round(x - c * 5), Math.round(y - s * 5), 1, 1); break;
  }
}

// ----- field hazards: ground layer (over=false) under the units, weather layer (over=true) on top -----
// box is the field area; the same painter draws the little preview on the encounter card.
function drawHazard(g, id, box, t, B, over) {
  const Z = HAZARDS[id]; if (!Z) return; const k = Z.kind, X = box.x, Y = box.y, Wd = box.w, Hd = box.h;
  if (!over && k === 'flood') { const x0 = Math.round(B || Wd > 200 ? FLOOD.x0 : X + Wd * 0.4), x1 = Math.round(B || Wd > 200 ? FLOOD.x1 : X + Wd * 0.62);
    g.fillStyle = '#6a4a2a'; g.fillRect(x0 - 2, Y, 2, Hd); g.fillRect(x1, Y, 2, Hd);
    g.fillStyle = 'rgba(58,138,216,0.62)'; g.fillRect(x0, Y, x1 - x0, Hd);
    for (let y = Y + 2; y < Y + Hd; y += 5) { const off = Math.round(Math.sin(y * 0.3 + t * 3) * 4); g.fillStyle = 'rgba(191,244,255,0.55)'; g.fillRect(x0 + 4 + ((y * 7) % Math.max(1, x1 - x0 - 14)) + off, y, 6, 1); }
    g.fillStyle = 'rgba(255,255,255,0.35)'; for (let y = Y; y < Y + Hd; y += 3) { if (Math.sin(y * 0.7 + t * 6) > 0.6) { g.fillRect(x0, y, 1, 2); g.fillRect(x1 - 1, y + 1, 1, 2); } } }
  if (!over && k === 'mud') { const snow = id === 'snow', base = Z.col;
    g.fillStyle = snow ? 'rgba(232,244,255,0.42)' : id === 'slime' ? 'rgba(90,190,80,0.30)' : 'rgba(110,76,40,0.40)'; g.fillRect(X, Y, Wd, Hd);
    for (let i = 0; i < Wd * Hd / 140; i++) { const px = X + Math.floor(hash(i, 3) * Wd), py = Y + Math.floor(hash(i, 7) * Hd), w = 3 + Math.floor(hash(i, 11) * 7);
      g.fillStyle = hash(i, 13) < 0.5 ? base : snow ? '#ffffff' : id === 'slime' ? '#b8f0a0' : '#5a3a1a'; g.globalAlpha = snow ? 0.8 : 0.6; g.fillRect(px, py, w, 2); g.fillRect(px + 1, py - 1, w - 2, 1); }
    if (id === 'slime') for (let i = 0; i < 8; i++) { const ph = (t * 0.7 + hash(i, 5)) % 1, px = X + Math.floor(hash(i, 9) * Wd), py = Y + Math.floor(hash(i, 17) * Hd); g.globalAlpha = 1 - ph; g.fillStyle = '#d8ffc8'; g.fillRect(px, py - Math.round(ph * 3), 2, 2); }
    g.globalAlpha = 1; }
  if (!over && k === 'goldrush') { for (let i = 0; i < Wd * Hd / 900; i++) { const px = X + Math.floor(hash(i, 21) * Wd), py = Y + Math.floor(hash(i, 23) * Hd), tw = Math.sin(t * 3 + i * 1.7) > 0.85;
      g.fillStyle = '#8a6a2a'; g.fillRect(px - 1, py, 4, 1); g.fillStyle = '#ffd84a'; g.fillRect(px, py - 1, 2, 1);
      if (tw) { g.fillStyle = '#ffffff'; g.fillRect(px, py - 4, 1, 3); g.fillRect(px - 1, py - 3, 3, 1); } } }
  if (!over && k === 'embers') { const P = B ? B.hzPatches : [0, 1, 2].map(i => ({ x: X + Wd * (0.25 + 0.25 * i), y: Y + Hd * (0.35 + 0.25 * (i % 2)), r: Math.min(15, Hd * 0.3), t: 2, life: 6 }));
    for (const p of P) { const a = Math.min(1, p.t / 0.8) * Math.min(1, (p.life - p.t) / 0.8), x = Math.round(p.x), y = Math.round(p.y);
      g.globalAlpha = 0.5 * a; g.fillStyle = '#2a1408'; g.beginPath(); g.ellipse(x, y, p.r, p.r * 0.55, 0, 0, Math.PI * 2); g.fill();
      if (p.t < 0.8) { g.globalAlpha = 0.6; g.strokeStyle = '#ff8a3a'; g.beginPath(); g.ellipse(x, y, p.r * p.t / 0.8, p.r * 0.55 * p.t / 0.8, 0, 0, Math.PI * 2); g.stroke(); }
      else { g.globalAlpha = 0.35 * a; g.fillStyle = '#ff6a1a'; g.beginPath(); g.ellipse(x, y, p.r * 0.8, p.r * 0.42, 0, 0, Math.PI * 2); g.fill();
      for (let i = 0; i < 14; i++) { const ang = hash(i, x) * Math.PI * 2, rr = hash(i, y) * p.r * 0.85, fx = Math.round(x + Math.cos(ang) * rr), fy = Math.round(y + Math.sin(ang) * rr * 0.55), fl = Math.floor(t * 10 + i) % 3;
        g.globalAlpha = a; g.fillStyle = '#ff3d1a'; g.fillRect(fx - 1, fy - 2 - fl, 3, 3 + fl); g.fillStyle = '#ffd23a'; g.fillRect(fx, fy - 1 - fl, 1, 2 + fl); } } }
    g.globalAlpha = 1; }
  if (over && k === 'fog') { for (let i = 0; i < 14; i++) { const sp = 6 + hash(i, 2) * 10, px = X + ((hash(i, 4) * Wd - t * sp) % Wd + Wd) % Wd, py = Y - 10 + hash(i, 6) * (Hd + 10), r = 26 + hash(i, 8) * 22;
      g.globalAlpha = 0.22; g.fillStyle = '#dfe4ea'; g.beginPath(); g.ellipse(px, py, r, r * 0.45, 0, 0, Math.PI * 2); g.fill(); }
    g.globalAlpha = 0.12; g.fillStyle = '#c9d0d8'; g.fillRect(X, Y - 20, Wd, Hd + 20); g.globalAlpha = 1; }
  if (over && k === 'gale') { g.fillStyle = 'rgba(255,255,255,0.85)'; for (let i = 0; i < 28; i++) { const sp = 160 + hash(i, 3) * 120, len = 8 + Math.floor(hash(i, 5) * 14), px = X + Wd - ((t * sp + hash(i, 9) * Wd) % (Wd + 30)), py = Y - 30 + Math.floor(hash(i, 7) * (Hd + 30)) + Math.round(Math.sin(t * 5 + i) * 2);
      g.fillRect(Math.round(px), py, len, 1); }
    for (let i = 0; i < 6; i++) { const px = X + Wd - ((t * 120 + hash(i, 31) * Wd) % Wd), py = Y + hash(i, 33) * Hd + Math.sin(t * 6 + i) * 6; g.fillStyle = i % 2 ? '#7cc05a' : '#c9a35a'; g.fillRect(Math.round(px), Math.round(py), 2, 1); } }
  if (over && k === 'embers') { for (let i = 0; i < 12; i++) { const ph = (t * (0.18 + hash(i, 1) * 0.15) + hash(i, 3)) % 1, px = X + hash(i, 5) * Wd + Math.sin(t * 2 + i) * 6, py = Y - 60 + ph * (Hd + 60);
      g.globalAlpha = 1 - ph * 0.6; g.fillStyle = Math.floor(t * 8 + i) % 2 ? '#ffd23a' : '#ff6a3d'; g.fillRect(Math.round(px), Math.round(py), 1, 2); } g.globalAlpha = 1; }
  if (over && k === 'rocks' && !B) { for (let i = 0; i < 3; i++) { const x = Math.round(X + Wd * (0.3 + 0.2 * i)), y = Math.round(Y + Hd * (0.4 + 0.15 * (i % 2)));
      g.strokeStyle = `rgba(255,61,110,${0.4 + 0.4 * Math.abs(Math.sin(t * 6 + i))})`; g.beginPath(); g.ellipse(x, y, 10, 5.5, 0, 0, Math.PI * 2); g.stroke(); g.fillStyle = '#7a6a5a'; g.fillRect(x - 3, y - 18 - i * 6, 6, 5); g.fillStyle = '#c9bca8'; g.fillRect(x - 2, y - 18 - i * 6, 3, 2); } }
}
// a still frame of a hazard on a strip of grass, for encounter cards
const HZ_THUMBS = {};
function hazardThumbURL(id) {
  if (HZ_THUMBS[id]) return HZ_THUMBS[id];
  const c = document.createElement('canvas'); c.width = 96; c.height = 48; const g = c.getContext('2d');
  g.fillStyle = '#6cbf4a'; g.fillRect(0, 0, 96, 48); g.fillStyle = '#5aa63e'; for (let i = 0; i < 40; i++) g.fillRect(Math.floor(hash(i, 41) * 96), Math.floor(hash(i, 43) * 48), 2, 1);
  g.fillStyle = '#9a9ab8'; g.fillRect(0, 0, 8, 48); g.fillStyle = '#c9c4e6'; g.fillRect(0, 0, 7, 48);
  drawHazard(g, id, { x: 10, y: 4, w: 86, h: 42 }, 1.3, null, false); drawHazard(g, id, { x: 10, y: 4, w: 86, h: 42 }, 1.3, null, true);
  return HZ_THUMBS[id] = c.toDataURL();
}

function renderFrame(V, dt) {
  R.t += dt; const g = R.lctx, run = V.run, B = V.B, t = R.t;
  const fi = factionIndex(run.siege);
  const hall = run.finale === 'ready';
  const bgKey = hall ? 'hall' : fi + ':' + (run.castleEl || 'stone');
  if (!R.bg[bgKey]) R.bg[bgKey] = hall ? buildHall() : buildBackground(fi, run.castleEl);
  g.imageSmoothingEnabled = false;
  g.drawImage(R.bg[bgKey], 0, 0);
  if (hall) drawHallLive(g, t, B);
  else if (typeof drawSceneLive === 'function') drawSceneLive(g, run.castleEl, t);
  // clouds
  if (!hall) for (const c of R.clouds) { c.x += c.s * dt; if (c.x > W + 40) { c.x = -c.w - 10; c.y = rand(6, 50); }
    g.fillStyle = ['fire','dark','void','lightning'].includes(run.castleEl) ? '#ac9298' : '#ffffff'; g.fillRect(Math.round(c.x), Math.round(c.y), c.w, 4); g.fillRect(Math.round(c.x + 4), Math.round(c.y - 3), c.w - 10, 3); g.fillRect(Math.round(c.x + c.w * 0.4), Math.round(c.y - 5), c.w * 0.35, 2);
    g.fillStyle = ['fire','dark','void','lightning'].includes(run.castleEl) ? '#7d707f' : '#e4ecff'; g.fillRect(Math.round(c.x + 2), Math.round(c.y + 4), c.w - 4, 1); }
  // castle
  if (!hall) { const cv = buildCastle(run); g.drawImage(cv, 0, 0); drawCastleLive(g, t); if (typeof drawCastleAlive === 'function') drawCastleAlive(g, run, t, cv); }
  if (!hall && run.castleEl && Math.random() < dt * 14) { const E = ELEMENTS[run.castleEl]; FXS.parts.push({ x: rand(4, 96), y: rand(10, 80), vx: rand(-6, 6), vy: run.castleEl === 'ice' || run.castleEl === 'sweet' ? rand(8, 20) : rand(-20, -6), life: rand(0.8, 1.6), t: 0, color: Math.random() < 0.5 ? E.col : E.col2, size: Math.random() < 0.3 ? 2 : 1, grav: 0 }); }
  // castle damage
  const hpf = run.castle.hp / run.castle.max;
  if (!hall && hpf < 0.66) { g.fillStyle = OUTLINE; [[70, 100], [12, 120], [84, 230], [40, 200]].slice(0, hpf < 0.33 ? 4 : 2).forEach(([x, y]) => { g.fillRect(x, y, 1, 4); g.fillRect(x + 1, y + 3, 1, 4); g.fillRect(x - 1, y + 6, 1, 3); }); }
  if (!hall && hpf < 0.33) for (const [x, y] of [[20, 40], [74, 72], [48, 40]]) { for (let i = 0; i < 4; i++) { g.fillStyle = pick(['#ff8a3a', '#ffde3a', '#ff3d3d']); g.fillRect(x + randi(-2, 2), y - randi(0, 6), 2, 2); } }
  if (B && B.castleHitT > 0) { B.castleHitT -= dt; g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(58, 72, 36, H - 72); }
  // siege ladders and the battering ram
  if (B) { for (const e of B.enemies) if (e.alive && e.climb) { const L = e.climb, k = L.phase === 'raise' ? Math.min(1, L.t / 1.1) : 1, by = Math.round(L.y0), ty = by - (by - castleRafterY(run) + 4) * k, bx = CASTLE_X + 8;
      for (const ox of [0, 6]) { g.fillStyle = OUTLINE; g.fillRect(bx + ox - 1, Math.round(ty), 3, by - Math.round(ty)); g.fillStyle = '#b07a3a'; g.fillRect(bx + ox, Math.round(ty), 1, by - Math.round(ty)); }
      g.fillStyle = '#8a5a2a'; for (let y = by - 4; y > ty; y -= 6) g.fillRect(bx, y, 7, 1); }
    if (B.ram && B.ram.crew.length) { const R = B.ram, cx = R.crew.reduce((a, e) => a + e.x, 0) / R.crew.length, sw = R.swing < 0.8 ? R.swing / 0.8 * 8 : 8 - (R.swing - 0.8) / 0.2 * 8, x = Math.round(Math.min(cx, CASTLE_X + 30) - 14 + sw - 8), y = Math.round(R.y - 12);
      g.fillStyle = OUTLINE; g.fillRect(x - 1, y - 1, 32, 7); g.fillStyle = '#8a5a2a'; g.fillRect(x, y, 30, 5); g.fillStyle = '#b07a3a'; g.fillRect(x, y, 30, 1); g.fillStyle = '#6a4a2a'; for (let i = 4; i < 30; i += 7) g.fillRect(x + i, y + 1, 1, 4);
      g.fillStyle = '#8a94b0'; g.fillRect(x - 3, y - 1, 5, 7); g.fillStyle = '#cfd6e6'; g.fillRect(x - 3, y, 2, 2); }
  }
  // grid in prep
  if (!B) {
    drawHexGrid(g, t, run, V);
    for (let i = 0; i < rafterSlots(run); i++) { const slot = rafterPosition(run, i), x = slot.x, hov = V.hover && V.hover.type === 'rafter' && V.hover.i === i;
      g.fillStyle = hov ? (V.hoverOk ? 'rgba(124,240,154,0.6)' : 'rgba(255,93,143,0.6)') : 'rgba(255,216,74,0.25)'; g.fillRect(x - 8, slot.y - 18, 16, 19); }
  }
  drawHazard(g, B ? B.hz : run.mods.hz, { x: CASTLE_X + 4, y: 98, w: W - CASTLE_X - 4, h: H - 98 }, t, B, false);
  if (B) drawGuardRing(g, t, B, V);
  if (B && B.plan) { const F = FACTIONS[factionIndex(run.siege)]; drawCampWall(g, t, B.plan); for (const rt of B.plan.routes) drawCampGate(g, W - 22, rt.y0 + 4, F, t); }
  if (!B && run.finale !== 'ready') drawAttackPlan(g, t, run);
  drawSpellDecals(g); drawStyleGround(g, B, t); if (typeof drawUltGround === 'function') drawUltGround(g, typeof B !== 'undefined' ? B : null);
  // units
  let units;
  if (B) units = [...B.heroes.filter(h => h.alive || (h.deadT != null && !h.temp)), ...B.enemies];
  else units = V.prepUnits;
  units.sort((a, b) => (a.flying ? a.y + 30 : a.y) - (b.flying ? b.y + 30 : b.y));
  // rafter units are drawn after the castle and before ground units sorted
  for (const u of units) {
    if (u.alive === false) { // tombstone
      const x = Math.round(u.x), y = Math.round(u.y); g.fillStyle = OUTLINE; g.fillRect(x - 4, y - 9, 8, 10); g.fillStyle = '#c9c4e6'; g.fillRect(x - 3, y - 8, 6, 8); g.fillStyle = '#8a83b8'; g.fillRect(x - 1, y - 7, 2, 5); g.fillRect(x - 2, y - 6, 4, 1); continue; }
    drawUnit(g, u, t, { selected: V.selected && u.inst && u.inst.uid === V.selected });
    if (u.shards) drawShardCrown(g, u, t);
  }
  for (const gh of FXS.ghosts) { const S = SPR[gh.key]; if (!S) continue; g.globalAlpha = 0.4 * (1 - gh.t / gh.life); const b = frameBox(S.white.atk, Math.round(gh.x), Math.round(gh.y), 20); g.drawImage(S.white.atk, b.x, b.y, b.w, b.h); g.globalAlpha = 1; }
  if (B) for (const u of units) if (u.alive !== false && !u.boss && !(u.critter && u.hp >= u.maxHp)) drawBar(g, u, u.scale || 1);
  if (B && !B.done && V.selected && recallsLeft(B) > 0) { const u = B.heroes.find(h => h.alive && !h.temp && h.inst && h.inst.uid === V.selected); if (u) drawRecallChip(g, u, t); }
  if (!B || B.queue.length || B.t < 8) { if (B) drawSpawnArrows(g, t, true, B.plan); }
  // zones
  if (B) for (const z of B.zones) {
    if (z.type === 'telegraph') { const k = z.t / z.dur; g.strokeStyle = z.friendly ? `rgba(255,255,255,${0.3 + 0.4 * Math.abs(Math.sin(t * 20))})` : `rgba(255,61,110,${0.4 + 0.5 * Math.abs(Math.sin(t * 20))})`; g.lineWidth = 1; g.beginPath(); g.ellipse(Math.round(z.x), Math.round(z.y), z.r, z.r * 0.55, 0, 0, Math.PI * 2); g.stroke();
      g.fillStyle = z.friendly ? 'rgba(255,255,255,0.12)' : 'rgba(255,61,110,0.18)'; g.beginPath(); g.ellipse(Math.round(z.x), Math.round(z.y), z.r * k, z.r * 0.55 * k, 0, 0, Math.PI * 2); g.fill();
      if (z.meteor && z.cols) { const my = z.y - 120 * (1 - k); g.fillStyle = z.cols[0]; g.fillRect(Math.round(z.x - 30 * (1 - k)) - 3, Math.round(my) - 3, 6, 6); g.fillStyle = z.cols[1]; g.fillRect(Math.round(z.x - 30 * (1 - k)) - 1, Math.round(my) - 1, 3, 3); }
      else if (z.meteor) { const my = z.y - 120 * (1 - k); g.fillStyle = '#ff3d3d'; g.fillRect(Math.round(z.x + 40 * (1 - k)) - 3, Math.round(my) - 3, 6, 6); g.fillStyle = '#ffde3a'; g.fillRect(Math.round(z.x + 40 * (1 - k)) - 1, Math.round(my) - 1, 3, 3); } }
    if (z.type === 'arrows') { g.strokeStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(Math.round(z.x), Math.round(z.y), z.r, z.r * 0.55, 0, 0, Math.PI * 2); g.stroke(); }
  }
  if (B) for (const m of B.marks) if (m.e.alive) { const x = Math.round(m.e.x), y = Math.round(m.e.y - 26 * (m.e.scale || 1) - m.e.z); const pulse = Math.floor(t * 12) % 2; g.fillStyle = pulse ? '#ff3d6e' : '#ffffff'; g.fillRect(x - 2, y, 5, 1); g.fillRect(x, y - 2, 1, 5); g.fillRect(x - 3, y - 3, 1, 1); g.fillRect(x + 3, y - 3, 1, 1); g.fillRect(x - 3, y + 3, 1, 1); g.fillRect(x + 3, y + 3, 1, 1); }
  // waves
  if (B) for (const w of B.waves) {
    if (w.type === 'flood') { const x0 = Math.round(w.x), c = w.cols || ['#5fd3ff', '#bff4ff']; for (let y = 96; y < H; y += 2) { const off = Math.round(Math.sin(y * 0.2 + t * 10) * 3); g.fillStyle = c[0]; g.fillRect(x0 - 26 + off, y, 22, 2); g.fillStyle = c[1]; g.fillRect(x0 - 4 + off, y, 4, 2); g.globalAlpha = 0.35; g.fillStyle = c[0]; g.fillRect(x0 - 60 + off, y, 34, 2); g.globalAlpha = 1; } }
    else if (w.type === 'spirit') { const S = SPR.spirit, b = w.big || 1, fr = S.frames[Math.floor(t * 10) % 2 ? 'walk0' : 'walk1']; g.globalAlpha = 0.85; if (w.gold) { g.globalAlpha = 0.5; g.fillStyle = '#ffd84a'; g.fillRect(Math.round(w.x - 10 * b), Math.round(w.y - 17 * b), Math.round(20 * b), Math.round(16 * b)); g.globalAlpha = 0.9; } g.drawImage(fr, Math.round(w.x - 10 * b), Math.round(w.y - 19 * b), Math.round(20 * b), Math.round(20 * b)); g.globalAlpha = 1; g.fillStyle = 'rgba(159,246,255,0.5)'; g.fillRect(Math.round(w.x - 30), Math.round(w.y - 8), 18, 1); }
    else if (w.type === 'cheese') { const x0 = Math.round(w.x), y0 = Math.round(w.y), sp = Math.floor(t * 12) % 2; g.fillStyle = OUTLINE; g.fillRect(x0 - 7, y0 - 13, 14, 14); g.fillStyle = '#ffd84a'; g.fillRect(x0 - 6, y0 - 12, 12, 12); g.fillStyle = '#ffb02e'; g.fillRect(x0 - 6, y0 - 7 + sp, 12, 2); g.fillStyle = '#e8a020'; g.fillRect(x0 - 3 + sp * 3, y0 - 10, 2, 2); g.fillRect(x0 + 2 - sp * 3, y0 - 4, 2, 2); }
    else if (w.type === 'quake') { g.fillStyle = '#8a6a2a'; g.fillRect(Math.round(w.x) - 2, Math.round(w.y) - 4, 4, 4); g.fillStyle = '#c9a35a'; g.fillRect(Math.round(w.x) - 1, Math.round(w.y) - 7, 2, 3); }
  }
  drawStyleOver(g, B, t);
  // projectiles
  if (B) for (const p of B.projs) drawProj(g, p);
  // sky hammer
  if (B && B.hammer.pending) { const p = B.hammer.pending, k = 1 - p.t / 0.65; const by = p.y - 160 * (1 - k);
    g.strokeStyle = 'rgba(255,207,58,0.8)'; g.beginPath(); g.ellipse(Math.round(p.x), Math.round(p.y), p.r * k, p.r * 0.55 * k, 0, 0, Math.PI * 2); g.stroke();
    g.fillStyle = OUTLINE; g.fillRect(Math.round(p.x) - 6, Math.round(by) - 12, 12, 12); g.fillStyle = '#a8a3c8'; g.fillRect(Math.round(p.x) - 5, Math.round(by) - 11, 10, 10); g.fillStyle = '#d4cff0'; g.fillRect(Math.round(p.x) - 5, Math.round(by) - 11, 10, 2); g.fillStyle = '#ffcf3a'; g.fillRect(Math.round(p.x) - 1, Math.round(by) - 8, 2, 4); }
  if (V.hammerArmed && V.mouse) { const m = V.mouse; g.strokeStyle = Math.floor(t * 6) % 2 ? '#ffcf3a' : '#ffffff'; g.beginPath(); g.ellipse(Math.round(m.x), Math.round(m.y), 34, 19, 0, 0, Math.PI * 2); g.stroke(); g.fillStyle = '#ffcf3a'; g.fillRect(Math.round(m.x) - 3, Math.round(m.y), 7, 1); g.fillRect(Math.round(m.x), Math.round(m.y) - 3, 1, 7); }
  drawHazard(g, B ? B.hz : run.mods.hz, { x: CASTLE_X + 4, y: 98, w: W - CASTLE_X - 4, h: H - 98 }, t, B, true);
  // particles
  for (const p of FXS.parts) { g.globalAlpha = Math.min(1, 2 * (1 - p.t / p.life)); g.fillStyle = p.color; if (p.streak) { g.fillRect(Math.round(p.x), Math.round(p.y), 1, 4); g.fillStyle = '#ffffff'; g.fillRect(Math.round(p.x), Math.round(p.y) + 4, 1, 1); } else g.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size); }
  g.globalAlpha = 1;
  for (const r of FXS.rings) { const k = r.t / r.life; g.globalAlpha = 1 - k; g.strokeStyle = r.color; g.lineWidth = 1; g.beginPath(); g.ellipse(Math.round(r.x), Math.round(r.y), Math.max(1, r.r * (0.4 + 0.6 * k)), Math.max(1, r.r * 0.55 * (0.4 + 0.6 * k)), 0, 0, Math.PI * 2); if (r.fill) { g.fillStyle = r.color; g.globalAlpha = 0.5 * (1 - k); g.fill(); } else g.stroke(); }
  g.globalAlpha = 1;
  for (const s of FXS.slashes) { const k = s.t / s.life; g.fillStyle = s.color; g.globalAlpha = 1 - k; for (let i = -4; i <= 4; i++) g.fillRect(Math.round(s.x + i * s.dir * (0.6 + k)), Math.round(s.y + i * 0.8 - k * 3), 1, 1); g.globalAlpha = 1; }
  for (const c of FXS.coins) { const x = Math.round(c.x), y = Math.round(c.y), spin = Math.floor((t + c.vx) * 12) % 4; g.fillStyle = OUTLINE; g.fillRect(x - 2, y - 2, spin === 1 || spin === 3 ? 3 : 5, 5); g.fillStyle = '#ffcf3a'; g.fillRect(x - 1, y - 1, spin === 1 || spin === 3 ? 1 : 3, 3); g.fillStyle = '#fff1a8'; g.fillRect(x - 1, y - 1, 1, 1); }
  for (const pe of FXS.petals) { g.fillStyle = pe.color; g.globalAlpha = 1 - pe.t / pe.life; g.fillRect(Math.round(pe.x + Math.sin(pe.spin) * 3), Math.round(pe.y), 2, 1); }
  g.globalAlpha = 1;
  for (const gu of FXS.gusts) { g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(Math.round(gu.x), Math.round(gu.y), gu.len, 1); }
  // upscale
  const ctx = R.ctx, k = R.k; ctx.imageSmoothingEnabled = false;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#161d3a'; ctx.fillRect(0, 0, R.cv.width, R.cv.height);
  const sh = FXS.shake > 0.2 ? FXS.shake : 0; const ox = Math.round(rand(-sh, sh)) * k, oy = Math.round(rand(-sh, sh)) * k;
  ctx.drawImage(R.lo, ox, oy, W * k, H * k);
  R.painted = true;
  // beams + bolts at hi-res for smoothness
  for (const b of FXS.beams) { const a = 1 - b.t / b.life; ctx.globalAlpha = a; ctx.strokeStyle = b.color; ctx.lineWidth = b.w * k * (0.5 + a * 0.5); ctx.lineCap = 'butt'; ctx.beginPath(); ctx.moveTo(b.x1 * k + ox, b.y1 * k + oy); ctx.lineTo(b.x2 * k + ox, b.y2 * k + oy); ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1, b.w * k * 0.35 * a); ctx.stroke(); }
  for (const b of FXS.bolts) { ctx.globalAlpha = 1 - b.t / b.life; ctx.strokeStyle = b.color; ctx.lineWidth = k * 1.2; ctx.beginPath(); for (let i = 0; i < b.pts.length - 1; i++) { const p = b.pts[i], q = b.pts[i + 1]; ctx.moveTo(p.x * k + ox, p.y * k + oy); for (let j = 1; j <= 4; j++) { const f = j / 4; ctx.lineTo((p.x + (q.x - p.x) * f + (j < 4 ? rand(-4, 4) : 0)) * k + ox, (p.y + (q.y - p.y) * f + (j < 4 ? rand(-4, 4) : 0)) * k + oy); } } ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = k * 0.5; ctx.stroke(); }
  ctx.globalAlpha = 1;
  drawSpellFX(ctx, k, ox, oy, B);
  if (!B && typeof G !== 'undefined' && G.run && G.run.finale !== 'ready' && G.phase === 'prep') drawPlanLabels(ctx, k, G.run);
  if (typeof drawBossFX === 'function') drawBossFX(ctx, k, ox, oy, B);
  // boss bar
  if (B && B.bossUnit && B.bossUnit.alive) { const u = B.bossUnit, bw = 200 * k, bx = (W * k - bw) / 2, by = 8 * k;
    ctx.fillStyle = OUTLINE; ctx.fillRect(bx - k, by - k, bw + 2 * k, 7 * k); ctx.fillStyle = '#3a2a4a'; ctx.fillRect(bx, by, bw, 5 * k); ctx.fillStyle = u.def.boss === 'big' ? '#ff3d6e' : '#ffb02e'; ctx.fillRect(bx, by, bw * u.hp / u.maxHp, 5 * k);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(bx, by, bw * u.hp / u.maxHp, k);
    ctx.font = `${6 * k}px "Fredoka", "Atkinson Hyperlegible", sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff'; ctx.strokeStyle = OUTLINE; ctx.lineWidth = k * 1.5; ctx.strokeText(u.def.name, W * k / 2, by + 14 * k); ctx.fillText(u.def.name, W * k / 2, by + 14 * k);
    // patience: when this fills, the boss charges the wall
    const pf = u.rage ? 1 : Math.min(1, (u.patT || 0) / (u.patMax || bossLimit(u))), py = by + 17 * k, pw = 120 * k, px = (W * k - pw) / 2, hot = pf > 0.8;
    ctx.fillStyle = OUTLINE; ctx.fillRect(px - k, py - k, pw + 2 * k, 4 * k); ctx.fillStyle = '#2a2140'; ctx.fillRect(px, py, pw, 2 * k);
    ctx.fillStyle = hot && Math.floor(performance.now() / 150) % 2 ? '#ffffff' : '#ff7a3a'; ctx.fillRect(px, py, pw * pf, 2 * k);
    ctx.font = `${4.5 * k}px "Fredoka", "Atkinson Hyperlegible", sans-serif`; ctx.fillStyle = hot ? '#ff9a5c' : '#c9cff5'; ctx.strokeText(u.rage ? 'ENRAGED' : 'Patience', W * k / 2, py + 8 * k); ctx.fillText(u.rage ? 'ENRAGED' : 'Patience', W * k / 2, py + 8 * k); }
  for (const sw of FXS.shocks) { if (sw.t < 0) continue; const kk = sw.t / sw.life; ctx.globalAlpha = 1 - kk; ctx.strokeStyle = sw.color; ctx.lineWidth = k * sw.w * (1 - kk) + k * 0.5; ctx.beginPath(); ctx.ellipse(sw.x * k + ox, sw.y * k + oy, sw.r * k * (0.2 + 0.8 * Math.sqrt(kk)), sw.r * 0.55 * k * (0.2 + 0.8 * Math.sqrt(kk)), 0, 0, Math.PI * 2); ctx.stroke(); }
  ctx.globalAlpha = 1;
  for (const d of FXS.drops) { const x = d.x * k + ox, y = d.y * k + oy; ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(d.t * 12)); ctx.fillStyle = '#ffcf3a'; ctx.beginPath(); ctx.arc(x, y, 6 * k, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; ctx.drawImage(iconCanvas(COMPONENTS[d.key].glyph, k), x - 5 * k, y - 5 * k); }
  // texts
  ctx.textAlign = 'center'; ctx.lineJoin = 'round';
  drawDmgNumbers(ctx, k, ox, oy);
  for (const c of FXS.combos) { const kk = c.t / c.life, pop = c.t < 0.12 ? 1.6 - c.t * 5 : 1, size = 11 * k * pop, x = c.x * k + ox, y = (c.y - 10 * kk) * k + oy;
    ctx.globalAlpha = Math.min(1, 3 * (1 - kk)); ctx.font = `700 ${size}px "Fredoka", "Atkinson Hyperlegible", sans-serif`; const gr = ctx.createLinearGradient(0, y - size, 0, y); gr.addColorStop(0, c.cols[0]); gr.addColorStop(1, c.cols[1]);
    ctx.strokeStyle = OUTLINE; ctx.lineWidth = k * 2.4; ctx.strokeText(c.name, x, y); ctx.fillStyle = gr; ctx.fillText(c.name, x, y); }
  ctx.globalAlpha = 1;
  for (const tx of FXS.texts) { const a = Math.min(1, 3 * (1 - tx.t / tx.life)), pop = tx.t < 0.08 ? 1.35 : 1; const size = (tx.label ? 6 : tx.big ? 8 : 6) * k * pop;
    ctx.globalAlpha = a; ctx.font = `${tx.big || tx.label ? 700 : 500} ${size}px "Fredoka", "Atkinson Hyperlegible", sans-serif`; ctx.strokeStyle = OUTLINE; ctx.lineWidth = k * 1.6; ctx.strokeText(tx.s, tx.x * k + ox, tx.y * k + oy); ctx.fillStyle = tx.color; ctx.fillText(tx.s, tx.x * k + ox, tx.y * k + oy); }
  ctx.globalAlpha = 1;
  for (const c of FXS.cutins) drawCutin(ctx, k, c, ox, oy);
  if (FXS.flash) { ctx.globalAlpha = FXS.flash.a * (1 - FXS.flash.t / 0.25); ctx.fillStyle = FXS.flash.color; ctx.fillRect(0, 0, R.cv.width, R.cv.height); ctx.globalAlpha = 1; }
}

function drawDmgNumbers(ctx, k, ox, oy) {
  for (const d of FXS.dmgs) {
    const kk = d.t / d.life, pal = DMG_PAL[d.kind] || DMG_PAL.hit;
    const pop = d.t < 0.09 ? 1.7 - d.t * 7.5 : 1, base = d.big ? 10 : d.kind === 'burn' || d.kind === 'poison' ? 6 : 7.5, size = base * k * pop;
    const rise = kk < 0.55 ? kk * 8 : 4.4 + (kk - 0.55) * 26, x = d.x * k + ox, y = (d.y - rise) * k + oy;
    ctx.globalAlpha = kk > 0.6 ? Math.max(0, 1 - (kk - 0.6) / 0.4) : 1;
    if (d.kind === 'crit') { ctx.save(); ctx.translate(x, y - size * 0.35); ctx.rotate(d.t * 2); ctx.fillStyle = 'rgba(255,42,106,0.55)'; ctx.beginPath(); for (let i = 0; i < 16; i++) { const r = (i % 2 ? 0.45 : 1) * size * 0.95; const a = i / 16 * Math.PI * 2; ctx.lineTo(Math.cos(a) * r * 1.4, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.restore(); }
    ctx.font = `700 ${size}px "Fredoka", "Atkinson Hyperlegible", sans-serif`;
    const gr = ctx.createLinearGradient(0, y - size * 0.85, 0, y); gr.addColorStop(0, pal[0]); gr.addColorStop(0.55, pal[1]); gr.addColorStop(1, shade(pal[1], -0.25));
    ctx.strokeStyle = pal[2]; ctx.lineWidth = k * (d.big ? 2.6 : 2); ctx.strokeText(d.s, x, y);
    ctx.fillStyle = gr; ctx.fillText(d.s, x, y);
    if (d.kind === 'crit' && d.t < 0.6) { ctx.font = `700 ${4.5 * k}px "Fredoka", "Atkinson Hyperlegible", sans-serif`; ctx.lineWidth = k * 1.4; ctx.strokeStyle = pal[2]; ctx.strokeText('CRITICAL', x, y - size * 0.95); ctx.fillStyle = '#ffd0e0'; ctx.fillText('CRITICAL', x, y - size * 0.95); }
  }
  ctx.globalAlpha = 1;
}
function drawCutin(ctx, k, c, ox = 0, oy = 0) {
  // the signature's name pops above the hero and drifts up; the spell itself does the talking
  const u = c.u, kk = c.t / c.life, fade = kk > 0.7 ? 1 - (kk - 0.7) / 0.3 : 1;
  const cw = ctx.canvas.width, wx = (u && u.alive !== false ? u.x : c.x) * k + ox, wy = (u && u.alive !== false ? u.y - (u.z || 0) : c.y) * k + oy;
  const pop = kk < 0.1 ? 0.5 + 5 * kk : kk < 0.18 ? 1.5 - 0.5 * (kk - 0.1) / 0.08 : 1, size = (c.big ? 9 : 7) * k * pop;
  ctx.save(); ctx.font = `700 ${size}px "Fredoka", "Atkinson Hyperlegible", sans-serif`; const label = c.name.toUpperCase(), tw = ctx.measureText(label).width;
  const x = Math.max(tw / 2 + 4 * k, Math.min(cw - tw / 2 - 4 * k, wx)), y = Math.max(size + 4 * k, wy - (30 + 8 * kk) * k);
  const gr = ctx.createLinearGradient(0, y - size, 0, y); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, c.color);
  ctx.globalAlpha = fade; ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.lineWidth = 2.6 * k; ctx.strokeStyle = OUTLINE; ctx.strokeText(label, x, y); ctx.fillStyle = gr; ctx.fillText(label, x, y);
  if (c.combo) { ctx.font = `600 ${4.5 * k}px "Fredoka", "Atkinson Hyperlegible", sans-serif`; ctx.lineWidth = 2 * k; const cy = y + 6 * k, cl = `+ ${c.combo.name.toUpperCase()}`; ctx.strokeText(cl, x, cy); ctx.fillStyle = c.combo.cb; ctx.fillText(cl, x, cy); }
  ctx.restore();
}

// ----- the great hall: where the goose finale is fought (Cam: "the battle takes place in the castle") -----
function buildHall() {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const p = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  // back wall: violet-grey stone in brick courses
  p(0, 0, W, 104, '#4a4266');
  for (let y = 0; y < 104; y += 8) for (let x = -((y / 8) % 2) * 8; x < W; x += 16) { const r = hash(x, y); p(x + 1, y + 1, 14, 6, r < 0.33 ? '#544c74' : r < 0.66 ? '#5c5480' : '#50486e'); p(x + 1, y + 1, 14, 1, '#6a628e'); }
  // tall arched windows with a night sky and stars
  for (const wx of [150, 250, 350]) {
    p(wx - 15, 10, 30, 70, '#2a2440');
    for (let y = 0; y < 66; y++) { const half = y < 14 ? Math.round(Math.sqrt(196 - (14 - y) * (14 - y))) : 14; p(wx - half, 12 + y, half * 2, 1, mix('#1c1a44', '#5a3a8a', y / 66)); }
    for (let i = 0; i < 9; i++) { const sx = wx - 11 + Math.floor(hash(wx, i) * 22), sy = 18 + Math.floor(hash(i, wx) * 50); p(sx, sy, 1, 1, '#fff6d0'); }
    p(wx - 1, 12, 2, 66, '#2a2440'); p(wx - 14, 44, 28, 2, '#2a2440');
    p(wx - 17, 78, 34, 4, '#7a7298'); p(wx - 17, 78, 34, 1, '#9a92b8');
  }
  // banners between the windows
  for (const bx of [200, 300, 400]) { p(bx - 9, 8, 18, 2, '#c9a24a'); p(bx - 8, 10, 16, 40, '#8a2a4a'); p(bx - 8, 10, 16, 2, '#a83a5a');
    for (let i = 0; i < 4; i++) { p(bx - 8 + i * 4, 50, 4, 3 + (i % 2) * 2, '#8a2a4a'); } p(bx - 3, 24, 6, 6, '#e8c46a'); p(bx - 2, 25, 4, 4, '#fff0a8'); }
  // skirting and floor
  p(0, 98, W, 8, '#3a3458'); p(0, 98, W, 2, '#6a628e');
  for (let y = 106; y < H; y += 12) for (let x = 0; x < W; x += 16) { const odd = ((x / 16) + Math.floor((y - 106) / 12)) % 2; p(x, y, 16, 12, odd ? '#6e6488' : '#7c7298'); p(x, y, 16, 1, odd ? '#7e749a' : '#8e84aa'); p(x, y, 1, 12, '#5e5678'); }
  // red carpet from the doors to the altar
  const cy = GRID.y + GRID.rows * GRID.cell / 2 - 10;
  p(60, cy, W - 60, 22, '#9a2a3a'); p(60, cy, W - 60, 2, '#d8a84a'); p(60, cy + 20, W - 60, 2, '#d8a84a');
  for (let x = 70; x < W; x += 14) p(x, cy + 10, 6, 2, '#b8404e');
  // pillars
  for (const px of [104, 470]) { p(px - 7, 0, 14, 106, '#5a5278'); p(px - 7, 0, 3, 106, '#7a7298'); p(px + 4, 0, 3, 106, '#423a5e'); p(px - 9, 98, 18, 8, '#6a628e'); }
  // the shard altar on a dais at the back of the hall
  p(0, 104, 90, H - 104, '#5a4a7a'); for (let i = 0; i < 4; i++) { p(80 + i * 3, 104 + i * 30, 10 - i * 3, H, '#6a5a8a'); }
  p(0, 104, 92, 3, '#9a8ac0'); p(89, 104, 3, H - 104, '#3a2e58');
  p(18, 118, 54, 104, '#3c3060'); p(18, 118, 54, 3, '#c9a24a'); p(18, 219, 54, 3, '#c9a24a'); p(22, 124, 46, 92, '#2a2248');
  // broken doors where the goose came in
  p(452, 104, 28, H - 104, '#2a2234'); for (let i = 0; i < 6; i++) { const y = 112 + i * 26; p(448 + (i % 2) * 4, y, 10, 4, '#7a5030'); p(458, y + 9, 8, 3, '#5a3a20'); }
  return c;
}
// shards back on the altar (the ones knocked from the goose's crown), plus torch flicker
function drawHallLive(g, t, B) {
  const gz = B && B.bossUnit && B.bossUnit.def && B.bossUnit.def.boss && B.bossUnit.shards != null ? B.bossUnit : null;
  const home = gz ? 12 - gz.shards : B ? 0 : 12;
  EL_KEYS.forEach((e, i) => { const col = i % 3, row = Math.floor(i / 3), x = 30 + col * 14, y = 134 + row * 21 + Math.round(Math.sin(t * 2 + i) * 1.5);
    if (i >= home) { g.fillStyle = '#1a1430'; g.fillRect(x - 2, y + 4, 5, 2); return; }
    g.fillStyle = OUTLINE; g.fillRect(x - 3, y - 4, 7, 10); g.fillStyle = ELEMENTS[e].col; g.fillRect(x - 2, y - 3, 5, 8); g.fillStyle = ELEMENTS[e].col2; g.fillRect(x + 1, y - 1, 2, 5); g.fillStyle = '#ffffff'; g.fillRect(x - 1, y - 2, 1, 2);
    if (Math.random() < 0.04) FXS.parts && FXS.parts.push({ x, y: y - 4, vx: rand(-4, 4), vy: rand(-14, -6), life: 0.8, t: 0, color: ELEMENTS[e].col, size: 1, grav: 0 }); });
  for (const tx of [125, 225, 325, 425]) { const f = Math.sin(t * 13 + tx) > 0; g.fillStyle = '#3a2a1a'; g.fillRect(tx - 1, 56, 3, 10); g.fillStyle = f ? '#ffb02e' : '#ff7a1a'; g.fillRect(tx - 2, 50 - (f ? 1 : 0), 5, 6); g.fillStyle = '#fff0a8'; g.fillRect(tx, 52, 1, 3); }
}
// the crown of shards orbits the goose's head
function drawShardCrown(g, u, t) {
  if (!u.shards) return; const hy = u.y - u.z - 34 * u.scale, n = u.shards;
  for (let i = 0; i < n; i++) { const a = t * 1.6 + i * Math.PI * 2 / n, x = Math.round(u.x + Math.cos(a) * 16), y = Math.round(hy + Math.sin(a) * 5), e = EL_KEYS[i];
    g.fillStyle = OUTLINE; g.fillRect(x - 2, y - 3, 5, 7); g.fillStyle = ELEMENTS[e].col; g.fillRect(x - 1, y - 2, 3, 5); g.fillStyle = '#ffffff'; g.fillRect(x - 1, y - 2, 1, 1); }
}
