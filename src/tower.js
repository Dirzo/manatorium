// ===== End of run: the keep rises into a tower =====
const TOWER = { on: false };
const FLOOR_H = 18; let TW = 240;

function startTower() {
  const run = G.run, N = run.siege - 1;
  const pt = !!run.playtest; // playtest runs earn nothing and set no records
  const ach = pt ? [] : grantAchievements(run, G.meta), achDia = ach.reduce((a, x) => a + x.dia, 0);
  const earned = diamondsForRun(run) + achDia;
  const scoreRec = recordScore(run, G.meta), finalScore = runScore(run);
  const prevBest = G.meta.best; if (!pt) { G.meta.diamonds += earned - achDia; G.meta.best = Math.max(G.meta.best, N); G.meta.totalFloors = (G.meta.totalFloors || 0) + N; }
  G.hasRun = false;
  const mvpId = Object.entries(run.stats.dmgByHero).sort((a, b) => b[1] - a[1])[0];
  const climber = mvpId ? mvpId[0] : (run.roster[0] && run.roster[0].id) || 'brann';
  const bosses = run.stats.bosses;
  Object.assign(TOWER, { ach, scoreRec, finalScore, won: !!run.won, breaches: run.breaches || 0, on: true, t: 0, N, placed: 0, nextT: 1.2, drops: [], parts: [], texts: [], camY: 0, shake: 0, phase: 'intro', climber, climbK: 0, earned, prevBest, bosses,
    stars: Array.from({ length: 140 }, () => ({ x: Math.random() * TW, y: Math.random(), s: Math.random() < 0.2 ? 2 : 1 })), fireworks: [], panelShown: false,
    stats: { kills: run.stats.kills, gold: run.stats.gold, mvp: climber, mvpDmg: mvpId ? mvpId[1] : 0 } });
  save();
  const cv = $('towerCv'); TOWER.cv = cv; TOWER.ctx = cv.getContext('2d');
  TOWER.lo = document.createElement('canvas');
  $('tower').hidden = false; $('towerPanel').innerHTML = ''; $('towerSkip').hidden = false;
  $('towerSkip').onclick = () => { finishTowerInstant(); };
  sizeTower();
}
function sizeTower() {
  const r = TOWER.cv.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1;
  TOWER.cv.width = Math.round(r.width * dpr); TOWER.cv.height = Math.round(r.height * dpr);
  TW = Math.max(200, Math.min(420, Math.round(r.width / 4))); TOWER.LH = Math.max(140, Math.round(TW * r.height / Math.max(1, r.width))); TOWER.lo.width = TW; TOWER.lo.height = TOWER.LH;
}
window.addEventListener('resize', () => { if (TOWER.on) sizeTower(); });

function floorTopY(i) { return -(i + 1) * FLOOR_H; } // world y; ground = 0, castle base occupies 0..-70
const BASE_H = 70;
function isBossFloor(i) { return (i + 1) % 5 === 0; }

