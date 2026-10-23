// ===== Spell visuals that grow with the caster's signature power =====
// pw is sigPower(u): about 1 for a fresh signature, up to 3 for a maxed, item-stacked caster.
// Ground marks (scorch, stuck arrows) draw on the low-res pass under units; fire and arrows draw on the hi-res pass.
FXS.spells = []; FXS.decals = [];
const FIRE_COLS = ['#ffffff', '#fff3a0', '#ffd23a', '#ff8a2a', '#ff3d2d', '#8a1a2a'];

Object.assign(FX, {
  // the fireball lands: a blooming sphere of flame, rising embers and smoke, a scorch mark that lingers
  fireburst(x, y, r, pw = 1) {
    const big = 0.8 + 0.35 * pw;
    FXS.spells.push({ kind: 'fire', x, y, r: r * big, pw, t: 0, life: 0.55 + 0.15 * pw });
    if (pw > 1.6) FXS.spells.push({ kind: 'pillar', x, y, r: r * 0.5 * big, pw, t: 0, life: 0.7 });
    for (let i = 0; i < Math.round(8 + 6 * pw); i++) FXS.spells.push({ kind: 'smoke', x: x + rand(-r, r) * 0.6, y: y - rand(0, 10), vx: rand(-8, 8), vy: -rand(14, 30), s: rand(4, 7) * big, t: -rand(0, 0.25), life: rand(0.9, 1.5) });
    FX.particles(x, y - 6, Math.round(20 + 22 * pw), ['#ffd23a', '#ff8a2a', '#ff3d2d', '#fff3a0'], { spread: r * 1.1 * big, up: true, grav: 60 });
    FXS.decals.push({ kind: 'scorch', x, y, r: r * 0.8 * big, t: 0, life: 3 + pw });
    FX.shockwave(x, y, r * 2 * big, '#ff8a3a'); if (pw > 1.3) FX.shockwave(x, y, r * 2.8 * big, '#ffd23a');
    FX.shake(4 + 3 * pw); FX.flash('#ff8a3a', Math.min(0.35, 0.1 + 0.08 * pw));
  },
  // the final wave: a dust storm rolls in from the right edge and war drums thump
  surge(n) { for (let i = 0; i < 40 + Math.min(80, n); i++) FXS.parts.push({ x: W + rand(-6, 10), y: rand(GRID.y - 10, GRID.y + GRID.rows * GRID.ch + 10), vx: -rand(40, 110), vy: rand(-8, 4), life: rand(0.8, 1.6), t: 0, color: pick(['#c9b48a', '#a8916a', '#8a7a5a']), size: 2, grav: 0 });
    FX.flash('#ff3d6e', 0.15); },
  // one tick of arrow rain: real arrows dive in from the sky at an angle and stick in the ground
  arrowStorm(x, y, r, pw = 1) {
    const n = Math.round(5 + 4 * pw);
    for (let i = 0; i < n; i++) { const tx = x + rand(-r, r), ty = y + rand(-r, r) * 0.55, d = rand(0.16, 0.3);
      FXS.spells.push({ kind: 'arrow', sx: tx - 46, sy: ty - 150, x: tx, y: ty, t: -rand(0, 0.12), life: d, gold: pw > 2 && Math.random() < 0.3 }); }
  },
});

function stepSpellFX(dt) {
  stepSigVFX(dt); stepCastleVFX(dt); if (typeof stepUltFX === 'function') stepUltFX(dt);
  for (const s of FXS.spells) { s.t += dt;
    if (s.kind === 'smoke' && s.t > 0) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy *= 0.97; s.s *= 1 + 0.6 * dt; }
    if (s.kind === 'arrow' && s.t >= s.life && !s.landed) { s.landed = true;
      FXS.decals.push({ kind: 'arrow', x: s.x, y: s.y, t: 0, life: 1.4, gold: s.gold }); FX.particles(s.x, s.y, 3, ['#c9b48a', '#8a6a4a'], { spread: 6 }); } }
  FXS.spells = FXS.spells.filter(s => s.t < s.life || (s.kind === 'arrow' && !s.landed));
  if (FXS.spells.length > 600) FXS.spells.splice(0, FXS.spells.length - 600);
  for (const d of FXS.decals) d.t += dt;
  FXS.decals = FXS.decals.filter(d => d.t < d.life);
  if (FXS.decals.length > 160) FXS.decals.splice(0, FXS.decals.length - 160);
}

