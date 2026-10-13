// ===== Bot agents: headless full runs with the real sim (Node tool + in-game Sim Lab) =====
const BOT_STYLES = {
  brawler:  { name: 'Brawler',  focus: 'ad',  comps: ['sword', 'bow', 'glove', 'belt'], techs: ['vault1', 'ballista1', 'walls1', 'drill', 'ballista2', 'scav', 'pulleys', 'trophy', 'wells', 'fountain', 'rafters1', 'vault2', 'college', 'ballista3', 'hammer2', 'walls2', 'kiln', 'superanvil'], desc: 'Drafts high Attack rolls, stacks swords, bows and gloves.' },
  arcanist: { name: 'Arcanist', focus: 'ap',  comps: ['rod', 'tear', 'rod', 'glove'],     techs: ['wells', 'vault1', 'resonance', 'lab', 'walls1', 'focus', 'prism', 'drill', 'ballista1', 'scav', 'aether', 'fountain', 'rafters1', 'college', 'trophy', 'superanvil'], desc: 'Drafts high Ability power, rushes signatures and combos.' },
  bulwark:  { name: 'Bulwark',  focus: 'def', comps: ['vest', 'belt', 'cloak', 'tear'],   techs: ['walls1', 'fountain', 'vault1', 'rafters1', 'ballista1', 'walls2', 'drill', 'rafters2', 'bastion', 'resonance', 'ballista2', 'scav', 'college', 'superanvil'], desc: 'Drafts high Defense, builds walls and tanky items.' },
  balanced: { name: 'Balanced', focus: null,  comps: null,                                 techs: ['vault1', 'walls1', 'wells', 'ballista1', 'drill', 'scav', 'fountain', 'resonance', 'lab', 'rafters1', 'pulleys', 'trophy', 'prism', 'focus', 'vault2', 'college', 'walls2', 'ballista2', 'aether', 'superanvil'], desc: 'Takes the best total rolls and spreads its gold.' },
  crit:     { name: 'Crit Ranger', focus: 'ad', cls: 'ranger', comps: ['glove', 'glove', 'bow', 'sword'], techs: ['rafters1', 'vault1', 'ballista1', 'walls1', 'drill', 'rafters2', 'scav', 'wells', 'fountain', 'superanvil'], desc: 'Stacks crit on rangers and parks them in the rafters, like Cam\'s run.' },
  chaos:    { name: 'Chaos',    focus: null,  comps: null,                                 techs: null, desc: 'Picks at random. The baseline for "a new player clicking things".' },
};