function stepTower(dt) {
  const T = TOWER; T.t += dt;
  if (T.phase === 'intro' && T.t > 1.0) { T.phase = 'stack'; T.nextT = T.t + 0.1; if (T.N === 0) T.phase = 'climb'; }
  if (T.phase === 'stack' && T.placed + T.drops.length < T.N && T.t >= T.nextT) {
    const i = T.placed + T.drops.length; T.drops.push({ i, t: 0, dur: 0.16 });
    T.nextT = T.t + Math.max(0.07, 0.55 * Math.pow(0.9, i));
  }
  for (const d of T.drops) { d.t += dt; if (d.t >= d.dur && !d.landed) { d.landed = true; T.placed = Math.max(T.placed, d.i + 1); landFloor(d.i); } }
  T.drops = T.drops.filter(d => !d.landed);
  if (T.phase === 'stack' && T.placed >= T.N && !T.drops.length) { T.phase = 'climb'; T.climbStart = T.t; }
  if (T.phase === 'climb') {
    const dur = Math.min(7, 1.2 + T.N * 0.22); T.climbK = Math.min(1, (T.t - T.climbStart) / dur);
    if (Math.floor(T.t * 10) % 2 === 0 && Math.random() < 0.5) SFX.play('step');
    if (T.climbK >= 1) { T.phase = 'flag'; T.flagT = T.t; SFX.play('flag'); for (let i = 0; i < 6; i++) T.fireworks.push({ x: TW / 2 + rand(-70, 70), y: towerTopWorld() - rand(30, 90), t: -i * 0.25, done: false }); }
  }
  if (T.phase === 'flag' && T.t - T.flagT > 1.4 && !T.panelShown) showTowerPanel();
  // camera
  let target;
  if (T.phase === 'climb') target = climberWorld().y + T.LH * 0.45;
  else if (T.phase === 'flag') target = towerTopWorld() + T.LH * 0.62 - 10;
  else target = Math.min(0, floorTopY(Math.max(0, T.placed - 1)) - BASE_H + T.LH * 0.35);
  target = Math.min(target, 0);
  T.camY += (target - T.camY) * Math.min(1, dt * 5);
  T.shake = Math.max(0, T.shake - dt * 25);
  for (const p of T.parts) { p.t += dt; p.vy += 140 * dt; p.x += p.vx * dt; p.y += p.vy * dt; } T.parts = T.parts.filter(p => p.t < p.life);
  for (const x of T.texts) x.t += dt; T.texts = T.texts.filter(x => x.t < 0.9);
  for (const f of T.fireworks) { f.t += dt; if (f.t > 0 && !f.done) { f.done = true; const col = pick(['#ffcf3a', '#ff5d8f', '#5fd3ff', '#9be05a', '#ffffff']); for (let i = 0; i < 40; i++) { const a = Math.random() * 6.28, s = rand(20, 60); T.parts.push({ x: f.x, y: f.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, life: rand(0.8, 1.4), color: col, g: 30 }); } SFX.play('boom'); } }
  drawTower();
}
function towerTopWorld() { return TOWER.N ? floorTopY(TOWER.N - 1) - BASE_H : -BASE_H; }
function climberWorld() {
  const T = TOWER, totalH = T.N * FLOOR_H, y = -BASE_H + 6 - totalH * T.climbK;
  const fl = Math.floor(T.climbK * Math.max(1, T.N)), within = (T.climbK * Math.max(1, T.N)) % 1;
  const x = TW / 2 + (fl % 2 ? 1 : -1) * (within * 2 - 1) * 22;
  return { x, y, dir: fl % 2 ? 1 : -1 };
}
function landFloor(i) {
  const T = TOWER, boss = isBossFloor(i), y = floorTopY(i) - BASE_H + FLOOR_H;
  T.shake = boss ? 7 : 3;
  for (let k = 0; k < (boss ? 30 : 14); k++) T.parts.push({ x: TW / 2 + rand(-36, 36), y, vx: rand(-60, 60), vy: rand(-50, -10), t: 0, life: rand(0.4, 0.8), color: boss ? pick(['#ffcf3a', '#ffffff', '#c9c4e6']) : pick(['#ffffff', '#c9c4e6', '#e8e4fa']), g: 140 });
  const word = boss ? (T.bosses.find(b => b.siege === i + 1) ? ((i + 1) % 15 === 0 ? 'BOSS!' : 'MINI-BOSS!') : 'BOOM!') : pick(['BOOM', 'BOOM', 'BAM', 'BOOM']);
  T.texts.push({ x: TW / 2 + (i % 2 ? 48 : -48), y: y - 8, s: word, big: boss });
  SFX.play(boss ? 'bossfloor' : 'floor');
}

