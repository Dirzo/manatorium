// ===== Ultimates: Cinder Colossus, Glacier Lance, Grasp of the Crypt, Tempest Cage, Rocket Barrage, Lotus Sanctuary =====
// The sim keeps each ultimate as a B.zones entry of type 'ult' with a `vis` kind; this file draws them.
// Ground layers draw pixel-sized under units (drawUltGround), tall layers draw on the hi-res pass (drawUltVFX).
// Every one grows with rarity (z.rar 0..5): bigger, more pieces, richer colors, and a God-tier flourish.
const ULT_FIRE = ['#ffffff', '#fff3a0', '#ffd23a', '#ff8a2a', '#ff3d2d', '#8a1a2a'];
const ULT_GOD = ['#ffffff', '#fff3a0', '#ffb0e8', '#a8f0ff'];
const rarCol = r => RARITY[r || 0].col;

Object.assign(FX, {
  ultImpact(x, y, r, kind, rar = 0) {
    const big = 1 + 0.15 * rar;
    switch (kind) {
      case 'colossus': FX.blast(x, y, r, rar >= 5 ? ['#ffffff', '#fff3a0', '#ffd84a', '#ff8a2a'] : ['#ffffff', '#ffd23a', '#ff8a2a', '#5a2a1a'], 1.5 + 0.3 * rar, { shards: 14 + 3 * rar });
        FX.fireburst(x, y, r * 0.7, 1 + 0.3 * rar); for (let i = 0; i < 10 + 3 * rar; i++) FXS.spells.push({ kind: 'urock', x, y: y - 6, vx: rand(-90, 90) * big, vy: -rand(60, 150), s: rand(2, 4), t: 0, life: rand(0.6, 1) });
        FXS.decals.push({ kind: 'crater', x, y, r: r * 0.5, t: 0, life: 4 + rar }); FX.shake(9 + 2 * rar); FX.flash('#ff8a3a', 0.25); FX.hitstop(0.08); break;
      case 'colossusGone': for (let i = 0; i < 14; i++) FXS.spells.push({ kind: 'urock', x: x + rand(-10, 10), y: y - rand(4, 30), vx: rand(-40, 40), vy: -rand(10, 60), s: rand(2, 4), t: 0, life: rand(0.5, 0.9) });
        FX.puff(x, y, 2); FX.particles(x, y - 14, 20, ULT_FIRE.slice(1, 5), { spread: 16, up: true }); break;
      case 'ice': FX.blast(x, y, r, rar >= 5 ? ['#ffffff', '#fff3a0', '#a8f0ff', '#5fd3ff'] : ['#ffffff', '#e6fbff', '#9ff6ff', '#3a8aa8'], 1.2 + 0.25 * rar, { shards: 10 + 3 * rar });
        for (let i = 0; i < 6 + rar; i++) FXS.spells.push({ kind: 'icicle', x: x + rand(-r, r) * 0.6, y: y + rand(-4, 6), h: rand(8, 16) * big, t: -i * 0.03, life: 1.6 }); FX.flash('#bff4ff', 0.18); break;
      case 'grasp': FX.shockwave(x, y, r * 1.4, rarCol(Math.max(2, rar))); FX.shockwave(x, y, r * 1.9, '#9dff6a');
        FX.particles(x, y - 4, 30 + 8 * rar, ['#f1ecdc', '#9dff6a', rarCol(Math.max(2, rar))], { spread: r, up: true, grav: 60 }); break;
      case 'thunder': FXS.spells.push({ kind: 'ubolt', x, y, big: true, rar, t: 0, life: 0.45 }); FX.blast(x, y, r * 0.7, rar >= 5 ? ['#ffffff', '#fff3a0', '#ffd84a', '#a8601a'] : ['#ffffff', '#e8f6ff', '#9fd8ff', '#3a4aa8'], 1.5 + 0.3 * rar, { shards: 10 }); break;
      case 'lotus': for (let i = 0; i < 26 + 6 * rar; i++) { const a = rand(0, Math.PI * 2), sp = rand(30, 90) * big; FXS.spells.push({ kind: 'petal', x, y: y - 6, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6 - 30, rot: rand(0, 6), col: rar >= 5 ? pick(ULT_GOD) : pick(['#ffb0d8', '#ff7ab8', '#ffffff']), t: 0, life: rand(0.8, 1.4) }); }
        FX.shockwave(x, y, r * 1.3, rar >= 5 ? '#ffd84a' : '#ffb0d8'); FX.flash('#ffd0e8', 0.15); break;
    }
  },
  ultStomp(x, y, r, rar = 0) { FX.shockwave(x, y, r * 1.2, rar >= 5 ? '#fff3a0' : '#ff8a3a'); FX.particles(x, y, 12 + 3 * rar, ['#c9b48a', '#8a6a4a', '#ff8a2a'], { spread: r * 0.8 }); FX.shake(3 + rar * 0.6);
    FXS.decals.push({ kind: 'crack', x, y, r: r * 0.8, t: 0, life: 1.2 }); },
  ultBreath(x, y, face) { for (let i = 0; i < 26; i++) FXS.spells.push({ kind: 'flame', x, y, vx: face * rand(90, 170), vy: rand(-25, 25), s: rand(2, 5), t: -i * 0.012, life: rand(0.35, 0.55) }); },
  ultMuzzle(x, y, a, kind, rar = 0) { for (let i = 0; i < 16 + 4 * rar; i++) { const b = a + rand(-0.6, 0.6), sp = rand(40, 120); FXS.parts.push({ x, y, vx: Math.cos(b) * sp, vy: Math.sin(b) * sp, life: rand(0.2, 0.45), t: 0, color: pick(['#ffffff', '#bff4ff', '#5fd3ff']), size: 1, grav: 0 }); }
    FX.shockwave(x, y, 14 + 3 * rar, '#bff4ff'); FX.shake(3 + rar); },
  ultBolt(x, y, rar = 0, small = false) { FXS.spells.push({ kind: 'ubolt', x, y, rar, small, t: 0, life: small ? 0.2 : 0.28 }); FX.particles(x, y, small ? 4 : 8, rar >= 5 ? ['#ffffff', '#fff3a0'] : ['#ffffff', '#bff4ff', '#5fd3ff'], { spread: 6 }); },
});

