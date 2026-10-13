// ===== Opening cinematic: Pip and Rattlebones flee the goose into the castle, then the title =====
// Everything is painted on a 480×270 world canvas, then a moving camera crops it onto a full-screen canvas.
const INTRO = { on: false };

// a warm golden-hour field with the starting castle on the left
function introWorld() {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const sky = ['#3a2f6e', '#6a4a9a', '#c26a8a', '#ff9a6a', '#ffc98a'];
  for (let y = 0; y < 150; y++) { const k = y / 150 * (sky.length - 1), i = Math.min(sky.length - 2, Math.floor(k)); g.fillStyle = mix(sky[i], sky[i + 1], k - i); g.fillRect(0, y, W, 1); }
  // low sun
  for (let y = -22; y <= 22; y++) { const w = Math.round(Math.sqrt(484 - y * y)); g.fillStyle = y < -10 ? '#ffe9a8' : y < 4 ? '#ffd27a' : '#ffb85a'; g.fillRect(372 - w, 118 + y, w * 2, 1); }
  g.fillStyle = 'rgba(255,240,200,0.25)'; for (let y = -30; y <= 30; y++) { const w = Math.round(Math.sqrt(900 - y * y)); g.fillRect(372 - w, 118 + y, w * 2, 1); }
  for (let i = 0; i < 6; i++) { const cx = 40 + i * 80 + hash(i, 1) * 30, cy = 30 + hash(i, 2) * 50, w = 30 + hash(i, 3) * 30; g.fillStyle = '#ffd0b8'; g.fillRect(cx, cy, w, 3); g.fillRect(cx + 5, cy - 2, w - 14, 2); g.fillStyle = '#c87a9a'; g.fillRect(cx + 2, cy + 3, w - 4, 1); }
  const hill = (base, amp, freq, col, seed) => { g.fillStyle = col; for (let x = 0; x < W; x++) { const h = base - Math.round(amp * (0.5 + 0.5 * Math.sin(x * freq + seed)) + amp * 0.4 * Math.sin(x * freq * 2.7 + seed * 3)); g.fillRect(x, h, 1, 160 - h); } };
  hill(140, 22, 0.02, '#9a5a8a', 1.3); hill(152, 14, 0.035, '#6a8a5a', 4.1);
  g.fillStyle = '#7cc45a'; g.fillRect(0, 150, W, H - 150); g.fillStyle = '#a8e07a'; g.fillRect(0, 150, W, 2);
  for (let y = 153; y < H; y += 2) for (let x = 0; x < W; x += 2) { const r = hash(x, y); if (r < 0.07) { g.fillStyle = '#5aa645'; g.fillRect(x, y, 1, 2); } else if (r < 0.09) { g.fillStyle = '#d8f0a0'; g.fillRect(x, y, 1, 1); } }
  // the road the heroes run along
  for (let x = 70; x < W; x++) { const y0 = 222 + Math.round(Math.sin(x * 0.03) * 2); g.fillStyle = '#e8c07a'; g.fillRect(x, y0, 1, 14); g.fillStyle = '#f4d69a'; g.fillRect(x, y0, 1, 1); g.fillStyle = '#c99a50'; g.fillRect(x, y0 + 14, 1, 1); if (hash(x, 7) < 0.25) { g.fillStyle = '#d4a65e'; g.fillRect(x, y0 + 2 + Math.floor(hash(x, 9) * 10), 1, 1); } }
  for (let i = 0; i < 60; i++) { const x = Math.floor(hash(i, 11) * 400) + 80, y = Math.floor(hash(i, 12) * 110) + 156; if (y > 216 && y < 240) continue; g.fillStyle = pick(['#ff7aa8', '#ffd84a', '#ffffff', '#a98aff']); g.fillRect(x, y, 1, 1); }
  // warm light over everything
  g.fillStyle = 'rgba(255,150,80,0.10)'; g.fillRect(0, 0, W, H);
  R.castleKey = null; const cs = buildCastle({ tech: {}, castleEl: null, maxhpMul: 1, stats: { bosses: [] } }); g.drawImage(cs, 0, -6); R.castleKey = null;
  return c;
}

