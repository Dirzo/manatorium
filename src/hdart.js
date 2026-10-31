// ===== Hi-detail champion art (Cam 2026-10-31: "32 bit character upgrades ... a different facial expression for the character trait they rolled")
// Every champion frame is still designed on the 20x20 grid in sprites.js, then rebuilt here at double resolution:
// the body is smoothed with Scale2x, re-lit with a two-tone ramp and a fine 1px outline, and a hand-drawn face that
// matches the champion's temper (TEMPERS in data.js) is painted on at the finer grid.
const HDK = 2;

// Scale2x (EPX): doubles a grid and rounds its stair-steps into smooth diagonals
function hdScale2x(g) {
  const W = g.w, H = g.h, o = new PixGrid(W * 2, H * 2, g.ox * 2, g.oy * 2), at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? null : g.p[y * W + x]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const P = at(x, y), A = at(x, y - 1), B = at(x + 1, y), C = at(x - 1, y), D = at(x, y + 1), fl = g.flat.has(y * W + x);
    const q = [C === A && C !== D && A !== B ? A : P, A === B && A !== C && B !== D ? B : P, D === C && D !== B && C !== A ? C : P, B === D && B !== A && D !== C ? D : P];
    q.forEach((c, i) => { const X = x * 2 + (i & 1), Y = y * 2 + (i >> 1), j = Y * o.w + X; o.p[j] = c; if (c && fl) o.flat.add(j); });
  }
  return o;
}

// two-tone lighting (top lit, back and underside in shade) + a crisp 1px outline at the fine grid
function hdFinish(g, opt = {}) {
  const W = g.w, H = g.h, src = opt.base || g.p, out = g.p.slice(), base = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? null : src[y * W + x]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, c = src[i]; if (!c || g.flat.has(i)) continue; out[i] = c;
    const up = base(x, y - 1) !== c, up2 = base(x, y - 2) !== c, lf = base(x - 1, y) !== c, lf2 = base(x - 2, y) !== c, dn = base(x, y + 1) !== c, rt = base(x + 1, y) !== c;
    let f = 0;
    if (up) f = rt ? 0.34 : 0.2; else if (up2) f = 0.08;
    if (lf) f = Math.min(f, 0) - 0.26; else if (lf2) f -= 0.12;
    if (dn && f > -0.2) f -= 0.16;
    // inner contour: a darker seam where two parts meet (arm on torso, belt on tunic), so shapes read at a glance
    if (opt.seams !== false) { const r = base(x + 1, y), d = base(x, y + 1); if ((r && r !== c && hdLum(r) > hdLum(c) + 40) || (d && d !== c && hdLum(d) > hdLum(c) + 40 && !dn)) f = Math.min(f, -0.3); }
    const role = opt.roles && opt.roles.get(c);
    // soft volume: the lower part of every shape falls into shade through a checker dither
    if (!up && !dn && !lf) {
      let t0 = y, t1 = y; while (base(x, t0 - 1) === c) t0--; while (base(x, t1 + 1) === c) t1++;
      const len = t1 - t0 + 1, k = (y - t0) / Math.max(1, len - 1);
      if (len >= 7 && role !== 'skin') { if (k > 0.8) f -= 0.1; else if (k > 0.62 && (x + y) % 2) f -= 0.1; }
    }
    // rim light on the front (right) edge
    if (rt && !up && !lf && f > -0.1) f += 0.12;
    // materials: metal gets a hard specular glint, hair gets strands
    if (role === 'metal' && up && !lf) f = 0.55;
    if (role === 'metal' && !up && !lf && !dn && base(x - 1, y - 1) !== c && base(x + 1, y) === c) f = 0.4;
    if (role === 'hair' && !up && !lf && !dn && (x * 3 + (y >> 1)) % 4 === 0) f = Math.min(f, 0) - 0.16;
    if (f) out[i] = shade(c, f);
  }
  const o = out.slice(), has = (x, y) => x >= 0 && y >= 0 && x < W && y < H && out[y * W + x];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (out[y * W + x]) continue;
    const l = has(x - 1, y), r = has(x + 1, y), u = has(x, y - 1), d = has(x, y + 1);
    if (l || r || u || d) {
      // selective outline: the lit top edge gets a coloured rim, everything else the deep ink
      const n = d && !l && !r && !u ? out[(y + 1) * W + x] : null;
      o[y * W + x] = n ? mix(OUTLINE, n, 0.3) : OUTLINE;
    }
  }
  g.p = o; return g;
}
function hdLum(c) { const [r, gg, b] = hexToRgb(c); return 0.3 * r + 0.59 * gg + 0.11 * b; }

