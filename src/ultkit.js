// ===== Ultimate kit (Cam 2026-10-15): every legend's signature is a big, animated ultimate that grows with rarity =====
// Building blocks push B.zones entries of type 'ult'; ultfx2.js draws them by `vis` and `shape`.
// Rarity (z.rar 0..5): bigger pieces, more of them, Mythic+ aftershocks, God turns everything gold.
// Sim-only file: runs headless too, so it only calls FX.* (a no-op proxy in node) and never touches FXS.
const URAR = u => (u.st && u.st.rarity) || 0;
const uY = y => clamp(y, GRID.y + 6, GRID.y + GRID.rows * GRID.ch - 4);
const uX = x => clamp(x, CASTLE_X + 24, W - 22);
function uZone(B, z) { z.type = 'ult'; z.t = 0; B.zones.push(z); return z; }
function uCrowd(B, u, r = 34, range = 999) { return densest(B.enemies, r, u, range) || nearest(B.enemies, u, range); }
function uMid(B) { const a = B.heroes.filter(h => h.alive && !h.rafter && !h.temp); if (!a.length) return null; return { x: a.reduce((s, h) => s + h.x, 0) / a.length, y: a.reduce((s, h) => s + h.y, 0) / a.length, list: a }; }
function uHit(B, u, e, D, o = {}) { if (!e.alive) return; dealDamage(B, u, e, D, { sig: true }); if (o.stun) e.stun = Math.max(e.stun, o.stun * (e.boss ? 0.4 : 1)); if (o.kb && !e.boss) e.x += o.kb; if (o.slow) { e.slowT = Math.max(e.slowT || 0, o.slowT || 2); e.slowAmt = Math.max(e.slowAmt || 0, o.slow); } }

// something huge falls (or bursts up, rise: true) on a spot. follow: track a unit until it lands.
function uDrop(B, u, o) {
  const rar = URAR(u), fall = o.fall != null ? o.fall : 0.5;
  return uZone(B, Object.assign({ vis: 'drop', rar, src: u, size: 1 + 0.08 * rar, landed: false, pw: sigPower(u) }, o, { fall, dur: fall + (o.linger != null ? o.linger : 0.6),
    step(B, z, dt) {
      if (!z.landed) { if (z.follow && z.follow.alive) { z.x = z.follow.x; z.y = z.follow.y; } if (z.t < z.fall) return; z.landed = true; z.landT = z.t;
        if (z.D) for (const e of inRadius(B.enemies, z, z.r)) uHit(B, u, e, z.D, { stun: z.stun, kb: z.kb ? z.kb * Math.sign(e.x - z.x || 1) : 0 });
        FX.ultLand(z.x, z.y, z.r, z.shape, z.rar, z.pal); if (z.onLand) z.onLand(B, z);
        if (z.rar >= 3 && z.D && !z.small) z.shock = true; return; }
      if (z.shock && z.t - z.landT > 0.3) { z.shock = false; for (const e of inRadius(B.enemies, z, z.r * 1.7)) if (dist(e, z) > z.r * 0.6) uHit(B, u, e, z.D * 0.3, { slow: 0.3 }); FX.ultShock(z.x, z.y, z.r * 1.8, z.rar, z.pal); }
      if (z.after) z.after(B, z, dt); },
    end: o.end }));
}
// a piercing thing that travels a line: first foe gets onFirst, the rest onHit (default: D)
function uLine(B, u, o) {
  const rar = URAR(u), hit = new Set();
  return uZone(B, Object.assign({ vis: 'line', rar, src: u, x: o.sx, y: o.sy, trail: [], dur: 3, travelled: 0, w: 12, v: 300, pw: sigPower(u) }, o, {
    step(B, z, dt) { const px = z.x, py = z.y; z.x += Math.cos(z.a) * z.v * dt; z.y += Math.sin(z.a) * z.v * dt; z.travelled += z.v * dt; z.trail.push([z.x, z.y]); if (z.trail.length > 40) z.trail.shift();
      const L = Math.hypot(z.x - px, z.y - py) || 1;
      for (const e of B.enemies) { if (!e.alive || hit.has(e)) continue; const f = clamp(((e.x - px) * (z.x - px) + (e.y - py) * (z.y - py)) / (L * L), 0, 1);
        if (Math.hypot(e.x - (px + f * (z.x - px)), e.y - (py + f * (z.y - py))) > z.w) continue; hit.add(e); z.last = e;
        if (!z.first) { z.first = e; if (z.onFirst) { z.onFirst(B, z, e); continue; } } if (z.onHit) z.onHit(B, z, e); else uHit(B, u, e, z.D); }
      if (z.tick) z.tick(B, z, dt);
      if (z.x > W + 40 || z.x < CASTLE_X - 20 || z.y < GRID.y - 50 || z.y > H + 20 || (z.range && z.travelled > z.range)) z.t = z.dur; },
    end: o.end }));
}
// an area that lasts: onTick every `every` seconds
function uField(B, u, o) {
  return uZone(B, Object.assign({ vis: 'field', rar: URAR(u), src: u, tk: 0, every: 0.5, pw: sigPower(u) }, o, {
    step(B, z, dt) { if (z.follow && z.follow.alive) { z.x = z.follow.x; z.y = z.follow.y; } if (z.onStep) z.onStep(B, z, dt); z.tk -= dt; if (z.tk <= 0) { z.tk = z.every; if (z.onTick) z.onTick(B, z); } },
    end: o.end }));
}
// a change in the sky over the whole field (pure show)
function uSky(B, kind, dur, rar, o = {}) { return uZone(B, Object.assign({ vis: 'sky', kind, dur, rar, step() {} }, o)); }
// many small drops over time; at(i) returns {x, y} or a unit to follow
function uRain(B, u, o) {
  return uZone(B, Object.assign({ vis: null, src: u, left: o.n, tk: 0, i: 0 }, o, { dur: o.n * o.every + 2,
    step(B, z, dt) { z.tk -= dt; if (z.tk > 0 || z.left <= 0) return; z.tk = z.every; z.left--; const p = z.at(z.i++); if (!p) return;
      uDrop(B, u, { shape: z.shape, pal: z.pal, x: p.x, y: p.y, follow: p.alive !== undefined ? p : null, r: z.r, D: z.D, stun: z.stun, fall: z.fall || 0.4, linger: z.linger || 0.15, small: true, onLand: z.onLand });
      if (!z.left && z.done) z.done(B, z); } }));
}
// a ricocheting thing: hops from foe to foe
function uBounce(B, u, o) {
  const recent = [];
  return uZone(B, Object.assign({ vis: 'bounce', rar: URAR(u), src: u, dur: 6, v: 280, spin: 0, pw: sigPower(u) }, o, {
    step(B, z, dt) { z.spin += dt * 20; let t = z.tgt; if (!t || !t.alive) { t = z.tgt = B.enemies.filter(e => e.alive && !recent.includes(e)).sort((a, b) => dist(a, z) - dist(b, z))[0]; if (!t) { z.t = z.dur; return; } }
      const d = dist(t, z); if (d > 6) { const s = Math.min(d, z.v * dt); z.x += (t.x - z.x) / d * s; z.y += (t.y - 6 - z.y) / d * s; return; }
      uHit(B, u, t, z.D); FX.ultSpark(z.x, z.y, z.shape, z.rar, z.pal); recent.push(t); if (recent.length > 2) recent.shift(); z.hops--;
      if (z.hops <= 0) { z.t = z.dur; return; } z.tgt = B.enemies.filter(e => e.alive && !recent.includes(e) && dist(e, z) < 140).sort((a, b) => dist(a, z) - dist(b, z))[0]; if (!z.tgt) z.t = z.dur; } }));
}
// a blade the size of the sky sweeps the field from top to bottom
function uSweep(B, u, o) {
  const hit = new Set();
  return uZone(B, Object.assign({ vis: 'sweep', rar: URAR(u), src: u, dur: 1, y0: GRID.y - 30, y1: GRID.y + GRID.rows * GRID.ch + 20, pw: sigPower(u) }, o, {
    step(B, z, dt) { const p = Math.min(1, z.t / 0.7), y = z.y0 + (z.y1 - z.y0) * p; z.cy = y;
      for (const e of B.enemies) if (e.alive && !hit.has(e) && e.y <= y && e.x > CASTLE_X) { hit.add(e); if (z.onHit) z.onHit(B, z, e); } } }));
}