function drawTowerFloor(g, i, wy) {
  const cx = TW / 2, w = 64 - Math.min(16, Math.floor(i / 10) * 2), x = Math.round(cx - w / 2), y = Math.round(wy);
  const boss = isBossFloor(i), stone = boss ? '#e8dcb0' : i % 2 ? '#d4cff0' : '#cbc5ea', mortar = boss ? '#c9a35a' : '#aea7d8';
  g.fillStyle = OUTLINE; g.fillRect(x - 1, y, w + 2, FLOOR_H);
  g.fillStyle = stone; g.fillRect(x, y, w, FLOOR_H - 1);
  g.fillStyle = mortar; for (let yy = y + 4; yy < y + FLOOR_H; yy += 5) { g.fillRect(x, yy, w, 1); for (let xx = x + ((yy / 5) % 2 ? 4 : 0); xx < x + w; xx += 9) g.fillRect(xx, yy - 4, 1, 4); }
  g.fillStyle = '#8a83b8'; g.fillRect(x, y, 2, FLOOR_H - 1);
  // windows
  g.fillStyle = OUTLINE; g.fillRect(cx - 12, y + 5, 5, 8); g.fillRect(cx + 7, y + 5, 5, 8);
  g.fillStyle = '#ffd84a'; g.fillRect(cx - 11, y + 6, 3, 6); g.fillRect(cx + 8, y + 6, 3, 6);
  if (boss) { g.fillStyle = '#ffcf3a'; g.fillRect(x, y, w, 2); g.fillRect(x, y + FLOOR_H - 3, w, 2); const ic = iconCanvas((i + 1) % 15 === 0 ? 'skull' : 'crown', 1); g.drawImage(ic, cx - 5, y + 4); }
  // floor number
  TOWER.labels.push({ i, x: x + w + 12, y: y + 9, boss });
}