// ===== faces =====
// eye boxes are 3x3 on the fine grid; L lid line, W eye white, P pupil, H highlight, '.' leaves the skin
const HD_EYES = {
  open:    ['LLL', 'WPP', 'WPP'],
  bright:  ['LLL', 'WPH', 'WPP'],
  big:     ['LLL', 'PPH', 'PPP', '.L.'],
  wide:    ['LLL', 'WWW', 'WPW', '.L.'],
  happy:   ['...', '.L.', 'L.L'],
  soft:    ['...', 'LLL', 'WPP'],
  half:    ['LLL', 'LLL', 'WPP'],
  narrow:  ['...', 'LLL', 'WPP'],
  sparkle: ['LLL', 'PHP', 'PPH'],
  closed:  ['...', '...', 'LLL'],
  smug:    ['...', 'L..', '.LL'],
  side:    ['LLL', 'WWP', 'WWP'],
  droop:   ['...', '...', 'LLL', 'WPP'],
};
// brows: [back eye, front eye], drawn over the 3 columns above each eye; the inner end is the right of the back eye
const HD_BROWS = {
  none:    [[], []],
  flat:    [['BBB'], ['BBB']],
  up:      [['BBB', '...'], ['BBB', '...']],
  firm:    [['BB.', '..B'], ['B..', '.BB']],
  angry:   [['B..', '.B.', '..B'], ['..B', '.B.', 'B..']],
  worried: [['..B', 'BB.'], ['B..', '.BB']],
  raise:   [['...', 'BBB'], ['BBB', '...']],
  sly:     [['...', 'BBB'], ['.BB', 'B..']],
};
// mouths, centred on the mouth anchor; M lip line, D mouth dark, T teeth, R tongue, Q drool
const HD_MOUTHS = {
  smile:    ['M...M', '.MMM.'],
  grin:     ['DDDDD', 'DTTTD', '.DRD.'],
  flat:     ['.MMM.'],
  smirk:    ['....M', '.MMM.'],
  shout:    ['.DDD.', 'DTTTD', 'DRRRD', '.DDD.'],
  teeth:    ['MMMMM', 'TMTMT', 'MMMMM'],
  wobble:   ['.M.M.', 'M.M.M'],
  crooked:  ['M....', '.MDDT', '..DD.'],
  evil:     ['M...M', 'MTTTM', '.MMM.'],
  drool:    ['.MMM.', '...Q.', '...Q.'],
  frown:    ['.MMM.', 'M...M'],
  o:        ['.D.', 'DRD', '.D.'],
};
// one expression per temperament (data.js TEMPERS)
const TEMPER_FACE = {
  heroic:     { eyes: 'bright', brow: 'firm', mouth: 'smile', fx: ['shine'] },
  cheerful:   { eyes: 'happy', brow: 'up', mouth: 'grin', fx: ['blush'] },
  honorable:  { eyes: 'open', brow: 'flat', mouth: 'flat' },
  wholesome:  { eyes: 'soft', brow: 'up', mouth: 'smile', fx: ['blush'] },
  zealous:    { eyes: 'wide', brow: 'angry', mouth: 'shout' },
  wise:       { eyes: 'half', brow: 'raise', mouth: 'smirk' },
  loyal:      { eyes: 'big', brow: 'worried', mouth: 'smile' },
  optimistic: { eyes: 'sparkle', brow: 'up', mouth: 'grin', fx: ['blush'] },
  angry:      { eyes: 'narrow', brow: 'angry', mouth: 'teeth', fx: ['vein', 'flush'] },
  deranged:   { eyes: ['wide', 'narrow'], brow: 'raise', mouth: 'crooked', fx: ['sweat'] },
  greedy:     { eyes: 'narrow', brow: 'sly', mouth: 'smirk', pupil: '#ffcf3a' },
  cowardly:   { eyes: 'wide', brow: 'worried', mouth: 'wobble', fx: ['sweat', 'pale'] },
  vain:       { eyes: 'smug', brow: 'raise', mouth: 'smirk', fx: ['lash', 'blush'] },
  cruel:      { eyes: 'narrow', brow: 'angry', mouth: 'evil', pupil: '#ff3d6e' },
  paranoid:   { eyes: 'side', brow: 'worried', mouth: 'flat', fx: ['bags', 'sweat'] },
  lazy:       { eyes: 'droop', brow: 'none', mouth: 'drool', fx: ['bags'] },
};

