// ===== Game controller =====
const SAVE_KEY = 'manatorium.save.v2', OLD_SAVE_KEY = 'manatorium.save.v1';
const G = { meta: null, run: null, B: null, phase: 'title', speed: 1, selected: null, drag: null, armed: null, mouse: null, hover: null, hoverOk: false, prepUnits: [], paused: false, endT: 0, lastEnc: [] };

function save() {
  try { const data = { v: 2, meta: G.meta, run: G.run && G.hasRun ? G.run : null }; localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) { }
}
function load() {
  try {
    let raw = localStorage.getItem(SAVE_KEY);
    if (raw) raw = raw.replace(/"spatula"/g, '"shard"'); // older saves called the rare component a spatula
    if (raw) { const d = JSON.parse(raw); if (d && d.v === 2 && d.meta) return d; }
    const old = localStorage.getItem(OLD_SAVE_KEY);   // keep diamonds and ranks from phase 1, drop the old run
    if (old) { const d = JSON.parse(old); if (d && d.meta) { const m = Object.assign(newMeta(), d.meta); m.seen = {}; return { v: 2, meta: m, run: null }; } }
  } catch (e) { }
  return null;
}

// ----- prep units -----
function rebuildPrepUnits() {
  G.prepUnits = G.run.roster.filter(h => h.place).map(h => {
    const p = h.place.type === 'rafter' ? rafterPosition(G.run, h.place.i) : cellPos(h.place.c, h.place.r);
    const st = heroStats(h, G.run, G.meta);
    return { key: heroSpriteKey(h), x: p.x, y: p.y, side: 'hero', facing: 1, phase: (h.uid.charCodeAt(1) % 10) / 7, inst: h, hp: 1, maxHp: 1, vscale: st.scale, els: heroElements(G.run, h) };
  });
  if (G.drag && G.drag.active && G.mouse && G.drag.overCanvas) G.prepUnits.push({ key: heroSpriteKey(G.drag.h), x: G.mouse.x, y: G.mouse.y + 8, side: 'hero', facing: 1, inst: null, hp: 1, maxHp: 1, atkT: 0 });
}

function changed() { rebuildPrepUnits(); UI.refresh(); save(); offerComboForm(); }
// a new element pair on the field: the player chooses which version of the combo to forge
function offerComboForm() {
  const run = G.run; if (!run || G.phase !== 'prep' || !$('modal').hidden || G.comboAsk) return;
  const c = possibleCombos(run).find(c => c.unpicked && !(run.comboLater || {})[c.key]); if (!c) return;
  G.comboAsk = setTimeout(() => { G.comboAsk = null; if (G.phase === 'prep' && $('modal').hidden && possibleCombos(run).some(x => x.key === c.key && x.unpicked)) showComboForm(c.key); }, 450);
}
function showComboForm(key) {
  const run = G.run; run.comboOffer = run.comboOffer || {}; const kinds = run.comboOffer[key] || (run.comboOffer[key] = comboFormOptions(key)); save();
  UI.modal(UI.comboFormHTML(key, kinds), s => s.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => {
    const k = kinds[+b.dataset.pick]; setComboForm(run, key, k); UI.closeModal(); SFX.play('level');
    const c = possibleCombos(run).find(c => c.key === key); UI.toast(`${c.name} forged.${activeCombos(run).some(x => x.key === key) ? ' It fires during sieges.' : ' Click it in the Combos bar to switch it on.'}`);
    TEL.event('comboForm', { key, kind: k }); changed();
  }) || (s.querySelector('#cformLater').onclick = () => { run.comboLater = Object.assign({}, run.comboLater, { [key]: 1 }); UI.closeModal(); changed(); }), 'wide');
}

// ----- flow -----
function startRun() {
  G.run = newRun(G.meta); G.meta.runs++;
  G.hasRun = true; G.B = null; G.selected = null; UI.pendingGold = 0; G.lastEnc = [];
  $('title').hidden = true; $('tower').hidden = true; UI.closeModal(); G.paused = false;
  G.phase = 'draft'; G.run.post = Array(START_LEGENDS).fill('draft');
  TEL.runStart(G.run);
  changed();
  nextPost();
}

// on touch there is no hover: the first tap on a draft card selects it so its bonuses and tips can be read, the second tap drafts
addEventListener('pointerdown', e => { G.touchInput = e.pointerType === 'touch' || e.pointerType === 'pen'; }, true);
function touchPick(s, b, e, go) {
  if (!G.touchInput) return go();
  const tipEl = e && e.target.closest && e.target.closest('[data-tip]');
  if (b.classList.contains('armed') && !tipEl) return go();
  if (!b.classList.contains('armed')) { s.querySelectorAll('.armed').forEach(x => x.classList.remove('armed')); b.classList.add('armed'); b.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); SFX.play('click'); }
  if (tipEl && tipEl !== b) { const r = tipEl.getBoundingClientRect(); setTimeout(() => UI.tipShow(tipEl, r.left + r.width / 2, r.top), 0); }
}
function showDraft() {
  const run = G.run; if (!run.pendingDraft) run.pendingDraft = draftOptions(run, G.meta);
  const kind = run.recruitFrom === 'guild' ? 'guild' : run.recruitFrom ? 'recruit' : draftKind(run); G.phase = 'draft'; save();
  UI.modal(UI.draftHTML(run.pendingDraft, kind, draftRerollCost(run)), s => {
    s.querySelectorAll('[data-pick]').forEach(b => b.onclick = e => touchPick(s, b, e, () => {
      const o = run.pendingDraft[+b.dataset.pick];
      // a full keep: pick who heads home to make room, or go back to the cards
      if (run.roster.length >= ROSTER_CAP) return showMakeRoom(o, showDraft, (h, old, g) => { run.pendingDraft = null; run.recruitFrom = null; picked(o, h, `takes ${HERO_BY_ID[old.id].name.split(' ')[0]}'s place`); UI.toast(`${heroDisplayName(old)} heads home. +${g} gold, items back in the Armory.`); });
      run.pendingDraft = null; run.recruitFrom = null;
      picked(o, addDraftedHero(run, o), kind === 'starter' ? 'joins the keep' : 'answers the call');
    }));
    function picked(o, h, line) {
      G.selected = h.uid; SFX.play('draft');
      UI.closeModal(); UI.banner(`${HERO_BY_ID[h.id].name}`, line);
      TEL.event('draft', { id: o.id, rarity: o.rarity || 0, kind });
      if (kind === 'guild') { G.phase = 'prep'; changed(); UI.openPage('guild'); return; }
      changed(); nextPost();
    }
    const rr = s.querySelector('#draftReroll'); if (rr) rr.onclick = () => { const c = draftRerollCost(run); if (run.gold < c) return; run.gold -= c; run.draftRerolls++; run.pendingDraft = draftOptions(run, G.meta); SFX.play('click'); showDraft(); };
    s.querySelectorAll('[data-focus]').forEach(b => b.onclick = () => { const c = draftRerollCost(run); if (run.gold < c) return; const [kind, key] = b.dataset.focus.split(':'); run.gold -= c; run.draftRerolls++; run.pendingDraft = draftOptions(run, G.meta, { kind, key }); SFX.play('click'); TEL.event('draftFocus', { kind, key }); showDraft(); });
  }, 'wide');
}

