// ===== Developer splash: a little noob takes a heroic swing at the "NOOBSCRUB" logo and the sword snaps =====
// Self-contained: paints on a 240×135 pixel buffer, scaled up by a whole number onto a full-screen canvas.
// startSplash(done) plays it once (about 5 s); a tap, click or key skips it.
const startSplash = (() => {
  const SW = 240, SH = 135, FLOOR = 112;
  const INK = '#1a1430';
  const FONT = {
    N: ['10001', '11001', '11001', '10101', '10011', '10011', '10001'],
    O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
    B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
    S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
    C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
    R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
    U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
    G: ['01111', '10000', '10000', '10011', '10001', '10001', '01111'],
    A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
    M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
    E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  };
  // one letter as an outlined sprite; bands colours each glyph row (top to bottom)
  function glyph(ch, s, bands, shine) {
    const rows = FONT[ch], w = 5 * s + 2, h = 7 * s + 2;
    const c = document.createElement('canvas'); c.width = w; c.height = h + 2; const g = c.getContext('2d');
    const on = (x, y) => rows[y] && rows[y][x] === '1';
    // outline: every block grown by 1px, plus a 2px dark drop under it
    g.fillStyle = INK;
    for (let y = 0; y < 7; y++) for (let x = 0; x < 5; x++) if (on(x, y)) g.fillRect(x * s, y * s, s + 2, s + 4);
    for (let y = 0; y < 7; y++) for (let x = 0; x < 5; x++) if (on(x, y)) {
      g.fillStyle = bands[y]; g.fillRect(x * s + 1, y * s + 1, s, s);
      if (!on(x, y - 1)) { g.fillStyle = shine; g.fillRect(x * s + 1, y * s + 1, s, 1); }
    }
    return c;
  }
  const BIG = ['#fff3b0', '#ffe066', '#ffd84a', '#ffb84a', '#ff9a3d', '#ff7a3d', '#ff5a5a'];
  const SMALL = ['#e6fbff', '#b8f0ff', '#8ee0ff', '#6ac8ff', '#5aa8ff', '#5a8aff', '#6a6aff'];

  // the noob: bucket helmet, pink tee, arms up on the mop pole. Two walk frames.
  const PAL = { k: INK, b: '#4aa8ff', B: '#bfe6ff', d: '#2a6ad0', s: '#ffcf9e', S: '#e8a070', w: '#ffffff', r: '#ff5a8a', R: '#c83a6a', p: '#6a5ad0', o: '#3a2a6a' };
  const NOOB = [
    ['....kkkkkkkk....',
      '...kBBbbbbbbk...',
      '...kBbbbbbbbk...',
      '...kbbbbbbbdk...',
      '..kkkkkkkkkkkk..',
      '..kdddddddddk...',
      '...kssssssssk...',
      '...kswkssswksk..',
      '...kskksssskks..',
      '...kssssSsssk...',
      '....kssssssk.kk.',
      '...kkrrrrrrkksk.',
      '..ksrkrrrrrrkk..',
      '..kskrrrrrrk....',
      '...kkRRRRRRk....',
      '....kppkkppk....',
      '....kppk.kppk...',
      '...kook...kook..'],
    ['....kkkkkkkk....',
      '...kBBbbbbbbk...',
      '...kBbbbbbbbk...',
      '...kbbbbbbbdk...',
      '..kkkkkkkkkkkk..',
      '..kdddddddddk...',
      '...kssssssssk...',
      '...kswkssswksk..',
      '...kskksssskks..',
      '...kssssSsssk...',
      '....kssssssk.kk.',
      '...kkrrrrrrkksk.',
      '..ksrkrrrrrrkk..',
      '..kskrrrrrrk....',
      '...kkRRRRRRk....',
      '.....kppppk.....',
      '.....kpkkpk.....',
      '....kook.kook...'],
  ];
  function sprite(rows) {
    const c = document.createElement('canvas'); c.width = rows[0].length; c.height = rows.length; const g = c.getContext('2d');
    rows.forEach((r, y) => [...r].forEach((p, x) => { if (PAL[p]) { g.fillStyle = PAL[p]; g.fillRect(x, y, 1, 1); } }));
    return c;
  }
  const rnd = (a, b) => a + Math.random() * (b - a);
  const ease = t => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
  const beep = (f, d, type, v, slide, delay) => { try { if (typeof SFX !== 'undefined' && SFX.on && SFX.ctx && SFX.ctx.state === 'running') SFX.tone(f, d, type, v, slide, delay); } catch (e) { } };
  const fizz = (d, v, f) => { try { if (typeof SFX !== 'undefined' && SFX.on && SFX.ctx && SFX.ctx.state === 'running') SFX.hiss(d, v, f); } catch (e) { } };

  // knocked flat: the standing head with X eyes on a sitting body, legs out
  const NOOB_DAZED = NOOB[0].slice(0, 6).concat([
    '...kssssssssk...',
    '...kksksskskk...',
    '...kskssssksk...',
    '...kksksskskk...',
    '...kssskksssk...',
    '....kssssssk....',
    '...kkrrrrrrkk...',
    '..ksrrrrrrrrsk..',
    '...kRRRRRRRRk...',
    '...kppppppppppk.',
    '....kkkkkkkkkook']);
  // a sword, pivot at the grip; blade length n
  function swordImg(n) {
    const c = document.createElement('canvas'); c.width = 7; c.height = n + 7; const g = c.getContext('2d');
    g.fillStyle = INK; g.fillRect(2, 0, 3, n + 2); g.fillRect(0, n + 1, 7, 3); g.fillRect(2, n + 3, 3, 4);
    g.fillStyle = '#e8f0ff'; g.fillRect(3, 1, 1, n + 1); g.fillStyle = '#9aa8d8'; g.fillRect(3, n - 1, 1, 2);
    g.fillStyle = '#ffd84a'; g.fillRect(1, n + 2, 5, 1); g.fillStyle = '#a0603a'; g.fillRect(3, n + 3, 1, 3);
    return c;
  }
  function tipImg() { const c = document.createElement('canvas'); c.width = 3; c.height = 13; const g = c.getContext('2d'); g.fillStyle = INK; g.fillRect(0, 0, 3, 13); g.fillStyle = '#e8f0ff'; g.fillRect(1, 1, 1, 11); return c; }

  return function startSplash(done) {
    const el = document.createElement('div'); el.id = 'splash';
    el.style.cssText = 'position:fixed;inset:0;z-index:80;background:#151030;cursor:pointer;transition:opacity .45s ease;touch-action:manipulation';
    el.setAttribute('aria-label', 'Noobscrub Games'); el.setAttribute('role', 'img');
    const cv = document.createElement('canvas'); cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated';
    el.appendChild(cv); document.body.appendChild(el);
    const ctx = cv.getContext('2d');
    const B = document.createElement('canvas'); const g = B.getContext('2d');
    const L = document.createElement('canvas'); L.width = SW; L.height = SH; const lg = L.getContext('2d');   // logo layer (for the shine)
    const SHD = document.createElement('canvas'); SHD.width = SW; SHD.height = SH; const sg = SHD.getContext('2d');
    // the buffer fills the whole screen at a whole-number scale; the 240×135 scene sits in it and the sky and floor stretch to the edges
    let PS = 1, BW = SW, BH = SH, ox = 0, oy = 0;
    const fit = () => {
      const d = Math.min(3, window.devicePixelRatio || 1); cv.width = Math.round(innerWidth * d); cv.height = Math.round(innerHeight * d);
      const fitS = Math.min(cv.width / SW, cv.height / SH); PS = fitS >= 3 ? Math.floor(fitS) : Math.max(0.5, fitS); BW = Math.ceil(cv.width / PS); BH = Math.ceil(cv.height / PS);   // small screens get a fractional scale rather than a postage stamp
      B.width = BW; B.height = BH; ox = Math.floor((BW - SW) / 2); oy = Math.max(0, Math.min(BH - SH, Math.round(BH * 0.6) - FLOOR));   // tall screens: floor line sits 60% down
    };
    fit(); addEventListener('resize', fit);

    // ---- layout ----
    const BS = 3, word = 'NOOBSCRUB', adv = 5 * BS + 3;
    const bigW = word.length * adv - 3, bx = Math.round((SW - bigW) / 2), by = 34;
    const big = [...word].map((ch, i) => ({ img: glyph(ch, BS, BIG, '#ffffff'), x: bx + i * adv, y: by }));
    const SS = 2, sub = 'GAMES', sadv = 5 * SS + 4;
    const subW = sub.length * sadv - 4, sx = Math.round((SW - subW) / 2), sy = 66;
    const small = [...sub].map((ch, i) => ({ img: glyph(ch, SS, SMALL, '#ffffff'), x: sx + i * sadv, y: sy }));
    const noobF = NOOB.map(sprite), noobDazed = sprite(NOOB_DAZED);
    const SWORD = swordImg(16), STUB = swordImg(4), TIP = tipImg();
    const HIT = { x: big[4].x + 9, y: by + 19 };   // where the blade meets the S

    const stars = Array.from({ length: 90 }, () => ({ x: Math.random(), y: Math.random(), p: rnd(0, 6), c: Math.random() < 0.3 ? '#ffe9a8' : '#c8c0ff' }));
    const parts = [];
    const spark = (x, y, n, cols, sp = 70) => { for (let i = 0; i < n; i++) { const a = rnd(0, Math.PI * 2), s = rnd(20, sp); parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, life: rnd(0.3, 0.7), c: cols[i % cols.length] }); } };
    const dust = (x, y, n) => { for (let i = 0; i < n; i++) parts.push({ x: x + rnd(-4, 4), y, vx: rnd(-25, 25), vy: rnd(-25, -5), t: 0, life: rnd(0.3, 0.6), c: pick2(['#8a7ad0', '#b8a8f0', '#ffffff']) }); };
    const pick2 = a => a[Math.floor(Math.random() * a.length)];

    const T = { run: [0.3, 1.0], windup: [1.0, 1.35], jump: [1.35, 1.62], games: 2.55, shine: [3.3, 3.9], out: 4.75, end: 5.2 };
    const GROUND = FLOOR - 18, START = { x: 76, y: GROUND };
    const APEX = { x: HIT.x - 26, y: HIT.y - 2 };   // noob sprite position at the top of the jump
    const A_UP = -0.45, A_BACK = -2.3, A_HIT = 0.95;
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    // after the clang: the noob tumbles back, the snapped blade tip spins off and sticks in the floor
    const noob = { x: START.x, y: START.y, vx: 0, vy: 0, state: 'pre', bounce: 0 };
    const tip = { on: false, x: 0, y: 0, vx: 0, vy: 0, a: 0, va: 0, stuck: false };
    let t = 0, last = performance.now(), finished = false, hit = false, raf = 0, shake = 0, flash = 0, glinted = false;
    const trail = [], gamesBeeped = new Set();

    const finish = () => {
      if (finished) return; finished = true; cancelAnimationFrame(raf); removeEventListener('resize', fit); removeEventListener('keydown', skip);
      el.style.opacity = '0'; el.style.pointerEvents = 'none'; setTimeout(() => el.remove(), 500); done && done();
    };
    const skip = () => { if (t > 0.15) finish(); };
    el.addEventListener('pointerdown', skip); addEventListener('keydown', skip);

    const line = (x0, y0, x1, y1, col) => { x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0; const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy; g.fillStyle = col; for (; ;) { g.fillRect(x0, y0, 1, 1); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } };
    const rot = (img, x, y, a, px, py) => { g.save(); g.translate(Math.round(x), Math.round(y)); g.rotate(a); g.drawImage(img, -px, -py); g.restore(); };
    const swordAngle = () => {
      if (t < T.run[1]) return A_UP + Math.sin(t * 20) * 0.08;
      if (t < T.windup[1]) return A_UP + (A_BACK - A_UP) * ease((t - T.windup[0]) / (T.windup[1] - T.windup[0]));
      if (t < T.jump[1]) { const k = (t - T.jump[0]) / (T.jump[1] - T.jump[0]); return k < 0.45 ? A_BACK : A_BACK + (A_HIT - A_BACK) * Math.pow((k - 0.45) / 0.55, 2); }
      return A_HIT;
    };
    const tipOf = (hx, hy, a, n) => ({ x: hx + Math.sin(a) * (n + 1), y: hy - Math.cos(a) * (n + 1) });

    function update(dt) {
      if (noob.state === 'pre') {
        if (t < T.run[0]) noob.x = -20;
        else if (t < T.run[1]) noob.x = -20 + (START.x + 20) * ease((t - T.run[0]) / (T.run[1] - T.run[0]));
        else if (t < T.jump[0]) { noob.x = START.x; noob.y = START.y + (t > T.windup[0] ? 2 : 0); }
        else { const k = ease((t - T.jump[0]) / (T.jump[1] - T.jump[0])); noob.x = START.x + (APEX.x - START.x) * k; noob.y = START.y + (APEX.y - START.y) * k; }
        if (!glinted && t > T.windup[0] + 0.2) { glinted = true; const h = tipOf(noob.x + 14, noob.y + 11, A_BACK, 16); parts.push({ x: h.x, y: h.y, vx: 0, vy: 0, t: 0, life: 0.35, c: '#ffffff', glint: 1 }); beep(1760, 0.08, 'triangle', 0.04); }
        if (t >= T.jump[0] + (T.jump[1] - T.jump[0]) * 0.45 && t < T.jump[1]) { const h = tipOf(noob.x + 14, noob.y + 11, swordAngle(), 16); trail.push({ x: h.x, y: h.y, t }); }
        if (t >= T.jump[1] && !hit) {
          hit = true; noob.state = 'fly'; noob.vx = -62; noob.vy = -55;
          shake = reduce ? 0 : 0.32; flash = 0.12;
          spark(HIT.x, HIT.y, 26, ['#ffffff', '#ffe066', '#ffb84a', '#e8f0ff'], 110);
          Object.assign(tip, { on: true, x: HIT.x, y: HIT.y, vx: 48, vy: -125, a: A_HIT, va: 19 });
          beep(1975, 0.35, 'triangle', 0.08, 1); beep(2637, 0.25, 'sine', 0.05, 1); fizz(0.12, 0.3, 3500); beep(220, 0.18, 'square', 0.05, 0.4, 0.06);
        }
      } else if (noob.state === 'fly') {
        noob.vy += 330 * dt; noob.x += noob.vx * dt; noob.y += noob.vy * dt;
        if (noob.y >= FLOOR - 17) { noob.y = FLOOR - 17; noob.state = 'sit'; noob.bounce = 0; dust(noob.x + 8, FLOOR, 8); beep(110, 0.12, 'square', 0.07, 0.5); fizz(0.08, 0.15, 250); }
      } else if (noob.state === 'sit') noob.bounce += dt;
      if (tip.on && !tip.stuck) {
        tip.vy += 380 * dt; tip.x += tip.vx * dt; tip.y += tip.vy * dt; tip.a += tip.va * dt;
        if (tip.vy > 0 && tip.y >= FLOOR - 4) { tip.stuck = true; tip.y = FLOOR + 1; tip.a = Math.PI + 0.35; dust(tip.x, FLOOR, 6); beep(330, 0.1, 'square', 0.05, 0.6); }
      }
      for (const p of parts) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 60 * dt; }
      for (let i = parts.length - 1; i >= 0; i--) if (parts[i].t >= parts[i].life) parts.splice(i, 1);
      shake = Math.max(0, shake - dt); flash = Math.max(0, flash - dt);
    }

    function draw() {
      const sky = ['#151030', '#1d1640', '#261c52', '#2f2264', '#3a2a74'];
      const FY = oy + FLOOR;
      for (let y = 0; y < FY; y++) { const k = Math.max(0, (y - FY + FLOOR) / FLOOR) * (sky.length - 1), i = Math.min(sky.length - 2, Math.floor(k)), f = k - i; g.fillStyle = sky[i]; g.fillRect(0, y, BW, 1); if (f > 0.5) { g.fillStyle = sky[i + 1]; for (let x = y & 1; x < BW; x += 2) g.fillRect(x, y, 1, 1); } }
      for (const s of stars) { const sx = Math.floor(s.x * BW), sy = Math.floor(s.y * (FY - 4)), a = 0.5 + 0.5 * Math.sin(t * 3 + s.p); if (a < 0.25) continue; g.fillStyle = s.c; g.fillRect(sx, sy, 1, 1); if (a > 0.9) { g.globalAlpha = 0.5; g.fillRect(sx - 1, sy, 3, 1); g.fillRect(sx, sy - 1, 1, 3); g.globalAlpha = 1; } }
      // tiled floor
      g.fillStyle = '#4a3a8a'; g.fillRect(0, FY, BW, BH - FY); g.fillStyle = '#6a5ab0'; g.fillRect(0, FY, BW, 1); g.fillStyle = '#3a2c70';
      for (let x = (ox % 12); x < BW; x += 12) g.fillRect(x, FY + 1, 1, BH - FY);
      for (let y = FY + 7; y < BH; y += 7) g.fillRect(0, y, BW, 1);
      for (let y = FY + 24; y < BH; y++) { g.fillStyle = 'rgba(21,16,48,' + Math.min(0.9, (y - FY - 24) / 90) + ')'; g.fillRect(0, y, BW, 1); }   // floor fades into the dark on tall screens
      g.save(); g.imageSmoothingEnabled = false;
      const sh = shake > 0 ? Math.round(rnd(-2, 2) * shake / 0.32) : 0;
      g.translate(ox + sh, oy + (shake > 0 ? Math.round(rnd(-1, 1)) : 0));

      // logo: NOOBSCRUB shrugs off the hit, GAMES drops in, a shine sweeps across
      lg.clearRect(0, 0, SW, SH);
      const hk = hit ? t - T.jump[1] : -1;
      big.forEach((l, i) => {
        let dx = 0, dy = 0;
        if (hk >= 0 && hk < 0.4) { const d = Math.abs(i - 4), k = hk - d * 0.04; if (k > 0 && k < 0.3) { dy = -Math.round(Math.sin(k / 0.3 * Math.PI) * (d === 0 ? 3 : 2)); if (d === 0) dx = Math.round(Math.sin(k * 60)); } }
        lg.drawImage(l.img, l.x + dx, l.y + dy);
      });
      small.forEach((l, i) => {
        const k = t - T.games - i * 0.08; if (k < 0) return;
        let y = l.y, sq = 0;
        if (k < 0.22) y = l.y - Math.round((1 - k / 0.22) ** 2 * 60);
        else if (k < 0.34) sq = 1;
        if (k >= 0.22 && !gamesBeeped.has(i)) { gamesBeeped.add(i); beep(660 + i * 110, 0.06, 'square', 0.05); spark(l.x + 6, l.y + 15, 3, ['#b8f0ff', '#ffffff']); }
        if (sq) lg.drawImage(l.img, l.x - 1, y + 2, l.img.width + 2, l.img.height - 2); else lg.drawImage(l.img, l.x, y);
      });
      const sk = (t - T.shine[0]) / (T.shine[1] - T.shine[0]);
      if (sk > 0 && sk < 1) {
        lg.save(); lg.globalCompositeOperation = 'source-atop'; lg.fillStyle = 'rgba(255,255,255,0.85)';
        const cx = bx - 30 + sk * (bigW + 60);
        for (let y = 20; y < 90; y++) { const x = Math.round(cx + (60 - y) * 0.5); lg.fillRect(x, y, 5, 1); lg.fillRect(x + 8, y, 2, 1); }
        lg.restore();
      }
      sg.clearRect(0, 0, SW, SH); sg.globalCompositeOperation = 'source-over'; sg.drawImage(L, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = '#0a0820'; sg.fillRect(0, 0, SW, SH);
      g.globalAlpha = 0.6; g.drawImage(SHD, 2, 3); g.globalAlpha = 1;
      g.drawImage(L, 0, 0);
      // a tiny scuff where the sword hit, which it can't even manage to keep
      if (hit && hk < 1.2) { g.fillStyle = hk < 0.6 ? '#ffffff' : '#fff3b0'; g.fillRect(HIT.x - 1, HIT.y, 3, 1); }

      // swing trail
      if (t < T.jump[1] + 0.12) for (let i = 1; i < trail.length; i++) { const a = trail[i - 1], b = trail[i]; if (t - b.t > 0.1) continue; line(a.x, a.y, b.x, b.y, t - b.t < 0.06 ? '#ffffff' : '#8ee0ff'); }

      // the snapped blade tip
      if (tip.on) rot(TIP, tip.x, tip.y, tip.a, 1, tip.stuck ? 1 : 6);

      // the noob and the sword
      if (t >= T.run[0] - 0.01) {
        const nx = Math.round(noob.x);
        if (noob.state === 'sit') {
          const ny = Math.round(noob.y) - (noob.bounce < 0.18 ? Math.round(Math.sin(noob.bounce / 0.18 * Math.PI) * 3) : 0);
          g.drawImage(noobDazed, nx, ny);
          rot(STUB, nx + 13, ny + 13, 0.7 + Math.sin(t * 2) * 0.05, 3, 6);
          // birdies, er, stars circling the helmet
          for (let i = 0; i < 3; i++) { const a = t * 5 + i * Math.PI * 2 / 3, x = Math.round(nx + 8 + Math.cos(a) * 9), y = Math.round(ny - 1 + Math.sin(a) * 2); g.fillStyle = '#ffe066'; g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); }
        } else {
          const ny = Math.round(noob.y), running = t > T.run[0] && t < T.run[1];
          const img = noobF[running ? Math.floor(t * 12) & 1 : (noob.state === 'fly' || t > T.jump[0]) ? 1 : 0];
          const a = noob.state === 'fly' ? A_HIT + (t - T.jump[1]) * 9 : swordAngle();
          const blade = noob.state === 'fly' ? STUB : SWORD;
          if (noob.state === 'fly') { g.save(); g.translate(nx + 8, ny + 9); g.rotate(-(t - T.jump[1]) * 7); g.drawImage(img, -8, -9); g.restore(); }
          else g.drawImage(img, nx, ny);
          rot(blade, nx + 14, ny + 11, a, 3, blade === SWORD ? 18 : 6);
        }
      }
      for (const p of parts) {
        const a = 1 - p.t / p.life; g.fillStyle = p.c; const x = Math.round(p.x), y = Math.round(p.y);
        if (p.glint) { const r = Math.round(Math.sin(p.t / p.life * Math.PI) * 3); g.fillRect(x - r, y, r * 2 + 1, 1); g.fillRect(x, y - r, 1, r * 2 + 1); }
        else { g.globalAlpha = a; g.fillRect(x, y, 1, 1); g.globalAlpha = 1; }
      }
      g.restore();
      if (flash > 0) { g.fillStyle = 'rgba(255,255,255,' + (flash / 0.12 * 0.55) + ')'; g.fillRect(0, 0, BW, BH); }
      const fade = t < 0.3 ? 1 - t / 0.3 : t > T.out ? Math.min(1, (t - T.out) / (T.end - T.out)) : 0;
      if (fade > 0) { g.fillStyle = 'rgba(21,16,48,' + fade + ')'; g.fillRect(0, 0, BW, BH); }
      // blit, pixels kept square
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(B, Math.floor((cv.width - BW * PS) / 2), Math.floor((cv.height - BH * PS) / 2), BW * PS, BH * PS);
    }

    function step(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
      update(dt); draw();
      if (t >= T.end) return finish();
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(n => { last = n; step(n); });
  };
})();