// low-res, under units
function drawSpellDecals(g) {
  for (const d of FXS.decals) { const a = 1 - d.t / d.life;
    if (d.kind === 'scorch') { g.globalAlpha = 0.45 * a; g.fillStyle = '#2a1a1a'; g.beginPath(); g.ellipse(Math.round(d.x), Math.round(d.y), d.r, d.r * 0.45, 0, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 0.6 * a * (d.t < 0.8 ? 1 : 0.4); g.fillStyle = '#ff8a2a'; for (let i = 0; i < 6; i++) g.fillRect(Math.round(d.x + Math.cos(i * 2.1) * d.r * 0.6), Math.round(d.y + Math.sin(i * 2.1) * d.r * 0.25), 1, 1); }
    else if (d.kind === 'mark') { g.globalAlpha = 0.35 * a; g.fillStyle = d.col; g.beginPath(); g.ellipse(Math.round(d.x), Math.round(d.y), d.r, d.r * 0.4, 0, 0, Math.PI * 2); g.fill(); }
    else if (d.kind === 'arrow') { g.globalAlpha = Math.min(1, a * 2); const x = Math.round(d.x), y = Math.round(d.y);
      g.fillStyle = '#5a3a1a'; g.fillRect(x - 2, y - 5, 1, 2); g.fillRect(x - 1, y - 3, 1, 3); g.fillStyle = d.gold ? '#ffd84a' : '#f1ecdc'; g.fillRect(x - 3, y - 6, 2, 1); }
  }
  g.globalAlpha = 1;
}

// hi-res, over the scene
function drawSpellFX(ctx, k, ox, oy, B) {
  const X = x => x * k + ox, Y = y => y * k + oy;
  // arrow rain zones cast a shadow of incoming arrows
  if (B) for (const z of B.zones) if (z.type === 'arrows') { ctx.globalAlpha = 0.22; ctx.fillStyle = '#0f1430'; ctx.beginPath(); ctx.ellipse(X(z.x), Y(z.y), z.r * k, z.r * 0.55 * k, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
  // fireballs in flight: a glowing core with a flame tail that grows with power
  if (B) for (const p of B.projs) if (p.type === 'fireBig') { const pw = (p.o && p.o.pw) || 1, x = X(p.x), y = Y(p.y), rr = (4 + 2.5 * pw) * k * (0.5 + 0.7 * (p.k || 0));
    const vx = p.tx - p.sx, vy = p.ty - p.sy, L = Math.hypot(vx, vy) || 1, ux = -vx / L, uy = -vy / L;
    for (let i = 6; i >= 1; i--) { const f = i / 6, wob = Math.sin(FXS.clock * 40 + i) * 1.5 * k; ctx.globalAlpha = 0.5 * (1 - f) + 0.15; ctx.fillStyle = FIRE_COLS[Math.min(5, 2 + Math.floor(f * 4))];
      ctx.beginPath(); ctx.arc(x + ux * rr * 1.6 * f * 2 + wob * uy, y + uy * rr * 1.6 * f * 2 - wob * ux, rr * (1 - f * 0.6), 0, Math.PI * 2); ctx.fill(); }
    const gr = ctx.createRadialGradient(x, y, 0, x, y, rr * 2.2); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.25, '#fff3a0'); gr.addColorStop(0.5, '#ffb23a'); gr.addColorStop(0.75, 'rgba(255,90,40,0.5)'); gr.addColorStop(1, 'rgba(255,60,40,0)');
    ctx.globalAlpha = 1; ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, rr * 2.2, 0, Math.PI * 2); ctx.fill();
    if (Math.random() < 0.6 + 0.2 * pw) FXS.parts.push({ x: p.x + rand(-2, 2), y: p.y + rand(-2, 2), vx: rand(-15, 15), vy: rand(-25, 5), life: rand(0.2, 0.45), t: 0, color: pick(['#ffd23a', '#ff8a2a', '#ff3d2d']), size: 1, grav: -20 }); }
  for (const s of FXS.spells) { if (s.t < 0) continue; const kk = Math.min(1, s.t / s.life);
    if (s.kind === 'fire') { const grow = Math.min(1, s.t / 0.12), rr = s.r * k * (0.35 + 0.65 * grow) * (1 + 0.15 * kk), x = X(s.x), y = Y(s.y) - rr * 0.35;
      const gr = ctx.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, kk < 0.3 ? '#ffffff' : '#fff3a0'); gr.addColorStop(0.3, '#ffd23a'); gr.addColorStop(0.6, '#ff8a2a'); gr.addColorStop(0.85, 'rgba(255,61,45,0.6)'); gr.addColorStop(1, 'rgba(138,26,42,0)');
      ctx.globalAlpha = 1 - kk * kk; ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(x, y, rr, rr * 0.8, 0, 0, Math.PI * 2); ctx.fill();
      // flame tongues licking upward
      ctx.fillStyle = '#ffb23a'; for (let i = 0; i < 7 + 3 * s.pw; i++) { const a = i * 2.39, d = rr * 0.7, fx = x + Math.cos(a) * d, fy = y + Math.sin(a) * d * 0.5, h = rr * (0.5 + 0.3 * Math.sin(FXS.clock * 25 + i)) * (1 - kk);
        ctx.beginPath(); ctx.moveTo(fx - 3 * k, fy); ctx.quadraticCurveTo(fx, fy - h * 1.2, fx + 3 * k, fy); ctx.fill(); } }
    else if (s.kind === 'pillar') { const x = X(s.x), y = Y(s.y), w = s.r * k * (1 - kk * 0.5), h = 120 * k * Math.min(1, s.t / 0.15) * (1 - kk * 0.3);
      const gr = ctx.createLinearGradient(0, y - h, 0, y); gr.addColorStop(0, 'rgba(255,61,45,0)'); gr.addColorStop(0.4, 'rgba(255,138,42,0.7)'); gr.addColorStop(1, 'rgba(255,243,160,0.95)');
      ctx.globalAlpha = 1 - kk; ctx.fillStyle = gr; ctx.fillRect(x - w / 2, y - h, w, h); }
    else if (s.kind === 'smoke') { ctx.globalAlpha = 0.35 * (1 - kk); ctx.fillStyle = kk < 0.2 ? '#5a3a3a' : '#4a4a5e'; ctx.beginPath(); ctx.arc(X(s.x), Y(s.y), s.s * k, 0, Math.PI * 2); ctx.fill(); }
    else if (s.kind === 'arrow' && !s.landed) { const f = Math.max(0, s.t / s.life), x = X(s.sx + (s.x - s.sx) * f), y = Y(s.sy + (s.y - s.sy) * f), dx = (s.x - s.sx), dy = (s.y - s.sy), L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, len = 11 * k;
      ctx.globalAlpha = 0.35; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = k; ctx.beginPath(); ctx.moveTo(x - ux * len * 2.6, y - uy * len * 2.6); ctx.lineTo(x - ux * len, y - uy * len); ctx.stroke();
      ctx.globalAlpha = 1; ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 1.4 * k; ctx.beginPath(); ctx.moveTo(x - ux * len, y - uy * len); ctx.lineTo(x, y); ctx.stroke();
      ctx.fillStyle = s.gold ? '#ffd84a' : '#e8eefc'; ctx.beginPath(); ctx.moveTo(x + ux * 3 * k, y + uy * 3 * k); ctx.lineTo(x - uy * 2 * k, y + ux * 2 * k); ctx.lineTo(x + uy * 2 * k, y - ux * 2 * k); ctx.fill();
      ctx.fillStyle = '#ff5d8f'; ctx.fillRect(x - ux * len - 1.5 * k, y - uy * len - 1.5 * k, 3 * k, 3 * k); }
  }
  ctx.globalAlpha = 1;
  drawSigVFX(ctx, k, ox, oy, B);
  if (typeof drawUltVFX === 'function') drawUltVFX(ctx, k, ox, oy, B);
  drawCastleVFX(ctx, k, ox, oy, B);
}

