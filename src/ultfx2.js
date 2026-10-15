// ===== Ultimate kit visuals: draws the zones ultkit.js makes (drop, line, field, sky, sweep, bounce and friends) =====
// Original pixel-block art drawn on the hi-res pass; ground layers go under the units. z.rar 0..5 adds size, glow and sparkle; God palettes are gold.
const UP = {
  gold: ['#ffffff', '#fff3a0', '#ffd84a', '#a8701a'], holy: ['#ffffff', '#fff3c0', '#ffe066', '#6c7fb8'], nature: ['#ffffff', '#d9f59b', '#7bd36a', '#2a6a3a'],
  night: ['#ffffff', '#c8d0ff', '#6a6ad8', '#1a1a4a'], storm: ['#ffffff', '#e8f6ff', '#9fd8ff', '#3a4aa8'], earth: ['#fff0d0', '#c9a35a', '#8a6a3a', '#3a2a1a'],
  soul: ['#ffffff', '#d0ffd0', '#9dff6a', '#3a2a5a'], rose: ['#ffffff', '#ffb0d8', '#ff3d6e', '#4a0a2a'], blood: ['#ffd0d0', '#ff5a5a', '#c0203a', '#4a0a1a'],
  fire: ['#ffffff', '#ffd23a', '#ff8a2a', '#8a1a2a'], arcane: ['#ffffff', '#bff4ff', '#5fd3ff', '#2a5a8a'], blossom: ['#ffffff', '#ffd0e8', '#ff9fd0', '#8a3a5a'],
  spirit: ['#ffffff', '#e0fbff', '#9ff6ff', '#3a6a8a'], brass: ['#fff3c0', '#ffcf3a', '#c9883a', '#4a2a1a'], tomb: ['#ffffff', '#bff4ff', '#5fd3ff', '#2a3a5a'],
  toxic: ['#f0ffd0', '#c8ff6a', '#7ad43a', '#2a3a1a'], steel: ['#ffffff', '#e8eefc', '#a8b0c8', '#3a3a4e'], shadow: ['#ffffff', '#d8c0ff', '#8a5aff', '#1a1030'],
  bog: ['#e8f0c0', '#a8b860', '#6a7a3a', '#2a2a14'], sky: ['#ffffff', '#fff3d0', '#c98a4a', '#4a2a1a'], bone: ['#ffffff', '#f1ecdc', '#c8b898', '#4a3a2a'],
  lily: ['#ffffff', '#ffb0d8', '#7ad46a', '#2a5a2a'], iron: ['#ffffff', '#a8a8c0', '#5a5a6e', '#1a1a2a'], frost: ['#ffffff', '#e6fbff', '#9ff6ff', '#3a8aa8'],
  glass: ['#ffffff', '#ffe8a0', '#ff9fd0', '#5a4ab0'], sea: ['#ffffff', '#bff4ff', '#5fd3ff', '#1a4a8a'], star: ['#ffffff', '#fff3a0', '#b8a8ff', '#3a2a8a'],
};
const upal = p => UP[p] || UP.gold;
const uFade = (z, f = 0.3) => z.t > z.dur - f ? Math.max(0, (z.dur - z.t) / f) : 1;

Object.assign(FX, {
  ultLand(x, y, r, shape, rar = 0, pal) { const P = upal(pal), big = 1 + 0.15 * rar;
    switch (shape) {
      case 'moonCrater': FX.blast(x, y, r * 0.75, ['#ffffff', '#e8ecff', '#c8d0ff', '#4a4a8a'], 1 + 0.12 * rar, { shards: 12 }); FXS.decals.push({ kind: 'crater', x, y, r: r * 0.45, t: 0, life: 2.5, cool: true }); FX.shake(8 + rar); FX.flash('#e8ecff', 0.2); return;
      case 'meteorCrater': case 'blastFire': FX.blast(x, y, r * 0.6, P, 1 + 0.12 * rar, { shards: 14 + 2 * rar }); FX.fireburst(x, y, r * 0.5, 1 + 0.12 * rar); if (shape === 'meteorCrater') FXS.decals.push({ kind: 'crater', x, y, r: r * 0.45, t: 0, life: 3 + rar }); FX.shake(8 + rar); return;
      case 'blastBlood': FX.blast(x, y, r * 0.75, P, 1 + 0.12 * rar, { shards: 12 }); FX.particles(x, y - 4, 24, [P[1], P[2]], { spread: r, up: true, grav: 120 }); FX.shake(7 + rar); return;
      case 'supernova': FX.blast(x, y, r * 0.6, P, 1.6 + 0.15 * rar, { shards: 24 }); FX.shockwave(x, y, r * 2, P[1]); FX.shockwave(x, y, r * 2.6, P[2]); FX.flash('#ffffff', 0.45); FX.shake(12); FX.hitstop(0.08); return;
      case 'splat': FX.particles(x, y - 4, 16, [P[1], P[2], '#ffffff'], { spread: 14 }); return;
    }
    const small = r < 24, heavy = ['bell', 'anvil', 'sarcophagus', 'shield', 'cauldron', 'drum'].includes(shape);
    FX.blast(x, y, r * (small ? 0.6 : 0.7), P, (small ? 0.7 : 1) + 0.1 * rar, { shards: small ? 4 : 10 + 2 * rar });
    if (heavy) { FX.shockwave(x, y, r * 1.3, P[1]); FXS.decals.push({ kind: 'crack', x, y, r: r * 0.8, t: 0, life: 1.6 }); FX.particles(x, y, 16 + 3 * rar, ['#c9b48a', '#8a6a4a', P[2]], { spread: r * 0.7 }); FX.shake(7 + 1.5 * rar); FX.hitstop(0.05); if (rar >= 3) FX.flash(P[1], 0.12); }
    else if (!small) FX.shake(4 + rar);
    if (shape === 'star' || shape === 'shard') { FX.shockwave(x, y, r * big, P[1]); FX.particles(x, y - 6, 8, [P[0], P[1]], { spread: 10, up: true }); }
    if (shape === 'frog' || shape === 'lilybomb') FX.particles(x, y - 4, 10, ['#ffffff', '#bff4ff', '#5fd3ff'], { spread: 12, up: true });
    if (shape === 'tree' || shape === 'oak') { for (let i = 0; i < 20 + 5 * rar; i++) { const a = rand(0, Math.PI * 2), sp = rand(30, 80); FXS.spells.push({ kind: 'petal', x, y: y - 30, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6 - 20, rot: rand(0, 6), col: pick([P[0], P[1], P[2]]), t: 0, life: rand(0.8, 1.4) }); } }
  },
  ultShock(x, y, r, rar = 0, pal) { const P = upal(pal); FX.shockwave(x, y, r, P[1]); FX.shockwave(x, y, r * 0.7, P[2]); FX.particles(x, y, 10 + 2 * rar, [P[1], P[2]], { spread: r * 0.6 }); FX.shake(3 + rar * 0.5); },
  ultSpark(x, y, kind, rar = 0, pal) { const P = upal(pal);
    if (kind === 'dust') FX.particles(x, y, 4, ['#c9b48a', '#8a6a4a'], { spread: 8, up: true });
    else if (kind === 'splash') FX.particles(x, y, 8, ['#ffffff', '#bff4ff', '#5fd3ff'], { spread: 10, up: true });
    else if (kind === 'snow') FX.particles(x, y, 4, ['#ffffff', '#e6fbff'], { spread: 10, up: true });
    else if (kind === 'root') { FX.spikes(x - 4, y, '#7a5a2a', 0); FX.spikes(x + 4, y, P[2], 0.05); }
    else if (kind === 'chomp') { FX.particles(x, y, 12, [P[1], P[2], '#ffffff'], { spread: 14, up: true }); FX.shake(3); }
    else FX.particles(x, y, 8 + 2 * rar, [P[0], P[1], P[2]], { spread: 8 }); },
});

