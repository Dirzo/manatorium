// ===== The herald (Cam 2026-10-23): before the first shop and whenever a new horde arrives, a card names the four
// elements in season and shows each one's fighting style in a little looping battle.
const HERALD_ORD = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'];
function heraldHTML(run) {
  const season = runSeason(run), fe = stackElements(run), fi = factionIndex(run.siege), F = FACTIONS[fi], fresh = run.seasonNew || [];
  let h = `<span class="eyebrow">Sieges ${fi * 5 + 1} to ${fi * 5 + 5} · ${esc(F.name)}</span><h2 class="sp">The ${HERALD_ORD[fi] || 'Next'} Horde approaches</h2>
    <p class="lede">${run.siege === 1 ? 'Four elements are in season. Most legends in the shop carry one of them. Every element is a way of fighting.' : 'The season turns. Two elements stay, two new ones arrive in the shop.'} Two champions of an element make its style stronger, four upgrade it, six wake its castle.</p><div class="hrld">`;
  season.forEach((e, i) => { const E = ELEMENTS[e], I = STYLE_INFO[e], n = fe[e] || 0, t = elTier(n);
    h += `<div class="hlcard" style="--ec:${E.col};--ec2:${E.col2};animation-delay:${i * 0.08}s"><div class="hhd"><b>${E.name}</b><span>${esc(I.role)}${fresh.includes(e) ? ' <i class="newb">new</i>' : ''}</span></div>
      <canvas class="hdemo" data-el="${e}" width="160" height="72"></canvas><p><b>${esc(I.style)}.</b> ${esc(I.how)}</p>
      <div class="htiers">${I.tiers.map((s, k) => `<div class="${t === k ? 'on' : n >= EL_STACK.at[k] ? 'past' : ''}"><b>${EL_STACK.at[k]}</b><span>${esc(s)}${k === 2 ? ' Castle wakes.' : ''}</span></div>`).join('')}</div>
      <small>${n ? `You field ${n}` : 'None on your field yet'}</small></div>`; });
  return h + `</div><div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn" id="heraldGo">${run.siege === 1 ? 'Open the shop' : 'To the keep'}</button></div>`;
}

// ----- the looping demos: castle on the left, three lanes, the horde from the right -----
const HD = { W: 160, H: 72, LY: [16, 36, 56], CX: 12 };
function heraldDemos(root) {
  const views = [...root.querySelectorAll('canvas.hdemo')].map(c => [c.getContext('2d'), c.dataset.el, c]);
  if (!views.length) return;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches, t0 = performance.now();
  const frame = ms => { if (!views[0][2].isConnected) return; const t = still ? 1.3 : (ms - t0) / 1000 + 1;
    for (const [g, e] of views) { hdField(g); (HDEMO[e] || (() => {}))(g, t, ELEMENTS[e].col); }
    if (!still) requestAnimationFrame(frame); };
  frame(t0);
}
const hrnd = s => { const x = Math.sin(s * 99.13) * 43758.5; return x - Math.floor(x); };
function hpx(g, x, y, s, c) { g.fillStyle = c; g.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), s, s); }
function hhero(g, x, y, c, s) { s = s || 6; hpx(g, x, y, s, OUTLINE); hpx(g, x, y, s - 2, c); hpx(g, x + 1, y - 1, 1, OUTLINE); }
function hfoe(g, x, y, c, s) { s = s || 5; hpx(g, x, y, s, '#2a0a10'); hpx(g, x, y, s - 2, c || '#e0404a'); }
function hdField(g) { const { W, H, LY, CX } = HD; g.fillStyle = '#0d0b14'; g.fillRect(0, 0, W, H); g.fillStyle = '#1a2440'; for (const y of LY) g.fillRect(CX, y - 8, W, 16);
  g.fillStyle = '#4a4560'; g.fillRect(0, 4, CX, H - 8); g.fillStyle = '#6a6488'; for (let y = 4; y < H - 4; y += 6) g.fillRect(CX - 3, y, 3, 3); }