// a full keep takes in a new legend: choose who heads home (they keep nothing, their items go back to the Armory)
function showMakeRoom(o, back, after) {
  const run = G.run;
  UI.modal(UI.makeRoomHTML(o), s => {
    s.querySelectorAll('[data-out]').forEach(b => b.onclick = () => { const old = run.roster.find(h => h.uid === b.dataset.out); if (!old) return; const r = swapHero(run, old, o); TEL.event('swap', { inId: o.id, outId: old.id, lv: old.level }); after(r.h, old, r.gold); });
    s.querySelector('#roomBack').onclick = () => back();
  }, 'wide');
}
// Legend Summons after the boss at 35 (Legendary) and 40 (God)
function showSummon() {
  const run = G.run, P = run.pendingSummon; if (!P || !P.opts.length) { run.pendingSummon = null; return nextPost(); }
  G.phase = 'draft'; save(); SFX.play('sig');
  const done = (h, line) => { run.pendingSummon = null; G.selected = h.uid; SFX.play('draft'); UI.closeModal(); FX.flash(RARITY[P.tier].col, 0.5); UI.banner(HERO_BY_ID[h.id].name, line); TEL.event('summon', { id: h.id, tier: P.tier }); changed(); nextPost(); };
  UI.modal(UI.draftHTML(P.opts, 'summon', 0), s => {
    s.querySelectorAll('[data-pick]').forEach(b => b.onclick = e => touchPick(s, b, e, () => {
      const o = P.opts[+b.dataset.pick];
      if (run.roster.length >= ROSTER_CAP) return showMakeRoom(o, showSummon, (h, old) => done(h, `takes ${HERO_BY_ID[old.id].name.split(' ')[0]}'s place`));
      const h = addDraftedHero(run, o); h.level = Math.max(h.level, teamLevel(run)); done(h, `answers the summons at level ${h.level}`);
    }));
    const sk = s.querySelector('#summonSkip'); if (sk) sk.onclick = () => { const g = summonSkipGold(run); run.gold += g; run.pendingSummon = null; UI.closeModal(); UI.toast(`The legends bow out. +${g} gold.`); changed(); nextPost(); };
  }, 'wide');
}
function summonSkipGold(run) { return Math.round(200 * goldMul(run.siege) / 5) * 5; }

function beginSiege() {
  if (G.phase !== 'prep') return;
  if (!G.run.roster.some(h => h.place)) { UI.toast('Place at least one hero on the field first.', true); return; }
  if (isBossSiege(G.run.siege) && !G.run.finale && G.run.bossNag !== G.run.siege && bossReminder()) return;
  UI.openPage(null); UI.coachDone('begin'); UI.coachDone('place');
  G.phase = 'siege'; G.B = startBattle(G.run, G.meta); G.armed = null;
  if (G.run.siege > 1) UI.setRoster(true);
  const s = G.run.siege; const F = FACTIONS[factionIndex(s)];
  if (G.run.finale === 'ready') UI.banner('The Shard War', 'Knock the shards loose'); else if (!isBossSiege(s)) UI.banner(`Siege ${s}`, G.run.tactic ? `${F.name} · ${TACTICS[G.run.tactic].name}` : F.name);
  SFX.play('cast');
  UI.refresh();
  if (s === 1) setTimeout(() => UI.coach('xp-live', document.querySelector('.hcard .xpbar'), 'Heroes earn experience from kills and from surviving the siege. A hero who falls loses everything they earned this round.'), 1500);
}

// before a boss: nudge the player to forge items and spend gold
function bossReminder() {
  const run = G.run, s = run.siege, boss = ENEMIES[bossFor(s)]; run.bossNag = s;
  const loose = run.stash.filter(i => !i.holder), techs = Object.keys(TECH).filter(k => techState(run, k) === 'open' && run.gold >= TECH[k].cost), unplaced = run.roster.filter(h => !h.place);
  const lines = [];
  if (loose.length) lines.push(`<li><b>${loose.length} item${loose.length > 1 ? 's' : ''}</b> in the Armory nobody is holding. Hand them out, and two components on one champion fuse into something better.</li>`);
  if (techs.length) lines.push(`<li><b>${techs.length} tech${techs.length > 1 ? 's' : ''}</b> you can afford in the Artificers' Hall right now, like ${esc(TECH[techs[0]].name)}.</li>`);
  if (unplaced.length) lines.push(`<li><b>${unplaced.length} champion${unplaced.length > 1 ? 's are' : ' is'}</b> sitting on the bench.</li>`);
  if (!lines.length) return false;
  UI.modal(`<span class="eyebrow">Boss siege ${s}</span><h2>${esc(boss.name)} is coming</h2><p class="lede">Get ready first. Bosses hit hard and have a signature move.</p><ul class="nag">${lines.join('')}</ul>
    <div class="row" style="justify-content:flex-end;gap:8px">${loose.length ? '<button class="btn" id="nagArmory">Open the Armory</button>' : ''}${techs.length ? '<button class="btn" id="nagHall">Open the Hall</button>' : ''}<button class="btn primary" id="nagFight">Fight now</button></div>`, sh => {
    const a = sh.querySelector('#nagArmory'), h = sh.querySelector('#nagHall');
    if (a) a.onclick = () => { UI.closeModal(); UI.openPage('armory'); };
    if (h) h.onclick = () => { UI.closeModal(); UI.openPage('hall'); };
    sh.querySelector('#nagFight').onclick = () => { UI.closeModal(); beginSiege(); };
  });
  SFX.play('click'); return true;
}

function endSiege() {
  const B = G.B;
  if (B.done === 'victory') {
    G.phase = 'report'; G.armed = null;
    const rep = finishSiege(G.run, G.meta, B);
    TEL.siege(G.run, rep);
    SFX.play('victory');
    const run = G.run;
    if (rep.siege >= FINAL_SIEGE && run.finale !== 'ready') { startFinale(run); G.phase = 'finale'; save(); TEL.event('finale', {}); setTimeout(() => showFinale(), 1400); UI.hud(); return; }
    if (rep.siege >= FINAL_SIEGE) { run.won = true; G.phase = 'over'; TEL.runEnd(run, 'won'); UI.banner('The Eternal Goose falls', 'The realm is saved. Mostly.'); setTimeout(() => startTower(), 2600); return; }
    run.post = LOOT_AFTER(rep.siege) ? ['loot'] : [];
    // every legend fell: one free recruit so the keep is never empty
    if (!run.roster.length) run.post.push('draft');
    if (rep.siege === CASTLE_SIEGE && !run.castleEl) run.post.push('castle');
    const st = summonTier(rep.siege); if (st) { const opts = summonOptions(run, st); if (opts.length) { run.pendingSummon = { tier: st, opts }; run.post.push('summon'); } }
    run.post.push('encounter');
    run.lastRep = rep; save();
    setTimeout(() => showReport(rep), 900);
    UI.hud();
  } else {
    G.phase = 'over'; G.armed = null;
    TEL.runEnd(G.run, B.bossUnit && B.bossUnit.alive ? 'boss' : 'horde');
    UI.banner('The keep has fallen', `You held ${G.run.siege - 1} sieges`);
    setTimeout(() => startTower(), 2600);
  }
}
function showReport(rep) {
  UI.modal(UI.reportHTML(rep), s => { UI.animateXP(s); s.querySelector('#repNext').onclick = () => { G.run.lastRep = null; nextPost(); };
    if (rep.heroes.some(h => h.levels)) SFX.play('level');
    const sig = rep.heroes.find(h => h.fromLv < SIG_LEVEL && h.toLv >= SIG_LEVEL); if (sig) setTimeout(() => UI.toast(`${HERO_BY_ID[sig.id].name} unlocked their signature: ${HERO_BY_ID[sig.id].aName}!`), 600);
  }, 'wide');
}

