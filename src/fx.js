// ===== Effects + audio =====
const FXS = { parts: [], texts: [], rings: [], beams: [], bolts: [], slashes: [], coins: [], ghosts: [], shake: 0, flash: null, hitstop: 0, petals: [], gusts: [], dmgs: [], cutins: [], shocks: [], combos: [], drops: [], clock: 0, stack: {}, lastCut: -9, slowmo: 0 };
// MapleStory-style number palettes: [top, bottom, outline]
const DMG_PAL = { hit: ['#fff6a0', '#ff9a1a', '#3a1600'], crit: ['#ffe0ec', '#ff2a6a', '#3a0016'], sig: ['#f0e4ff', '#8a5aff', '#1a0a3a'], taken: ['#f4d0ff', '#a83ad8', '#22082e'], heal: ['#e0ffd8', '#36d65a', '#06280e'],
  burn: ['#ffe0b0', '#ff5a1a', '#2e0a00'], poison: ['#e8ffc0', '#6fcf2a', '#122a00'], combo: ['#e0fbff', '#1ab8ff', '#002033'], hammer: ['#ffffff', '#ffcf3a', '#3a2600'], magic: ['#e8fbff', '#5fd3ff', '#001e2e'] };

const FX = {
  text(x, y, s, color, big, label) { FXS.texts.push({ x, y, s: String(s), color, big, label, t: 0, life: label ? 1.1 : big ? 0.9 : 0.7, vy: label ? -14 : -26 }); if (FXS.texts.length > 160) FXS.texts.shift(); },
  particles(x, y, n, color, o = {}) { for (let i = 0; i < n; i++) { const a = o.up ? -Math.PI / 2 + rand(-0.9, 0.9) : rand(0, Math.PI * 2), sp = rand(0.3, 1) * (o.spread || 20) * 2.2;
    FXS.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.up ? 20 : 10), life: rand(0.35, 0.8), t: 0, color: Array.isArray(color) ? pick(color) : color, size: Math.random() < 0.3 ? 2 : 1, grav: o.grav != null ? o.grav : 120 }); }
    if (FXS.parts.length > 900) FXS.parts.splice(0, FXS.parts.length - 900); },
  explode(x, y, r, cols) { FX.particles(x, y, Math.round(r * 1.2), cols, { spread: r * 1.2 }); FXS.rings.push({ x, y, r, t: 0, life: 0.35, color: cols[0], fill: true }); FXS.rings.push({ x, y, r: r * 1.3, t: 0, life: 0.5, color: cols[1] || cols[0] }); },
  ring(x, y, r, color) { FXS.rings.push({ x, y, r, t: 0, life: 0.45, color }); },
  beam(x1, y1, x2, y2, color, w, life) { FXS.beams.push({ x1, y1, x2, y2, color, w, t: 0, life }); },
  bolt(pts, color) { FXS.bolts.push({ pts, color, t: 0, life: 0.3 }); },
  slash(x, y, dir = 1, color = '#ffffff') { FXS.slashes.push({ x, y, dir, color, t: 0, life: 0.16 }); },
  shake(a) { FXS.shake = Math.max(FXS.shake, a); },
  flash(color, a) { FXS.flash = { color, a, t: 0 }; },
  hitstop(t) { FXS.hitstop = Math.max(FXS.hitstop, t); },
  coins(x, y, amount) { const n = Math.min(7, Math.max(1, Math.round(amount / 6))); const per = Math.floor(amount / n); let rem = amount - per * n;
    for (let i = 0; i < n; i++) { const v = per + (rem-- > 0 ? 1 : 0); FXS.coins.push({ x, y, vx: rand(-30, 30), vy: rand(-80, -45), t: 0, v, ground: y + rand(4, 10) }); UI.pendingGold += v; }
    FX.text(x, y - 10, '+' + amount, '#ffcf3a', amount >= 25); },
  puff(x, y, s = 1) { for (let i = 0; i < 6 * s; i++) FXS.parts.push({ x: x + rand(-5, 5) * s, y: y - rand(0, 8) * s, vx: rand(-10, 10), vy: rand(-18, -6), life: rand(0.4, 0.7), t: 0, color: '#ffffff', size: 2, grav: -10 }); },
  afterimage(u) { FXS.ghosts.push({ key: u.key, x: u.x, y: u.y, t: 0, life: 0.25, facing: u.facing }); },
  castGlow(u) { FX.particles(u.x, u.y - 10, 10, ['#fff1a8', '#ffffff'], { spread: 14, up: true, grav: -40 }); FXS.rings.push({ x: u.x, y: u.y - 2, r: 12, t: 0, life: 0.4, color: '#fff1a8' }); },
  arrowVolley(x, y, r) { for (let i = 0; i < 7; i++) FXS.parts.push({ x: x + rand(-r, r) - 8, y: y + rand(-r * 0.6, r * 0.6) - 40, vx: 30, vy: 160, life: 0.25, t: 0, color: '#c9a06a', size: 1, grav: 0, streak: true }); },
  petals() { for (let i = 0; i < 60; i++) FXS.petals.push({ x: rand(0, W), y: rand(-60, 0), vx: rand(5, 25), vy: rand(30, 60), t: 0, life: rand(2, 3.5), color: pick(['#ff9fd0', '#ffffff', '#ffd84a']), spin: rand(0, 6) }); },
  gust() { for (let i = 0; i < 30; i++) FXS.gusts.push({ x: W + rand(0, 60), y: rand(100, 250), len: rand(10, 30), t: 0, life: rand(0.5, 0.9), vx: -rand(300, 420) }); },
  breath(x, y) { for (let i = 0; i < 10; i++) FXS.parts.push({ x, y: y + rand(-3, 3), vx: -rand(120, 200), vy: rand(-30, 40), life: rand(0.4, 0.6), t: 0, color: pick(['#ffde3a', '#ff8a3a', '#ff3d3d']), size: 2, grav: 0 }); },
  banner(title, sub, o) { UI.banner(title, sub, o); },
  // stacked damage numbers: successive hits on the same target stack upward
  dmg(tgt, amount, kind = 'hit') {
    const id = tgt.uid || 'x', st = FXS.stack[id] || (FXS.stack[id] = { last: -9, n: 0 });
    st.n = FXS.clock - st.last < 0.5 ? (st.n + 1) % 6 : 0; st.last = FXS.clock;
    const big = kind === 'crit' || kind === 'sig' || kind === 'hammer';
    FXS.dmgs.push({ x: tgt.x + rand(-2, 2), y: tgt.y - 18 * (tgt.scale || 1) - (tgt.z || 0) - st.n * 8, s: (kind === 'heal' ? '+' : '') + fmtDmg(amount), kind, big, t: 0, life: big ? 1.05 : 0.85 });
    if (FXS.dmgs.length > 220) FXS.dmgs.shift();
  },
  cutin(u, name, color, o = {}) {
    const big = FXS.clock - FXS.lastCut >= 2.5; if (big) FXS.lastCut = FXS.clock;
    FXS.cutins.push({ u, key: u.key, name, color, ab: o.ab, els: o.els, col2: o.col2, combo: o.combo, pw: o.pw || 1, t: 0, life: big ? 1.25 : 0.9, big, lv: u.inst ? u.inst.level : 0, x: u.x, y: u.y });
    FX.sound('sig');
  },
  shockwave(x, y, r, color) { FXS.shocks.push({ x, y, r, t: 0, life: 0.45, color, w: 2 }); },
  combo(x, y, name, cols) { FXS.combos.push({ x, y, name, cols, t: 0, life: 1.5 }); FX.particles(x, y, 24, cols, { spread: 30, up: true }); },
  drop(x, y, key) { FXS.drops.push({ x, y, vx: rand(-20, 20), vy: -70, t: 0, key, ground: y + 10 }); FX.sound('drop'); },
  vortex(x, y, cols) { for (let i = 0; i < 46; i++) { const a = rand(0, Math.PI * 2), r = rand(24, 60); FXS.parts.push({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r * 0.55, vx: -Math.cos(a) * r * 2 - Math.sin(a) * 60, vy: -Math.sin(a) * r * 1.1 + Math.cos(a) * 33, life: 0.5, t: 0, color: pick(cols), size: 2, grav: 0 }); } FX.shockwave(x, y, 60, cols[0]); },
  sound(n) { SFX.play(n); },
};