function drawTower() {
  const T = TOWER, g = T.lo.getContext('2d'), LH = T.LH; T.labels = [];
  g.imageSmoothingEnabled = false;
  const cam = T.camY; // world y at screen bottom is cam
  const toS = wy => LH - 10 + (wy - cam);
  const height = -cam; // how high we are looking
  // sky: day -> sunset -> night
  const k = Math.min(1, height / 320), k2 = Math.max(0, Math.min(1, (height - 320) / 520));
  const top = k2 > 0 ? mix('#6a4ad0', '#0c1028', k2) : mix('#6ec6ff', '#6a4ad0', k), bot = k2 > 0 ? mix('#ffa88a', '#3a2a6a', k2) : mix('#d4f0ff', '#ffa88a', k);
  for (let i = 0; i < 10; i++) { g.fillStyle = mix(top, bot, i / 9); g.fillRect(0, Math.floor(i * LH / 10), TW, Math.ceil(LH / 10) + 1); }
  if (k2 > 0.1) for (const s of T.stars) { g.globalAlpha = Math.min(1, k2 * 1.4) * (0.5 + 0.5 * Math.sin(T.t * 3 + s.x)); g.fillStyle = '#ffffff'; g.fillRect(Math.floor(s.x), Math.floor(s.y * LH), s.s, s.s); }
  g.globalAlpha = 1;
  // clouds at fixed world heights
  for (let i = 0; i < 30; i++) { const wy = -120 - i * 70, sy = toS(wy) + 0; if (sy < -20 || sy > LH + 20) continue; const x = ((i * 97 + T.t * (6 + i % 4)) % (TW + 80)) - 40; g.fillStyle = k2 > 0.5 ? '#3a3a7a' : '#ffffff'; g.globalAlpha = 0.85; g.fillRect(Math.round(x), Math.round(sy), 30, 4); g.fillRect(Math.round(x + 6), Math.round(sy - 3), 16, 3); g.globalAlpha = 1; }
  const sh = T.shake > 0.2 ? Math.round(rand(-T.shake, T.shake)) : 0;
  g.save(); g.translate(sh, 0);
  // ground
  const gy = toS(0);
  if (gy < LH + 5) { g.fillStyle = '#74d35a'; g.fillRect(0, gy, TW, LH - gy + 10); g.fillStyle = '#86de66'; g.fillRect(0, gy, TW, 2);
    for (let x = 0; x < TW; x += 3) if (hash(x, 3) < 0.3) { g.fillStyle = '#5cbf45'; g.fillRect(x, gy + 2 + Math.floor(hash(x, 5) * 10), 1, 2); }
    // little horde silhouettes going home
    for (let i = 0; i < 8; i++) { g.fillStyle = 'rgba(26,18,48,0.5)'; const x = TW - 30 + i * 6 + Math.sin(T.t * 4 + i) * 1; g.fillRect(Math.round(x), gy + 6 + (i % 3), 3, 4); } }
  // castle base
  const by = toS(-BASE_H), cx = TW / 2;
  g.fillStyle = OUTLINE; g.fillRect(cx - 47, by - 1, 94, BASE_H + 2);
  g.fillStyle = '#d4cff0'; g.fillRect(cx - 46, by, 92, BASE_H);
  g.fillStyle = '#aea7d8'; for (let yy = by + 5; yy < by + BASE_H; yy += 5) { g.fillRect(cx - 46, yy, 92, 1); for (let xx = cx - 46 + ((yy / 5) % 2 ? 4 : 0); xx < cx + 46; xx += 9) g.fillRect(xx, yy - 4, 1, 4); }
  g.fillStyle = OUTLINE; g.fillRect(cx - 9, by + BASE_H - 26, 18, 26); g.fillStyle = '#3a2a4a'; g.fillRect(cx - 8, by + BASE_H - 25, 16, 25);
  g.fillStyle = '#ff5d8f'; g.fillRect(cx - 38, by + 10, 10, 18); g.fillRect(cx + 28, by + 10, 10, 18); g.fillStyle = '#ffd84a'; g.fillRect(cx - 35, by + 15, 4, 4); g.fillRect(cx + 31, by + 15, 4, 4);
  for (let x = cx - 46; x < cx + 42; x += 8) { g.fillStyle = OUTLINE; g.fillRect(x - 1, by - 6, 7, 6); g.fillStyle = '#d4cff0'; g.fillRect(x, by - 5, 5, 5); }
  // placed floors
  for (let i = 0; i < T.placed; i++) { const sy = toS(floorTopY(i) - BASE_H); if (sy > LH + 20 || sy < -30) continue; drawTowerFloor(g, i, sy); }
  // dropping floors
  for (const d of T.drops) { const k3 = Math.min(1, d.t / d.dur), fy = toS(floorTopY(d.i) - BASE_H), sy = fy - (1 - k3 * k3) * (LH * 0.8); drawTowerFloor(g, d.i, sy); }
  // roof on top
  if (T.placed >= T.N && !T.drops.length) {
    const ty = toS(towerTopWorld()), w = T.N ? 64 - Math.min(16, Math.floor((T.N - 1) / 10) * 2) : 92;
    for (let i = 0; i < 26; i++) { const ww = Math.round((w + 8) * (1 - i / 26)); g.fillStyle = OUTLINE; g.fillRect(cx - ww / 2 - 1, ty - i - 1, ww + 2, 1); g.fillStyle = i % 4 === 0 ? '#2f4fb8' : '#4a6ee0'; g.fillRect(cx - ww / 2, ty - i - 1, ww, 1); }
    if (T.phase === 'flag') { const ft = Math.min(1, (T.t - T.flagT) / 0.4); g.fillStyle = '#5a3a1a'; g.fillRect(cx, ty - 26 - 18 * ft, 1, 18 * ft); g.fillStyle = '#ff5d8f'; const wav = Math.round(Math.sin(T.t * 8)); g.fillRect(cx + 1, ty - 26 - 18 * ft, 9, 5 + wav); g.fillStyle = '#ffd84a'; g.fillRect(cx + 4, ty - 25 - 18 * ft, 2, 2); }
  }
  // climber
  if (T.phase === 'climb' || T.phase === 'flag') {
    const c = T.phase === 'flag' ? { x: cx - 8, y: towerTopWorld() - 24, dir: 1 } : climberWorld();
    const S = SPR['h:' + T.climber]; if (S) { const fr = T.phase === 'flag' ? (Math.floor(T.t * 3) % 2 ? 'atk' : 'idle0') : (Math.floor(T.t * 10) % 2 ? 'walk0' : 'walk1'); const sy = toS(c.y);
      g.save(); if (c.dir < 0 && T.phase === 'climb') { g.translate(Math.round(c.x), 0); g.scale(-1, 1); const im = S.frames[fr], D = im.hd || 1; g.drawImage(im, -10, Math.round(sy) - 19, im.width / D, im.height / D); } else { const im = S.frames[fr], D = im.hd || 1; g.drawImage(im, Math.round(c.x) - 10, Math.round(sy) - 19, im.width / D, im.height / D); } g.restore(); }
  }
  // particles + texts
  for (const p of T.parts) { g.globalAlpha = 1 - p.t / p.life; g.fillStyle = p.color; g.fillRect(Math.round(p.x), Math.round(toS(p.y)), 1, 1); }
  g.globalAlpha = 1; g.restore();
  // upscale
  const ctx = T.ctx, sc = T.cv.width / TW; ctx.imageSmoothingEnabled = false; ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(T.lo, 0, 0, TW, LH, 0, 0, T.cv.width, LH * sc);
  ctx.textAlign = 'center'; ctx.lineJoin = 'round';
  ctx.font = `600 ${6 * sc}px "Cinzel", "Atkinson Hyperlegible", sans-serif`;
  for (const l of T.labels) { const px = (l.x + sh) * sc, py = l.y * sc; ctx.fillStyle = 'rgba(15,20,48,0.65)'; ctx.fillRect(px - 9 * sc, py - 5 * sc, 18 * sc, 10 * sc); ctx.fillStyle = l.boss ? '#ffcf3a' : '#ffffff'; ctx.fillText(String(l.i + 1), px, py + 2.2 * sc); }
  for (const x of T.texts) { const a = 1 - x.t / 0.9, s = (x.big ? 14 : 10) * sc * (x.t < 0.08 ? 1.5 : 1); ctx.globalAlpha = a; ctx.font = `700 ${s / 1}px "Cinzel", "Atkinson Hyperlegible", sans-serif`; ctx.strokeStyle = OUTLINE; ctx.lineWidth = sc * 2; const px = x.x * sc, py = toS(x.y) * sc - x.t * 20 * sc; ctx.strokeText(x.s, px, py); ctx.fillStyle = x.big ? '#ffcf3a' : '#ffffff'; ctx.fillText(x.s, px, py); }
  ctx.globalAlpha = 1;
  // counter
  const shown = T.phase === 'intro' ? 0 : T.placed;
  ctx.font = `700 ${18 * sc}px "Cinzel", "Atkinson Hyperlegible", sans-serif`; ctx.strokeStyle = OUTLINE; ctx.lineWidth = sc * 3; ctx.fillStyle = '#ffcf3a';
  ctx.strokeText(`${shown} ${shown === 1 ? 'FLOOR' : 'FLOORS'}`, T.cv.width / 2, 26 * sc); ctx.fillText(`${shown} ${shown === 1 ? 'FLOOR' : 'FLOORS'}`, T.cv.width / 2, 26 * sc);
  ctx.font = `500 ${7 * sc}px "Cinzel", "Atkinson Hyperlegible", sans-serif`; ctx.fillStyle = '#ffffff'; ctx.lineWidth = sc * 2;
  const sub = T.phase === 'intro' ? 'The keep has fallen. Now it rises.' : T.phase === 'stack' ? 'One floor for every siege you held' : T.phase === 'climb' ? `${HERO_BY_ID[T.climber] ? HERO_BY_ID[T.climber].name : 'Your hero'} climbs to the top` : (T.N > T.prevBest && T.N > 0 ? 'A new record!' : 'The view from the top');
  ctx.strokeText(sub, T.cv.width / 2, 38 * sc); ctx.fillText(sub, T.cv.width / 2, 38 * sc);
}