// post-siege steps: loot → element choices → draft → castle → visitor → prep
function nextPost() {
  const run = G.run;
  const elHero = run.roster.find(needsElement);
  if (elHero && !(run.post[0] === 'draft' && !run.roster.length)) return showElement(elHero);
  const step = run.post.shift(); save();
  if (!step) return toPrep();
  if (step === 'loot') return showLoot();
  if (step === 'draft') return showDraft();
  if (step === 'castle') return showCastle();
  if (step === 'encounter') return showEncounter();
  if (step === 'summon') return showSummon();
  nextPost();
}

function showLoot() {
  const run = G.run; G.phase = 'loot'; if (!run.pendingLoot) run.pendingLoot = lootOptions(run, G.meta); save();
  UI.modal(UI.lootHTML(run.pendingLoot, lootRerollCost(run)), s => {
    s.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => {
      const it = takeLoot(run, run.pendingLoot[+b.dataset.pick]); run.pendingLoot = null; SFX.play('drop');
      UI.toast(`${itemName(it)} added to the Armory.`); TEL.event('loot', { parts: it.parts });
      changed(); nextPost();
    });
    s.querySelector('#lootReroll').onclick = () => { const c = lootRerollCost(run); if (run.gold < c) return; run.gold -= c; run.lootRerolls++; run.pendingLoot = lootOptions(run, G.meta); SFX.play('click'); showLoot(); };
  }, 'wide');
}

function showElement(h) {
  const run = G.run; G.phase = 'element';
  if (!run.pendingEl || run.pendingEl.uid !== h.uid) run.pendingEl = { uid: h.uid, opts: elementOptions(run, G.meta, h) }; save();
  SFX.play('sig');
  UI.modal(UI.elementHTML(h, run.pendingEl.opts), s => s.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => {
    const e = run.pendingEl.opts[+b.dataset.pick]; run.pendingEl = null; h.el = e;
    SFX.play('draft'); UI.closeModal(); UI.banner(heroDisplayName(h), `${ELEMENTS[e].name} awakened`); TEL.event('element', { id: h.id, el: e, lv: h.level });
    FX.flash(ELEMENTS[e].col, 0.4);
    changed(); nextPost();
  }), 'wide');
}

function showCastle() {
  const run = G.run; G.phase = 'castle'; if (!run.pendingCastle) run.pendingCastle = castleOptions(run); save();
  UI.modal(UI.castleHTML(run.pendingCastle), s => s.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => {
    const e = run.pendingCastle[+b.dataset.pick]; run.pendingCastle = null; run.castleEl = e;
    SFX.play('hammer'); UI.closeModal(); FX.shake(10); FX.flash(ELEMENTS[e].col, 0.6); UI.banner(`${ELEMENTS[e].name} Castle`, CASTLE_POWERS[e].name);
    TEL.event('castle', { el: e });
    changed(); setTimeout(() => UI.coach('power', $('powerBtn'), `Your castle has a new power: ${CASTLE_POWERS[e].name}. Fire it during a siege with this button or the E key.`), 600);
    nextPost();
  }), 'wide');
}

function showEncounter() {
  const enc = drawEncounter(G.run, G.lastEnc), story = enc.story ? enc : null; if (!story) G.lastEnc = [enc.id, ...G.lastEnc].slice(0, 8); G.phase = 'encounter';
  UI.modal(UI.encounterHTML(enc), s => s.querySelectorAll('[data-opt]').forEach(b => b.onclick = () => {
    const o = enc.opts[+b.dataset.opt]; if (story) { if (story.p === 1) G.run.mood = 0; G.run.storySeen = [...(G.run.storySeen || []), story.id]; } const r = resolveEncounter(G.run, G.meta, o.fx); SFX.play('buy');
    TEL.event('encounter', { id: enc.id, opt: +b.dataset.opt });
    const lv = r.levels.map(([h, n]) => `${heroDisplayName(h)} reached level ${h.level}!`);
    const outcome = extra => {
      const hz = G.run.mods.hz && HAZARDS[G.run.mods.hz];
      UI.modal(`<span class="eyebrow">${esc(enc.title)}</span><h2>${esc(o.label)}</h2><div class="outcome">${r.out.filter(x => x !== 'Pick an item to reforge.').concat(extra || [], lv).map(esc).join('<br>')}</div>
      ${hz ? UI.hazardCard(G.run.mods.hz) : ''}
      <p class="lede">Next: siege ${G.run.siege}${isBossSiege(G.run.siege) ? `. ${esc(ENEMIES[bossFor(G.run.siege)].name)} is coming` : ` against the ${esc(FACTIONS[factionIndex(G.run.siege)].name)}`}${(G.run.siege - 1) % 5 === 0 ? '. A new horde has arrived.' : '.'}</p>
      <div class="row" style="justify-content:flex-end"><button class="btn primary" id="toKeep">Back to the keep</button></div>`, s2 => s2.querySelector('#toKeep').onclick = () => { UI.closeModal(); nextPost(); });
      changed(); };
    if (G.run.pendingReforge) { G.run.pendingReforge = false; showReforge(enc, items => outcome(items)); } else outcome();
  }));
}

// pick one finished item; it turns into a different finished item and stays on whoever held it
function showReforge(enc, done) {
  const run = G.run, list = reforgeable(run);
  UI.modal(UI.reforgeHTML(run, list, enc.title), s => s.querySelectorAll('[data-rf]').forEach(b => b.onclick = () => {
    const it = list.find(x => x.uid === b.dataset.rf), before = itemIconURL(it), r = reforgeItem(run, it); if (r.err) return UI.toast(r.err, true);
    const h = it.holder && run.roster.find(x => x.uid === it.holder);
    TEL.event('reforge', { to: it.parts });
    UI.closeModal();
    UI.forge({ title: 'Item reforged', inputs: [before], out: itemIconURL(it), name: itemName(it), sub: h ? `for ${heroDisplayName(h)}` : 'Back in the stash', after: () => done([`${r.from} was reforged into ${itemName(it)}.`]) });
  }), 'wide');
}

