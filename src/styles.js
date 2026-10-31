// ===== Elemental fighting styles (Cam 2026-10-23) =====
// Every element changes how a champion fights: where it stands, who it picks and what its hits do.
// Style level per element (st.sty): 0 alone, 1 with 2 on the field, 2 with 4, 3 with 6 (six also wakes the castle).
// u.sty is the champion's own element and sets targeting and movement; a crest's second element only adds its on-hit part.
const STYLE_INFO = {
  dark:      { style: 'Soul drain', role: 'Hexer',     how: 'Curses the toughest foe in reach and drains its life through a shadow tether. Cursed foes take extra damage. Hits wither foes so they hit softer.',
    tiers: ['A curse every 5s. Cursed foes take +15% damage and the drain heals the Dark champion.', 'Each curse fills foes around it with dread: they turn and flee. A cursed foe that dies passes the curse on.', 'Foes that die cursed rise as shades that fight for you for 5s.'] },
  light:     { style: 'Lantern bearer', role: 'Beacon', how: 'Never chases. Stands beside the most hurt ally, and every hit also heals that ally. Hits blind foes.',
    tiers: ['Each hit heals the ally for 30% of its damage.', 'Every 4th hit is a flash that blinds every foe nearby.', 'The first ally to fall each siege gets back up at 30% HP.'] },
  lightning: { style: 'Hop', role: 'Skirmisher', how: 'Every attack hops it to a different foe, zapping whatever it passes.',
    tiers: ['Hops reach further.', 'Hops leave the two-hex circle. Every 3rd hop drops a bolt where it lands.', 'Lightning champions are linked by a live wire that zaps foes crossing it.'] },
  fire:      { style: 'Firewalk', role: 'Charger', how: 'Charges into the thickest crowd and leaves a burning trail.',
    tiers: ['The trail burns for 3s.', 'Burning foes burst when they die and set their neighbours alight.', 'The trail becomes a wall of fire that lasts twice as long.'] },
  water:     { style: 'Pushback', role: 'Tide', how: 'Holds its lane. Hits shove foes back, and a foe shoved into another foe hurts both.',
    tiers: ['Bigger shoves. Collisions deal damage.', 'Every 5th hit is a wave that pushes back its whole lane.', 'Pushed foes are soaked and take +20% damage.'] },
  ice:       { style: 'Frost ring', role: 'Warden', how: 'Stands in a ring of frost that slows foes, and always targets the fastest foe in reach.',
    tiers: ['The ring slows foes by 25%.', 'The ring grows. A foe that stays inside for 3s freezes solid.', 'Frozen foes shatter when killed and hurt foes around them.'] },
  nature:    { style: 'Rooted', role: 'Grove', how: 'Never moves from where you put it. Roots grab a foe at range and drag it in. Thorns hurt attackers.',
    tiers: ['A root every 4s.', 'Plants a sapling that taunts foes near it.', 'Every root heals all Nature champions.'] },
  void:      { style: 'Yank', role: 'Displacer', how: 'Yanks the most dangerous back-row foe (archer, healer, caster) into the middle of your heroes. Hits shred armour.',
    tiers: ['A yank every 6s.', 'A yanked foe lands stunned with its armour shredded.', 'Each yank pulls three foes into one pile.'] },
  salty:     { style: 'Grudge', role: 'Duelist', how: 'Locks onto whatever hit it last and will not switch until it is dead. Every hit on it hits harder.',
    tiers: ['+8% damage per hit on its grudge.', 'Its grudge is taunted and can only fight the Salty champion.', 'Killing a grudge passes the rage to the nearest Salty ally.'] },
  sweet:     { style: 'Buddy', role: 'Sidekick', how: 'Sticks to your strongest ally, copies their target and gives them a sugar rush. Hits make foes sticky.',
    tiers: ['The buddy attacks 25% faster.', 'The buddy also deals +20% damage. Three sticky hits glue a foe in place.', 'Every Sweet champion picks a different buddy and the rush doubles.'] },
  meat:      { style: 'Intercept', role: 'Bodyguard', how: 'Steps in front of whichever ally is taking the most damage and taunts foes around it. Grows as it gets hurt.',
    tiers: ['Taunts last longer.', 'Takes 30% of the damage aimed at allies next to it.', 'At half HP it swells and slams the ground.'] },
  treat:     { style: 'Snack toss', role: 'Lure', how: 'Tosses snacks that pull foes toward your strongest hitter. Hunts elites and gold carriers first.',
    tiers: ['A lure every 6s.', 'Kills drop healing snacks, and +40% gold.', 'Snacks explode in candy when the lure ends.'] },
};
for (const e in STYLE_INFO) ELEMENTS[e].desc = `${STYLE_INFO[e].role}. ${STYLE_INFO[e].how}`;
const SL = (a, lv) => a[Math.max(0, Math.min(a.length - 1, lv))];
const styLv = (u, e) => (u.st && u.st.sty && u.st.sty[e]) || 0;
function styleLine(e, lv) { const I = STYLE_INFO[e]; return lv > 0 ? I.tiers[lv - 1] : I.how; }

// small stat leans that go with each style (applied in heroStats)
function styleStats(s, e, lv, p) {
  switch (e) {
    case 'dark': s.lifesteal += 0.12 * p; break;
    case 'light': s.crit += 0.1 * p; break;
    case 'lightning': s.as *= 1 + 0.25 * p; break;
    case 'fire': s.spd *= 1.25; s.sigMul *= 1 + 0.2 * p; break;
    case 'water': s.regen += 0.006 * p; break;
    case 'nature': s.hp *= 1 + 0.25 * p; s.regen += 0.01 * p; s.reflect += 0.15 * p; break;
    case 'salty': s.crit += 0.12; s.critMul += 0.3; s.hp *= 1.1; break;
    case 'sweet': s.as *= 1 + 0.08 * p; break;
    case 'meat': s.hp *= 1 + 0.35 * p; s.armor += 15 * p; s.scale *= 1.15; break;
    case 'treat': s.greed += 0.1 * p; break;
    case 'ice': s.armor += 8 * p; break;
    case 'void': s.ap *= 1 + 0.08 * p; break;
  }
}