// where the face sits on the 20-grid for each head shape, and which pixels of the old 1px face to wipe first
// e: [backEyeX, frontEyeX, eyeY] (fine grid, top-left of the 3x3 box), m: [mouthX, mouthY], k: cheek y
const HD_HEADS = {
  human:    { e: [19, 23, 12], m: [23, 18], k: 16, wipe: [[10, 6], [10, 7], [12, 6], [12, 7], [13, 8], [11, 9]] },
  elf:      { e: [19, 23, 12], m: [23, 18], k: 16, wipe: [[10, 6], [10, 7], [12, 6], [12, 7], [13, 8], [11, 9]] },
  dwarf:    { e: [19, 23, 12], m: [23, 18], k: 16, wipe: [[10, 6], [10, 7], [12, 6], [12, 7], [13, 8], [11, 9]], beard: true },
  orc:      { e: [19, 23, 12], m: [23, 18], k: 16, wipe: [[10, 6], [10, 7], [12, 6], [12, 7], [11, 9], [9, 5], [10, 5], [11, 5], [12, 5], [13, 5]] },
  beast:    { e: [19, 23, 11], m: [28, 19], k: 15, wipe: [[10, 6], [10, 7], [12, 6], [11, 9]] },
  goblin:   { e: [17, 21, 14], m: [21, 20], k: 18, wipe: [[9, 7], [11, 7], [9, 8], [11, 8], [9, 10], [10, 10], [11, 10]] },
  skeleton: { e: [16, 22, 10], m: [21, 18], k: 15, skull: true, wipe: [[8, 5], [9, 5], [11, 5], [12, 5], [8, 6], [9, 6], [11, 6], [12, 6], [10, 7], [8, 9], [9, 9], [10, 9], [11, 9], [12, 9]] },
  toad:     { e: [15, 25, 4], m: [24, 16], k: 14, toad: true, wipe: [[8, 3], [13, 3], [8, 8], [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8], [5, 7]] },
};

// puts the old tiny face back to bare skin, so the fine face can be painted in its place
function hdWipeFace(g, s, by) {
  const H = HD_HEADS[s.head]; if (!H) return;
  for (const [x, y] of H.wipe) {
    const c = g.get(x, y + by); if (!c) continue;
    let to = s.skin;
    if (H.skull) to = s.skin;
    if (H.toad) to = y === 3 ? '#ffffff' : y === 8 && x <= 13 ? (s.belly || shade(s.skin, 0.4)) : s.skin;
    if (s.head === 'dwarf' && y >= 8) continue; // under the beard
    if (c === to) continue;
    // only wipe face colours: never a hat brim, hood or beard that happens to sit there
    const face = H.skull || c === OUTLINE || c === (s.eye || OUTLINE) || c === '#ff9aa8' || c === '#ffde3a' || c === '#ffffff' || c === '#ff5d8f' || c === s.eye || c === shade(s.skin, -0.3) || c === shade(s.skin, -0.35) || c === shade(s.skin, -0.45) || c === shade(s.skin, -0.5);
    if (face) g.set(x, y + by, to, H.skull || H.toad);
  }
}