function showVault() {
  const run = G.run; G.phase = 'vault'; const h = gooseSnatch(run); save();
  SFX.play('honk'); FX.shake(10); TEL.event('snatch', { id: h.id, s: run.siege });
  UI.modal(UI.vaultHTML(run, h), s => { s.querySelector('#vaultOk').onclick = () => toPrep(); }, 'wide');
}
function showFinale() {
  const run = G.run; G.phase = 'finale'; FX.shake(16); FX.flash('#c98aff', 0.5); SFX.play('roar');
  UI.modal(UI.finaleHTML(run), s => { s.querySelector('#finaleGo').onclick = () => { R.castleKey = null; toPrep(); UI.banner('The Shard War', 'Inside the great hall'); }; }, 'wide');
}
function toPrep() {
  if (vaultDue(G.run)) return showVault();
  UI.closeModal(); G.phase = 'prep'; G.B = null; UI.pendingGold = 0;
  // champions drawer stays tucked away unless someone is waiting on the bench
  UI.setRoster(G.run.siege > 1 && G.run.roster.every(h => h.place));
  for (const k in FXS) if (Array.isArray(FXS[k])) FXS[k].length = 0;
  changed();
  const run = G.run;
  if (run.finale === 'ready') {} else if (isBossSiege(run.siege)) UI.banner('Boss approaching', ENEMIES[bossFor(run.siege)].name);
  if (run.siege === techOpensAt('superanvil') && !run.tech.superanvil) setTimeout(() => { UI.banner('Super Anvil unlocked', "Build it in the Artificers' Hall"); SFX.play('level'); }, isBossSiege(run.siege) ? 2600 : 900);
  if (run.siege === 1) { setTimeout(() => { const u = G.prepUnits[0]; UI.coach('place', $('arenaWrap'), 'This is your champion. Drag them anywhere on the field, then press Begin siege. They fight on their own.'); UI.coach('begin', $('beginBtn'), 'Begin the siege here, or press Space.'); }, 500); }
  if (run.stash.some(it => !it.holder)) setTimeout(() => UI.coach('rail-armory', $('nav-armory'), 'You earned an item. Open the Armory to hand it to a champion.'), 400);
  if (Object.keys(TECH).some(k => techState(run, k) === 'open' && run.gold >= TECH[k].cost)) setTimeout(() => UI.coach('rail-hall', $('nav-hall'), "You have enough gold for castle tech. The Artificers' Hall is a tree: each build opens the next."), 500);
  if (run.siege === 2) setTimeout(() => UI.coach('rail-guild', $('nav-guild'), 'The Guild Hall is where you buy new champions. Each one costs more, so save gold between sieges.'), 600);
  // first time each run you can afford a champion: say so loudly (Cam)
  if (!run.paidDrafts && !run.draftNag && run.siege > 1 && run.roster.length < ROSTER_CAP && run.gold >= draftCost(run)) {
    run.draftNag = true; if (G.meta.seen) delete G.meta.seen['draft-ready'];
    setTimeout(() => { UI.banner('Champion ready to draft', `You have ${run.gold} gold. Visit the Guild Hall`); SFX.play('level'); UI.coach('draft-ready', $('nav-guild'), `You have enough gold to draft your first champion (${draftCost(run)} gold). Open the Guild Hall to recruit them.`); }, 350);
  }
}

// ----- actions -----
G.act = function (act, arg) {
  const run = G.run, meta = G.meta; let r;
  const hero = run.roster.find(h => h.uid === arg);
  const sel = run.roster.find(h => h.uid === G.selected);
  switch (act) {
    case 'give': { const it = run.stash.find(x => x.uid === arg); if (!it || !sel) return; r = giveItem(run, it, sel); if (r.err) return UI.toast(r.err, true);
      if (r.fused) { const u = G.prepUnits.find(p => p.inst === sel), f = r.fused;
        UI.forge({ inputs: [itemIconURL({ parts: [f.parts[0]] }), itemIconURL({ parts: [f.parts[1]] })], out: itemIconURL(f), name: itemName(f), sub: `for ${heroDisplayName(sel)}`,
          after: () => { if (u) { FX.particles(u.x, u.y - 8, 24, ['#ffcf3a', '#ffffff'], { spread: 18, up: true }); FX.text(u.x, u.y - 26, itemName(f), '#ffcf3a', true, true); } } });
        TEL.event('fuse', { parts: f.parts }); }
      else SFX.play('shield'); UI.coachDone('armory-give'); break; }
    case 'sa-pick': { UI.saSel = UI.saSel || []; if (UI.saSel.includes(arg)) UI.saSel = UI.saSel.filter(u => u !== arg); else { UI.saSel.push(arg); if (UI.saSel.length > 2) UI.saSel.shift(); } SFX.play('click'); UI.renderPage(); return; }
    case 'sa-forge': { const [a, b] = (UI.saSel || []).map(u => run.stash.find(x => x.uid === u)); const ins = [a, b].map(x => x && itemIconURL(x)); r = forgeSuper(run, a, b); if (r.err) return UI.toast(r.err, true); UI.saSel = [];
      UI.forge({ super: true, inputs: ins, out: itemIconURL(r.it, 4), name: itemName(r.it), sub: r.holder ? `for ${heroDisplayName(r.holder)}` : 'Added to the stash' }); TEL.event('superforge', { sup: r.it.sup, a: r.it.parts, b: r.it.sub.parts }); break; }
    case 'buydraft': { UI.coachDone('draft-ready'); if (G.phase !== 'prep') return; const c = run.roster.length >= ROSTER_CAP ? swapCost(run) : draftCost(run); if (run.gold < c) return UI.toast(`Drafting costs ${c} gold. Save up ${c - run.gold} more.`, true);
      run.gold -= c; run.paidDrafts = (run.paidDrafts || 0) + 1; run.recruitFrom = 'guild'; run.pendingDraft = draftOptions(run, meta); SFX.play('buy'); TEL.event('buydraft', { cost: c, n: run.paidDrafts }); UI.hud(); return showDraft(); }
    case 'unequip': { const it = run.stash.find(x => x.uid === arg); if (it) unequipItem(run, it); break; }
    case 'unforge': { const it = run.stash.find(x => x.uid === arg); r = unforgeItem(run, it); if (r.err) return UI.toast(r.err, true); SFX.play('click'); break; }
    case 'recipe': UI.recipeSel = UI.recipeSel === arg ? null : arg; UI.renderPage(); return;
    case 'techsel': UI.techSel = arg; UI.renderPage(); return;
    case 'tech': r = buyTech(run, meta, arg); if (r.err) return UI.toast(r.err, true); SFX.play('level'); UI.toast(`${TECH[arg].name} built.`); FX.shake(2); TEL.event('tech', { id: arg }); break;
    case 'repair': r = repairCastle(run); if (r.err) return UI.toast(r.err, true); SFX.play('hammer'); UI.toast(`Masons repaired ${r.a} castle HP.`); break;
    case 'h-items': UI.openPage('armory'); return;
    case 'pickhero': G.select(arg); return;
    case 'h-bench': hero.place = null; break;
    case 'h-jump': { const u = G.B && G.B.heroes.find(x => x.inst === hero); if (G.phase === 'siege' && rafterJump(G.B, u)) { TEL.event('jump', { id: hero.id, s: run.siege }); UI.renderInspector(); } return; }
    case 'h-sell': { if (UI.sellArm !== hero.uid) { UI.sellArm = hero.uid; UI.renderInspector(); return; } UI.sellArm = null; const nm = heroDisplayName(hero); r = sellHero(run, hero); if (r.err) return UI.toast(r.err, true);
      SFX.play('buy'); UI.toast(`${nm} heads home. +${r.gold} gold, items back in the Armory.`); TEL.event('sell', { id: hero.id, lv: hero.level }); G.selected = run.roster[0] && run.roster[0].uid; break; }
    case 'combo': { if (G.phase !== 'prep') return; const c = possibleCombos(run).find(c => c.key === arg); if (c && c.unpicked) return showComboForm(arg); toggleCombo(run, arg); SFX.play('click'); break; }
    case 'h-ascend': case 'ascend': { const hr = hero; if (!hr || G.phase !== 'prep') return; const from = RARITY[hr.rarity || 0].name; r = ascendHero(run, hr); if (r.err) return UI.toast(r.err, true);
      SFX.play('level'); FX.flash(RARITY[hr.rarity].col, 0.35); UI.banner(heroDisplayName(hr), `ascends from ${from} to ${RARITY[hr.rarity].name}`); TEL.event('ascend', { id: hr.id, to: hr.rarity }); break; }
    case 'h-place': autoPlace(run, hero); if (!hero.place) UI.toast('No free spot on the field.', true); break;
  }
  changed();
};
G.select = function (uid) { G.selected = uid; UI.renderRoster(); if (UI.page === 'armory') UI.renderPage(); };