// ===== Signature projectiles: each hero throws something of its own that swells in flight and bursts on impact =====
// A projectile with o.vfx = { shape, col, col2, pw } is drawn here on the hi-res pass instead of as a pixel dot.
Object.assign(FX, {
  // a big impact: white-hot core, colored bloom, flying shards, dust and a lingering ground mark
  blast(x, y, r, cols, pw = 1, o = {}) {
    const big = 0.75 + 0.25 * pw;
    FXS.spells.push({ kind: 'blast', x, y, r: r * big, cols, pw, t: 0, life: 0.45 + 0.12 * pw });
    const ns = Math.round((o.shards == null ? 8 : o.shards) + 4 * pw);
    for (let i = 0; i < ns; i++) { const a = rand(Math.PI * 1.05, Math.PI * 1.95), sp = rand(60, 140) * big;
      FXS.spells.push({ kind: 'shard', x, y: y - 4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.9, rot: rand(0, 6), vr: rand(-14, 14), s: rand(1.5, 3) * big, col: pick(cols.slice(1)), t: 0, life: rand(0.45, 0.8) }); }
    FX.particles(x, y - 4, Math.round(14 + 12 * pw), cols, { spread: r * big, up: true, grav: 80 });
    FXS.decals.push({ kind: 'mark', x, y, r: r * 0.7 * big, col: cols[cols.length - 1], t: 0, life: 2 + pw });
    FX.shockwave(x, y, r * 1.8 * big, cols[2] || cols[1]);
    FX.shake(2 + 2.5 * pw);
  },
  // a projectile's own small burst when it lands without a custom impact
  vfxLand(p) { const v = p.o.vfx, c = [v.col2 || '#ffffff', v.col]; FX.particles(p.tx, p.ty, Math.round(8 + 4 * (v.pw || 1)), c, { spread: 12, up: true, grav: 40 });
    FXS.spells.push({ kind: 'pop', x: p.tx, y: p.ty, col: v.col, r: 6 + 3 * (v.pw || 1), t: 0, life: 0.3 }); },
  // a purely visual flight from a to b (notes, seeds, souls) that pops on arrival
  fly(sx, sy, tx, ty, shape, col, col2, pw = 1, dur = 0.45, delay = 0) { FXS.spells.push({ kind: 'fly', sx, sy, x: sx, y: sy, tx, ty, shape, col, col2, pw, t: -delay, life: dur, arc: shape === 'hawk' ? 4 : Math.hypot(tx - sx, ty - sy) * 0.25 }); },
  // a small spark at the caster's hands: the wind-up, nothing that hides the hero
  castSpark(u, col) { const hx = u.x + (u.facing || 1) * 6, hy = u.y - 12 - (u.z || 0); FX.particles(hx, hy, 8, [col, '#ffffff'], { spread: 6, up: true, grav: -30 }); },
  // a beam of light dropping onto one spot
  skyRay(x, y, col, delay = 0) { FXS.spells.push({ kind: 'ray', x, y, col, t: -delay, life: 0.55 }); },
  // bone spikes bursting out of the ground
  spikes(x, y, col, delay = 0) { FXS.spells.push({ kind: 'spike', x, y, col, h: rand(10, 16), t: -delay, life: 0.9 }); },
  // a cone of roaring sound arcs rolling forward
  roar(x, y, col, pw = 1) { for (let i = 0; i < 3 + Math.round(pw); i++) FXS.spells.push({ kind: 'arc', x, y, col, t: -i * 0.09, life: 0.55, pw }); },
  // arrows loosed straight up before they rain down
  launch(x, y, n) { for (let i = 0; i < n; i++) FXS.spells.push({ kind: 'up', x: x + rand(-3, 3), y, vx: rand(10, 40), t: -i * 0.03, life: 0.35 }); },
  // three raking claw marks
  claws(x, y, col) { FXS.spells.push({ kind: 'claw', x, y, col, t: 0, life: 0.35 }); },
});

function stepSigVFX(dt) {
  for (const s of FXS.spells) { if (s.kind === 'shard' && s.t > 0) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 260 * dt; s.rot += s.vr * dt; }
    if (s.kind === 'fly' && s.t >= 0) { const f = Math.min(1, s.t / s.life); s.x = s.sx + (s.tx - s.sx) * f; s.y = s.sy + (s.ty - s.sy) * f - Math.sin(f * Math.PI) * s.arc;
      if (s.t + dt >= s.life && !s.done) { s.done = true; FXS.spells.push({ kind: 'pop', x: s.tx, y: s.ty, col: s.col, r: 7, t: 0, life: 0.3 }); FX.particles(s.tx, s.ty, 6, [s.col, s.col2 || '#ffffff'], { spread: 8, up: true }); } }
    if (s.kind === 'up' && s.t > 0) { s.x += s.vx * dt; } }
}