function botScoreOpt(style, o) {
  const S = BOT_STYLES[style]; if (style === 'chaos') return Math.random();
  const r = o.rolls, sum = r.ad + r.ap + r.def;
  return (S.focus ? r[S.focus] * 2.2 : 0) + sum + HERO_BY_ID[o.id].tier * 5 + (S.cls && HERO_BY_ID[o.id].cls === S.cls ? 12 : 0) + Math.random();
}
// ----- itemizing: pick one carry, build finished items for it first, then the rest of the cast -----
const CARRY_COMPS = { ap: ['rod', 'tear', 'glove'], ranger: ['bow', 'sword', 'glove'], ad: ['sword', 'bow', 'glove', 'belt'], tank: ['vest', 'belt', 'cloak'] };
function botKind(h) { const c = HERO_BY_ID[h.id].cls; return c === 'mage' || c === 'cleric' ? 'ap' : c === 'ranger' ? 'ranger' : c === 'guardian' ? 'tank' : h.rolls.ap > h.rolls.ad + 2 ? 'ap' : 'ad'; }
function botFin(run, h) { return heroItems(run, h).filter(i => i.parts.length === 2).length; }
function botCarryScore(run, style, h) {
  const S = BOT_STYLES[style], k = botKind(h), d = HERO_BY_ID[h.id];
  return (k === 'tank' || d.cls === 'cleric' ? -40 : 0) + h.level * 3 + (k === 'ap' ? h.rolls.ap : h.rolls.ad) + d.tier * 4 + (S.cls && d.cls === S.cls ? 30 : 0)
    + (S.focus === 'ap' && k === 'ap' ? 15 : 0) + (S.focus === 'ad' && (k === 'ad' || k === 'ranger') ? 10 : 0)
    + (h.uid === run.botCarry ? 8 : 0) + botFin(run, h) * 6;
}
// carry first, then everyone else by how good a carry they would be
function botItemOrder(run, style) {
  const o = run.roster.slice().sort((a, b) => botCarryScore(run, style, b) - botCarryScore(run, style, a));
  run.botCarry = o[0] && o[0].uid; return o;
}
function botPairScore(h, a, b) { const w = CARRY_COMPS[botKind(h)]; return (w.includes(a) ? 2 : 0) + (w.includes(b) ? 2 : 0) + (a === b && w.includes(a) ? 0.5 : 0) + (a === 'spatula' || b === 'spatula' ? 1 : 0); }
function botGiveItems(run, style) {
  if (style === 'chaos') {
    for (const it of run.stash.filter(x => !x.holder)) {
      const heroes = run.roster.slice().sort((a, b) => b.level - a.level);
      const fuse = it.parts.length === 1 && heroes.find(h => heroItems(run, h).some(x => x.parts.length === 1));
      const target = fuse || heroes.find(h => h.items.length < ITEM_SLOTS);
      if (target) giveItem(run, it, target);
    }
    return;
  }
  const order = botItemOrder(run, style), loose = () => run.stash.filter(x => !x.holder);
  // finished items go to the first hero in line with a free slot
  for (const it of loose().filter(x => x.parts.length === 2)) { const h = order.find(h => h.items.length < ITEM_SLOTS); if (h) giveItem(run, it, h); }
  // components: complete half-built items first, then hand out whole pairs so they fuse at once
  for (const h of order) {
    let comps = loose().filter(x => x.parts.length === 1);
    const lone = heroItems(run, h).find(x => x.parts.length === 1);
    if (lone && comps.length) { const best = comps.slice().sort((x, y) => botPairScore(h, lone.parts[0], y.parts[0]) - botPairScore(h, lone.parts[0], x.parts[0]))[0]; giveItem(run, best, h); comps = loose().filter(x => x.parts.length === 1); }
    while (comps.length >= 2 && h.items.length < ITEM_SLOTS) {
      let bp = null, bs = -1;
      for (let i = 0; i < comps.length; i++) for (let j = i + 1; j < comps.length; j++) { const sc = botPairScore(h, comps[i].parts[0], comps[j].parts[0]); if (sc > bs) { bs = sc; bp = [comps[i], comps[j]]; } }
      giveItem(run, bp[0], h); giveItem(run, bp[1], h); comps = loose().filter(x => x.parts.length === 1);
    }
  }
  // a single leftover component waits on the first hero with room, ready to fuse next time
  for (const it of loose().filter(x => x.parts.length === 1)) { const h = order.find(h => h.items.length < ITEM_SLOTS && !heroItems(run, h).some(x => x.parts.length === 1)); if (h) giveItem(run, it, h); }
  // late game: the carry forges its two best finished items into a super item
  const c = order[0];
  if (c && superAnvilOpen(run) && run.gold >= SUPER_COST + 20 && !heroItems(run, c).some(x => x.sup)) {
    const fin = heroItems(run, c).filter(x => x.parts.length === 2 && !x.sup);
    if (fin.length >= 2) { fin.sort((x, y) => botPairScore(c, ...y.parts) - botPairScore(c, ...x.parts)); forgeSuper(run, fin[0], fin[1]); }
  }
}
// bots save for drafts on roughly the old free schedule (3 by siege 5, 4 by 9, 5 by 11, then one per boss)
function botRosterGoal(s) { return s <= 1 ? 1 : s <= 4 ? 2 : s <= 8 ? 3 : s <= 10 ? 4 : Math.min(ROSTER_CAP, 5 + Math.floor((s - 11) / 5)); }
function botBuyDrafts(run, draft) { while (run.roster.length >= 2 && run.roster.length < ROSTER_CAP && run.gold >= draftCost(run)) { run.gold -= draftCost(run); run.paidDrafts = (run.paidDrafts || 0) + 1; draft(); } }
function botShop(run, meta, style) {
  const S = BOT_STYLES[style];
  if (run.castle.hp < run.castle.max * 0.4) repairCastle(run);
  const keep = run.roster.length < botRosterGoal(run.siege + 1) ? draftCost(run) : 0;
  for (let g = 0; g < 20; g++) {
    let ids = S.techs || Object.keys(TECH).sort(() => Math.random() - 0.5);
    ids = ids.concat(Object.keys(TECH).filter(k => TECH[k].secret));
    const id = ids.find(k => TECH[k] && techState(run, k) === 'open' && run.gold - keep >= TECH[k].cost);
    if (!id || (style === 'chaos' && Math.random() < 0.3)) break;
    buyTech(run, meta, id);
  }
  if (run.castle.hp < run.castle.max * 0.6) repairCastle(run);
}
function botPickLoot(run, style, opts) {
  if (style === 'chaos') return pick(opts);
  // shop for the first hero in line who still needs finished items
  const order = botItemOrder(run, style), h = order.find(h => botFin(run, h) < ITEM_SLOTS) || order[0];
  if (!h) return opts[0];
  const w = CARRY_COMPS[botKind(h)], lone = heroItems(run, h).find(x => x.parts.length === 1) || run.stash.find(x => !x.holder && x.parts.length === 1);
  const sc = o => o.parts.length === 2 ? botPairScore(h, ...o.parts) + 3 : (w.includes(o.parts[0]) ? 2 : 0) + (lone ? botPairScore(h, lone.parts[0], o.parts[0]) * 0.5 : 0) + Math.random() * 0.1;
  return opts.slice().sort((a, b) => sc(b) - sc(a))[0];
}
function botElement(run, style, h, opts) {
  const S = BOT_STYLES[style];
  if (!S.focus) { if (style === 'chaos') return pick(opts); const best = STAT_KEYS.slice().sort((a, b) => h.rolls[b] - h.rolls[a])[0]; return opts.find(e => ELEMENTS[e].style === best) || opts[0]; }
  return opts.find(e => ELEMENTS[e].style === S.focus) || opts[0];
}
function botBattle(B, dt, maxT) {
  let t = 0;
  while (!B.done && t < maxT) {
    stepBattle(B, dt); t += dt;
    if (B.hammer.cd <= 0 && !B.hammer.pending) { const e = densest(B.enemies.filter(e => e.x < 360), 30); if (e) castHammer(B, e.x, e.y); }
    if (B.run.castleEl && B.cpow.cd <= 0) { const e = densest(B.enemies, 40); if (e && (B.enemies.filter(x => x.alive).length > 5 || e.boss)) castCastlePower(B, e.x, e.y); }
  }
  if (!B.done) B.done = 'timeout';
  return t;
}
// spends a diamond budget the way a typical player might: always the cheapest next upgrade, specs on a random path
function botMeta(budget) {
  const meta = newMeta(); meta.spec = {}; let left = budget;
  for (let g = 0; g < 200; g++) {
    const opts = [];
    for (const [k, M] of Object.entries(META)) { const l = meta.ranks[k] || 0; if (l < M.max) opts.push({ c: M.cost(l), buy: () => { meta.ranks[k] = l + 1; } }); }
    for (const cls of Object.keys(SPECS)) { const cur = meta.spec[cls] || { path: Math.random() < 0.5 ? 'a' : 'b', rank: 0 }; if (cur.rank < 3) opts.push({ c: SPEC_COST[cur.rank], buy: () => { meta.spec[cls] = { path: cur.path, rank: cur.rank + 1 }; } }); }
    opts.sort((a, b) => a.c - b.c + (Math.random() - 0.5) * 6); const o = opts.find(o => o.c <= left); if (!o) break; left -= o.c; o.buy();
  }
  return meta;
}
// one full run. opts: { dt, maxSiege, onSiege }
function botPlayRun(style, meta, opts = {}) {
  const dt = opts.dt || 1 / 30, maxSiege = Math.min(opts.maxSiege || FINAL_SIEGE, FINAL_SIEGE);
  const run = newRun(meta); const log = [];
  const draft = () => { const os = draftOptions(run, meta); const o = os.slice().sort((a, b) => botScoreOpt(style, b) - botScoreOpt(style, a))[0]; addDraftedHero(run, o); };
  draft();
  let cause = 'cap';
  while (run.siege <= maxSiege) {
    botBuyDrafts(run, draft); botGiveItems(run, style); botShop(run, meta, style);
    for (const h of run.roster) if (!h.place) autoPlace(run, h);
    const B = startBattle(run, meta);
    const t = botBattle(B, dt, 420);
    if (B.done !== 'victory') { cause = B.done === 'timeout' ? 'stalled' : B.bossUnit && B.bossUnit.alive ? 'boss' : 'horde'; break; }
    const rep = finishSiege(run, meta, B);
    if (opts.onSiege) opts.onSiege(run, rep);
    if (rep.siege >= FINAL_SIEGE) { cause = 'won'; run.won = true; break; }
    log.push({ s: rep.siege, t: Math.round(t), lv: run.roster.map(h => h.level), castle: Math.round(100 * run.castle.hp / run.castle.max), gold: run.gold, deaths: rep.heroes.filter(h => !h.alive).length });
    if (LOOT_AFTER(rep.siege)) { const lo = lootOptions(run, meta); takeLoot(run, botPickLoot(run, style, lo)); }
    for (const h of run.roster) if (needsElement(h)) h.el = botElement(run, style, h, elementOptions(run, meta, h));
    if (run.roster.length < 2) draft();
    botBuyDrafts(run, draft);
    if (rep.siege === CASTLE_SIEGE && !run.castleEl) run.castleEl = pick(castleOptions(run));
    run.post = []; const st = storyChapter(run); if (st) { if (st.p === 1) run.mood = 0; run.storySeen = [...(run.storySeen || []), st.id]; } const enc = drawEncounter(run); resolveEncounter(run, meta, pick(enc.opts).fx); if (run.pendingReforge) { run.pendingReforge = false; const l = reforgeable(run); if (l.length) reforgeItem(run, pick(l)); }
    if (run.post.includes('draft') && run.roster.length < ROSTER_CAP) draft(); run.post = []; run.recruitFrom = null;
  }
  return { style, reached: run.siege, cause, log, heroes: run.roster.map(h => ({ id: h.id, lv: h.level, el: h.el, rolls: h.rolls, items: heroItems(run, h).map(i => i.parts.join('+')) })), castleEl: run.castleEl,
    techs: Object.keys(run.tech), gold: run.gold, combos: activeCombos(run).map(c => c.name), diamonds: diamondsForRun(run) };
}
function summarizeBots(results) {
  const by = {};
  for (const r of results) (by[r.style] = by[r.style] || []).push(r);
  const out = {};
  for (const [k, rs] of Object.entries(by)) {
    const reached = rs.map(r => r.reached).sort((a, b) => a - b);
    const lvAt = s => { const v = rs.map(r => r.log.find(l => l.s === s)).filter(Boolean).map(l => Math.max(...l.lv)); return v.length ? +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : null; };
    const causes = {}; for (const r of rs) causes[r.cause] = (causes[r.cause] || 0) + 1;
    const els = {}; for (const r of rs) for (const h of r.heroes) if (h.el) els[h.el] = (els[h.el] || 0) + 1;
    out[k] = { runs: rs.length, avg: +(reached.reduce((a, b) => a + b, 0) / rs.length).toFixed(1), median: reached[Math.floor(reached.length / 2)], best: reached[reached.length - 1], worst: reached[0],
      lv5: lvAt(5), lv10: lvAt(10), lv15: lvAt(15), lv20: lvAt(20), causes, elements: els, reached };
  }
  return out;
}