function styleInit(B) {
  B.styInit = true; B.styLv = {}; B.fire = []; B.dark = []; B.pulls = []; B.snacks = []; B.wires = []; B.styT = 0;
  for (const u of B.heroes) if (u.st && u.st.sty) {
    for (const e in u.st.sty) B.styLv[e] = Math.max(B.styLv[e] || 0, u.st.sty[e]);
    u.sty = u.inst && u.inst.el && u.st.sty[u.inst.el] != null ? u.inst.el : Object.keys(u.st.sty)[0] || null;
    u.h0 = { x: u.hx, y: u.hy }; u.sx = { cd: 1.5 + Math.random(), hop: 0 };
    if (u.sty === 'nature' && !u.rafter) u.noMove = true;
  }
  B.sty = B.heroes.some(u => u.sty);
}

// once per frame, before the heroes move
function styleTick(B, dt) {
  if (!B.styInit) styleInit(B);
  for (const h of B.heroes) h.auraAs = 0, h.sweetDmg = 0;
  if (!B.sty) return;
  const lvF = B.styLv;
  B.styT += dt; const slow = B.styT >= 0.5; if (slow) B.styT = 0;
  // who is getting hurt (for Meat), refreshed twice a second
  if (slow) for (const h of B.heroes) { h.recentDmg = (h.recentDmg || 0) * 0.6 + (h.taken - (h.takenPrev || 0)); h.takenPrev = h.taken; }
  for (const u of B.heroes) {
    if (!u.alive || !u.sty) continue;
    const lv = styLv(u, u.sty);
    if (u.sty === 'ice' && !u.rafter) {
      const R = SL([26, 34, 46, 54], lv), sl = SL([0.15, 0.25, 0.3, 0.35], lv);
      for (const e of B.enemies) if (e.alive && !e.flying && dist(e, u) < R) {
        e.slowT = Math.max(e.slowT, 0.3); e.slowAmt = Math.max(e.slowAmt, sl); e.inRing = 0.2;
        if (lv >= 2) { e.iceT = (e.iceT || 0) + dt; if (e.iceT >= 3) { e.iceT = 0; e.stun = Math.max(e.stun, e.boss ? 0.4 : 1.2); e.frozen = e.boss ? 0.4 : 1.2; FX.particles(e.x, e.y - 8, 8, ['#bfeeff', '#ffffff'], { spread: 12 }); FX.text(e.x, e.y - 20, 'frozen', '#bfeeff'); } }
      }
    }
    if (u.sty === 'dark' && u.sx.curse) { const c = u.sx.curse;
      if (!c.alive || !(c.hexT > 0) || dist(c, u) > 170) { if (c.hexer === u) c.hexT = 0; u.sx.curse = null; }
      else if ((u.sx.drainT -= dt) <= 0) { u.sx.drainT = 0.5; const amt = u.st.atk * SL([0.2, 0.3, 0.4, 0.5], lv) * 0.5;
        dealDamage(B, u, c, amt, { noProc: true, kind: 'magic', from: 'element', quiet: true }); healUnit(B, u, u, amt * 0.8, true, 'element'); } }
    if (u.sty === 'sweet' && u.buddy && u.buddy.alive) {
      const b = u.buddy, k = lv >= 3 ? 2 : 1;
      b.auraAs = Math.max(b.auraAs, SL([0.15, 0.25, 0.25, 0.25], lv) * k); b.sweetDmg = Math.max(b.sweetDmg, (lv >= 2 ? 0.2 : 0.08) * k);
    }
  }
  for (const e of B.enemies) if (e.hexT > 0) e.hexT -= dt;
  for (const d of B.dark) d.t += dt; B.dark = B.dark.filter(d => d.t < 0.35);
  for (const e of B.enemies) if (e.iceT && !(e.inRing > 0)) e.iceT = Math.max(0, e.iceT - dt); else if (e.inRing > 0) e.inRing -= dt;
  // fire trail
  for (const f of B.fire) { f.t += dt; f.tick -= dt; if (f.tick <= 0) { f.tick = 0.5; for (const e of B.enemies) if (e.alive && !e.flying && Math.abs(e.x - f.x) < f.r && Math.abs(e.y - f.y) < f.r * 0.7) e.poison.push({ dps: f.dps, t: 1, src: f.src, fire: true, from: 'element' }); } }
  B.fire = B.fire.filter(f => f.t < f.life);
  // roots and yanks drag foes across the field
  for (const p of B.pulls) { const e = p.e; p.t += dt; if (!e.alive) { p.done = true; continue; }
    const k = Math.min(1, p.t / p.dur), q = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2; e.x = p.sx + (p.tx - p.sx) * q; e.y = p.sy + (p.ty - p.sy) * q; e.stun = Math.max(e.stun, 0.05);
    if (k >= 1) { p.done = true; if (p.land) p.land(e); } }
  B.pulls = B.pulls.filter(p => !p.done);
  // snacks: lured foes walk to them; at Treat 6 they explode when the lure ends
  for (const s of B.snacks) { s.t += dt; if (s.t >= s.life) { s.done = true;
    if (s.boom) { for (const e of inRadius(B.enemies, s, 26)) dealDamage(B, s.src, e, s.src.st.atk * 2, { noProc: true, kind: 'magic', from: 'element' }); FX.explode(s.x, s.y - 4, 24, ['#ffb02e', '#ff8ad8', '#ffffff']); FX.sound('boom'); } } }
  B.snacks = B.snacks.filter(s => !s.done);
  // the live wire between Lightning champions at 6
  B.wires.length = 0;
  if ((lvF.lightning || 0) >= 3) { const L = B.heroes.filter(h => h.alive && h.sty === 'lightning').sort((a, b) => a.y - b.y);
    for (let i = 0; i + 1 < L.length; i++) { const a = L[i], b = L[i + 1]; B.wires.push([a, b]);
      if (slow) for (const e of B.enemies) if (e.alive && segDist(e, a, b) < 7) dealDamage(B, a, e, a.st.atk * 0.5, { noProc: true, kind: 'magic', from: 'element', quiet: true }); } }
  // clones and saplings that run out
  for (const h of B.heroes) if (h.alive && h.lifeT != null) { h.lifeT -= dt; if (h.lifeT <= 0) { h.alive = false; h.hp = 0; FX.particles(h.x, h.y - 8, 8, '#8a5ad8', { spread: 12 }); } }
}
function segDist(p, a, b) { const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy || 1, k = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l)); return Math.hypot(p.x - a.x - k * dx, p.y - a.y - k * dy); }
// holding styles (Light, Ice) still answer foes beating on the wall
const wallUnderAttack = B => B.enemies.some(e => e.alive && e.siegeT != null && B.t - e.siegeT < 2);
const styleFoes = (B, f) => B.enemies.filter(e => e.alive && e.x < W - 6 && !e.onRafter && !e.climb && (!f || f(e)));
const backRow = e => (e.range > 40 ? 2 : 0) + (e.def && e.def.kind === 'healer' ? 2 : 0) + (e.def && e.def.elite ? 1 : 0);
function pullFoe(B, src, e, tx, ty, col, land) {
  if (B.pulls.some(p => p.e === e)) return;
  B.pulls.push({ e, src, sx: e.x, sy: e.y, tx: clamp(tx, CASTLE_X + 20, W - 10), ty: clamp(ty, GRID.y + 4, GRID.y + GRID.rows * GRID.cell - 4), t: 0, dur: 0.45, col, land });
  e.stun = Math.max(e.stun, 0.5); e.target = null;
}

