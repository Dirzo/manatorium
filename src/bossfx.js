// ===== Boss fury: every boss winds up angrily before its signature move, and each move has its own themed animation =====
// sim.js starts u.fury (the wind-up) and calls FX.boss(kind, o) when a move lands. Everything here is drawn on the hi-res layer.
const BFX = [];
Object.assign(FX, {
  boss(kind, o = {}) { BFX.push(Object.assign({ kind, t: 0, life: 1 }, o)); },
  // the wind-up: a roar line, a shake and a burst of steam
  fury(u) {
    const sz = 20 * (u.scale || 1);
    FX.text(u.x, u.y - sz - 14, pick(FURY_LINES[u.id] || FURY_LINES._), '#ff5d5d', true, true);
    FX.shake(4); FX.sound('quake');
    for (let i = 0; i < 18; i++) FXS.parts.push({ x: u.x + rand(-sz / 2, sz / 2), y: u.y - rand(sz * 0.4, sz), vx: rand(-30, 30), vy: rand(-40, -10), life: rand(0.4, 0.8), t: 0, color: pick(['#ffffff', '#d8d8e8', '#ff8a8a']), size: 1, grav: -20 });
  },
});
const FURY_LINES = {
  grubnose: ['THAT WAS MY GOOD BUCKET', 'RENT IS DUE', 'GRRRAAH'],
  gloop: ['WHO POPPED HIM', 'MOTHER IS UPSET', 'BLORP'],
  wyrm: ['YOU WILL LISTEN', 'SILENCE. I AM READING.'],
  ringmaster: ['THE SHOW MUST GO ON', 'SPOTLIGHT. NOW.'],
  sporebaron: ['I AM VERY FUNGAL TODAY', 'BEHOLD MY SPORES'],
  matriarch: ['SHOVEL YOUR WALKS', 'THE SNOW IS COMING'],
  trashpaw: ['THAT IS MY BIN', 'MAMA IS HUNGRY'],
  colossus: ['ERROR. ERROR. ANGRY.', 'RECALIBRATING RAGE'],
  pinchbeard: ['RUN OUT THE GUNS', 'PAY THE TOLL'],
  shardgoose: ['HONK', 'THE SHARDS ARE MINE'],
  goosegod: ['HONK', 'HONK HONK'],
  _: ['RAAAGH'],
};
const BOSS_TINT = { grubnose: '#ff5d3a', gloop: '#7fe05a', wyrm: '#a86aff', ringmaster: '#ffd84a', sporebaron: '#c8ff6a', matriarch: '#9ad8ff', trashpaw: '#c84a8a', colossus: '#5fd3ff', pinchbeard: '#ffd84a', shardgoose: '#c98aff', goosegod: '#ff8a1a' };

function stepBossFX(dt) { for (const f of BFX) f.t += dt; for (let i = BFX.length - 1; i >= 0; i--) if (BFX[i].t >= BFX[i].life) BFX.splice(i, 1); }