// ----- placement / pointer -----
function toLogical(e) { const r = $('arena').getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height, inside: e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom }; }
function slotAt(p) {
  for (let i = 0; i < rafterSlots(G.run); i++) if (Math.abs(p.x - rafterPosition(G.run, i).x) <= 9 && p.y > rafterPosition(G.run, i).y - 22 && p.y < rafterPosition(G.run, i).y + 6) return { type: 'rafter', i };
  const c = Math.floor((p.x - GRID.x) / GRID.cell), r = Math.floor((p.y - GRID.y) / GRID.cell);
  if (c >= 0 && c < GRID.cols && r >= 0 && r < GRID.rows) return { type: 'grid', c, r };
  return null;
}
function slotOk(h, s) { if (!s) return false; if (s.type === 'rafter') return isRangedHero(h.id); return true; }
function occupant(s, except) { return G.run.roster.find(h => h !== except && h.place && h.place.type === s.type && (s.type === 'grid' ? h.place.c === s.c && h.place.r === s.r : h.place.i === s.i)); }
function placeHero(h, s) {
  if (h.vault) { UI.toast(`${heroDisplayName(h)} is stuck in the goose's nest.`, true); return; }
  const occ = occupant(s, h);
  if (occ) { if (h.place && slotOk(occ, h.place)) occ.place = h.place; else occ.place = null; }
  h.place = s.type === 'grid' ? { type: 'grid', c: s.c, r: s.r } : { type: 'rafter', i: s.i };
  SFX.play('click');
  const p = s.type === 'rafter' ? rafterPosition(G.run, s.i) : cellPos(s.c, s.r); FX.puff(p.x, p.y, 0.6);
}
function heroAtPoint(p) { for (const u of G.prepUnits.slice().reverse()) if (u.inst && Math.abs(p.x - u.x) <= 8 && p.y >= u.y - 19 && p.y <= u.y + 2) return u.inst; return null; }

G.cardDown = function (e, uid) {
  if (e.button > 0) return;
  const h = G.run.roster.find(x => x.uid === uid); if (!h) return;
  G.select(uid);
  if (G.phase !== 'prep') return;
  G.drag = { h, sx: e.clientX, sy: e.clientY, active: false, fromCard: true };
};
function armPower() {
  const B = G.B, run = G.run; if (!B || G.phase !== 'siege' || !run.castleEl || B.cpow.cd > 0) return;
  const kind = CASTLE_POWERS[run.castleEl].kind;
  if (kind === 'vortex' || kind === 'ham') { G.armed = G.armed === 'power' ? null : 'power'; SFX.play('click'); }
  else if (castCastlePower(B, 0, 0)) TEL.event('power', { el: run.castleEl, s: run.siege });
  UI.hud();
}
function canvasDown(e) {
  const p = toLogical(e); G.mouse = p;
  if (G.phase === 'siege' && G.B && G.armed === 'hammer') { if (castHammer(G.B, p.x, p.y)) { G.armed = null; UI.hud(); } return; }
  if (G.phase === 'siege' && G.B && G.armed === 'power') { if (castCastlePower(G.B, p.x, p.y)) { G.armed = null; UI.hud(); } return; }
  if (G.phase === 'siege' && G.B) { const u = G.B.heroes.find(u => u.alive && !u.temp && Math.abs(p.x - u.x) <= 8 && p.y >= u.y - 19 && p.y <= u.y + 2); if (u) { if (u.rafter && G.selected === u.inst.uid) { if (rafterJump(G.B, u)) UI.renderInspector(); } else G.select(u.inst.uid); } return; }
  if (G.phase !== 'prep') return;
  const h = heroAtPoint(p);
  if (h) { G.select(h.uid); G.drag = { h, sx: e.clientX, sy: e.clientY, active: false, fromCanvas: true }; }
}
function docMove(e) {
  const p = toLogical(e); if (p.inside) G.mouse = p;
  const d = G.drag; if (!d) { if (G.phase === 'prep' && p.inside) { const h = heroAtPoint(p); $('arena').style.cursor = h ? 'grab' : 'default'; } return; }
  if (!d.active && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 5) { d.active = true; $('ghost').src = portrait(heroSpriteKey(d.h)); }
  if (!d.active) return;
  d.overCanvas = p.inside;
  const gh = $('ghost'); gh.hidden = p.inside; gh.style.left = e.clientX + 'px'; gh.style.top = e.clientY + 'px';
  if (p.inside) { const s = slotAt(p); G.hover = s; G.hoverOk = slotOk(d.h, s); } else G.hover = null;
  rebuildPrepUnits();
}
function docUp(e) {
  const d = G.drag; if (!d) return; G.drag = null; $('ghost').hidden = true;
  const p = toLogical(e);
  if (d.active) {
    if (p.inside) { const s = slotAt(p); if (slotOk(d.h, s)) { placeHero(d.h, s); UI.coachDone('place'); } else if (s && s.type === 'rafter') UI.toast('Only ranged heroes can stand on the rafters.', true); }
    else { const r = $('roster').getBoundingClientRect(); if (e.clientY >= r.top && e.clientY <= r.bottom && d.h.place) { d.h.place = null; SFX.play('click'); } }
  }
  G.hover = null; changed();
}