function fmtDmg(n) { n = Math.round(n); return n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e5 ? Math.round(n / 1000) + 'K' : String(n); }
function stepFX(dt) {
  FXS.clock += dt; if (FXS.slowmo > 0) FXS.slowmo -= dt;
  if (typeof stepSpellFX === 'function') stepSpellFX(dt);
  if (typeof stepBossFX === 'function') stepBossFX(dt);
  for (const a of ['dmgs', 'cutins', 'shocks', 'combos']) { for (const o of FXS[a]) o.t += dt; FXS[a] = FXS[a].filter(o => o.t < o.life); }
  for (const d of FXS.drops) { d.t += dt; if (d.t < 0.7) { d.vy += 220 * dt; d.x += d.vx * dt; d.y += d.vy * dt; if (d.y > d.ground) { d.y = d.ground; d.vy *= -0.5; d.vx *= 0.6; } } else if (!d.flown) { d.flown = true; UI.flyItem && UI.flyItem(d); } }
  FXS.drops = FXS.drops.filter(d => !d.flown);
  for (const p of FXS.parts) { p.t += dt; p.vy += p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
  FXS.parts = FXS.parts.filter(p => p.t < p.life);
  for (const a of ['texts', 'rings', 'beams', 'bolts', 'slashes', 'ghosts', 'gusts', 'petals']) { for (const o of FXS[a]) { o.t += dt; if (o.vy && a === 'texts') o.y += o.vy * dt * (1 - o.t / o.life); if (a === 'gusts') o.x += o.vx * dt; if (a === 'petals') { o.x += o.vx * dt; o.y += o.vy * dt; o.spin += dt * 4; } } FXS[a] = FXS[a].filter(o => o.t < o.life); }
  for (const c of FXS.coins) { c.t += dt; if (c.t < 0.5) { c.vy += 260 * dt; c.x += c.vx * dt; c.y += c.vy * dt; if (c.y > c.ground) { c.y = c.ground; c.vy *= -0.45; c.vx *= 0.6; } } else if (!c.flown) { c.flown = true; UI.flyCoin(c); } }
  FXS.coins = FXS.coins.filter(c => !c.flown);
  FXS.shake = Math.max(0, FXS.shake - dt * 30);
  if (FXS.flash) { FXS.flash.t += dt; if (FXS.flash.t > 0.25) FXS.flash = null; }
}

// ----- WebAudio synth -----
const SFX = {
  ctx: null, on: true, last: {}, master: null,
  init() { if (this.ctx) return; try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); this.master = this.ctx.createGain(); this.master.gain.value = 0.32 * (typeof AUDIO !== 'undefined' ? AUDIO.fx : 1); this.master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate * 0.5; this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate); const d = this.noise.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; } catch (e) { this.ctx = null; } },
  tone(f, dur, type = 'square', vol = 0.3, slide = 0, delay = 0) { const c = this.ctx, t = c.currentTime + delay; const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.02); },
  hiss(dur, vol = 0.3, freq = 1200, delay = 0, q = 0.8) { const c = this.ctx, t = c.currentTime + delay; const s = c.createBufferSource(); s.buffer = this.noise; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q; const g = c.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t + dur + 0.02); },
  play(n) {
    if (!this.on || !this.ctx || this.ctx.state !== 'running') return;
    const now = performance.now(); if (this.last[n] && now - this.last[n] < (n === 'coin' ? 35 : 55)) return; this.last[n] = now;
    const T = this.tone.bind(this), N = this.hiss.bind(this);
    switch (n) {
      case 'hit': N(0.06, 0.18, 2200); T(180, 0.05, 'square', 0.06, 0.6); break;
      case 'ehit': N(0.05, 0.12, 900); break;
      case 'bow': T(900, 0.05, 'triangle', 0.08, 0.5); break;
      case 'pew': T(700, 0.08, 'square', 0.05, 0.4); break;
      case 'twang': T(300, 0.12, 'sawtooth', 0.07, 0.5); break;
      case 'coin': T(988, 0.05, 'square', 0.06); T(1319, 0.09, 'square', 0.06, 1, 0.045); break;
      case 'kill': T(420, 0.09, 'square', 0.08, 0.4); N(0.08, 0.1, 1500); break;
      case 'boom': N(0.4, 0.4, 300, 0, 0.6); T(90, 0.3, 'sine', 0.3, 0.4); break;
      case 'anvil': N(0.08, 0.3, 3200, 0, 2); T(1480, 0.35, 'triangle', 0.09, 1); T(2220, 0.25, 'sine', 0.05, 1); T(110, 0.12, 'square', 0.08, 0.5); break;
      case 'forged': [523, 659, 784, 1047].forEach((f, i) => T(f, 0.18, 'square', 0.06, 1, i * 0.07)); T(1568, 0.5, 'triangle', 0.05, 1, 0.3); break;
      case 'hammer': N(0.6, 0.5, 200, 0, 0.5); T(70, 0.5, 'sine', 0.5, 0.4); T(140, 0.2, 'square', 0.12, 0.5); break;
      case 'whoosh': N(0.5, 0.15, 600, 0, 0.4); break;
      case 'quake': N(0.5, 0.35, 160, 0, 0.5); T(60, 0.4, 'sine', 0.35, 0.5); break;
      case 'cast': T(500, 0.15, 'triangle', 0.1, 2); break;
      case 'heal': [784, 988, 1175].forEach((f, i) => T(f, 0.18, 'triangle', 0.08, 1, i * 0.06)); break;
      case 'shield': T(600, 0.2, 'triangle', 0.08, 1.5); T(900, 0.2, 'triangle', 0.05, 1.5, 0.05); break;
      case 'zap': N(0.15, 0.2, 3500, 0, 2); T(1200, 0.12, 'sawtooth', 0.06, 0.3); break;
      case 'bash': N(0.12, 0.3, 600); T(150, 0.15, 'square', 0.12, 0.5); break;
      case 'slash': N(0.07, 0.2, 3000, 0, 2); break;
      case 'dash': N(0.2, 0.12, 1800, 0, 1); break;
      case 'whirl': N(0.6, 0.12, 1400, 0, 3); break;
      case 'mark': T(220, 0.3, 'sawtooth', 0.08, 0.5); break;
      case 'flood': N(1.2, 0.25, 500, 0, 0.3); break;
      case 'stampede': for (let i = 0; i < 6; i++) N(0.1, 0.25, 200, i * 0.12); break;
      case 'slurp': T(300, 0.15, 'sine', 0.15, 3); break;
      case 'roar': T(110, 0.5, 'sawtooth', 0.15, 0.7); N(0.4, 0.15, 400); break;
      case 'drums': [0, 0.14, 0.28].forEach(d => T(90, 0.12, 'sine', 0.35, 0.6, d)); break;
      case 'beam': T(880, 0.4, 'sawtooth', 0.07, 0.5); N(0.4, 0.1, 4000); break;
      case 'summon': T(200, 0.3, 'triangle', 0.12, 2.5); break;
      case 'revive': [523, 659, 784, 1047].forEach((f, i) => T(f, 0.15, 'square', 0.06, 1, i * 0.07)); break;
      case 'herodie': T(400, 0.35, 'square', 0.08, 0.3); break;
      case 'thud': N(0.08, 0.15, 250); break;
      case 'cannon': N(0.25, 0.35, 250); T(80, 0.2, 'sine', 0.3, 0.5); break;
      case 'breath': N(1.2, 0.25, 700, 0, 0.4); break;
      case 'gust': N(0.7, 0.25, 900, 0, 0.3); break;
      case 'arrows': N(0.06, 0.08, 4000); break;
      case 'boss': T(110, 0.8, 'sawtooth', 0.15, 0.98); T(165, 0.8, 'sawtooth', 0.1, 0.98, 0.1); T(82, 1.2, 'square', 0.12, 0.98, 0.25); break;
      case 'bossdie': [523, 659, 784, 1047, 1319].forEach((f, i) => T(f, 0.25, 'square', 0.08, 1, i * 0.09)); N(0.8, 0.3, 300); break;
      case 'castlefall': T(200, 1.4, 'sawtooth', 0.15, 0.2); N(1.4, 0.4, 200, 0, 0.4); break;
      case 'buy': T(660, 0.07, 'square', 0.06); T(990, 0.1, 'square', 0.06, 1, 0.06); break;
      case 'level': [523, 659, 784].forEach((f, i) => T(f, 0.1, 'square', 0.06, 1, i * 0.05)); break;
      case 'click': T(1200, 0.03, 'square', 0.04); break;
      case 'hover': T(1700, 0.025, 'triangle', 0.022); break;
      case 'flip': N(0.06, 0.1, 2600, 0, 1.4); T(520, 0.05, 'triangle', 0.035, 1.8); break;
      case 'stamp': N(0.09, 0.22, 420); T(200, 0.1, 'square', 0.09, 0.6); T(1320, 0.22, 'triangle', 0.05, 1, 0.05); T(1760, 0.2, 'triangle', 0.035, 1, 0.1); break;
      case 'error': T(160, 0.15, 'square', 0.08); break;
      case 'victory': [523, 659, 784, 1047, 784, 1047].forEach((f, i) => T(f, 0.16, 'square', 0.07, 1, i * 0.1)); break;
      case 'floor': N(0.3, 0.45, 180, 0, 0.5); T(70, 0.3, 'sine', 0.4, 0.5); break;
      case 'bossfloor': N(0.5, 0.5, 150, 0, 0.5); T(55, 0.5, 'sine', 0.5, 0.5); T(392, 0.4, 'square', 0.06, 1, 0.1); break;
      case 'flag': [392, 523, 659, 784, 1047].forEach((f, i) => T(f, 0.22, 'square', 0.07, 1, i * 0.11)); break;
      case 'bawk': T(900, 0.06, 'square', 0.07, 1.4); T(1100, 0.1, 'square', 0.06, 0.6, 0.07); break;
      case 'honk': T(330, 0.18, 'sawtooth', 0.12, 0.8); T(310, 0.22, 'sawtooth', 0.1, 0.7, 0.2); break;
      case 'jingle': [784, 659, 784, 988, 880].forEach((f, i) => T(f, 0.12, 'triangle', 0.08, 1, i * 0.11)); break;
      case 'freeze': N(0.4, 0.2, 5000, 0, 2); T(1500, 0.3, 'sine', 0.06, 0.5); break;
      case 'sig': T(220, 0.5, 'sawtooth', 0.1, 4); N(0.5, 0.2, 2500, 0, 1); T(880, 0.25, 'square', 0.06, 1.5, 0.15); break;
      case 'drop': [1047, 1319, 1568].forEach((f, i) => T(f, 0.08, 'triangle', 0.07, 1, i * 0.05)); break;
      case 'draft': [392, 523, 659, 784, 1047, 1319].forEach((f, i) => T(f, 0.14, 'square', 0.06, 1, i * 0.07)); break;
      case 'step': T(300 + Math.random() * 60, 0.03, 'square', 0.03); break;
    }
  },
};