// one shape, drawn at hi-res around (x,y); r is its size in screen pixels, a is the heading
function drawVfxShape(ctx, shape, x, y, r, a, col, col2, k) {
  const glow = (rr, c) => { const gr = ctx.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.3, col2 || '#ffffff'); gr.addColorStop(0.6, c); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill(); };
  ctx.save(); ctx.lineJoin = 'round';
  switch (shape) {
    case 'disc': { ctx.globalAlpha = 0.6; glow(r * 2, col); ctx.globalAlpha = 1; ctx.translate(x, y); ctx.scale(Math.abs(Math.cos(FXS.clock * 18)) * 0.7 + 0.3, 1);
      ctx.fillStyle = OUTLINE; ctx.beginPath(); ctx.arc(0, 0, r * 1.15, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = col2; ctx.beginPath(); ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2); ctx.fill(); break; }
    case 'dagger': { ctx.translate(x, y); ctx.rotate(FXS.clock * 30); ctx.fillStyle = OUTLINE; ctx.fillRect(-r * 1.3, -r * 0.35, r * 2.6, r * 0.7); ctx.fillStyle = '#e8eefc'; ctx.beginPath(); ctx.moveTo(r * 1.2, 0); ctx.lineTo(-r * 0.2, -r * 0.25); ctx.lineTo(-r * 0.2, r * 0.25); ctx.fill();
      ctx.fillStyle = col; ctx.fillRect(-r * 1.1, -r * 0.2, r * 0.9, r * 0.4); break; }
    case 'rune': { ctx.globalAlpha = 0.7; glow(r * 2.2, col); ctx.globalAlpha = 1; ctx.translate(x, y); ctx.rotate(FXS.clock * 4); ctx.fillStyle = OUTLINE; ctx.fillRect(-r, -r, r * 2, r * 2); ctx.fillStyle = col; ctx.fillRect(-r * 0.8, -r * 0.8, r * 1.6, r * 1.6);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = r * 0.25; ctx.beginPath(); ctx.moveTo(-r * 0.4, -r * 0.5); ctx.lineTo(0, r * 0.5); ctx.lineTo(r * 0.4, -r * 0.5); ctx.stroke(); break; }
    case 'note': { ctx.fillStyle = OUTLINE; ctx.beginPath(); ctx.ellipse(x, y, r * 0.9, r * 0.65, -0.4, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(x + r * 0.45, y - r * 2.4, r * 0.55, r * 2.4);
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, r * 0.65, r * 0.45, -0.4, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(x + r * 0.55, y - r * 2.3, r * 0.3, r * 2.2); ctx.fillRect(x + r * 0.55, y - r * 2.3, r, r * 0.4); break; }
    case 'seed': case 'lily': { ctx.globalAlpha = 0.55; glow(r * 2, col); ctx.globalAlpha = 1; ctx.translate(x, y); ctx.rotate(FXS.clock * 6);
      for (let i = 0; i < 5; i++) { ctx.rotate(Math.PI * 2 / 5); ctx.fillStyle = OUTLINE; ctx.beginPath(); ctx.ellipse(0, -r * 0.7, r * 0.5, r * 0.85, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = i % 2 ? col : (col2 || '#ffffff'); ctx.beginPath(); ctx.ellipse(0, -r * 0.7, r * 0.35, r * 0.7, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2); ctx.fill(); break; }
    case 'skull': { ctx.globalAlpha = 0.6; glow(r * 2.2, col); ctx.globalAlpha = 1; ctx.fillStyle = OUTLINE; ctx.fillRect(x - r, y - r, r * 2, r * 1.8); ctx.fillStyle = '#f1ecdc'; ctx.fillRect(x - r * 0.8, y - r * 0.8, r * 1.6, r * 1.2); ctx.fillRect(x - r * 0.5, y + r * 0.4, r, r * 0.3);
      ctx.fillStyle = col; ctx.fillRect(x - r * 0.55, y - r * 0.35, r * 0.4, r * 0.4); ctx.fillRect(x + r * 0.15, y - r * 0.35, r * 0.4, r * 0.4); break; }
    case 'cannon': { ctx.fillStyle = OUTLINE; ctx.beginPath(); ctx.arc(x, y, r * 1.15, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#4a4a5e'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#a8a8c0'; ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.7 + 0.3 * Math.sin(FXS.clock * 50); ctx.translate(x - Math.cos(a) * r, y - Math.sin(a) * r); glowAt(ctx, 0, 0, r * 0.9, '#ffd23a'); break; }
    case 'hawk': { ctx.translate(x, y); ctx.rotate(a); const fl = Math.sin(FXS.clock * 30) * r * 0.9; ctx.fillStyle = OUTLINE; ctx.beginPath(); ctx.moveTo(r * 1.4, 0); ctx.lineTo(-r * 0.4, -r * 0.3 - fl); ctx.lineTo(-r * 1.2, 0); ctx.lineTo(-r * 0.4, r * 0.3 + fl); ctx.closePath(); ctx.fill();
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(r * 1.1, 0); ctx.lineTo(-r * 0.4, -r * 0.15 - fl * 0.85); ctx.lineTo(-r * 0.9, 0); ctx.lineTo(-r * 0.4, r * 0.15 + fl * 0.85); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.fillRect(r * 0.6, -r * 0.15, r * 0.3, r * 0.3); break; }
    case 'bolt': { glow(r * 2.4, col); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1, r * 0.22);
      for (let i = 0; i < 4; i++) { let px = x, py = y; ctx.beginPath(); ctx.moveTo(px, py); const b = rand(0, Math.PI * 2); for (let j = 0; j < 3; j++) { px += Math.cos(b + rand(-0.7, 0.7)) * r * 0.9; py += Math.sin(b + rand(-0.7, 0.7)) * r * 0.9; ctx.lineTo(px, py); } ctx.stroke(); } break; }
    case 'rocket': { ctx.translate(x, y); ctx.rotate(a); ctx.globalAlpha = 0.8; glowAt(ctx, -r * 1.6, 0, r * 1.4, col2); ctx.globalAlpha = 1;
      ctx.fillStyle = OUTLINE; ctx.fillRect(-r * 1.4, -r * 0.6, r * 2.4, r * 1.2); ctx.beginPath(); ctx.moveTo(r * 1.0, -r * 0.6); ctx.lineTo(r * 1.8, 0); ctx.lineTo(r * 1.0, r * 0.6); ctx.fill();
      ctx.fillStyle = '#d8dce8'; ctx.fillRect(-r * 1.2, -r * 0.4, r * 2.2, r * 0.8); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(r * 0.9, -r * 0.4); ctx.lineTo(r * 1.5, 0); ctx.lineTo(r * 0.9, r * 0.4); ctx.fill();
      ctx.fillStyle = col; ctx.fillRect(-r * 1.4, -r * 0.9, r * 0.5, r * 1.8); ctx.fillStyle = '#ffffff'; ctx.fillRect(-r * 0.6, -r * 0.4, r * 0.3, r * 0.8);
      for (let i = 0; i < 3; i++) { ctx.globalAlpha = 0.8 - i * 0.25; ctx.fillStyle = i ? col : '#ffffff'; ctx.beginPath(); ctx.arc(-r * (1.8 + i * 0.7) + rand(-1, 1), rand(-1, 1) * r * 0.3, r * (0.5 - i * 0.1), 0, Math.PI * 2); ctx.fill(); } break; }
    default: { glow(r * 2.2, col); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y, r * 0.5, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.restore();
}
function glowAt(ctx, x, y, rr, c) { const gr = ctx.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.4, c); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill(); }

function drawSigVFX(ctx, k, ox, oy, B) {
  const X = x => x * k + ox, Y = y => y * k + oy;
  // signature projectiles in flight: a fading trail behind, the shape swelling as it closes in
  if (B) for (const p of B.projs) if (p.o && p.o.vfx) { const v = p.o.vfx, pw = v.pw || 1, grow = 0.55 + 0.75 * (p.k || 0), r = (2.2 + 1.1 * pw) * k * grow * (v.size || 1), a = Math.atan2(p.ty - p.sy, p.tx - p.sx);
    p.trail = p.trail || []; p.trail.push([p.x, p.y]); if (p.trail.length > 10) p.trail.shift();
    for (let i = 0; i < p.trail.length - 1; i++) { const f = i / p.trail.length; ctx.globalAlpha = 0.45 * f; ctx.fillStyle = i % 2 ? v.col : (v.col2 || '#ffffff'); ctx.beginPath(); ctx.arc(X(p.trail[i][0]), Y(p.trail[i][1]), r * (0.3 + 0.6 * f), 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1; drawVfxShape(ctx, v.shape, X(p.x), Y(p.y), r, a, v.col, v.col2, k); }
  for (const s of FXS.spells) { if (s.t < 0) continue; const kk = Math.min(1, s.t / s.life);
    if (s.kind === 'blast') { const grow = Math.min(1, s.t / 0.08), rr = s.r * k * 0.62 * (0.35 + 0.65 * grow) * (1 + 0.25 * kk), x = X(s.x), y = Y(s.y) - rr * 0.35, c = s.cols;
      // crisp, hard-edged layers that burn out from the middle: outer color, hot ring, white core
      const ring = (r0, col, al) => { ctx.globalAlpha = al; ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, r0, r0 * 0.82, 0, 0, Math.PI * 2); ctx.fill(); };
      ring(rr, c[2] || c[1], 0.75 * (1 - kk)); ring(rr * (0.78 - 0.5 * kk), c[1], 0.9 * (1 - kk)); if (kk < 0.5) ring(rr * (0.5 - kk * 0.9), '#ffffff', 1 - kk * 2);
      ctx.globalAlpha = 0.9 * (1 - kk); ctx.strokeStyle = OUTLINE; ctx.lineWidth = 1.2 * k; ctx.beginPath(); ctx.ellipse(x, y, rr, rr * 0.82, 0, 0, Math.PI * 2); ctx.stroke();
      if (kk < 0.35) { ctx.globalAlpha = 1 - kk / 0.35; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5 * k; for (let i = 0; i < 8 + 2 * s.pw; i++) { const an = i * 2.4 + s.x, d0 = rr * 0.9, d1 = rr * (1.3 + 0.4 * Math.sin(i)); ctx.beginPath(); ctx.moveTo(x + Math.cos(an) * d0, y + Math.sin(an) * d0 * 0.8); ctx.lineTo(x + Math.cos(an) * d1, y + Math.sin(an) * d1 * 0.8); ctx.stroke(); } } }
    else if (s.kind === 'shard') { ctx.globalAlpha = 1 - kk; ctx.save(); ctx.translate(X(s.x), Y(s.y)); ctx.rotate(s.rot); ctx.fillStyle = OUTLINE; ctx.fillRect(-s.s * k * 0.7, -s.s * k * 0.45, s.s * k * 1.4, s.s * k * 0.9); ctx.fillStyle = s.col; ctx.fillRect(-s.s * k * 0.5, -s.s * k * 0.3, s.s * k, s.s * k * 0.6); ctx.restore(); }
    else if (s.kind === 'pop') { ctx.globalAlpha = 1 - kk; ctx.strokeStyle = s.col; ctx.lineWidth = 2 * k * (1 - kk); ctx.beginPath(); ctx.arc(X(s.x), Y(s.y), s.r * k * (0.4 + kk), 0, Math.PI * 2); ctx.stroke(); }
    else if (s.kind === 'fly' && !s.done) { const a = Math.atan2(s.ty - s.sy, s.tx - s.sx), r = (2.4 + 0.8 * s.pw) * k * (0.6 + 0.6 * kk); ctx.globalAlpha = 1; drawVfxShape(ctx, s.shape, X(s.x), Y(s.y), r, a, s.col, s.col2, k); }
    else if (s.kind === 'ray') { const x = X(s.x), y = Y(s.y), w = 7 * k * (1 - kk * 0.6), h = Math.min(1, s.t / 0.08) * y;
      const gr = ctx.createLinearGradient(0, y - h, 0, y); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.6, s.col); gr.addColorStop(1, '#ffffff');
      ctx.globalAlpha = 0.85 * (1 - kk); ctx.fillStyle = gr; ctx.fillRect(x - w / 2, y - h, w, h); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - w * 0.15, y - h, w * 0.3, h);
      ctx.globalAlpha = 0.6 * (1 - kk); ctx.fillStyle = s.col; ctx.beginPath(); ctx.ellipse(x, y, w * 1.6, w * 0.5, 0, 0, Math.PI * 2); ctx.fill(); }
    else if (s.kind === 'spike') { const up = kk < 0.15 ? kk / 0.15 : kk > 0.75 ? 1 - (kk - 0.75) / 0.25 : 1, x = X(s.x), y = Y(s.y), h = s.h * k * up, w = 3 * k;
      ctx.globalAlpha = 1; ctx.fillStyle = OUTLINE; ctx.beginPath(); ctx.moveTo(x - w - k, y); ctx.lineTo(x, y - h - k); ctx.lineTo(x + w + k, y); ctx.fill(); ctx.fillStyle = s.col; ctx.beginPath(); ctx.moveTo(x - w, y); ctx.lineTo(x, y - h); ctx.lineTo(x + w, y); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x - k * 0.5, y - h * 0.8, k, h * 0.5); }
    else if (s.kind === 'arc') { const x = X(s.x), y = Y(s.y), rr = (10 + 90 * kk) * k * (0.8 + 0.2 * s.pw); ctx.globalAlpha = 0.85 * (1 - kk); ctx.strokeStyle = s.col; ctx.lineWidth = (4 - 3 * kk) * k;
      ctx.beginPath(); ctx.ellipse(x, y, rr, rr * 0.7, 0, -0.75, 0.75); ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = k; ctx.beginPath(); ctx.ellipse(x, y, rr, rr * 0.7, 0, -0.6, 0.6); ctx.stroke(); }
    else if (s.kind === 'up') { const x = X(s.x), y = Y(s.y) - kk * 140 * k; ctx.globalAlpha = 1 - kk * 0.5; ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 1.4 * k; ctx.beginPath(); ctx.moveTo(x, y + 10 * k); ctx.lineTo(x, y); ctx.stroke(); ctx.fillStyle = '#e8eefc'; ctx.beginPath(); ctx.moveTo(x, y - 3 * k); ctx.lineTo(x - 2 * k, y + k); ctx.lineTo(x + 2 * k, y + k); ctx.fill();
      ctx.globalAlpha = 0.35 * (1 - kk); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = k; ctx.beginPath(); ctx.moveTo(x, y + 12 * k); ctx.lineTo(x, y + 34 * k); ctx.stroke(); }
    else if (s.kind === 'claw') { const x = X(s.x), y = Y(s.y), L = 22 * k * Math.min(1, kk * 4); ctx.globalAlpha = 1 - kk; for (let i = -1; i <= 1; i++) { ctx.strokeStyle = OUTLINE; ctx.lineWidth = 4 * k; ctx.beginPath(); ctx.moveTo(x - L / 2 + i * 5 * k, y - L / 2); ctx.lineTo(x + L / 2 + i * 5 * k, y + L / 2); ctx.stroke();
      ctx.strokeStyle = i ? s.col : '#ffffff'; ctx.lineWidth = 2 * k; ctx.beginPath(); ctx.moveTo(x - L / 2 + i * 5 * k, y - L / 2); ctx.lineTo(x + L / 2 + i * 5 * k, y + L / 2); ctx.stroke(); } }
  }
  ctx.globalAlpha = 1;
}

// ===== Castle powers: a big, readable moment for each element =====
// Every cast lights the keep, tints the field in the element's color and then plays its own show on the hi-res pass.
const CP_SRC = { x: 52, y: 70 };   // roughly the top of the keep
Object.assign(FX, {
  castlePower(kind, x, y, cols, B) {
    const live = B ? B.enemies.filter(e => e.alive) : [];
    FXS.spells.push({ kind: 'cpTint', col: cols[0], t: 0, life: 1.1 });
    FXS.spells.push({ kind: 'cpKeep', col: cols[0], col2: cols[1], t: 0, life: 0.9 });
    FX.particles(CP_SRC.x, CP_SRC.y, 30, cols, { spread: 16, up: true, grav: -20 });
    FX.shake(8); FX.flash(cols[0], 0.25);
    switch (kind) {
      case 'execute': FXS.spells.push({ kind: 'cpTint', col: '#1a0a2a', t: 0, life: 1.2 }); live.slice(0, 40).forEach((e, i) => FXS.spells.push({ kind: 'cpHand', u: e, x: e.x, y: e.y, t: -0.04 * (i % 10), life: 0.9, fn: () => FX.particles(e.x, e.y - 10, 10, ['#c05aff', '#2a1446', '#ffffff'], { spread: 10, up: true }) })); break;
      case 'beam': for (let i = 0; i < 5; i++) FXS.spells.push({ kind: 'cpLance', y: GRID.y + 2 + i * 30, col: cols[0], t: -i * 0.05, life: 0.75 }); break;
      case 'bolts': FXS.spells.push({ kind: 'cpCoil', col: cols[0], t: 0, life: 1.1 }); for (let i = 0; i < 14 && live.length; i++) { const e = pick(live); FXS.spells.push({ kind: 'cpZap', u: e, x: e.x, y: e.y, col: cols[0], t: -0.05 * i, life: 0.22, fn: () => FX.blast(e.x, e.y, 14, ['#ffffff', '#e8f8ff', cols[0], cols[1]], 1, { shards: 4 }) }); } break;
      case 'firewave': case 'flood': { const w = B && B.waves[B.waves.length - 1]; if (w) FXS.spells.push({ kind: kind === 'flood' ? 'cpCrest' : 'cpFlame', w, t: 0, life: w.life }); break; }
      case 'freeze': FXS.spells.push({ kind: 'cpFrost', t: 0, life: 2.6 }); live.slice(0, 60).forEach(e => FXS.spells.push({ kind: 'cpIce', u: e, t: -Math.random() * 0.12, life: e.boss ? 0.8 : 2.5 })); break;
      case 'roots': live.filter(e => e.x < CASTLE_X + 200).slice(0, 40).forEach((e, i) => { for (let j = 0; j < 3; j++) FXS.spells.push({ kind: 'cpVine', x: e.x + (j - 1) * 5, y: e.y + 2, h: rand(14, 22), t: -0.03 * i - j * 0.05, life: 2 }); });
        if (B) B.heroes.filter(h => h.alive).forEach((h, i) => FX.skyRay(h.x, h.y, '#7cf09a', i * 0.05)); break;
      case 'vortex': FXS.spells.push({ kind: 'cpHole', x, y, t: 0, life: 1.3 }); break;
      case 'salt': FXS.spells.push({ kind: 'cpCannon', col: '#ffffff', t: 0, life: 0.6 }, { kind: 'cpStream', col: '#ffffff', col2: '#c9d8f0', t: 0, life: 0.7 });
        live.slice(0, 30).forEach((e, i) => FXS.spells.push({ kind: 'cpLater', t: -0.15 - i * 0.012, life: 0.01, fn: () => { FX.blast(e.x, e.y, 12, ['#ffffff', '#ffffff', '#e8eef8', '#9aa8c8'], 0.8, { shards: 5 }); } })); break;
      case 'candy': live.slice(0, 30).forEach((e, i) => { const c = pick(['#ff8ad8', '#5fd3ff', '#ffd84a', '#7cf09a']); FX.fly(CP_SRC.x, CP_SRC.y, e.x, e.y - 4, 'disc', c, '#ffffff', 1.8, 0.5, i * 0.02); FXS.spells.push({ kind: 'cpLater', t: -0.5 - i * 0.02, life: 0.01, fn: () => FX.blast(e.x, e.y, 10, ['#ffffff', c, c, '#ffffff'], 0.8, { shards: 4 }) }); FXS.decals.push({ kind: 'mark', x: e.x, y: e.y, r: 8, col: c, t: -0.5, life: 4 }); }); FXS.spells.push({ kind: 'cpCannon', col: '#ff8ad8', t: 0, life: 0.5 }); break;
      case 'ham': FXS.spells.push({ kind: 'cpCannon', col: '#ffd0b0', t: 0, life: 0.5 }); break;
      case 'pinata': FXS.spells.push({ kind: 'cpPinata', x: W / 2 + 30, y: 120, t: 0, life: 0.9, burst: false }); break;
    }
  },
});

function stepCastleVFX(dt) {
  for (const s of FXS.spells) {
    if (s.fn && !s.fired && s.t >= 0) { s.fired = true; s.fn(); }
    if (s.kind === 'cpPinata' && !s.burst && s.t > 0.55) { s.burst = true; const cs = ['#ff8ad8', '#5fd3ff', '#ffd84a', '#7cf09a', '#ff6a3d', '#ffffff'];
      FX.blast(s.x, s.y, 30, cs, 2, { shards: 20 }); for (let i = 0; i < 5; i++) FX.particles(s.x + rand(-30, 30), s.y + rand(-10, 10), 16, cs, { spread: 30, up: true, grav: 60 });
      for (let i = 0; i < 18; i++) FX.fly(s.x, s.y, rand(GRID.x + 20, W - 20), rand(GRID.y + 10, GRID.y + GRID.rows * GRID.ch), 'disc', '#ffcf3a', '#fff3a0', 0.6, rand(0.35, 0.6), 0); FX.shake(8); }
    if (s.kind === 'cpIce' && s.t + dt >= s.life && !s.done && s.u.alive) { s.done = true; FX.particles(s.u.x, s.u.y - 8, 10, ['#e8f8ff', '#9ad8ff', '#ffffff'], { spread: 10, up: true, grav: 120 }); }
  }
}

function drawCastleVFX(ctx, k, ox, oy, B) {
  const X = x => x * k + ox, Y = y => y * k + oy, now = FXS.clock;
  for (const s of FXS.spells) { if (s.t < 0 || s.kind.slice(0, 2) !== 'cp') continue; const kk = Math.min(1, s.t / s.life), fade = 1 - kk;
    ctx.save();
    switch (s.kind) {
      case 'cpTint': { ctx.globalAlpha = 0.28 * fade * fade; ctx.fillStyle = s.col; ctx.fillRect(X(0), Y(0), W * k, H * k); break; }
      case 'cpKeep': { // the keep blazes and shoots a column of light into the sky
        const x = X(CP_SRC.x), y = Y(CP_SRC.y), up = Math.min(1, s.t / 0.12), r = 46 * k * (0.6 + 0.6 * up);
        let gr = ctx.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.35, s.col2 || s.col); gr.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = fade; ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        const w = 18 * k * fade; gr = ctx.createLinearGradient(0, Y(-10), 0, y); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, s.col);
        ctx.globalAlpha = 0.8 * fade; ctx.fillStyle = gr; ctx.fillRect(x - w / 2, Y(-10), w, y - Y(-10)); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - w / 6, Y(-10), w / 3, y - Y(-10)); break; }
      case 'cpHand': { // a shadow hand bursts from the ground and closes over the foe
        const x = X(s.u.alive ? s.u.x : s.x), y = Y(s.u.alive ? s.u.y : s.y) + 2 * k, rise = Math.min(1, s.t / 0.25), h = 40 * k * rise * (kk > 0.7 ? (1 - kk) / 0.3 : 1), grip = Math.min(1, Math.max(0, (s.t - 0.25) / 0.2));
        ctx.globalAlpha = 0.5; ctx.fillStyle = '#1a0a2a'; ctx.beginPath(); ctx.ellipse(x, y, 10 * k, 3.5 * k, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1; ctx.fillStyle = '#2a1446'; ctx.fillRect(x - 3.5 * k, y - h * 0.6, 7 * k, h * 0.6);
        ctx.strokeStyle = '#2a1446'; ctx.lineWidth = 2.6 * k; ctx.lineCap = 'round';
        for (let f = 0; f < 4; f++) { const bx = x + (f - 1.5) * 3 * k, by = y - h * 0.6, a = -Math.PI / 2 + (f - 1.5) * (0.5 - 0.45 * grip); ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(a) * h * 0.5, by + Math.sin(a) * h * 0.5); ctx.stroke(); }
        ctx.fillStyle = '#c05aff'; ctx.globalAlpha = 0.9 * fade; ctx.fillRect(x - 1.5 * k, y - h * 0.5, 1.2 * k, 1.2 * k); ctx.fillRect(x + 1 * k, y - h * 0.5, 1.2 * k, 1.2 * k); break; }
      case 'cpLance': { // a holy lance sweeps out from the wall along one lane
        const grow = Math.min(1, s.t / 0.15), x0 = X(CASTLE_X), x1 = X(CASTLE_X) + (W - CASTLE_X + 20) * k * grow, y = Y(s.y), th = 14 * k * (kk < 0.2 ? kk / 0.2 : 1 - (kk - 0.2) / 0.8);
        const gr = ctx.createLinearGradient(0, y - th, 0, y + th); gr.addColorStop(0, 'rgba(255,240,170,0)'); gr.addColorStop(0.35, s.col); gr.addColorStop(0.5, '#ffffff'); gr.addColorStop(0.65, s.col); gr.addColorStop(1, 'rgba(255,240,170,0)');
        ctx.globalAlpha = 0.95; ctx.fillStyle = gr; ctx.fillRect(x0, y - th, x1 - x0, th * 2);
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x1, y, th * 0.9, 0, Math.PI * 2); ctx.fill(); break; }
      case 'cpCoil': { // the towers crackle with arcs before the bolts fly
        ctx.strokeStyle = s.col; ctx.lineWidth = 2 * k; ctx.globalAlpha = fade;
        for (let i = 0; i < 5; i++) { let px = X(CP_SRC.x + rand(-20, 20)), py = Y(CP_SRC.y - 20); ctx.beginPath(); ctx.moveTo(px, py); for (let j = 0; j < 4; j++) { px += rand(-8, 8) * k; py -= rand(4, 10) * k; ctx.lineTo(px, py); } ctx.stroke(); }
        ctx.globalAlpha = 0.5 * fade; ctx.fillStyle = '#e8f8ff'; ctx.beginPath(); ctx.arc(X(CP_SRC.x), Y(CP_SRC.y - 20), 22 * k * (1 + 0.2 * Math.sin(now * 50)), 0, Math.PI * 2); ctx.fill(); break; }
      case 'cpFlame': case 'cpCrest': { const w = s.w; if (!w || w.t >= w.life) break; const x = X(w.x), flood = s.kind === 'cpCrest', top = Y(GRID.y - 12), bot = Y(GRID.y + GRID.rows * GRID.ch + 10);
        for (let yy = top; yy < bot; yy += 7 * k) { const n = Math.sin(yy * 0.05 + now * 14), hgt = (flood ? 26 : 30) * k * (0.7 + 0.3 * n);
          if (flood) { // a curling wall of water with foam on the lip
            ctx.globalAlpha = 0.85; ctx.fillStyle = '#2a7ad8'; ctx.beginPath(); ctx.moveTo(x - 30 * k, yy + 4 * k); ctx.quadraticCurveTo(x - 6 * k, yy - hgt, x + 8 * k, yy - hgt * 0.7); ctx.quadraticCurveTo(x + 2 * k, yy - hgt * 0.3, x + 4 * k, yy + 4 * k); ctx.fill();
            ctx.fillStyle = '#5fd3ff'; ctx.beginPath(); ctx.moveTo(x - 16 * k, yy + 4 * k); ctx.quadraticCurveTo(x - 2 * k, yy - hgt * 0.8, x + 8 * k, yy - hgt * 0.7); ctx.lineTo(x + 2 * k, yy + 4 * k); ctx.fill();
            ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x + 6 * k, yy - hgt * 0.72, 3 * k, 0, Math.PI * 2); ctx.fill(); }
          else { // tall flame tongues riding the wave front
            const gr = ctx.createLinearGradient(0, yy - hgt, 0, yy + 4 * k); gr.addColorStop(0, 'rgba(255,61,45,0)'); gr.addColorStop(0.3, '#ff3d2d'); gr.addColorStop(0.6, '#ff8a2a'); gr.addColorStop(1, '#fff3a0');
            ctx.globalAlpha = 0.9; ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x - 14 * k, yy + 4 * k); ctx.quadraticCurveTo(x - 4 * k + n * 4 * k, yy - hgt, x + 2 * k, yy - hgt * 1.1); ctx.quadraticCurveTo(x + 6 * k, yy - hgt * 0.4, x + 8 * k, yy + 4 * k); ctx.fill(); } }
        if (Math.random() < 0.8) FX.particles(w.x + rand(-6, 6), rand(GRID.y, GRID.y + GRID.rows * GRID.ch), 3, flood ? ['#ffffff', '#bff4ff'] : ['#ffd23a', '#ff8a2a'], { spread: 6, up: true });
        break; }
      case 'cpFrost': { const a = 0.35 * (kk < 0.1 ? kk / 0.1 : fade); ctx.globalAlpha = a; ctx.fillStyle = '#bfeeff'; ctx.fillRect(X(CASTLE_X), Y(GRID.y - 20), (W - CASTLE_X) * k, (GRID.rows * GRID.ch + 40) * k);
        ctx.globalAlpha = a * 1.6; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = k; for (let i = 0; i < 8; i++) { const cx = X(CASTLE_X + 20 + i * 45), cy = Y(GRID.y + 8 + (i % 3) * 50); for (let j = 0; j < 3; j++) { const ang = j * Math.PI / 3; ctx.beginPath(); ctx.moveTo(cx - Math.cos(ang) * 6 * k, cy - Math.sin(ang) * 6 * k); ctx.lineTo(cx + Math.cos(ang) * 6 * k, cy + Math.sin(ang) * 6 * k); ctx.stroke(); } } break; }
      case 'cpIce': { const u = s.u; if (!u.alive) break; const sz = (u.boss ? 30 : 16) * (u.scale || 1) * k, x = X(u.x), y = Y(u.y) + 2 * k, grow = Math.min(1, s.t / 0.12);
        ctx.globalAlpha = 0.55 * (kk > 0.85 ? (1 - kk) / 0.15 : 1); ctx.fillStyle = '#9ad8ff'; ctx.fillRect(x - sz / 2 * grow, y - sz * grow, sz * grow, sz * grow);
        ctx.globalAlpha *= 1.4; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5 * k; ctx.strokeRect(x - sz / 2 * grow, y - sz * grow, sz * grow, sz * grow); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - sz / 2 * grow + 2 * k, y - sz * grow + 2 * k, sz * 0.25, 2 * k); break; }
      case 'cpVine': { const up = kk < 0.1 ? kk / 0.1 : kk > 0.8 ? (1 - kk) / 0.2 : 1, x = X(s.x), y = Y(s.y), h = s.h * k * up, sw = Math.sin(now * 6 + s.x) * 3 * k;
        ctx.strokeStyle = '#2a7a3a'; ctx.lineWidth = 3 * k; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + sw * 2, y - h * 0.5, x + sw, y - h); ctx.stroke();
        ctx.strokeStyle = '#7cf09a'; ctx.lineWidth = 1.2 * k; ctx.stroke(); ctx.fillStyle = '#9be05a'; ctx.beginPath(); ctx.ellipse(x + sw * 1.5 + 2 * k, y - h * 0.55, 2.5 * k, 1.2 * k, -0.5, 0, Math.PI * 2); ctx.fill(); break; }
      case 'cpHole': { // a black hole: grows, spins its accretion ring, then collapses with a pop
        const x = X(s.x), y = Y(s.y), sz = (kk < 0.2 ? kk / 0.2 : kk > 0.8 ? (1 - kk) / 0.2 : 1) * 34 * k;
        for (let i = 0; i < 3; i++) { ctx.globalAlpha = 0.7 - i * 0.18; ctx.strokeStyle = ['#ff5dd8', '#a86ad8', '#5a2a9e'][i]; ctx.lineWidth = (4 - i) * k; ctx.beginPath(); ctx.ellipse(x, y, sz * (1.3 + i * 0.35), sz * (0.45 + i * 0.12), now * (3 + i), 0, Math.PI * 1.6); ctx.stroke(); }
        ctx.globalAlpha = 1; const gr = ctx.createRadialGradient(x, y, 0, x, y, sz); gr.addColorStop(0, '#000000'); gr.addColorStop(0.7, '#0a0014'); gr.addColorStop(1, 'rgba(168,106,216,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, sz, 0, Math.PI * 2); ctx.fill();
        if (Math.random() < 0.7) { const a = rand(0, 6.28), r = rand(40, 70); FXS.parts.push({ x: s.x + Math.cos(a) * r, y: s.y + Math.sin(a) * r * 0.5, vx: -Math.cos(a) * r * 2, vy: -Math.sin(a) * r, life: 0.5, t: 0, color: pick(['#ff5dd8', '#a86ad8', '#ffffff']), size: 1, grav: 0 }); }
        break; }
      case 'cpZap': { const x = X(s.u.alive ? s.u.x : s.x), y = Y(s.u.alive ? s.u.y : s.y) - 8 * k; let px = x + rand(-20, 20) * k, py = Y(-10);
        ctx.globalAlpha = fade; ctx.strokeStyle = s.col; ctx.lineWidth = 4 * k; ctx.lineJoin = 'miter'; ctx.beginPath(); ctx.moveTo(px, py); const n = 6; for (let i = 1; i <= n; i++) { const f = i / n; ctx.lineTo(px + (x - px) * f + (i < n ? rand(-9, 9) * k : 0), py + (y - py) * f); } ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5 * k; ctx.stroke(); break; }
      case 'cpStream': { // a fat arc of salt pouring from the wall across the field
        const grow = Math.min(1, s.t / 0.25), x0 = X(CASTLE_X), y0 = Y(CP_SRC.y + 30), x1 = X(CASTLE_X + (W - CASTLE_X) * grow), y1 = Y(GRID.y + 60);
        ctx.globalAlpha = 0.85 * fade; ctx.strokeStyle = s.col2; ctx.lineWidth = 22 * k; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, Y(10), x1, y1); ctx.stroke();
        ctx.strokeStyle = s.col; ctx.lineWidth = 10 * k; ctx.stroke();
        for (let i = 0; i < 6; i++) FXS.parts.push({ x: CASTLE_X + rand(0, (W - CASTLE_X) * grow), y: rand(20, 60), vx: rand(-10, 10), vy: rand(60, 120), life: rand(0.4, 0.8), t: 0, color: pick(['#ffffff', '#e8eef8']), size: 2, grav: 120 });
        break; }
      case 'cpCannon': { // muzzle blast from the wall
        const x = X(CASTLE_X + 4), y = Y(CP_SRC.y + 30), r = 26 * k * (0.5 + kk); ctx.globalAlpha = fade; const gr = ctx.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.5, s.col); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); break; }
      case 'cpPinata': { if (s.burst) break; // a piñata swings down on a rope, then bursts
        const drop = Math.min(1, s.t / 0.3), x = X(s.x) + Math.sin(now * 12) * 6 * k * drop, y = Y(s.y) - (1 - drop) * 140 * k, cs = ['#ff8ad8', '#5fd3ff', '#ffd84a', '#7cf09a', '#ff6a3d'];
        ctx.strokeStyle = '#c9b48a'; ctx.lineWidth = k; ctx.beginPath(); ctx.moveTo(X(s.x), Y(-10)); ctx.lineTo(x, y - 14 * k); ctx.stroke();
        for (let i = 0; i < 5; i++) { ctx.fillStyle = cs[i]; ctx.fillRect(x - 16 * k, y - 14 * k + i * 4 * k, 26 * k, 4 * k); }
        ctx.fillStyle = cs[0]; ctx.fillRect(x + 8 * k, y - 22 * k, 8 * k, 10 * k); ctx.fillRect(x + 10 * k, y - 28 * k, 2 * k, 6 * k);
        for (const lx of [-13, -6, 2, 8]) { ctx.fillStyle = cs[(lx + 13) % 5 | 0]; ctx.fillRect(x + lx * k, y + 6 * k, 3 * k, 8 * k); }
        ctx.fillStyle = '#1a1a2a'; ctx.fillRect(x + 12 * k, y - 20 * k, 2 * k, 2 * k); break; }
    }
    ctx.restore();
  }
}