const ULT_KIT = {
  // ===== the original 24 legends, rebuilt as ultimates =====
  shieldBash(B, u) { const c = uCrowd(B, u, 34, 220); if (!c) return false; const rar = URAR(u), rk = RK(u); guardTaunt(B, u, 2); u.shield += AB(u, 1) + u.maxHp * 0.05 * rk;
    uDrop(B, u, { shape: 'shield', pal: 'holy', x: uX(c.x), y: uY(c.y), r: 34 * (1 + 0.1 * rar) + 4 * rk, D: AB(u), stun: 1.5 + 0.2 * rk, fall: 0.45, linger: 1.1 });
    FX.text(u.x, u.y - 24, 'TAUNT', '#e9e4ff', true); FX.sound('whoosh'); },
  bladeDance(B, u) { const rk = RK(u), rar = URAR(u); const ts = B.enemies.filter(e => e.alive && dist(e, u) < 130 + 15 * rk).sort((a, b) => dist(a, u) - dist(b, u)).slice(0, 4 + rk + (rar >= 4 ? 2 : 0)); if (!ts.length) return false;
    u.dash = { ts, i: 0, t: 0, dmg: AB(u) }; const D1 = AB(u, 1);
    ts.forEach((e, i) => uDrop(B, u, { shape: 'leaf', pal: 'nature', x: e.x, y: e.y, follow: e, r: 16 + 2 * rar, D: D1, fall: 0.55 + 0.11 * i, linger: 0.1, small: true })); FX.sound('dash'); },
  pounce(B, u) { const t = B.enemies.filter(e => e.alive && dist(e, u) < 180).sort((a, b) => b.x - a.x)[0]; if (!t) return false; const rk = RK(u), rar = URAR(u), D = AB(u), D1 = AB(u, 1);
    uSky(B, 'moon', 1.3, rar); u.leap = { sx: u.x, sy: u.y, tx: t.x - 8, ty: t.y, t: 0, dur: 0.75, h: 150, onLand: () => { uHit(B, u, t, D * (1 + 0.11 * rk));
      for (const e of inRadius(B.enemies, t, 26 + 4 * rk + 3 * rar)) if (e !== t) uHit(B, u, e, D1, { stun: 0.5 }); FX.ultLand(t.x, t.y, 26 + 3 * rar, 'moonCrater', rar, 'night'); FX.claws(t.x, t.y - 10, '#c8d0ff'); FX.sound('slash'); } }; FX.sound('whoosh'); },
  whirlwind(B, u) { const c = uCrowd(B, u, 30, 260); if (!c) return false; const rar = URAR(u), rk = RK(u), r = 28 * (1 + 0.1 * rar) + 3 * rk, D = AB(u);
    uLine(B, u, { vis: 'cyclone', shape: 'cyclone', pal: rar >= 5 ? 'gold' : 'storm', sx: u.x + 14, sy: u.y, a: Math.atan2(c.y - u.y, c.x - u.x), v: 70, w: r, r, dur: 2.6 + 0.3 * rar, onFirst() {}, onHit() {}, tk: 0,
      tick(B, z, dt) { for (const e of B.enemies) if (e.alive && !e.boss && dist(e, z) < z.r * 1.6) { e.x += (z.x - e.x) * 2.2 * dt; e.y += (z.y - e.y) * 2.2 * dt; }
        z.tk -= dt; if (z.tk <= 0) { z.tk = 0.25; for (const e of inRadius(B.enemies, z, z.r)) uHit(B, u, e, D); FX.sound('whirl'); }
        const n = densest(B.enemies, 26, z, 120); if (n) z.a += clamp(Math.atan2(n.y - z.y, n.x - z.x) - z.a, -1.5 * dt, 1.5 * dt); } }); },
  quake(B, u) { const c = uCrowd(B, u, 30, 260); const rar = URAR(u), rk = RK(u), D = AB(u), a = c ? Math.atan2(c.y - u.y, c.x - u.x) : 0, hit = new Set(), n = 7 + rar + rk;
    const lines = rar >= 3 ? [a, a - 0.28, a + 0.28] : [a];
    for (const la of lines) for (let i = 0; i < n; i++) { const x = u.x + 20 + Math.cos(la) * 24 * i, y = u.y + Math.sin(la) * 24 * i; if (x > W - 10) break;
      uDrop(B, u, { shape: 'spire', pal: rar >= 5 ? 'gold' : 'earth', rise: true, x, y: uY(y), r: 18 + 2 * rar, fall: 0.07 * i, linger: 0.55, small: true,
        onLand(B, z) { for (const e of inRadius(B.enemies, z, z.r)) if (!hit.has(e)) { hit.add(e); uHit(B, u, e, D, { stun: 0.6 }); e.z = Math.max(e.z || 0, 0); } } }); }
    FX.shake(6); FX.sound('quake'); },
  dawnMend(B, u) { const rar = URAR(u), rk = RK(u), D1 = AB(u, 1); uSky(B, 'sun', 1.8, rar);
    const pulse = mul => { for (const h of B.heroes) if (h.alive) { healUnit(B, u, h, ABH(u, 0, h) * (1 + 0.13 * rk) * mul); h.poison = []; h.stun = 0; FX.skyRay(h.x, h.y, '#ffe066', rand(0, 0.15)); }
      for (const e of B.enemies.filter(e => e.alive && e.x > CASTLE_X).slice(0, 8 + 2 * rar)) { uHit(B, u, e, D1 * mul); FX.skyRay(e.x, e.y, '#ffb03a', rand(0, 0.2)); } };
    pulse(1); if (rar >= 4) uZone(B, { vis: null, dur: 1, step() {}, end() { pulse(0.5); } }); FX.flash('#fff3b0', 0.15); FX.sound('heal'); },
  raiseDead(B, u) { const rk = RK(u), rar = URAR(u); const n = B.heroes.filter(h => h.alive && h.temp && h.owner === u).length; const k = Math.min(2 + Math.floor(rk / 2) + (rar >= 4 ? 1 : 0), 4 + rk - n); if (k <= 0) return false;
    const gx = uX(u.x + 40), gy = uY(u.y);
    uDrop(B, u, { shape: 'gate', pal: rar >= 5 ? 'gold' : 'soul', rise: true, x: gx, y: gy, r: 20, fall: 0.4, linger: 1.6,
      onLand(B, z) { for (let i = 0; i < k; i++) { summonThrall(B, u, 1 + 0.1 * rk, rar >= 5 ? 'thrall' : 'thrall', { name: rar >= 5 ? 'Hollow Paladin' : 'Hollow Knight' }); const th = B.heroes[B.heroes.length - 1]; th.x = z.x + rand(4, 14); th.y = uY(z.y + rand(-12, 12)); th.hx = th.x; th.hy = th.y; } } });
    FX.sound('summon'); },
  tongueLash(B, u) { const t = B.enemies.filter(e => e.alive && dist(e, u) < u.st.range * 1.5).sort((a, b) => b.hp - a.hp)[0]; if (!t) return false; const rar = URAR(u), D = AB(u), D1 = AB(u, 1);
    uLine(B, u, { vis: 'tongue', shape: 'tongue', pal: rar >= 5 ? 'gold' : 'rose', sx: u.x + 6, sy: u.y - 8, ox: u.x + 6, oy: u.y - 8, a: Math.atan2(t.y - 8 - u.y + 8, t.x - u.x), v: 520, w: 10 + 2 * rar, range: Math.max(dist(t, u) + 60, 180), dur: 1.2,
      onFirst(B, z, e) { uHit(B, u, e, D1); }, onHit(B, z, e) { uHit(B, u, e, D1); },
      end() { if (t.alive) { if (!t.boss) { t.x = u.x + 22; t.y = u.y; t.z = 0; } t.stun = Math.max(t.stun, 2 + 0.3 * RK(u)); uHit(B, u, t, D); FX.ultLand(t.x, t.y, 14, 'splat', rar, 'rose'); FX.sound('slurp'); } } }); FX.sound('whoosh'); },
  thunderRoar(B, u) { const rar = URAR(u), rk = RK(u), m = uMid(B) || u, D1 = AB(u, 1); guardTaunt(B, u, 2.5);
    for (const h of B.heroes) if (h.alive) { h.buffAtk = AB(u) / 100 + 0.05 * rk; h.buffAtkT = 4; }
    uField(B, u, { style: 'storm', pal: rar >= 5 ? 'gold' : 'storm', x: m.x + 30, y: m.y, r: 90 + 8 * rar, dur: 4, every: 0.45 - 0.04 * rar,
      onTick(B, z) { const es = B.enemies.filter(e => e.alive && dist(e, z) < z.r + 50); for (let i = 0; i < 1 + (rar >= 3 ? 1 : 0) && es.length; i++) { const e = pick(es); uHit(B, u, e, D1, { stun: 0.2 }); FX.ultBolt(e.x, e.y - 8, rar, false); } } });
    FX.roar(u.x + 8, u.y - 10, '#ffd84a', sigPower(u)); FX.shake(5); FX.sound('roar'); },
  warDrums(B, u) { const rar = URAR(u), rk = RK(u), D1 = AB(u, 1), m = uMid(B) || u;
    for (const h of B.heroes) if (h.alive) { h.buffAs = 0.45 + 0.05 * rk; h.buffAsT = 4; healUnit(B, u, h, ABH(u, 0, h), true); }
    const hx = B.heroes.filter(h => h.alive && !h.rafter).map(h => h.x), back = hx.length ? Math.max(CASTLE_X + 34, Math.min(...hx) - 18) : CASTLE_X + 40, nd = 2 + (rar >= 3 ? 1 : 0);
    for (let i = 0; i < nd; i++) uDrop(B, u, { shape: 'drum', pal: rar >= 5 ? 'gold' : 'blood', x: back + (i % 2) * 8, y: uY(m.y - 34 + i * 68 / Math.max(1, nd - 1)), r: 10, fall: 0.35 + 0.1 * i, linger: 3.4, small: true });
    const beats = 4 + (rar >= 4 ? 1 : 0); for (let b = 0; b < beats; b++) { const hit = new Set();
      uZone(B, { vis: 'beat', pal: rar >= 5 ? 'gold' : 'blood', x: CASTLE_X + 30, dur: 0.6 + b * 0.75, start: 0.6 + b * 0.75 - 1.6, rar,
        step(B, z, dt) { if (z.t < z.start) return; z.x += 260 * dt; for (const e of B.enemies) if (e.alive && !hit.has(e) && Math.abs(e.x - z.x) < 10) { hit.add(e); uHit(B, u, e, D1, { kb: 6 }); } if (z.t - z.start < dt * 1.5) FX.sound('drums'); } }); }
    FX.text(u.x, u.y - 26, 'BOOM BOOM', '#ff5d8f', true); },
  sunlance(B, u) { const t = densest(B.enemies, 30, u, 999) || nearest(B.enemies, u, 999); if (!t) return false; const rar = URAR(u), rk = RK(u), D = AB(u), D1 = AB(u, 1), sy = u.y - 12 - (u.z || 0), ty = t.y - 8 - t.z, w = 13 + 2 * rk + 2 * rar;
    const sx = u.x + 6, ex = W + 20, slope = Math.tan(clamp(Math.atan2(ty - sy, Math.max(1, t.x - sx)), -0.4, 0.4)), lineY = x => sy + slope * (x - sx), ey = lineY(ex), pts = [];
    for (let x = sx; x < ex; x += 14) pts.push([x, lineY(x) + 8]);
    uZone(B, { vis: 'sunbeam', sx, sy, ex, ey, w, rar, dur: 0.45 + 0.5, fired: false,
      step(B, z, dt) { if (z.fired || z.t < 0.45) return; z.fired = true;
        for (const e of B.enemies) if (e.alive && e.x > u.x && Math.abs((e.y - 8 - e.z) - lineY(e.x)) < w) uHit(B, u, e, D);
        FX.flash('#fff3b0', 0.3); FX.shake(5 + rar); FX.sound('beam');
        uField(B, u, { style: 'burnline', pal: rar >= 5 ? 'gold' : 'fire', pts, x: sx, y: sy, r: 0, dur: 2.5 + 0.3 * rar, every: 0.5,
          onTick(B, f) { for (const e of B.enemies) if (e.alive && f.pts.some(p => Math.abs(p[0] - e.x) < 8 && Math.abs(p[1] - e.y) < 9)) uHit(B, u, e, D1 * 0.5); } }); } });
    FX.sound('cast'); },
  rampage(B, u) { const rk = RK(u), rar = URAR(u); const t = B.enemies.filter(e => e.alive && !e.onRafter && dist(e, u) < 140 + 10 * rk).sort((a, b) => b.x - a.x)[0]; if (!t) return false; const D = AB(u), D1 = AB(u, 1);
    const sx = u.x, sy = u.y; u.leap = { sx, sy, tx: t.x + 10, ty: t.y, t: 0, dur: 0.4, h: 6, onLand: () => { const dx = t.x + 10 - sx, dy = t.y - sy, L2 = dx * dx + dy * dy || 1;
      for (const e of B.enemies) if (e.alive && !e.onRafter) { const f = clamp(((e.x - sx) * dx + (e.y - sy) * dy) / L2, 0, 1); if (Math.hypot(e.x - (sx + f * dx), e.y - (sy + f * dy)) < 14 + 2 * rk) uHit(B, u, e, D * (1 + 0.11 * rk), { stun: 0.4 }); }
      u.buffAs = Math.max(u.buffAs, 0.4 + 0.05 * rk); u.buffAsT = 4; FX.claws(u.x + 6, u.y - 10, '#ff3d3d'); FX.sound('quake'); } };
    const nw = 2 + Math.floor(rar / 2); for (let i = 0; i < nw; i++) { const oy = (i % 2 ? 1 : -1) * (14 + 10 * Math.floor(i / 2));
      uLine(B, u, { shape: 'wolf', pal: rar >= 5 ? 'gold' : 'spirit', sx: CASTLE_X + 4 - 10 * i, sy: uY(t.y + oy), a: 0, v: 260, w: 10, D: D1, range: 440, dur: 2.4 }); }
    FX.sound('roar'); },
  earthsplitter(B, u) { const rk = RK(u), rar = URAR(u), rad = 40 * (1 + 0.12 * rk) + 3 * rar; const c = uCrowd(B, u, 38, 220); if (!c) return false; const D = AB(u), D1 = AB(u, 1);
    u.leap = { sx: u.x, sy: u.y, tx: c.x - 6, ty: c.y, t: 0, dur: 0.6, h: 120, onLand: () => { for (const e of inRadius(B.enemies, u, rad)) uHit(B, u, e, D, { stun: 1 });
      FX.ultLand(u.x, u.y, rad, 'meteorCrater', rar, rar >= 5 ? 'gold' : 'fire'); const fx = u.x, fy = u.y, cracks = [];
      for (let i = 0; i < 4 + rar; i++) { const a = i / (4 + rar) * Math.PI * 2 + 0.3; cracks.push([Math.cos(a), Math.sin(a) * 0.5]); }
      uField(B, u, { style: 'fissure', pal: rar >= 5 ? 'gold' : 'fire', x: fx, y: fy, r: rad * 1.3, cracks, dur: 3 + 0.4 * rar, every: 0.5, onTick(B, z) { for (const e of inRadius(B.enemies, z, z.r)) uHit(B, u, e, D1 * 0.5); } });
      FX.sound('quake'); } }; FX.sound('whoosh'); },
  deathMark(B, u) { const rk = RK(u), rar = URAR(u); const ts = B.enemies.filter(e => e.alive).sort((a, b) => b.hp - a.hp).slice(0, 4 + rk + (rar >= 4 ? 2 : 0)); if (!ts.length) return false; const D = AB(u);
    let hops = rar >= 2 ? 1 + rar : 0;
    const mark = (e, delay) => uDrop(B, u, { shape: 'reap', pal: rar >= 5 ? 'gold' : 'rose', x: e.x, y: e.y, follow: e, r: 12 + rar, fall: delay, linger: 0.35, small: true,
      onLand(B, z) { const was = e.alive; uHit(B, u, e, D); if (was && !e.alive && hops > 0) { hops--; const n = B.enemies.filter(x => x.alive).sort((a, b) => dist(a, e) - dist(b, e))[0]; if (n) mark(n, 0.8); } } });
    ts.forEach((e, i) => mark(e, 1.5 + 0.06 * i)); FX.sound('mark'); },
  greatFlood(B, u) { const rar = URAR(u), w = { type: 'flood', x: CASTLE_X, vx: 240, life: 1.7, t: 0, src: u, dmg: AB(u) * (1 + 0.115 * RK(u)), hit: new Set(), kb: 40 + 4 * rar, cols: rar >= 5 ? ['#ffd84a', '#fff3a0'] : null };
    B.waves.push(w); uZone(B, { vis: 'tsunami', wave: w, rar, dur: 1.7, step(B, z) { z.x = w.x; } }); FX.sound('flood'); },
  runicAegis(B, u) { const rar = URAR(u), rk = RK(u), D1 = AB(u, 1); guardTaunt(B, u, 2.5);
    for (const h of B.heroes) if (h.alive) h.shield += AB(u) * (1 + 0.12 * rk);
    const m = uMid(B) || u, n = 4 + rar; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2;
      uDrop(B, u, { shape: 'rune', pal: rar >= 5 ? 'gold' : 'arcane', x: uX(m.x + Math.cos(a) * 46), y: uY(m.y + Math.sin(a) * 30), r: 22, D: D1, stun: 0.5, fall: 0.35 + 0.05 * i, linger: 2.4, small: true }); }
    FX.sound('shield'); },
  bloom(B, u) { const rar = URAR(u), m = uMid(B) || u; const dead = B.heroes.filter(h => !h.alive && !h.temp).sort((a, b) => (b.inst ? heroRarity(b.inst) : 0) - (a.inst ? heroRarity(a.inst) : 0));
    uDrop(B, u, { shape: 'tree', pal: rar >= 5 ? 'gold' : 'blossom', rise: true, x: uX(m.x), y: uY(m.y - 6), r: 30, fall: 0.5, linger: 2.4,
      onLand() { for (const d of dead.slice(0, 1 + (rar >= 5 ? 1 : 0))) { d.alive = true; d.hp = d.maxHp * 0.6; d.stun = 0; d.poison = []; FX.text(d.x, d.y - 24, 'BLOOM', '#ff9fd0', true); }
        for (const h of B.heroes) if (h.alive) healUnit(B, u, h, ABH(u, 0, h) * (1 + 0.16 * RK(u))); FX.petals(); FX.sound('heal'); } }); },
  stampede(B, u) { const rar = URAR(u), n = 4 + RK(u) + Math.floor(rar / 2), D = AB(u);
    for (let i = 0; i < n; i++) B.waves.push({ type: 'spirit', x: CASTLE_X - i * 18, y: GRID.y + 12 + i * (GRID.rows * GRID.ch - 20) / (n - 1), vx: 180 + 10 * rar, life: 2.6, t: 0, src: u, dmg: D, hit: new Set(), h: 14 + rar, big: 1 + 0.12 * rar, gold: rar >= 5 });
    uSky(B, 'storm', 2.2, rar); FX.shake(5); FX.sound('stampede'); },

  // ===== the 24 new legends =====
  bellToll(B, u) { const c = uCrowd(B, u, 34, 230); if (!c) return false; const rar = URAR(u), rk = RK(u), r = 34 * (1 + 0.1 * rar) + 4 * rk, D1 = AB(u, 1); guardTaunt(B, u, 3);
    uDrop(B, u, { shape: 'bell', pal: rar >= 5 ? 'gold' : 'brass', x: uX(c.x), y: uY(c.y), r, D: AB(u), stun: 1, fall: 0.5, linger: 2.4, tolls: 0,
      after(B, z) { const n = 3 + (rar >= 4 ? 1 : 0); if (z.tolls < n && z.t - z.landT > 0.55 * (z.tolls + 1)) { z.tolls++; for (const e of inRadius(B.enemies, z, z.r * 1.5)) uHit(B, u, e, D1, { stun: 0.6 }); FX.ultShock(z.x, z.y - 10, z.r * 1.6, rar, 'brass'); FX.sound('anvil'); } } });
    FX.text(u.x, u.y - 24, 'TAUNT', '#e9e4ff', true); },
  mountainRoll(B, u) { const c = uCrowd(B, u, 30, 999); if (!c) return false; const rar = URAR(u), w = 16 + 3 * rar + 2 * RK(u); guardTaunt(B, u, 2.5);
    uLine(B, u, { shape: 'boulder', pal: rar >= 5 ? 'gold' : 'earth', sx: u.x + 10, sy: u.y, a: Math.atan2(c.y - u.y, c.x - u.x) * 0.5, v: 150 + 10 * rar, w, D: AB(u), dur: 4,
      onFirst(B, z, e) { uHit(B, u, e, z.D, { kb: 30, stun: 0.6 }); }, onHit(B, z, e) { uHit(B, u, e, z.D, { kb: 30, stun: 0.6 }); }, tick(B, z, dt) { if (Math.random() < 0.3) FX.ultSpark(z.x, z.y + 4, 'dust', rar, 'earth'); } });
    FX.text(u.x, u.y - 24, 'TAUNT', '#e9e4ff', true); FX.shake(5); FX.sound('quake'); },
  coralBastion(B, u) { if (!B.enemies.some(e => e.alive)) return false; const rar = URAR(u), m = uMid(B) || u, D = AB(u); guardTaunt(B, u, 3);
    const walkers = B.enemies.filter(e => e.alive && !e.flying && e.x > CASTLE_X), front = walkers.length ? Math.min(...walkers.map(e => e.x)) - 14 : (m.x + 40);
    uZone(B, { vis: 'wall', pal: rar >= 5 ? 'gold' : 'sea', x: clamp(front, CASTLE_X + 40, W - 60), rar, dur: 4 + 0.5 * rar, w: 10 + 2 * rar,
      step(B, z, dt) { for (const e of B.enemies) if (e.alive && !e.flying && e.x < z.x + z.w && e.x > z.x - 60) { if (!e.boss) e.x = z.x + z.w; else e.x = Math.max(e.x, z.x - 4); if (!(e.coralT > B.t)) { e.coralT = B.t + 1; uHit(B, u, e, D, { slow: 0.3 }); FX.ultSpark(e.x - 4, e.y - 6, 'splash', rar, 'sea'); } } } });
    FX.text(u.x, u.y - 24, 'TAUNT', '#e9e4ff', true); FX.sound('flood'); },
  tombOfKings(B, u) { const c = uCrowd(B, u, 34, 230); if (!c) return false; const rar = URAR(u), rk = RK(u); guardTaunt(B, u, 3);
    uDrop(B, u, { shape: 'sarcophagus', pal: rar >= 5 ? 'gold' : 'tomb', x: uX(c.x), y: uY(c.y), r: 38 * (1 + 0.08 * rar) + 4 * rk, D: AB(u), stun: 2, fall: 0.55, linger: 2,
      onLand(B, z) { for (const h of B.heroes) if (h.alive) { h.shield += AB(u, 1); FX.fly(z.x, z.y - 20, h.x, h.y - 10, 'skull', '#bff4ff', '#ffffff', z.pw, 0.6, rand(0.1, 0.4)); } } });
    FX.text(u.x, u.y - 24, 'TAUNT', '#e9e4ff', true); FX.sound('summon'); },
  clockworkMoon(B, u) { const es = B.enemies.filter(e => e.alive && e.x > CASTLE_X); if (!es.length) return false; const rar = URAR(u), D = AB(u), xs = es.map(e => e.x);
    const x0 = Math.max(CASTLE_X + 40, Math.min(...xs) - 20), x1 = Math.min(W - 10, Math.max(...xs) + 20);
    uZone(B, { vis: 'moonbeam', pal: rar >= 5 ? 'gold' : 'brass', mx: (x0 + x1) / 2, my: 46, x0, x1, bx: x0, by: GRID.y + 30, r: 22 + 3 * rar, rar, dur: 3.4 + 0.3 * rar, tk: 0,
      step(B, z, dt) { if (z.t < 0.5) return; const p = (z.t - 0.5) / (z.dur - 0.5), sweep = (Math.sin(p * Math.PI * (2 + rar * 0.3) - Math.PI / 2) + 1) / 2;
        z.bx = z.x0 + (z.x1 - z.x0) * sweep; const tgt = nearest(B.enemies.filter(e => e.alive), { x: z.bx, y: z.by }, 999); if (tgt) z.by += (tgt.y - z.by) * Math.min(1, 3 * dt);
        z.tk -= dt; if (z.tk <= 0) { z.tk = 0.5; for (const e of inRadius(B.enemies, { x: z.bx, y: z.by }, z.r)) uHit(B, u, e, D); FX.sound('zap'); } } });
    FX.sound('beam'); },
  starfall(B, u) { const es = B.enemies.filter(e => e.alive); if (!es.length) return false; const rar = URAR(u), rk = RK(u), n = 14 + 2 * rk + rar, D = AB(u), D1 = AB(u, 1); uSky(B, 'night', 3.8, rar);
    uRain(B, u, { shape: 'star', pal: rar >= 5 ? 'gold' : 'star', n, every: 3 / n, r: 22, D, fall: 0.4,
      at() { const l = B.enemies.filter(e => e.alive); const e = pick(l); return e ? { x: e.x + rand(-12, 12), y: uY(e.y + rand(-8, 8)) } : null; },
      done(B) { uZone(B, { vis: null, dur: 0.6, step() {}, end() { for (const e of B.enemies) if (e.alive) uHit(B, u, e, D1); const c = densest(B.enemies, 60, u, 999) || { x: 330, y: 190 }; FX.ultLand(c.x, c.y, 80, 'supernova', rar, 'star'); FX.sound('boom'); } }); } });
    FX.sound('cast'); },
  cauldron(B, u) { const c = uCrowd(B, u, 34, 999); if (!c) return false; const rar = URAR(u), rk = RK(u), r = 36 * (1 + 0.1 * rar) + 4 * rk, D1 = AB(u, 1);
    uDrop(B, u, { shape: 'cauldron', pal: rar >= 5 ? 'gold' : 'toxic', x: uX(c.x), y: uY(c.y), r: r * 0.7, D: AB(u), stun: 0.6, fall: 0.5, linger: 4.2,
      onLand(B, z) { uField(B, u, { style: 'bog', pal: rar >= 5 ? 'gold' : 'toxic', x: z.x, y: z.y, r, dur: 4 + 0.4 * rar, every: 0.5, onTick(B, f) { for (const e of inRadius(B.enemies, f, f.r)) uHit(B, u, e, D1, { slow: 0.35, slowT: 1 }); } }); } });
    FX.sound('cast'); },
  sawblades(B, u) { const t = nearest(B.enemies, u, 999); if (!t) return false; const rar = URAR(u), n = 3 + (rar >= 3 ? 1 : 0) + (rar >= 5 ? 1 : 0), D = AB(u);
    const es = B.enemies.filter(e => e.alive).sort((a, b) => dist(a, u) - dist(b, u));
    for (let i = 0; i < n; i++) uBounce(B, u, { shape: 'saw', pal: rar >= 5 ? 'gold' : 'steel', x: u.x + 8, y: u.y - 10, tgt: es[i % es.length], hops: 5 + RK(u), D, v: 300 + 20 * rar, size: 1 + 0.1 * rar });
    FX.sound('whoosh'); },
  guillotine(B, u) { const rar = URAR(u), ts = B.enemies.filter(e => e.alive).sort((a, b) => a.hp - b.hp).slice(0, 4 + RK(u) + (rar >= 4 ? 2 : 0)); if (!ts.length) return false; const D = AB(u);
    ts.forEach((e, i) => uDrop(B, u, { shape: 'guillotine', pal: rar >= 5 ? 'gold' : 'steel', x: e.x, y: e.y, follow: e, r: 10 + rar, fall: 0.5 + 0.1 * i, linger: 0.4, small: true,
      onLand(B, z) { uHit(B, u, e, D); if (e.alive && !e.boss && e.hp < e.maxHp * 0.15) { e.hp = 0; dealDamage(B, u, e, 1, { sig: true, quiet: true }); FX.text(e.x, e.y - 22, 'EXECUTED', '#ff3d6e', true); } } }));
    FX.sound('mark'); },
  alleyAmbush(B, u) { const t = B.enemies.filter(e => e.alive && dist(e, u) < 220).sort((a, b) => b.maxHp - a.maxHp)[0]; if (!t) return false; const rar = URAR(u), n = 6 + rar + RK(u), D = AB(u);
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, d = 70;
      uZone(B, { vis: 'pounceCat', pal: rar >= 5 ? 'gold' : 'shadow', sx: t.x + Math.cos(a) * d, sy: t.y + Math.sin(a) * d * 0.5, x: t.x, y: t.y, tgt: t, rar, delay: i * 0.07, dur: i * 0.07 + 0.35, hitDone: false,
        step(B, z) { if (z.t < z.delay) return; let e = z.tgt; if (!e.alive) e = z.tgt = nearest(B.enemies, z, 120) || e; z.x = e.x; z.y = e.y;
          if (!z.hitDone && z.t >= z.dur - 0.02) { z.hitDone = true; uHit(B, u, e, D); FX.claws(e.x, e.y - 10, rar >= 5 ? '#ffd84a' : '#b48cff'); FX.sound('slash'); } } }); }
    FX.sound('dash'); },
  eclipse(B, u) { const rar = URAR(u), ts = B.enemies.filter(e => e.alive && dist(e, u) < 240).sort((a, b) => dist(a, u) - dist(b, u)).slice(0, 8 + RK(u) + rar); if (!ts.length) return false; const D = AB(u);
    uSky(B, 'eclipse', 2.6, rar);
    ts.forEach((e, i) => { e.vulnT = B.t + 4; uDrop(B, u, { shape: 'crescent', pal: rar >= 5 ? 'gold' : 'night', x: e.x, y: e.y, follow: e, r: 12, fall: 0.8 + 0.07 * i, linger: 0.3, small: true, onLand() { uHit(B, u, e, D); } }); });
    FX.sound('mark'); },
  bogJaws(B, u) { const t = B.enemies.filter(e => e.alive && dist(e, u) < 200).sort((a, b) => b.hp - a.hp)[0]; if (!t) return false; const rar = URAR(u), D = AB(u), n = 3 + (rar >= 4 ? 1 : 0);
    uDrop(B, u, { shape: 'jaws', pal: rar >= 5 ? 'gold' : 'bog', rise: true, x: t.x, y: t.y, follow: t, r: 16 + 2 * rar, fall: 0.25, linger: 0.35 * n + 0.3, chomps: 0,
      onLand() { t.stun = Math.max(t.stun, 0.35 * n + 0.2); }, after(B, z) { if (z.chomps < n && z.t - z.landT > 0.35 * z.chomps) { z.chomps++; uHit(B, u, t, D); for (const e of inRadius(B.enemies, t, 14 + rar * 2)) if (e !== t) uHit(B, u, e, D * 0.3); FX.ultSpark(t.x, t.y - 6, 'chomp', rar, 'bog'); FX.sound('slurp'); if (t.alive) { z.x = t.x; z.y = t.y; } } } });
    FX.sound('summon'); },
  skyhawks(B, u) { if (!B.enemies.some(e => e.alive)) return false; const rar = URAR(u), n = 6 + rar + RK(u), D = AB(u);
    uRain(B, u, { shape: 'hawk', pal: rar >= 5 ? 'gold' : 'sky', n, every: 0.16, r: 12 + rar, D, fall: 0.35, linger: 0.1,
      at() { const l = B.enemies.filter(e => e.alive); return l.length ? pick(l.sort((a, b) => a.x - b.x).slice(0, 6)) : null; },
      onLand(B, z) { for (const e of inRadius(B.enemies, z, z.r)) e.blindT = Math.max(e.blindT || 0, 2); } });
    FX.sound('whoosh'); },
  ballista(B, u) { const t = nearest(B.enemies, u, 999); if (!t) return false; const rar = URAR(u), D = AB(u), D1 = AB(u, 1);
    uLine(B, u, { shape: 'bolt', pal: rar >= 5 ? 'gold' : 'bone', sx: u.x + 8, sy: u.y - 8, a: Math.atan2(t.y - u.y, t.x - u.x), v: 520, w: 9 + 2 * rar, D, dur: 2,
      onFirst(B, z, e) { uHit(B, u, e, D, { stun: 2 }); FX.ultSpark(e.x, e.y - 6, 'pin', rar, 'bone'); },
      end(B, z) { const p = z.last && z.last.alive ? z.last : z; const r = 30 + 3 * rar; for (const e of inRadius(B.enemies, { x: p.x, y: p.y }, r)) uHit(B, u, e, D1); FX.ultLand(p.x, p.y, r, 'blastFire', rar, rar >= 5 ? 'gold' : 'fire'); FX.sound('boom'); } });
    FX.ultMuzzle(u.x + 8, u.y - 8, 0, 'ice', rar); FX.sound('cannon'); },
  arrowOfDawn(B, u) { if (!B.enemies.some(e => e.alive)) return false; const rar = URAR(u), n = 20 + 2 * RK(u), D = AB(u); uSky(B, 'sun', 3.2, rar);
    uZone(B, { vis: 'skyArrow', x: u.x + 6, y: u.y - 12, rar, dur: 0.6, step() {} });
    uRain(B, u, { shape: 'shard', pal: 'gold', n, every: 0.09, r: 16, D, fall: 0.6 + 0.0, linger: 0.1,
      at() { const l = B.enemies.filter(e => e.alive); const e = pick(l); return e ? { x: e.x + rand(-10, 10), y: uY(e.y + rand(-6, 6)) } : { x: rand(200, 460), y: rand(GRID.y, GRID.y + 140) }; },
      done(B) { for (const h of B.heroes) if (h.alive) { healUnit(B, u, h, ABH(u, 1, h)); FX.skyRay(h.x, h.y, '#ffe066', rand(0, 0.2)); } FX.flash('#fff3b0', 0.25); FX.sound('heal'); } });
    FX.sound('twang'); },
  lilyBombs(B, u) { if (!B.enemies.some(e => e.alive)) return false; const rar = URAR(u), n = 5 + RK(u) + (rar >= 4 ? 2 : 0), D = AB(u), bounces = 3 + (rar >= 3 ? 1 : 0);
    const land = (x, y, left) => uDrop(B, u, { shape: 'lilybomb', pal: rar >= 5 ? 'gold' : 'lily', x: uX(x), y: uY(y), r: 18 + 2 * rar, D, fall: 0.35, linger: 0.05, small: true,
      onLand(B, z) { FX.ultSpark(z.x, z.y, 'splash', rar, 'sea'); if (left > 1) land(z.x + 34, z.y + rand(-8, 8), left - 1); } });
    const es = B.enemies.filter(e => e.alive).sort((a, b) => a.x - b.x).slice(0, 8);
    for (let i = 0; i < n; i++) { const e = es[i % es.length]; uZone(B, { vis: null, dur: 0.12 * i, step() {}, end() { land(e.x - 20, e.y, bounces); } }); }
    FX.sound('cannon'); },
  bloodMoon(B, u) { const rar = URAR(u), rk = RK(u), c = uCrowd(B, u, 36, 220); if (!c) return false; const rad = 38 + 4 * rk + 3 * rar, D = AB(u), D1 = AB(u, 1); uSky(B, 'bloodmoon', 4.4, rar);
    u.leap = { sx: u.x, sy: u.y, tx: c.x - 6, ty: c.y, t: 0, dur: 0.55, h: 90, onLand: () => { for (const e of inRadius(B.enemies, u, rad)) uHit(B, u, e, D, { stun: 0.6 }); FX.ultLand(u.x, u.y, rad, 'blastBlood', rar, 'blood');
      uField(B, u, { style: 'blood', pal: rar >= 5 ? 'gold' : 'blood', x: u.x, y: u.y, r: rad * 1.2, dur: 4, every: 0.5, onTick(B, z) { let tot = 0; for (const e of inRadius(B.enemies, z, z.r)) { const h0 = e.hp; uHit(B, u, e, D1 * 0.5); tot += Math.max(0, h0 - e.hp); } if (tot && u.alive) healUnit(B, u, u, tot * 0.5, true); } });
      FX.sound('quake'); } }; FX.sound('roar'); },
  anvilDrop(B, u) { const c = uCrowd(B, u, 34, 999); if (!c) return false; const rar = URAR(u), rk = RK(u), r = 32 * (1 + 0.1 * rar) + 4 * rk, D1 = AB(u, 1);
    uDrop(B, u, { shape: 'anvil', pal: rar >= 5 ? 'gold' : 'iron', x: uX(c.x), y: uY(c.y), r, D: AB(u), stun: 1.2, fall: 0.6, linger: 1.4,
      onLand(B, z) { for (const e of inRadius(B.enemies, z, r * 2)) if (dist(e, z) > r * 0.8) uHit(B, u, e, D1); FX.sound('anvil'); } });
    FX.sound('whoosh'); },
  avalanche(B, u) { if (!B.enemies.some(e => e.alive)) return false; const rar = URAR(u), c = uCrowd(B, u, 30, 999), D = AB(u);
    uLine(B, u, { shape: 'bear', pal: rar >= 5 ? 'gold' : 'frost', sx: CASTLE_X + 10, sy: uY(c.y), a: 0, v: 230, w: 18 + 2 * rar, D, dur: 3,
      onFirst(B, z, e) { uHit(B, u, e, D, { stun: 1.5, kb: 18 }); e.frozen = Math.max(e.frozen || 0, 1.5); }, onHit(B, z, e) { uHit(B, u, e, D, { stun: 1.5, kb: 18 }); e.frozen = Math.max(e.frozen || 0, 1.5); },
      tick(B, z) { if (Math.random() < 0.5) FX.ultSpark(z.x - 14, z.y + 2, 'snow', rar, 'frost'); } });
    u.buffAs = Math.max(u.buffAs, 0.5); u.buffAsT = 4; FX.shake(6); FX.sound('roar'); },
  soulHarvest(B, u) { if (!B.enemies.some(e => e.alive)) return false; const rar = URAR(u), D = AB(u), D1 = AB(u, 1);
    uSweep(B, u, { pal: rar >= 5 ? 'gold' : 'soul', onHit(B, z, e) { const was = e.alive; uHit(B, u, e, D); if (was && !e.alive && u.alive) { healUnit(B, u, u, D1, true); FX.fly(e.x, e.y - 8, u.x, u.y - 10, 'skull', '#9dff6a', '#ffffff', 1.5, 0.5, 0.1); } } });
    FX.shake(8); FX.sound('slash'); },
  groveOfRenewal(B, u) { const rar = URAR(u), m = uMid(B); if (!m) return false;
    uDrop(B, u, { shape: 'oak', pal: rar >= 5 ? 'gold' : 'nature', rise: true, x: uX(m.x + 10), y: uY(m.y - 4), r: 50 + 5 * rar, fall: 0.45, linger: 4 + 0.4 * rar, tk: 0,
      after(B, z, dt) { z.tk -= dt; if (z.tk > 0) return; z.tk = 1; for (const h of B.heroes) if (h.alive && dist(h, z) <= z.r * 1.4) { healUnit(B, u, h, ABH(u, 0, h), true); FX.particles(h.x, h.y - 6, 4, ['#d9f59b', '#ffffff'], { spread: 6, up: true }); }
        for (const e of inRadius(B.enemies, z, z.r)) if (!(e.rootT > B.t)) { e.rootT = B.t + 2; e.stun = Math.max(e.stun, e.boss ? 0.3 : 1); FX.ultSpark(e.x, e.y, 'root', rar, 'nature'); } } });
    FX.sound('heal'); },
  cathedral(B, u) { const rar = URAR(u), m = uMid(B); if (!m) return false; const dur = 3 + 0.3 * rar;
    for (const h of B.heroes) if (h.alive) { h.undyingT = B.t + dur; healUnit(B, u, h, ABH(u, 0, h)); }
    uZone(B, { vis: 'cathedral', pal: rar >= 5 ? 'gold' : 'glass', x: m.x, y: m.y, r: Math.max(50, ...m.list.map(h => dist(h, m))) + 16, rar, dur, step(B, z) { const n = uMid(B); if (n) { z.x += (n.x - z.x) * 0.05; z.y += (n.y - z.y) * 0.05; } } });
    FX.flash('#fff3e0', 0.2); FX.sound('shield'); },
  lanterns(B, u) { const rar = URAR(u), hs = B.heroes.filter(h => h.alive); if (!hs.length) return false;
    for (const h of hs) { h.shield += ABH(u, 0, h);
      uField(B, u, { style: 'lantern', pal: rar >= 5 ? 'gold' : 'soul', follow: h, x: h.x, y: h.y, r: 0, dur: 4 + 0.4 * rar, every: 1, onTick(B, z) { if (h.alive) healUnit(B, u, h, ABH(u, 1, h), true); } }); }
    FX.sound('summon'); },
  rainOfPlenty(B, u) { const rar = URAR(u), D1 = AB(u, 1); uSky(B, 'raincloud', 4.4 + 0.4 * rar, rar);
    uField(B, u, { style: 'rain', pal: rar >= 5 ? 'gold' : 'sea', x: 280, y: 190, r: 0, dur: 4 + 0.4 * rar, every: 0.5,
      onTick(B, z) { for (const h of B.heroes) if (h.alive) healUnit(B, u, h, ABH(u, 0, h), true);
        const es = B.enemies.filter(e => e.alive); for (let i = 0; i < 1 + (rar >= 5 ? 1 : 0) && es.length; i++) { const e = pick(es); uDrop(B, u, { shape: 'frog', pal: rar >= 5 ? 'gold' : 'lily', x: e.x, y: e.y, follow: e, r: 14, D: D1, fall: 0.4, linger: 0.2, small: true }); } } });
    FX.sound('heal'); },
};
Object.assign(ABILITIES, ULT_KIT);