// ----- main loop -----
let lastT = performance.now(), hudT = 0;
let statT = 0;
function frame(now) {
  const real = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  let dt = real;
  if (!G.paused && G.run) {
    if (FXS.hitstop > 0) { FXS.hitstop -= real; dt = real * 0.1; }
    else if (FXS.slowmo > 0) dt = real * 0.25;
    if (G.B && G.phase === 'siege') {
      const steps = G.speed; for (let i = 0; i < steps; i++) { stepBattle(G.B, dt); stepFX(dt); }
      if (G.B.done && G.phase === 'siege') endSiege();
    } else if (G.B && G.phase === 'over') { stepBattle(G.B, dt * 0.3); stepFX(dt); }
    else stepFX(dt);
    renderFrame({ run: G.run, B: G.phase === 'siege' || G.phase === 'over' || G.phase === 'report' ? G.B : null, prepUnits: G.prepUnits, selected: G.selected, hover: G.hover, hoverOk: G.hoverOk, hammerArmed: !!G.armed, mouse: G.mouse }, dt * (G.phase === 'siege' ? G.speed : 1));
    hudT += real; if (hudT > 0.15) { hudT = 0; UI.hud(); if (G.phase === 'siege') { UI.renderRoster(); UI.renderIntel(); statT = (statT || 0) + 1; if (statT % 3 === 0) UI.renderStats(); } }
  }
  if (TOWER.on) stepTower(real);
  requestAnimationFrame(frame);
}

