// ===== Arena renderer =====
const R = { cv: null, ctx: null, lo: null, lctx: null, k: 3, bg: {}, castleKey: '', castle: null, clouds: [], t: 0 };
function hash(x, y) { let h = x * 374761393 + y * 668265263; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967295; }
function mix(a, b, t) { const A = hexToRgb(a), B = hexToRgb(b); return rgbToHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }

function initRender(canvas) {
  R.cv = canvas; R.ctx = canvas.getContext('2d');
  R.lo = document.createElement('canvas'); R.lo.width = W; R.lo.height = H; R.lctx = R.lo.getContext('2d');
  for (let i = 0; i < 7; i++) R.clouds.push({ x: rand(0, W), y: rand(6, 50), w: randi(18, 40), s: rand(3, 8) });
  resizeRender();
}
function resizeRender() {
  const r = R.cv.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1;
  R.k = Math.max(1, Math.ceil(r.width * dpr / W)); R.cv.width = W * R.k; R.cv.height = H * R.k;
}

function buildBackground(fi) {
  const F = FACTIONS[fi], c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  // sky in bands
  const bands = 8; for (let i = 0; i < bands; i++) { g.fillStyle = mix(F.sky[0], F.sky[1], i / (bands - 1)); g.fillRect(0, Math.floor(i * 92 / bands), W, Math.ceil(92 / bands) + 1); }
  // sun
  g.fillStyle = '#fff6c0'; for (let y = -9; y <= 9; y++) { const w = Math.round(Math.sqrt(81 - y * y)); g.fillRect(410 - w, 26 + y, w * 2, 1); }
  g.fillStyle = '#ffe680'; for (let y = -6; y <= 6; y++) { const w = Math.round(Math.sqrt(36 - y * y)); g.fillRect(410 - w, 26 + y, w * 2, 1); }
  // hills (two layers)
  const hill = (base, amp, freq, col, seed) => { g.fillStyle = col; for (let x = 0; x < W; x++) { const h = base - Math.round(amp * (0.5 + 0.5 * Math.sin(x * freq + seed)) + amp * 0.4 * Math.sin(x * freq * 2.7 + seed * 3)); g.fillRect(x, h, 1, 96 - h); } };
  hill(76, 16, 0.025, mix(F.hill, F.sky[1], 0.45), 1.3); hill(86, 12, 0.04, F.hill, 4.1);
  // ground
  g.fillStyle = '#74d35a'; g.fillRect(0, 92, W, H - 92);
  g.fillStyle = '#86de66'; g.fillRect(0, 92, W, 3);
  for (let y = 95; y < H; y += 2) for (let x = 0; x < W; x += 2) { const r = hash(x, y); if (r < 0.06) { g.fillStyle = '#5cbf45'; g.fillRect(x, y, 1, 2); g.fillRect(x + 1, y - 1, 1, 2); } else if (r < 0.085) { g.fillStyle = '#a2ec7e'; g.fillRect(x, y, 1, 1); } }
  // road
  for (let x = CASTLE_X; x < W; x++) { const y0 = 168 + Math.round(Math.sin(x * 0.03) * 3); g.fillStyle = '#e8c07a'; g.fillRect(x, y0, 1, 22); g.fillStyle = '#d4a65e'; if (hash(x, 7) < 0.3) g.fillRect(x, y0 + Math.floor(hash(x, 9) * 20), 1, 1); g.fillStyle = '#c99a50'; g.fillRect(x, y0 + 22, 1, 1); g.fillStyle = '#f4d69a'; g.fillRect(x, y0, 1, 1); }
  // courtyard cobbles
  const cx0 = GRID.x - 8, cx1 = GRID.x + GRID.courtCols * GRID.cell, cy0 = GRID.y - 8, cy1 = GRID.y + GRID.rows * GRID.cell + 8;
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
  // flowers on our side
  for (let i = 0; i < 70; i++) { const x = Math.floor(hash(i, 1) * 240) + 96, y = Math.floor(hash(i, 2) * 170) + 98; if (x > cx0 - 2 && x < cx1 + 2 && y > cy0 - 2 && y < cy1 + 2) continue; g.fillStyle = pick(['#ff7aa8', '#ffd84a', '#ffffff', '#a98aff']); g.fillRect(x, y, 1, 1); g.fillStyle = '#4fae3a'; g.fillRect(x, y + 1, 1, 1); }
  // horde side tint
  for (let x = 300; x < W; x++) { const a = Math.min(0.42, (x - 300) / 180 * 0.42); g.fillStyle = F.tint; g.globalAlpha = a; g.fillRect(x, 92, 1, H - 92); }
  g.globalAlpha = 1;
  // faction props
  for (let i = 0; i < 14; i++) { const x = 350 + Math.floor(hash(i, fi + 11) * 125), y = 100 + Math.floor(hash(i, fi + 23) * 160); drawProp(g, fi, x, y, i); }
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
  const saveK = R.castleKey, saveC = R.castle; R.castleKey = null;
  const c = buildCastle({ tech: { walls1: 1, rafters1: 1, ballista1: 1 }, castleEl: el, maxhpMul: 1 });
  const crop = document.createElement('canvas'); crop.width = 110; crop.height = 150; crop.getContext('2d').drawImage(c, 0, 50, 110, 150, 0, 0, 110, 150);
  R.castleKey = saveK; R.castle = saveC; return crop.toDataURL();
}
// one 5×5 trophy per conquered horde, hung on the keep's trophy ledge
const TROPHIES = [
  ['y.y.y', 'yyyyy', 'yryry', 'yyyyy', '.....'], ['.www.', 'w...w', 'wgggw', 'wgggw', '.www.'], ['.bbb.', 'bkbkb', 'bbbbb', '.b.b.', '.....'], ['.rrr.', 'rwrrr', '.rrr.', '..k..', '..k..'],
  ['.rrr.', 'rwrwr', 'rrrrr', '..w..', '..w..'], ['c.c.c', '.ccc.', 'ccccc', '.ccc.', 'c.c.c'], ['..s..', 'sssss', 's.s.s', 's.s.s', 'sssss'], ['.y.y.', 'yyyyy', 'yy.yy', 'yyyyy', '.y.y.'],
  ['..k..', '.kkk.', '..k..', 'k.k.k', '.kkk.'], ['.yy..', 'yyyy.', 'yyyyy', 'yyyyy', '.yyy.'],
];
const TROPHY_COL = { y: '#ffcf3a', r: '#ff3d3d', w: '#ffffff', g: '#7fe05a', b: '#f0ead8', k: '#2a2440', c: '#bfeeff', s: '#8a94b0' };
function drawTrophy(g, x, y, i) { const T = TROPHIES[i % TROPHIES.length]; x = Math.round(x); for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) { const ch = T[r][c]; if (ch === '.') continue; g.fillStyle = TROPHY_COL[ch]; g.fillRect(x + c, y + r, 1, 1); } }
function buildCastle(run) {
  const T = run.tech, wl = (T.walls1 ? 2 : 0) + (T.walls2 ? 2 : 0) + (T.bastion ? 2 : 0), rf = rafterSlots(run), bl = T.ballista1 ? 1 + (T.ballista2 ? 1 : 0) + (T.ballista3 ? 2 : 0) : 0, fo = T.fountain ? 1 : 0;
  const tier = typeof castleTier === 'function' ? Math.min(10, castleTier(run)) : 0;
  const key = [wl, rf, bl, fo, run.castleEl, tier].join(); if (key === R.castleKey) return R.castle; R.castleKey = key;
  const c = document.createElement('canvas'); c.width = 110; c.height = H; const g0 = c.getContext('2d');
  const pal = CASTLE_PAL[run.castleEl] || ['#d4cff0', '#aea7d8', '#8a83b8', '#4a6ee0', '#2f4fb8', '#e8e4fa'];
  const [stone, mortar, dark, roofBase, roof2Base] = pal;
  const roof = tier >= 9 ? '#ffcf3a' : roofBase, roof2 = tier >= 9 ? '#c8901a' : roof2Base, trim = wl >= 4 || tier >= 5 ? '#ffcf3a' : shade(stone, 0.5);
  let sd = 1234; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  R.castleFlags = []; R.castleTorches = []; R.castleGlow = [];
  // Three-quarter view from the horde's side: the near corner of the castle sits at x=NEAR.
  // The narrow south face (left) and the wide east face (right, with the gate) both recede upward from it.
  const NEAR = 30, SLOPE_S = 0.28, SLOPE_E = 0.17, EW = 60, BASE = 212;   // compact: the castle stands on a rocky mound and ends at BASE
  const off = x => x <= NEAR ? -(NEAR - x) * SLOPE_S : -(x - NEAR) * SLOPE_E;
  // drawing kit bound to one canvas and one stone tint
  const kit = (g, st) => {
    const sL = shade(st, 0.22), sD = shade(st, -0.1), sDD = shade(st, -0.2), mo = shade(mortar, st === stone ? 0 : -0.12);
    const P = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
    const wall = (x0, y0, w, h, o = {}) => { P(x0, y0, w, h, mo);
      for (let y = y0, row = 0; y < y0 + h; y += 5, row++) { const ofs = row % 2 ? 4 : 0;
        for (let x = x0 - ofs; x < x0 + w; x += 8) { const bx = Math.max(x0, x), bw = Math.min(x + 7, x0 + w) - bx, bh = Math.min(4, y0 + h - y); if (bw <= 0 || bh <= 0) continue;
          const r = rnd(); P(bx, y, bw, bh, r < 0.15 ? sD : r > 0.88 ? sL : st); P(bx, y, bw, 1, sL); if (r > 0.94 && bw > 3) P(bx + 2, y + 2, 2, 1, sDD); } }
      if (!o.noMoss) for (let x = x0; x < x0 + w; x++) { const mh = Math.round(3 + 6 * Math.abs(Math.sin(x * 0.7 + y0)) * rnd()); P(x, y0 + h - mh, 1, mh, rnd() < 0.5 ? '#5aa04a' : '#7fc05a'); } };
    const merlons = (x0, y0, w, col = st) => { P(x0 - 1, y0 - 1, w + 2, 2, OUTLINE); P(x0, y0, w, 1, trim);
      for (let x = x0; x < x0 + w - 3; x += 7) { P(x - 1, y0 - 7, 6, 7, OUTLINE); P(x, y0 - 6, 4, 6, col); P(x, y0 - 6, 4, 1, sL); P(x + 3, y0 - 5, 1, 5, sD); } };
    const arch = (x, y, w, h, glass) => { P(x - 1, y - 1, w + 2, h + 2, OUTLINE); P(x, y + 1, w, h - 1, glass || '#ffd84a'); P(x + 1, y, w - 2, 1, glass || '#ffd84a');
      P(x, y + h - 3, w, 3, '#ffb02e'); if (w >= 5) P(x + Math.floor(w / 2), y + 1, 1, h - 1, OUTLINE); P(x, y + Math.floor(h / 2), w, 1, OUTLINE); P(x - 2, y + h + 1, w + 4, 1, sL); };
    return { P, wall, merlons, arch, sL, sD, sDD };
  };
  // paste a flat face onto the castle, column by column, sheared by the view angle
  const paste = (src, x0) => { for (let x = 0; x < src.width; x++) g0.drawImage(src, x, 0, 1, src.height, x0 + x, Math.round(off(x0 + x + 0.5)), 1, src.height); };
  const face = w => { const cv = document.createElement('canvas'); cv.width = w; cv.height = H + 20; return cv; };
  const G = kit(g0, stone);
  const cone = (cx, by, w, h) => { for (let i = 0; i < h; i++) { const ww = Math.max(1, Math.round(w * (1 - i / h))); G.P(cx - ww / 2 - 1, by - i, ww + 2, 1, OUTLINE); G.P(cx - ww / 2, by - i, ww, 1, i % 3 === 0 ? roof2 : roof);
      if (ww > 4) { G.P(cx - ww / 2, by - i, Math.max(1, ww * 0.3), 1, shade(roof, 0.3)); G.P(cx + ww / 2 - Math.max(1, ww * 0.25), by - i, Math.max(1, ww * 0.25), 1, shade(roof, -0.3)); } }
    G.P(cx - w / 2 - 2, by, w + 4, 2, OUTLINE); G.P(cx - w / 2 - 1, by, w + 2, 1, trim); };
  const flag = (x, y, col, big) => { G.P(x, y - 12, 1, 12, '#5a3a1a'); G.P(x - 1, y - 13, 3, 1, '#ffd84a'); R.castleFlags.push({ x: x + 1, y: y - 12, col, w: big ? 9 : 7 }); };
  // a round tower looks right from any angle: shade it like a cylinder
  const tower = (cx, top, bottom, r, roofH, flagCol, o = {}) => {
    for (let dx = -r; dx <= r; dx++) { const n = dx / r, lit = n < -0.35 ? 0.2 : n > 0.45 ? -0.18 : n > 0.1 ? -0.06 : 0.06, col = shade(stone, lit);
      for (let y = top, row = 0; y < bottom; y += 5, row++) { const seam = ((dx + r + (row % 2 ? 3 : 0)) % 7) === 0; G.P(cx + dx, y, 1, 4, seam ? mortar : col); G.P(cx + dx, y + 4, 1, 1, mortar); } }
    G.P(cx - r - 1, top, 1, bottom - top, OUTLINE); G.P(cx + r + 1, top, 1, bottom - top, OUTLINE);
    if (o.crown) { G.merlons(cx - r, top, 2 * r + 1, '#ffcf3a'); } else { cone(cx, top - 1, 2 * r + 8, roofH); if (flagCol) flag(cx, top - roofH - 1, flagCol, o.big); }
    for (let y = top + 8; y < bottom - 12; y += o.winStep || 30) G.arch(cx - 1, y, 3, 7, o.glass);
  };

  const kt = 58 - 2.5 * tier;                         // the keep rises with every boss slain
  const DY = 14; g0.save(); g0.translate(0, DY);       // sit the whole castle a little lower so its roofs clear the HUD
  const KW = 32;                                       // keep width on the east face; the rest is the gatehouse wall
  // ----- back: the keep's great tower climbs and crowns itself -----
  const kx = NEAR + 14, ktop = Math.max(18, kt - 22 - tier + off(kx));
  tower(kx, ktop, kt + off(kx) + 4, tier >= 6 ? 10 : 8, Math.min(ktop - 2, 18 + tier), '#ff5d8f', { crown: tier >= 8, big: true, glass: tier >= 8 ? '#9ff6ff' : null, winStep: 14 });
  if (tier >= 8) R.castleGlow.push({ x: kx, y: ktop + 11 });
  // far turret at the back corner of the gatehouse
  if (tier >= 7 || wl >= 6) tower(98, 34 + off(98), 76 + off(98), 6, 15, '#4a6ee0');

  // ----- south face (narrow, in shade) -----
  const SF = face(NEAR), gs = kit(SF.getContext('2d'), shade(stone, -0.12));
  gs.wall(0, kt, NEAR, BASE + 6 - kt); gs.merlons(0, kt, NEAR, shade(stone, -0.12));
  for (let y = kt + 26; y < BASE - 20; y += 34) { gs.P(0, y, NEAR, 2, OUTLINE); gs.P(0, y, NEAR, 1, trim); }
  for (let y = kt + 36; y < BASE - 16; y += 34) gs.arch(12, y, 4, 9);
  paste(SF, 0);

  // ----- east face (wide, lit, facing the horde) -----
  const EF = face(EW), ge = kit(EF.getContext('2d'), stone), P = ge.P;
  ge.wall(0, kt, KW, BASE + 14 - kt); ge.merlons(0, kt, KW);
  ge.wall(KW, 74, EW - KW, BASE + 14 - 74); ge.merlons(KW, 74, EW - KW);
  P(KW - 1, kt, 2, BASE + 14 - kt, OUTLINE);                                                    // where keep meets gatehouse
  for (let y = kt + 26; y < BASE - 20; y += 34) { P(0, y, KW, 2, OUTLINE); P(0, y, KW, 1, trim); }
  for (let x = KW + 1; x < EW - 1; x += 5) { P(x, 76, 3, 3, OUTLINE); P(x, 76, 3, 1, ge.sD); }   // machicolations
  if (tier >= 5) { const cx = 16, cy = kt + 16, cols = ['#ff5d8f', '#4a6ee0', '#ffcf3a', '#7fe05a']; P(cx - 6, cy - 6, 12, 12, OUTLINE);
    for (let yy = -5; yy <= 5; yy++) for (let xx = -5; xx <= 5; xx++) if (xx * xx + yy * yy <= 25) P(cx + xx, cy + yy, 1, 1, xx === 0 || yy === 0 ? OUTLINE : cols[(xx > 0) + 2 * (yy > 0)]);
    P(cx - 1, cy - 1, 2, 2, '#ffffff'); } else ge.arch(13, kt + 12, 6, 10);
  for (let y = kt + 36; y < BASE - 16; y += 34) { ge.arch(7, y, 5, 9); ge.arch(21, y, 5, 9); }
  if (tier > 0) { const ly = kt + 30; P(0, ly - 1, KW, 9, OUTLINE); P(1, ly, KW - 2, 7, dark); P(0, ly + 7, KW, 1, trim); for (let i = 0; i < Math.min(tier, 6); i++) drawTrophy(EF.getContext('2d'), 2 + i * 5, ly + 1, i); }
  for (let i = 0; i < Math.min(tier, 2); i++) { const x = 4 + i * 16, y = kt + 42, col = FACTIONS[i].hill || '#ff5d8f'; P(x - 1, y - 1, 9, 22, OUTLINE); P(x, y, 7, 18, col); P(x, y, 7, 2, '#ffd84a'); P(x + 2, y + 6, 3, 4, '#ffffff'); }
  // the gate, facing the horde: arch, half-raised portcullis, studded doors
  const gx = KW + 3, gw = 22;
  P(gx - 1, 150, gw + 2, 52, OUTLINE); P(gx, 152, gw, 50, '#2a2040'); P(gx + 2, 148, gw - 4, 4, '#2a2040'); P(gx + 1, 147, gw - 2, 1, OUTLINE);
  for (let i = 0; i < 9; i++) { const a = Math.PI * (i / 8), x = gx + gw / 2 + Math.cos(a) * 14, y = 152 - Math.sin(a) * 7; P(x - 2, y - 2, 4, 4, OUTLINE); P(x - 1, y - 1, 3, 3, i % 2 ? ge.sL : stone); }
  P(gx, 152, 3, 50, '#1a1430');                                                               // depth of the gate passage
  for (let x = gx + 3; x < gx + gw; x += 4) P(x, 152, 1, 18, '#8a8aa0'); P(gx, 160, gw, 1, '#8a8aa0'); P(gx, 169, gw, 1, '#8a8aa0'); for (let x = gx + 3; x < gx + gw; x += 4) P(x, 170, 1, 2, '#c8c8d8');
  P(gx + 2, 174, 11, 28, '#9a6332'); P(gx + 13, 174, 11, 28, '#8a5a2a'); P(gx + 12, 174, 2, 28, OUTLINE); for (const y of [180, 193]) { P(gx + 2, y, gw - 2, 2, '#4a4a5e'); for (let x = gx + 4; x < gx + gw; x += 4) P(x, y, 1, 1, '#c8c8d8'); }
  P(gx - 1, 146, gw + 2, 1, trim);
  for (const [bx, col] of [[KW + 3, '#ff5d8f'], [KW + 17, '#4a6ee0']]) { P(bx - 1, 85, 10, 22, OUTLINE); P(bx, 86, 8, 18, col); P(bx, 86, 8, 2, '#ffd84a'); P(bx + 3, 91, 2, 5, '#ffffff'); P(bx + 2, 93, 4, 1, '#ffffff'); P(bx, 104, 4, 3, OUTLINE); P(bx + 4, 104, 4, 3, OUTLINE); P(bx + 1, 104, 2, 2, col); P(bx + 5, 104, 2, 2, col); }
  ge.arch(KW + 7, 118, 4, 8); ge.arch(KW + 18, 118, 4, 8);
  if (wl >= 2) for (const y of [140]) { P(KW, y, EW - KW, 2, OUTLINE); P(KW, y, EW - KW, 1, '#8a8aa0'); for (let x = KW + 2; x < EW; x += 6) P(x, y, 1, 1, '#ffffff'); }
    paste(EF, NEAR);
  // the shared near corner: a bright edge where the two faces meet
  G.P(NEAR - 1, kt, 1, BASE - kt, OUTLINE); G.P(NEAR, kt + 1, 1, BASE - kt, shade(stone, 0.35));
  // torches flank the gate on the east face
  for (const fx of [gx - 3, gx + gw + 2]) { const x = NEAR + fx, y = 156 + off(x); G.P(x - 1, y + 2, 3, 8, OUTLINE); G.P(x, y + 3, 1, 6, '#8a5a2a'); R.castleTorches.push({ x, y }); }
  // corner turrets sprout on the keep after the second boss
  if (tier >= 2 || wl >= 2) for (const [x, col] of (tier >= 4 ? [[6, '#ff5d8f'], [NEAR + KW - 3, '#ffd84a']] : [[6, '#ff5d8f']])) { const b = kt + off(x) + 4, top = b - 14 - Math.min(tier, 6); tower(x, top, b, 5, Math.min(top - 1, 12 + tier), col); }
  // the big round tower on the near corner, the castle's anchor
  const nt = 104 - 2 * tier; tower(NEAR, nt, BASE + 4, 10, 14 + tier, '#ffd84a', { big: true, winStep: 34 });
  // gargoyles once the castle is mighty
  if (tier >= 6) for (const gxx of [NEAR + KW, 96]) { const y = 80 + off(gxx); G.P(gxx - 3, y, 7, 5, OUTLINE); G.P(gxx - 2, y + 1, 5, 3, G.sD); G.P(gxx + 2, y + 1, 1, 1, '#ff3d3d'); }
  // foundation
  // the rocky mound the castle stands on, with a ramp down from the gate
  for (let x = -2; x < 98; x++) { const top = BASE + off(Math.min(x, 96)) - 2 + Math.round(2 * Math.sin(x * 0.9)), bot = BASE + 14 + Math.round(6 * Math.abs(Math.sin(x * 0.13 + 1)));
    for (let y = top; y < bot; y++) { const r = hash(x * 3, y * 7); G.P(x, y, 1, 1, y === top ? OUTLINE : r < 0.12 ? '#6a6a7e' : r > 0.85 ? '#b8b4c8' : '#8a889c'); }
    G.P(x, bot, 1, 1, OUTLINE); if (hash(x, 3) < 0.5) G.P(x, bot - 1, 1, 2, '#5aa04a'); }
  g0.globalAlpha = 0.25; G.P(0, BASE + 18, 100, 6, OUTLINE); g0.globalAlpha = 1;
  // a wooden palisade carries the defence down the lower lanes; nearer stakes overlap farther ones
  for (let y = BASE + 2; y < H + 12; y += 4) { const x = 90 + Math.round(hash(y, 9) * 2), h = 13 + Math.round(hash(y, 4) * 3);
    G.P(x - 1, y - h - 1, 9, h + 2, OUTLINE); G.P(x, y - h, 7, h, '#9a6332'); G.P(x, y - h, 2, h, '#c98a4a'); G.P(x + 5, y - h, 2, h, '#6a4a2a');
    G.P(x + 2, y - h - 3, 3, 3, OUTLINE); G.P(x + 3, y - h - 2, 1, 2, '#e8b070'); if (y % 12 === 2) G.P(x, y - h + 4, 7, 1, '#4a4a5e'); }
  // a squat round tower where the outer wall meets the mound
  tower(91, BASE - 6, BASE + 16, 7, 12, '#4a6ee0', { winStep: 40 });
  g0.restore(); for (const a of [R.castleFlags, R.castleTorches, R.castleGlow]) for (const o of a) o.y += DY;
  // rafters: a wooden gallery bolted along the wall
  if (rf > 0) {
    G.P(4, RAFTER_Y + 1, 94, 5, OUTLINE); G.P(4, RAFTER_Y + 2, 94, 3, '#c98a4a'); G.P(4, RAFTER_Y + 2, 94, 1, '#e8b070');
    for (let x = 6; x < 98; x += 12) { G.P(x, RAFTER_Y + 5, 2, 8 - off(x) * 0.5, '#8a5a2a'); G.P(x + 2, RAFTER_Y + 5, 1, 8 - off(x) * 0.5, OUTLINE); }
    for (let i = 0; i < RAFTER_XS.length; i++) G.P(RAFTER_XS[i] - 3, RAFTER_Y + 2, 6, 1, i < rf ? '#ffd84a' : '#6a5a8a');
  }
  if (bl > 0) { const x = 74, y = 50 + off(80); G.P(x - 1, y - 1, 16, 7, OUTLINE); G.P(x, y, 14, 5, '#9a6332'); G.P(x + 2, y + 5, 2, 6, '#5a3a1a'); G.P(x + 10, y + 5, 2, 6, '#5a3a1a');
    G.P(x + 12, y - 4, 1, 13, '#dfe6f5'); G.P(x + 4, y + 2, 12, 1, '#dfe6f5'); G.P(x + 14, y + 1, 3, 3, bl >= 4 ? '#ffcf3a' : '#c9a06a'); }
  if (fo > 0) { const x = 99, y = 98; G.P(x - 1, y - 1, 10, 7, OUTLINE); G.P(x, y, 8, 5, '#c9c4e6'); G.P(x + 1, y, 6, 2, '#5fd3ff'); G.P(x + 3, y - 5, 2, 5, '#bff4ff'); }
  R.castle = c; return c;
}