// Dark: a curse with a draining tether. At 4 it spreads dread (foes nearby flee) and jumps on when the cursed foe dies
function curseFoe(B, u, v, lv, from) {
  v.hexT = SL([3, 4, 4, 5], lv); v.hexAmp = SL([0.1, 0.15, 0.2, 0.25], lv); v.hexer = u; u.sx.curse = v; u.sx.drainT = 0.5;
  FX.text(v.x, v.y - 24, 'CURSED', '#b48aff', !from); FX.particles(v.x, v.y - 10, 8, ['#8a5ad8', '#2a1a4a'], { spread: 10, up: true });
  if (from) B.dark.push({ a: { x: from.x, y: from.y }, b: v, t: 0 });
  if (lv >= 2) { let n = 0; for (const e of inRadius(B.enemies, v, 34)) if (!e.boss && e !== v && !e.onRafter && !e.climb && !(e.calmT > B.t)) { e.fearT = 1.2; e.calmT = B.t + 4; e.fearOf = v; e.target = null; n++; }
    if (n) { FX.ring(v.x, v.y - 6, 30, '#8a5ad8'); FX.text(v.x, v.y - 34, 'dread', '#d8c0ff'); } }
}
// a frightened foe runs back toward its camp instead of fighting
function styleFeared(B, e, dt) {
  e.fearT -= dt; if (e.boss) { e.fearT = 0; return false; }
  const from = e.fearOf && e.fearOf.alive ? e.fearOf : { x: e.x - 10, y: e.y };
  moveToward(e, Math.min(W - 8, e.x + 30), clamp(e.y + (e.y - from.y) * 0.5, GRID.y + 4, GRID.y + GRID.rows * GRID.cell - 4), e.spd * 0.8 * hzSpd(B, e), dt); e.facing = 1;
  return true;
}