// ----- title / meta -----
function showTitle() {
  G.paused = true;
  const has = !!(G.run && G.hasRun);
  const parade = ['brann', 'iria', 'vale', 'grukk', 'thessa', 'rattle', 'pip', 'fenn', 'ursa', 'croak'].map((id, i) => `<img class="px" src="${portrait('h:' + id + (i % 3 === 1 ? ':' + EL_KEYS[i] : ''))}" alt="" style="animation-delay:${i * 0.12}s">`).join('')
    + ['grunt', 'chicken', 'slime', 'goose', 'imp', 'yeti', 'cog'].map((id, i) => `<img class="px" src="${portrait('e:' + id)}" alt="" style="animation-delay:${i * 0.12 + 0.6}s">`).join('');
  const metaHTML = metaLedgerHTML();
  $('title').innerHTML = `<section class="hero"><canvas id="titleBg" class="px"></canvas><div class="hero-shade"></div>
    <div class="hero-in">
      <div class="logo"><span class="eyebrow-in">A castle defense auto battler</span><h1 data-t="Siege of Legends">Siege of Legends</h1><p>Fifty sieges. Ten hordes. One goose.</p></div>
      <div class="cta">${has ? `<button class="btn go" id="tContinue">Continue · Siege ${G.run.siege}</button>` : ''}
        <button class="btn ${has ? '' : 'primary go'}" id="tNew">${has ? 'Abandon and start a new run' : 'Begin a new run'}</button>
        <button class="btn ghost" id="tPlaytest">Playtest menu</button></div>
      <div class="records"><span>Highest keep <b>${G.meta.best} floors</b></span><span>Runs <b>${G.meta.runs}</b></span><span>Diamonds <b style="color:var(--sky)">${G.meta.diamonds}</b></span><span>Build <b>${VERSION}</b></span></div>
    </div>
    <button class="scrollcue" id="tDown">Keep Ledger and how to play ▾</button></section>
    <div class="wrap">
    <div class="parade">${parade}</div>
    <div class="fsrec"><span>Best played in fullscreen.</span><button class="btn small primary" id="tFs">⛶ Go fullscreen</button><small class="note">F toggles it anytime</small><button class="btn small" id="tIntro">▶ Replay intro</button></div>
    <section class="metabox" id="ledger">${metaHTML}</section>
    <div class="howto">
      <div><b>Fifty sieges, ten hordes</b>Every horde has a boss and a story. At the end of it all waits the Eternal Goose. Diamonds and class specs carry over between runs, so each attempt gets further.</div>
      <div><b>Recruit legends</b>Start with 2 legends at level 1. Every card rolls a rarity, from Common to God, and each boss you beat opens a rarer tier. Each rarity is +25% power, a bigger body and a stronger signature.</div>
      <div><b>Earn everything</b>No starting gold. Kills drop gold, foes drop items, and heroes level only by fighting. A legend who falls in a siege is gone for good.</div>
      <div><b>Signatures and elements</b>Signatures unlock at level 5 and grow every level. At level 7 each hero awakens an element; mixed elements form combos.</div>
      <div><b>Grow the keep</b>Fuse components into items in the Armory, climb the Artificers' tech tree, and at siege 15 your castle turns elemental.</div>
    </div></div>`;
  $('title').hidden = false;
  const t = $('title');
  wireLedger();
  $('tFs').onclick = () => UI.fullscreen();
  $('tPlaytest').onclick = () => { SFX.init(); showPlaytest(); };
  $('tDown').onclick = () => t.querySelector('.wrap').scrollIntoView({ behavior: 'smooth' });
  $('tIntro').onclick = () => startIntro(() => titleEnter());
  startTitleBg($('titleBg'));
  const c = $('tContinue'); if (c) c.onclick = () => { SFX.init(); G.paused = false; $('title').hidden = true; resumeRun(); };
  let armed = false;
  $('tNew').onclick = () => { SFX.init(); if (has && !armed) { armed = true; $('tNew').textContent = 'Click again to abandon this run'; $('tNew').classList.add('danger'); return; } if (has) TEL.runEnd(G.run, 'abandoned'); startRun(); };
}
// ----- Keep Ledger: meta progression in tabs -----
const META_TABS = [['keep', 'Castle'], ['champs', 'Champions'], ['specs', 'Class specs'], ['ach', 'Achievements']];
const META_GROUP = { masonry: 'keep', hammer: 'keep', chest: 'keep', drills: 'champs', codex: 'champs', banners: 'champs', muster: 'champs', veterans: 'champs' };
let LEDGER_TAB = 'keep';
function metaLedgerHTML() {
  const M0 = G.meta; M0.spec = M0.spec || {}; M0.ach = M0.ach || {};
  const spent = metaSpent(M0), achN = ACHIEVEMENTS.filter(a => M0.ach[a.id]).length;
  let h = `<header><div><span class="eyebrow">Paid in diamonds · kept forever · ${spent} spent so far</span><h2>The Keep Ledger</h2></div><div class="coinbox num" style="font-size:22px;color:var(--sky)">${DIA(M0.diamonds)}</div></header>
    <nav class="ltabs">${META_TABS.map(([k, n]) => `<button class="ltab ${LEDGER_TAB === k ? 'on' : ''}" data-ltab="${k}">${n}${k === 'ach' ? ` <small>${achN}/${ACHIEVEMENTS.length}</small>` : ''}</button>`).join('')}</nav>`;
  if (LEDGER_TAB === 'keep' || LEDGER_TAB === 'champs') {
    h += `<div class="metagrid">`;
    for (const [k, M] of Object.entries(META)) { if (META_GROUP[k] !== LEDGER_TAB) continue; const lv = M0.ranks[k] || 0, max = lv >= M.max, c = M.cost(lv);
      h += `<div class="card"><div class="row between"><h4>${esc(M.name)}</h4><span class="tier">${lv}/${M.max}</span></div><div class="pips">${Array.from({ length: M.max }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</div><p>${esc(M.desc(lv))}</p>
        ${max ? '<span class="chip">Mastered</span>' : `<button class="btn small ${M0.diamonds >= c ? 'primary' : ''}" data-meta="${k}" ${M0.diamonds < c ? 'disabled' : ''}>Upgrade ${DIA(c)}</button>`}</div>`; }
    h += `</div>`;
  } else if (LEDGER_TAB === 'specs') {
    h += `<p class="note">Each class picks one path. <b>Bigger</b> makes every champion of that class hit harder with their own signature. <b>Different</b> swaps their signature for a new class ability. Rank 1 unlocks the path, ranks 2 and 3 make it stronger. You can switch paths for free and keep your ranks.</p><div class="specgrid">`;
    for (const [cls, SP] of Object.entries(SPECS)) { const C = CLASSES[cls], cur = M0.spec[cls] || { path: null, rank: 0 }, r = cur.rank || 0, next = SPEC_COST[r];
      const path = (key, label) => { const P = SP[key], on = cur.path === key && r > 0;
        return `<button class="spath ${on ? 'on' : ''}" data-spath="${cls}:${key}" ${r === 0 ? 'disabled' : ''}><span class="eyebrow">${label}</span><b>${esc(P.name)}</b><span>${esc(P.desc(Math.max(1, on ? r : r || 1)))}</span>${on ? '<em>Active</em>' : r ? '<em>Switch</em>' : ''}</button>`; };
      h += `<div class="spec card"><div class="row between"><h4>${C.icon} ${esc(C.name)}</h4><span class="tier">Rank ${r}/3</span></div>
        <div class="pips">${[0, 1, 2].map(i => `<i class="${i < r ? 'on' : ''}"></i>`).join('')}</div>
        <div class="spaths">${path('a', 'Bigger')}${path('b', 'Different')}</div>
        ${r >= 3 ? '<span class="chip">Mastered</span>' : r === 0 ? `<div class="row"><button class="btn small ${M0.diamonds >= next ? 'primary' : ''}" data-spec="${cls}:a" ${M0.diamonds < next ? 'disabled' : ''}>Learn Bigger ${DIA(next)}</button><button class="btn small ${M0.diamonds >= next ? 'primary' : ''}" data-spec="${cls}:b" ${M0.diamonds < next ? 'disabled' : ''}>Learn Different ${DIA(next)}</button></div>`
          : `<button class="btn small ${M0.diamonds >= next ? 'primary' : ''}" data-spec="${cls}:${cur.path}" ${M0.diamonds < next ? 'disabled' : ''}>Rank ${r + 1} ${DIA(next)}</button>`}</div>`; }
    h += `</div>`;
  } else {
    const groups = [...new Set(ACHIEVEMENTS.map(a => a.group))];
    for (const g of groups) { h += `<div class="group-title">${esc(g)}</div><div class="achgrid">`;
      for (const a of ACHIEVEMENTS.filter(x => x.group === g)) { const got = !!M0.ach[a.id]; h += `<div class="ach ${got ? 'got' : ''}"><b>${got ? '✓ ' : ''}${esc(a.name)}</b><span>${esc(a.desc)}</span><em>${DIA(a.dia)}</em></div>`; }
      h += `</div>`; }
    h += `<p class="note">Achievements are the only way to earn diamonds. Each pays once, when the run ends. All of them together pay exactly enough to buy every upgrade in the ledger.</p>`;
  }
  return h;
}
function metaSpent(M0) { let n = 0; for (const [k, M] of Object.entries(META)) for (let l = 0; l < (M0.ranks[k] || 0); l++) n += M.cost(l); for (const c in M0.spec || {}) for (let l = 0; l < (M0.spec[c].rank || 0); l++) n += SPEC_COST[l]; return n; }
function wireLedger() {
  const L = $('ledger'); if (!L) return; const redraw = () => { L.innerHTML = metaLedgerHTML(); wireLedger(); const r = document.querySelector('.records b[style]'); if (r) r.textContent = G.meta.diamonds; };
  L.querySelectorAll('[data-ltab]').forEach(b => b.onclick = () => { LEDGER_TAB = b.dataset.ltab; SFX.init(); SFX.play('click'); redraw(); });
  L.querySelectorAll('[data-meta]').forEach(b => b.onclick = () => { const k = b.dataset.meta, c = META[k].cost(G.meta.ranks[k] || 0); if (G.meta.diamonds < c) return; G.meta.diamonds -= c; G.meta.ranks[k] = (G.meta.ranks[k] || 0) + 1; SFX.init(); SFX.play('level'); save(); redraw(); });
  L.querySelectorAll('[data-spec]').forEach(b => b.onclick = () => { const [cls, path] = b.dataset.spec.split(':'), cur = G.meta.spec[cls] || { path, rank: 0 }, c = SPEC_COST[cur.rank || 0]; if (c == null || G.meta.diamonds < c) return;
    G.meta.diamonds -= c; G.meta.spec[cls] = { path, rank: (cur.rank || 0) + 1 }; SFX.init(); SFX.play('level'); TEL.event('spec', { cls, path, rank: G.meta.spec[cls].rank }); save(); redraw(); });
  L.querySelectorAll('[data-spath]').forEach(b => b.onclick = () => { const [cls, path] = b.dataset.spath.split(':'); const cur = G.meta.spec[cls]; if (!cur || !cur.rank) return; cur.path = path; SFX.init(); SFX.play('click'); save(); redraw(); });
}
// ----- playtest menu: jump to any siege with any castle. A bot plays the sieges before it. -----
const PT = { siege: 15, el: null, hz: '', gold: 0, style: 'balanced' };
function showPlaytest() {
  UI.modal(UI.playtestHTML(PT), s => {
    const sync = () => { s.querySelector('#ptSiegeV').textContent = PT.siege; s.querySelector('#ptSiegeInfo').textContent = UI.siegeBlurb(PT.siege); };
    s.querySelector('#ptSiege').oninput = e => { PT.siege = +e.target.value; sync(); };
    s.querySelectorAll('[data-ptsiege]').forEach(b => b.onclick = () => { PT.siege = +b.dataset.ptsiege; s.querySelector('#ptSiege').value = PT.siege; sync(); });
    s.querySelectorAll('[data-ptel]').forEach(b => b.onclick = () => { PT.el = b.dataset.ptel || null; s.querySelectorAll('[data-ptel]').forEach(x => x.classList.toggle('on', x === b)); SFX.play('click'); });
    s.querySelector('#ptHz').onchange = e => PT.hz = e.target.value; s.querySelector('#ptGold').onchange = e => PT.gold = +e.target.value; s.querySelector('#ptStyle').onchange = e => PT.style = e.target.value;
    s.querySelector('#ptCancel').onclick = () => UI.closeModal();
    s.querySelector('#ptGo').onclick = () => startPlaytest(s);
    sync();
  }, 'wide');
}
function startPlaytest(s) {
  const go = s.querySelector('#ptGo'), msg = s.querySelector('#ptMsg'); go.disabled = true; s.querySelector('#ptCancel').disabled = true;
  const P = playtestStart(G.meta, PT.siege, PT.style, PT.el);
  // mute effects while the bot plays: no banners, sounds or shakes from sieges nobody is watching
  const saved = {}; for (const k in FX) if (typeof FX[k] === 'function') { saved[k] = FX[k]; FX[k] = () => {}; }
  const unmute = () => Object.assign(FX, saved);
  const tick = () => {
    let done = false; try { const t0 = performance.now(); do { done = playtestStep(P); } while (!done && performance.now() - t0 < 120); }
    catch (e) { unmute(); go.disabled = false; msg.textContent = 'The bot tripped: ' + e.message; console.error(e); return; }
    msg.textContent = done ? 'Ready.' : `The bot is playing siege ${P.run.siege} of ${PT.siege}…`;
    if (!done) return setTimeout(tick, 0);
    unmute(); for (const k in FXS) if (Array.isArray(FXS[k])) FXS[k].length = 0;
    const run = P.run; run.gold += PT.gold; if (PT.hz) run.mods.hz = PT.hz; R.castleKey = null; R.bg = {};
    G.run = run; G.hasRun = true; G.B = null; G.selected = run.roster[0] && run.roster[0].uid; UI.pendingGold = 0; G.lastEnc = []; G.paused = false;
    TEL.runStart(run); TEL.event('playtest', { siege: PT.siege, el: run.castleEl, hz: PT.hz, gold: PT.gold, style: PT.style, losses: P.losses });
    $('title').hidden = true; UI.closeModal();
    if (PT.siege === 1) { G.phase = 'prep'; changed(); toPrep(); return; }
    toPrep(); UI.banner(`Playtest: siege ${run.siege}`, run.castleEl ? `${ELEMENTS[run.castleEl].name} Castle` : FACTIONS[factionIndex(run.siege)].name);
  };
  msg.textContent = 'The bot is getting started…'; setTimeout(tick, 30);
}

