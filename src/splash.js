// ===== Developer splash: someone has a go at the "NOOBSCRUB GAMES" logo and it goes wrong =====
// Three skits, one picked at random each launch (never the same twice in a row):
//   sword  a little noob leaps at the logo, the sword snaps, he lands dazed
//   mop    a burly janitor mops the muddy letters clean, then slips on his own suds
//   mage   a mage blasts the letters, the spell bounces straight back and chars him
// Self-contained: paints on a 240×135 pixel buffer, scaled up by a whole number onto a full-screen canvas.
// startSplash(done) plays one (about 5 s); a tap, click or key skips it. ?splash=sword|mop|mage forces one.
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

  const PAL = {
    k: INK, b: '#4aa8ff', B: '#bfe6ff', d: '#2a6ad0', s: '#ffcf9e', S: '#e8a070', w: '#ffffff', r: '#ff5a8a', R: '#c83a6a', p: '#6a5ad0', o: '#3a2a6a',
    h: '#6a3a2a', j: '#f0f0ff', J: '#b8c0e0', n: '#3a6ad0', N: '#2a3a90',                                  // janitor: mustache, tank top, overalls
    m: '#8a5ae0', M: '#5a34b0', y: '#ffd84a', g: '#eef0ff', G: '#b8bcd0',                                  // mage: robe, trim, beard
  };
  function sprite(rows, pal = PAL) {
    const c = document.createElement('canvas'); c.width = Math.max(...rows.map(r => r.length)); c.height = rows.length; const g = c.getContext('2d');
    rows.forEach((r, y) => [...r].forEach((p, x) => { if (pal[p]) { g.fillStyle = pal[p]; g.fillRect(x, y, 1, 1); } }));
    return c;
  }
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const ease = t => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
  const sfxOk = () => typeof SFX !== 'undefined' && SFX.on && SFX.ctx && SFX.ctx.state === 'running';
  const beep = (f, d, type, v, slide, delay) => { try { if (sfxOk()) SFX.tone(f, d, type, v, slide, delay); } catch (e) { } };
  const fizz = (d, v, f, delay) => { try { if (sfxOk()) SFX.hiss(d, v, f, delay); } catch (e) { } };

  // ---------------- sprites ----------------
  // the noob: bucket helmet, pink tee. Two walk frames, and knocked flat with X eyes
  const NOOB_HEAD = ['....kkkkkkkk....', '...kBBbbbbbbk...', '...kBbbbbbbbk...', '...kbbbbbbbdk...', '..kkkkkkkkkkkk..', '..kdddddddddk...'];
  const NOOB_BODY = ['...kssssssssk...', '...kswkssswksk..', '...kskksssskks..', '...kssssSsssk...', '....kssssssk.kk.', '...kkrrrrrrkksk.', '..ksrkrrrrrrkk..', '..kskrrrrrrk....', '...kkRRRRRRk....'];
  const NOOB = [
    NOOB_HEAD.concat(NOOB_BODY, ['....kppkkppk....', '....kppk.kppk...', '...kook...kook..']),
    NOOB_HEAD.concat(NOOB_BODY, ['.....kppppk.....', '.....kpkkpk.....', '....kook.kook...']),
  ];
  const NOOB_DAZED = NOOB_HEAD.concat(['...kssssssssk...', '...kksksskskk...', '...kskssssksk...', '...kksksskskk...', '...kssskksssk...',
    '....kssssssk....', '...kkrrrrrrkk...', '..ksrrrrrrrrsk..', '...kRRRRRRRRk...', '...kppppppppppk.', '....kkkkkkkkkook']);
  // the janitor: bald, big mustache, tank top, overalls, boots. 20×20
  const BRUTE_TOP = ['.......kkkkkk.......', '......kswsssk.......', '.....ksssssssk......', '.....ksksssksk......', '.....ksssssssk......', '.....khhhhhhhk......',
    '......kssSssk.......', '...kkkkjjjjjkkkk....', '..kssskjjjjjksssk...', '..kssskjjjjjksssk...', '..ksskjjjjjjjksk....', '..ksskJjjjjjJksk....', '..ksskJJJJJJJkssk...',
    '...kkknnnnnnnkkk....', '.....knnnnnnnk......', '.....knnnkNnnk......', '.....knnnkknnnk.....'];
  const BRUTE = [
    BRUTE_TOP.concat(['.....knnk..knnk.....', '.....knnk..knnk.....', '....kkkkk..kkkkk....']),
    BRUTE_TOP.concat(['......knnkknnk......', '......knnkknnk......', '.....kkkkkkkkkk.....']),
  ];
  const BRUTE_DAZED = BRUTE[0].slice(); BRUTE_DAZED[3] = '.....kkskskksk......'; BRUTE_DAZED[4] = '.....ksksksksk......';
  // the mage: tall starry hat, white beard, purple robe; hand out for the staff. 16×20
  const MAGE = ['.........k......', '........kmk.....', '.......kmmk.....', '......kmymk.....', '......kmmmmk....', '.....kmmmmmmk...', '...kkkkkkkkkkkk.',
    '....kssssssk....', '....kswsswsk....', '....kgssssgk....', '....kggggggk....', '...kmkggggkmk...', '..kmmmkggkmmmk..', '..kmmmmkkmmmmsk.', '..kmmmmyymmmmk..',
    '..kMmmmmmmmmMk..', '..kMMmmmmmmMMk..', '...kMMMMMMMMk...', '...kkkkkkkkkk...', '....kok..kok.....'];
  const SOOT = Object.fromEntries(Object.keys(PAL).map(k => [k, k === 'k' ? INK : k === 'w' ? '#ffffff' : k === 'g' || k === 'G' ? '#7a7680' : k === 'y' ? '#8a6a30' : '#3a3044']));
  const MAGE_SOOT = sprite(MAGE, SOOT), MAGE_BLINK = sprite(MAGE.map((r, y) => y === 8 ? '....kskssksk....' : r), SOOT);
  // a sword, pivot at the grip; blade length n
  function swordImg(n) {
    const c = document.createElement('canvas'); c.width = 7; c.height = n + 7; const g = c.getContext('2d');
    g.fillStyle = INK; g.fillRect(2, 0, 3, n + 2); g.fillRect(0, n + 1, 7, 3); g.fillRect(2, n + 3, 3, 4);
    g.fillStyle = '#e8f0ff'; g.fillRect(3, 1, 1, n + 1); g.fillStyle = '#9aa8d8'; g.fillRect(3, n - 1, 1, 2);
    g.fillStyle = '#ffd84a'; g.fillRect(1, n + 2, 5, 1); g.fillStyle = '#a0603a'; g.fillRect(3, n + 3, 1, 3);
    return c;
  }
  function tipImg() { const c = document.createElement('canvas'); c.width = 3; c.height = 13; const g = c.getContext('2d'); g.fillStyle = INK; g.fillRect(0, 0, 3, 13); g.fillStyle = '#e8f0ff'; g.fillRect(1, 1, 1, 11); return c; }
  // a mop: long handle with a shaggy head at the end, pivot at the grip
  function mopImg() {
    const c = document.createElement('canvas'); c.width = 12; c.height = 44; const g = c.getContext('2d');
    g.fillStyle = INK; g.fillRect(4, 8, 3, 36); g.fillStyle = '#c99a50'; g.fillRect(5, 9, 1, 34);
    g.fillStyle = INK; g.fillRect(0, 0, 12, 10); g.fillStyle = '#e8e0d0'; g.fillRect(1, 1, 10, 8); g.fillStyle = '#b8b0a0';
    for (let x = 1; x < 11; x += 2) g.fillRect(x, 1, 1, 8);
    g.fillStyle = '#8a7a5a'; g.fillRect(1, 1, 10, 2);
    return c;
  }

  // ---------------- the skits ----------------
  // each returns { T: { games, shine: [a, b], out, end }, update(dt), draw(g), over?(g) drawn on the logo, off?(i) letter nudge }
  const SCENES = {
    sword(E) {
      const noobF = NOOB.map(r => sprite(r)), noobDazed = sprite(NOOB_DAZED);
      const SWORD = swordImg(16), STUB = swordImg(4), TIP = tipImg();
      const HIT = { x: E.big[4].x + 9, y: E.by + 19 };   // where the blade meets the S
      const T = { run: [0.3, 1.0], windup: [1.0, 1.35], jump: [1.35, 1.62], games: 2.55, shine: [3.3, 3.9], out: 4.75, end: 5.2 };
      const START = { x: 76, y: FLOOR - 18 }, APEX = { x: HIT.x - 26, y: HIT.y - 2 };
      const A_UP = -0.45, A_BACK = -2.3, A_HIT = 0.95;
      const noob = { x: START.x, y: START.y, vx: 0, vy: 0, state: 'pre', bounce: 0 };
      const tip = { on: false, x: 0, y: 0, vx: 0, vy: 0, a: 0, va: 0, stuck: false };
      const trail = []; let hit = false, glinted = false, hitT = 0;
      const angle = t => {
        if (t < T.run[1]) return A_UP + Math.sin(t * 20) * 0.08;
        if (t < T.windup[1]) return A_UP + (A_BACK - A_UP) * ease((t - T.windup[0]) / (T.windup[1] - T.windup[0]));
        if (t < T.jump[1]) { const k = (t - T.jump[0]) / (T.jump[1] - T.jump[0]); return k < 0.45 ? A_BACK : A_BACK + (A_HIT - A_BACK) * Math.pow((k - 0.45) / 0.55, 2); }
        return A_HIT;
      };
      const tipOf = (hx, hy, a, n) => ({ x: hx + Math.sin(a) * (n + 1), y: hy - Math.cos(a) * (n + 1) });
      return {
        T,
        update(dt) {
          const t = E.t;
          if (noob.state === 'pre') {
            if (t < T.run[0]) noob.x = -20;
            else if (t < T.run[1]) noob.x = -20 + (START.x + 20) * ease((t - T.run[0]) / (T.run[1] - T.run[0]));
            else if (t < T.jump[0]) { noob.x = START.x; noob.y = START.y + (t > T.windup[0] ? 2 : 0); }
            else { const k = ease((t - T.jump[0]) / (T.jump[1] - T.jump[0])); noob.x = START.x + (APEX.x - START.x) * k; noob.y = START.y + (APEX.y - START.y) * k; }
            if (!glinted && t > T.windup[0] + 0.2) { glinted = true; const h = tipOf(noob.x + 14, noob.y + 11, A_BACK, 16); E.glint(h.x, h.y); beep(1760, 0.08, 'triangle', 0.04); }
            if (t >= T.jump[0] + (T.jump[1] - T.jump[0]) * 0.45 && t < T.jump[1]) { const h = tipOf(noob.x + 14, noob.y + 11, angle(t), 16); trail.push({ x: h.x, y: h.y, t }); }
            if (t >= T.jump[1] && !hit) {
              hit = true; hitT = t; noob.state = 'fly'; noob.vx = -62; noob.vy = -55;
              E.shake(0.32); E.flash(0.12);
              E.spark(HIT.x, HIT.y, 26, ['#ffffff', '#ffe066', '#ffb84a', '#e8f0ff'], 110);
              Object.assign(tip, { on: true, x: HIT.x, y: HIT.y, vx: 48, vy: -125, a: A_HIT, va: 19 });
              beep(1975, 0.35, 'triangle', 0.08, 1); beep(2637, 0.25, 'sine', 0.05, 1); fizz(0.12, 0.3, 3500); beep(220, 0.18, 'square', 0.05, 0.4, 0.06);
            }
          } else if (noob.state === 'fly') {
            noob.vy += 330 * dt; noob.x += noob.vx * dt; noob.y += noob.vy * dt;
            if (noob.y >= FLOOR - 17) { noob.y = FLOOR - 17; noob.state = 'sit'; noob.bounce = 0; E.dust(noob.x + 8, FLOOR, 8); beep(110, 0.12, 'square', 0.07, 0.5); fizz(0.08, 0.15, 250); }
          } else noob.bounce += dt;
          if (tip.on && !tip.stuck) {
            tip.vy += 380 * dt; tip.x += tip.vx * dt; tip.y += tip.vy * dt; tip.a += tip.va * dt;
            if (tip.vy > 0 && tip.y >= FLOOR - 4) { tip.stuck = true; tip.y = FLOOR + 1; tip.a = Math.PI + 0.35; E.dust(tip.x, FLOOR, 6); beep(330, 0.1, 'square', 0.05, 0.6); }
          }
        },
        off(i) {
          const hk = hit ? E.t - hitT : -1; if (hk < 0 || hk > 0.4) return [0, 0];
          const d = Math.abs(i - 4), k = hk - d * 0.04; if (k <= 0 || k >= 0.3) return [0, 0];
          return [d === 0 ? Math.round(Math.sin(k * 60)) : 0, -Math.round(Math.sin(k / 0.3 * Math.PI) * (d === 0 ? 3 : 2))];
        },
        over(g) { const hk = E.t - hitT; if (hit && hk < 1.2) { g.fillStyle = hk < 0.6 ? '#ffffff' : '#fff3b0'; g.fillRect(HIT.x - 1, HIT.y, 3, 1); } },   // a scuff it can't even keep
        draw(g) {
          const t = E.t;
          if (t < T.jump[1] + 0.12) for (let i = 1; i < trail.length; i++) { const a = trail[i - 1], b = trail[i]; if (t - b.t > 0.1) continue; E.line(a.x, a.y, b.x, b.y, t - b.t < 0.06 ? '#ffffff' : '#8ee0ff'); }
          if (tip.on) E.rot(TIP, tip.x, tip.y, tip.a, 1, tip.stuck ? 1 : 6);
          if (t < T.run[0] - 0.01) return;
          const nx = Math.round(noob.x);
          if (noob.state === 'sit') {
            const ny = Math.round(noob.y) - (noob.bounce < 0.18 ? Math.round(Math.sin(noob.bounce / 0.18 * Math.PI) * 3) : 0);
            g.drawImage(noobDazed, nx, ny);
            E.rot(STUB, nx + 13, ny + 13, 0.7 + Math.sin(t * 2) * 0.05, 3, 6);
            E.dizzy(nx + 8, ny - 1, 9);
          } else {
            const ny = Math.round(noob.y), running = t > T.run[0] && t < T.run[1];
            const img = noobF[running ? Math.floor(t * 12) & 1 : (noob.state === 'fly' || t > T.jump[0]) ? 1 : 0];
            const a = noob.state === 'fly' ? A_HIT + (t - T.jump[1]) * 9 : angle(t), blade = noob.state === 'fly' ? STUB : SWORD;
            if (noob.state === 'fly') E.rot(img, nx + 8, ny + 9, -(t - T.jump[1]) * 7, 8, 9); else g.drawImage(img, nx, ny);
            E.rot(blade, nx + 14, ny + 11, a, 3, blade === SWORD ? 18 : 6);
          }
        },
      };
    },

    mop(E) {
      const bruteF = BRUTE.map(r => sprite(r)), bruteDazed = sprite(BRUTE_DAZED), MOP = mopImg();
      const T = { walk: [0.3, 0.9], scrub: [0.9, 2.35], pop: 2.4, slip: [2.75, 3.08], games: 3.1, shine: [3.6, 4.15], out: 4.9, end: 5.35 };
      // grime: chunky 2px mud speckle over the big word
      const M = document.createElement('canvas'); M.width = SW; M.height = SH; const mg = M.getContext('2d');
      const GX0 = E.bx - 6, GX1 = E.bx + E.bigW + 6, GY0 = E.by - 6, GY1 = E.by + 7 * E.BS + 10;
      const MUD = ['#5a4a3a', '#6b5a40', '#4a4a32', '#7a6a48', '#584838', '#3e4a30'];
      for (let y = GY0; y < GY1; y += 2) for (let x = GX0; x < GX1; x += 2) {
        if (Math.min(x - GX0, GX1 - x, y - GY0, GY1 - y) < 4 && Math.random() < 0.45) continue;
        mg.fillStyle = pick(MUD); mg.fillRect(x, y, 2, 2);
      }
      for (let i = 0; i < 14; i++) { const x = GX0 + 4 + Math.floor(Math.random() * (GX1 - GX0 - 8) / 2) * 2; mg.fillStyle = MUD[i % MUD.length]; mg.fillRect(x, GY1 - 2, 2, 2 + Math.floor(Math.random() * 4) * 2); }
      const scrub = (x, y) => { mg.save(); mg.globalCompositeOperation = 'destination-out'; const qx = Math.round(x / 2) * 2, qy = Math.round(y / 2) * 2; mg.fillRect(qx - 9, qy - 7, 18, 14); mg.fillRect(qx - 7, qy - 9, 14, 18); mg.restore(); };
      const mopAt = t => { const u = (t - T.scrub[0]) / (T.scrub[1] - T.scrub[0]); return { x: GX0 + 6 + u * (GX1 - GX0 - 12), y: (GY0 + GY1) / 2 + Math.sin(u * Math.PI * 9) * ((GY1 - GY0) / 2 - 5) }; };
      const GY = FLOOR - 20, REACH = 34;
      const bx = t => t < T.walk[1] ? -26 + (GX0 - 22 + 26) * ease((t - T.walk[0]) / (T.walk[1] - T.walk[0])) : Math.min(mopAt(Math.min(t, T.scrub[1])).x - 22, GX1 - 40);
      const mop = { free: false, x: 0, y: 0, vx: 0, vy: 0, a: 0, va: 0, down: false };
      let popped = false, slipped = false, landed = false, lastSq = 0, puddle = 0;
      const lieAt = () => { const x = bx(T.slip[0]); return { px: x + 10, py: FLOOR }; };
      return {
        T,
        update(dt) {
          const t = E.t;
          if (t >= T.scrub[0] && t < T.scrub[1]) {
            const m = mopAt(t); scrub(m.x, m.y); puddle = Math.min(1, puddle + dt * 0.8);
            if (Math.random() < 0.6) E.bubble(m.x + rnd(-6, 6), m.y + rnd(-3, 3));
            if (Math.random() < 0.25) E.drip(m.x + rnd(-4, 4), m.y + 6);
            if (t - lastSq > 0.18) { lastSq = t; beep(rnd(300, 420), 0.07, 'triangle', 0.04, 0.8); fizz(0.08, 0.05, 1800); if (Math.random() < 0.5) E.glint(Math.round(m.x - rnd(8, 16)), Math.round(m.y + rnd(-6, 6))); }
          }
          if (!popped && t >= T.pop) {
            popped = true; mg.clearRect(0, 0, SW, SH);
            for (let i = 0; i < 26; i++) E.bubble(rnd(GX0, GX1), rnd(GY0, GY1));
            E.spark(SW / 2, E.by + 10, 24, ['#ffe066', '#ffffff', '#ff9a3d', '#8ee0ff']);
            [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.14, 'square', 0.05, 1, i * 0.06));
          }
          if (!slipped && t >= T.slip[0]) {
            slipped = true; const h = this.hand(t);
            Object.assign(mop, { free: true, x: h.x, y: h.y, vx: 40, vy: -170, a: this.mopA(t), va: 14 });
            for (let i = 0; i < 8; i++) E.bubble(bx(t) + rnd(4, 16), FLOOR - 2);
            beep(900, 0.25, 'sine', 0.06, 0.3); fizz(0.2, 0.08, 2500);
          }
          if (!landed && t >= T.slip[1]) { landed = true; E.shake(0.35); E.dust(lieAt().px - 10, FLOOR, 12); beep(80, 0.25, 'sine', 0.25, 0.5); fizz(0.15, 0.3, 200); }
          if (mop.free && !mop.down) {
            mop.vy += 420 * dt; mop.x += mop.vx * dt; mop.y += mop.vy * dt; mop.a += mop.va * dt;
            if (mop.vy > 0 && mop.y > FLOOR - 9) { mop.down = true; mop.y = FLOOR - 1; mop.a = Math.PI / 2 * 0.98; E.dust(mop.x, FLOOR, 5); beep(520, 0.06, 'square', 0.05, 0.7); beep(440, 0.06, 'square', 0.05, 0.7, 0.08); }
          }
        },
        hand(t) { return { x: bx(t) + 16, y: GY + 12 + (t > T.walk[0] && t < T.scrub[1] ? (Math.floor(t * 8) & 1) : 0) }; },
        mopA(t) {
          const h = this.hand(t);
          if (t >= T.scrub[0] && t < T.scrub[1]) { const m = mopAt(t); return Math.atan2(m.x - h.x, -(m.y - h.y)); }
          if (t < T.scrub[0]) return 0.35 + Math.sin(t * 9) * 0.05;
          return 0.35 + (Math.atan2(GX1 - 6 - h.x, -(GY0 + 10 - h.y)) - 0.35) * (1 - ease((t - T.scrub[1]) / 0.3));
        },
        over(g) { g.drawImage(M, 0, 0); },
        draw(g) {
          const t = E.t; if (t < T.walk[0] - 0.01) return;
          // the suds puddle he's been making
          if (puddle > 0) { const cx = Math.round(bx(Math.min(t, T.slip[0])) + 12), w = Math.round(10 + puddle * 26); g.fillStyle = '#8ad8ff'; g.fillRect(cx - w, FLOOR, w * 2, 1); g.fillStyle = '#bfe6ff'; g.fillRect(cx - w + 3, FLOOR, w * 2 - 6, 1); g.fillStyle = '#ffffff'; if ((t * 4 | 0) & 1) g.fillRect(cx - w + 6, FLOOR, 2, 1); }
          if (t < T.slip[0]) {
            const x = Math.round(bx(t)), walking = t > T.walk[0] && t < T.walk[1], proud = t > T.pop && t < T.slip[0];
            const y = GY - (proud && t - T.pop < 0.2 ? Math.round(Math.sin((t - T.pop) / 0.2 * Math.PI) * 3) : 0);
            const h = this.hand(t), a = this.mopA(t);
            E.rot(MOP, h.x, h.y - (GY - y), a, 5, REACH + 5);
            g.drawImage(bruteF[walking || (t > T.scrub[0] && t < T.scrub[1] && (Math.floor(t * 6) & 1)) ? Math.floor(t * 8) & 1 : 0], x, y);
          } else {
            // whoops: feet fly out, he goes over backwards and lands flat
            const { px, py } = lieAt(), k = Math.min(1, (t - T.slip[0]) / (T.slip[1] - T.slip[0]));
            const a = -Math.PI / 2 * k * k, lift = Math.round(Math.sin(k * Math.PI) * 8), rise = Math.round(7 * k);
            E.rot(landed ? bruteDazed : bruteF[1], px, py - lift - rise, a, 10, 20);
            if (landed) E.dizzy(px - 17, py - 20, 8);
          }
          if (mop.free) E.rot(MOP, mop.x, mop.y, mop.a, 5, mop.down ? 5 : REACH + 5);
        },
      };
    },

    mage(E) {
      const mageImg = sprite(MAGE);
      const T = { walk: [0.3, 0.85], charge: [0.95, 1.45], out: 4.75, end: 5.2, games: 2.65, shine: [3.25, 3.85] };
      const FIRE = 1.45, BOUNCE = 1.7, BACK = 2.0;
      const MX = 46, MY = FLOOR - 20;
      const ORB = { x: MX + 14, y: MY + 1 };
      const TGT = { x: E.big[2].x + 9, y: E.by + 12 };   // the second O
      const BODY = { x: MX + 7, y: MY + 11 };
      const trail = [];
      let fired = false, bounced = false, boomed = false, bounceT = 9;
      const mx = t => t < T.walk[1] ? -20 + (MX + 20) * ease((t - T.walk[0]) / (T.walk[1] - T.walk[0])) : MX;
      const bolt = t => {
        if (t < FIRE || t >= BACK) return null;
        if (t < BOUNCE) { const k = (t - FIRE) / (BOUNCE - FIRE); return { x: ORB.x + (TGT.x - ORB.x) * k, y: ORB.y + (TGT.y - ORB.y) * k - Math.sin(k * Math.PI) * 6 }; }
        const k = (t - BOUNCE) / (BACK - BOUNCE); return { x: TGT.x + (BODY.x - TGT.x) * k, y: TGT.y + (BODY.y - TGT.y) * k + Math.sin(k * Math.PI) * 8 };
      };
      const COLS = ['#ff7af0', '#c86aff', '#8ee0ff', '#ffffff'];
      return {
        T,
        update(dt) {
          const t = E.t;
          if (t > T.charge[0] && t < FIRE) {   // motes swirl into the staff's orb
            const a = rnd(0, Math.PI * 2), r = rnd(10, 16);
            E.parts.push({ x: ORB.x + Math.cos(a) * r, y: ORB.y + Math.sin(a) * r, vx: -Math.cos(a) * r * 3, vy: -Math.sin(a) * r * 3, t: 0, life: 0.3, c: pick(COLS), nograv: 1 });
            if (Math.random() < 0.2) beep(rnd(500, 900) + (t - T.charge[0]) * 800, 0.05, 'triangle', 0.025);
          }
          if (!fired && t >= FIRE) { fired = true; beep(880, 0.25, 'sawtooth', 0.05, 0.4); fizz(0.25, 0.1, 2500); E.spark(ORB.x, ORB.y, 8, COLS, 50); }
          const b = bolt(t); if (b) { trail.push({ x: b.x, y: b.y, t }); if (Math.random() < 0.7) E.parts.push({ x: b.x, y: b.y, vx: rnd(-10, 10), vy: rnd(-10, 10), t: 0, life: 0.35, c: pick(COLS) }); }
          if (!bounced && t >= BOUNCE) { bounced = true; bounceT = t; E.spark(TGT.x, TGT.y, 16, ['#ffffff', '#ffe066', '#ff7af0'], 80); beep(1568, 0.12, 'square', 0.06, 1); beep(2093, 0.15, 'square', 0.05, 1, 0.05); E.shake(0.12); }
          if (!boomed && t >= BACK) {
            boomed = true; E.flash(0.15); E.shake(0.4);
            for (let i = 0; i < 18; i++) { const a = rnd(0, Math.PI * 2), s = rnd(15, 45); E.parts.push({ x: BODY.x, y: BODY.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 10, t: 0, life: rnd(0.6, 1.1), c: pick(['#6a6070', '#8a8090', '#4a4050']), smoke: 1 }); }
            E.spark(BODY.x, BODY.y, 20, COLS, 90); beep(120, 0.4, 'sawtooth', 0.12, 0.3); fizz(0.4, 0.35, 400);
          }
          if (boomed && Math.random() < dt * 6) E.parts.push({ x: MX + 9 + rnd(-1, 1), y: MY, vx: rnd(-3, 3), vy: -14, t: 0, life: 1.0, c: pick(['#6a6070', '#8a8090']), smoke: 1 });   // the hat smoulders
        },
        off(i) {
          const k = E.t - bounceT; if (k < 0 || k > 0.3) return [0, 0];
          const d = Math.abs(i - 2); if (d > 1) return [0, 0];
          return [0, -Math.round(Math.sin(k / 0.3 * Math.PI) * (d === 0 ? 3 : 1))];
        },
        draw(g) {
          const t = E.t; if (t < T.walk[0] - 0.01) return;
          const x = Math.round(mx(t)), walking = t < T.walk[1];
          const y = MY - (walking ? (Math.floor(t * 10) & 1) : 0);
          // staff with its orb
          const sx = x + 14; g.fillStyle = INK; g.fillRect(sx - 1, y + 2, 3, 19); g.fillStyle = '#a0603a'; g.fillRect(sx, y + 3, 1, 17);
          const charge = t > T.charge[0] && t < FIRE ? (t - T.charge[0]) / (FIRE - T.charge[0]) : 0, r = boomed ? 1 : 1 + Math.round(charge * 2);
          g.fillStyle = boomed ? '#4a4050' : '#8ee0ff'; g.fillRect(sx - r, y + 1 - r, r * 2 + 1, r * 2 + 1); if (!boomed) { g.fillStyle = '#ffffff'; g.fillRect(sx, y + 1 - Math.max(0, r - 1), 1, 1); }
          if (!boomed) g.drawImage(mageImg, x, y);
          else { const blink = ((t - BACK) % 1.1) > 0.95 || (t - BACK > 0.5 && t - BACK < 0.62); g.drawImage(blink ? MAGE_BLINK : MAGE_SOOT, x, y); }
          // the bolt and its trail
          for (let i = 1; i < trail.length; i++) { const a = trail[i - 1], b = trail[i]; if (t - b.t > 0.12) continue; E.line(a.x, a.y, b.x, b.y, t - b.t < 0.05 ? '#ffffff' : '#ff7af0'); }
          const b = bolt(t); if (b) { const bx = Math.round(b.x), by = Math.round(b.y); g.fillStyle = INK; g.fillRect(bx - 2, by - 2, 5, 5); g.fillStyle = '#ff7af0'; g.fillRect(bx - 1, by - 2, 3, 5); g.fillRect(bx - 2, by - 1, 5, 3); g.fillStyle = '#ffffff'; g.fillRect(bx - 1, by - 1, 2, 2); }
        },
      };
    },
  };
  const NAMES = Object.keys(SCENES);
  function choose() {
    const forced = (location.search.match(/[?&]splash=(\w+)/) || [])[1];
    if (forced && SCENES[forced]) return forced;
    let last = null; try { last = localStorage.getItem('manatorium.splash'); } catch (e) { }
    const name = pick(NAMES.filter(n => n !== last));
    try { localStorage.setItem('manatorium.splash', name); } catch (e) { }
    return name;
  }

  // ---------------- the stage ----------------
  return function startSplash(done, which) {
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

    const BS = 3, word = 'NOOBSCRUB', adv = 5 * BS + 3;
    const bigW = word.length * adv - 3, bx = Math.round((SW - bigW) / 2), by = 34;
    const big = [...word].map((ch, i) => ({ img: glyph(ch, BS, BIG, '#ffffff'), x: bx + i * adv, y: by }));
    const SS = 2, sub = 'GAMES', sadv = 5 * SS + 4;
    const subW = sub.length * sadv - 4, sx = Math.round((SW - subW) / 2), sy = 66;
    const small = [...sub].map((ch, i) => ({ img: glyph(ch, SS, SMALL, '#ffffff'), x: sx + i * sadv, y: sy }));
    const stars = Array.from({ length: 90 }, () => ({ x: Math.random(), y: Math.random(), p: rnd(0, 6), c: Math.random() < 0.3 ? '#ffe9a8' : '#c8c0ff' }));
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    let shake = 0, shake0 = 1, flash = 0, flash0 = 1;

    const parts = [];
    const E = {
      t: 0, parts, big, small, bx, by, bigW, BS,
      spark(x, y, n, cols, sp = 70) { for (let i = 0; i < n; i++) { const a = rnd(0, Math.PI * 2), s = rnd(20, sp); parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, life: rnd(0.3, 0.7), c: cols[i % cols.length] }); } },
      dust(x, y, n) { for (let i = 0; i < n; i++) parts.push({ x: x + rnd(-4, 4), y, vx: rnd(-25, 25), vy: rnd(-25, -5), t: 0, life: rnd(0.3, 0.6), c: pick(['#8a7ad0', '#b8a8f0', '#ffffff']) }); },
      bubble(x, y) { parts.push({ bub: Math.random() < 0.4 ? 2 : 1, x, y, vx: rnd(-14, 14), vy: rnd(-30, -10), t: 0, life: rnd(0.5, 1.1) }); },
      drip(x, y) { parts.push({ x, y, vx: 0, vy: 10, t: 0, life: 0.6, c: '#6b5a40', heavy: 1 }); },
      glint(x, y) { parts.push({ x, y, vx: 0, vy: 0, t: 0, life: 0.4, c: '#ffffff', glint: 1 }); },
      shake(d) { if (!reduce) { shake = shake0 = d; } },
      flash(d) { flash = flash0 = d; },
      line(x0, y0, x1, y1, col) { x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0; const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy; g.fillStyle = col; for (let n = 0; n < 400; n++) { g.fillRect(x0, y0, 1, 1); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } },
      rot(img, x, y, a, px, py) { g.save(); g.translate(Math.round(x), Math.round(y)); g.rotate(a); g.drawImage(img, -px, -py); g.restore(); },
      dizzy(cx, cy, rx) { for (let i = 0; i < 3; i++) { const a = E.t * 5 + i * Math.PI * 2 / 3, x = Math.round(cx + Math.cos(a) * rx), y = Math.round(cy + Math.sin(a) * 2); g.fillStyle = '#ffe066'; g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); } },
    };
    const name = which && SCENES[which] ? which : choose();
    const scene = SCENES[name](E), T = scene.T;
    el.dataset.skit = name;
    let t = 0, last = performance.now(), finished = false, raf = 0;
    const beeped = new Set();

    const finish = () => {
      if (finished) return; finished = true; cancelAnimationFrame(raf); removeEventListener('resize', fit); removeEventListener('keydown', skip);
      el.style.opacity = '0'; el.style.pointerEvents = 'none'; setTimeout(() => el.remove(), 500); done && done();
    };
    const skip = () => { if (t > 0.15) finish(); };
    el.addEventListener('pointerdown', skip); addEventListener('keydown', skip);

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
      const sk = shake > 0 ? shake / shake0 : 0;
      g.translate(ox + (sk ? Math.round(rnd(-2, 2) * sk) : 0), oy + (sk ? Math.round(rnd(-1, 1)) : 0));

      // logo: NOOBSCRUB (nudged by the skit), GAMES drops in, then a shine sweeps across
      lg.clearRect(0, 0, SW, SH);
      big.forEach((l, i) => { const [dx, dy] = scene.off ? scene.off(i) : [0, 0]; lg.drawImage(l.img, l.x + dx, l.y + dy); });
      small.forEach((l, i) => {
        const k = t - T.games - i * 0.08; if (k < 0) return;
        let y = l.y, sq = 0;
        if (k < 0.22) y = l.y - Math.round((1 - k / 0.22) ** 2 * 60);
        else if (k < 0.34) sq = 1;
        if (k >= 0.22 && !beeped.has(i)) { beeped.add(i); beep(660 + i * 110, 0.06, 'square', 0.05); E.spark(l.x + 6, l.y + 15, 3, ['#b8f0ff', '#ffffff']); }
        if (sq) lg.drawImage(l.img, l.x - 1, y + 2, l.img.width + 2, l.img.height - 2); else lg.drawImage(l.img, l.x, y);
      });
      const shk = (t - T.shine[0]) / (T.shine[1] - T.shine[0]);
      if (shk > 0 && shk < 1) {
        lg.save(); lg.globalCompositeOperation = 'source-atop'; lg.fillStyle = 'rgba(255,255,255,0.85)';
        const cx = bx - 30 + shk * (bigW + 60);
        for (let y = 20; y < 90; y++) { const x = Math.round(cx + (60 - y) * 0.5); lg.fillRect(x, y, 5, 1); lg.fillRect(x + 8, y, 2, 1); }
        lg.restore();
      }
      sg.clearRect(0, 0, SW, SH); sg.globalCompositeOperation = 'source-over'; sg.drawImage(L, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = '#0a0820'; sg.fillRect(0, 0, SW, SH);
      g.globalAlpha = 0.6; g.drawImage(SHD, 2, 3); g.globalAlpha = 1;
      g.drawImage(L, 0, 0);
      if (scene.over) scene.over(g);
      scene.draw(g);

      for (const p of parts) {
        const a = 1 - p.t / p.life, x = Math.round(p.x), y = Math.round(p.y);
        if (p.bub) { g.fillStyle = a > 0.2 ? '#bfe6ff' : '#ffffff'; if (p.bub === 2) { g.fillRect(x - 1, y - 2, 3, 1); g.fillRect(x - 1, y + 2, 3, 1); g.fillRect(x - 2, y - 1, 1, 3); g.fillRect(x + 2, y - 1, 1, 3); g.fillStyle = '#ffffff'; g.fillRect(x - 1, y - 1, 1, 1); } else { g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); } }
        else if (p.glint) { g.fillStyle = p.c; const r = Math.round(Math.sin(p.t / p.life * Math.PI) * 3); g.fillRect(x - r, y, r * 2 + 1, 1); g.fillRect(x, y - r, 1, r * 2 + 1); }
        else if (p.smoke) { g.globalAlpha = Math.min(1, a * 1.5) * 0.85; g.fillStyle = p.c; const r = 1 + Math.round(p.t / p.life * 2); g.fillRect(x - r, y - r, r * 2, r * 2); g.globalAlpha = 1; }
        else { g.globalAlpha = a; g.fillStyle = p.c; g.fillRect(x, y, 1, p.heavy ? 2 : 1); g.globalAlpha = 1; }
      }
      g.restore();
      if (flash > 0) { g.fillStyle = 'rgba(255,255,255,' + (flash / flash0 * 0.55) + ')'; g.fillRect(0, 0, BW, BH); }
      const fade = t < 0.3 ? 1 - t / 0.3 : t > T.out ? Math.min(1, (t - T.out) / (T.end - T.out)) : 0;
      if (fade > 0) { g.fillStyle = 'rgba(21,16,48,' + fade + ')'; g.fillRect(0, 0, BW, BH); }
      // blit, pixels kept square
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(B, Math.floor((cv.width - BW * PS) / 2), Math.floor((cv.height - BH * PS) / 2), BW * PS, BH * PS);
    }

    function step(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt; E.t = t;
      scene.update(dt);
      for (const p of parts) {
        p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.bub) { p.vx *= 0.96; p.x += Math.sin((p.t + p.y) * 8) * 0.2; }
        else if (p.smoke) { p.vy -= 10 * dt; p.vx *= 0.97; }
        else if (p.heavy) p.vy += 120 * dt;
        else if (!p.nograv && !p.glint) p.vy += 60 * dt;
      }
      for (let i = parts.length - 1; i >= 0; i--) if (parts[i].t >= parts[i].life) parts.splice(i, 1);
      shake = Math.max(0, shake - dt); flash = Math.max(0, flash - dt);
      draw();
      if (t >= T.end) return finish();
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(n => { last = n; step(n); });
  };
})();
