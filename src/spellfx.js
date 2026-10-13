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
  surge(n) { for (let i = 0; i < 40 + Math.min(80, n); i++) FXS.parts.push({ x: W + rand(-6, 10), y: rand(GRID.y - 10, GRID.y + GRID.rows * GRID.cell + 10), vx: -rand(40, 110), vy: rand(-8, 4), life: rand(0.8, 1.6), t: 0, color: pick(['#c9b48a', '#a8916a', '#8a7a5a']), size: 2, grav: 0 });
    FX.flash('#ff3d6e', 0.15); },
  // one tick of arrow rain: real arrows dive in from the sky at an angle and stick in the ground
  arrowStorm(x, y, r, pw = 1) {
    const n = Math.round(5 + 4 * pw);
    for (let i = 0; i < n; i++) { const tx = x + rand(-r, r), ty = y + rand(-r, r) * 0.55, d = rand(0.16, 0.3);
      FXS.spells.push({ kind: 'arrow', sx: tx - 46, sy: ty - 150, x: tx, y: ty, t: -rand(0, 0.12), life: d, gold: pw > 2 && Math.random() < 0.3 }); }
  },
});

function stepSpellFX(dt) {
  stepSigVFX(dt);
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
