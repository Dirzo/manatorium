// ===== Living backdrops: each element's background and castle stir a little =====
// Drawn every frame over the cached background and castle, all from the clock (no saved state).
// Each looping mote gets a phase q in 0..1 from loop(); its life is drawn as a function of q.
const loop = (t, i, n, sp) => (t * sp + i / n + hash(i * 13 + 5, n * 7 + 3) * 0.37) % 1;
function alivePainter(g) {
  const p = (x, y, c, w = 1, h = 1, a = 1) => { if (a <= 0) return; g.globalAlpha = Math.min(1, a); g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
  const bolt = (x0, y0, x1, y1, c, seed) => { let x = x0; const n = Math.max(3, Math.round((y1 - y0) / 5));
    for (let i = 0; i < n; i++) { const y = y0 + (y1 - y0) * i / n, nx = i === n - 1 ? x1 : x0 + (x1 - x0) * (i + 1) / n + (hash(seed, i) - 0.5) * 8;
      const steps = Math.max(1, Math.round((y1 - y0) / n)); for (let s = 0; s < steps; s++) p(x + (nx - x) * s / steps, y + s, c); x = nx; } };
  const bat = (x, y, f, c = '#1a1230') => { p(x, y, c, 2, 1); p(x - 2, y - (f ? 1 : -1), c, 2, 1); p(x + 2, y - (f ? 1 : -1), c, 2, 1); };
  const bird = (x, y, f, c) => { p(x, y, c, 1, 1); p(x - 1, y - (f ? 1 : 0), c); p(x + 1, y - (f ? 1 : 0), c); p(x - 2, y - (f ? 2 : 0), c); p(x + 2, y - (f ? 2 : 0), c); };
  const star = (x, y, c, r = 1, a = 1) => { p(x, y, c, 1, 1, a); for (let i = 1; i <= r; i++) { p(x - i, y, c, 1, 1, a * 0.8); p(x + i, y, c, 1, 1, a * 0.8); p(x, y - i, c, 1, 1, a * 0.8); p(x, y + i, c, 1, 1, a * 0.8); } };
  return { p, bolt, bat, bird, star };
}

// ----- the background -----
function drawSceneLive(g, el, t) {
  const { p, bolt, bat, bird, star } = alivePainter(g);
  g.save();
  // the same few birds wheel over every world, unless the sky is too wild for them
  if (!['void', 'lightning', 'dark'].includes(el)) for (let i = 0; i < 3; i++) { const q = loop(t, i, 3, 0.022); bird(110 + q * 380, 22 + i * 7 + Math.sin(t * 0.9 + i) * 3, Math.floor(t * 5 + i) % 2, el === 'salty' || el === 'water' ? '#ffffff' : '#3a3450'); }
  switch (el) {
    case 'fire': {
      for (let i = 0; i < 6; i++) { const q = loop(t, i, 6, 0.12), r = 1 + Math.round(q * 4); p(258 + Math.sin(q * 5 + i) * 4 - r / 2 + q * 10, 24 - q * 26, q < 0.3 ? '#8a7078' : '#a8909a', r + 1, r, 0.7 * (1 - q)); }
      for (let y = 42; y < 87; y++) { const f = (y * 0.2 - t * 3) % 6; if (f > 0 && f < 1.2) p(260 + Math.round(Math.sin(y * 0.17) * 3), y, '#ffe680', 1, 1, 0.9); }
      p(255, 26, '#ffc684', 10, 2, 0.35 + 0.3 * Math.sin(t * 3));
      for (let i = 0; i < 14; i++) { const q = loop(t, i, 14, 0.18); p(110 + hash(i, 41) * 370 + Math.sin(q * 6 + i) * 6, 92 - q * 80, hash(i, 42) < 0.5 ? '#ff8a3a' : '#ffd23a', 1, 1, bump(q)); }
      break; }
    case 'water': {
      for (let x = 121; x < 319; x++) { const f = (x * 0.15 - t * 4) % 5; if (f > 0 && f < 0.6) p(x, 76, '#ffffff', 1, 1, 0.8); }
      for (let x = 125; x < 315; x += 27) { const q = (t * 0.9 + x * 0.01) % 1; p(x + 1, 78 + q * 14, '#e0fcf2', 2, 1, 0.7 * (1 - q)); }
      break; }
    case 'nature': {
      for (const [x, y] of [[132, 78], [225, 72], [287, 82]]) for (let i = 0; i < 3; i++) { const q = loop(t, i + x, 3, 0.15); p(x + Math.sin(q * 8 + i) * 6 + q * 8, y - 6 + q * 22, i % 2 ? '#92ac72' : '#bdd699', 2, 1, bump(q) * 1.5); }
      for (let i = 0; i < 6; i++) { const a = t * 0.7 + i * 1.7; const x = 200 + hash(i, 61) * 260 + Math.sin(a) * 14, y = 110 + hash(i, 62) * 140 + Math.cos(a * 1.3) * 6; p(x, y, '#fff6a0', 1, 1, 0.5 + 0.5 * Math.sin(t * 4 + i * 2)); }
      break; }
    case 'ice': {
      for (let i = 0; i < 6; i++) p(0, 8 + i * 2 + Math.round(Math.sin(t * 0.6 + i) * 2), i % 2 ? '#9af0d8' : '#bff4ff', W, 1, 0.07 + 0.05 * Math.sin(t * 0.8 + i * 0.7));
      for (let i = 0; i < 40; i++) { const q = loop(t, i, 40, 0.07); p((hash(i, 71) * W + Math.sin(q * 9 + i) * 8 + q * 30) % W, -4 + q * (H + 8), '#ffffff', 1, 1, 0.8); }
      [[151, 58], [224, 34], [295, 65]].forEach(([x, y], i) => { const f = (t * 0.5 + i * 0.33) % 1; if (f < 0.12) star(x + 2, y + 6, '#ffffff', f < 0.06 ? 2 : 1); });
      break; }
    case 'lightning': {
      for (let i = 0; i < 30; i++) { const q = loop(t, i, 30, 0.9); const x = (hash(i, 81) * (W + 40) - q * 30), y = q * 96; p(x, y, '#c8d8e8', 1, 3, 0.35); }
      const cyc = t % 4.5, tips = [[140, 60], [229, 48], [300, 63]], ti = Math.floor(t / 4.5) % 3;
      if (cyc < 0.35) { const [x, y] = tips[ti], fl = Math.floor(cyc * 20) % 2; if (fl) { p(0, 0, '#ffffff', W, 92, 0.12); } bolt(x + (hash(ti, Math.floor(t / 4.5)) - 0.5) * 60, 0, x, y, fl ? '#ffffff' : '#9ff6ff', Math.floor(t / 4.5)); }
      tips.forEach(([x, y], i) => { if (Math.floor(t * 7 + i * 3) % 9 === 0) star(x, y, '#9ee5ed', 1); });
      break; }
    case 'dark': {
      p(228, 18, '#b3a5bd', 26, 26, 0.06 + 0.04 * Math.sin(t * 1.2));
      for (let i = 0; i < 5; i++) { const a = t * 0.5 + i * 1.3, r = 26 + i * 9; bat(240 + Math.cos(a) * r * 1.6, 34 + Math.sin(a * 1.4) * r * 0.45, Math.floor(t * 8 + i) % 2); }
      for (const [x, y] of [[135, 77], [220, 64], [298, 74]]) p(x + 2, y + 6, '#d8b0ff', 2, 5, 0.25 + 0.35 * Math.abs(Math.sin(t * 2.3 + x)));
      for (let i = 0; i < 9; i++) { const q = loop(t, i, 9, 0.03); p(100 + q * 400 - 30, 86 + (i % 3) * 3, '#b8a8d0', 26 + (i % 3) * 8, 2, 0.12 * bump(q)); }
      break; }
    case 'light': {
      for (let i = 0; i < 4; i++) { const a = 0.08 + 0.06 * Math.sin(t * 0.7 + i * 1.5); for (let y = 0; y < 92; y += 2) p(330 + i * 34 - y * 0.9, y, '#fff7db', 10, 2, a); }
      for (let i = 0; i < 16; i++) { const q = loop(t, i, 16, 0.09); p(110 + hash(i, 91) * 370 + Math.sin(q * 7 + i) * 5, 100 - q * 96, '#fff3a0', 1, 1, bump(q)); }
      if ((t * 0.4) % 1 < 0.1) star(216, 57, '#ffffff', 2);
      break; }
    case 'void': {
      for (let i = 0; i < 26; i++) { const x = hash(i, 101) * W, y = hash(i, 102) * 88; p(x, y, '#e8dcff', 1, 1, 0.25 + 0.6 * Math.max(0, Math.sin(t * (1 + hash(i, 103) * 2) + i))); }
      for (let i = 0; i < 18; i++) { const a = t * 0.9 + i * TAU / 18; const r = 15 + 3 * Math.sin(i * 2.3 + t); p(243 + Math.cos(a) * r, 37 + Math.sin(a) * r * 0.9, i % 3 ? '#89709e' : '#c8a8ff'); }
      for (let i = 0; i < 6; i++) { const q = loop(t, i, 6, 0.25), a = i * 1.1 + q * 4, r = 40 * (1 - q); p(243 + Math.cos(a) * r, 37 + Math.sin(a) * r * 0.7, '#b098ee', 1, 1, q); }
      break; }
    case 'salty': {
      for (let x = 112; x < 332; x++) { const f = Math.sin(x * 0.31 + t * 2) + Math.sin(x * 0.13 - t * 1.3); if (f > 1.55) p(x, 88 + ((x * 7) % 5), '#ffffff', 1, 1, 0.8); }
      for (const [x, y] of [[144, 82], [214, 74], [293, 84]]) { const q = (t * 0.6 + x * 0.013) % 1; if (q < 0.4) for (let i = 0; i < 3; i++) p(x - 12 - i * 3, 93 - bump(q / 0.4) * (3 + i), '#ffffff', 1, 1, 0.8); }
      break; }
    case 'sweet': {
      const cols = ['#ff8ad8', '#7cf0ff', '#ffe066', '#ffffff', '#a0f07a'];
      for (let i = 0; i < 28; i++) { const q = loop(t, i, 28, 0.06); p(hash(i, 111) * W + Math.sin(q * 6 + i) * 4, -4 + q * (H + 8), cols[i % 5], i % 2 ? 2 : 1, i % 2 ? 1 : 2, 0.85); }
      [[139, 81], [225, 68], [294, 83]].forEach(([x, y], i) => { if ((t * 0.7 + i * 0.37) % 1 < 0.12) star(x - 2, y - 12, '#ffffff', 1); });
      break; }
    case 'meat': {
      for (const [x, y] of [[154, 56], [233, 49], [300, 58]]) for (let i = 0; i < 4; i++) { const q = loop(t, i + x, 4, 0.16), r = 1 + Math.round(q * 4); p(x + Math.sin(q * 5 + i) * 3 + q * 8 - r / 2, y - q * 34, '#c8b0a0', r + 1, r, 0.55 * (1 - q)); }
      for (let i = 0; i < 6; i++) if (Math.floor(t * 9 + i * 5) % 7 === 0) p(130 + hash(i, 121) * 190, 88 + hash(i, 122) * 6, '#ffe0a0');
      break; }
    case 'treat': {
      const cx = 236, cy = 66, a0 = t * 1.4; for (let b = 0; b < 4; b++) { const a = a0 + b * Math.PI / 2; for (let r = 2; r < 11; r++) p(cx + Math.cos(a) * r, cy + Math.sin(a) * r, r > 6 ? '#f0e6c8' : '#b8ac89', r > 6 ? 2 : 1, 1); }
      p(cx - 1, cy - 1, '#907d58', 3, 3);
      for (let i = 0; i < 10; i++) { const q = loop(t, i, 10, 0.08); p(100 + q * 400 + Math.sin(q * 9 + i) * 3, 40 + hash(i, 131) * 50 + Math.sin(q * 12) * 4, '#fff1c0', 1, 1, bump(q)); }
      break; }
    default: {
      for (let i = 0; i < 5; i++) { const a = t * 0.8 + i * 1.9, x = 220 + hash(i, 141) * 240 + Math.sin(a) * 10, y = 110 + hash(i, 142) * 140 + Math.sin(a * 2.1) * 4, w = Math.floor(t * 10 + i) % 2;
        const c = ['#ff7aa8', '#ffd84a', '#ffffff', '#a98aff', '#7cf0ff'][i]; p(x - 1, y - w, c); p(x + 1, y - w, c); p(x, y, '#3a3450'); }
    }
  }
  g.restore();
}

// ----- the castle -----
// Measure each built castle once: its spire tips (top silhouette peaks) and its brightest pixels,
// which slowly shimmer so the painted highlights breathe.
const CASTLE_ALIVE = new WeakMap();
function castleAnatomy(cv) {
  let A = CASTLE_ALIVE.get(cv); if (A) return A;
  const w = cv.width, h = cv.height, d = cv.getContext('2d').getImageData(0, 0, w, h).data, top = new Array(w).fill(h), lit = [];
  let bottom = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; if (d[i + 3] < 128) continue; if (top[x] === h) top[x] = y; bottom = Math.max(bottom, y);
    const l = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11; if (l > 200) lit.push([x, y, rgbToHex(Math.min(255, d[i] + 40), Math.min(255, d[i + 1] + 40), Math.min(255, d[i + 2] + 40))]); }
  const tips = [];
  for (let x = 3; x < w - 3; x++) { if (top[x] >= h - 20) continue; let peak = true; for (let o = -4; o <= 4; o++) if (o && x + o >= 0 && x + o < w && top[x + o] < top[x]) peak = false;
    if (peak && !tips.some(q => Math.abs(q[0] - x) < 12)) tips.push([x, top[x]]); }
  tips.sort((a, b) => a[1] - b[1]);
  const pick = lit.length > 360 ? lit.filter((_, i) => hash(i, 7) < 360 / lit.length) : lit;
  A = { tips: tips.slice(0, 3), lit: pick, top, bottom }; CASTLE_ALIVE.set(cv, A); return A;
}
function drawCastleAlive(g, run, t, cv) {
  const el = run.castleEl; if (!cv) return;
  const A = castleAnatomy(cv), { p, bolt, bat, bird, star } = alivePainter(g), E = ELEMENTS[el], tips = A.tips;
  g.save();
  // a slow wave of light rolls up through the brightest stones
  for (const [x, y, c] of A.lit) { const a = Math.sin(t * 1.6 - y * 0.06 + x * 0.03); if (a > 0.6) p(x, y, c, 1, 1, (a - 0.6) * 1.2); }
  // and now and then one of them twinkles
  for (let i = 0; i < 2 && A.lit.length; i++) { const b = Math.floor(t * 3 + i * 0.5), q = (t * 3 + i * 0.5) % 1, L = A.lit[Math.floor(hash(b, i + 3) * A.lit.length)]; if (q < 0.5) star(L[0], L[1], '#ffffff', 1, bump(q * 2)); }
  if (!el) { g.restore(); return; }
  const base = Math.min(H - 4, A.bottom);
  switch (el) {
    case 'fire': case 'meat': {
      for (const [x, y] of tips.slice(0, 2)) for (let i = 0; i < 5; i++) { const q = loop(t, i + x, 5, 0.2), r = 1 + Math.round(q * 4);
        p(x + Math.sin(q * 6 + i) * 2 + q * 7 - r / 2, y - 2 - q * 26, el === 'fire' ? (q < 0.25 ? '#ff8a3a' : '#8a7078') : '#c8b0a0', r + 1, r, 0.6 * (1 - q)); }
      if (el === 'fire') for (let i = 0; i < 8; i++) { const q = loop(t, i, 8, 0.3); p(8 + hash(i, 151) * 90 + Math.sin(q * 8) * 3, 200 - q * 160, '#ffd23a', 1, 1, bump(q)); }
      break; }
    case 'water': {
      for (let i = 0; i < 6; i++) { const q = loop(t, i, 6, 0.45), x = 6 + hash(i, 161) * 92, y0 = A.top[Math.round(x)] + 6; if (y0 >= H) continue; p(x, y0 + q * (base - y0), '#bff4ff', 1, 2, 0.8); }
      for (let i = 0; i < 2; i++) { const q = loop(t, i, 2, 0.4); const rx = 4 + q * 14; for (let j = 0; j < 12; j++) { const a = j / 12 * TAU; p(50 + Math.cos(a) * rx, base + 2 + Math.sin(a) * rx * 0.25, '#bff4ff', 1, 1, 0.5 * (1 - q)); } }
      break; }
    case 'ice': {
      tips.forEach(([x, y], i) => { const f = (t * 0.6 + i * 0.31) % 1; if (f < 0.15) star(x, y + 1, '#ffffff', f < 0.07 ? 2 : 1); });
      for (let i = 0; i < 10; i++) { const q = loop(t, i, 10, 0.12); p(hash(i, 171) * 108 + Math.sin(q * 7 + i) * 4, q * base, '#ffffff', 1, 1, 0.8); }
      break; }
    case 'lightning': {
      const c = t % 3.2; if (tips.length > 1 && c < 0.3) { const [a, b] = tips, f = Math.floor(c * 24) % 2; bolt(a[0], a[1] - 1, b[0], b[1] - 1, f ? '#ffffff' : '#9ff6ff', Math.floor(t * 12)); }
      tips.forEach(([x, y], i) => { if (Math.floor(t * 8 + i * 5) % 6 === 0) { p(x, y - 2, '#9ff6ff'); p(x + (i % 2 ? 1 : -1), y - 3, '#ffffff'); } });
      break; }
    case 'nature': {
      for (let i = 0; i < 7; i++) { const q = loop(t, i, 7, 0.1), x = 6 + hash(i, 181) * 96, y0 = A.top[Math.round(x)]; if (y0 >= H) continue; p(x + Math.sin(q * 9 + i) * 4, y0 + q * 70, i % 2 ? '#7bd36a' : '#ffd84a', 2, 1, bump(q) * 1.4); }
      if (tips[0]) for (let i = 0; i < 2; i++) { const a = t * 0.9 + i * Math.PI; bird(tips[0][0] + Math.cos(a) * 16, tips[0][1] - 10 + Math.sin(a) * 4, Math.floor(t * 6 + i) % 2, '#3a3450'); }
      break; }
    case 'dark': {
      if (tips[0]) { const [x, y] = tips[0]; p(x - 7, y - 4, '#c8a0ff', 15, 12, 0.08 + 0.06 * Math.sin(t * 2)); for (let i = 0; i < 3; i++) { const a = t * 1.3 + i * TAU / 3; bat(x + Math.cos(a) * 18, y + 4 + Math.sin(a) * 6, Math.floor(t * 9 + i) % 2); } }
      for (let i = 0; i < 5; i++) { const q = loop(t, i, 5, 0.05); p(-20 + q * 140, base - 4 - (i % 2) * 4, '#b8a8d0', 30, 2, 0.15 * bump(q)); }
      break; }
    case 'light': {
      if (tips[0]) { const [x, y] = tips[0]; for (let r = 0; r < 4; r++) { const a = t * 0.5 + r * Math.PI / 2; for (let s = 3; s < 16; s++) p(x + Math.cos(a) * s, y - 2 + Math.sin(a) * s * 0.7, '#fff7db', 1, 1, 0.35 * (1 - s / 16)); } star(x, y - 2, '#ffffff', 1); }
      for (let i = 0; i < 6; i++) { const q = loop(t, i, 6, 0.14); p(10 + hash(i, 191) * 90, 150 - q * 130, '#fff3a0', 1, 1, bump(q)); }
      break; }
    case 'void': {
      if (tips[0]) { const [x, y] = tips[0]; for (let i = 0; i < 5; i++) { const a = t * 1.6 + i * TAU / 5; p(x + Math.cos(a) * 9, y + 2 + Math.sin(a) * 3, i % 2 ? '#9a8aff' : '#5a3aff'); } p(x - 1, y - 1, '#9a8aff', 3, 3, 0.3 + 0.3 * Math.sin(t * 3)); }
      for (let i = 0; i < 6; i++) { const q = loop(t, i, 6, 0.1); p(6 + hash(i, 201) * 96, 210 - q * 140 + Math.sin(q * 6) * 2, '#c8a8ff', 1, 1, bump(q) * 0.8); }
      break; }
    case 'salty': {
      for (let i = 0; i < 2; i++) { const a = t * 0.7 + i * 2.5, cx = (tips[0] || [50, 40])[0]; bird(cx + Math.cos(a) * 26, 22 + Math.sin(a * 1.3) * 6, Math.floor(t * 5 + i) % 2, '#ffffff'); }
      for (let i = 0; i < 6; i++) { const q = loop(t, i, 6, 0.5); p(10 + hash(i, 211) * 90, base - bump(q) * 6, '#ffffff', 1, 1, 0.7 * (1 - q)); }
      break; }
    case 'sweet': {
      const cols = ['#ff8ad8', '#7cf0ff', '#ffe066'];
      tips.forEach(([x, y], i) => { const q = loop(t, i, 3, 0.35); p(x + Math.sin(q * 6) * 3, y - 3 - q * 14, cols[i % 3], 1, 1, 1 - q); p(x + Math.sin(q * 6) * 3 - 1, y - 3 - q * 14, cols[i % 3], 1, 1, (1 - q) * 0.6); });
      for (let i = 0; i < 6; i++) { const q = loop(t, i, 6, 0.12); p(hash(i, 221) * 100, q * base, cols[i % 3], 1, 2, 0.8); }
      break; }
    case 'treat': {
      for (const [x, y] of tips) for (let i = 0; i < 2; i++) { const q = loop(t, i + x, 2, 0.3); p(x + Math.sin(q * 8 + i * 3) * 2, y - 2 - q * 14, '#ffffff', 1, 2, 0.6 * (1 - q)); }
      break; }
  }
  if (E && tips[0] && Math.floor(t * 2) % 7 === 0) star(tips[0][0], tips[0][1] - 1, E.col, 1, 0.8);
  g.restore();
}