// per hero, every frame. Returns true when the style used the frame (a blink)
function styleStep(B, u, dt) {
  if (!B.styInit) styleInit(B);
  const e0 = u.sty; if (!e0 || u.rafter) return false;
  const lv = styLv(u, e0), S = u.sx, foesUp = B.enemies.some(e => e.alive);
  if (foesUp) S.cd -= dt;
  S.look = (S.look || 0) - dt; const look = S.look <= 0; if (look) S.look = 0.4;
  switch (e0) {
    case 'dark': if (S.cd <= 0) {
      // the toughest foe in reach gets the curse (most HP left, so the drain has something to drink)
      const v = styleFoes(B, e => dist(e, u) < u.st.range + 70 && !(e.hexT > 0)).sort((a, b) => b.hp - a.hp)[0];
      if (v) { S.cd = SL([7, 5, 4.5, 4], lv); curseFoe(B, u, v, lv); FX.sound('whoosh'); } else S.cd = 0.5; } break;
    case 'light': if (look) { const w = B.heroes.filter(h => h.alive && h !== u && !h.temp && !h.rafter && h.hp < h.maxHp * 0.92).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0]; u.ward = w || null;
      const p = w ? { x: w.x - 11, y: w.y + 3 } : u.h0; u.hx = p.x; u.hy = p.y; } break;
    case 'sweet': if (look) { const taken = new Set(lv >= 3 ? B.heroes.filter(h => h !== u && h.sty === 'sweet' && h.buddy).map(h => h.buddy) : []);
      const pow = h => h.st.atk * heroAS(h) * Math.max(1, h.st.ap);
      const b = B.heroes.filter(h => h.alive && h !== u && !h.temp && !h.rafter && !taken.has(h)).sort((a, b) => (a.sty === 'sweet') - (b.sty === 'sweet') || pow(b) - pow(a))[0];
      u.buddy = b || null; const p = b ? { x: b.x - 9, y: b.y + 5 } : u.h0; u.hx = p.x; u.hy = p.y; } break;
    case 'meat': {
      if (look) { const g = B.heroes.filter(h => h.alive && h !== u && !h.temp && !h.rafter && (h.recentDmg || 0) > h.maxHp * 0.03).sort((a, b) => b.recentDmg - a.recentDmg)[0];
        u.guard = g || null; const p = g ? { x: g.x + 11, y: g.y } : u.h0; u.hx = p.x; u.hy = p.y; }
      if (S.cd <= 0) { const near = inRadius(B.enemies, u, 30).filter(e => !e.flying); if (near.length) { S.cd = 3; const tt = SL([1, 1.5, 1.8, 2], lv); for (const e of near) { e.taunt = u; e.tauntT = Math.max(e.tauntT, tt); } FX.ring(u.x, u.y - 6, 26, '#ff6a6a'); FX.text(u.x, u.y - 26, 'OI!', '#ff6a6a'); } }
      u.vscale = u.st.scale * (1 + 0.35 * (1 - u.hp / u.maxHp));
      break; }
    case 'nature': if (S.cd <= 0) {
      const v = styleFoes(B, e => !e.flying && dist(e, u) < 120 && dist(e, u) > 22).sort((a, b) => backRow(b) - backRow(a) || dist(a, u) - dist(b, u))[0];
      if (v) { S.cd = SL([5, 4, 3.5, 3], lv);
        if (v.boss) { v.stun = Math.max(v.stun, 0.4); FX.text(v.x, v.y - 24, 'rooted', '#6fdc5a'); }
        else pullFoe(B, u, v, u.x + 13, u.y + rand(-4, 4), '#6fdc5a', e => { e.stun = Math.max(e.stun, 0.5); });
        FX.particles(v.x, v.y - 2, 6, ['#6fdc5a', '#2f8a3a'], { spread: 8, up: true });
        if (lv >= 3) for (const h of B.heroes) if (h.alive && h.sty === 'nature') healUnit(B, u, h, h.maxHp * 0.04, true, 'element');
      } else S.cd = 0.4; }
      if (lv >= 2 && !S.sapling && foesUp) { S.sapling = true; summonThrall(B, u, 0.8, 'sapling', { name: 'Sapling', col: '#6fdc5a' }); const sp = B.heroes[B.heroes.length - 1]; sp.x = sp.hx = u.x + 22; sp.y = sp.hy = u.y; sp.noMove = true; sp.st.atk = 0; sp.st.spd = 0; sp.sapling = true; sp.st.armor = 40; sp.sx = { cd: 0 }; }
      break;
    case 'void': if (S.cd <= 0) {
      const v = styleFoes(B, e => !e.boss && e.x > u.x + 30).sort((a, b) => backRow(b) - backRow(a) || b.x - a.x)[0];
      if (v) { S.cd = SL([8, 6, 5, 4], lv); const tx = u.x + 24, ty = u.y;
        const land = e => { if (lv >= 2) { e.stun = Math.max(e.stun, 1); e.shred = Math.min(60, e.shred + 20); } FX.ring(e.x, e.y - 6, 12, '#7a5aff'); };
        pullFoe(B, u, v, tx, ty, '#7a5aff', land);
        if (lv >= 3) styleFoes(B, e => e !== v && !e.boss && dist(e, v) < 50).sort((a, b) => dist(a, v) - dist(b, v)).slice(0, 2).forEach((e, i) => pullFoe(B, u, e, tx + 6, ty + (i ? 7 : -7), '#7a5aff', land));
        FX.text(u.x, u.y - 26, 'GET OVER HERE', '#7a5aff'); FX.sound('whoosh');
      } else S.cd = 0.5; } break;
    case 'treat': if (S.cd <= 0 && foesUp) {
      const hit = B.heroes.filter(h => h.alive && !h.temp && !h.rafter && h !== u).sort((a, b) => b.st.atk * Math.max(1, b.st.ap) - a.st.atk * Math.max(1, a.st.ap))[0] || u;
      const sp = { x: clamp(hit.x + 18, CASTLE_X + 20, W - 10), y: hit.y };
      const pulled = styleFoes(B, e => !e.boss && dist(e, sp) < SL([45, 55, 65, 75], lv));
      if (pulled.length) { S.cd = SL([8, 6, 5, 4], lv); const s = Object.assign(sp, { t: 0, life: 2 + 0.3 * lv, src: u, boom: lv >= 3 }); B.snacks.push(s);
        for (const e of pulled) { e.lure = s; e.lureT = s.life; e.target = null; }
        FX.text(sp.x, sp.y - 16, 'SNACK!', '#ffb02e'); FX.sound('jingle'); } else S.cd = 0.5; } break;
    case 'fire': { const m = Math.hypot(u.x - (S.lx ?? u.x), u.y - (S.ly ?? u.y)); S.lx = u.x; S.ly = u.y; S.walk = (S.walk || 0) + m;
      if (S.walk >= 6 && foesUp) { S.walk = 0; B.fire.push({ x: u.x, y: u.y, t: 0, tick: 0, life: lv >= 3 ? 6 : 3, r: lv >= 3 ? 8 : 6, src: u, dps: u.st.atk * SL([0.12, 0.2, 0.25, 0.3], lv) }); if (B.fire.length > 140) B.fire.shift(); }
      break; }
  }
  return false;
}

