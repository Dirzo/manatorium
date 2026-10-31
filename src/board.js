// ===== Board-first desktop layout (Cam 2026-10-31: "a brand new UI that shows off the board and characters more, built around the board like TFT") =====
// The arena fills the screen. Thin plates float over its edges: the siege tracker on top, team traits down the left,
// scouts on the top right, and one bottom bar that holds the facilities, gold, the shop, the bench and the siege buttons.
// Big panels (the champion drawer, scout report, facilities) stay one click away instead of always open.
// Desktop only: phone layouts (html.m, src/mobile.js) keep their own arrangement. Loaded after mobile.js.
const BOARD = {
  on: false, shopOpen: true, lastPhase: null, card: null, team: false, intel: false, homes: new Map(), keys: {},
  wanted() { return MOB.boardPhone() || (!MOB.wanted() && innerWidth >= 900); },
  phone() { return document.documentElement.classList.contains('bphone'); },
  build() {
    if ($('boardBar')) return;
    const mk = (id, cls, html = '') => { const d = document.createElement('div'); d.id = id; if (cls) d.className = cls; d.innerHTML = html; return d; };
    const app = $('app');
    app.appendChild(mk('bTop', 'bplate btop'));
    app.appendChild(mk('bTL', 'btl'));
    app.appendChild(mk('bTR', 'btr', `<div id="scoutRow" class="scoutrow" role="button" tabindex="0" aria-label="Scout report"></div><div class="bbtns" id="bBtns">
      <button class="ibtn" id="bIntelBtn" aria-pressed="false" data-tip="txt:Scout report|Who is coming, the horde's attack plan and its tricks. (S)">${pxi('ui-scout')}</button>
      <button class="ibtn" id="bTeamBtn" aria-pressed="false" data-tip="txt:Team and battle stats|Every champion, team bonuses spelled out, element combos and the battle chart. (C)">${pxi('ui-team')}</button></div>`));
    app.appendChild(mk('traitRail', 'traitrail'));
    app.appendChild(mk('boardBar', 'boardbar', `<div class="bb-fac" id="bFac"></div>
      <div class="bb-econ" id="bEcon"><div class="bb-gold" id="bGold"></div><div class="bb-lvl" id="bLvl"></div><div class="bb-ebtns" id="bEBtns"></div></div>
      <div class="bb-shopbtn" id="bShopBtnWrap"><button class="bbtn shopbtn" id="bShopBtn" aria-pressed="false" data-tip="txt:Shop|Five legends for sale. Tap to open or close."><img class="px" src="${coinImg()}" alt=""><span>Shop</span></button></div>
      <div class="bb-shop" id="bShop"></div>
      <div class="bb-bench" id="bBench"></div>
      <div class="bb-act" id="bAct"></div>`));
    app.appendChild(mk('unitCard', 'unitcard', `<button class="ibtn ucx" id="unitX" aria-label="Close">${pxi('ui-close')}</button><div id="unitBody"></div>`));
    $('unitX').onclick = () => { BOARD.card = null; BOARD.render(); };
    $('bIntelBtn').onclick = () => BOARD.setIntel(!BOARD.intel);
    $('scoutRow').onclick = () => BOARD.setIntel(!BOARD.intel);
    $('bTeamBtn').onclick = () => BOARD.setTeam(!BOARD.team);
    // phones: the shop is a tray that slides up over the board, like TFT mobile (opens itself at the start of each prep)
    $('bShopBtn').onclick = () => { SFX.play('click'); BOARD.shopOpen = !BOARD.shopOpen; BOARD.render(); };
    // the bar hands its clicks to the same actions the Guild page uses
    $('boardBar').addEventListener('click', e => { const b = e.target.closest('[data-bact]'); if (!b || b.disabled) return; SFX.init(); G.act(b.dataset.bact, b.dataset.arg); });
    $('traitRail').addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b && !b.disabled) { G.act(b.dataset.act, b.dataset.arg); return; } const t = e.target.closest('[data-tip]'); if (t) { e.stopPropagation(); const r = t.getBoundingClientRect(); UI.tipShow(t, r.right + 8, r.top + r.height / 2); } });
    // trait highlight: hover a trait row (mouse) to light up its champions; hover a shop card or bench tile to light up the traits they carry
    const rail = $('traitRail'), bar = $('boardBar');
    rail.addEventListener('pointerover', e => { if (e.pointerType === 'touch') return; const r = e.target.closest('[data-trk]'); BOARD.setHL(r ? r.dataset.trk : null); });
    rail.addEventListener('pointerleave', e => { if (e.pointerType !== 'touch') BOARD.setHL(null); });
    bar.addEventListener('pointerover', e => { if (e.pointerType === 'touch') return; const r = e.target.closest('[data-trk]'); BOARD.setPV(r ? r.dataset.trk.split(' ') : null); });
    bar.addEventListener('pointerleave', e => { if (e.pointerType !== 'touch') BOARD.setPV(null); });
    // touch: tapping a trait keeps it lit (with its tip) until the next tap somewhere else
    rail.addEventListener('pointerdown', e => { if (e.pointerType !== 'touch') return; const r = e.target.closest('[data-trk]'); if (r) { BOARD.setHL(BOARD.hlTok === r.dataset.trk ? null : r.dataset.trk); BOARD.touchHL = true; } });
    document.addEventListener('pointerdown', e => { if (BOARD.touchHL && !e.target.closest('#traitRail')) { BOARD.touchHL = false; BOARD.setHL(null); } }, true);
    $('rosterToggle').addEventListener('click', e => { if (!BOARD.on) return; e.stopImmediatePropagation(); BOARD.setTeam(false); }, true);
    // phones: a tap on a bench champion picks them for tap-to-place without the card covering the board (long-press shows their tip)
    $('bBench').addEventListener('pointerdown', e => { const t = e.target.closest('[data-uid]'); if (t) { BOARD.benchTap = BOARD.phone(); G.cardDown(e, t.dataset.uid); BOARD.benchTap = false; } });
  },
  // move the shared HUD pieces into the board plates; unmount puts every one back exactly where it was
  move(el, into, before) { if (!el) return; if (!BOARD.homes.has(el)) { const mark = document.createComment('home'); el.parentNode.insertBefore(mark, el); BOARD.homes.set(el, mark); } before ? into.insertBefore(el, before) : into.appendChild(el); },
  mount() {
    BOARD.build(); if (BOARD.on) return; BOARD.on = true;
    document.documentElement.classList.add('board');
    const q = s => document.querySelector(s);
    BOARD.move(q('.hud .siegeinfo'), $('bTop')); BOARD.move(q('.hud .castlebar'), $('bTop'));
    BOARD.move($('scoreBox'), $('bTL'));
    for (const id of ['recBadge', 'soundBtn', 'fsBtn', 'menuBtn']) BOARD.move($(id), $('bBtns'));
    BOARD.move(q('.hud .rail'), $('bFac'));
    BOARD.move($('goldBox'), $('bGold'));
    BOARD.move(q('.hud .controls .speed'), $('bAct'));
    for (const id of ['repairBtn', 'pressBtn', 'hammerBtn', 'powerBtn', 'beginBtn']) BOARD.move($(id), $('bAct'));
    BOARD.move($('inspector'), $('unitBody'));
    BOARD.keys = {}; BOARD.setTeam(BOARD.team, true); BOARD.setIntel(BOARD.intel, true);
  },
  unmount() {
    if (!BOARD.on) return; BOARD.on = false;
    document.documentElement.classList.remove('board', 'board-team', 'bshop-open');
    document.documentElement.style.removeProperty('--actW');
    for (const [el, mark] of BOARD.homes) { mark.parentNode && mark.parentNode.insertBefore(el, mark); mark.remove(); }
    BOARD.homes.clear();
    for (const k of ['--barH', '--trailW']) document.documentElement.style.removeProperty(k);
    $('roster').classList.remove('bteam'); $('intel').classList.remove('bopen');
  },
  setTeam(open, quiet) {
    BOARD.team = open; document.documentElement.classList.toggle('board-team', open && BOARD.on);
    const b = $('bTeamBtn'); if (b) b.setAttribute('aria-pressed', String(open));
    if (open) { BOARD.setIntel(false, true); UI.setRoster(false); }
    if (!quiet) SFX.play('click');
  },
  setIntel(open, quiet) {
    BOARD.intel = open; $('intel').classList.toggle('bopen', open && BOARD.on);
    if (BOARD.on) UI.setIntel(open, true);
    const b = $('bIntelBtn'); if (b) b.setAttribute('aria-pressed', String(open));
    if (open && BOARD.team) BOARD.setTeam(false, true);
    if (!quiet) SFX.play('click');
  },
  // arena: as wide as the screen allows above the bar; spare width on the left becomes the trait column
  layout() {
    if (BOARD.phone()) return BOARD.layoutPhone();
    const st = document.documentElement.style, big = innerWidth >= 1800 && innerHeight >= 1000;
    const barH = big ? 138 : innerHeight < 760 ? 98 : 116;
    const availH = innerHeight - barH; let w = innerWidth, h = w * 9 / 16; if (h > availH) { h = availH; w = h * 16 / 9; }
    const free = innerWidth - w, wide = free >= 170;
    const ax = wide ? free : free / 2;
    st.setProperty('--aw', w + 'px'); st.setProperty('--ah', h + 'px'); st.setProperty('--ax', ax + 'px'); st.setProperty('--ay', Math.max(0, (availH - h) / 2) + 'px');
    st.setProperty('--barH', barH + 'px'); st.setProperty('--hudH', '0px'); st.setProperty('--rosH', barH + 'px'); st.setProperty('--trailW', (wide ? free : 0) + 'px');
    document.documentElement.classList.toggle('trail-wide', wide);
    if (typeof R !== 'undefined' && R.cv && typeof resizeRender === 'function') resizeRender();
  },
  // phones held sideways: the board sits between the trait badges (left) and the siege buttons (right), above a slim bar
  layoutPhone() {
    const st = document.documentElement.style, S = MOB.safe(), H = innerHeight, W = innerWidth;
    const barH = (H < 360 ? 54 : 60) + S.b, leftW = 50 + S.l, actW = (W < 700 ? 104 : 118) + S.r;
    const availW = W - leftW - actW, availH = H - barH; let w = availW, h = w * 9 / 16; if (h > availH) { h = availH; w = h * 16 / 9; }
    const ax = leftW + (availW - w) / 2;
    st.setProperty('--aw', w + 'px'); st.setProperty('--ah', h + 'px'); st.setProperty('--ax', ax + 'px'); st.setProperty('--ay', Math.max(0, (availH - h) / 2) + 'px');
    st.setProperty('--barH', barH + 'px'); st.setProperty('--hudH', '0px'); st.setProperty('--rosH', barH + 'px'); st.setProperty('--trailW', '0px'); st.setProperty('--actW', actW + 'px');
    document.documentElement.classList.remove('trail-wide');
    if (typeof R !== 'undefined' && R.cv && typeof resizeRender === 'function') resizeRender();
  },
  render() {
    if (!BOARD.on || !G.run) return;
    const run = G.run;
    if (G.phase !== BOARD.lastPhase) { if (G.phase === 'prep') BOARD.shopOpen = true; BOARD.lastPhase = G.phase; }
    const tray = BOARD.phone() && BOARD.shopOpen && G.phase === 'prep';
    document.documentElement.classList.toggle('bshop-open', tray);
    const sb = $('bShopBtn'); if (sb) { sb.setAttribute('aria-pressed', String(tray)); sb.disabled = G.phase !== 'prep'; }
    BOARD.renderTop(run); BOARD.renderTraits(run); BOARD.renderScouts(run); BOARD.renderEcon(run); BOARD.renderShop(run); BOARD.renderBench(run);
    const show = !!G.selected && BOARD.card === G.selected && !!run.roster.find(x => x.uid === G.selected) && $('title').hidden && !BOARD.team;
    $('unitCard').classList.toggle('on', show);
  },
  set(id, html) { if (BOARD.keys[id] === html) return false; BOARD.keys[id] = html; $(id).innerHTML = html; return true; },
  // ---- top: siege tracker with this horde's five sieges as pips ----
  renderTop(run) {
    const s = run.siege, within = (s - 1) % 5, first = s - within; let p = '';
    for (let i = 0; i < 5; i++) { const n = first + i, boss = isBossSiege(n), cls = i < within ? 'done' : i === within ? 'now' : 'next';
      p += `<i class="pip ${cls} ${boss ? 'boss' : ''}" data-tip="txt:Siege ${n}|${esc(UI.siegeBlurb(n))}">${boss ? pxi('ui-skull') : i < within ? pxi('ui-check') : ''}</i>`; }
    let pe = $('hordePips'); if (!pe) { pe = document.createElement('div'); pe.id = 'hordePips'; pe.className = 'pips5'; $('bTop').insertBefore(pe, $('bTop').children[1] || null); }
    if (pe._k !== p) { pe._k = p; pe.innerHTML = p; }
  },
  // ---- left: TFT-style trait tracker (live ones first, tier pips, hover for the full text) ----
  // Cam 2026-10-31: "enhance the traits a bit so they are easier to understand just by looking at them, highlight if you already
  // have the trait on the board". Live traits sit on top in their tier colour, the rest are dimmed below a divider, every row
  // shows its breakpoints as pips, and hovering (or tapping) a trait lights up every champion who carries it on the board,
  // bench and shop. Each row carries data-trk tokens: r-<race>, c-<class>, e-<element>.
  renderTraits(run) {
    const { race, cls } = synergyCounts(run), act = activeSynergies(run), rows = [];
    const tierCls = t => t < 0 ? 't-off' : ['t-bronze', 't-silver', 't-gold'][Math.min(2, t)] || 't-gold';
    const pips = (n, at) => `<span class="tpips">${at.map((v, i) => `<i class="${n >= v ? 'f' : at.findIndex(w => w > n) === i ? 'nx' : ''}"></i>`).join('')}</span>`;
    const tiers = (n, at) => `<span class="tiers">${at.map(v => `<i class="${n >= v ? 'f' : ''} ${at.filter(w => n >= w).pop() === v ? 'cur' : ''}">${v}</i>`).join('<em>›</em>')}</span>`;
    const goal = (n, at) => { const nx = at.find(v => v > n); return nx == null ? '<small class="nx mx">max</small>' : `<small class="nx">${nx - n} more</small>`; };
    const row = (key, tok, def, n, icon, tip) => { const t = act[key] ?? -1;
      rows.push({ on: t >= 0, t, n, html: `<div class="tr ${t >= 0 ? 'on' : 'off'} ${tierCls(t)}" data-trk="${tok}" data-tip="${tip}" aria-label="${esc(def.name)} ${n}"><span class="hex">${icon}</span><b class="cnt">${n}</b><span class="nm">${esc(def.name)}</span>${tiers(n, def.at)}${goal(n, def.at)}${pips(n, def.at)}</div>` }); };
    for (const k in RACES) if (race[k]) row(k, 'r-' + k, RACES[k], race[k], pxi('race-' + k), 'syn:' + k);
    for (const k in CLASSES) if (cls[k]) row(k, 'c-' + k, CLASSES[k], cls[k], pxi('cls-' + k), 'syn:' + k);
    rows.sort((a, b) => (b.on - a.on) || (b.t - a.t) || (b.n - a.n));
    const firstOff = rows.findIndex(r => !r.on);
    let h = rows.map((r, i) => (i === firstOff && i > 0 ? '<div class="trdiv" aria-hidden="true"></div>' : '') + r.html).join('');
    const fe = stackElements(run), els = EL_KEYS.filter(e => fe[e]).sort((a, b) => (elTier(fe[b]) - elTier(fe[a])) || fe[b] - fe[a]);
    if (els.length) { h += `<div class="trsep">Elements</div>`; for (const e of els) { const n = fe[e], t = elTier(n), E = ELEMENTS[e];
      h += `<div class="tr el ${t >= 0 ? 'on' : 'off'} ${tierCls(t)}" data-trk="e-${e}" data-tip="els:${e}" style="--ec:${E.col}"><span class="hex">${pxi('el-' + e)}</span><b class="cnt">${n}</b><span class="nm">${esc(E.name)}</span>${tiers(n, EL_STACK.at)}${goal(n, EL_STACK.at)}${pips(n, EL_STACK.at)}</div>`; } }
    const tc = temperCounts(run), tps = Object.keys(tc).filter(k => tc[k] >= 2);
    if (tps.length) { h += `<div class="trsep">Pairs</div>`; for (const k of tps) { const T = TEMPERS[k]; h += `<div class="tr on t-silver tmp ${T.side}" data-tip="tmp:${k}"><span class="hex">${pxi('tmp-' + k)}</span><b class="cnt">${tc[k]}</b><span class="nm">${esc(T.name)}</span></div>`; } }
    const all = possibleCombos(run), on = new Set(activeCombos(run).map(c => c.key));
    if (all.length) { h += `<div class="trsep">Combos ${on.size}/${comboSlots(run)}</div>`;
      for (const c of all) h += `<button class="tr combo ${on.has(c.key) ? 'on t-gold' : 't-off'} ${c.unpicked ? 'new' : ''}" data-act="combo" data-arg="${c.key}" data-tip="combo:${c.key}" style="--ec:${ELEMENTS[c.a].col};--ec2:${ELEMENTS[c.b].col}" ${G.phase !== 'prep' ? 'disabled' : ''}><span class="hex">${pxi('cmb-' + c.kind)}</span><span class="nm">${esc(c.name)}</span></button>`; }
    if (!h) h = `<p class="trnone">Two champions of the same race or class switch on a bonus.</p>`;
    if (BOARD.set('traitRail', h)) BOARD.paintHL();
  },
  // ---- trait marks on shop cards and bench tiles: which of this legend's traits you already field, and which ones they'd switch on ----
  // have: that trait is already on the board (gold rim + how many). up: fielding this legend reaches that trait's next breakpoint (green glow).
  traitMarks(run, heroId, el, cached) {
    const c = cached || { ...synergyCounts(run), fe: stackElements(run), placed: new Set(placedHeroes(run).map(h => h.id)) };
    const d = HERO_BY_ID[heroId], adds = !c.placed.has(heroId), out = [];
    const one = (tok, name, n, at, icon, extra = 0) => { const after = adds ? n + 1 + extra : n; out.push({ tok, name, n, after, at, icon, up: adds && at.some(v => v > n && v <= after) }); };
    one('r-' + d.race, RACES[d.race].name, c.race[d.race] || 0, RACES[d.race].at, pxi('race-' + d.race));
    one('c-' + d.cls, CLASSES[d.cls].name, c.cls[d.cls] || 0, CLASSES[d.cls].at, pxi('cls-' + d.cls));
    // the castle's element counts once a champion carries it, so the first one of that element is worth two
    if (el) { const n = c.fe[el] || 0; one('e-' + el, ELEMENTS[el].name, n, EL_STACK.at, pxi('el-' + el), !n && run.castleEl === el ? 1 : 0); }
    return out;
  },
  markChips(marks) { return marks.map(m => `<span class="tchip ${m.n ? 'have' : ''} ${m.up ? 'up' : ''}">${m.icon}${m.n ? `<b>${m.n}</b>` : ''}</span>`).join(''); },
  markText(marks) {
    const lines = marks.filter(m => m.up).map(m => `${m.name} ${m.n} → ${m.after}${m.at[0] === m.after ? ' switches it on' : ' levels it up'}`);
    const have = marks.filter(m => m.n && !m.up).map(m => `${m.name} (${m.n} on the board)`);
    return (lines.length ? ' Fielding them: ' + lines.join(', ') + '.' : '') + (have.length ? ' Adds to ' + have.join(', ') + '.' : '');
  },
  // ---- trait highlight: hover a trait (tap on phones) and everyone who carries it lights up; the board canvas reads BOARD.hlTok ----
  hlTok: null, pvToks: null,
  heroToks(run, h) { const d = HERO_BY_ID[h.id]; return ['r-' + d.race, 'c-' + d.cls, ...heroElements(run, h).map(e => 'e-' + e)]; },
  setHL(tok) { if (BOARD.hlTok === tok) return; BOARD.hlTok = tok; BOARD.paintHL(); },
  setPV(toks) { const k = toks ? toks.join(' ') : null; if ((BOARD.pvToks && BOARD.pvToks.join(' ')) === k) return; BOARD.pvToks = toks; BOARD.paintHL(); },
  paintHL() {
    const tok = BOARD.hlTok, pv = BOARD.pvToks;
    document.documentElement.classList.toggle('trhl', !!tok);
    for (const el of document.querySelectorAll('#boardBar [data-trk]')) el.classList.toggle('hl', !!tok && el.dataset.trk.split(' ').includes(tok));
    for (const el of document.querySelectorAll('#traitRail [data-trk]')) { el.classList.toggle('hl', el.dataset.trk === tok); el.classList.toggle('pv', !!pv && pv.includes(el.dataset.trk)); }
    document.documentElement.classList.toggle('trpv', !!pv);
  },
  // ---- top right: the horde as a row of faces; the full report opens on click ----
  renderScouts(run) {
    const B = G.B, s = run.siege, F = FACTIONS[factionIndex(s)], within = (s - 1) % 5;
    let ids, counts = null;
    if (B && G.phase === 'siege') { counts = {}; for (const q of B.queue) if (!q.turncoat) counts[q.id] = (counts[q.id] || 0) + 1; for (const e of B.enemies) if (e.alive && !e.turncoat) counts[e.id] = (counts[e.id] || 0) + 1; ids = Object.keys(counts); }
    else { ids = F.pool.slice(0, Math.min(F.pool.length, 2 + within)); if (within >= 2 && s > 5) ids.push(F.elite); if (isBossSiege(s)) ids.push(bossFor(s)); if (run.mods.chickens) ids.unshift('chicken'); if (run.mods.honked) ids.unshift('goose'); }
    const tag = d => d.boss ? (d.boss === 'big' ? 'Boss' : 'Mini-boss') : d.elite ? 'Elite, may drop an item' : d.kind === 'flyer' ? 'Flies over the line' : d.kind === 'ranged' ? 'Ranged' : d.kind === 'healer' ? 'Heals the horde' : d.split ? 'Splits when slain' : d.spd > 35 ? 'Fast' : 'Melee';
    let h = `<span class="srlab">${counts ? 'Still coming' : esc(F.name)}</span>`;
    for (const id of ids) { const d = ENEMIES[id]; if (!d) continue; h += `<span class="sface ${d.boss ? 'boss' : d.elite ? 'elite' : ''}" data-tip="txt:${esc(d.name)}|${esc(tag(d))}"><img class="px" src="${portrait('e:' + id)}" alt="">${counts ? `<b>${counts[id]}</b>` : ''}</span>`; }
    const tc = run.tactic && TACTICS[run.tactic]; if (tc && !counts) h += `<span class="sface tac" data-tip="txt:Horde tactic: ${esc(tc.name)}|${esc(tc.desc)}">${pxi('tac-' + run.tactic)}</span>`;
    BOARD.set('scoutRow', h);
  },
  // ---- bottom left: gold, guild level, level up and reroll (TFT's buy XP and refresh) ----
  renderEcon(run) {
    const prep = G.phase === 'prep', gc = guildCost(run), rc = shopRerollCost(run), intr = interestFor(run.gold, run);
    BOARD.set('bLvl', `<b data-tip="txt:Guild level ${guildLevel(run)}|Each guild level adds a field slot and deals rarer legends in the shop.">Lv ${guildLevel(run)}</b><small>${fieldCount(run)}/${fieldCap(run)} on the field</small><small class="intr" data-tip="txt:Interest|1 gold per ${SHOP.interestPer} banked, paid after the siege.">+${intr} interest</small>`);
    BOARD.set('bEBtns', `<button class="bbtn lvup" data-bact="guildlevel" ${prep && gc != null && run.gold >= gc ? '' : 'disabled'} data-tip="txt:Level up the guild|One more champion on the field and rarer shop odds.">${pxi('ui-up')}<span>${gc == null ? 'Max level' : 'Level up'}</span>${gc == null ? '' : COST(gc)}</button>
      <button class="bbtn rr" data-bact="shopreroll" ${prep && run.gold >= rc ? '' : 'disabled'} data-tip="txt:New shop|Deal five fresh legends.">${pxi('ui-reroll')}<span>Reroll</span>${COST(rc)}</button>`);
  },
  // ---- bottom middle: the shop, always in reach while you plan ----
  renderShop(run) {
    const prep = G.phase === 'prep'; if (!run.shop) rollShop(run, G.meta);
    const full = run.roster.length >= rosterCap(run), mc = { ...synergyCounts(run), fe: stackElements(run), placed: new Set(placedHeroes(run).map(h => h.id)) };
    let h = '';
    run.shop.forEach((c, i) => {
      if (!c) { h += `<div class="bs-card sold"><span>Sold</span></div>`; return; }
      const d = HERO_BY_ID[c.id], Rr = RARITY[d.rar], cost = shopCost(c.id), own = run.roster.find(x => x.id === c.id), el = own ? own.el : c.el;
      const up = own && copiesToNext(own) === 1, marks = BOARD.traitMarks(run, c.id, el, mc);
      const tip = `txt:${esc(d.name)}|${esc(Rr.name)} ${esc(RACES[d.race].name)} ${esc(CLASSES[d.cls].name)}${el ? ', ' + esc(ELEMENTS[el].name) : ''}. Signature: ${esc(d.aName)}.${own ? ` You own ${own.copies || 1} ${(own.copies || 1) === 1 ? 'copy' : 'copies'} (${copiesToNext(own)} more for ${heroStar(own) + 1} stars).` : ''}${esc(BOARD.markText(marks))}`;
      h += `<button class="bs-card r${d.rar} ${own ? 'own' : ''} ${up ? 'starup' : ''} ${marks.some(m => m.up) ? 'trup' : ''}" data-trk="${marks.map(m => m.tok).join(' ')}" data-bact="shopbuy" data-arg="${i}" style="--rc:${Rr.col};--rc2:${Rr.col2}" ${prep && run.gold >= cost ? '' : 'disabled'} data-tip="${tip}" aria-label="${esc(d.name)}, ${Rr.name}, ${cost} gold">
        <img class="px port" src="${portrait('h:' + c.id, 'idle0')}" alt="" draggable="false">
        <span class="bs-ic">${BOARD.markChips(marks)}</span>
        ${own ? `<span class="bs-own">${up ? `${heroStar(own) + 1}★ next` : `${heroStar(own)}★ owned`}</span>` : full ? '<span class="bs-own dim">Keep full</span>' : ''}
        <span class="bs-foot"><b>${esc(heroShortName(d.name))}</b><span class="bs-cost">${COST(cost)}</span></span></button>`;
    });
    h += `<button class="ibtn bs-lock ${run.shopLock ? 'on' : ''}" data-bact="shoplock" aria-pressed="${!!run.shopLock}" data-tip="txt:${run.shopLock ? 'Shop locked' : 'Lock the shop'}|${run.shopLock ? 'These five stay for the next siege.' : 'Keep these five for the next siege instead of a fresh deal.'}">${pxi(run.shopLock ? 'ui-lock' : 'ui-unlock')}</button>`;
    if (BOARD.set('bShop', h)) BOARD.paintHL();
    $('bShop').classList.toggle('closed', !prep);
  },
  // ---- bottom right: the bench, five slots; drag a champion up onto the board ----
  renderBench(run) {
    const bench = run.roster.filter(x => !(x.place || x.vault || x.fled));
    let h = `<span class="bb-lab" data-tip="txt:Bench|Bench champions don't fight. Drag one onto the field, or onto a field champion to swap. Drag a field champion down here to bench them.">Bench <b>${bench.length}/${BENCH_SLOTS}</b></span><div class="btiles">`;
    const mc = { ...synergyCounts(run), fe: stackElements(run), placed: new Set(placedHeroes(run).map(h => h.id)) };
    for (const x of bench) { const st = heroStar(x), Rr = RARITY[x.rarity || 0], marks = BOARD.traitMarks(run, x.id, x.el, mc);
      h += `<div class="bt ${G.selected === x.uid ? 'sel' : ''} ${marks.some(m => m.up) ? 'trup' : ''}" data-trk="${marks.map(m => m.tok).join(' ')}" data-uid="${x.uid}" tabindex="0" role="button" style="--rc:${Rr.col}" aria-label="${esc(heroDisplayName(x))}, level ${x.level}" data-tip="txt:${esc(heroDisplayName(x))}|Level ${x.level} · ${esc(RACES[HERO_BY_ID[x.id].race].name)} ${esc(CLASSES[HERO_BY_ID[x.id].cls].name)}. Drag onto the field to fight.${esc(BOARD.markText(marks))}"><img class="px" src="${portrait(heroSpriteKey(x))}" alt="" draggable="false"><span class="bt-ic">${BOARD.markChips(marks)}</span><span class="stars s${st}">${'★'.repeat(st)}</span><small>${x.level}</small></div>`; }
    for (let i = bench.length; i < BENCH_SLOTS; i++) h += `<div class="bt empty" aria-hidden="true"></div>`;
    if (BOARD.set('bBench', h + '</div>')) BOARD.paintHL();
  },
};