function titleEnter() { const t = $('title'); t.classList.remove('enter'); void t.offsetWidth; t.classList.add('enter'); }

function resumeRun() {
  const run = G.run;
  if (run.lastRep) return showReport(run.lastRep);
  if (run.pendingDraft || run.pendingSummon || (run.post && run.post.length) || run.roster.some(needsElement)) { if (run.pendingDraft && run.post[0] !== 'draft') run.post.unshift('draft'); if (run.pendingLoot && run.post[0] !== 'loot') run.post.unshift('loot'); if (run.pendingCastle && run.post[0] !== 'castle') run.post.unshift('castle'); if (run.pendingSummon && !run.post.includes('summon')) run.post.unshift('summon'); return nextPost(); }
  if (vaultDue(run)) return showVault();
  G.phase = 'prep'; changed();
}

// ----- input wiring -----
function wire() {
  const cv = $('arena');
  cv.addEventListener('pointerdown', canvasDown);
  cv.addEventListener('contextmenu', e => { if (G.armed) { e.preventDefault(); G.armed = null; UI.hud(); } });
  cv.addEventListener('pointerleave', () => { if (!G.drag) G.mouse = null; });
  document.addEventListener('pointermove', docMove);
  document.addEventListener('pointerup', docUp);
  $('beginBtn').onclick = () => { SFX.init(); beginSiege(); };
  $('sp1').onclick = () => { G.speed = 1; UI.hud(); };
  $('sp2').onclick = () => { G.speed = 2; UI.hud(); };
  $('sp4').onclick = () => { G.speed = 4; UI.hud(); };
  $('hammerBtn').onclick = () => { if (G.B && G.B.hammer.cd <= 0) { G.armed = G.armed === 'hammer' ? null : 'hammer'; SFX.play('click'); UI.hud(); } };
  $('powerBtn').onclick = () => { armPower(); UI.coachDone('power'); };
  $('repairBtn').onclick = () => { SFX.init(); G.act('repair'); };
  $('soundBtn').onclick = () => { SFX.init(); SFX.on = !SFX.on; $('soundBtn').textContent = SFX.on ? 'Sound on' : 'Sound off'; $('soundBtn').setAttribute('aria-pressed', String(SFX.on)); try { localStorage.setItem('manatorium.sound', SFX.on ? '1' : '0'); } catch (e) { } };
  $('menuBtn').onclick = () => showTitle();
  document.addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('input,textarea,select')) return;
    if ((e.key === 'n' || e.key === 'N') && $('title').hidden && !TOWER.on) { e.preventDefault(); NOTES.open(); return; }
    if (!$('modal').hidden || !$('title').hidden || TOWER.on) return;
    if (e.code === 'Space' && G.phase === 'prep') { e.preventDefault(); SFX.init(); beginSiege(); }
    else if (e.key === 'f' || e.key === 'F') UI.fullscreen();
    else if (e.key === 'c' || e.key === 'C') UI.setRoster(!$('roster').classList.contains('collapsed'));
    else if (e.key === 's' || e.key === 'S') UI.setIntel($('intel').classList.contains('closed'));
    else if (e.key === '1') { G.speed = 1; UI.hud(); } else if (e.key === '2') { G.speed = 2; UI.hud(); } else if (e.key === '4') { G.speed = 4; UI.hud(); }
    else if ((e.key === 'q' || e.key === 'Q') && G.B && G.phase === 'siege' && G.B.hammer.cd <= 0) { G.armed = G.armed === 'hammer' ? null : 'hammer'; UI.hud(); }
    else if (e.key === 'e' || e.key === 'E') armPower();
    else if (e.key === 'Escape') { if (G.armed) { G.armed = null; UI.hud(); } else if (UI.page) UI.openPage(null); }
  });
  window.addEventListener('resize', () => resizeRender());
  document.addEventListener('pointerdown', () => SFX.init(), { once: true });
}

function boot(hotData) {
  buildAllSprites();
  for (const [k, s] of Object.entries(VISITORS)) buildSprite('npc:' + k, s, false);
  UI.init(); initRender($('arena')); wire();
  try { if (localStorage.getItem('manatorium.sound') === '0') { SFX.on = false; $('soundBtn').textContent = 'Sound off'; } } catch (e) { }
  const d = (hotData && hotData.meta && hotData.v === 2) ? hotData : load();
  G.meta = Object.assign(newMeta(), (d && d.meta) || {});
  if (!G.meta.ranks) G.meta.ranks = {}; if (!G.meta.seen) G.meta.seen = {};
  if (d && d.run && d.run.v === 2) { G.run = d.run; G.hasRun = true; uidN = 1000 + Math.floor(Math.random() * 1000); }
  else { G.run = newRun(G.meta); G.hasRun = false; }
  G.phase = 'title';
  rebuildPrepUnits(); UI.refresh();
  showTitle();
  // the opening cinematic plays over the title on a fresh load (not on hot reloads); ?nointro skips it
  // first the Noobscrub Games splash, then the cinematic; ?nointro skips both
  if (!hotData && !/[?&]nointro/.test(location.search)) startSplash(() => startIntro(() => titleEnter())); else titleEnter();
  requestAnimationFrame(t => { lastT = t; frame(t); });
  window.claude?.hot?.snapshot?.(() => ({ v: 2, meta: G.meta, run: G.hasRun ? G.run : null }));
  try { document.fonts && document.fonts.load('600 16px "Fredoka"'); } catch (e) { }
  TEL.init();
}