// target picking. Returns true when the style decided (a null target then means hold position)
function styleTarget(B, u) {
  const e0 = u.sty; if (!e0 || u.rafter) return false;
  const lv = styLv(u, e0), reach = u.st.range + 6;
  switch (e0) {
    case 'dark': { const c = u.sx.curse; if (c && c.alive && c.hexT > 0 && dist(c, u) < reach + 30 && (u.st.range > 40 || !c.flying)) { u.target = c; return true; } return false; }
    case 'light': if (u.def.cls === 'cleric') return false; u.target = nearest(B.enemies, u, reach, e => !e.onRafter && !e.climb); return !!u.target || !wallUnderAttack(B);
    case 'nature': u.target = nearest(B.enemies, u, reach + 4, e => !e.onRafter && !e.climb && (u.st.range > 40 || !e.flying)); return true;
    case 'ice': { const R = SL([26, 34, 46, 54], lv); u.target = styleFoes(B, e => dist(e, u.h0) < R + reach && (u.st.range > 40 || !e.flying)).sort((a, b) => b.spd * (1 - b.slowAmt) - a.spd * (1 - a.slowAmt))[0] || null; return !!u.target || !wallUnderAttack(B); }
    case 'salty': if (u.grudge && u.grudge.alive && dist(u.grudge, u.h0) < 120 && !u.grudge.onRafter) { u.target = u.grudge; return true; } return false;
    case 'sweet': { const b = u.buddy; if (b && b.alive && b.target && b.target.alive && b.target.side === 'enemy') { u.target = b.target; return true; } return false; }
    case 'meat': if (u.guard && u.guard.alive) { u.target = nearest(B.enemies, u, 40, e => !e.flying || u.st.range > 40); return true; } return false;
    case 'fire': { const home = u.h0, c = densest(styleFoes(B, e => !e.flying || u.st.range > 40), 26, home, 170); if (c) { u.target = c; return true; } return false; }
    case 'treat': { const v = styleFoes(B, e => (e.def.elite || e.captain || e.hat || e.turncoat) && dist(e, u) < u.st.range + 70)[0]; if (v) { u.target = v; return true; } return false; }
    case 'lightning': if (u.sx.hopT > B.t && u.target && u.target.alive) return true; return false;
  }
  return false;
}

// after a basic attack: Lightning hops to its next foe
function styleAttacked(B, u, t) {
  if (u.sty !== 'lightning' || u.rafter || u.healing) return;
  const lv = styLv(u, 'lightning'), R = SL([50, 62, 76, 90], lv), melee = u.st.range <= 40;
  const nx = styleFoes(B, e => e !== t && dist(e, u) < R && (melee ? !e.flying && dist(e, u.h0) < 120 + 20 * lv : true) && (lv >= 2 || heroZoneOk(B, u, e))).sort((a, b) => dist(a, u) - dist(b, u))[0];
  if (!nx) return;
  { const mid = { x: (u.x + nx.x) / 2, y: (u.y + nx.y) / 2 }, z = nearest(B.enemies, mid, 26, e => e !== nx && e !== t); if (z) { dealDamage(B, u, z, u.st.atk * 0.6, { noProc: true, kind: 'magic', from: 'element' }); FX.bolt([{ x: u.x, y: u.y - 10 }, { x: z.x, y: z.y - 8 }], '#9ff6ff'); } }
  if (melee) { FX.afterimage(u); FX.bolt([{ x: u.x, y: u.y - 10 }, { x: nx.x, y: nx.y - 8 }], '#9ff6ff'); u.x = nx.x + (nx.x > u.x ? -9 : 9); u.y = nx.y; }
  u.target = nx; u.sx.hopT = B.t + 1 / heroAS(u) + 0.1; u.retarget = 1 / heroAS(u) + 0.1; u.cd = Math.min(u.cd, 0.18 / Math.max(0.2, heroAS(u)) + u.cd * 0.7);
  u.sx.hop = (u.sx.hop || 0) + 1;
  if (lv >= 2 && u.sx.hop % 3 === 0) { for (const e of inRadius(B.enemies, nx, 22)) dealDamage(B, u, e, u.st.atk * 1.1, { noProc: true, kind: 'magic', from: 'element' }); FX.bolt([{ x: nx.x + 2, y: nx.y - 90 }, { x: nx.x - 3, y: nx.y - 40 }, { x: nx.x, y: nx.y - 6 }], '#ffffff'); FX.ring(nx.x, nx.y, 22, '#9ff6ff'); FX.sound('zap'); }
}

// damage multiplier on any hit: blinks, grudges, the buddy's sugar and Meat's shared hurt
function styleDmgMul(B, src, tgt, o, amount) {
  let m = 1;
  if (src && src.side === 'hero' && src.sx) {
    if (src.sty === 'salty' && tgt === src.grudge && src.grudgeN) m *= 1 + SL([0.05, 0.08, 0.1, 0.12], styLv(src, 'salty')) * src.grudgeN;
  }
  if (src && src.sweetDmg) m *= 1 + src.sweetDmg;
  if (tgt.hexT > 0 && src && src.side === 'hero') m *= 1 + tgt.hexAmp;
  if (src && src.side === 'enemy' && src.witherT > B.t) m *= 1 - src.witherAmt;
  if (tgt.side === 'hero' && src && src.side === 'enemy' && !o.shared && (B.styLv.meat || 0) >= 2 && tgt.sty !== 'meat') {
    const g = B.heroes.find(h => h.alive && h.sty === 'meat' && styLv(h, 'meat') >= 2 && dist(h, tgt) < 30);
    if (g) { dealDamage(B, src, g, amount * 0.3, { shared: true, noProc: true, quiet: true, unavoidable: true }); m *= 0.7; }
  }
  return m;
}

// a hero is hit: Salty picks its grudge, Meat grows and slams
function styleHurt(B, u, src, o) {
  if (u.sty === 'salty' && src && src.side === 'enemy' && src.alive && (!u.grudge || !u.grudge.alive)) { u.grudge = src; u.grudgeN = u.rage || 0; u.rage = 0; FX.text(u.x, u.y - 26, 'GRUDGE', '#e8eef8', true); }
  if (u.sty === 'meat' && styLv(u, 'meat') >= 3 && !u.slammed && u.hp < u.maxHp * 0.5 && u.hp > 0) { u.slammed = true;
    for (const e of inRadius(B.enemies, u, 38)) { dealDamage(B, u, e, u.maxHp * 0.25, { noProc: true, from: 'element' }); e.stun = Math.max(e.stun, e.boss ? 0.4 : 1); }
    FX.shockwave(u.x, u.y, 40, '#ff6a6a'); FX.shake(5); FX.sound('thud'); FX.text(u.x, u.y - 30, 'BELLY SLAM', '#ff6a6a', true); }
}