function hline(g, a, b, c) { g.strokeStyle = c; g.lineWidth = 1; g.beginPath(); g.moveTo(a[0] + .5, a[1] + .5); g.lineTo(b[0] + .5, b[1] + .5); g.stroke(); }
function hring(g, x, y, r, c, a) { g.globalAlpha = a == null ? 1 : Math.max(0, a); g.strokeStyle = c; g.beginPath(); g.arc(x, y, Math.max(0.5, r), 0, 7); g.stroke(); g.globalAlpha = 1; }
const hl = (a, b, k) => a + (b - a) * k, hc = (v, a, b) => Math.max(a, Math.min(b, v)), he = k => k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
function hmarch(lane, n, front, seed) { const out = []; for (let i = 0; i < n; i++) out.push([front + i * 9, HD.LY[lane] + (hrnd(seed + i) * 6 - 3)]); return out; }
const HDEMO = {
  dark(g, t, c) { const P = 3.2, k = (t % P) / P, h = [44, 36], v = [96, 36];
    // small foes walk in, then flee in dread when the curse pulses
    const fl = k > .45 ? he(hc((k - .45) / .3, 0, 1)) * 40 : 0;
    [[84, 20], [88, 52], [110, 26], [112, 48]].forEach((p, i) => { const x = p[0] + (k > .45 ? fl + i * 2 : 0); hfoe(g, x, p[1]); if (k > .45 && k < .8 && (t * 8) % 2 < 1) hpx(g, x - 4, p[1] - 5, 1, '#d8c0ff'); });
    hfoe(g, v[0], v[1], '#e0404a', 9);
    if (k > .08) { const n = 16; for (let i = 0; i <= n; i++) { const q = i / n; hpx(g, hl(h[0], v[0], q), hl(h[1] - 2, v[1] - 2, q) + Math.sin(q * Math.PI) * Math.sin(t * 9 + i) * 2, 1, i % 2 ? '#2a1a4a' : c); }
      for (let j = 0; j < 3; j++) { const q = 1 - ((t * 1.6 + j / 3) % 1); hpx(g, hl(h[0], v[0], q), hl(h[1] - 2, v[1] - 2, q), 2, '#ff5a7a'); }
      const b = Math.floor(t * 4) % 2; hpx(g, v[0], v[1] - 10 - b, 5, OUTLINE); hpx(g, v[0], v[1] - 10 - b, 3, '#b48aff'); }
    if (k > .4 && k < .6) hring(g, v[0], v[1], 6 + (k - .4) * 120, c, 1 - (k - .4) * 5);
    hhero(g, h[0], h[1], c); if ((t * 1.6) % 1 > .9) hpx(g, h[0], h[1] - 6, 2, '#9f9'); },
  light(g, t, c) { const al = [52, 36], k = (t * 1.2) % 1, hp = .35 + .6 * ((t / 4) % 1); hhero(g, al[0], al[1], '#d0d0d0');
    g.fillStyle = '#300'; g.fillRect(al[0] - 5, al[1] - 8, 10, 2); g.fillStyle = '#5f5'; g.fillRect(al[0] - 5, al[1] - 8, 10 * hp, 2);
    hhero(g, al[0] - 10, al[1] + 4, c); hmarch(1, 3, 64, 3).forEach(p => hfoe(g, p[0], p[1]));
    if (k < .3) { hline(g, [al[0] - 10, al[1] + 4], [64, 36], c); hpx(g, al[0], al[1] - 2, 2, '#9f9'); }
    if (Math.floor(t * 1.2) % 4 === 3) hring(g, al[0] - 10, al[1] + 4, 4 + k * 22, c, 1 - k); },
  lightning(g, t, c) { const f = [[70, 18], [96, 38], [80, 56], [118, 22], [128, 52], [104, 60]]; f.forEach(p => hfoe(g, p[0], p[1]));
    const P = .45, i = Math.floor(t / P), k = (t % P) / P, a = f[i % 6], b = f[(i + 2) % 6];
    if (k < .25) { const x = hl(a[0], b[0], k * 4), y = hl(a[1], b[1], k * 4); hline(g, a, [x, y], c); hhero(g, x, y, c); }
    else { hhero(g, b[0] - 6, b[1], c); if (k < .45) { hpx(g, b[0], b[1] - 5, 3, '#fff'); hline(g, b, f[(i + 1) % 6], c); } } },
  fire(g, t, c) { const k = (t % 4) / 4, x = hl(30, 120, he(hc(k * 1.4, 0, 1))), y = 36;
    for (let i = 0; i < 6; i++) { const fx = 100 + (i % 3) * 8, fy = 30 + Math.floor(i / 3) * 10; hfoe(g, fx, fy, x > fx - 10 && k > .2 ? '#ff9a3a' : '#e0404a'); }
    for (let tx = 30; tx < x; tx += 4) { const fl = hrnd(tx + Math.floor(t * 8)); hpx(g, tx, y + 3 + fl * 2, 2, fl > .5 ? '#ffd23a' : c); }
    hhero(g, x, y, c); if (k > .6) for (let i = 0; i < 5; i++) hpx(g, 104 + hrnd(i + Math.floor(t * 6)) * 20, 26 + hrnd(i * 3 + Math.floor(t * 6)) * 20, 2, '#ffd23a'); },
  water(g, t, c) { const P = 1.6, k = (t % P) / P; hhero(g, 50, 36, c);
    const push = k < .1 ? 0 : 18 * Math.sin(Math.min(1, (k - .1) * 3) * Math.PI / 2) * (1 - hc((k - .5) * 2, 0, 1));
    hfoe(g, 70 + push, 36); hfoe(g, 84 + Math.max(0, push - 10), 37); hfoe(g, 100, 34);
    if (k < .12) for (let i = 0; i < 4; i++) hpx(g, 72 + i * 3, 30 + i * 3, 2, c);
    if (k > .2 && k < .35) hpx(g, 84, 31, 3, '#fff');
    if (Math.floor(t / P) % 3 === 2) { g.globalAlpha = .5 * (1 - k); g.fillStyle = c; g.fillRect(54 + k * 90, 28, 4, 16); g.globalAlpha = 1; } },
  ice(g, t, c) { const hx = 60, hy = 36; g.globalAlpha = .18; g.fillStyle = c; g.beginPath(); g.arc(hx, hy, 22, 0, 7); g.fill(); g.globalAlpha = 1; hring(g, hx, hy, 22, c, .7);
    for (let i = 0; i < 3; i++) { const s = 40 + i * 25, x = HD.W + 4 - (t * s * .6 + i * 70) % 170, inR = Math.abs(x - hx) < 22, y = HD.LY[[1, 0, 1][i]] + (i === 1 ? 14 : 0);
      hfoe(g, inR ? hx + 22 - ((t * 8 + i * 13) % 40) : x, y, inR ? '#9fd8ff' : i === 2 ? '#ffe04a' : '#e0404a'); }
    hhero(g, hx, hy, c); },
  nature(g, t, c) { const hx = 48, hy = 36, P = 2.4, k = (t % P) / P; hhero(g, hx, hy, c); for (let i = 0; i < 3; i++) hpx(g, hx - 4 + i * 4, hy + 5, 2, '#2f8a3a');
    const tx = 120, ty = [18, 54][Math.floor(t / P) % 2]; let fx = tx, fy = ty;
    if (k > .2) { const kk = hc((k - .35) / .5, 0, 1); fx = hl(tx, hx + 8, he(kk)); fy = hl(ty, hy, he(kk)); hline(g, [hx, hy], [fx, fy], '#2f8a3a'); }
    else if (k > .05) { const kk = (k - .05) / .15; hline(g, [hx, hy], [hl(hx, tx, kk), hl(hy, ty, kk)], '#6fdc5a'); }
    hfoe(g, fx, fy); hfoe(g, 130, 36); },
  void(g, t, c) { const k = (t % 3) / 3; hmarch(1, 3, 70, 7).forEach(p => hfoe(g, p[0], p[1])); hhero(g, 52, 30, c); hhero(g, 56, 44, '#d0d0d0'); hhero(g, 44, 40, '#d0d0d0');
    let x = 134, y = 16;
    if (k > .25 && k < .5) { const kk = (k - .25) / .25; x = hl(134, 62, he(kk)); y = hl(16, 38, he(kk)); for (let i = 0; i < 4; i++) hpx(g, hl(52, x, i / 4), hl(30, y, i / 4), 2, c); }
    else if (k >= .5) { x = 62; y = 38; if (k < .7) hring(g, x, y, 5 + (k - .5) * 30, c); }
    if (k > .1 && k < .25) hring(g, 134, 16, 6, c); hfoe(g, x, y, '#c050ff'); },
  salty(g, t, c) { const k = (t % 5) / 5, boss = [100, 36]; hfoe(g, boss[0], boss[1], '#e0404a', 11); const gob = [72, 56]; hfoe(g, gob[0], gob[1], '#7fbf3a'); hmarch(0, 2, 80, 9).forEach(p => hfoe(g, p[0], p[1]));
    if (k < .08) hline(g, gob, [60, 30], '#fff'); const hx = hl(60, boss[0] - 9, hc(k * 4, 0, 1)); hhero(g, hx, 30 + (k > .25 ? 6 : 0), c);
    for (let i = 0; i < Math.min(8, Math.floor(k * 10)); i++) hpx(g, boss[0] - 8 + i * 2, boss[1] - 10, 1, '#ff4a4a');
    if (k > .25 && (t * 3) % 1 < .3) hpx(g, boss[0] - 4, boss[1] - 3, 3, '#fff'); },
  sweet(g, t, c) { const bx = hl(50, 92, (Math.sin(t * .8) + 1) / 2), by = 36 + Math.sin(t * 1.3) * 10; hhero(g, bx, by, '#ffd84a', 8); hhero(g, bx - 10, by + 6, c);
    for (let i = 0; i < 3; i++) { const a = t * 4 + i * 2.1; hpx(g, bx + Math.cos(a) * 8, by + Math.sin(a) * 8, 1, c); }
    const ft = [bx + 18, by]; hfoe(g, ft[0], ft[1], (t % 2) < 1 ? '#e0404a' : '#ff9ad8'); hfoe(g, 130, 20); hfoe(g, 128, 56); if ((t * 2) % 1 < .3) hline(g, [bx - 10, by + 6], ft, c); },
  meat(g, t, c) { const k = (t % 4) / 4, al = [44, 22]; hhero(g, al[0], al[1], '#d0d0d0'); const f = [[66, 18], [72, 26], [64, 30]]; f.forEach(p => hfoe(g, p[0], p[1]));
    const sz = 7 + Math.round(4 * k), m = he(hc(k * 4, 0, 1)), x = hl(46, 58, m), y = hl(54, 24, m); hhero(g, x, y, c, sz);
    if (k > .25 && k < .45) hring(g, x, y, 6 + (k - .25) * 80, c, 1 - (k - .25) * 5); if (k > .3) for (const p of f) if ((t * 3 + p[0]) % 1 < .25) hline(g, p, [x + 2, y], '#e0404a'); },
  treat(g, t, c) { const k = (t % 4) / 4; hhero(g, 44, 50, c); hhero(g, 58, 22, '#d0d0d0'); hhero(g, 52, 28, '#ff6a3d'); const sn = [96, 30];
    if (k > .05) { const kk = hc((k - .05) * 6, 0, 1); hpx(g, hl(44, sn[0], kk), hl(50, sn[1], kk) - Math.sin(kk * Math.PI) * 14, 3, '#ffb02e'); }
    for (let i = 0; i < 4; i++) { const kk = hc((k - .3) * 2.5, 0, 1); hfoe(g, hl(118 + i * 6, sn[0] + 4 + (i % 2) * 5, kk), hl(14 + i * 14, sn[1] + (i - 1.5) * 4, kk), i === 0 ? '#ffd84a' : '#e0404a'); } },
};