function stepUltFX(dt) {
  for (const s of FXS.spells) { if (s.t < 0) continue;
    if (s.kind === 'urock') { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 320 * dt; }
    else if (s.kind === 'flame') { s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 0.96; s.s *= 1 + 1.5 * dt; }
    else if (s.kind === 'petal') { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 40 * dt; s.vx *= 0.97; s.rot += 6 * dt; } }
}

// ----- ground layer: pixel-sized, under the units -----
function drawUltGround(g, B) {
  for (const d of FXS.decals) { const a = 1 - d.t / d.life;
    if (d.kind === 'crater') { g.globalAlpha = 0.35 * a; g.fillStyle = '#2a1a1a'; g.beginPath(); g.ellipse(Math.round(d.x), Math.round(d.y), d.r, d.r * 0.42, 0, 0, Math.PI * 2); g.fill();
      g.globalAlpha = a * (0.5 + 0.3 * Math.sin(FXS.clock * 6)); g.fillStyle = '#ff8a2a'; for (let i = 0; i < 9; i++) { const an = i * 0.7; g.fillRect(Math.round(d.x + Math.cos(an) * d.r * 0.7), Math.round(d.y + Math.sin(an) * d.r * 0.3), 2, 1); } }
    else if (d.kind === 'crack') { g.globalAlpha = 0.6 * a; g.fillStyle = '#3a2a1a'; for (let i = 0; i < 6; i++) { const an = i * 1.05; for (let j = 2; j < d.r; j += 2) g.fillRect(Math.round(d.x + Math.cos(an + j * 0.04) * j), Math.round(d.y + Math.sin(an + j * 0.04) * j * 0.4), 1, 1); } }
  }
  g.globalAlpha = 1;
  if (!B) return;
  for (const z of B.zones) { if (z.type !== 'ult' || !z.vis) continue; const kk = Math.min(1, z.t / z.dur), x = Math.round(z.x), y = Math.round(z.y);
    if (z.vis === 'grasp') { const up = Math.min(1, z.t / 0.35), fade = z.t > z.dur - 0.3 ? (z.dur - z.t) / 0.3 : 1;
      g.globalAlpha = 0.5 * up * fade; g.fillStyle = '#1a1028'; g.beginPath(); g.ellipse(x, y, z.r * up, z.r * 0.45 * up, 0, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 0.85 * fade; g.fillStyle = z.rar >= 5 ? '#ffd84a' : z.rar >= 2 ? rarCol(z.rar) : '#9dff6a';
      for (let i = 0; i < 64; i++) { const an = i / 64 * Math.PI * 2; g.fillRect(Math.round(x + Math.cos(an) * z.r * up), Math.round(y + Math.sin(an) * z.r * 0.45 * up), 1, 1); }
      for (let i = 0; i < 7 + z.rar; i++) { const an = i * 2.4; for (let j = 0; j < z.r * up * 0.9; j += 3) g.fillRect(Math.round(x + Math.cos(an) * j), Math.round(y + Math.sin(an) * j * 0.45), 1, 1); } }
    else if (z.vis === 'cage') { const up = Math.min(1, z.t / 0.25);
      g.globalAlpha = 0.18 + 0.08 * Math.sin(FXS.clock * 20); g.fillStyle = z.rar >= 5 ? '#fff3a0' : '#9fd8ff'; g.beginPath(); g.ellipse(x, y, z.r * up, z.r * 0.5 * up, 0, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 0.9; g.fillStyle = '#ffffff'; for (let i = 0; i < 80; i++) { const an = i / 80 * Math.PI * 2 + FXS.clock; if (i % 2) g.fillRect(Math.round(x + Math.cos(an) * z.r * up), Math.round(y + Math.sin(an) * z.r * 0.5 * up), 1, 1); } }
    else if (z.vis === 'lotus') { const up = Math.min(1, z.t / 0.4), fade = z.t > z.dur - 0.3 ? (z.dur - z.t) / 0.3 : 1, n = 8 + 2 * Math.min(z.rar, 4), rot = FXS.clock * 0.4;
      const cols = z.rar >= 5 ? ['#fff3a0', '#ffd84a', '#ffffff'] : z.rar >= 3 ? ['#ff9fd0', rarCol(z.rar), '#ffffff'] : ['#ffb0d8', '#ff7ab8', '#ffe6f2'];
      g.globalAlpha = 0.28 * fade; g.fillStyle = cols[0]; g.beginPath(); g.ellipse(x, y, z.r * up, z.r * 0.5 * up, 0, 0, Math.PI * 2); g.fill();
      for (let layer = 0; layer < 2; layer++) for (let i = 0; i < n; i++) { const an = rot * (layer ? -1 : 1) + (i + layer * 0.5) / n * Math.PI * 2, d = z.r * up * (layer ? 0.45 : 0.72);
        g.globalAlpha = (layer ? 0.55 : 0.4) * fade; g.fillStyle = cols[layer ? 2 : 1];
        g.beginPath(); g.ellipse(Math.round(x + Math.cos(an) * d), Math.round(y + Math.sin(an) * d * 0.5), z.r * 0.2 * up, z.r * 0.09 * up, an, 0, Math.PI * 2); g.fill(); }
      g.globalAlpha = 0.9 * fade; g.fillStyle = '#ffd84a'; g.fillRect(x - 2, y - 1, 4, 2); }
    else if (z.vis === 'frostTrail') { g.globalAlpha = 0.5 * (1 - kk); g.fillStyle = '#d8f6ff'; for (const p of z.pts) { g.fillRect(Math.round(p[0]) - 3, Math.round(p[1]) - 1, 6, 2); g.fillStyle = Math.random() < 0.5 ? '#9ff6ff' : '#ffffff'; } }
    else if (z.vis === 'colossus' && z.landed) { g.globalAlpha = 0.3; g.fillStyle = '#1a1028'; g.beginPath(); g.ellipse(x, y + 1, 14 * z.size, 4 * z.size, 0, 0, Math.PI * 2); g.fill(); }
    else if (z.vis === 'colossus') { const f = Math.min(1, z.t / 0.45); g.globalAlpha = 0.25 + 0.4 * f; g.fillStyle = '#1a1028'; g.beginPath(); g.ellipse(x, y + 1, 18 * z.size * f, 5 * z.size * f, 0, 0, Math.PI * 2); g.fill(); }
  }
  g.globalAlpha = 1;
}

// ----- hi-res layer, over the scene -----
function drawUltVFX(ctx, k, ox, oy, B) {
  const X = x => x * k + ox, Y = y => y * k + oy;
  if (B) for (const z of B.zones) { if (z.type !== 'ult' || !z.vis) continue;
    if (z.vis === 'colossus') drawColossus(ctx, z, X(z.x), Y(z.y), k);
    else if (z.vis === 'lance') drawLance(ctx, z, X, Y, k);
    else if (z.vis === 'grasp') drawGrasp(ctx, z, X(z.x), Y(z.y), k);
    else if (z.vis === 'cage') drawCage(ctx, z, X(z.x), Y(z.y), k);
    else if (z.vis === 'lotus') drawLotusMotes(ctx, z, X(z.x), Y(z.y), k);
  }
  for (const s of FXS.spells) { if (s.t < 0) continue; const kk = Math.min(1, s.t / s.life);
    if (s.kind === 'urock') { ctx.globalAlpha = 1 - kk * kk; ctx.fillStyle = OUTLINE; ctx.fillRect(X(s.x) - s.s * k * 0.6, Y(s.y) - s.s * k * 0.6, s.s * k * 1.2, s.s * k * 1.2); ctx.fillStyle = '#6a5a5a'; ctx.fillRect(X(s.x) - s.s * k * 0.4, Y(s.y) - s.s * k * 0.4, s.s * k * 0.8, s.s * k * 0.8); ctx.fillStyle = '#ff8a2a'; ctx.fillRect(X(s.x) - k * 0.5, Y(s.y) - k * 0.5, k, k); }
    else if (s.kind === 'flame') { ctx.globalAlpha = 1 - kk; ctx.fillStyle = ULT_FIRE[Math.min(5, 1 + Math.floor(kk * 5))]; ctx.beginPath(); ctx.arc(X(s.x), Y(s.y), s.s * k, 0, Math.PI * 2); ctx.fill(); }
    else if (s.kind === 'petal') { ctx.globalAlpha = 1 - kk; ctx.save(); ctx.translate(X(s.x), Y(s.y)); ctx.rotate(s.rot); ctx.fillStyle = s.col; ctx.beginPath(); ctx.ellipse(0, 0, 3 * k, 1.4 * k, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    else if (s.kind === 'icicle') { const up = kk < 0.1 ? kk / 0.1 : kk > 0.8 ? (1 - kk) / 0.2 : 1, x = X(s.x), y = Y(s.y), h = s.h * k * up, w = 3 * k;
      ctx.globalAlpha = 1; ctx.fillStyle = OUTLINE; ctx.beginPath(); ctx.moveTo(x - w - k, y); ctx.lineTo(x, y - h - k); ctx.lineTo(x + w + k, y); ctx.fill();
      ctx.fillStyle = '#9ff6ff'; ctx.beginPath(); ctx.moveTo(x - w, y); ctx.lineTo(x, y - h); ctx.lineTo(x + w, y); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - k * 0.6, y - h * 0.8, k * 1.2, h * 0.6); }
    else if (s.kind === 'ubolt') { const x = X(s.x), y = Y(s.y), top = s.big ? 0 : y - 70 * k, gold = s.rar >= 5, w = (s.big ? 7 : s.small ? 1.5 : 3) * k * (1 - kk * 0.5);
      ctx.globalAlpha = 1 - kk; let px = x + rand(-8, 8) * k, py = top; const pts = [[px, py]]; while (py < y) { py += rand(8, 16) * k; px += rand(-9, 9) * k; pts.push([py >= y ? x : px, Math.min(py, y)]); }
      for (const [lw, col] of [[w * 3, gold ? 'rgba(255,216,74,0.35)' : 'rgba(95,211,255,0.35)'], [w, gold ? '#fff3a0' : '#bff4ff'], [w * 0.4, '#ffffff']]) { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.beginPath(); pts.forEach(([a, b], i) => i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); ctx.stroke(); }
      if (s.big) { ctx.globalAlpha = 0.5 * (1 - kk); glowAt(ctx, x, y, 40 * k, gold ? '#ffd84a' : '#9fd8ff'); } }
  }
  ctx.globalAlpha = 1;
}

// a lumbering heap of rock held together by lava; arms rise before each stomp and slam down
function drawColossus(ctx, z, x, y, k) {
  const r = z.rar, s = 1.3 * k * z.size, fall = z.landed ? 0 : Math.pow(1 - Math.min(1, z.t / 0.45), 2) * 170 * k;
  const fade = z.t > z.dur - 0.4 ? Math.max(0, (z.dur - z.t) / 0.4) : 1, sink = (1 - fade) * 14 * s;
  const lava = r >= 5 ? ['#ffffff', '#fff3a0', '#ffe066'] : r >= 4 ? ['#fff3a0', '#ffd84a', '#ffb030'] : r >= 3 ? ['#ffd0e0', '#ff5d8f', '#c02a5a'] : ['#fff3a0', '#ffb23a', '#ff5a2a'];
  const rock = r >= 5 ? ['#7a6a94', '#b8a8d8'] : r >= 2 ? ['#76606e', '#a8909c'] : ['#7a685c', '#a8968a'];
  const lift = z.tick != null && z.landed ? (z.tick < 0.3 ? 1 - z.tick / 0.3 : z.t - z.stompT < 0.12 ? 0 : 0.25) : 0.6;
  const step = Math.sin(z.t * 6) * (z.landed ? 1 : 0), face = z.face || 1;
  ctx.save(); ctx.globalAlpha = fade; ctx.translate(x, y - fall + sink); ctx.scale(face, 1);
  const blk = (bx, by, bw, bh, c) => { ctx.fillStyle = OUTLINE; ctx.fillRect((bx - 0.6) * s, (by - 0.6) * s, (bw + 1.2) * s, (bh + 1.2) * s); ctx.fillStyle = c[0]; ctx.fillRect(bx * s, by * s, bw * s, bh * s); ctx.fillStyle = c[1]; ctx.fillRect(bx * s, by * s, bw * s, Math.max(1, bh * 0.3) * s); };
  const glow = (gx, gy, gr) => { ctx.save(); ctx.globalAlpha = fade * (0.55 + 0.35 * Math.sin(FXS.clock * 9 + gx)); glowAt(ctx, gx * s, gy * s, gr * s, lava[1]); ctx.restore(); };
  // aura
  ctx.save(); ctx.globalAlpha = fade * (0.25 + 0.05 * r); glowAt(ctx, 0, -14 * s, (16 + 2 * r) * s, lava[2]); ctx.restore();
  // legs
  blk(-6, -7 + step, 5, 7 - step, rock); blk(1, -7 - step, 5, 7 + step, rock);
  // torso and lava core
  blk(-9, -21, 18, 15, rock); ctx.fillStyle = lava[2]; ctx.fillRect(-3 * s, -17 * s, 6 * s, 7 * s); ctx.fillStyle = lava[1]; ctx.fillRect(-2 * s, -16 * s, 4 * s, 5 * s); ctx.fillStyle = lava[0]; ctx.fillRect(-1 * s, -15 * s, 2 * s, 3 * s); glow(0, -13, 9);
  // cracks
  ctx.fillStyle = lava[1]; for (const [cx, cy, cw, ch] of [[-8, -19, 3, 1], [5, -12, 3, 1], [-7, -10, 1, 3], [6, -20, 1, 4]]) ctx.fillRect(cx * s, cy * s, cw * s, ch * s);
  // head with ember eyes
  blk(-4, -27, 8, 6, rock); ctx.fillStyle = lava[0]; ctx.fillRect(-2 * s, -25 * s, 1.4 * s, 1.4 * s); ctx.fillRect(1 * s, -25 * s, 1.4 * s, 1.4 * s); glow(0, -24, 4);
  // arms: raised overhead before a stomp, fists slamming the ground after
  for (const side of [-1, 1]) { const ay = -20 - 10 * lift, ax = side * 12; ctx.save(); ctx.translate(ax * s, ay * s);
    blk(-2.5, 0, 5, 9 + 6 * (1 - lift), rock); blk(-3.5, 8 + 6 * (1 - lift), 7, 6, rock); ctx.fillStyle = lava[1]; ctx.fillRect(-1 * s, (10 + 6 * (1 - lift)) * s, 2 * s, 2 * s); ctx.restore(); }
  // rarity crown: Legendary gets a flame mane, God a halo of white fire
  if (r >= 4) for (let i = 0; i < 5 + r; i++) { const fx = (-4 + i * 8 / (4 + r)) * s, fh = (3 + 2 * Math.sin(FXS.clock * 14 + i)) * s; ctx.fillStyle = lava[i % 2 ? 1 : 2]; ctx.beginPath(); ctx.moveTo(fx - 1.2 * s, -27 * s); ctx.lineTo(fx, -27 * s - fh); ctx.lineTo(fx + 1.2 * s, -27 * s); ctx.fill(); }
  if (r >= 5) { ctx.strokeStyle = '#fff3a0'; ctx.lineWidth = 1.2 * k; ctx.globalAlpha = fade * 0.8; ctx.beginPath(); ctx.ellipse(0, -33 * s, 7 * s, 2 * s, 0, 0, Math.PI * 2); ctx.stroke(); }
  ctx.restore();
  if (Math.random() < 0.5 + 0.1 * r) FXS.parts.push({ x: z.x + rand(-10, 10) * z.size, y: z.y - rand(8, 34) * z.size, vx: rand(-8, 8), vy: -rand(10, 30), life: rand(0.3, 0.7), t: 0, color: pick(lava), size: 1, grav: -10 });
}

// a spear of ice the size of a tree trunk, frost streaming behind it
function drawLance(ctx, z, X, Y, k) {
  const r = z.rar, x = X(z.x), y = Y(z.y), L = (40 + 4 * r) * k, wd = (3 + 0.5 * r) * k, gold = r >= 5;
  const tr = z.trail.slice(-24);
  for (let i = 1; i < tr.length; i++) { const f = i / tr.length; ctx.globalAlpha = 0.5 * f; ctx.strokeStyle = gold ? (i % 2 ? '#fff3a0' : '#a8f0ff') : (i % 2 ? '#bff4ff' : '#ffffff'); ctx.lineWidth = wd * 2.4 * f; ctx.beginPath(); ctx.moveTo(X(tr[i - 1][0]), Y(tr[i - 1][1])); ctx.lineTo(X(tr[i][0]), Y(tr[i][1])); ctx.stroke(); }
  ctx.save(); ctx.translate(x, y); ctx.rotate(z.a); ctx.globalAlpha = 0.6; glowAt(ctx, 0, 0, L * 0.7, gold ? '#ffd84a' : '#5fd3ff'); ctx.globalAlpha = 1;
  ctx.fillStyle = OUTLINE; ctx.fillRect(-L, -wd * 0.7, L, wd * 1.4); ctx.fillStyle = '#e6fbff'; ctx.fillRect(-L, -wd * 0.45, L, wd * 0.9); ctx.fillStyle = '#ffffff'; ctx.fillRect(-L, -wd * 0.15, L, wd * 0.3);
  // fletching of frozen feathers
  for (const sg of [-1, 1]) { ctx.fillStyle = OUTLINE; ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(-L - 6 * k, sg * wd * 2.4); ctx.lineTo(-L + 8 * k, 0); ctx.fill(); ctx.fillStyle = gold ? '#ffd84a' : '#9ff6ff'; ctx.beginPath(); ctx.moveTo(-L + k, 0); ctx.lineTo(-L - 4 * k, sg * wd * 2); ctx.lineTo(-L + 6 * k, 0); ctx.fill(); }
  // crystal head
  const hl = (9 + r) * k; ctx.fillStyle = OUTLINE; ctx.beginPath(); ctx.moveTo(hl + k, 0); ctx.lineTo(-k, -wd * 2.2); ctx.lineTo(-3 * k, 0); ctx.lineTo(-k, wd * 2.2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = gold ? '#fff3a0' : '#9ff6ff'; ctx.beginPath(); ctx.moveTo(hl, 0); ctx.lineTo(0, -wd * 1.8); ctx.lineTo(-2 * k, 0); ctx.lineTo(0, wd * 1.8); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(hl * 0.8, 0); ctx.lineTo(0, -wd * 0.6); ctx.lineTo(0, 0); ctx.fill();
  ctx.restore();
  if (Math.random() < 0.7) FXS.parts.push({ x: z.x - Math.cos(z.a) * 10, y: z.y - Math.sin(z.a) * 10 + rand(-3, 3), vx: rand(-20, 20), vy: rand(-10, 20), life: rand(0.3, 0.6), t: 0, color: pick(['#ffffff', '#bff4ff', gold ? '#ffd84a' : '#9ff6ff']), size: 1, grav: 20 });
}

// skeletal hands clawing up through the ground; Legendary and up add binding chains, God burns with soul fire
function drawGrasp(ctx, z, x, y, k) {
  const r = z.rar, n = 8 + 2 * r, up = Math.min(1, z.t / 0.35), fade = z.t > z.dur - 0.3 ? Math.max(0, (z.dur - z.t) / 0.3) : 1, rise = up * fade;
  const bone = '#f1ecdc', fire = r >= 5 ? '#ffd84a' : r >= 2 ? rarCol(r) : '#9dff6a';
  for (let i = 0; i < n; i++) { const an = i * 2.399 + 0.5, d = z.r * (0.25 + 0.7 * ((i * 0.618) % 1)), hx = x + Math.cos(an) * d * k, hy = y + Math.sin(an) * d * 0.45 * k, h = (10 + (i % 3) * 3) * k * rise, grab = Math.sin(FXS.clock * 8 + i) * 0.3;
    ctx.globalAlpha = 1; ctx.fillStyle = OUTLINE; ctx.fillRect(hx - 2 * k, hy - h - k, 4 * k, h + k);
    ctx.fillStyle = bone; ctx.fillRect(hx - k, hy - h, 2 * k, h);
    // palm and curled fingers
    ctx.fillStyle = OUTLINE; ctx.fillRect(hx - 3.5 * k, hy - h - 4 * k, 7 * k, 4.5 * k); ctx.fillStyle = bone; ctx.fillRect(hx - 2.5 * k, hy - h - 3 * k, 5 * k, 3 * k);
    for (let f = -2; f <= 2; f++) { const fx = hx + f * 1.3 * k, fl = (3 + (f === 0 ? 1 : 0)) * k * (1 - grab * Math.abs(f) * 0.5); ctx.fillStyle = OUTLINE; ctx.fillRect(fx - 0.9 * k, hy - h - 3 * k - fl, 1.8 * k, fl); ctx.fillStyle = bone; ctx.fillRect(fx - 0.4 * k, hy - h - 3 * k - fl + 0.5 * k, 0.8 * k, fl - 0.5 * k); }
    if (r >= 2) { ctx.globalAlpha = 0.45 * rise * (0.7 + 0.3 * Math.sin(FXS.clock * 12 + i)); glowAt(ctx, hx, hy - h - 2 * k, 5 * k, fire); }
    if (r >= 4) { ctx.globalAlpha = 0.8 * rise; ctx.strokeStyle = r >= 5 ? '#ffd84a' : '#a8a8c0'; ctx.lineWidth = k; ctx.setLineDash([2 * k, 1.5 * k]); ctx.beginPath(); ctx.moveTo(hx, hy - h * 0.5); ctx.quadraticCurveTo((hx + x) / 2, hy - h - 6 * k, x, y - 6 * k); ctx.stroke(); ctx.setLineDash([]); } }
  if (r >= 5 && Math.random() < 0.6) FXS.parts.push({ x: z.x + rand(-z.r, z.r) * 0.7, y: z.y + rand(-z.r, z.r) * 0.3, vx: 0, vy: -rand(20, 40), life: rand(0.3, 0.6), t: 0, color: pick(['#ffd84a', '#fff3a0', '#9dff6a']), size: 1, grav: -20 });
  ctx.globalAlpha = 1;
}

// crystal pylons around the crowd with lightning arcing between them
function drawCage(ctx, z, x, y, k) {
  const r = z.rar, n = 6 + r, up = Math.min(1, z.t / 0.25), gold = r >= 5, fade = z.t > z.dur - 0.2 ? Math.max(0, (z.dur - z.t) / 0.2) : 1;
  const pts = []; for (let i = 0; i < n; i++) { const an = i / n * Math.PI * 2 + 0.3; pts.push([x + Math.cos(an) * z.r * k, y + Math.sin(an) * z.r * 0.5 * k]); }
  // dome shimmer
  ctx.globalAlpha = 0.12 * fade; ctx.fillStyle = gold ? '#fff3a0' : '#9fd8ff'; ctx.beginPath(); ctx.ellipse(x, y - z.r * 0.3 * k, z.r * k, z.r * 0.75 * k, 0, Math.PI, 0); ctx.fill();
  // arcs between pylon tips
  const tipH = (16 + 2 * r) * k * up;
  for (let i = 0; i < n; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % n];
    for (const [lw, col] of [[3 * k, gold ? 'rgba(255,216,74,0.35)' : 'rgba(95,211,255,0.35)'], [1.2 * k, gold ? '#fff3a0' : '#e8f6ff']]) { ctx.globalAlpha = fade * (0.6 + 0.4 * Math.random()); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(ax, ay - tipH);
      for (let j = 1; j < 5; j++) { const f = j / 5; ctx.lineTo(ax + (bx - ax) * f + rand(-3, 3) * k, ay - tipH + (by - ay) * f + rand(-4, 4) * k); } ctx.lineTo(bx, by - tipH); ctx.stroke(); } }
  // pylons, back ones first
  pts.map((p, i) => [p, i]).sort((a, b) => a[0][1] - b[0][1]).forEach(([[px, py], i]) => { ctx.globalAlpha = fade; const w = 3 * k;
    ctx.fillStyle = OUTLINE; ctx.beginPath(); ctx.moveTo(px - w - k, py); ctx.lineTo(px - w * 0.6, py - tipH); ctx.lineTo(px, py - tipH - 5 * k); ctx.lineTo(px + w * 0.6, py - tipH); ctx.lineTo(px + w + k, py); ctx.fill();
    ctx.fillStyle = gold ? '#ffd84a' : r >= 3 ? rarCol(r) : '#5fd3ff'; ctx.beginPath(); ctx.moveTo(px - w, py); ctx.lineTo(px - w * 0.5, py - tipH); ctx.lineTo(px, py - tipH - 4 * k); ctx.lineTo(px + w * 0.5, py - tipH); ctx.lineTo(px + w, py); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(px - k * 0.6, py - tipH, k * 1.2, tipH * 0.7);
    ctx.globalAlpha = fade * (0.5 + 0.4 * Math.sin(FXS.clock * 20 + i)); glowAt(ctx, px, py - tipH - 2 * k, 6 * k, gold ? '#fff3a0' : '#9fd8ff'); });
  ctx.globalAlpha = 1;
}

function drawLotusMotes(ctx, z, x, y, k) {
  const fade = z.t > z.dur - 0.3 ? Math.max(0, (z.dur - z.t) / 0.3) : 1, gold = z.rar >= 5;
  ctx.globalAlpha = 0.18 * fade; glowAt(ctx, x, y - 6 * k, z.r * k * 0.8, gold ? '#ffd84a' : '#ffb0d8'); ctx.globalAlpha = 1;
  if (Math.random() < 0.5 + 0.1 * z.rar) { const an = rand(0, Math.PI * 2), d = rand(0, z.r); FXS.spells.push({ kind: 'petal', x: z.x + Math.cos(an) * d, y: z.y + Math.sin(an) * d * 0.5, vx: rand(-6, 6), vy: -rand(20, 40), rot: rand(0, 6), col: gold ? pick(ULT_GOD) : pick(['#ffb0d8', '#ffffff', '#ff7ab8']), t: 0, life: rand(0.8, 1.3) }); }
}