// a hero's hit lands (not on signatures' extra procs): each element's on-hit part
function styleHit(B, src, tgt, dmg, o) {
  if (tgt.side !== 'enemy') return;
  const st = src.st.sty;
  for (const e in st) { const lv = st[e];
    switch (e) {
      case 'dark': tgt.witherAmt = Math.max(tgt.witherT > B.t ? tgt.witherAmt || 0 : 0, SL([0.08, 0.1, 0.12, 0.15], lv)); tgt.witherT = B.t + 2; break;
      case 'light': tgt.blindT = 2;
        if (src.ward && src.ward.alive && src.sty === 'light') { healUnit(B, src, src.ward, dmg * SL([0.2, 0.3, 0.4, 0.5], lv), false, 'element'); if (Math.random() < 0.3) FX.particles(src.ward.x, src.ward.y - 10, 2, '#fff3b0', { spread: 4, up: true }); }
        if (lv >= 2 && !o.sig && src.hits % 4 === 3) { for (const f of inRadius(B.enemies, src, 44)) f.blindT = 3; FX.ring(src.x, src.y - 6, 40, '#fff3b0'); FX.flash && FX.flash('#fff3b0', 0.08); }
        break;
      case 'fire': tgt.poison.push({ dps: src.st.atk * 0.2 * (1 + 0.3 * lv), t: 3, src, fire: true, from: 'element' }); break;
      case 'water': if (!tgt.boss && !o.sig && tgt.alive) {
          const kb = SL([6, 9, 11, 13], lv); tgt.x = Math.min(W - 8, tgt.x + kb);
          if (lv >= 1) for (const f of inRadius(B.enemies, tgt, 9)) if (f !== tgt) { dealDamage(B, src, f, dmg * 0.35, { noProc: true, quiet: true, from: 'element' }); dealDamage(B, src, tgt, dmg * 0.2, { noProc: true, quiet: true, from: 'element' }); FX.text(f.x, f.y - 18, 'bonk', '#4ab8ff'); break; }
          if (lv >= 3) tgt.soakT = 3;
        }
        if (lv >= 2 && !o.sig && src.sty === 'water' && src.hits % 5 === 4) { B.waves.push({ type: 'tide', x: src.x, y: src.y, vx: 150, life: 1.1, t: 0, src, dmg: src.st.atk * 0.8, hit: new Set(), kb: 18, h: 26 }); FX.sound('whoosh'); }
        break;
      case 'ice': tgt.slowT = Math.max(tgt.slowT, 1.5); tgt.slowAmt = Math.max(tgt.slowAmt, 0.2); break;
      case 'void': tgt.shred = Math.min(20 + 10 * lv, tgt.shred + 3); break;
      case 'salty': if (src.sty === 'salty' && tgt === src.grudge) { src.grudgeN = Math.min(15, (src.grudgeN || 0) + 1); if (lv >= 2) { tgt.taunt = src; tgt.tauntT = Math.max(tgt.tauntT, 1.2); } } break;
      case 'sweet': tgt.slowT = Math.max(tgt.slowT, 1.5); tgt.slowAmt = Math.max(tgt.slowAmt, 0.15);
        if (lv >= 2) { tgt.sticky = (tgt.sticky || 0) + 1; if (tgt.sticky >= 3) { tgt.sticky = 0; tgt.stun = Math.max(tgt.stun, tgt.boss ? 0.3 : 1); FX.text(tgt.x, tgt.y - 20, 'glued', '#ff8ad8'); } } break;
    }
  }
}

// a foe dies. Returns the gold multiplier; also fire bursts, ice shatters, dark refunds and grudges passed on
function styleKill(B, src, v) {
  let g = 1;
  if (src && src.sty) {
    const lv = styLv(src, src.sty);
    if (src.sty === 'salty' && v === src.grudge) { if (lv >= 3) { const a = B.heroes.filter(h => h.alive && h !== src && h.sty === 'salty').sort((a, b) => dist(a, src) - dist(b, src))[0]; if (a) { a.rage = src.grudgeN; FX.text(a.x, a.y - 26, 'RAGE', '#e8eef8'); } } src.grudge = null; src.grudgeN = 0; }
  }
  if (v.hexT > 0 && v.hexer) { const h = v.hexer, lv = styLv(h, 'dark'); v.hexT = 0;
    if (lv >= 3 && h.alive && B.heroes.filter(x => x.alive && x.shadeOf === h).length < 2) { summonThrall(B, h, 0.3, v.boss ? h.key : v.key, { name: 'Shade', col: '#8a5ad8' }); const c = B.heroes[B.heroes.length - 1]; c.lifeT = 5; if (!v.boss) c.nativeFace = -1; c.x = c.hx = v.x; c.y = c.hy = v.y; c.shade = true; c.shadeOf = h; FX.text(v.x, v.y - 22, 'rises', '#b48aff'); }
    if (lv >= 2 && h.alive) { const n = styleFoes(B, e => e !== v && !(e.hexT > 0) && dist(e, v) < 60).sort((a, b) => dist(a, v) - dist(b, v))[0]; if (n) curseFoe(B, h, n, lv, v); } }
  if (src && src.st && src.st.sty && src.st.sty.treat != null) { const lv = src.st.sty.treat; g *= SL([1.15, 1.25, 1.4, 1.5], lv);
    if (lv >= 2) { const low = B.heroes.filter(h => h.alive && !h.temp).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0]; if (low) healUnit(B, src, low, low.maxHp * 0.05, false, 'element'); } }
  if ((B.styLv.fire || 0) >= 2 && v.poison && v.poison.some(p => p.fire)) {
    const f = v.poison.find(p => p.fire && p.src && p.src.side === 'hero'), s = f && f.src; if (s && s.st) {
      for (const e of inRadius(B.enemies, v, 22)) { if (e === v) continue; dealDamage(B, s, e, Math.min(v.maxHp * 0.15, s.st.atk * 2), { noProc: true, kind: 'magic', from: 'element', quiet: true }); e.poison.push({ dps: s.st.atk * 0.2, t: 3, src: s, fire: true, from: 'element' }); }
      FX.explode(v.x, v.y - 6, 18, ['#ff6a3d', '#ffd23a']); } }
  if ((B.styLv.ice || 0) >= 3 && v.frozen > 0) { const s = B.heroes.find(h => h.alive && h.sty === 'ice');
    if (s) { for (const e of inRadius(B.enemies, v, 24)) if (e !== v) dealDamage(B, s, e, Math.min(v.maxHp * 0.2, s.st.atk * 2.5), { noProc: true, kind: 'magic', from: 'element', quiet: true }); FX.particles(v.x, v.y - 8, 14, ['#bfeeff', '#ffffff', '#5fa8ff'], { spread: 20 }); FX.sound('shatter'); } }
  return g;
}