function hdPaintFace(g, s, by, temper) {
  const H = HD_HEADS[s.head]; if (!H) return;
  if (H.skull) return hdSkullFace(g, s, by, temper);
  const F = TEMPER_FACE[temper] || TEMPER_FACE.honorable, fx = F.fx || [], dy = by * HDK;
  const skin = s.skin, snout = s.snout || shade(skin, 0.4), belly = s.belly || shade(skin, 0.4), hair = s.hair || shade(skin, -0.4);
  // the face only lands on bare skin (or a dwarf's beard), so helms, hoods and fringes keep covering it
  const okBase = new Set([skin, snout, belly, shade(skin, -0.2)]);
  if (H.beard) okBase.add(hair);
  if (H.skull) { okBase.add(OUTLINE); okBase.add(shade(skin, -0.25)); }
  if (H.toad) { okBase.add('#ffffff'); }
  const raw = (x, y) => g.raw(x + g.ox, y + g.oy);
  const can = (x, y) => { const c = raw(x, y); return c && okBase.has(c); };
  const put = (x, y, c, force) => { if (force || can(x, y)) g.set(x, y, c, true); };
  const ink = H.skull ? OUTLINE : mix(OUTLINE, skin, 0.18);
  const browC = H.skull ? shade(skin, -0.45) : s.head === 'toad' || s.head === 'goblin' || s.head === 'orc' || s.head === 'beast' ? shade(skin, -0.5) : shade(hair, hdLum(hair) > 140 ? -0.5 : -0.25);
  const pupil = F.pupil || (H.skull ? s.eye || '#ff5d8f' : s.eye && s.eye !== OUTLINE ? s.eye : '#2a1840');
  const white = H.skull ? OUTLINE : '#fffaf0';
  const [ex0, ex1, ey0] = H.e, ey = ey0 + dy, kinds = Array.isArray(F.eyes) ? F.eyes : [F.eyes, F.eyes];
  // skulls keep their dark sockets: the "white" is the socket and the glow is the pupil
  const eyeCol = ch => ch === 'L' ? ink : ch === 'W' ? white : ch === 'P' ? pupil : ch === 'H' ? '#ffffff' : null;
  [ex0, ex1].forEach((ex, side) => {
    const pat = HD_EYES[kinds[side]] || HD_EYES.open;
    pat.forEach((row, r) => [...row].forEach((ch, c) => { const col = eyeCol(ch); if (col) put(ex + c, ey + r - (pat.length > 3 && kinds[side] !== 'droop' ? 1 : 0), col); }));
    if (fx.includes('lash')) { put(ex + (side ? 3 : -1), ey - 1, ink); put(ex + (side ? 3 : -1), ey, ink); }
    if (fx.includes('bags')) { put(ex, ey + 3, shade(skin, -0.28)); put(ex + 1, ey + 3, shade(skin, -0.28)); put(ex + 2, ey + 3, shade(skin, -0.2)); }
    // brows sit right on top of the eye (its first drawn row), and angled brows dip their inner tip onto the lid
    const br = (HD_BROWS[F.brow] || HD_BROWS.flat)[side], top = ey + pat.findIndex(row => /[^.]/.test(row)) - (pat.length > 3 && kinds[side] !== 'droop' ? 1 : 0);
    const low = F.brow === 'angry' || F.brow === 'firm' || F.brow === 'sly' ? top : top - 1;
    br.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === 'B') put(ex + c, low - (br.length - 1) + r, browC); }));
  });
  // mouth
  const M0 = HD_MOUTHS[F.mouth] || HD_MOUTHS.flat, M = H.toad ? M0.map(r => { const m = r.length >> 1; return r.slice(0, m) + r[m].repeat(4) + r.slice(m); }) : M0, [mx0, my0] = H.m, mx = mx0 - Math.floor(M[0].length / 2), my = my0 + dy;
  const mCol = { M: H.skull ? OUTLINE : shade(H.beard ? hair : s.head === 'beast' ? snout : skin, -0.55), D: '#4a1430', T: H.skull ? skin : '#ffffff', R: '#ff6a7a', Q: '#9fe6ff' };
  M.forEach((row, r) => [...row].forEach((ch, c) => { if (mCol[ch]) put(mx + c, my + r, mCol[ch]); }));
  // little extras
  const k = H.k + dy;
  if (fx.includes('blush')) { put(ex1 + 2, k, '#ff9aa8'); put(ex1 + 3, k, '#ff9aa8'); put(ex0 - 1, k, '#ffb3bf'); }
  if (fx.includes('flush')) { put(ex1 + 2, k, '#ff6a6a'); put(ex1 + 3, k, '#ff6a6a'); put(ex0, k, '#ff8a8a'); }
  if (fx.includes('pale')) { for (let x = ex0; x <= ex1 + 3; x++) if (can(x, ey - 4) && raw(x, ey - 4) === skin) put(x, ey - 4, mix(skin, '#bfe6ff', 0.45)); }
  if (fx.includes('vein')) { const vx = ex1 + 2, vy = ey - 5; for (const [a, b] of [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]]) g.set(vx + a, vy + b, '#ff3d6e', true); }
  if (fx.includes('sweat')) { const sx = ex1 + 4, sy = ey - 3; g.set(sx, sy, '#bff4ff', true); g.set(sx, sy + 1, '#7fd8ff', true); g.set(sx - 1, sy + 1, '#ffffff', true); g.set(sx, sy + 2, '#5fb8f0', true); }
  if (fx.includes('shine')) { put(ex1 + 3, ey - 1, '#ffffff'); }
}

