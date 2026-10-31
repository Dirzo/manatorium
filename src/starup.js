// ===== Star-up show (Cam 2026-10-24) =====
// When copies merge a legend into 2★ or 3★: the copies fly in and fuse, a flash, the legend comes back recoloured
// (silver at 2★, gold at 3★), the weapon grows in pixel steps, and the stars stamp in one by one.
// A 3★ legend also gets its starforged signature called out. Tap to skip.
const STARUP = {
  queue: [], cur: null,
  show(h, s0, s1) { this.queue.push({ h, s0, s1 }); if (!this.cur) this.next(); },
  next() {
    const job = this.queue.shift(); if (!job) { this.cur = null; return; }
    const { h, s0, s1 } = job, d = HERO_BY_ID[h.id], col = STAR_COL[s1 - 1], quiet = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const base = heroSpriteKey(h, true), face = k => heroFaceKey(k, h), oldKey = face(s0 > 1 ? base + '~' + s0 : base), newKey = face(base + '~' + s1);
    const ws0 = s0 > 1 ? STAR_LOOK[s0 - 1].ws : 1, ws1 = STAR_LOOK[s1 - 1].ws;
    const grow = [0, 1, 2, 3, 4].map(i => { const k = face(base + '~' + s1 + '@' + (ws0 + (ws1 - ws0) * i / 4).toFixed(2)); ensureSprite(k); return k; });
    ensureSprite(oldKey); ensureSprite(newKey);
    const st = heroStats(h, G.run, G.meta), sig = s1 >= 3 ? `<p class="su-sig">Starforged signature: <b>${esc(st.aName || d.aName)}</b> +1 rank, +${Math.round((STARFORGED.mul - 1) * 100)}% power</p>` : '';
    const el = document.createElement('div'); el.className = `starup s${s1}`; el.style.setProperty('--sc', col);
    el.innerHTML = `<canvas width="${STARUP.W}" height="${STARUP.H}"></canvas><div class="su-txt"><h2 class="alive">${aliveText(heroDisplayName(h))}</h2><p>rises to <span class="su-stars">${'★'.repeat(s1)}</span></p>${sig}</div><small class="su-skip">tap to continue</small>`;
    document.body.appendChild(el);
    const cv = el.querySelector('canvas'), g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    const T = { t: quiet ? 1.2 : 0, end: (s1 >= 3 ? 3.7 : 3.0), parts: [], stamped: 0, burst: false, grownTo: -1, last: performance.now(), done: false };
    this.cur = { el, T };
    const close = () => { if (T.done) return; T.done = true; el.classList.add('out'); setTimeout(() => { el.remove(); this.next(); }, 280); };
    el.addEventListener('pointerdown', close);
    const loop = now => {
      if (T.done) return; const dt = Math.min(0.05, (now - T.last) / 1000); T.last = now; T.t += dt;
      STARUP.frame(g, T, { oldKey, newKey, grow, col, s0, s1, quiet });
      if (T.t >= T.end) close(); else requestAnimationFrame(loop);
    };
    SFX.play('whoosh'); requestAnimationFrame(loop);
    if (quiet) { T.burst = true; el.classList.add('lit'); SFX.play('forged'); }
  },
  W: 160, H: 120,
  // one frame of the show on the little pixel canvas
  frame(g, T, o) {
    const { W, H } = STARUP, t = T.t, cx = W / 2, feet = 94, fs = 46, gold = o.s1 >= 3;
    g.clearRect(0, 0, W, H);
    const P = (x, y, c, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
    const sprite = (key, fr, x, y, a = 1, white) => { const S = SPR[key]; if (!S) return; const img = white ? S.white[fr] : S.frames[fr], b = frameBox(img, x, y, fs); g.globalAlpha = a; g.drawImage(img, Math.round(b.x), Math.round(b.y), b.w, b.h); g.globalAlpha = 1; };
    const spark = (x, y, n, cols, sp = 40, up = 0) => { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8); T.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - up, life: 0.5 + Math.random() * 0.6, t: 0, c: cols[i % cols.length], g: 60 }); } };
    const cols = gold ? ['#ffd94a', '#fff3a0', '#ffffff', '#ff9a3a'] : ['#e8f0ff', '#ffffff', '#9fd8ff', '#c8b8ff'];
    const GATHER = 0.55, CHARGE = 0.85;
    // light rays behind the legend, spinning faster once it bursts
    const ra = t < GATHER ? 0 : Math.min(1, (t - GATHER) / 0.3);
    if (ra > 0) { const n = gold ? 12 : 9, spin = t * (T.burst ? 0.9 : 2.2), R = 90;
      const oy = feet - 22, fade = c => { const G2 = g.createRadialGradient(cx, oy, 4, cx, oy, R * 0.8); G2.addColorStop(0, c); G2.addColorStop(0.55, c); G2.addColorStop(1, 'rgba(0,0,0,0)'); return G2; }, F = [fade(o.col), fade('#ffffff')];
      for (let i = 0; i < n; i++) { const a0 = spin + i * TAU / n, a1 = a0 + TAU / n * 0.45;
        g.globalAlpha = ra * (i % 2 ? 0.22 : 0.45); g.fillStyle = F[i % 2]; g.beginPath(); g.moveTo(cx, oy); g.lineTo(cx + Math.cos(a0) * R, oy + Math.sin(a0) * R); g.lineTo(cx + Math.cos(a1) * R, oy + Math.sin(a1) * R); g.closePath(); g.fill(); }
      g.globalAlpha = ra * 0.3; g.fillStyle = fade(o.col); g.beginPath(); g.arc(cx, oy, 22 + Math.sin(t * 6) * 2, 0, TAU); g.fill(); g.globalAlpha = 1; }
    // pedestal
    g.globalAlpha = 0.5; P(cx - 18, feet + 1, '#1a1230', 36, 3); g.globalAlpha = 1; P(cx - 14, feet + 1, o.col, 28, 1); P(cx - 10, feet + 3, o.col, 20, 1);
    if (!T.burst) {
      // the copies fly in from the sides and fuse into the legend
      const k = Math.min(1, t / GATHER), e = k * k * (3 - 2 * k);
      for (const side of [-1, 1]) { const sx = cx + side * (70 - 70 * e), sy = feet - Math.sin(e * Math.PI) * 26;
        if (k >= 1) continue; const fr = Math.floor(t * 10) % 2 ? 'walk0' : 'walk1';
        for (let tr = 1; tr <= 2; tr++) { const kk = Math.max(0, e - tr * 0.05); sprite(o.oldKey, fr, cx + side * (70 - 70 * kk), feet - Math.sin(kk * Math.PI) * 26, 0.18 / tr, true); }
        sprite(o.oldKey, fr, sx, sy, 0.95); sprite(o.oldKey, fr, sx, sy, 0.25 + 0.6 * e, true);
        if (Math.random() < 0.5) T.parts.push({ x: sx + (Math.random() - 0.5) * 10, y: sy - Math.random() * 20, vx: 0, vy: -10, life: 0.4, t: 0, c: o.col, g: 0 }); }
      // the legend charges: it shakes and strobes white
      const ch = t > GATHER ? (t - GATHER) / (CHARGE - GATHER) : 0, jit = ch > 0 ? (Math.random() * 2 - 1) * ch * 1.5 : 0;
      sprite(o.oldKey, Math.floor(t * 2) % 2 ? 'idle1' : 'idle0', cx + jit, feet);
      if (ch > 0 && Math.floor(t * (10 + ch * 20)) % 2) sprite(o.oldKey, 'idle0', cx + jit, feet, 0.4 + ch * 0.5, true);
      if (ch > 0) for (let i = 0; i < 2; i++) { const a = Math.random() * TAU, r = 40 - ch * 20; T.parts.push({ x: cx + Math.cos(a) * r, y: feet - 22 + Math.sin(a) * r, vx: -Math.cos(a) * 60, vy: -Math.sin(a) * 60, life: 0.35, t: 0, c: o.col, g: 0 }); }
      if (t >= CHARGE) { T.burst = true; T.burstT = t; spark(cx, feet - 22, gold ? 46 : 32, cols, 80, 20); SFX.play('stamp'); SFX.play('forged'); const el = STARUP.cur && STARUP.cur.el; if (el) el.classList.add('lit'); }
    } else {
      const bt = t - (T.burstT || 0);
      // shockwave rings
      for (const [d, c] of [[0, '#ffffff'], [0.08, o.col]]) { const k = (bt - d) / 0.45; if (k > 0 && k < 1) { g.globalAlpha = 1 - k; g.strokeStyle = c; g.lineWidth = 2; g.beginPath(); g.arc(cx, feet - 22, 6 + k * 60, 0, TAU); g.stroke(); g.globalAlpha = 1; } }
      // the weapon grows in steps, a sparkle for each
      const step = Math.min(4, Math.floor(Math.max(0, bt - 0.15) / 0.11));
      if (step !== T.grownTo) { T.grownTo = step; if (step > 0) { SFX.play(step === 4 ? 'anvil' : 'click'); spark(cx + 12, feet - 34 - step * 3, 6, cols, 30); } }
      const key = step >= 4 ? o.newKey : o.grow[step], fr = bt < 0.75 ? 'atk' : Math.floor(t * 2) % 2 ? 'idle1' : 'idle0';
      sprite(key, fr, cx, feet);
      if (bt < 0.35) sprite(key, fr, cx, feet, 1 - bt / 0.35, true); // the white flash fades off the new colours
      // stars stamp in over the head
      const n = o.s1, s0 = 0.55;
      for (let i = 0; i < n; i++) { const st = bt - s0 - i * 0.22; if (st < 0) continue;
        if (T.stamped <= i) { T.stamped = i + 1; SFX.play(i === n - 1 ? 'level' : 'drop'); spark(cx + (i - (n - 1) / 2) * 13, feet - 60, 10, cols, 40); }
        const sc = st < 0.12 ? 3 - 2 * (st / 0.12) : st < 0.22 ? 1 - 0.25 * Math.sin((st - 0.12) / 0.1 * Math.PI) : 1, x = cx + (i - (n - 1) / 2) * 13, y = feet - 62 + Math.sin(t * 3 + i) * 1;
        STARUP.star(g, x, y, sc, o.col, gold && Math.floor(t * 6 + i) % 4 === 0); }
      // confetti keeps drifting down
      if (Math.random() < (gold ? 0.7 : 0.45)) T.parts.push({ x: Math.random() * W, y: -2, vx: (Math.random() - 0.5) * 10, vy: 15 + Math.random() * 15, life: 3, t: 0, c: cols[Math.floor(Math.random() * cols.length)], g: 0, conf: true });
    }
    // particles
    for (const p of T.parts) { p.t += 1 / 60; p.vy += p.g / 60; p.x += p.vx / 60; p.y += p.vy / 60; g.globalAlpha = p.conf ? 0.9 : Math.max(0, 1 - p.t / p.life); P(p.x, p.y, p.c, p.conf && Math.floor(p.t * 8) % 2 ? 2 : 1, 1); }
    g.globalAlpha = 1; T.parts = T.parts.filter(p => p.t < p.life && p.y < H + 2);
  },
  // a chunky pixel star, scaled sc times, outlined like the ones over champions
  star(g, x, y, sc, col, glint) {
    const rows = ['...#...', '...#...', '..###..', '#######', '.#####.', '..###..', '.##.##.', '.#...#.'], s = Math.max(1, Math.round(sc * 1.4)) / 1.4, k = s * 1.4;
    const x0 = Math.round(x - 3.5 * k), y0 = Math.round(y - 4 * k), q = Math.max(1, Math.round(k));
    for (const [ox, oy, c] of [[-1, 0, OUTLINE], [1, 0, OUTLINE], [0, -1, OUTLINE], [0, 1, OUTLINE], [0, 0, col]]) { g.fillStyle = c;
      rows.forEach((r, ry) => { for (let rx = 0; rx < 7; rx++) if (r[rx] === '#') g.fillRect(x0 + Math.round(rx * k) + ox, y0 + Math.round(ry * k) + oy, q, q); }); }
    g.fillStyle = '#ffffff'; g.fillRect(x0 + Math.round(3 * k), y0 + Math.round(3 * k), q, q); if (glint) { g.fillRect(x0 + Math.round(2 * k), y0 + Math.round(4 * k), q, q); }
  },
};