function drawBossFX(ctx, k, ox, oy, B) {
  const X = x => x * k + ox, Y = y => y * k + oy, clock = FXS.clock;
  const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(X(x)), Math.round(Y(y)), Math.max(1, w * k), Math.max(1, h * k)); };
  // ---- the wind-up on every angry boss ----
  if (B) for (const u of B.enemies) if (u.fury && u.alive) {
    const f = Math.min(1, u.fury.t / u.fury.dur), sz = 20 * (u.scale || 1), col = BOSS_TINT[u.id] || '#ff5d5d';
    // a hot glow and a cracking ring on the ground that tightens as the move gets close
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const gr = ctx.createRadialGradient(X(u.x), Y(u.y - sz / 2), 0, X(u.x), Y(u.y - sz / 2), sz * 1.3 * k);
    gr.addColorStop(0, `rgba(255,80,60,${0.25 + 0.25 * f})`); gr.addColorStop(1, 'rgba(255,40,40,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(X(u.x), Y(u.y - sz / 2), sz * 1.3 * k, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    const rr = sz * (1.6 - 0.8 * f); ctx.strokeStyle = col; ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(clock * 18)); ctx.lineWidth = 2 * k;
    ctx.beginPath(); ctx.ellipse(X(u.x), Y(u.y), rr * k, rr * 0.4 * k, 0, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + 0.3, l = rr * (0.4 + 0.6 * f); ctx.beginPath(); ctx.moveTo(X(u.x + Math.cos(a) * rr * 0.3), Y(u.y + Math.sin(a) * rr * 0.12)); ctx.lineTo(X(u.x + Math.cos(a) * l), Y(u.y + Math.sin(a) * l * 0.4)); ctx.stroke(); }
    ctx.globalAlpha = 1;
    // anger veins popping beside the head
    const hx = u.x + sz * 0.35, hy = u.y - sz * 0.95, pop = 1 + 0.35 * Math.abs(Math.sin(clock * 12)), s = Math.round(2 * pop);
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { px(hx + dx * s - (dx < 0 ? 1 : 0), hy + dy * s, 1, s, '#1a1230'); px(hx + dx * s - (dx < 0 ? 1 : 0), hy + dy * (s + 1) - (dy < 0 ? 0 : 1), s, 1, '#1a1230');
      px(hx + dx * (s - 1) - (dx < 0 ? 1 : 0), hy + dy * (s - 1), 1, s, '#ff3d3d'); }
    // steam from both sides of the head
    if (Math.random() < 0.6) for (const sd of [-1, 1]) FXS.parts.push({ x: u.x + sd * sz * 0.4, y: u.y - sz * 0.85, vx: sd * rand(8, 22), vy: rand(-30, -14), life: rand(0.3, 0.6), t: 0, color: pick(['#ffffff', '#e8e8f0']), size: 1, grav: -10 });
  }
  // ---- the themed signature animations ----
  for (const f of BFX) {
    const a = f.t / f.life, fade = Math.min(1, (1 - a) * 4);
    ctx.globalAlpha = fade;
    if (f.kind === 'bucket') { // a spinning bucket on a high arc
      const x = f.sx + (f.tx - f.sx) * a, y = f.sy + (f.ty - f.sy) * a - Math.sin(a * Math.PI) * 70;
      ctx.save(); ctx.translate(X(x), Y(y)); ctx.rotate(a * 12); const s = k * 1.4;
      ctx.fillStyle = '#1a1230'; ctx.fillRect(-5 * s, -5 * s, 10 * s, 10 * s); ctx.fillStyle = '#c9a35a'; ctx.fillRect(-4 * s, -4 * s, 8 * s, 8 * s);
      ctx.fillStyle = '#8a6a2a'; ctx.fillRect(-4 * s, -1 * s, 8 * s, 1 * s); ctx.fillRect(-4 * s, 2 * s, 8 * s, 1 * s); ctx.fillStyle = '#e0e0f0'; ctx.fillRect(-3 * s, -7 * s, 6 * s, 1 * s); ctx.restore();
      if (Math.random() < 0.5) FXS.parts.push({ x, y, vx: rand(-10, 10), vy: rand(-5, 10), life: 0.3, t: 0, color: '#c9a35a', size: 1, grav: 60 });
    } else if (f.kind === 'tendril') { // slime arms reach out, grab, and haul back
      const reach = a < 0.45 ? a / 0.45 : 1 - (a - 0.45) / 0.55, ex = f.sx + (f.tx - f.sx) * reach, ey = f.sy + (f.ty - f.sy) * reach;
      ctx.strokeStyle = '#1a1230'; ctx.lineWidth = 5 * k; ctx.lineCap = 'round'; const wv = (s, w) => { ctx.beginPath(); for (let i = 0; i <= 12; i++) { const q = i / 12, wx = f.sx + (ex - f.sx) * q, wy = f.sy + (ey - f.sy) * q + Math.sin(q * 9 + clock * 14) * 3 * (1 - q * 0.5); i ? ctx.lineTo(X(wx), Y(wy)) : ctx.moveTo(X(wx), Y(wy)); } ctx.lineWidth = w * k; ctx.strokeStyle = s; ctx.stroke(); };
      wv('#1a1230', 5); wv('#5ad84a', 3); wv('#b8ff9a', 1);
      ctx.fillStyle = '#5ad84a'; ctx.beginPath(); ctx.arc(X(ex), Y(ey), 4 * k, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ff8fb0'; ctx.fillRect(X(ex) - k, Y(ey) - k, 2 * k, 2 * k);
    } else if (f.kind === 'pages') { // manuscript pages flutter out of the wyrm onto every listener
      for (const p of f.pts) { const q = Math.max(0, Math.min(1, (a - p.d) / 0.6)); if (!q) continue; const x = f.sx + (p.x - f.sx) * q + Math.sin(q * 10 + p.d * 20) * 6, y = f.sy + (p.y - f.sy) * q - Math.sin(q * Math.PI) * 40;
        ctx.save(); ctx.translate(X(x), Y(y)); ctx.rotate(Math.sin(clock * 8 + p.d * 30) * 0.6); const s = k;
        ctx.fillStyle = '#1a1230'; ctx.fillRect(-3 * s, -4 * s, 7 * s, 9 * s); ctx.fillStyle = '#fff8e8'; ctx.fillRect(-2 * s, -3 * s, 5 * s, 7 * s); ctx.fillStyle = '#a89ae8'; for (let l = 0; l < 3; l++) ctx.fillRect(-1 * s, (-2 + l * 2) * s, 3 * s, s); ctx.restore(); }
    } else if (f.kind === 'spotlight') { // a circus spotlight picks the target, then the ringmaster arrives by cannon
      const w = 22 * (1 - a * 0.5); ctx.globalAlpha = 0.35 * fade; ctx.fillStyle = '#fff3a0'; ctx.beginPath(); ctx.moveTo(X(f.tx - 6), Y(0)); ctx.lineTo(X(f.tx + 6), Y(0)); ctx.lineTo(X(f.tx + w), Y(f.ty)); ctx.lineTo(X(f.tx - w), Y(f.ty)); ctx.fill();
      ctx.globalAlpha = fade; const x = f.sx + (f.tx - f.sx) * a, y = f.sy + (f.ty - f.sy) * a - Math.sin(a * Math.PI) * 90;
      ctx.save(); ctx.translate(X(x), Y(y)); ctx.rotate(a * 16); ctx.fillStyle = '#1a1230'; ctx.beginPath(); ctx.arc(0, 0, 7 * k, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#ffd84a' : '#ff5a5a'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 6 * k, i * Math.PI / 2, (i + 1) * Math.PI / 2); ctx.fill(); } ctx.restore();
      if (Math.random() < 0.8) FXS.parts.push({ x, y, vx: rand(-20, 20), vy: rand(-20, 20), life: 0.4, t: 0, color: pick(['#ff5a5a', '#ffd84a', '#5fd3ff', '#7cf09a']), size: 1, grav: 40 });
    } else if (f.kind === 'spores') { // rolling spore clouds sweep toward the castle
      for (let i = 0; i < 7; i++) { const q = Math.max(0, a * 1.3 - i * 0.05), x = f.sx - q * (f.sx - CASTLE_X) , y = GRID.y + 12 + i * (GRID.rows * GRID.ch - 16) / 6, r = (10 + 14 * q) * k;
        if (q <= 0) continue; ctx.globalAlpha = 0.65 * fade; ctx.fillStyle = i % 2 ? '#a86ad8' : '#9ad84a'; ctx.beginPath(); ctx.arc(X(x), Y(y), r, 0, Math.PI * 2); ctx.arc(X(x + 8), Y(y - 4), r * 0.7, 0, Math.PI * 2); ctx.arc(X(x - 8), Y(y + 3), r * 0.6, 0, Math.PI * 2); ctx.fill(); }
    } else if (f.kind === 'avalanche') { // a wall of snow rolls across the field
      const fx = f.sx - a * (f.sx - CASTLE_X + 10), top = GRID.y - 10, bot = GRID.y + GRID.rows * GRID.ch + 6;
      ctx.globalAlpha = 0.85 * fade; ctx.fillStyle = '#e8f4ff'; ctx.beginPath(); ctx.moveTo(X(fx + 60), Y(top)); for (let y = top; y <= bot; y += 6) ctx.lineTo(X(fx + Math.sin(y * 0.4 + clock * 10) * 4), Y(y)); ctx.lineTo(X(fx + 60), Y(bot)); ctx.fill();
      ctx.fillStyle = '#9ad8ff'; for (let y = top; y <= bot; y += 6) ctx.fillRect(X(fx + Math.sin(y * 0.4 + clock * 10) * 4) - k, Y(y), 2 * k, 3 * k);
      if (Math.random() < 0.9) for (let i = 0; i < 3; i++) FXS.parts.push({ x: fx, y: rand(top, bot), vx: rand(-60, -20), vy: rand(-30, 0), life: 0.5, t: 0, color: pick(['#ffffff', '#c8e8ff']), size: 2, grav: 60 });
    } else if (f.kind === 'dumpster') { // a dumpster drops in and its lid flaps while trash flies out
      const drop = Math.min(1, a / 0.2), x = f.sx + 22, y = f.sy + 4 - 60 * (1 - drop), lid = a > 0.2 ? Math.abs(Math.sin(clock * 14)) : 0;
      px(x - 16, y - 20, 32, 21, '#1a1230'); px(x - 15, y - 19, 30, 19, '#3a6a4a'); px(x - 15, y - 12, 30, 2, '#2a4a3a'); px(x - 11, y - 17, 3, 14, '#5a8a6a'); px(x + 6, y - 17, 3, 14, '#5a8a6a');
      ctx.save(); ctx.translate(X(x - 16), Y(y - 20)); ctx.rotate(-lid * 0.9); ctx.fillStyle = '#1a1230'; ctx.fillRect(0, -3 * k, 32 * k, 4 * k); ctx.fillStyle = '#5a8a6a'; ctx.fillRect(k, -2 * k, 30 * k, 2 * k); ctx.restore();
      if (a > 0.2 && Math.random() < 0.7) FXS.parts.push({ x: x, y: y - 20, vx: rand(-50, 30), vy: rand(-80, -40), life: 0.7, t: 0, color: pick(['#c8a070', '#8a8a9a', '#ffde3a', '#c84a8a', '#7ad87a']), size: 2, grav: 160 });
      if (drop === 1 && f.t - 0.2 * f.life < 0.03) FX.shake(6);
    } else if (f.kind === 'reset') { // a scanline wipes the field and glitches every hero
      const sx = f.sx - a * (f.sx - CASTLE_X); ctx.globalAlpha = 0.7 * fade; ctx.fillStyle = '#5fd3ff'; ctx.fillRect(X(sx), Y(GRID.y - 20), 2 * k, (GRID.rows * GRID.ch + 30) * k);
      ctx.globalAlpha = 0.18 * fade; ctx.fillRect(X(sx), Y(GRID.y - 20), (f.sx - sx) * k, (GRID.rows * GRID.ch + 30) * k);
      if (B) for (const h of B.heroes) if (h.alive && h.x > sx) { ctx.globalAlpha = 0.8 * fade; for (let i = 0; i < 3; i++) px(h.x + rand(-7, 5), h.y - rand(4, 18), randi(2, 6), 1, pick(['#5fd3ff', '#ff3a5a', '#ffffff'])); }
    } else if (f.kind === 'ship') { // a pirate ship slides in at the edge and fires every gun
      const slide = Math.min(1, a / 0.2), x = W + 40 - 70 * slide, y = GRID.y + GRID.rows * GRID.ch / 2;
      px(x - 26, y - 6, 56, 16, '#1a1230'); px(x - 25, y - 5, 54, 14, '#6a4a2a'); px(x - 25, y + 2, 54, 2, '#8a6a3a'); px(x - 2, y - 46, 2, 41, '#1a1230'); px(x + 1, y - 44, 22, 18, '#f4ecd8'); px(x + 8, y - 38, 6, 5, '#1a1230');
      for (let i = 0; i < 4; i++) { px(x - 24, y - 3 + i * 3, 4, 2, '#1a1230'); if (slide === 1 && Math.sin(clock * 20 + i * 1.7) > 0.7) { px(x - 32, y - 4 + i * 3, 8, 4, '#ffd84a'); px(x - 36, y - 3 + i * 3, 4, 2, '#ffffff'); } }
    } else if (f.kind === 'shardStreak') { // a shard leaves the crown and streaks to its target
      const q = Math.min(1, a / 0.5), x = f.sx + (f.tx - f.sx) * q, y = f.sy + (f.ty - f.sy) * q - Math.sin(q * Math.PI) * 30;
      ctx.strokeStyle = f.col; ctx.lineWidth = 2 * k; ctx.beginPath(); ctx.moveTo(X(f.sx), Y(f.sy)); ctx.lineTo(X(x), Y(y)); ctx.globalAlpha = 0.35 * fade; ctx.stroke(); ctx.globalAlpha = fade;
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(X(x), Y(y - 4)); ctx.lineTo(X(x + 2), Y(y)); ctx.lineTo(X(x), Y(y + 4)); ctx.lineTo(X(x - 2), Y(y)); ctx.fill(); ctx.strokeStyle = f.col; ctx.lineWidth = k; ctx.stroke();
    } else if (f.kind === 'honk') { // a honk you can see: beak-shaped shock arcs and flying letters
      for (let i = 0; i < 4; i++) { const r = (20 + 70 * a + i * 22) * k; ctx.globalAlpha = Math.max(0, (1 - a) * (1 - i * 0.2)); ctx.strokeStyle = i % 2 ? '#ffffff' : '#ff8a1a'; ctx.lineWidth = 3 * k; ctx.beginPath(); ctx.arc(X(f.sx), Y(f.sy), r, Math.PI * 0.65, Math.PI * 1.35); ctx.stroke(); }
      ctx.globalAlpha = fade; ctx.font = `${Math.round(10 * k)}px "Press Start 2P", monospace`; ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 4; i++) ctx.fillText('HONK'[i], X(f.sx - 20 - a * 140 - i * 12), Y(f.sy - 30 + Math.sin(a * 8 + i) * 12));
    } else if (f.kind === 'hammerSteal') { // the goose plucks the Sky Hammer off the castle
      const x = f.sx + (f.tx - f.sx) * a, y = f.sy + (f.ty - f.sy) * a - Math.sin(a * Math.PI) * 50;
      ctx.save(); ctx.translate(X(x), Y(y)); ctx.rotate(a * 10); const s = k * 1.5; ctx.fillStyle = '#1a1230'; ctx.fillRect(-1 * s, -2 * s, 2 * s, 9 * s); ctx.fillRect(-5 * s, -6 * s, 10 * s, 5 * s);
      ctx.fillStyle = '#9a6332'; ctx.fillRect(-0.5 * s, -1 * s, s, 7 * s); ctx.fillStyle = '#c9d0ea'; ctx.fillRect(-4 * s, -5 * s, 8 * s, 3 * s); ctx.restore();
    }
  }
  ctx.globalAlpha = 1;
}