// ----- wiring: wrap the shared UI so the board plates follow every refresh, and swap layouts with the phone code -----
(function boardWire() {
  const layout0 = UI.layout, refresh0 = UI.refresh, hud0 = UI.hud, select0 = G.select, roster0 = UI.renderRoster, setIntel0 = UI.setIntel;
  UI.layout = function () {
    if (!BOARD.wanted()) BOARD.unmount();
    const r = layout0.apply(UI, arguments);
    if (BOARD.wanted()) { BOARD.mount(); BOARD.layout(); BOARD.render(); }
    return r;
  };
  UI.refresh = function () { const r = refresh0.apply(UI, arguments); BOARD.render(); return r; };
  UI.hud = function () { const r = hud0.apply(UI, arguments); if (BOARD.on && G.run) { BOARD.renderTop(G.run); BOARD.renderEcon(G.run); BOARD.renderShop(G.run); } return r; };
  UI.renderRoster = function () { const r = roster0.apply(UI, arguments); if (BOARD.on) { BOARD.renderBench(G.run); BOARD.renderTraits(G.run); BOARD.render(); } return r; };
  const openPage0 = UI.openPage;
  // no Guild tab on desktop (Cam 2026-10-31): the shop and Level up live on the bottom bar, so a call for the guild page just closes the drawer
  UI.openPage = function (p) { if (p === 'guild' && BOARD.on) p = null; const r = openPage0.call(UI, p); document.documentElement.classList.toggle('board-page', !!UI.page); if (UI.page && BOARD.team) BOARD.setTeam(false, true); return r; };
  G.select = function (uid) { BOARD.card = BOARD.benchTap ? null : uid; return select0.apply(G, arguments); };
  // the S key and the old intel tab open the board's scout panel
  UI.setIntel = function (open, quiet) { const r = setIntel0.apply(UI, arguments); if (BOARD.on && BOARD.intel !== open) { BOARD.intel = open; $('intel').classList.toggle('bopen', open); const b = $('bIntelBtn'); if (b) b.setAttribute('aria-pressed', String(open)); } return r; };
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && BOARD.on) { if (BOARD.team) BOARD.setTeam(false); else if (BOARD.intel) BOARD.setIntel(false); else if (BOARD.card) { BOARD.card = null; BOARD.render(); } } }, true);
  // clicking empty board closes the champion card
  document.addEventListener('pointerdown', e => { if (!BOARD.on || e.target.id !== 'arena') return; setTimeout(() => { if (!G.drag) { const p = toLogical(e); if (G.phase === 'prep' && !heroAtPoint(p)) { BOARD.card = null; BOARD.render(); } } }, 0); });
})();