// ----- ground layer -----
function drawUltGround2(g, z) {
  const x = Math.round(z.x), y = Math.round(z.y), P = upal(z.pal), fade = uFade(z);
  if (z.vis === 'sky') { const a = z.t < 0.3 ? z.t / 0.3 : fade, tint = { night: ['#0a0a30', 0.5], eclipse: ['#05020f', 0.55], bloodmoon: ['#3a0010', 0.35], sun: ['#ffb040', 0.14], storm: ['#1a2040', 0.3], raincloud: ['#203050', 0.3], moon: ['#101840', 0.3] }[z.kind];
    if (tint) { g.globalAlpha = tint[1] * a; g.fillStyle = tint[0]; g.fillRect(0, 0, W, H); } return; }
  if (z.vis === 'drop') { if (!z.landed && !z.rise) { const f = Math.min(1, z.t / z.fall); g.globalAlpha = 0.15 + 0.35 * f; g.fillStyle = '#1a1028'; g.beginPath(); g.ellipse(x, y + 1, z.r * 0.6 * f + 2, z.r * 0.22 * f + 1, 0, 0, Math.PI * 2); g.fill(); }
    else if (z.landed && !z.small) { g.globalAlpha = 0.3 * fade; g.fillStyle = '#1a1028'; g.beginPath(); g.ellipse(x, y + 1, z.r * 0.5, z.r * 0.18, 0, 0, Math.PI * 2); g.fill(); } return; }
  if (z.vis === 'field') { const up = Math.min(1, z.t / 0.3);
    if (z.style === 'bog' || z.style === 'blood') { g.globalAlpha = 0.3 * fade; g.fillStyle = P[3]; g.beginPath(); g.ellipse(x, y, z.r * up, z.r * 0.45 * up, 0, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 0.3 * fade; g.fillStyle = P[2]; g.beginPath(); g.ellipse(x, y, z.r * 0.8 * up, z.r * 0.34 * up, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = P[1]; for (let i = 0; i < 10 + z.rar; i++) { const an = i * 2.4 + FXS.clock * 0.6, d = z.r * 0.7 * ((i * 0.37) % 1); g.fillRect(Math.round(x + Math.cos(an) * d), Math.round(y + Math.sin(an) * d * 0.42), 2, 1); } }
    else if (z.style === 'storm') { g.globalAlpha = 0.18 * fade; g.fillStyle = '#1a2040'; g.beginPath(); g.ellipse(x, y, z.r * up, z.r * 0.45 * up, 0, 0, Math.PI * 2); g.fill(); }
    else if (z.style === 'burnline') { for (const p of z.pts) { g.globalAlpha = 0.6 * fade; g.fillStyle = P[3]; g.fillRect(Math.round(p[0]) - 7, Math.round(p[1]) - 1, 14, 3); g.fillStyle = Math.random() < 0.5 ? P[2] : P[1]; g.fillRect(Math.round(p[0] + rand(-6, 6)), Math.round(p[1]), 2, 1); } }
    else if (z.style === 'fissure') { g.globalAlpha = 0.85 * fade; for (const [cx, cy] of z.cracks) { for (let j = 4; j < z.r; j += 2) { const wob = Math.sin(j * 0.5) * 2; g.fillStyle = '#2a1010'; g.fillRect(Math.round(x + cx * j + wob * cy), Math.round(y + cy * j), 2, 2); g.fillStyle = (j + Math.floor(FXS.clock * 10)) % 6 < 3 ? P[1] : P[2]; g.fillRect(Math.round(x + cx * j + wob * cy), Math.round(y + cy * j), 1, 1); } } }
    g.globalAlpha = 1; return; }
  if (z.vis === 'cathedral') { const up = Math.min(1, z.t / 0.4); g.globalAlpha = 0.22 * fade; g.fillStyle = P[1]; g.beginPath(); g.ellipse(x, y, z.r * up, z.r * 0.5 * up, 0, 0, Math.PI * 2); g.fill();
    g.globalAlpha = 0.5 * fade; g.fillStyle = P[2]; for (let i = 0; i < 12; i++) { const an = i / 12 * Math.PI * 2; for (let j = 4; j < z.r * up; j += 3) g.fillRect(Math.round(x + Math.cos(an) * j), Math.round(y + Math.sin(an) * j * 0.5), 1, 1); } g.globalAlpha = 1; return; }
  if (z.vis === 'wall') { const up = Math.min(1, z.t / 0.35); g.globalAlpha = 0.45 * fade; g.fillStyle = P[3]; g.fillRect(Math.round(z.x) - 3, GRID.y - 4, z.w + 6, GRID.rows * GRID.cell + 8); g.globalAlpha = 1; return; }
  if (z.vis === 'sweep' && z.cy != null) { g.globalAlpha = 0.25 * fade; g.fillStyle = '#0a0a14'; g.fillRect(CASTLE_X, Math.round(z.cy) - 2, W - CASTLE_X, 4); g.globalAlpha = 1; }
}

// ----- tall layer -----
function drawUltVFX2(ctx, z, X, Y, k) {
  const P = upal(z.pal), fade = uFade(z), x = X(z.x || 0), y = Y(z.y || 0);
  switch (z.vis) {
    case 'drop': return drawDrop(ctx, z, x, y, k, P, fade);
    case 'line': return drawLineThing(ctx, z, X, Y, k, P);
    case 'cyclone': return drawCyclone(ctx, z, x, y, k, P, fade);
    case 'tongue': { const ox = X(z.ox), oy = Y(z.oy), back = z.t > z.dur - 0.25 ? (z.dur - z.t) / 0.25 : 1, tx = ox + (x - ox) * back, ty = oy + (y - oy) * back, w = (3 + 0.4 * z.rar) * k;
      for (const [lw, c] of [[w * 2 + 2 * k, OUTLINE], [w * 2, P[2]], [w * 0.7, P[1]]]) { ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.quadraticCurveTo((ox + tx) / 2, Math.min(oy, ty) - 18 * k * Math.sin(back * Math.PI), tx, ty); ctx.stroke(); }
      ctx.fillStyle = P[2]; ctx.beginPath(); ctx.arc(tx, ty, w * 1.6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = P[1]; ctx.beginPath(); ctx.arc(tx - k, ty - k, w * 0.7, 0, Math.PI * 2); ctx.fill(); return; }
    case 'bounce': return drawSaw(ctx, x, y, k * (z.size || 1), P, z.spin);
    case 'sweep': return drawSweep(ctx, z, X, Y, k, P, fade);
    case 'sky': return drawSkyBody(ctx, z, X, Y, k);
    case 'field': return drawFieldTall(ctx, z, X, Y, k, P, fade);
    case 'moonbeam': return drawMoonbeam(ctx, z, X, Y, k, P);
    case 'sunbeam': { const sx = X(z.sx), sy = Y(z.sy), ex = X(z.ex), ey = Y(z.ey), gold = z.rar >= 5;
      if (!z.fired) { const g0 = Math.min(1, z.t / 0.45); ctx.globalAlpha = 0.9; glowAt(ctx, sx + 6 * k, sy, (6 + 14 * g0 + z.rar * 2) * k, gold ? '#ffd84a' : '#ffe066'); for (let i = 0; i < 6; i++) { const a = FXS.clock * 4 + i; ctx.strokeStyle = '#fff3b0'; ctx.lineWidth = k; ctx.beginPath(); ctx.moveTo(sx + 6 * k + Math.cos(a) * 30 * k * (1 - g0), sy + Math.sin(a) * 30 * k * (1 - g0)); ctx.lineTo(sx + 6 * k, sy); ctx.stroke(); } ctx.globalAlpha = 1; return; }
      const f = Math.max(0, 1 - (z.t - 0.45) / 0.5), w = z.w * k * (0.6 + f);
      for (const [lw, c, a] of [[w * 2.4, gold ? '#ffd84a' : '#ffb03a', 0.3], [w * 1.3, '#ffe066', 0.7], [w * 0.6, '#ffffff', 1]]) { ctx.globalAlpha = a * f; ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke(); }
      ctx.globalAlpha = f; glowAt(ctx, sx + 4 * k, sy, 22 * k, '#fff3b0'); ctx.globalAlpha = 1; return; }
    case 'beat': { if (z.t < z.start) return; const bx = X(z.x), a = Math.max(0, 1 - (z.t - z.start) / 1.6); ctx.globalAlpha = 0.5 * a; ctx.strokeStyle = P[1]; ctx.lineWidth = 3 * k; ctx.beginPath(); ctx.ellipse(bx, Y(GRID.y + GRID.rows * GRID.cell / 2), 10 * k, GRID.rows * GRID.cell * 0.55 * k, 0, -1.2, 1.2); ctx.stroke(); ctx.strokeStyle = P[2]; ctx.lineWidth = k; ctx.beginPath(); ctx.ellipse(bx - 4 * k, Y(GRID.y + GRID.rows * GRID.cell / 2), 10 * k, GRID.rows * GRID.cell * 0.5 * k, 0, -1.2, 1.2); ctx.stroke(); ctx.globalAlpha = 1; return; }
    case 'pounceCat': { if (z.t < z.delay) return; const p = Math.min(1, (z.t - z.delay) / (z.dur - z.delay)), cx = X(z.sx + (z.x - z.sx) * p), cy = Y(z.sy + (z.y - z.sy) * p) - Math.sin(p * Math.PI) * 26 * k - 6 * k; drawCat(ctx, cx, cy, k * (1 + 0.06 * z.rar), P, z.x > z.sx ? 1 : -1, p); return; }
    case 'skyArrow': { const p = Math.min(1, z.t / z.dur), ax = x + p * 20 * k, ay = y - p * 160 * k; ctx.globalAlpha = 1 - p * 0.5; ctx.strokeStyle = '#fff3a0'; ctx.lineWidth = 2 * k; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax - 4 * k, ay + 18 * k); ctx.stroke(); glowAt(ctx, ax, ay, 10 * k, '#ffd84a'); ctx.globalAlpha = 1; return; }
    case 'tsunami': return drawTsunami(ctx, z, X, Y, k);
    case 'wall': return drawCoralWall(ctx, z, X, Y, k, P, fade);
    case 'cathedral': return drawCathedral(ctx, z, x, y, k, P, fade);
  }
}

// a chunky outlined block in shape units (s = pixels per unit)
function ublk(ctx, s, bx, by, bw, bh, c1, c2) { ctx.fillStyle = OUTLINE; ctx.fillRect((bx - 0.6) * s, (by - 0.6) * s, (bw + 1.2) * s, (bh + 1.2) * s); ctx.fillStyle = c1; ctx.fillRect(bx * s, by * s, bw * s, bh * s); if (c2) { ctx.fillStyle = c2; ctx.fillRect(bx * s, by * s, bw * s, Math.max(0.6, bh * 0.25) * s); } }
function upoly(ctx, s, pts, c, outline = true) { if (outline) { ctx.fillStyle = OUTLINE; ctx.beginPath(); const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length; pts.forEach(([a, b], i) => { const dx = a - cx, dy = b - cy, L = Math.hypot(dx, dy) || 1, ex = a + dx / L * 0.9, ey = b + dy / L * 0.9; i ? ctx.lineTo(ex * s, ey * s) : ctx.moveTo(ex * s, ey * s); }); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle = c; ctx.beginPath(); pts.forEach(([a, b], i) => i ? ctx.lineTo(a * s, b * s) : ctx.moveTo(a * s, b * s)); ctx.closePath(); ctx.fill(); }
function ucirc(ctx, s, cx, cy, r, c, outline = true) { if (outline) { ctx.fillStyle = OUTLINE; ctx.beginPath(); ctx.arc(cx * s, cy * s, (r + 0.9) * s, 0, Math.PI * 2); ctx.fill(); } ctx.fillStyle = c; ctx.beginPath(); ctx.arc(cx * s, cy * s, r * s, 0, Math.PI * 2); ctx.fill(); }

function drawDrop(ctx, z, x, y, k, P, fade) {
  const s = k * (z.size || 1) * (z.small ? 0.8 : 1.15), r = z.rar;
  let off = 0, sq = 1, up = 1;
  if (!z.landed) { const p = Math.min(1, z.t / z.fall); if (z.rise) up = 0; else off = Math.pow(1 - p, 2) * (z.small ? 110 : 190) * k; if (z.rise) { up = 0; } }
  else { const lt = z.t - z.landT; if (z.rise) up = Math.min(1, lt / 0.18) * (lt < 0.25 ? 1 + 0.15 * Math.sin(lt / 0.25 * Math.PI) : 1); else if (lt < 0.15) sq = 1 - 0.18 * Math.sin(lt / 0.15 * Math.PI); }
  if (z.rise && !z.landed) { // a rumble where it will burst up
    if (Math.random() < 0.6) FXS.parts.push({ x: z.x + rand(-z.r, z.r) * 0.4, y: z.y + rand(-3, 3), vx: 0, vy: -rand(10, 30), life: 0.3, t: 0, color: pick(['#c9b48a', '#8a6a4a', P[2]]), size: 1, grav: 60 }); return; }
  if (!z.landed && z.follow && (z.shape === 'reap' || z.shape === 'crescent' || z.shape === 'leaf')) { drawMark(ctx, z, x, y - 26 * k, k, P); return; }
  const tilt = z.shape === 'bell' && z.tolls ? Math.sin((z.t - z.landT) * 9) * 0.12 * Math.max(0, 1 - ((z.t - z.landT) % 0.55) * 2) : 0;
  ctx.save(); ctx.globalAlpha = fade; ctx.translate(x, y - off); ctx.scale(1, sq * up); ctx.rotate(tilt);
  if (r >= 3 && !z.small) { ctx.save(); ctx.globalAlpha = fade * (0.25 + 0.05 * r); glowAt(ctx, 0, -14 * s, (16 + 3 * r) * s, r >= 5 ? '#ffd84a' : rarCol(r)); ctx.restore(); }
  SHAPES[z.shape] && SHAPES[z.shape](ctx, s, P, z, r);
  ctx.restore();
  if (r >= 4 && !z.small && Math.random() < 0.4) FXS.parts.push({ x: z.x + rand(-12, 12) * (z.size || 1), y: z.y - rand(4, 30), vx: rand(-6, 6), vy: -rand(10, 30), life: rand(0.3, 0.6), t: 0, color: pick([P[0], P[1]]), size: 1, grav: -10 });
}
// a glyph hovering over a marked foe until its strike lands
function drawMark(ctx, z, x, y, k, P) { const p = Math.min(1, z.t / z.fall), s = k * (0.8 + 0.4 * p); ctx.save(); ctx.translate(x, y + Math.sin(FXS.clock * 6) * k); ctx.globalAlpha = 0.5 + 0.5 * p;
  if (z.shape === 'leaf') { ctx.rotate(FXS.clock * 8); upoly(ctx, s, [[0, -4], [2, 0], [0, 4], [-2, 0]], P[2]); }
  else if (z.shape === 'reap') { for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + FXS.clock; ucirc(ctx, s, Math.cos(a) * 2.2, Math.sin(a) * 2.2, 1.6, P[2], false); } ucirc(ctx, s, 0, 0, 1.4, P[1], false); }
  else { ctx.fillStyle = P[1]; ctx.beginPath(); ctx.arc(0, 0, 4 * s, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#05020f'; ctx.beginPath(); ctx.arc(1.4 * s, -0.8 * s, 3.6 * s, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore(); }

const SHAPES = {
  shield(ctx, s, P) { upoly(ctx, s, [[-11, -30], [11, -30], [11, -14], [0, 0], [-11, -14]], P[2]); upoly(ctx, s, [[-8, -27], [8, -27], [8, -15], [0, -4], [-8, -15]], P[3], false);
    upoly(ctx, s, [[0, -24], [2, -18], [7, -18], [3, -14], [5, -8], [0, -12], [-5, -8], [-3, -14], [-7, -18], [-2, -18]], P[1], false); ctx.fillStyle = P[0]; ctx.fillRect(-10 * s, -29 * s, 20 * s, 1.2 * s); },
  bell(ctx, s, P) { ublk(ctx, s, -2, -32, 4, 4, P[2]); upoly(ctx, s, [[-6, -28], [6, -28], [9, -16], [13, -4], [-13, -4], [-9, -16]], P[2]); upoly(ctx, s, [[-4, -26], [-1, -26], [-4, -8], [-9, -8]], P[1], false);
    ublk(ctx, s, -14, -5, 28, 3, P[3], P[2]); ucirc(ctx, s, 0, -1, 2.4, P[3]); ctx.fillStyle = P[0]; ctx.fillRect(-12 * s, -10 * s, 24 * s, 0.8 * s); },
  sarcophagus(ctx, s, P, z) { upoly(ctx, s, [[-7, -34], [7, -34], [10, -24], [8, 0], [-8, 0], [-10, -24]], '#5a6a8a'); upoly(ctx, s, [[-5, -31], [5, -31], [7, -24], [6, -2], [-6, -2], [-7, -24]], '#8a9ab8', false);
    ucirc(ctx, s, 0, -26, 4, z.rar >= 5 ? '#ffd84a' : '#ffcf3a'); ctx.fillStyle = OUTLINE; ctx.fillRect(-2 * s, -27 * s, 1.2 * s, 1.2 * s); ctx.fillRect(1 * s, -27 * s, 1.2 * s, 1.2 * s); ctx.fillStyle = P[2]; ctx.fillRect(-4 * s, -18 * s, 8 * s, 1.5 * s); ctx.fillRect(-1 * s, -21 * s, 2 * s, 14 * s);
    if (z.landed) { ctx.globalAlpha *= 0.5 + 0.3 * Math.sin(FXS.clock * 5); glowAt(ctx, 0, -18 * s, 16 * s, P[2]); } },
  cauldron(ctx, s, P, z) { ublk(ctx, s, -16, -18, 32, 3, '#3a3a4a', '#5a5a6e'); upoly(ctx, s, [[-14, -15], [14, -15], [12, -4], [6, 0], [-6, 0], [-12, -4]], '#2a2a3a'); ctx.fillStyle = '#4a4a5e'; ctx.fillRect(-11 * s, -13 * s, 4 * s, 8 * s);
    ublk(ctx, s, -11, 0, 3, 2, '#2a2a3a'); ublk(ctx, s, 8, 0, 3, 2, '#2a2a3a'); ctx.fillStyle = P[2]; ctx.fillRect(-14 * s, -19 * s, 28 * s, 2 * s);
    for (let i = 0; i < 4; i++) { const bx = -10 + i * 6.5, bh = (Math.sin(FXS.clock * 7 + i * 2) + 1) * 2; ucirc(ctx, s, bx, -20 - bh, 1.6 + (i % 2), P[1]); }
    if (z.landed && Math.random() < 0.5) FXS.parts.push({ x: z.x + rand(-10, 10), y: z.y - 22, vx: rand(-10, 10), vy: -rand(20, 40), life: 0.5, t: 0, color: pick([P[1], P[2]]), size: 1, grav: 30 }); },
  anvil(ctx, s, P) { ublk(ctx, s, -8, -8, 16, 8, P[3] === '#1a1a2a' ? '#3a3a4a' : P[3], P[2]); ublk(ctx, s, -5, -12, 10, 4, P[2]); upoly(ctx, s, [[-16, -20], [16, -20], [16, -13], [-6, -13], [-14, -15], [-22, -18]], P[2]); ctx.fillStyle = P[1]; ctx.fillRect(-15 * s, -20 * s, 30 * s, 1.6 * s); ctx.fillStyle = P[0]; ctx.fillRect(4 * s, -19 * s, 8 * s, 0.8 * s); },
  rune(ctx, s, P, z) { upoly(ctx, s, [[-5, -26], [4, -28], [6, -2], [-6, 0]], '#6a6a7e'); upoly(ctx, s, [[-3, -24], [2, -25], [4, -4], [-4, -3]], '#8a8aa0', false);
    ctx.globalAlpha *= 0.7 + 0.3 * Math.sin(FXS.clock * 6 + z.x); ctx.strokeStyle = P[1]; ctx.lineWidth = 1.4 * s; ctx.beginPath(); ctx.moveTo(-1 * s, -21 * s); ctx.lineTo(-1 * s, -8 * s); ctx.moveTo(-1 * s, -18 * s); ctx.lineTo(2.5 * s, -14 * s); ctx.moveTo(-1 * s, -13 * s); ctx.lineTo(2.5 * s, -9 * s); ctx.stroke(); glowAt(ctx, 0, -15 * s, 8 * s, P[2]); },
  drum(ctx, s, P, z) { s *= 1.5; const ph = z.landed ? (z.t - z.landT) * 8.4 : 0, b = Math.max(0, Math.sin(ph)) * 1.5, top = -18 + b;
    ctx.fillStyle = OUTLINE; ctx.fillRect(-10.6 * s, top * s, 21.2 * s, (-top + 0.6) * s); ctx.beginPath(); ctx.ellipse(0, 0, 10.6 * s, 3.6 * s, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#9a5a2a'; ctx.fillRect(-10 * s, top * s, 20 * s, -top * s); ctx.beginPath(); ctx.ellipse(0, 0, 10 * s, 3 * s, 0, 0, Math.PI); ctx.fill(); ctx.fillStyle = '#c07a3a'; ctx.fillRect(-7 * s, top * s, 3 * s, -top * s);
    ctx.fillStyle = P[2]; ctx.fillRect(-10 * s, (top + 1) * s, 20 * s, 2 * s); ctx.fillRect(-10 * s, -3 * s, 20 * s, 2 * s);
    ctx.strokeStyle = '#f1ecdc'; ctx.lineWidth = 0.8 * s; ctx.beginPath(); for (let i = 0; i < 5; i++) { ctx.moveTo((-9 + i * 4.5) * s, (top + 3) * s); ctx.lineTo((-6.5 + i * 4.5) * s, -3 * s); ctx.moveTo((-6.5 + i * 4.5) * s, (top + 3) * s); ctx.lineTo((-9 + i * 4.5) * s, -3 * s); } ctx.stroke();
    ctx.fillStyle = OUTLINE; ctx.beginPath(); ctx.ellipse(0, top * s, 10.8 * s, 3.8 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#f1e4c8'; ctx.beginPath(); ctx.ellipse(0, top * s, 10 * s, 3.2 * s, 0, 0, Math.PI * 2); ctx.fill();
    if (z.landed) { const hit = Math.sin(ph) > 0.7; ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 1.4 * s; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * 3 * s, (top - (hit ? 1 : 8)) * s); ctx.lineTo(sd * 9 * s, (top - (hit ? 6 : 14)) * s); ctx.stroke(); }
      if (hit) { ctx.globalAlpha *= 0.6; glowAt(ctx, 0, top * s, 12 * s, P[1]); } } },
  gate(ctx, s, P, z) { for (const sd of [-1, 1]) { ublk(ctx, s, sd * 9 - 2, -30, 4, 30, '#f1ecdc', '#ffffff'); ucirc(ctx, s, sd * 9, -32, 3, '#f1ecdc'); ctx.fillStyle = OUTLINE; ctx.fillRect((sd * 9 - 1.2) * s, -33 * s, 1 * s, 1 * s); ctx.fillRect((sd * 9 + 0.4) * s, -33 * s, 1 * s, 1 * s); }
    ublk(ctx, s, -11, -31, 22, 3, '#f1ecdc'); ctx.globalAlpha *= 0.6 + 0.3 * Math.sin(FXS.clock * 8); ctx.fillStyle = P[2]; ctx.fillRect(-7 * s, -28 * s, 14 * s, 28 * s); glowAt(ctx, 0, -14 * s, 12 * s, P[1]); },
  tree(ctx, s, P, z) { if (z.rar >= 5) P = ['#ffffff', '#fff3a0', '#ffb0e8', '#8a3a5a']; ublk(ctx, s, -3, -22, 6, 22, '#7a4a2a', '#9a6a3a'); ublk(ctx, s, -8, -16, 5, 2, '#7a4a2a'); ublk(ctx, s, 3, -19, 6, 2, '#7a4a2a');
    for (const [cx, cy, cr] of [[-9, -24, 8], [9, -26, 8], [0, -32, 10], [-4, -22, 6], [5, -21, 6]]) ucirc(ctx, s, cx, cy, cr, P[2]); for (const [cx, cy, cr] of [[-10, -26, 4], [7, -29, 4], [-1, -35, 5]]) ucirc(ctx, s, cx, cy, cr, P[1], false);
    ctx.fillStyle = P[0]; for (let i = 0; i < 8; i++) ctx.fillRect((Math.sin(i * 2.1) * 12) * s, (-28 + Math.cos(i * 1.7) * 7) * s, 1.2 * s, 1.2 * s); },
  oak(ctx, s, P, z) { const gold = z.rar >= 5; if (gold) P = UP.nature; const sw = Math.sin(FXS.clock * 2) * 0.6; ublk(ctx, s, -4, -24, 8, 24, '#6a4a2a', '#8a6a3a'); for (const sd of [-1, 1]) { ctx.fillStyle = OUTLINE; ctx.fillRect(sd > 0 ? 3 * s : -9 * s, -2 * s, 6 * s, 3 * s); ctx.fillStyle = '#6a4a2a'; ctx.fillRect(sd > 0 ? 4 * s : -8 * s, -1.5 * s, 4 * s, 2 * s); }
    for (const [cx, cy, cr] of [[-12, -28, 9], [12, -30, 9], [0, -38, 12], [-6, -26, 7], [7, -25, 7]]) ucirc(ctx, s, cx + sw, cy, cr, P[3] === '#2a6a3a' ? '#3fa04a' : P[2]); for (const [cx, cy, cr] of [[-12, -31, 5], [10, -34, 5], [0, -42, 6]]) ucirc(ctx, s, cx + sw, cy, cr, P[2], false);
    ctx.fillStyle = gold ? '#ffd84a' : '#ff9fd0'; for (let i = 0; i < 6 + 4 * gold; i++) ctx.fillRect((Math.sin(i * 2.7) * 14 + sw) * s, (-32 + Math.cos(i * 1.9) * 8) * s, (1.4 + gold) * s, (1.4 + gold) * s);
    if (gold) { ctx.globalAlpha *= 0.4; glowAt(ctx, 0, -34 * s, 22 * s, '#fff3a0'); } },
  jaws(ctx, s, P, z) { const lt = z.landed ? z.t - z.landT : 0, open = 0.5 + 0.5 * Math.cos(lt / 0.35 * Math.PI * 2); for (const sd of [-1, 1]) { ctx.save(); ctx.rotate(sd * (0.15 + 0.6 * open)); upoly(ctx, s, [[sd * 2, 0], [sd * 14, -4], [sd * 12, -22], [sd * 4, -26]], P[2]);
      ctx.fillStyle = '#ffffff'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(sd * 3 * s, (-6 - i * 5) * s); ctx.lineTo(sd * -0.5 * s, (-4 - i * 5) * s); ctx.lineTo(sd * 3 * s, (-2.5 - i * 5) * s); ctx.fill(); } ctx.fillStyle = P[1]; ctx.fillRect(sd > 0 ? 8 * s : -11 * s, -16 * s, 3 * s, 2 * s); ctx.restore(); } },
  spire(ctx, s, P) { upoly(ctx, s, [[-6, 0], [-2, -18], [1, -22], [3, -15], [6, 0]], P[2]); upoly(ctx, s, [[-2, -2], [0, -17], [1, -20], [2, -2]], P[1], false); },
  star(ctx, s, P, z) { if (z.landed) return; const p = Math.min(1, z.t / z.fall), off = -Math.pow(1 - p, 2) * 40; ctx.translate(off * s, 0);
    ctx.strokeStyle = P[2]; ctx.globalAlpha *= 0.6; ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.moveTo(0, -4 * s); ctx.lineTo(-14 * s, -30 * s); ctx.stroke(); ctx.globalAlpha /= 0.6;
    ctx.rotate(FXS.clock * 6); upoly(ctx, s, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => { const a = i / 10 * Math.PI * 2, rr = i % 2 ? 2 : 5; return [Math.cos(a) * rr, Math.sin(a) * rr - 4]; }), P[1]); ctx.rotate(-FXS.clock * 6); glowAt(ctx, 0, -4 * s, 7 * s, P[2]); },
  shard(ctx, s, P, z) { if (z.landed) return; ctx.rotate(0.35); ctx.fillStyle = OUTLINE; ctx.fillRect(-1.6 * s, -26 * s, 3.2 * s, 22 * s); ctx.fillStyle = '#fff3a0'; ctx.fillRect(-0.9 * s, -26 * s, 1.8 * s, 21 * s); upoly(ctx, s, [[-3, -6], [3, -6], [0, 1]], '#ffffff'); glowAt(ctx, 0, -6 * s, 6 * s, '#ffd84a'); },
  leaf(ctx, s, P, z) { if (z.landed) { ctx.globalAlpha *= 0.8; ctx.strokeStyle = P[1]; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.arc(0, -8 * s, 9 * s, -2.6, -0.4); ctx.stroke(); return; } upoly(ctx, s, [[0, -10], [3, -5], [0, 0], [-3, -5]], P[2]); },
  reap(ctx, s, P) { ctx.strokeStyle = OUTLINE; ctx.lineWidth = 4 * s; ctx.beginPath(); ctx.arc(0, -10 * s, 11 * s, -2.8, -0.2); ctx.stroke(); ctx.strokeStyle = P[2]; ctx.lineWidth = 2.6 * s; ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.8 * s; ctx.stroke(); },
  crescent(ctx, s, P) { ctx.rotate(FXS.clock * 10); ctx.fillStyle = P[1]; ctx.beginPath(); ctx.arc(0, -8 * s, 8 * s, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(5,2,15,0.9)'; ctx.beginPath(); ctx.arc(3 * s, -10 * s, 7 * s, 0, Math.PI * 2); ctx.fill(); },
  guillotine(ctx, s, P, z) { ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = s; ctx.beginPath(); ctx.moveTo(0, -24 * s); ctx.lineTo(0, -60 * s); ctx.stroke(); upoly(ctx, s, [[-8, -24], [8, -24], [8, -14], [-8, -8]], P[2]); ctx.fillStyle = P[0]; ctx.beginPath(); ctx.moveTo(-8 * s, -9 * s); ctx.lineTo(8 * s, -15 * s); ctx.lineTo(8 * s, -13.6 * s); ctx.lineTo(-8 * s, -7.6 * s); ctx.fill(); ublk(ctx, s, -9, -27, 18, 3, '#6a4a2a'); },
  hawk(ctx, s, P, z) { if (z.landed) return; s *= 1.8; const p = Math.min(1, z.t / z.fall); ctx.translate(-(1 - p) * 40 * s, 0); ctx.rotate(0.9); const fl = Math.sin(FXS.clock * 30) * 2;
    upoly(ctx, s, [[0, -10], [3, -6], [0, -2], [-3, -6]], P[2]); upoly(ctx, s, [[-1, -8], [-10, -10 - fl], [-6, -6]], P[1]); upoly(ctx, s, [[1, -8], [10, -10 - fl], [6, -6]], P[1]); ctx.fillStyle = '#ffd84a'; ctx.fillRect(-0.6 * s, -1.6 * s, 1.2 * s, 1.6 * s); },
  lilybomb(ctx, s, P, z) { if (z.landed) return; s *= 1.4; ucirc(ctx, s, 0, -6, 6, '#7ad46a'); ctx.fillStyle = '#3a8a4a'; ctx.beginPath(); ctx.moveTo(0, -6 * s); ctx.lineTo(6 * s, -9 * s); ctx.lineTo(6 * s, -4 * s); ctx.fill(); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + FXS.clock * 4; ucirc(ctx, s, Math.cos(a) * 2.2, -8 + Math.sin(a) * 2.2, 1.4, i % 2 ? '#ffffff' : '#ffb0d8', false); } ucirc(ctx, s, 0, -8, 1, '#ffd84a', false); },
  frog(ctx, s, P, z) { if (z.landed) return; s *= 1.5; ctx.rotate(Math.sin(FXS.clock * 12) * 0.3); ucirc(ctx, s, 0, -5, 4.5, P[2] === '#7ad46a' ? '#5ac46a' : P[2]); ucirc(ctx, s, -2.5, -9, 1.8, '#ffffff'); ucirc(ctx, s, 2.5, -9, 1.8, '#ffffff'); ctx.fillStyle = OUTLINE; ctx.fillRect(-2.8 * s, -9.4 * s, s, s); ctx.fillRect(2.2 * s, -9.4 * s, s, s);
    ctx.fillStyle = '#ff8fb0'; ctx.fillRect(-1.5 * s, -4 * s, 3 * s, 0.8 * s); for (const sd of [-1, 1]) { ctx.fillStyle = OUTLINE; ctx.fillRect(sd * 5 * s - s, -3 * s, 2.4 * s, 1.6 * s); } },
};

// ----- traveling things -----
function drawLineThing(ctx, z, X, Y, k, P) {
  const x = X(z.x), y = Y(z.y), r = z.rar, s = k * (1 + 0.08 * r), tr = z.trail.slice(-16);
  for (let i = 1; i < tr.length; i++) { const f = i / tr.length; ctx.globalAlpha = 0.35 * f; ctx.strokeStyle = i % 2 ? P[1] : P[2]; ctx.lineWidth = z.w * k * 0.9 * f; ctx.beginPath(); ctx.moveTo(X(tr[i - 1][0]), Y(tr[i - 1][1]) - 8 * k); ctx.lineTo(X(tr[i][0]), Y(tr[i][1]) - 8 * k); ctx.stroke(); }
  ctx.globalAlpha = 1; ctx.save(); ctx.translate(x, y);
  if (z.shape === 'boulder') { const R = 10 + 1.4 * r, vein = r >= 5 ? '#ffd84a' : r >= 3 ? rarCol(r) : '#c9a35a'; ctx.translate(0, -R * k * 0.85); ctx.rotate(z.travelled / R);
    ucirc(ctx, k, 0, 0, R, '#8a7a6a'); ucirc(ctx, k, -R * 0.25, -R * 0.3, R * 0.55, '#a8988a', false); ctx.fillStyle = '#5a4a3e'; for (let i = 0; i < 6; i++) { const a = i * 1.1; ctx.fillRect(Math.cos(a) * R * 0.55 * k, Math.sin(a) * R * 0.55 * k, 3 * k, 2 * k); }
    ctx.strokeStyle = vein; ctx.lineWidth = 1.2 * k; ctx.beginPath(); ctx.moveTo(-R * 0.6 * k, 0); ctx.lineTo(0, R * 0.2 * k); ctx.lineTo(R * 0.5 * k, -R * 0.4 * k); ctx.moveTo(0, R * 0.2 * k); ctx.lineTo(R * 0.1 * k, R * 0.7 * k); ctx.stroke(); if (r >= 3) { ctx.globalAlpha = 0.4; glowAt(ctx, 0, 0, R * 1.3 * k, vein); } }
  else if (z.shape === 'bolt') { ctx.rotate(z.a); ctx.translate(0, -8 * k); ctx.fillStyle = OUTLINE; ctx.fillRect(-36 * s, -2.2 * s, 36 * s, 4.4 * s); ctx.fillStyle = '#8a6a4a'; ctx.fillRect(-36 * s, -1.4 * s, 36 * s, 2.8 * s); upoly(ctx, s, [[0, -5], [10, 0], [0, 5]], P[2]); upoly(ctx, s, [[-36, 0], [-42, -6], [-30, 0], [-42, 6]], P[1]); glowAt(ctx, 4 * s, 0, 8 * s, r >= 5 ? '#ffd84a' : '#ffffff'); }
  else if (z.shape === 'wolf' || z.shape === 'bear') { const big = z.shape === 'bear' ? 2.2 : 1, run = Math.sin(z.travelled * 0.25) * 1.5, ss = s * big; ctx.globalAlpha = 0.9; glowAt(ctx, 0, -8 * ss, 14 * ss, P[2]); ctx.globalAlpha = 0.95;
    if (big > 1) { upoly(ctx, ss, [[-10, -8], [6, -11], [10, -6], [8, -2], [-10, -3]], P[1]); upoly(ctx, ss, [[6, -12], [13, -11], [15, -8], [11, -6], [6, -7]], P[1]); ctx.fillStyle = P[2]; ctx.fillRect(9 * ss, -14 * ss, 2 * ss, 2 * ss); ctx.fillRect(6 * ss, -14 * ss, 2 * ss, 2 * ss); }
    else { upoly(ctx, ss, [[-14, -10 - run * 0.5], [-9, -7], [-8, -5], [-14, -8 - run * 0.5]], P[1]); upoly(ctx, ss, [[-9, -7], [5, -9], [8, -6], [6, -3], [-8, -4]], P[1]); upoly(ctx, ss, [[5, -10], [10, -10], [16, -7], [10, -5], [5, -6]], P[1]);
      ctx.fillStyle = P[1]; ctx.beginPath(); ctx.moveTo(6 * ss, -10 * ss); ctx.lineTo(7 * ss, -14 * ss); ctx.lineTo(9 * ss, -10 * ss); ctx.fill(); ctx.fillStyle = OUTLINE; ctx.fillRect(15 * ss, -7.5 * ss, 1.2 * ss, 1.2 * ss); }
    ctx.fillStyle = P[0]; ctx.fillRect(12 * ss, -10 * ss, 1.4 * ss, 1.4 * ss); for (const [lx, ph] of [[-8, 0], [-4, 1], [3, 1], [6, 0]]) { ctx.fillStyle = P[2]; ctx.fillRect(lx * ss, (-3 + (ph ? run : -run) * 0.4) * ss, 2 * ss, (4 + (ph ? -run : run) * 0.5) * ss); }
    ctx.globalAlpha = 0.5; ctx.fillStyle = P[1]; for (let i = 0; i < 3; i++) ctx.fillRect((-16 - i * 6) * ss, (-8 + i * 2) * ss, 5 * ss, 1 * ss); }
  ctx.restore(); ctx.globalAlpha = 1;
}
function drawCyclone(ctx, z, x, y, k, P, fade) { const r = z.r * k, h = (40 + 6 * z.rar) * k; ctx.save(); ctx.globalAlpha = 0.85 * fade;
  for (let i = 0; i < 9; i++) { const f = i / 8, w = r * (0.25 + 0.9 * f), yy = y - f * h, ph = FXS.clock * 14 + i * 0.9; ctx.strokeStyle = i % 2 ? P[1] : P[2]; ctx.lineWidth = (2 + f * 2) * k; ctx.beginPath(); ctx.ellipse(x + Math.sin(ph * 0.3) * 3 * k * f, yy, w, w * 0.28, 0, ph % (Math.PI * 2), ph % (Math.PI * 2) + 4.2); ctx.stroke(); }
  ctx.globalAlpha = 0.3 * fade; glowAt(ctx, x, y - h * 0.4, r * 1.2, P[2]); ctx.restore();
  if (Math.random() < 0.8) FXS.parts.push({ x: z.x + rand(-z.r, z.r), y: z.y - rand(0, 10), vx: rand(-30, 30), vy: -rand(30, 70), life: 0.5, t: 0, color: pick(['#c9b48a', P[1], '#ffffff']), size: 1, grav: -20 }); }
function drawSaw(ctx, x, y, k, P, spin) { ctx.save(); ctx.translate(x, y); ctx.rotate(spin); const n = 10; ctx.fillStyle = OUTLINE; ctx.beginPath(); for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * Math.PI * 2, rr = (i % 2 ? 6 : 8.5) * k; i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.fill();
  ctx.fillStyle = P[2]; ctx.beginPath(); for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * Math.PI * 2, rr = (i % 2 ? 5 : 7.4) * k; i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.fill(); ctx.fillStyle = P[0]; ctx.beginPath(); ctx.arc(0, 0, 2 * k, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = OUTLINE; ctx.fillRect(-0.6 * k, -0.6 * k, 1.2 * k, 1.2 * k); ctx.restore();
  if (Math.random() < 0.5) FXS.parts.push({ x: (x - 0) / 1 * 0 + 0, y: 0, vx: 0, vy: 0, life: 0, t: 1, color: '#fff', size: 0, grav: 0 }); }
function drawSweep(ctx, z, X, Y, k, P, fade) { if (z.cy == null) return; const cy = Y(z.cy), x0 = X(CASTLE_X + 8), x1 = X(W + 6), p = Math.min(1, z.t / 0.7), gold = z.rar >= 5;
  const edge = gold ? ['#fff3a0', '#ffd84a'] : ['#e8ffd0', '#9dff6a'], L = x1 - x0, curve = f => cy + Math.sin(f * Math.PI) * 10 * k - f * 6 * k, thick = f => (2 + 14 * f * f) * k;
  ctx.save(); ctx.globalAlpha = fade;
  // ghostly smear the blade leaves behind
  for (let i = 1; i <= 4; i++) { ctx.globalAlpha = fade * 0.12 * (5 - i); ctx.fillStyle = edge[1]; ctx.beginPath(); for (let f = 0; f <= 1.001; f += 0.05) ctx.lineTo(x0 + L * f, curve(f) - i * 9 * k); for (let f = 1; f >= -0.001; f -= 0.05) ctx.lineTo(x0 + L * f, curve(f) - i * 9 * k - thick(f) * 0.6); ctx.fill(); }
  ctx.globalAlpha = fade; const blade = (grow, col) => { ctx.fillStyle = col; ctx.beginPath(); for (let f = 0; f <= 1.001; f += 0.04) ctx.lineTo(x0 + L * f, curve(f) + grow); for (let f = 1; f >= -0.001; f -= 0.04) ctx.lineTo(x0 + L * f, curve(f) - thick(f) - grow); ctx.closePath(); ctx.fill(); };
  blade(1.2 * k, OUTLINE); blade(0, gold ? '#c9a35a' : '#5a6a7a'); ctx.fillStyle = edge[0]; ctx.beginPath(); for (let f = 0; f <= 1.001; f += 0.04) ctx.lineTo(x0 + L * f, curve(f)); for (let f = 1; f >= -0.001; f -= 0.04) ctx.lineTo(x0 + L * f, curve(f) - 2.2 * k); ctx.fill();
  ctx.globalAlpha = fade * (0.5 + 0.3 * Math.sin(FXS.clock * 20)); glowAt(ctx, x0 + L * 0.5, cy, 30 * k, edge[1]); ctx.globalAlpha = fade;
  // the haft runs up off the top of the screen
  ctx.strokeStyle = OUTLINE; ctx.lineWidth = 7 * k; ctx.beginPath(); ctx.moveTo(x1 - 6 * k, curve(1) - thick(1)); ctx.lineTo(x1 + 30 * k, cy - 160 * k); ctx.stroke(); ctx.strokeStyle = '#4a3a3a'; ctx.lineWidth = 5 * k; ctx.stroke();
  if (Math.random() < 0.9) FXS.parts.push({ x: CASTLE_X + Math.random() * (W - CASTLE_X), y: z.cy - rand(0, 6), vx: rand(-20, 20), vy: -rand(10, 40), life: 0.5, t: 0, color: pick(edge), size: 1, grav: -20 });
  ctx.restore(); }
function drawSkyBody(ctx, z, X, Y, k) { const a = (z.t < 0.4 ? z.t / 0.4 : uFade(z, 0.4)), rise = Math.min(1, z.t / 0.6), cx = X(300), cy = Y(70 - 30 * rise), gold = z.rar >= 5; ctx.save(); ctx.globalAlpha = a;
  if (z.kind === 'sun') { glowAt(ctx, cx, cy, 60 * k, gold ? '#ffd84a' : '#ffb03a'); for (let i = 0; i < 12; i++) { const an = i / 12 * Math.PI * 2 + FXS.clock * 0.5; ctx.strokeStyle = '#fff3b0'; ctx.lineWidth = 2 * k; ctx.beginPath(); ctx.moveTo(cx + Math.cos(an) * 22 * k, cy + Math.sin(an) * 22 * k); ctx.lineTo(cx + Math.cos(an) * 34 * k, cy + Math.sin(an) * 34 * k); ctx.stroke(); } ctx.fillStyle = '#fff3c0'; ctx.beginPath(); ctx.arc(cx, cy, 18 * k, 0, Math.PI * 2); ctx.fill(); }
  else if (z.kind === 'moon' || z.kind === 'night') { glowAt(ctx, cx, cy, 40 * k, '#c8d0ff'); ctx.fillStyle = '#eef0ff'; ctx.beginPath(); ctx.arc(cx, cy, 16 * k, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#c8ccf0'; for (const [dx, dy, r] of [[-5, -3, 4], [6, 4, 3], [2, -8, 2]]) { ctx.beginPath(); ctx.arc(cx + dx * k, cy + dy * k, r * k, 0, Math.PI * 2); ctx.fill(); }
    if (z.kind === 'night') { ctx.fillStyle = '#ffffff'; for (let i = 0; i < 40; i++) { const sx = X((i * 97) % W), sy = Y((i * 53) % 100); ctx.globalAlpha = a * (0.4 + 0.6 * Math.abs(Math.sin(FXS.clock * 3 + i))); ctx.fillRect(sx, sy, k, k); } } }
  else if (z.kind === 'eclipse') { ctx.globalAlpha = a * 0.9; glowAt(ctx, cx, cy, 50 * k, gold ? '#ffd84a' : '#ff9fd0'); ctx.globalAlpha = a; ctx.fillStyle = '#fff3e0'; ctx.beginPath(); ctx.arc(cx, cy, 18 * k, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#05020f'; ctx.beginPath(); ctx.arc(cx + (1 - rise) * 20 * k, cy, 17 * k, 0, Math.PI * 2); ctx.fill(); }
  else if (z.kind === 'bloodmoon') { glowAt(ctx, cx, cy, 50 * k, gold ? '#ffd84a' : '#ff3d3d'); ctx.fillStyle = gold ? '#fff3a0' : '#c0203a'; ctx.beginPath(); ctx.arc(cx, cy, 18 * k, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = gold ? '#ffd84a' : '#8a1020'; for (const [dx, dy, r] of [[-5, -3, 4], [6, 5, 3]]) { ctx.beginPath(); ctx.arc(cx + dx * k, cy + dy * k, r * k, 0, Math.PI * 2); ctx.fill(); } }
  else if (z.kind === 'storm' || z.kind === 'raincloud') { const rain = z.kind === 'raincloud', top = rain ? (gold ? '#fffbe8' : '#e8eef8') : '#8a94b8', mid = rain ? (gold ? '#ffe8a0' : '#b8c4dc') : '#5a6488', low = rain ? (gold ? '#d8b860' : '#8a98b8') : '#3a4468';
    for (let i = 0; i < 6; i++) { const bx = X(150 + i * 60 + Math.sin(FXS.clock * 0.7 + i) * 6), by = Y(58 + (i % 2) * 8) - (1 - rise) * 40 * k;
      for (const [dx, dy, r, c] of [[-14, 4, 11, low], [14, 4, 11, low], [0, 2, 14, low], [-12, 0, 10, mid], [12, 0, 10, mid], [0, -4, 13, mid], [-3, -8, 8, top], [6, -6, 7, top]]) { ctx.fillStyle = OUTLINE; ctx.beginPath(); ctx.arc(bx + dx * k, by + dy * k, (r + 1) * k, 0, Math.PI * 2); ctx.fill(); }
      for (const [dx, dy, r, c] of [[-14, 4, 11, low], [14, 4, 11, low], [0, 2, 14, low], [-12, 0, 10, mid], [12, 0, 10, mid], [0, -4, 13, mid], [-3, -8, 8, top], [6, -6, 7, top]]) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(bx + dx * k, by + dy * k, r * k, 0, Math.PI * 2); ctx.fill(); } }
    if (rain) { const tx = X(330), ty = Y(40) - (1 - rise) * 40 * k + Math.sin(FXS.clock * 2) * 2 * k, s = 2.4 * k; ctx.save(); ctx.translate(tx, ty);
      ctx.globalAlpha = a * 0.5; glowAt(ctx, 0, -6 * s, 14 * s, gold ? '#ffd84a' : '#bff4ff'); ctx.globalAlpha = a;
      ucirc(ctx, s, 0, -4, 7, gold ? '#ffd84a' : '#5a9ad8'); ucirc(ctx, s, 0, -2, 4.5, '#e0f0ff', false); ucirc(ctx, s, -4, -10, 2.6, '#ffffff'); ucirc(ctx, s, 4, -10, 2.6, '#ffffff'); ctx.fillStyle = OUTLINE; ctx.fillRect(-4.4 * s, -10.6 * s, 1.4 * s, 1.4 * s); ctx.fillRect(3.6 * s, -10.6 * s, 1.4 * s, 1.4 * s);
      ctx.fillStyle = '#1a1230'; ctx.fillRect(-2.5 * s, -6 * s, 5 * s, 0.8 * s); upoly(ctx, s, [[-4, -12], [-3, -16], [-1, -13], [0, -17], [1, -13], [3, -16], [4, -12]], '#ffd84a'); ctx.restore(); }
    if (z.kind === 'storm' && Math.random() < 0.06) FXS.spells.push({ kind: 'ubolt', x: rand(160, 460), y: rand(GRID.y, GRID.y + 140), rar: z.rar, small: true, t: 0, life: 0.2 }); }
  ctx.restore(); }
function drawFieldTall(ctx, z, X, Y, k, P, fade) { const x = X(z.x), y = Y(z.y);
  if (z.style === 'storm') { const gold = z.rar >= 5; ctx.globalAlpha = 0.9 * fade; for (let i = 0; i < 4; i++) drawCloud(ctx, x + (i - 1.5) * z.r * 0.5 * k, y - 74 * k + Math.sin(FXS.clock * 2 + i) * 3 * k, k * 0.8, gold ? ['#fffbe8', '#ffe8a0', '#d8b860'] : ['#9aa4c8', '#6a74a0', '#4a5480']); ctx.globalAlpha = 1; }
  else if (z.style === 'lantern') { const by = y - (30 + Math.sin(FXS.clock * 3 + z.x) * 2) * k, bx = x - 8 * k; ctx.globalAlpha = fade * 0.7; glowAt(ctx, bx, by, 16 * k, P[2]); ctx.globalAlpha = fade; ublkAt(ctx, bx, by, k * 1.7, P);
    ctx.strokeStyle = P[1]; ctx.globalAlpha = fade * 0.5; ctx.lineWidth = k; ctx.beginPath(); ctx.moveTo(bx, by + 8 * k); ctx.quadraticCurveTo(bx + 4 * k, by + 16 * k, x, y - 14 * k); ctx.stroke(); ctx.globalAlpha = 1; }
  else if (z.style === 'rain') { ctx.globalAlpha = 0.6 * fade; ctx.strokeStyle = z.rar >= 5 ? '#fff3a0' : '#bff4ff'; ctx.lineWidth = k; ctx.beginPath(); for (let i = 0; i < 70; i++) { const rx = X((i * 71 + FXS.clock * 60) % (W - CASTLE_X) + CASTLE_X), ry = Y((i * 37 + FXS.clock * 240) % 180 + 40); ctx.moveTo(rx, ry); ctx.lineTo(rx - 2 * k, ry + 6 * k); } ctx.stroke(); ctx.globalAlpha = 1; }
  else if (z.style === 'bog' || z.style === 'blood') { if (Math.random() < 0.5) FXS.parts.push({ x: z.x + rand(-z.r, z.r) * 0.7, y: z.y + rand(-z.r, z.r) * 0.3, vx: 0, vy: -rand(10, 25), life: 0.5, t: 0, color: pick([P[1], P[2]]), size: 1, grav: -10 }); }
  else if (z.style === 'fissure' || z.style === 'burnline') { if (Math.random() < 0.6) { const p = z.pts ? pick(z.pts) : [z.x + rand(-z.r, z.r) * 0.6, z.y + rand(-z.r, z.r) * 0.3]; FXS.spells.push({ kind: 'flame', x: p[0], y: p[1] - 2, vx: rand(-5, 5), vy: -rand(15, 30), s: rand(1.5, 3), t: 0, life: rand(0.3, 0.5) }); } } }
function drawCloud(ctx, bx, by, k, [top, mid, low]) { const L = [[-14, 4, 11, low], [14, 4, 11, low], [0, 2, 14, low], [-12, 0, 10, mid], [12, 0, 10, mid], [0, -4, 13, mid], [-3, -8, 8, top], [6, -6, 7, top]];
  ctx.fillStyle = OUTLINE; for (const [dx, dy, r] of L) { ctx.beginPath(); ctx.arc(bx + dx * k, by + dy * k, (r + 1) * k, 0, Math.PI * 2); ctx.fill(); } for (const [dx, dy, r, c] of L) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(bx + dx * k, by + dy * k, r * k, 0, Math.PI * 2); ctx.fill(); } }
function ublkAt(ctx, x, y, k, P) { ctx.fillStyle = OUTLINE; ctx.fillRect(x - 3.5 * k, y - 5 * k, 7 * k, 10 * k); ctx.fillStyle = '#3a2a4a'; ctx.fillRect(x - 2.5 * k, y - 4 * k, 5 * k, 8 * k); ctx.fillStyle = P[1]; ctx.fillRect(x - 1.5 * k, y - 2.5 * k, 3 * k, 5 * k); ctx.fillStyle = '#3a2a4a'; ctx.fillRect(x - 0.5 * k, y - 7 * k, k, 2 * k); }
function drawMoonbeam(ctx, z, X, Y, k, P) { const mx = X(z.mx), my = Y(z.my - (1 - Math.min(1, z.t / 0.5)) * 60), f = uFade(z), gold = z.rar >= 5, s = 1.6 * k * (1 + 0.06 * z.rar); ctx.save(); ctx.globalAlpha = f;
  glowAt(ctx, mx, my, 34 * s, gold ? '#ffd84a' : '#ffcf3a'); ucirc(ctx, 1, mx, my, 18 * s, gold ? '#fff3a0' : '#e8d8a0'); ctx.strokeStyle = '#c9883a'; ctx.lineWidth = 1.5 * s; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + FXS.clock * 0.6; ctx.beginPath(); ctx.moveTo(mx + Math.cos(a) * 14 * s, my + Math.sin(a) * 14 * s); ctx.lineTo(mx + Math.cos(a) * 19 * s, my + Math.sin(a) * 19 * s); ctx.stroke(); }
  ctx.beginPath(); ctx.arc(mx, my, 11 * s, 0, Math.PI * 2); ctx.stroke(); const bx = X(z.bx), by = Y(z.by), ea = Math.atan2(by - my, bx - mx); ucirc(ctx, 1, mx, my, 6 * s, '#ffffff'); ucirc(ctx, 1, mx + Math.cos(ea) * 2.5 * s, my + Math.sin(ea) * 2.5 * s, 3 * s, gold ? '#ff9a3a' : '#5fd3ff', false);
  if (z.t > 0.5) { for (const [lw, c, a] of [[10 * k + z.rar * 2 * k, gold ? '#ffd84a' : '#5fd3ff', 0.35], [4 * k, '#bff4ff', 0.8], [1.5 * k, '#ffffff', 1]]) { ctx.globalAlpha = f * a; ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(mx + Math.cos(ea) * 4 * s, my + Math.sin(ea) * 4 * s); ctx.lineTo(bx, by); ctx.stroke(); }
    ctx.globalAlpha = f * 0.7; glowAt(ctx, bx, by, z.r * k, gold ? '#ffd84a' : '#5fd3ff'); if (Math.random() < 0.8) FXS.parts.push({ x: z.bx + rand(-8, 8), y: z.by + rand(-3, 3), vx: rand(-30, 30), vy: -rand(20, 50), life: 0.4, t: 0, color: pick(['#ffffff', '#bff4ff', gold ? '#ffd84a' : '#5fd3ff']), size: 1, grav: 60 }); }
  ctx.restore(); }
function drawCat(ctx, x, y, k, P, face, p) { ctx.save(); ctx.translate(x, y); ctx.scale(face, 1); ctx.globalAlpha = 0.9; upoly(ctx, k, [[-7, -2], [4, -4], [7, -1], [4, 1], [-6, 1]], P[3]); upoly(ctx, k, [[4, -6], [9, -6], [10, -2], [5, -1]], P[3]); ctx.fillStyle = P[3]; ctx.fillRect(5 * k, -8 * k, 1.4 * k, 2 * k); ctx.fillRect(8 * k, -8 * k, 1.4 * k, 2 * k);
  ctx.fillStyle = P[1]; ctx.fillRect(6.5 * k, -4.5 * k, 1 * k, 1 * k); ctx.fillRect(8.5 * k, -4.5 * k, 1 * k, 1 * k); ctx.strokeStyle = P[3]; ctx.lineWidth = 1.4 * k; ctx.beginPath(); ctx.moveTo(-7 * k, -1 * k); ctx.quadraticCurveTo(-11 * k, -6 * k, -9 * k, -9 * k); ctx.stroke(); ctx.restore(); }
function drawTsunami(ctx, z, X, Y, k) { const w = z.wave, gold = z.rar >= 5, x = X(w.x), top = Y(GRID.y - 30 - 6 * z.rar), bot = Y(H), f = Math.max(0, 1 - w.t / w.life * 0.6);
  ctx.save(); ctx.globalAlpha = 0.85 * f; const g = ctx.createLinearGradient(x - 60 * k, 0, x, 0); g.addColorStop(0, 'rgba(26,74,138,0)'); g.addColorStop(1, gold ? '#ffd84a' : '#3a8ad8'); ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(x - 70 * k, bot); for (let yy = bot; yy > top; yy -= 4 * k) ctx.lineTo(x + Math.sin(yy * 0.05 + FXS.clock * 8) * 4 * k, yy); ctx.quadraticCurveTo(x + 14 * k, top - 10 * k, x - 10 * k, top + 6 * k); ctx.lineTo(x - 70 * k, top + 20 * k); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffffff'; for (let yy = top; yy < bot; yy += 6 * k) ctx.fillRect(x + Math.sin(yy * 0.05 + FXS.clock * 8) * 4 * k - 2 * k, yy, 3 * k, 3 * k);
  const fy = top + 10 * k + Math.sin(FXS.clock * 5) * 6 * k; if (z.t > 0.3 && z.t < 1.4) { ctx.save(); ctx.translate(x - 20 * k, fy - 20 * k); ctx.rotate(-0.5 + z.t * 0.6); const s = 2 * k; upoly(ctx, s, [[-8, 0], [4, -4], [9, 0], [4, 4]], gold ? '#ffd84a' : '#5fa8d8'); upoly(ctx, s, [[-8, 0], [-13, -4], [-12, 0], [-13, 4]], gold ? '#fff3a0' : '#3a7ab0'); ctx.fillStyle = '#ffffff'; ctx.fillRect(5 * s, -1.5 * s, 1.2 * s, 1.2 * s); ctx.restore(); }
  ctx.restore(); }
function drawCoralWall(ctx, z, X, Y, k, P, fade) { const up = Math.min(1, z.t / 0.35), x = X(z.x), y0 = Y(GRID.y - 10), y1 = Y(GRID.y + GRID.rows * GRID.cell + 6), w = z.w * k; ctx.save(); ctx.globalAlpha = fade;
  for (let yy = y1; yy > y0; yy -= 9 * k) { const h = (16 + 6 * Math.sin(yy * 0.3)) * k * up, cx = x + Math.sin(yy * 0.7) * 3 * k; ctx.globalAlpha = 0.5 * fade; ctx.fillStyle = P[2]; ctx.fillRect(cx - 2 * k, yy - h - 6 * k, w + 6 * k, h + 6 * k); ctx.globalAlpha = fade;
    for (const [dx, col] of [[0, '#ff8a7a'], [w * 0.5, '#ffb0d8'], [w, '#ff6a8a']]) { ctx.fillStyle = OUTLINE; ctx.fillRect(cx + dx - 2 * k, yy - h - k, 4 * k, h + k); ctx.fillStyle = col; ctx.fillRect(cx + dx - k, yy - h, 2 * k, h); ctx.fillRect(cx + dx - 3 * k, yy - h * 0.6, 2 * k, 2 * k); } }
  ctx.globalAlpha = 0.6 * fade; ctx.fillStyle = '#ffffff'; for (let i = 0; i < 12; i++) ctx.fillRect(x + w + rand(0, 6) * k, y0 + rand(0, y1 - y0), 2 * k, k); ctx.restore(); }
function drawCathedral(ctx, z, x, y, k, P, fade) { const up = Math.min(1, z.t / 0.4), n = 8 + Math.min(4, z.rar), gold = z.rar >= 5; ctx.save();
  const pts = []; for (let i = 0; i < n; i++) { const an = i / n * Math.PI * 2; pts.push([x + Math.cos(an) * z.r * k, y + Math.sin(an) * z.r * 0.5 * k, i]); }
  ctx.globalAlpha = 0.18 * fade; ctx.fillStyle = gold ? '#fff3a0' : '#ffe8c0'; ctx.beginPath(); ctx.ellipse(x, y - z.r * 0.35 * k, z.r * k, z.r * 0.85 * k * up, 0, Math.PI, 0); ctx.fill();
  pts.sort((a, b) => a[1] - b[1]).forEach(([px, py, i]) => { const h = (34 + 4 * z.rar) * k * up, w = 5 * k, cols = gold ? ['#fff3a0', '#ffd84a', '#ffffff'] : ['#ff9fd0', '#5fd3ff', '#ffe066', '#9be05a'];
    ctx.globalAlpha = fade; ctx.fillStyle = OUTLINE; ctx.fillRect(px - w / 2 - k, py - h - k, w + 2 * k, h + k); for (let j = 0; j < 4; j++) { ctx.fillStyle = cols[(i + j) % cols.length]; ctx.fillRect(px - w / 2, py - h + j * h / 4, w, h / 4 - 0.5 * k); }
    ctx.fillStyle = OUTLINE; ctx.beginPath(); ctx.moveTo(px - w / 2 - k, py - h); ctx.lineTo(px, py - h - 6 * k); ctx.lineTo(px + w / 2 + k, py - h); ctx.fill();
    ctx.globalAlpha = fade * (0.3 + 0.2 * Math.sin(FXS.clock * 4 + i)); ctx.fillStyle = cols[i % cols.length]; ctx.beginPath(); ctx.moveTo(px - w / 2, py - h * 0.5); ctx.lineTo(x, y - 4 * k); ctx.lineTo(px + w / 2, py - h * 0.5); ctx.fill(); });
  ctx.restore(); }