function finishTowerInstant() {
  const T = TOWER; T.drops = []; T.placed = T.N; T.phase = 'flag'; T.flagT = T.t - 1.5; T.climbK = 1; if (!T.panelShown) showTowerPanel();
}

function showTowerPanel() {
  const T = TOWER; T.panelShown = true; $('towerSkip').hidden = true;
  const mvp = HERO_BY_ID[T.stats.mvp];
  $('towerPanel').innerHTML = `<div class="sheet" style="animation:sheetIn .4s">
    <h2>${G.run && G.run.won ? 'Victory! The Eternal Goose is defeated' : `${T.N} ${T.N === 1 ? 'floor' : 'floors'} tall`}</h2>
    <p class="lede">${T.N > T.prevBest && T.N > 0 ? `Your highest keep yet, beating ${T.prevBest}.` : `Your record is ${G.meta.best} floors.`}</p>
    ${scoreBoardHTML(T)}
    <div class="tiles"><div class="tile"><small>Bosses slain</small><span>${T.bosses.length}</span></div><div class="tile"><small>Foes slain</small><span>${fmt(T.stats.kills)}</span></div><div class="tile"><small>Gold earned</small><span style="color:var(--gold)">${fmt(T.stats.gold)}</span></div></div>
    ${T.ach.length ? `<div class="achlist"><span class="eyebrow">New achievements</span>${T.ach.map(a => `<div class="ach got"><b>${esc(a.name)}</b><span>${esc(a.desc)}</span></div>`).join('')}</div>` : `<p class="note">No new achievements this run. There are ${ACHIEVEMENTS.filter(a => !G.meta.ach[a.id]).length} left to find in the Keep Ledger.</p>`}
    ${mvp ? `<p class="note">Hero of the run: <b style="color:var(--gold)">${esc(mvp.name)}</b> with ${fmt(T.stats.mvpDmg)} damage.</p>` : ''}
    <div class="row" style="justify-content:flex-end"><button class="btn" id="twLedger">Keep Ledger</button><button class="btn primary" id="twAgain">Climb again</button></div></div>`;
  let n = 0; const tick = () => { n = Math.min(T.earned, n + Math.max(1, Math.ceil(T.earned / 20))); const el = $('diaCount'); if (el) el.textContent = '+' + n; if (n < T.earned) setTimeout(tick, 50); }; tick();
  $('twLedger').onclick = () => { TOWER.on = false; $('tower').hidden = true; G.run = newRun(G.meta); G.hasRun = false; G.phase = 'title'; G.B = null; rebuildPrepUnits(); save(); showTitle(); };
  $('twAgain').onclick = () => { TOWER.on = false; $('tower').hidden = true; G.paused = false; startRun(true); };
}