// the full fine-grid frame for one champion look and temper
function hdHumanoid(spec, frame, temper) {
  const fin = PixGrid.prototype.finish; let g;
  PixGrid.prototype.finish = function () { return this; };
  try { g = genHumanoid(spec, frame); } finally { PixGrid.prototype.finish = fin; }
  const by = frame === 'idle1' ? 1 : 0;
  hdWipeFace(g, spec, by);
  const G = hdScale2x(g), base = G.p.slice();
  hdPaintFace(G, spec, by, temper);
  const roles = new Map([[spec.skin, 'skin']]); if (spec.snout) roles.set(spec.snout, 'skin'); if (spec.belly) roles.set(spec.belly, 'skin');
  if (spec.hair) roles.set(spec.hair, 'hair');
  for (const m of [spec.metal || '#dfe6f5', '#dfe6f5', '#cfd6e6', '#d8dde8', '#e8eefc']) roles.set(m, 'metal');
  if (spec.hat === 'helm') roles.set(spec.metal && spec.weapon !== 'shield' ? spec.metal : shade(spec.armor, 0.15), 'metal');
  return hdFinish(G, { base, roles });
}

// every frame of one hi-detail champion; canvases carry .hd so frameBox / drawIdleUnit draw them at the usual size
function buildSpriteHD(key, spec, temper) {
  const out = { frames: {}, white: {}, scale: 1, hd: HDK };
  for (const f of FRAMES) { const g = hdHumanoid(spec, f, temper), c = g.toCanvas(false), w = g.toCanvas(false, true); c.hd = w.hd = HDK; out.frames[f] = c; out.white[f] = w; }
  SPR[key] = out; return out;
}
// the field shows a champion in hi-detail with the face of the temper they rolled
const HD_ON = true;
function hdUnitKey(u) {
  if (!HD_ON || !u.key || !u.key.startsWith('h:') || u.key.includes('@') || u.key.includes('|')) return u.key;
  const tp = u.inst && u.inst.temper; return tp ? u.key + '|' + tp : u.key;
}