// the first ally to fall each siege gets back up (Light at 6)
function styleSave(B, u) {
  if (u.temp || (B.styLv && B.styLv.light || 0) < 3 || B.dawnUsed) return false;
  B.dawnUsed = true; u.hp = u.maxHp * 0.3; FX.text(u.x, u.y - 24, 'DAWN', '#fff3b0', true); FX.ring(u.x, u.y - 6, 30, '#fff3b0'); FX.sound('revive'); return true;
}

// a lured foe walks to its snack instead of fighting
function styleLured(B, e, dt) {
  const s = e.lure; e.lureT -= dt; if (!s || s.done || e.boss) { e.lure = null; e.lureT = 0; return false; }
  const d = dist(e, s); if (d > 7) moveToward(e, s.x + (e.x > s.x ? 5 : -5), s.y, e.spd * hzSpd(B, e), dt); else e.moving = false;
  return true;
}

// ----- drawing (called from render.js) -----
function drawStyleGround(g, B, t) {
  if (!B || !B.styInit) return;
  for (const u of B.heroes) if (u.alive && u.sty === 'ice' && !u.rafter) { const R = SL([26, 34, 46, 54], styLv(u, 'ice'));
    g.globalAlpha = 0.14; g.fillStyle = '#bfeeff'; g.beginPath(); g.ellipse(Math.round(u.x), Math.round(u.y), R, R * 0.55, 0, 0, Math.PI * 2); g.fill();
    g.globalAlpha = 0.45 + 0.15 * Math.sin(t * 3); g.strokeStyle = '#bfeeff'; g.lineWidth = 1; g.stroke(); g.globalAlpha = 1;
    for (let i = 0; i < 6; i++) { const a = t * 0.6 + i * 1.047; g.fillStyle = '#ffffff'; g.fillRect(Math.round(u.x + Math.cos(a) * R), Math.round(u.y + Math.sin(a) * R * 0.55), 1, 1); } }
  for (const f of B.fire) { const k = 1 - f.t / f.life, n = f.r >= 8 ? 3 : 2;
    for (let i = 0; i < n; i++) { const s = (f.x * 7 + f.y * 3 + i * 11 + Math.floor(t * 10)) % 5; g.globalAlpha = 0.5 + 0.5 * k; g.fillStyle = s < 2 ? '#ffd23a' : '#ff6a3d'; g.fillRect(Math.round(f.x - f.r / 2 + i * 3), Math.round(f.y - 1 - s * k), 2, 1 + Math.round(2 * k)); }
    g.globalAlpha = 1; }
  for (const s of B.snacks) { g.globalAlpha = 0.18; g.strokeStyle = '#ffb02e'; g.beginPath(); g.ellipse(Math.round(s.x), Math.round(s.y), 14, 8, 0, 0, Math.PI * 2); g.stroke(); g.globalAlpha = 1;
    const x = Math.round(s.x), y = Math.round(s.y) - 2 - (Math.floor(t * 6) % 2); g.fillStyle = OUTLINE; g.fillRect(x - 3, y - 3, 7, 6); g.fillStyle = '#ffb02e'; g.fillRect(x - 2, y - 2, 5, 4); g.fillStyle = '#ff8ad8'; g.fillRect(x - 2, y - 2, 5, 1); g.fillStyle = '#8a4a1a'; g.fillRect(x, y, 1, 1); }
  for (const w of B.waves) if (w.type === 'tide') { const x = Math.round(w.x); for (let y = Math.round(w.y - w.h); y < w.y + w.h; y += 2) { const o = Math.round(Math.sin(y * 0.3 + t * 12) * 2); g.globalAlpha = 0.7 * (1 - w.t / w.life); g.fillStyle = '#4ab8ff'; g.fillRect(x - 6 + o, y, 6, 2); g.fillStyle = '#bff4ff'; g.fillRect(x + o, y, 2, 2); } g.globalAlpha = 1; }
}
function drawStyleOver(g, B, t) {
  if (!B || !B.styInit) return;
  for (const p of B.pulls) if (p.e.alive && p.src && p.src.alive) { g.strokeStyle = p.col; g.lineWidth = 1; g.beginPath(); g.moveTo(Math.round(p.src.x) + 0.5, Math.round(p.src.y - 8) + 0.5);
    const mx = (p.src.x + p.e.x) / 2, my = (p.src.y + p.e.y) / 2 - 6 + Math.sin(t * 20) * 2; g.quadraticCurveTo(mx, my, Math.round(p.e.x) + 0.5, Math.round(p.e.y - 8) + 0.5); g.stroke(); }
  for (const u of B.heroes) if (u.alive && u.sty === 'dark' && u.sx && u.sx.curse && u.sx.curse.alive) { const c = u.sx.curse, x0 = u.x, y0 = u.y - 9, x1 = c.x, y1 = c.y - 8 - (c.z || 0), n = Math.max(4, Math.round(Math.hypot(x1 - x0, y1 - y0) / 2));
    // a dotted shadow tether, with drops of life sliding back down it to the Dark champion
    for (let i = 0; i <= n; i++) { const k = i / n, w = Math.sin(k * Math.PI) * Math.sin(t * 9 + i * 0.7) * 2; const px = Math.round(x0 + (x1 - x0) * k), py = Math.round(y0 + (y1 - y0) * k + w); g.fillStyle = '#1a0e30'; g.fillRect(px, py + 1, 1, 1); g.fillStyle = (i + Math.floor(t * 8)) % 3 ? '#8a5ad8' : '#d8c0ff'; g.fillRect(px, py, 1, 1); }
    for (let j = 0; j < 3; j++) { const k = 1 - ((t * 1.6 + j / 3) % 1); const px = Math.round(x0 + (x1 - x0) * k), py = Math.round(y0 + (y1 - y0) * k + Math.sin(k * Math.PI) * Math.sin(t * 9 + k * n * 0.7) * 2); g.fillStyle = OUTLINE; g.fillRect(px - 1, py - 1, 3, 3); g.fillStyle = '#ff5a7a'; g.fillRect(px, py - 1, 1, 2); g.fillRect(px - 1, py, 3, 1); } }
  for (const d of B.dark) { const k = d.t / 0.35; g.fillStyle = '#b48aff'; for (let i = 0; i < 5; i++) { const q = Math.min(1, k + i * 0.05); g.fillRect(Math.round(d.a.x + (d.b.x - d.a.x) * q), Math.round(d.a.y - 8 + (d.b.y - d.a.y) * q - Math.sin(q * Math.PI) * 10), 1, 1); } }
  for (const e of B.enemies) if (e.alive) { const x = Math.round(e.x), y = Math.round(e.y - 24 * (e.scale || 1) - (e.z || 0));
    if (e.hexT > 0) { const b = Math.floor(t * 4) % 2; g.fillStyle = OUTLINE; g.fillRect(x - 3, y - 6 - b, 7, 6); g.fillStyle = '#b48aff'; g.fillRect(x - 2, y - 5 - b, 5, 3); g.fillRect(x - 1, y - 2 - b, 3, 1); g.fillStyle = '#2a1a4a'; g.fillRect(x - 1, y - 4 - b, 1, 1); g.fillRect(x + 1, y - 4 - b, 1, 1); }
    else if (e.fearT > 0) { g.fillStyle = '#d8c0ff'; const o = Math.floor(t * 8) % 2; g.fillRect(x - 4 + o, y - 3, 1, 2); g.fillRect(x - 4 + o, y, 1, 1); g.fillRect(x + 3 - o, y - 4, 1, 2); g.fillRect(x + 3 - o, y - 1, 1, 1); } }
  for (const [a, b] of B.wires) { g.strokeStyle = Math.floor(t * 14) % 2 ? '#9ff6ff' : '#ffffff'; g.lineWidth = 1; g.beginPath(); const n = 6; g.moveTo(a.x, a.y - 10);
    for (let i = 1; i < n; i++) { const k = i / n; g.lineTo(a.x + (b.x - a.x) * k + Math.sin(t * 40 + i) * 2, a.y - 10 + (b.y - a.y) * k + Math.cos(t * 37 + i * 2) * 2); } g.lineTo(b.x, b.y - 10); g.stroke(); }
  for (const u of B.heroes) {
    if (u.alive && u.sapling) { const x = Math.round(u.x), y = Math.round(u.y), sw = Math.round(Math.sin(t * 2) * 1); g.fillStyle = OUTLINE; g.fillRect(x - 1, y - 9, 3, 10); g.fillRect(x - 6 + sw, y - 16, 13, 8);
      g.fillStyle = '#8a5a2a'; g.fillRect(x, y - 8, 1, 8); g.fillStyle = '#2f8a3a'; g.fillRect(x - 5 + sw, y - 15, 11, 6); g.fillStyle = '#6fdc5a'; g.fillRect(x - 4 + sw, y - 15, 6, 2); }
    if (u.alive && u.sty === 'sweet' && u.buddy && u.buddy.alive && Math.floor(t * 3) % 3 === 0) { g.fillStyle = '#ff8ad8'; const x = Math.round(u.buddy.x) - 1, y = Math.round(u.buddy.y - 30 * (u.buddy.vscale || 1)); g.fillRect(x, y, 1, 1); g.fillRect(x + 2, y, 1, 1); g.fillRect(x - 1, y + 1, 5, 1); g.fillRect(x, y + 2, 3, 1); g.fillRect(x + 1, y + 3, 1, 1); }
    if (u.alive && u.sty === 'salty' && u.grudge && u.grudge.alive) { const e = u.grudge, x = Math.round(e.x), y = Math.round(e.y - 24 * (e.scale || 1) - (e.z || 0)); g.fillStyle = '#e8eef8'; for (let i = 0; i < Math.min(8, u.grudgeN || 0); i++) g.fillRect(x - 8 + i * 2, y, 1, 2); g.fillStyle = '#ff4a4a'; g.fillRect(x - 1, y - 4, 3, 3); }
    if (u.alive && u.shade) { g.globalAlpha = 0.5; g.fillStyle = '#2a1a4a'; g.fillRect(Math.round(u.x) - 6, Math.round(u.y) - 1, 12, 2); g.globalAlpha = 1; }
  }
}