// the run's score and the best-score board (SCORE in state.js)
function scoreBoardHTML(T) {
  const b = G.meta.scores || [], rk = T.scoreRec && T.scoreRec.rank, bonus = T.won ? SCORE.win + SCORE.crackLeft * Math.max(0, BREACH.max - T.breaches) : 0;
  const when = t => { const d = new Date(t); return isNaN(d) ? '' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); };
  return `<div class="scorecard"><div class="scoretop"><small>Score</small><b class="num">${fmt(T.finalScore)}</b>${rk === 1 && b.length > 1 ? '<span class="newbest">New best!</span>' : rk ? `<span class="rank">#${rk} on your board</span>` : ''}</div>
    ${bonus ? `<small class="note">Includes ${fmt(SCORE.win)} for beating the Goose${T.breaches < BREACH.max ? ` and ${fmt(bonus - SCORE.win)} for ${BREACH.max - T.breaches} uncracked ${BREACH.max - T.breaches === 1 ? 'wall' : 'walls'}` : ''}.</small>` : ''}
    ${b.length ? `<ol class="scoreboard">${b.map((e, i) => `<li class="${T.scoreRec && T.scoreRec.entry === e ? 'me' : ''}"><span>${i + 1}</span><b class="num">${fmt(e.score)}</b><small>${e.won ? 'Goose beaten' : 'Siege ' + e.siege}</small><small>${when(e.at)}</small></li>`).join('')}</ol>` : ''}</div>`;
}