// ===== background polish: the field painting is rebuilt at double detail =====
// smooth dithered sky, sunlit rims on the hills, a living grass texture with blades and flowers, warm light and a soft vignette
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
function hdNoise(x, y, s, seed) { // smooth value noise, 0..1
  const fx = x / s, fy = y / s, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0, sm = t => t * t * (3 - 2 * t);
  const h = (a, b) => hash(a * 13 + seed, b * 7 + seed * 3);
  const a = h(x0, y0), b = h(x0 + 1, y0), c = h(x0, y0 + 1), d = h(x0 + 1, y0 + 1), u = sm(tx), v = sm(ty);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function hdPolishBackground(src, el) {
  const K = HDK, c = document.createElement('canvas'); c.width = src.width * K; c.height = src.height * K;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(src, 0, 0, c.width, c.height);
  const CW = c.width, CH = c.height, im = g.getImageData(0, 0, CW, CH), d = im.data, so = src.getContext('2d').getImageData(0, 0, src.width, src.height).data;
  const hex = (r, gg, b) => (r << 16) | (gg << 8) | b, at = (x, y) => { const j = (y * CW + x) * 4; return hex(d[j], d[j + 1], d[j + 2]); };
  const put = (x, y, rgb) => { const j = (y * CW + x) * 4; d[j] = rgb[0]; d[j + 1] = rgb[1]; d[j + 2] = rgb[2]; };
  const lerp3 = (A, B, t) => [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t];
  const tint = (rgb, f) => f < 0 ? rgb.map(v => v * (1 + f)) : rgb.map(v => v + (255 - v) * f);
  const SKY_Y = 92 * K, scene = typeof ELEMENT_SCENES !== 'undefined' && ELEMENT_SCENES[el];
  // 1) sky: the hard bands become a dithered gradient (only bare-sky pixels, so sun, hills and clouds stay)
  const bandCol = []; for (let y = 0; y < 92; y++) { const j = y * src.width * 4; bandCol.push([so[j], so[j + 1], so[j + 2]]); }
  const bands = []; bandCol.forEach((col, y) => { const L = bands[bands.length - 1]; if (!L || hex(...L.col) !== hex(...col)) bands.push({ col, y0: y, y1: y }); else L.y1 = y; });
  for (let Y = 0; Y < SKY_Y; Y++) {
    const y = Y / K, bi = bands.findIndex(b => y >= b.y0 && y <= b.y1 + 0.99); if (bi < 0) continue;
    const B0 = bands[bi], B1 = bands[bi + 1], f = B1 ? (y - B0.y0) / (B0.y1 - B0.y0 + 1) : 0, ref = hex(...B0.col);
    for (let X = 0; X < CW; X++) if (at(X, Y) === ref) {
      // a soft continuous blend plus ordered dither between the two neighbours
      const smooth = B1 ? lerp3(B0.col, B1.col, f * 0.5) : B0.col, pick = B1 && BAYER4[(Y % 4) * 4 + (X % 4)] < f * 0.5 ? B1.col : smooth;
      put(X, Y, pick.map(Math.round));
    }
  }
  // 2) hills and anything standing on the skyline: a sunlit rim on the top edge
  const rim = new Array(CW).fill(-1);
  for (let X = 0; X < CW; X++) {
    let wasSky = true;
    for (let Y = 2; Y < SKY_Y + 4; Y++) {
      const j = (Y * CW + X) * 4, isSky = bands.some(b => Math.abs(d[j] - b.col[0]) + Math.abs(d[j + 1] - b.col[1]) + Math.abs(d[j + 2] - b.col[2]) < 30);
      if (wasSky && !isSky && Y > 40) { put(X, Y, tint([d[j], d[j + 1], d[j + 2]], 0.28)); if (rim[X] < 0) rim[X] = Y; }
      wasSky = isSky;
    }
  }
  // 3) ground: bare ground colour gets mottled light, grass blades and the odd flower
  // the ground colour is whatever covers most of the field (scenes repaint it), and anything close to it counts as open ground
  const cnt = new Map(); for (let Y = SKY_Y + 8; Y < CH; Y += 3) for (let X = 0; X < CW; X += 3) { const v = at(X, Y); cnt.set(v, (cnt.get(v) || 0) + 1); }
  const gref = [...cnt.entries()].sort((a, b) => b[1] - a[1])[0][0], gc = [(gref >> 16) & 255, (gref >> 8) & 255, gref & 255];
  const isG = (X, Y) => { const j = (Y * CW + X) * 4; return Math.abs(d[j] - gc[0]) + Math.abs(d[j + 1] - gc[1]) + Math.abs(d[j + 2] - gc[2]) < 40; };
  const lush = !scene || ['nature', 'light', 'water', 'sweet', 'treat'].includes(el);
  const flowers = ['#ffffff', '#ffe680', '#ff9ac8', '#bfe6ff'];
  for (let Y = SKY_Y; Y < CH; Y++) for (let X = 0; X < CW; X++) {
    if (!isG(X, Y)) continue;
    const j0 = (Y * CW + X) * 4, gc0 = gc; let gcx = [d[j0], d[j0 + 1], d[j0 + 2]];
    const n = hdNoise(X, Y, 46, 3) * 0.7 + hdNoise(X, Y, 13, 9) * 0.3, th = BAYER4[(Y % 4) * 4 + (X % 4)];
    let col = gcx;
    if (n > 0.56) col = tint(gcx, n - th * 0.2 > 0.58 ? 0.14 : 0.07); else if (n < 0.44) col = tint(gcx, n + th * 0.2 < 0.42 ? -0.12 : -0.06);
    // a touch more colour, so the field reads bright and lively
    put(X, Y, col.map(Math.round));
  }
  for (let i = 0; i < CW * (CH - SKY_Y) / 60; i++) {
    const X = Math.floor(hash(i, 101) * CW), Y = SKY_Y + 6 + Math.floor(hash(i, 103) * (CH - SKY_Y - 7)); if (!isG(X, Y) || !isG(X, Y - 2)) continue;
    const r = hash(i, 107), base = [d[(Y * CW + X) * 4], d[(Y * CW + X) * 4 + 1], d[(Y * CW + X) * 4 + 2]];
    if (lush && r < 0.035) { const fc = hexToRgb(flowers[i % 4]); put(X, Y, fc); put(X, Y + 1, tint(gc, -0.3)); }
    else { const tall = r < 0.4 ? 3 : 2; for (let k = 0; k < tall; k++) if (Y - k > SKY_Y) put(X + (k === tall - 1 && r > 0.7 ? 1 : 0), Y - k, tint(base, k === tall - 1 ? 0.22 : -0.2)); }
  }
  // a gentle colour grade over the whole painting: livelier colour and a little more contrast
  for (let j = 0; j < d.length; j += 4) { const av = (d[j] + d[j + 1] + d[j + 2]) / 3;
    for (let q = 0; q < 3; q++) d[j + q] = Math.max(0, Math.min(255, (av + (d[j + q] - av) * 1.2 - 128) * 1.06 + 131)); }
  g.putImageData(im, 0, 0);
  // 4) light: warm sun glow from the top right, cooler shade toward the bottom corners
  const dark = ['dark', 'void'].includes(el);
  if (!dark) { const L = g.createRadialGradient(410 * K, 26 * K, 6 * K, 410 * K, 26 * K, 300 * K); L.addColorStop(0, 'rgba(255,236,170,0.32)'); L.addColorStop(0.4, 'rgba(255,226,150,0.10)'); L.addColorStop(1, 'rgba(255,226,150,0)');
    g.globalCompositeOperation = 'soft-light'; g.fillStyle = L; g.fillRect(0, 0, CW, CH); }
  g.globalCompositeOperation = 'source-over';
  const V = g.createRadialGradient(CW * 0.55, CH * 0.45, CH * 0.35, CW * 0.55, CH * 0.45, CW * 0.75); V.addColorStop(0, 'rgba(20,12,40,0)'); V.addColorStop(1, dark ? 'rgba(8,4,20,0.3)' : 'rgba(26,18,60,0.14)');
  g.fillStyle = V; g.fillRect(0, 0, CW, CH);
  // a thin bright haze where the land meets the sky
  const Hz = g.createLinearGradient(0, SKY_Y - 10 * K, 0, SKY_Y + 6 * K); Hz.addColorStop(0, 'rgba(255,255,255,0)'); Hz.addColorStop(0.6, dark ? 'rgba(160,120,255,0.10)' : 'rgba(255,250,230,0.16)'); Hz.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = Hz; g.fillRect(0, SKY_Y - 10 * K, CW, 16 * K);
  return c;
}

// fluffy shaded clouds at the fine grid (cached per width and palette); drawn in game units at (x, y) = left, base line
const HD_CLOUDS = {};
function hdCloud(g, x, y, w, col, under) {
  const key = w + col + under; let c = HD_CLOUDS[key];
  if (!c) {
    const K = HDK, Wf = (w + 6) * K, Hf = 14 * K; c = HD_CLOUDS[key] = document.createElement('canvas'); c.width = Wf; c.height = Hf;
    const x2 = c.getContext('2d'), puffs = [[0.22, 0.62, 0.2], [0.45, 0.42, 0.3], [0.7, 0.55, 0.22], [0.86, 0.72, 0.13], [0.1, 0.78, 0.11]];
    const inside = (X, Y) => puffs.some(([px, py, pr]) => { const r = pr * w * K * 0.6, cx = 3 * K + px * w * K, cy = py * Hf; return (X - cx) ** 2 + ((Y - cy) * 1.5) ** 2 < r * r; }) && Y < Hf - 2;
    const lit = shade(col, 0.5), mid = col, low = under;
    for (let Y = 0; Y < Hf; Y++) for (let X = 0; X < Wf; X++) { if (!inside(X, Y)) continue;
      const top = !inside(X, Y - 2), bot = !inside(X, Y + 3) || Y > Hf * 0.72, th = BAYER4[(Y % 4) * 4 + (X % 4)];
      x2.fillStyle = top ? lit : bot ? low : Y > Hf * 0.6 && th < 0.5 ? low : mid; x2.fillRect(X, Y, 1, 1); }
  }
  g.drawImage(c, Math.round(x) - 3, Math.round(y) - 10, c.width / HDK, c.height / HDK);
}

// skulls have no skin to move, so the expression lives in the shape of the sockets, the glow inside them and the jaw
// socket masks are 5x5 ('#' dark socket, 'g' glow, 'w' glint, '.' bone); back socket listed, the front one is mirrored
const SKULL_EYES = {
  open:    ['.###.', '#####', '##gw#', '##gg#', '.###.'],
  bright:  ['.###.', '#####', '##gw#', '##gg#', '.###.'],
  big:     ['.###.', '#ggw#', '#ggg#', '#ggg#', '.###.'],
  wide:    ['.###.', '#####', '##g##', '#####', '.###.'],
  happy:   ['.###.', '#ggg#', '#g#g#', '.....', '.....'],
  soft:    ['.....', '.###.', '##gg#', '##gg#', '.###.'],
  half:    ['.....', '.....', '#####', '##gg#', '.###.'],
  narrow:  ['.....', '.....', '#####', '#ggg#', '.###.'],
  sparkle: ['.###.', '#gwg#', '#ggg#', '##g##', '.###.'],
  closed:  ['.....', '.....', '.....', '#####', '.###.'],
  smug:    ['.....', '.....', '.....', '#ggg#', '.###.'],
  side:    ['.###.', '#####', '###gg', '###gg', '.###.'],
  droop:   ['.....', '.....', '.....', '#ggg#', '.###.'],
};
// brow ridges cut bone into the socket: 'angry' slopes down to the middle, 'worried' slopes up
const SKULL_CUT = { angry: [[3, 0], [4, 0], [4, 1]], firm: [[4, 0]], sly: [[3, 0], [4, 0]], worried: [[0, 0], [1, 0], [0, 1]], raise: [] };
const SKULL_JAW = {
  smile:   ['#.....#', '.#####.', '..###..'],
  grin:    ['#######', '#t#t#t#', '.#####.'],
  flat:    ['.#####.', '.t#t#t.'],
  smirk:   ['......#', '.#####.', '.t#t#..'],
  shout:   ['.#####.', '#t#t#t#', '#######', '.#####.'],
  teeth:   ['#######', 't#t#t#t', '#######'],
  wobble:  ['.#.#.#.', '#.#.#.#'],
  crooked: ['#......', '.##t#t#', '...##..'],
  evil:    ['#.....#', '##t#t##', '.#####.'],
  drool:   ['.#####.', '.t#t#t.', '....q..', '....q..'],
  frown:   ['..###..', '.#####.', '#.....#'],
  o:       ['..###..', '.#####.', '..###..'],
};
function hdSkullFace(g, s, by, temper) {
  const F = TEMPER_FACE[temper] || TEMPER_FACE.honorable, fx = F.fx || [], dy = by * HDK, bone = s.skin, ridge = shade(bone, -0.32);
  const glow = F.pupil || s.eye || '#ff5d8f', kinds = Array.isArray(F.eyes) ? F.eyes : [F.eyes, F.eyes];
  const can = (x, y) => { const c = g.raw(x + g.ox, y + g.oy); return c === bone || c === OUTLINE || c === shade(bone, -0.25); };
  const put = (x, y, c) => { if (can(x, y)) g.set(x, y, c, true); };
  const col = ch => ch === '#' ? OUTLINE : ch === 'g' ? glow : ch === 'w' ? '#ffffff' : ch === 't' ? bone : ch === 'q' ? '#9fe6ff' : null;
  // sockets: back one at x 15, front at x 21 (mirrored, so its glow looks forward)
  [[15, false], [21, true]].forEach(([x0, mir], side) => {
    const M = SKULL_EYES[kinds[side]] || SKULL_EYES.open, y0 = 9 + dy;
    M.forEach((row, r) => [...row].forEach((ch, c) => { const cc = col(ch); if (cc) put(x0 + (mir ? c : 4 - c), y0 + r, cc); }));
    // ridge over the socket, cut in at the brow's angle
    for (const [cx, cy] of SKULL_CUT[F.brow] || []) put(x0 + (mir ? 4 - cx : cx), y0 + cy, bone);
    if (F.brow === 'angry' || F.brow === 'firm' || F.brow === 'sly') for (let i = 0; i < 4; i++) put(x0 + (mir ? 4 - i : i) , y0 - 1 + Math.floor(i / 2), ridge);
    else if (F.brow === 'worried') for (let i = 0; i < 4; i++) put(x0 + (mir ? i : 4 - i), y0 - 1 + Math.floor(i / 2), ridge);
    else if (F.brow !== 'none') for (let i = 0; i < 5; i++) put(x0 + i, y0 - (F.brow === 'up' || (F.brow === 'raise' && side) ? 2 : 1), ridge);
  });
  // nose: a small dark heart
  const ny = 15 + dy; put(20, ny, OUTLINE); put(21, ny, OUTLINE); put(20, ny + 1, OUTLINE); put(21, ny + 1, shade(bone, -0.45));
  // jaw
  const J = SKULL_JAW[F.mouth] || SKULL_JAW.flat, jx = 17, jy = 18 + dy;
  J.forEach((row, r) => [...row].forEach((ch, c) => { const cc = col(ch); if (cc) put(jx + c, jy + r, cc); }));
  if (fx.includes('vein')) for (const [a, b] of [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]]) g.set(25 + a, 4 + dy + b, '#ff3d6e', true);
  if (fx.includes('sweat')) { g.set(27, 8 + dy, '#bff4ff', true); g.set(27, 9 + dy, '#7fd8ff', true); g.set(27, 10 + dy, '#5fb8f0', true); }
  if (fx.includes('blush')) { put(25, 16 + dy, '#ff9aa8'); put(26, 16 + dy, '#ff9aa8'); put(14, 16 + dy, '#ffb3bf'); }
  if (fx.includes('flush')) { put(25, 16 + dy, '#ff6a6a'); put(26, 16 + dy, '#ff6a6a'); }
}
