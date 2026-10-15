// ===== Developer splash: a little noob scrubs the grime off the "NOOBSCRUB GAMES" logo =====
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
  const NOOB_HAPPY = NOOB[1].slice(); NOOB_HAPPY[7] = '...kssssssssk...'; NOOB_HAPPY[8] = '...kskksskksk...'; NOOB_HAPPY[9] = '...ksskkkkssk...';
  function sprite(rows) {
    const c = document.createElement('canvas'); c.width = rows[0].length; c.height = rows.length; const g = c.getContext('2d');
    rows.forEach((r, y) => [...r].forEach((p, x) => { if (PAL[p]) { g.fillStyle = PAL[p]; g.fillRect(x, y, 1, 1); } }));
    return c;
  }
  const rnd = (a, b) => a + Math.random() * (b - a);
  const ease = t => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
  const beep = (f, d, type, v, slide, delay) => { try { if (typeof SFX !== 'undefined' && SFX.on && SFX.ctx && SFX.ctx.state === 'running') SFX.tone(f, d, type, v, slide, delay); } catch (e) { } };
  const fizz = (d, v, f) => { try { if (typeof SFX !== 'undefined' && SFX.on && SFX.ctx && SFX.ctx.state === 'running') SFX.hiss(d, v, f); } catch (e) { } };

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
    const M = document.createElement('canvas'); M.width = SW; M.height = SH; const mg = M.getContext('2d');   // grime layer
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
    const noobF = NOOB.map(sprite), noobJoy = sprite(NOOB_HAPPY);

    // grime: chunky 2px mud speckle over the big word
    const GX0 = bx - 6, GX1 = bx + bigW + 6, GY0 = by - 6, GY1 = by + 7 * BS + 10;
    const MUD = ['#5a4a3a', '#6b5a40', '#4a4a32', '#7a6a48', '#584838', '#3e4a30'];
    for (let y = GY0; y < GY1; y += 2) for (let x = GX0; x < GX1; x += 2) {
      const edge = Math.min(x - GX0, GX1 - x, y - GY0, GY1 - y);
      if (edge < 4 && Math.random() < 0.45) continue;
      mg.fillStyle = MUD[Math.floor(Math.random() * MUD.length)]; mg.fillRect(x, y, 2, 2);
    }
    for (let i = 0; i < 14; i++) { const x = GX0 + 4 + Math.floor(Math.random() * (GX1 - GX0 - 8) / 2) * 2, l = 2 + Math.floor(Math.random() * 4) * 2; mg.fillStyle = MUD[i % MUD.length]; mg.fillRect(x, GY1 - 2, 2, l); }
    const scrub = (x, y) => { mg.save(); mg.globalCompositeOperation = 'destination-out'; const qx = Math.round(x / 2) * 2, qy = Math.round(y / 2) * 2; mg.fillRect(qx - 9, qy - 8, 18, 16); mg.fillRect(qx - 7, qy - 10, 14, 20); mg.restore(); };

    // stars
    const stars = Array.from({ length: 90 }, () => ({ x: Math.random(), y: Math.random(), p: rnd(0, 6), c: Math.random() < 0.3 ? '#ffe9a8' : '#c8c0ff' }));
    const parts = [];
    const bubble = (x, y) => parts.push({ kind: 'b', x, y, vx: rnd(-14, 14), vy: rnd(-30, -10), t: 0, life: rnd(0.5, 1.1), r: Math.random() < 0.4 ? 2 : 1 });
    const spark = (x, y, n, cols) => { for (let i = 0; i < n; i++) { const a = rnd(0, Math.PI * 2), s = rnd(20, 70); parts.push({ kind: 's', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, life: rnd(0.3, 0.7), c: cols[i % cols.length] }); } };
    const twinkles = [];   // ✦ glints left on the clean letters

    const T = { walkIn: [0.3, 0.9], scrub: [0.9, 2.75], pop: 2.8, games: 3.0, shine: [3.35, 3.95], hop: 3.45, out: 4.7, end: 5.15 };
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    let t = reduce ? T.pop : 0, last = performance.now(), finished = false, popped = false, hopped = false, raf = 0, lastSq = 0;
    const gamesBeeped = new Set();

    const finish = () => {
      if (finished) return; finished = true; cancelAnimationFrame(raf); removeEventListener('resize', fit); removeEventListener('keydown', skip);
      el.style.opacity = '0'; el.style.pointerEvents = 'none'; setTimeout(() => el.remove(), 500); done && done();
    };
    const skip = () => { if (t > 0.15) finish(); };
    el.addEventListener('pointerdown', skip); addEventListener('keydown', skip);

    // where the mop head is at time tt
    const mopAt = tt => {
      const u = (tt - T.scrub[0]) / (T.scrub[1] - T.scrub[0]);
      const x = GX0 + 6 + u * (GX1 - GX0 - 12), y = (GY0 + GY1) / 2 + Math.sin(u * Math.PI * 11) * ((GY1 - GY0) / 2 - 5);
      return { x, y };
    };
    const noobAt = tt => {
      if (tt < T.walkIn[1]) { const k = ease((tt - T.walkIn[0]) / (T.walkIn[1] - T.walkIn[0])); return -24 + k * (GX0 - 18 + 24); }
      if (tt < T.scrub[1]) return mopAt(tt).x - 18;
      return GX1 - 18;
    };
    const line = (x0, y0, x1, y1, col) => { x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0; const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy; g.fillStyle = col; for (; ;) { g.fillRect(x0, y0, 1, 1); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } };

    function draw() {
      // sky: dithered bands of dusk purple
      const sky = ['#151030', '#1d1640', '#261c52', '#2f2264', '#3a2a74'];
      const FY = oy + FLOOR;
      for (let y = 0; y < FY; y++) { const k = Math.max(0, (y - FY + FLOOR) / FLOOR) * (sky.length - 1), i = Math.min(sky.length - 2, Math.floor(k)), f = k - i; g.fillStyle = sky[i]; g.fillRect(0, y, BW, 1); if (f > 0.5) { g.fillStyle = sky[i + 1]; for (let x = y & 1; x < BW; x += 2) g.fillRect(x, y, 1, 1); } }
      for (const s of stars) { const sx = Math.floor(s.x * BW), sy = Math.floor(s.y * (FY - 4)), a = 0.5 + 0.5 * Math.sin(t * 3 + s.p); if (a < 0.25) continue; g.fillStyle = s.c; g.fillRect(sx, sy, 1, 1); if (a > 0.9) { g.globalAlpha = 0.5; g.fillRect(sx - 1, sy, 3, 1); g.fillRect(sx, sy - 1, 1, 3); g.globalAlpha = 1; } }
      // tiled floor
      g.fillStyle = '#4a3a8a'; g.fillRect(0, FY, BW, BH - FY); g.fillStyle = '#6a5ab0'; g.fillRect(0, FY, BW, 1); g.fillStyle = '#3a2c70';
      for (let x = (ox % 12); x < BW; x += 12) g.fillRect(x, FY + 1, 1, BH - FY);
      for (let y = FY + 7; y < BH; y += 7) g.fillRect(0, y, BW, 1);
      for (let y = FY + 24; y < BH; y++) { g.fillStyle = 'rgba(21,16,48,' + Math.min(0.9, (y - FY - 24) / 90) + ')'; g.fillRect(0, y, BW, 1); }   // floor fades into the dark on tall screens
      g.save(); g.translate(ox, oy);
      // soap puddle trail behind the noob
      const trail = Math.min(noobAt(t) + 8, GX1);
      if (t > T.scrub[0]) { g.fillStyle = '#8ad8ff'; for (let x = GX0 - 10; x < trail; x += 6) if ((x * 7) % 5 < 3) g.fillRect(x, FLOOR + 2 + ((x / 6) & 1), 4, 1); }

      // logo
      lg.clearRect(0, 0, SW, SH);
      const popT = t - T.pop;
      big.forEach((l, i) => {
        let dy = 0;
        if (popT > 0) { const k = popT - i * 0.045; if (k > 0 && k < 0.35) dy = -Math.round(Math.sin(k / 0.35 * Math.PI) * 5); }
        lg.drawImage(l.img, l.x, l.y + dy);
      });
      small.forEach((l, i) => {
        const k = t - T.games - i * 0.08; if (k < 0) return;
        let y = l.y, sq = 0;
        if (k < 0.22) y = l.y - Math.round((1 - k / 0.22) ** 2 * 60);
        else if (k < 0.34) sq = 1;
        if (k >= 0.22 && !gamesBeeped.has(i)) { gamesBeeped.add(i); beep(660 + i * 110, 0.06, 'square', 0.05); spark(l.x + 6, l.y + 15, 3, ['#b8f0ff', '#ffffff']); }
        if (sq) lg.drawImage(l.img, l.x - 1, y + 2, l.img.width + 2, l.img.height - 2); else lg.drawImage(l.img, l.x, y);
      });
      // shine sweep across the letters
      const sk = (t - T.shine[0]) / (T.shine[1] - T.shine[0]);
      if (sk > 0 && sk < 1) {
        lg.save(); lg.globalCompositeOperation = 'source-atop'; lg.fillStyle = 'rgba(255,255,255,0.85)';
        const cx = bx - 30 + sk * (bigW + 60);
        for (let y = 20; y < 90; y++) { const ox = Math.round(cx + (60 - y) * 0.5); lg.fillRect(ox, y, 5, 1); lg.fillRect(ox + 8, y, 2, 1); }
        lg.restore();
      }
      // dark drop shadow, then the logo
      sg.clearRect(0, 0, SW, SH); sg.globalCompositeOperation = 'source-over'; sg.drawImage(L, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = '#0a0820'; sg.fillRect(0, 0, SW, SH);
      g.globalAlpha = 0.6; g.drawImage(SHD, 2, 3); g.globalAlpha = 1;
      g.drawImage(L, 0, 0);
      g.drawImage(M, 0, 0);
      for (const w of twinkles) { const k = (t - w.t) / 0.5; if (k < 0 || k > 1) continue; const r = Math.round(Math.sin(k * Math.PI) * 3); g.fillStyle = '#ffffff'; g.fillRect(w.x - r, w.y, r * 2 + 1, 1); g.fillRect(w.x, w.y - r, 1, r * 2 + 1); }

      // the noob, the pole and the mop
      const nx = Math.round(noobAt(t)), walking = t > T.walkIn[0] && t < T.scrub[1];
      let ny = FLOOR - 18;
      const hk = t - T.hop; if (hk > 0 && hk < 0.45) ny -= Math.round(Math.sin(hk / 0.45 * Math.PI) * 12);
      const happy = t > T.pop;
      const img = happy ? noobJoy : noobF[walking ? Math.floor(t * 10) & 1 : 0];
      const hand = { x: nx + 14, y: ny + 11 };
      let mop;
      if (t >= T.scrub[0] && t < T.scrub[1]) mop = mopAt(t);
      else if (t < T.scrub[0]) mop = { x: hand.x + 14, y: hand.y - 26 };
      else { const k = ease((t - T.scrub[1]) / 0.4); mop = { x: hand.x + 4 + (1 - k) * 10, y: hand.y - 28 - (1 - k) * 0 }; }
      if (t > T.walkIn[0] - 0.01) {
        line(hand.x, hand.y, mop.x, mop.y + 6, '#c99a50'); line(hand.x + 1, hand.y, mop.x + 1, mop.y + 6, '#8a6030');
        // mop head: a fat yellow sponge
        const mx = Math.round(mop.x) - 6, my = Math.round(mop.y) - 4;
        g.fillStyle = INK; g.fillRect(mx - 1, my - 1, 14, 10); g.fillStyle = '#ffd84a'; g.fillRect(mx, my, 12, 8); g.fillStyle = '#5ac85a'; g.fillRect(mx, my + 6, 12, 2);
        g.fillStyle = '#e8b030'; g.fillRect(mx + 2, my + 2, 1, 1); g.fillRect(mx + 7, my + 3, 1, 1); g.fillRect(mx + 4, my + 5, 1, 1); g.fillStyle = '#fff3b0'; g.fillRect(mx, my, 12, 1);
        g.drawImage(img, nx, ny);
      }
      // bubbles and sparks
      for (const p of parts) {
        const a = 1 - p.t / p.life;
        if (p.kind === 'b') { g.fillStyle = a > 0.2 ? '#bfe6ff' : '#ffffff'; const x = Math.round(p.x), y = Math.round(p.y); if (p.r === 2) { g.fillRect(x - 1, y - 2, 3, 1); g.fillRect(x - 1, y + 2, 3, 1); g.fillRect(x - 2, y - 1, 1, 3); g.fillRect(x + 2, y - 1, 1, 3); g.fillStyle = '#ffffff'; g.fillRect(x - 1, y - 1, 1, 1); } else { g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); } }
        else { g.globalAlpha = a; g.fillStyle = p.c; g.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); g.globalAlpha = 1; }
      }
      g.restore();
      // pop flash
      if (popT > 0 && popT < 0.12) { g.fillStyle = 'rgba(255,255,255,' + (0.6 * (1 - popT / 0.12)) + ')'; g.fillRect(0, 0, BW, BH); }
      // fades in and out
      const fade = t < 0.3 ? 1 - t / 0.3 : t > T.out ? Math.min(1, (t - T.out) / (T.end - T.out)) : 0;
      if (fade > 0) { g.fillStyle = 'rgba(21,16,48,' + fade + ')'; g.fillRect(0, 0, BW, BH); }

      // blit, pixels kept square
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(B, Math.floor((cv.width - BW * PS) / 2), Math.floor((cv.height - BH * PS) / 2), BW * PS, BH * PS);
    }

    function step(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
      if (t >= T.scrub[0] && t < T.scrub[1]) {
        const m = mopAt(t); scrub(m.x, m.y);
        if (Math.random() < 0.6) bubble(m.x + rnd(-6, 6), m.y + rnd(-3, 3));
        if (t - lastSq > 0.16) { lastSq = t; beep(rnd(1400, 1900), 0.05, 'triangle', 0.03, 1.3); if (Math.random() < 0.5) twinkles.push({ x: Math.round(m.x - rnd(8, 16)), y: Math.round(m.y + rnd(-6, 6)), t }); }
      }
      if (!popped && t >= T.pop) {
        popped = true; mg.clearRect(0, 0, SW, SH);
        for (let i = 0; i < 26; i++) bubble(rnd(GX0, GX1), rnd(GY0, GY1));
        spark(SW / 2, by + 10, 24, ['#ffe066', '#ffffff', '#ff9a3d', '#8ee0ff']);
        [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.14, 'square', 0.05, 1, i * 0.06)); fizz(0.3, 0.08, 3000);
      }
      if (!hopped && t >= T.hop) { hopped = true; const nx = noobAt(t); spark(nx + 8, FLOOR - 20, 10, ['#ffe066', '#ffffff']); beep(392, 0.1, 'square', 0.05, 2); }
      for (const p of parts) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.kind === 'b') { p.vx *= 0.96; p.x += Math.sin((p.t + p.y) * 8) * 0.2; } else p.vy += 60 * dt; }
      for (let i = parts.length - 1; i >= 0; i--) if (parts[i].t >= parts[i].life) parts.splice(i, 1);
      draw();
      if (t >= T.end) return finish();
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(n => { last = n; step(n); });
  };
})();