// the living parts of the castle: flags flutter, torches flicker, the beacon pulses
function drawCastleLive(g, t) {
  for (const f of R.castleFlags || []) for (let i = 0; i < f.w; i++) { const wv = Math.round(Math.sin(t * 6 - i * 0.8) * (i / f.w) * 1.6), x = f.x + i, y = f.y + wv;
    g.fillStyle = OUTLINE; g.fillRect(x, y - 1, 1, 7 - Math.floor(i / 3)); g.fillStyle = f.col; g.fillRect(x, y, 1, 5 - Math.floor(i / 3)); if (i < 2) { g.fillStyle = '#ffffff'; g.fillRect(x, y + 1, 1, 1); } }
  for (const tc of R.castleTorches || []) { const fl = Math.floor(t * 12 + tc.x) % 3; g.fillStyle = '#ff5a2a'; g.fillRect(tc.x - 1, tc.y - 1 - fl % 2, 3, 3); g.fillStyle = '#ffd23a'; g.fillRect(tc.x, tc.y - 2 - fl, 1, 3); g.globalAlpha = 0.18; g.fillStyle = '#ffd23a'; g.fillRect(tc.x - 4, tc.y - 5, 9, 9); g.globalAlpha = 1; }
  for (const b of R.castleGlow || []) { const a = 0.25 + 0.2 * Math.sin(t * 3); g.globalAlpha = a; g.fillStyle = '#9ff6ff'; g.fillRect(b.x - 6, b.y - 6, 12, 12); g.globalAlpha = a * 0.5; g.fillRect(b.x - 10, b.y - 10, 20, 20); g.globalAlpha = 1; }
}