// ----- playtest setup: a bot plays a run up to the siege you pick, so the roster, items, tech and gold look like a real run there.
// A lost siege doesn't stop it (the bot is waved through), so it always arrives. Call playtestStep once per siege.
function playtestStart(meta, target, style, el) {
  const run = newRun(meta); run.playtest = true; if (el) run.castleEl = el;
  const draft = () => { const os = draftOptions(run, meta); const o = os.slice().sort((a, b) => botScoreOpt(style, b) - botScoreOpt(style, a))[0]; addDraftedHero(run, o); };
  draft(); return { run, meta, style, target, draft, losses: 0 };
}
function playtestStep(P) {
  const { run, meta, style, draft } = P; if (run.siege >= P.target) return true;
  botBuyDrafts(run, draft); botGiveItems(run, style); botShop(run, meta, style);
  for (const h of run.roster) if (!h.place) autoPlace(run, h);
  const B = startBattle(run, meta); botBattle(B, 1 / 20, 420);
  if (B.done !== 'victory') { P.losses++; if (B.bossUnit && B.bossUnit.alive) B.bossKilled = B.bossUnit.def.boss;
    for (const e of B.enemies) e.alive = false; B.queue = []; run.castle.hp = Math.max(run.castle.hp, run.castle.max * 0.6); B.done = 'victory'; }
  const rep = finishSiege(run, meta, B);
  if (LOOT_AFTER(rep.siege)) { const lo = lootOptions(run, meta); takeLoot(run, botPickLoot(run, style, lo)); }
  for (const h of run.roster) if (needsElement(h)) h.el = botElement(run, style, h, elementOptions(run, meta, h));
  if (run.roster.length < 2) draft();
  botBuyDrafts(run, draft);
  if (rep.siege === CASTLE_SIEGE && !run.castleEl) run.castleEl = pick(castleOptions(run));
  run.post = []; const st = storyChapter(run); if (st) { if (st.p === 1) run.mood = 0; run.storySeen = [...(run.storySeen || []), st.id]; }
  resolveEncounter(run, meta, pick(drawEncounter(run).opts).fx); if (run.pendingReforge) { run.pendingReforge = false; const l = reforgeable(run); if (l.length) reforgeItem(run, pick(l)); }
  if (run.post.includes('draft') && run.roster.length < ROSTER_CAP) draft(); run.post = []; run.recruitFrom = null; run.mods = {};
  botGiveItems(run, style); for (const h of run.roster) if (!h.place) autoPlace(run, h);
  return run.siege >= P.target;
}