// the path: along the road, then up the drawbridge to the gate
const GATE = { x: 59, y: 204 }, RAMP = { x: 92, y: 226 };
function pathPos(x) { if (x > RAMP.x) return { x, y: 229 }; const k = Math.min(1, (RAMP.x - x) / (RAMP.x - GATE.x)); return { x, y: 229 + (GATE.y - 229) * k }; }

function startIntro(done) {
  const el = document.createElement('div'); el.id = 'intro';
  el.innerHTML = `<canvas></canvas><div class="in-bars"><i></i><i></i></div><p class="in-cap"></p><button class="in-skip">Skip ▸</button>
    <div class="in-gate"><b>Siege of Legends</b><span>Click anywhere to begin</span><small>Sound on</small></div>`;
  document.body.appendChild(el);
  const cv = el.querySelector('canvas'), ctx = cv.getContext('2d'), cap = el.querySelector('.in-cap');
  const world = introWorld(), S = document.createElement('canvas'); S.width = W; S.height = H; const g = S.getContext('2d');
  Object.assign(INTRO, { on: true, t: -1, el, parts: [], pops: [], shake: 0, done: false });
  const fit = () => { const d = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(innerWidth * d); cv.height = Math.round(innerHeight * d); };
  fit(); addEventListener('resize', fit);
  // act 1: twelve elemental shards hover over the road and nobody can choose. Act 2: the goose.
  const RUN = 4.1;   // when the heroes bolt
  const runners = [
    { key: 'h:pip', x: 318, spd: 118, gone: false, start: RUN },
    { key: 'h:rattle', x: 298, spd: 118, gone: false, start: RUN + 0.12, trip: RUN + 1.0 },
  ];
  const shards = EL_KEYS.map((e, i) => { const a = Math.PI * (0.05 + 0.9 * i / (EL_KEYS.length - 1)); return { e, col: ELEMENTS[e].col, col2: ELEMENTS[e].col2, hx: 380 - Math.cos(a) * 62, hy: 206 - Math.sin(a) * 34, p: i * 0.7, x: 0, y: 0, vx: 0, vy: 0, fly: -1 }; });
  for (const sh of shards) { sh.x = sh.hx; sh.y = sh.hy; }
  const lines = [[0.7, 0, 'Fire?'], [1.3, 1, 'Ice!'], [1.9, 0, 'Ooh, Sweet…'], [2.5, 1, 'VOID.'], [3.0, 0, 'Salty?'], [3.3, 1, 'Hmm…']];
  let pickI = 0, pickT = 0;
  const goose = { x: 560, spd: 126, state: 'enter', t: 0, honk: 0.5 };
  const port = { y: 0, t: -1 };
  let last = performance.now(), caption = '';
  const say = s => { if (s === caption) return; caption = s; cap.classList.remove('on'); void cap.offsetWidth; cap.textContent = s; if (s) cap.classList.add('on'); };
  const pop = (x, y, s, col, big) => INTRO.pops.push({ x, y, s, col, big, t: 0 });
  const dust = (x, y, n, cols = ['#f4d69a', '#e8c07a', '#ffffff']) => { for (let i = 0; i < n; i++) INTRO.parts.push({ x, y, vx: rand(-20, 20), vy: rand(-26, -6), g: 40, life: rand(0.3, 0.7), t: 0, c: pick(cols), s: 1 }); };
  const feathers = (x, y, n) => { for (let i = 0; i < n; i++) INTRO.parts.push({ x, y, vx: rand(-50, 50), vy: rand(-60, -10), g: 18, life: rand(0.9, 1.6), t: 0, c: pick(['#ffffff', '#e8e8f0', '#c8c8d0']), s: 2, flutter: rand(0, 6) }); };

  const finish = () => { if (INTRO.done) return; INTRO.done = true; INTRO.on = false; removeEventListener('resize', fit); el.classList.add('out'); setTimeout(() => el.remove(), 700); done && done(); };
  const begin = () => { if (INTRO.t >= 0) return; SFX.init(); el.classList.add('play'); INTRO.t = 0; last = performance.now(); };
  el.addEventListener('pointerdown', e => { if (e.target.closest('.in-skip')) return; if (INTRO.t < 0) begin(); });
  el.querySelector('.in-skip').onclick = e => { e.stopPropagation(); SFX.init(); finish(); };
  INTRO.key = e => { if (INTRO.done) return; if (INTRO.t < 0) begin(); else if (INTRO.t > 0.4) finish(); };
  addEventListener('keydown', INTRO.key, { once: false });

  const frame = now => {
    if (INTRO.done) { removeEventListener('keydown', INTRO.key); return; }
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = Math.max(last, now);
    if (INTRO.t >= 0) INTRO.t += dt; const t = Math.max(0, INTRO.t);
    // ----- actors -----
    if (INTRO.t >= 0) {
      for (const L of lines) if (!L.done && t >= L[0]) { L.done = true; const r = runners[L[1] ? 1 : 0]; pop(r.x, 192, L[2], L[1] ? '#e8e4ff' : '#9ff6ff'); SFX.play('click'); }
      pickT -= dt; if (t < RUN - 0.4 && pickT <= 0) { pickT = 0.32; pickI = (pickI + 1 + Math.floor(Math.random() * 5)) % shards.length; SFX.play('jingle'); }
      if (goose.state === 'enter') { if (t > 2.7) goose.x = Math.max(472, goose.x - 150 * dt); if (t > 3.55 && !goose.yelp) { goose.yelp = true; pop(goose.x - 6, 186, 'HONK!!', '#ffffff', true); SFX.play('honk'); INTRO.shake = 2; for (const r of runners) pop(r.x, 196, '!', '#ffd84a', true); } if (t >= RUN + 0.25) goose.state = 'chase'; }
      for (const r of runners) {
        if (r.gone || t < r.start) continue;
        if (r.trip && t > r.trip && t < r.trip + 0.35) { if (!r.tripped) { r.tripped = true; dust(r.x, 229, 6); pop(r.x, 200, 'oof', '#ffffff'); SFX.play('bash'); for (let i = 0; i < 3; i++) INTRO.parts.push({ x: r.x, y: 214, vx: rand(10, 40), vy: rand(-50, -30), g: 120, life: 0.8, t: 0, c: '#f0ead8', s: 2 }); } continue; }
        r.x -= r.spd * dt * (r.trip && t > r.trip ? 1.08 : 1);
        if (Math.random() < dt * 14) dust(r.x + 4, pathPos(r.x).y, 1);
        if (r.key === 'h:pip' && Math.random() < dt * 5) INTRO.parts.push({ x: r.x + 2, y: pathPos(r.x).y - 18, vx: rand(10, 25), vy: rand(-30, -15), g: 90, life: 0.5, t: 0, c: '#9ff6ff', s: 1 });
        if (r.x <= GATE.x + 2) { r.gone = true; r.goneT = t; SFX.play('step'); }
      }
      if (runners.every(r => r.gone) && port.t < 0) { port.t = 0; }
      if (port.t >= 0 && port.y < 1) { port.t += dt; port.y = Math.min(1, port.t / 0.16); if (port.y >= 1) { INTRO.shake = 3; dust(GATE.x, GATE.y, 10, ['#c8c0b0', '#8a8a9a', '#ffffff']); SFX.play('thud'); } }
      if (goose.state === 'chase') {
        goose.x -= goose.spd * dt; goose.honk -= dt;
        if (goose.honk <= 0) { goose.honk = 0.6 + Math.random() * 0.3; const p = pathPos(goose.x); pop(goose.x - 4, p.y - 34, pick(['HONK!', 'HONK', 'HONK!!']), '#ffffff'); SFX.play('honk'); }
        if (Math.random() < dt * 6) feathers(goose.x + 6, pathPos(goose.x).y - 14, 1);
        if (goose.x <= GATE.x + 12) {
          if (port.y >= 1) { goose.state = 'bonk'; goose.t = 0; INTRO.shake = 7; feathers(goose.x, GATE.y - 14, 14); pop(goose.x + 2, GATE.y - 40, 'BONK', '#ffd84a', true); SFX.play('bash'); SFX.play('honk'); }
          else goose.x = GATE.x + 12;
        }
      } else if (goose.state === 'bonk') { goose.t += dt; const k = Math.min(1, goose.t / 0.45); goose.x = GATE.x + 12 + 34 * Math.sin(k * Math.PI / 2); goose.hop = Math.sin(k * Math.PI) * 14; if (goose.t > 2.6) { goose.state = 'mad'; goose.t = 0; goose.hop = 0; } }
      else if (goose.state === 'mad') { goose.t += dt; if (goose.t > 0.2 && !goose.yelled) { goose.yelled = true; pop(goose.x - 8, 174, 'HONK.', '#ff5d8f', true); SFX.play('honk'); INTRO.shake = 3; feathers(goose.x, 210, 6); } }
      for (const sh of shards) {
        if (sh.fly > 0) { sh.fly += dt; const k = Math.min(1, sh.fly / 1.3), ex = GATE.x + 1, ey = GATE.y - 30; sh.x = sh.sx + (ex - sh.sx) * k; sh.y = sh.sy + (ey - sh.sy) * k - Math.sin(k * Math.PI) * 40; if (k >= 1 && !sh.home) { sh.home = true; for (let j = 0; j < 5; j++) INTRO.parts.push({ x: ex, y: ey, vx: rand(-25, 25), vy: rand(-30, 5), g: 30, life: 0.5, t: 0, c: pick([sh.col, sh.col2, '#ffffff']), s: 1 }); SFX.play('coin'); } continue; }
        const gx = goose.x - 6; if (goose.state === 'chase' && Math.abs(gx - sh.x) < 10 && Math.abs(pathPos(goose.x).y - 12 - sh.y) < 26) { sh.vy = -60 - Math.random() * 30; sh.vx = rand(-30, 30); }
        sh.vx *= 1 - dt * 2.5; sh.vy += (sh.hy - sh.y) * dt * 6 - sh.vy * dt * 2.5; sh.x += sh.vx * dt + (sh.hx - sh.x) * dt * 1.5; sh.y += sh.vy * dt;
      }
      if (goose.state === 'bonk' && goose.t > 0.9 && !INTRO.shardsGo) { INTRO.shardsGo = true; shards.forEach((sh, i) => { sh.sx = sh.x; sh.sy = sh.y; sh.fly = -0.0001 - i * 0.08; }); }
      if (INTRO.shardsGo) for (const sh of shards) if (sh.fly < 0) { sh.fly += dt; if (sh.fly >= 0) sh.fly = 0.0001; }
      for (const p of INTRO.parts) { p.t += dt; p.vy += p.g * dt; p.x += (p.vx + (p.flutter != null ? Math.sin(p.t * 8 + p.flutter) * 20 : 0)) * dt; p.y += p.vy * dt; if (p.flutter != null) p.vy = Math.min(p.vy, 14); }
      INTRO.parts = INTRO.parts.filter(p => p.t < p.life); for (const p of INTRO.pops) p.t += dt; INTRO.pops = INTRO.pops.filter(p => p.t < 1.1);
      if (INTRO.shake > 0) INTRO.shake = Math.max(0, INTRO.shake - dt * 16);
      say(t < 3.2 ? 'Twelve elemental shards. One castle. No decision.' : goose.state === 'bonk' && goose.t > 1.4 || goose.state === 'mad' ? 'The goose will remember this.' : '');
      if (goose.state === 'mad' && goose.t > 2.2) finish();
    }
    // ----- paint the world -----
    g.drawImage(world, 0, 0);
    // portcullis drops over the gate
    if (port.t >= 0) { const top = GATE.y - 40, h = Math.round(40 * port.y); g.fillStyle = 'rgba(20,14,30,0.85)'; g.fillRect(GATE.x - 9, top, 19, 40); g.fillStyle = '#4a4a5a'; for (let x = GATE.x - 8; x <= GATE.x + 8; x += 4) g.fillRect(x, top, 2, h); for (let y = top + 4; y < top + h; y += 7) g.fillRect(GATE.x - 9, y, 19, 1); g.fillStyle = '#8a8aa0'; for (let x = GATE.x - 8; x <= GATE.x + 8; x += 4) g.fillRect(x, top, 1, h); }
    const at = INTRO.t < 0 ? 0 : t;
    shards.forEach((sh, i) => { if (sh.home) return; const bob = sh.fly > 0 ? 0 : Math.round(Math.sin(at * 2.4 + sh.p) * 2), x = Math.round(sh.x), y = Math.round(sh.y) + bob, hot = t < RUN - 0.4 && i === pickI && INTRO.t >= 0;
      g.globalAlpha = hot ? 0.45 : 0.22; g.fillStyle = sh.col; g.fillRect(x - 4, y - 7, 9, 13); g.fillRect(x - 5, y - 4, 11, 7); g.globalAlpha = 1;
      if (hot) { g.fillStyle = '#ffffff'; g.fillRect(x, y - 12, 1, 2); g.fillRect(x - 6, y - 1, 2, 1); g.fillRect(x + 5, y - 1, 2, 1); }
      g.fillStyle = '#1a1230'; g.fillRect(x - 2, y - 6, 5, 11); g.fillRect(x - 3, y - 3, 7, 5);
      g.fillStyle = sh.col; g.fillRect(x - 1, y - 5, 3, 9); g.fillRect(x - 2, y - 2, 5, 3);
      g.fillStyle = sh.col2; g.fillRect(x + 1, y - 2, 1, 5); g.fillStyle = '#ffffff'; g.fillRect(x - 1, y - 4, 1, 2);
      if (!sh.fly || sh.fly <= 0) { g.fillStyle = 'rgba(26,18,48,0.22)'; g.fillRect(x - 2, Math.round(sh.hy) + 14, 5, 1); }
      if (sh.fly > 0) for (let k = 1; k < 4; k++) { g.globalAlpha = 0.5 / k; g.fillStyle = sh.col2; g.fillRect(x + k * 3, y + k * 2, 2, 2); } g.globalAlpha = 1; });
    for (const r of runners) {
      if (r.gone) { const k = (t - r.goneT) / 0.2; if (k >= 1) continue; g.globalAlpha = 1 - k; }
      const waiting = t < r.start, p = pathPos(r.x), tripping = r.trip && t > r.trip && t < r.trip + 0.35, fr = tripping ? 'idle1' : waiting ? (Math.floor(at * 2 + (r.key === 'h:pip' ? 0 : 1)) % 2 ? 'idle0' : 'idle1') : Math.floor(at * 10 + (r.key === 'h:pip' ? 0 : 1)) % 2 ? 'walk0' : 'walk1';
      const S2 = SPR[r.key] || ensureSprite(r.key), img = S2 && S2.frames[fr]; if (!img) continue;
      const bob = tripping ? 4 : waiting ? (goose.yelp ? -Math.max(0, 6 - (t - 3.55) * 30) : 0) : Math.abs(Math.sin(at * 16 + r.x)) * -2;
      g.fillStyle = 'rgba(26,18,48,0.28)'; g.fillRect(Math.round(p.x) - 4, Math.round(p.y), 8, 2);
      g.save(); g.translate(Math.round(p.x), Math.round(p.y + bob)); if (tripping) g.rotate(-0.5); if (!waiting) g.scale(-1, 1); g.drawImage(img, -10, -19, 20, 20); g.restore(); g.globalAlpha = 1;
    }
    { const p = pathPos(goose.x), Sg = SPR['e:goose'], fr = goose.state === 'chase' || (goose.state === 'enter' && t > 2.7 && goose.x > 472.5) ? (Math.floor(at * 12) % 2 ? 'walk0' : 'walk1') : goose.state === 'mad' ? 'atk' : 'idle0', img = Sg && Sg.frames[fr];
      if (img) { const gy = p.y - (goose.hop || 0); g.fillStyle = 'rgba(26,18,48,0.28)'; g.fillRect(Math.round(p.x) - 7, Math.round(p.y), 14, 2);
        g.save(); g.translate(Math.round(p.x), Math.round(gy)); if (goose.state === 'bonk') g.rotate(0.35 * Math.min(1, goose.t * 3)); g.drawImage(img, -15, -29, 30, 30); g.restore();
        if (goose.state === 'bonk' && goose.t > 0.3) for (let i = 0; i < 3; i++) { const a = goose.t * 5 + i * 2.1; g.fillStyle = i % 2 ? '#ffd84a' : '#ffffff'; const sx = Math.round(p.x + Math.cos(a) * 9), sy = Math.round(gy - 30 + Math.sin(a) * 3); g.fillRect(sx - 1, sy, 3, 1); g.fillRect(sx, sy - 1, 1, 3); } } }
    for (const p of INTRO.parts) { g.globalAlpha = Math.min(1, 2 * (1 - p.t / p.life)); g.fillStyle = p.c; g.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s === 2 ? 1 : 1); if (p.s === 2) g.fillRect(Math.round(p.x) + 1, Math.round(p.y) - 1, 1, 1); } g.globalAlpha = 1;
    // ----- camera: start tight on the chase, pull back to the whole scene, punch in on the bonk -----
    const lead = Math.min(...runners.map(r => r.x)), focusX = INTRO.t < 0 || t < RUN ? (t > 2.7 ? 375 : 350) : goose.state === 'chase' ? (lead + goose.x) / 2 : INTRO.shardsGo ? GATE.x + 60 : GATE.x + 40;
    const zoom = INTRO.t < 0 || t < RUN ? 2.1 - 0.15 * Math.min(1, Math.max(0, t - 2.7)) : goose.state === 'chase' ? 1.95 - 0.55 * Math.min(1, (t - RUN) / 2) : goose.state === 'bonk' ? 1.6 + 0.25 * Math.max(0, 1 - goose.t * 3) : 1.6 + 0.12 * Math.min(1, goose.t * 4);
    INTRO.cam = INTRO.cam || { x: focusX, z: zoom }; INTRO.cam.x += (focusX - INTRO.cam.x) * Math.min(1, dt * 4); INTRO.cam.z += (zoom - INTRO.cam.z) * Math.min(1, dt * 3);
    const cw = cv.width, ch = cv.height, base = Math.max(cw / W, ch / H), k = base * INTRO.cam.z, vw = cw / k, vh = ch / k;
    const sx = clamp(INTRO.cam.x - vw / 2, 0, W - vw), sy = clamp(226 - vh * 0.78, 0, H - vh), sh = INTRO.shake;
    ctx.imageSmoothingEnabled = false; ctx.fillStyle = '#060812'; ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(S, sx + rand(-sh, sh) / k * base, sy + rand(-sh, sh) / k * base, vw, vh, 0, 0, cw, ch);
    // speech pops in screen space so the text stays crisp
    ctx.textAlign = 'center'; ctx.lineJoin = 'round';
    for (const p of INTRO.pops) { const a = Math.min(1, 3 * (1 - p.t / 1.1)), sc = p.t < 0.1 ? 1.5 - p.t * 5 : 1, size = (p.big ? 15 : 10) * k / 2.4 * sc * 1.4;
      ctx.globalAlpha = a; ctx.font = `700 ${size}px "Fredoka", "Atkinson Hyperlegible", sans-serif`; ctx.strokeStyle = '#1a1230'; ctx.lineWidth = size * 0.22;
      const x = (p.x - sx) * k, y = (p.y - sy - p.t * 10) * k; ctx.strokeText(p.s, x, y); ctx.fillStyle = p.col; ctx.fillText(p.s, x, y); }
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

// ===== Title backdrop: the castle at dusk, stars, the moon, and now and then a goose crossing it =====
const TITLEBG = { on: false };
function titleWorld() {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const sky = ['#060812', '#121a3e', '#2a2a6a', '#5a3a7a', '#a85a7a'];
  for (let y = 0; y < 170; y++) { const k = y / 170 * (sky.length - 1), i = Math.min(sky.length - 2, Math.floor(k)); g.fillStyle = mix(sky[i], sky[i + 1], k - i); g.fillRect(0, y, W, 1); }
  for (let y = -16; y <= 16; y++) { const w = Math.round(Math.sqrt(256 - y * y)); g.fillStyle = '#fff4d8'; g.fillRect(360 - w, 56 + y, w * 2, 1); }
  g.fillStyle = '#e8dcc0'; g.fillRect(352, 50, 4, 3); g.fillRect(364, 60, 5, 4); g.fillRect(358, 64, 3, 2);
  g.fillStyle = 'rgba(255,244,216,0.10)'; for (let y = -30; y <= 30; y++) { const w = Math.round(Math.sqrt(900 - y * y)); g.fillRect(360 - w, 56 + y, w * 2, 1); }
  const hill = (base, amp, freq, col, seed) => { g.fillStyle = col; for (let x = 0; x < W; x++) { const h = base - Math.round(amp * (0.5 + 0.5 * Math.sin(x * freq + seed)) + amp * 0.4 * Math.sin(x * freq * 2.7 + seed * 3)); g.fillRect(x, h, 1, H - h); } };
  hill(172, 24, 0.018, '#2a1f4e', 2.1); hill(190, 16, 0.03, '#1c1838', 5.3);
  R.castleKey = null; const cs = buildCastle({ tech: { walls1: 1, rafters1: 1 }, castleEl: null, maxhpMul: 1, stats: { bosses: [{}, {}, {}, {}, {}] } }); R.castleKey = null;
  // the castle sits center stage, in deep blue shadow with lit windows
  const d = document.createElement('canvas'); d.width = cs.width; d.height = cs.height; const dg = d.getContext('2d'); dg.drawImage(cs, 0, 0);
  const img = dg.getImageData(0, 0, d.width, d.height), px = img.data;
  for (let i = 0; i < px.length; i += 4) { if (!px[i + 3]) continue; const r = px[i], gg = px[i + 1], b = px[i + 2], lum = (r * 0.3 + gg * 0.59 + b * 0.11);
    const warm = r > 200 && gg > 150 && b < 120; if (warm) { px[i] = 255; px[i + 1] = 214; px[i + 2] = 120; continue; } px[i] = lum * 0.16 + 16; px[i + 1] = lum * 0.17 + 18; px[i + 2] = lum * 0.32 + 40; }
  dg.putImageData(img, 0, 0); g.drawImage(d, 74, 26);
  // foreground hills hide the castle's footing
  hill(238, 10, 0.05, '#121028', 0.7); g.fillStyle = '#0c0a1c'; g.fillRect(0, 248, W, H - 248);
  return c;
}
function startTitleBg(cv) {
  if (!cv) return; const ctx = cv.getContext('2d'), world = titleWorld(), S = document.createElement('canvas'); S.width = W; S.height = H; const g = S.getContext('2d');
  Object.assign(TITLEBG, { on: true, cv, t: 0, goose: -1 });
  const stars = Array.from({ length: 90 }, (_, i) => ({ x: hash(i, 3) * W, y: hash(i, 5) * 130, s: hash(i, 7) < 0.15 ? 2 : 1, p: hash(i, 9) * 6 }));
  const flies = Array.from({ length: 18 }, (_, i) => ({ x: hash(i, 13) * W, y: 200 + hash(i, 15) * 60, p: hash(i, 17) * 6 }));
  let last = performance.now();
  const frame = now => {
    if (!TITLEBG.on || TITLEBG.cv !== cv || !cv.isConnected) return;
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = Math.max(last, now); const t = TITLEBG.t += dt;
    if ($('title').hidden) return requestAnimationFrame(frame);
    const r = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1); if (cv.width !== Math.round(r.width * dpr) || cv.height !== Math.round(r.height * dpr)) { cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); }
    g.drawImage(world, 0, 0);
    for (const s of stars) { const a = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.3 + s.p)); g.globalAlpha = a; g.fillStyle = '#ffffff'; g.fillRect(Math.round(s.x), Math.round(s.y), s.s, s.s); } g.globalAlpha = 1;
    // a goose silhouette crosses the moon every so often
    if (TITLEBG.goose < 0 && (t % 14) < dt) TITLEBG.goose = 0;
    if (TITLEBG.goose >= 0) { TITLEBG.goose += dt; const gx = W + 20 - TITLEBG.goose * 70, gy = 60 + Math.sin(TITLEBG.goose * 2) * 6, fl = Math.floor(TITLEBG.goose * 8) % 2;
      g.fillStyle = '#060812'; g.fillRect(gx, gy, 9, 3); g.fillRect(gx - 4, gy - 3, 2, 4); g.fillRect(gx - 3, gy - 3, 4, 1); g.fillRect(gx - 6, gy - 2, 2, 1); g.fillRect(gx + 2, gy + (fl ? -4 : 2), 4, fl ? 4 : 3);
      if (gx < -20) TITLEBG.goose = -1; }
    for (const f of flies) { const a = 0.3 + 0.7 * Math.max(0, Math.sin(t * 2 + f.p)); g.globalAlpha = a; g.fillStyle = '#ffe98a'; g.fillRect(Math.round(f.x + Math.sin(t * 0.7 + f.p) * 8), Math.round(f.y + Math.cos(t * 0.9 + f.p) * 4), 1, 1); } g.globalAlpha = 1;
    const cw = cv.width, ch = cv.height, k = Math.max(cw / W, ch / H) * (1.04 + 0.02 * Math.sin(t * 0.15)), vw = cw / k, vh = ch / k;
    ctx.imageSmoothingEnabled = false; ctx.drawImage(S, (W - vw) / 2 + Math.sin(t * 0.1) * 4, H - vh, vw, vh, 0, 0, cw, ch);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