// ----- per-frame -----
function unitFrame(u, t) {
  if (u.atkT > 0) return 'atk';
  if (u.moving || u.flying) return Math.floor((t + (u.phase || 0)) * 6) % 2 ? 'walk0' : 'walk1';
  return Math.floor((t + (u.phase || 0)) * 2) % 2 ? 'idle1' : 'idle0';
}

function drawUnit(g, u, t, opts = {}) {
  const S = SPR[u.key] || ensureSprite(u.key); if (!S) return;
  const sc = (S.scale || u.scale || 1) * (u.vscale || 1), size = Math.round(20 * sc);
  const fr = opts.frame || unitFrame(u, t);
  const nativeFace = u.side === 'enemy' ? -1 : 1;
  const flip = (u.facing || nativeFace) !== nativeFace;
  const bob = u.flying ? Math.round(Math.sin((t + (u.phase || 0)) * 6) * 1.5) : 0;
  const x = Math.round(u.x), y = Math.round(u.y - (u.z || 0) + bob);
  // shadow
  g.fillStyle = 'rgba(26,18,48,0.28)'; const sw = Math.round(8 * sc); g.fillRect(Math.round(u.x) - sw / 2, Math.round(u.y), sw, 2); g.fillRect(Math.round(u.x) - sw / 2 + 1, Math.round(u.y) - 1, sw - 2, 1);
  if (opts.selected) { g.fillStyle = '#ffd84a'; g.fillRect(x - 7, Math.round(u.y) + 1, 14, 1); g.fillRect(x - 6, Math.round(u.y) - 2, 1, 3); g.fillRect(x + 5, Math.round(u.y) - 2, 1, 3); }
  const img = u.hitT > 0 && u.alive !== false ? S.white[fr] : S.frames[fr];
  g.save(); if (opts.alpha != null) g.globalAlpha = opts.alpha;
  if (flip) { g.translate(x, 0); g.scale(-1, 1); g.drawImage(img, -size / 2, y - size + 1, size, size); }
  else g.drawImage(img, x - size / 2, y - size + 1, size, size);
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

// pulsing red chevrons on the right edge show where the horde walks in
function drawSpawnArrows(g, t, live) {
  const y0 = GRID.y + 4, y1 = GRID.y + GRID.rows * GRID.cell;
  for (let i = 0; i < 3; i++) {
    const cy = Math.round(y0 + (y1 - y0) * (i + 0.5) / 3);
    for (let j = 0; j < 3; j++) {
      const ph = (t * 1.6 + j / 3) % 1, x = Math.round(W - 6 - ph * 22), a = Math.sin(ph * Math.PI);
      g.globalAlpha = a * (live ? 0.9 : 0.75);
      g.fillStyle = OUTLINE; for (let d = -5; d <= 5; d++) g.fillRect(x + Math.abs(d) - 1, cy + d, 4, 1);
      g.fillStyle = '#ff4a6a'; for (let d = -4; d <= 4; d++) g.fillRect(x + Math.abs(d), cy + d, 2, 1);
    }
  }
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
  if (!R.bg[fi]) R.bg[fi] = buildBackground(fi);
  g.imageSmoothingEnabled = false;
  g.drawImage(R.bg[fi], 0, 0);
  // clouds
  for (const c of R.clouds) { c.x += c.s * dt; if (c.x > W + 40) { c.x = -c.w - 10; c.y = rand(6, 50); }
    g.fillStyle = '#ffffff'; g.fillRect(Math.round(c.x), Math.round(c.y), c.w, 4); g.fillRect(Math.round(c.x + 4), Math.round(c.y - 3), c.w - 10, 3); g.fillRect(Math.round(c.x + c.w * 0.4), Math.round(c.y - 5), c.w * 0.35, 2);
    g.fillStyle = '#e4ecff'; g.fillRect(Math.round(c.x + 2), Math.round(c.y + 4), c.w - 4, 1); }
  // castle
  g.drawImage(buildCastle(run), 0, 0); drawCastleLive(g, t);
  if (run.castleEl && Math.random() < dt * 14) { const E = ELEMENTS[run.castleEl]; FXS.parts.push({ x: rand(4, 96), y: rand(10, 80), vx: rand(-6, 6), vy: run.castleEl === 'ice' || run.castleEl === 'sweet' ? rand(8, 20) : rand(-20, -6), life: rand(0.8, 1.6), t: 0, color: Math.random() < 0.5 ? E.col : E.col2, size: Math.random() < 0.3 ? 2 : 1, grav: 0 }); }
  // castle damage
  const hpf = run.castle.hp / run.castle.max;
  if (hpf < 0.66) { g.fillStyle = OUTLINE; [[70, 100], [12, 120], [84, 230], [40, 200]].slice(0, hpf < 0.33 ? 4 : 2).forEach(([x, y]) => { g.fillRect(x, y, 1, 4); g.fillRect(x + 1, y + 3, 1, 4); g.fillRect(x - 1, y + 6, 1, 3); }); }
  if (hpf < 0.33) for (const [x, y] of [[20, 40], [74, 72], [48, 40]]) { for (let i = 0; i < 4; i++) { g.fillStyle = pick(['#ff8a3a', '#ffde3a', '#ff3d3d']); g.fillRect(x + randi(-2, 2), y - randi(0, 6), 2, 2); } }
  if (B && B.castleHitT > 0) { B.castleHitT -= dt; g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(58, 72, 36, H - 72); }
  // siege ladders and the battering ram
  if (B) { for (const e of B.enemies) if (e.alive && e.climb) { const L = e.climb, k = L.phase === 'raise' ? Math.min(1, L.t / 1.1) : 1, by = Math.round(L.y0), ty = by - (by - RAFTER_Y + 4) * k, bx = CASTLE_X + 8;
      for (const ox of [0, 6]) { g.fillStyle = OUTLINE; g.fillRect(bx + ox - 1, Math.round(ty), 3, by - Math.round(ty)); g.fillStyle = '#b07a3a'; g.fillRect(bx + ox, Math.round(ty), 1, by - Math.round(ty)); }
      g.fillStyle = '#8a5a2a'; for (let y = by - 4; y > ty; y -= 6) g.fillRect(bx, y, 7, 1); }
    if (B.ram && B.ram.crew.length) { const R = B.ram, cx = R.crew.reduce((a, e) => a + e.x, 0) / R.crew.length, sw = R.swing < 0.8 ? R.swing / 0.8 * 8 : 8 - (R.swing - 0.8) / 0.2 * 8, x = Math.round(Math.min(cx, CASTLE_X + 30) - 14 + sw - 8), y = Math.round(R.y - 12);
      g.fillStyle = OUTLINE; g.fillRect(x - 1, y - 1, 32, 7); g.fillStyle = '#8a5a2a'; g.fillRect(x, y, 30, 5); g.fillStyle = '#b07a3a'; g.fillRect(x, y, 30, 1); g.fillStyle = '#6a4a2a'; for (let i = 4; i < 30; i += 7) g.fillRect(x + i, y + 1, 1, 4);
      g.fillStyle = '#8a94b0'; g.fillRect(x - 3, y - 1, 5, 7); g.fillStyle = '#cfd6e6'; g.fillRect(x - 3, y, 2, 2); }
  }
  // grid in prep
  if (!B) {
    for (let c = 0; c < GRID.cols; c++) for (let r = 0; r < GRID.rows; r++) {
      const x = GRID.x + c * GRID.cell, y = GRID.y + r * GRID.cell, hov = V.hover && V.hover.type === 'grid' && V.hover.c === c && V.hover.r === r;
      g.fillStyle = hov ? (V.hoverOk ? 'rgba(124,240,154,0.45)' : 'rgba(255,93,143,0.45)') : c < GRID.courtCols ? 'rgba(120,90,40,0.10)' : 'rgba(30,80,30,0.10)';
      g.fillRect(x + 1, y + 1, GRID.cell - 2, GRID.cell - 2);
      g.fillStyle = 'rgba(255,255,255,0.28)'; g.fillRect(x + 1, y + 1, 2, 1); g.fillRect(x + 1, y + 1, 1, 2); g.fillRect(x + GRID.cell - 3, y + GRID.cell - 2, 2, 1); g.fillRect(x + GRID.cell - 2, y + GRID.cell - 3, 1, 2);
    }
    for (let i = 0; i < rafterSlots(run); i++) { const x = RAFTER_XS[i], hov = V.hover && V.hover.type === 'rafter' && V.hover.i === i;
      g.fillStyle = hov ? (V.hoverOk ? 'rgba(124,240,154,0.6)' : 'rgba(255,93,143,0.6)') : 'rgba(255,216,74,0.25)'; g.fillRect(x - 8, RAFTER_Y - 18, 16, 19); }
  }
  drawHazard(g, B ? B.hz : run.mods.hz, { x: CASTLE_X + 4, y: 98, w: W - CASTLE_X - 4, h: H - 98 }, t, B, false);
  drawSpellDecals(g);
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
  }
  for (const gh of FXS.ghosts) { const S = SPR[gh.key]; if (!S) continue; g.globalAlpha = 0.4 * (1 - gh.t / gh.life); g.drawImage(S.white.atk, Math.round(gh.x - 10), Math.round(gh.y - 19)); g.globalAlpha = 1; }
  if (B) for (const u of units) if (u.alive !== false && !u.boss && !(u.critter && u.hp >= u.maxHp)) drawBar(g, u, u.scale || 1);
  if (!B || B.queue.length || B.t < 8) drawSpawnArrows(g, t, !!B);
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
    else if (w.type === 'spirit') { const S = SPR.spirit; g.globalAlpha = 0.85; g.drawImage(S.frames[Math.floor(t * 10) % 2 ? 'walk0' : 'walk1'], Math.round(w.x - 10), Math.round(w.y - 19)); g.globalAlpha = 1; g.fillStyle = 'rgba(159,246,255,0.5)'; g.fillRect(Math.round(w.x - 30), Math.round(w.y - 8), 18, 1); }
    else if (w.type === 'cheese') { const x0 = Math.round(w.x), y0 = Math.round(w.y), sp = Math.floor(t * 12) % 2; g.fillStyle = OUTLINE; g.fillRect(x0 - 7, y0 - 13, 14, 14); g.fillStyle = '#ffd84a'; g.fillRect(x0 - 6, y0 - 12, 12, 12); g.fillStyle = '#ffb02e'; g.fillRect(x0 - 6, y0 - 7 + sp, 12, 2); g.fillStyle = '#e8a020'; g.fillRect(x0 - 3 + sp * 3, y0 - 10, 2, 2); g.fillRect(x0 + 2 - sp * 3, y0 - 4, 2, 2); }
    else if (w.type === 'quake') { g.fillStyle = '#8a6a2a'; g.fillRect(Math.round(w.x) - 2, Math.round(w.y) - 4, 4, 4); g.fillStyle = '#c9a35a'; g.fillRect(Math.round(w.x) - 1, Math.round(w.y) - 7, 2, 3); }
  }
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
  // beams + bolts at hi-res for smoothness
  for (const b of FXS.beams) { const a = 1 - b.t / b.life; ctx.globalAlpha = a; ctx.strokeStyle = b.color; ctx.lineWidth = b.w * k * (0.5 + a * 0.5); ctx.lineCap = 'butt'; ctx.beginPath(); ctx.moveTo(b.x1 * k + ox, b.y1 * k + oy); ctx.lineTo(b.x2 * k + ox, b.y2 * k + oy); ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1, b.w * k * 0.35 * a); ctx.stroke(); }
  for (const b of FXS.bolts) { ctx.globalAlpha = 1 - b.t / b.life; ctx.strokeStyle = b.color; ctx.lineWidth = k * 1.2; ctx.beginPath(); for (let i = 0; i < b.pts.length - 1; i++) { const p = b.pts[i], q = b.pts[i + 1]; ctx.moveTo(p.x * k + ox, p.y * k + oy); for (let j = 1; j <= 4; j++) { const f = j / 4; ctx.lineTo((p.x + (q.x - p.x) * f + (j < 4 ? rand(-4, 4) : 0)) * k + ox, (p.y + (q.y - p.y) * f + (j < 4 ? rand(-4, 4) : 0)) * k + oy); } } ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = k * 0.5; ctx.stroke(); }
  ctx.globalAlpha = 1;
  drawSpellFX(ctx, k, ox, oy, B);
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
