// ===== Run & meta state (no DOM) =====
let uidN = 1;
const nuid = () => 'u' + (uidN++) + Math.random().toString(36).slice(2, 5);

function newMeta() { return { diamonds: 0, ranks: {}, best: 0, runs: 0, totalFloors: 0, seen: {} }; }

function rafterSlots(run) { return run.tech.rafters1 ? (run.tech.rafters2 ? 3 : 1) : 0; }
function castleMaxFor(run, meta) { return Math.round(1000 * (1 + 0.15 * (meta.ranks.masonry || 0)) * (run.tech.walls1 ? 1.25 : 1) * (run.tech.walls2 ? 1.35 : 1) * (run.tech.bastion ? 1.3 : 1) * (run.mods.maxhp || 1) * (run.maxhpMul || 1) * castleGrowth(run)); }
// every boss slain makes the keep bigger: +30% max HP each, compounding
function castleGrowth(run) { return Math.pow(1.3, castleTier(run)); }
function castleTier(run) { return run.stats && run.stats.bosses ? run.stats.bosses.length : 0; }

function newRun(meta) {
  const run = { v: 2, runId: 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), startedAt: Date.now(), siege: 1, gold: 0, roster: [], stash: [], tech: {}, discovered: {}, castleEl: null,
    vet: meta.ranks.veterans || 0, mods: {}, castle: { hp: 0, max: 0 }, stats: { kills: 0, gold: 0, bosses: [], dmgByHero: {}, deaths: 0, drafts: [], loot: [], encounters: [], techs: [] }, history: [], diamondsFound: 0,
    phase: 'draft', draftRerolls: 0, lootRerolls: 0, maxhpMul: 1 };
  run.castle.max = castleMaxFor(run, meta); run.castle.hp = run.castle.max;
  return run;
}

// ----- heroes -----
// Cam 2026-10-15: no rolled stats. Each card rolls a rarity from the odds for how many bosses have fallen.
function draftKind(run) { return !run.roster.length ? 'starter' : run.roster.length < START_LEGENDS && run.siege === 1 ? 'partner' : 'reinforce'; }
function draftSize(run, meta) { return 3 + (meta.ranks.muster ? 1 : 0) + (run.tech.pigeon ? 1 : 0); }
function draftBosses(run) { return castleTier(run) + (run.pressDraft > 0 && run.roster.length >= START_LEGENDS ? 1 : 0); }
// Legendary and God rolls can also turn up the legends that only exist at that rarity (hero.fixed), and they show up 3x as often
function draftPool(cands, rarity) { const pool = cands.filter(h => !h.fixed || h.fixed === rarity); return pool.flatMap(h => h.fixed ? [h, h, h] : [h]); }
function draftCard(id, run, rarity) { const d = HERO_BY_ID[id]; return { id, rarity: d.fixed || (rarity != null ? rarity : rollRarity(draftBosses(run))), temper: rollTemper() }; }
function draftOptions(run, meta, focus) {
  const n = draftSize(run, meta), own = new Set(run.roster.map(h => h.id)), out = [];
  for (let i = 0; i < n; i++) {
    const rar = rollRarity(draftBosses(run)), pool = draftPool(HEROES.filter(h => !own.has(h.id) && !out.some(o => o.id === h.id)), rar);
    if (!pool.length) break;
    out.push(draftCard(pick(pool).id, run, rar));
  }
  if (draftBosses(run) > castleTier(run)) for (const o of out) o.boost = true;
  // a focused search guarantees one card of the class or race you asked for
  if (focus && out.length) { const rar = out[0].rarity, fits = draftPool(HEROES.filter(h => !own.has(h.id) && (focus.kind === 'cls' ? h.cls : h.race) === focus.key && !out.some(o => o.id === h.id)), rar);
    if (fits.length && !out.some(o => (focus.kind === 'cls' ? HERO_BY_ID[o.id].cls : HERO_BY_ID[o.id].race) === focus.key)) out[0] = draftCard(pick(fits).id, run, rar); }
  return out;
}
// the first two legends are free; after that each draft costs more the bigger the roster is (losing legends makes it cheaper again)
function draftCost(run) { const n = Math.max(0, run.roster.length - START_LEGENDS); return Math.round(40 * Math.pow(1.8, n) / 5) * 5; }
function draftRerollCost(run) { return run.roster.length === 0 && run.draftRerolls === 0 ? 0 : 20 + 15 * run.draftRerolls; }
// every legend starts at level 1 (Cam); the Veterans meta upgrade still adds its levels
function joinLevel(run) { return 1 + (run.vet || 0); }
// legends behind the team's best level learn twice as fast, so a late recruit can catch up
function catchUpMul(run, h) { const top = Math.max(0, ...run.roster.map(x => x.level)); return h.level < top - 1 ? 2 : 1; }
function addDraftedHero(run, opt) {
  const h = { uid: nuid(), id: opt.id, rarity: HERO_BY_ID[opt.id].fixed || opt.rarity || 0, level: joinLevel(run), xp: 0, temper: opt.temper || rollTemper(), el: null, items: [], place: null, mustache: false };
  run.roster.push(h); autoPlace(run, h);
  if (opt.boost && run.pressDraft > 0) run.pressDraft--;
  // the first legend drafted is the keep's voice in boss talk (talk.js)
  if (!run.voice) run.voice = { uid: h.uid, id: h.id, name: heroDisplayName(h) };
  run.stats.drafts.push({ s: run.siege, id: opt.id, rarity: opt.rarity || 0, kind: draftKind(run) });
  return h;
}
// Cam 2026-10-15: a full keep must still be able to take in new legends, and Legendary/God legends need a
// reliable door near siege 40. Swaps (a full keep drafts and someone makes room), Legend Summons after the
// boss at 30/35 (Legendary) and 40/45 (God), and Ascension (spend gold to raise a legend's rarity).
function swapCost(run) { return Math.round(40 * Math.pow(1.8, ROSTER_CAP - 1 - START_LEGENDS) / 5) * 5; }
function teamLevel(run) { const l = run.roster.map(h => h.level).sort((a, b) => a - b); return l.length ? l[Math.floor(l.length / 2)] : joinLevel(run); }
function swapHero(run, old, opt) {
  for (const it of run.stash) if (it.holder === old.uid) it.holder = null;
  voiceLeaves(run, old); const g = sellValue(old), place = old.place; run.gold += g; run.roster = run.roster.filter(x => x !== old);
  const A = run.stats.ach = run.stats.ach || {}; A.sold = (A.sold || 0) + 1;
  const h = addDraftedHero(run, opt); h.level = Math.max(h.level, old.level);
  if (place) h.place = place;
  return { h, gold: g };
}
function summonTier(s) { return s === 35 ? 4 : s === 40 ? 5 : 0; }
function summonOptions(run, tier) {
  const own = new Set(run.roster.map(h => h.id));
  return HEROES.filter(h => h.fixed === tier && !own.has(h.id)).sort(() => Math.random() - 0.5).slice(0, 3).map(h => draftCard(h.id, run, tier));
}
const ASCEND_COST = [150, 400, 1000, 2500, 6000];
function maxRarityNow(run) { return rarityOdds(castleTier(run)).reduce((m, v, i) => v ? i : m, 0); }
function ascendCost(h) { return HERO_BY_ID[h.id].fixed || h.rarity >= 5 ? null : ASCEND_COST[h.rarity || 0]; }
function ascendHero(run, h) {
  const c = ascendCost(h); if (c == null) return { err: 'This legend is already as rare as it gets.' };
  if ((h.rarity || 0) + 1 > maxRarityNow(run)) return { err: `Beat more bosses to open ${RARITY[(h.rarity || 0) + 1].name}.` };
  if (run.gold < c) return { err: `Ascending costs ${c} gold. Save up ${c - run.gold} more.` };
  run.gold -= c; h.rarity = (h.rarity || 0) + 1; return { ok: true };
}
// the goose carries off one champion per siege from 46 to 50; captives sit out until the finale
function vaultDue(run) { return run.siege >= VAULT_FROM && run.siege <= FINAL_SIEGE && !run.finale && (run.vaultDone || 0) < run.siege && run.roster.filter(h => !h.vault).length > 2; }
function sendToVault(run, h) { h.vault = true; h.place = null; run.vaultDone = run.siege; }
function gooseSnatch(run) { const free = run.roster.filter(h => !h.vault); const h = free[Math.floor(Math.random() * free.length)]; sendToVault(run, h); return h; }
function vaultSkip(run) { run.vaultDone = run.siege; }
// after the goose falls at 50: it storms back into the great hall; the vault guards come up and everyone fights
function startFinale(run) {
  run.finale = 'ready'; run.siege = FINAL_SIEGE; run.tactic = null; run.mods = {};
  for (const h of run.roster) { h.vault = false; h.place = null; }
  for (const h of run.roster) autoPlace(run, h);
  run.castle.hp = run.castle.max;
}
function addXP(h, v) { h.xp += v; let n = 0; while (h.xp >= xpNeed(h.level) && h.level < 40) { h.xp -= xpNeed(h.level); h.level++; n++; } return n; }
function needsElement(h) { return h.level >= ELEMENT_LEVEL && !h.el; }
function elementOptions(run, meta, h) {
  const n = 3 + (run.tech.lab ? 1 : 0), have = heroElements(run, h);
  return EL_KEYS.filter(e => !have.includes(e)).sort(() => Math.random() - 0.5).slice(0, n);
}
function castleOptions(run) {
  const mine = [...new Set(run.roster.flatMap(h => heroElements(run, h)))].sort(() => Math.random() - 0.5).slice(0, 3);
  const rest = EL_KEYS.filter(e => !mine.includes(e)).sort(() => Math.random() - 0.5);
  while (mine.length < 3) mine.push(rest.shift());
  return mine;
}

// placement
function cellFree(run, c, r, except) { return !run.roster.some(h => h !== except && h.place && h.place.type === 'grid' && h.place.c === c && h.place.r === r); }
function rafterFree(run, i, except) { return !run.roster.some(h => h !== except && h.place && h.place.type === 'rafter' && h.place.i === i); }
function isRangedHero(id) { const d = HERO_BY_ID[id]; return CLASS_BASE[d.cls].range > 40; }
function autoPlace(run, h) {
  if (h.vault) return;
  const d = HERO_BY_ID[h.id], ranged = isRangedHero(h.id);
  if (ranged && !run.finale) for (let i = 0; i < rafterSlots(run); i++) if (rafterFree(run, i)) { h.place = { type: 'rafter', i }; return; }
  const cols = ranged ? [1, 2, 0, 3, 4, 5] : d.cls === 'guardian' ? [5, 6, 4, 7, 3] : [4, 5, 3, 6, 2, 7];
  const rows = [3, 2, 4, 1, 5, 0];
  for (const c of cols) for (const r of rows) if (cellFree(run, c, r)) { h.place = { type: 'grid', c, r }; return; }
}

// ----- items -----
function makeItem(parts, el) { return { uid: nuid(), parts: parts.slice(), el: el || null, holder: null }; }
function randomFinished() { const a = pick(COMP_KEYS), b = pick(COMP_KEYS); return makeItem(itemKey(a, b).split('+')); }
function lootOptions(run, meta) {
  const n = 3 + (run.tech.scav ? 1 : 0), boss = isBossSiege(run.siege - 1), out = [];
  for (let i = 0; i < n; i++) {
    if (boss) { let key, tries = 0; do { key = itemKey(pick(COMP_KEYS), pick(COMP_KEYS)); } while (out.some(o => o.parts.join('+') === key) && ++tries < 50); out.push({ parts: key.split('+') }); }
    else { const k = Math.random() < 0.05 && !out.some(o => o.parts[0] === 'shard') ? 'shard' : pick(COMP_KEYS.filter(c => !out.some(o => o.parts[0] === c))); out.push({ parts: [k] }); }
  }
  return out;
}
function lootRerollCost(run) { return 12 + 8 * run.lootRerolls; }
function takeLoot(run, opt) { const it = makeItem(opt.parts); if (it.parts.length === 2 && it.parts.includes('shard')) it.el = pick(EL_KEYS); run.stash.push(it); run.stats.loot.push({ s: run.siege - 1, parts: it.parts }); return it; }
function unequipItem(run, it) { const h = run.roster.find(x => x.uid === it.holder); if (h) h.items = h.items.filter(u => u !== it.uid); it.holder = null; }
// give an item to a hero; two components on one hero fuse into a finished item
function giveItem(run, it, h) {
  if (it.holder === h.uid) return { ok: true };
  if (it.sup && heroItems(run, h).some(x => x.sup && x !== it)) return { err: `${HERO_BY_ID[h.id].name.split(' ')[0]} already carries a super item. One each.` };
  if (it.parts.length === 1) {
    const partner = heroItems(run, h).find(x => x.parts.length === 1);
    if (partner) {
      unequipItem(run, it); unequipItem(run, partner);
      run.stash = run.stash.filter(x => x !== it && x !== partner);
      const parts = itemKey(partner.parts[0], it.parts[0]).split('+');
      const have = heroElements(run, h);
      const fused = makeItem(parts, parts.includes('shard') && parts[0] !== parts[1] ? pick(EL_KEYS.filter(e => !have.includes(e))) : null);
      run.stash.push(fused); fused.holder = h.uid; h.items.push(fused.uid);
      return { fused };
    }
  }
  if (h.items.length >= ITEM_SLOTS) return { err: `${HERO_BY_ID[h.id].name.split(' ')[0]} already carries ${ITEM_SLOTS} items.` };
  unequipItem(run, it); h.items.push(it.uid); it.holder = h.uid; return { ok: true };
}
const UNFORGE_COST = 30;
function unforgeItem(run, it) {
  if (it.parts.length < 2) return { err: 'Components cannot be split.' };
  if (run.gold < UNFORGE_COST) return { err: `Splitting costs ${UNFORGE_COST} gold.` };
  run.gold -= UNFORGE_COST; unequipItem(run, it); run.stash = run.stash.filter(x => x !== it);
  if (it.sup) { const a = makeItem(it.parts, it.el), b = makeItem(it.sub.parts, it.sub.el); run.stash.push(a, b); return { ok: true }; }
  for (const p of it.parts) run.stash.push(makeItem([p]));
  return { ok: true };
}

// ----- Super Anvil -----
function superAnvilOpen(run) { return !!run.tech.superanvil; }
function superForgeable(run) { return run.stash.filter(it => it.parts.length === 2 && !it.sup); }
function forgeSuper(run, a, b) {
  if (!superAnvilOpen(run)) return { err: "Build the Super Anvil in the Artificers' Hall first." };
  if (!a || !b || a === b || a.sup || b.sup || a.parts.length < 2 || b.parts.length < 2) return { err: 'Pick two different finished items.' };
  if (run.gold < SUPER_COST) return { err: `Forging costs ${SUPER_COST} gold.` };
  const holder = run.roster.find(h => h.uid === a.holder) || run.roster.find(h => h.uid === b.holder);
  if (holder && heroItems(run, holder).some(x => x.sup)) return { err: `${HERO_BY_ID[holder.id].name.split(' ')[0]} already carries a super item. One each.` };
  run.gold -= SUPER_COST; unequipItem(run, a); unequipItem(run, b);
  run.stash = run.stash.filter(x => x !== a && x !== b);
  const it = makeItem(a.parts, a.el); it.sub = { parts: b.parts.slice(), el: b.el || null }; it.sup = superKind(a, b);
  run.stash.push(it);
  if (holder) { holder.items.push(it.uid); it.holder = holder.uid; }
  return { it, holder };
}

// ----- Artificers' Hall -----
function techSealedBy(run, id) { const T = TECH[id]; return T.fork ? Object.keys(run.tech).find(k => TECH[k] && TECH[k].fork === T.fork && TECH[k].path !== T.path) || null : null; }
function techNeeds(run, id) { const T = TECH[id], miss = T.req.filter(r => !run.tech[r]).map(r => TECH[r].name); return T.any ? miss.join(' or ') : miss.join(' and '); }
function techState(run, id) {
  const T = TECH[id];
  if (run.tech[id]) return 'done';
  if (T.secret && !run.discovered[id]) return 'hidden';
  if (techSealedBy(run, id)) return 'sealed';
  if (run.siege < techOpensAt(id)) return 'soon';
  if (T.any ? T.req.some(r => run.tech[r]) : T.req.every(r => run.tech[r])) return 'open';
  return 'locked';
}
function buyTech(run, meta, id) {
  const T = TECH[id], st = techState(run, id);
  if (st === 'done') return { err: 'Already built.' };
  if (st === 'hidden') return { err: 'Nobody knows how to build that yet.' };
  if (st === 'sealed') return { err: `You took the ${TECH[techSealedBy(run, id)].path} path. ${T.path} is sealed this run.` };
  if (st === 'locked') return { err: `Needs ${techNeeds(run, id)} first.` };
  if (run.gold < T.cost) return { err: `You need ${T.cost - run.gold} more gold.` };
  run.gold -= T.cost; run.tech[id] = 1; run.stats.techs.push({ s: run.siege, id });
  if (['walls1', 'walls2', 'bastion'].includes(id)) { const old = run.castle.max; run.castle.max = castleMaxFor(run, meta); run.castle.hp = Math.min(run.castle.max, run.castle.hp + (run.castle.max - old)); }
  if (id === 'rafters1' || id === 'rafters2') { const ranged = run.roster.filter(h => isRangedHero(h.id) && h.place && h.place.type === 'grid'); for (let i = 0; i < rafterSlots(run); i++) if (rafterFree(run, i)) { const h = ranged.shift(); if (h) h.place = { type: 'rafter', i }; } }
  return { ok: true };
}
function repairCost(run) { return 25 + 4 * run.siege; }
function repairCastle(run) { const c = repairCost(run); if (run.castle.hp >= run.castle.max) return { err: 'The walls are already whole.' }; if (run.gold < c) return { err: `Masons charge ${c} gold.` }; run.gold -= c; const a = Math.round(run.castle.max * 0.2); run.castle.hp = Math.min(run.castle.max, run.castle.hp + a); return { ok: true, a }; }

// ----- reforge: reroll a finished item into a different finished item (same holder, same slot) -----
function reforgeable(run) { return run.stash.filter(it => it.parts.length === 2 && !it.sup); }
function reforgeItem(run, it) {
  if (!it || it.parts.length !== 2 || it.sup) return { err: 'Only finished items can be reforged.' };
  const from = itemName(it), old = itemKey(...it.parts); let parts;
  for (let i = 0; i < 40; i++) { parts = randomFinished().parts; if (itemKey(...parts) !== old) break; }
  it.parts = parts; it.el = null;
  return { ok: true, it, from };
}

// ----- encounters -----
function resolveEncounter(run, meta, fxs) {
  const out = [], levels = [];
  for (const fx of fxs.split(',')) {
    const [k, arg] = fx.split(':'); const n = +arg;
    switch (k) {
      case 'gold': { const g = n > 0 ? Math.round(n * goldMul(run.siege)) : n; run.gold = Math.max(0, run.gold + g); out.push(g >= 0 ? `+${g} gold` : `${g} gold`); break; }
      case 'pay': if (run.gold < n) { out.push(`You only have ${run.gold} gold. The dragon is unimpressed and keeps the box.`); return { out, levels }; } run.gold -= n; out.push(`−${n} gold`); break;
      case 'comp': { const key = arg === 'any' ? pick(COMP_KEYS) : arg; run.stash.push(makeItem([key])); out.push(`Got a ${COMPONENTS[key].name}. Hand it out in the Armory.`); break; }
      case 'item': { const it = randomFinished(); run.stash.push(it); out.push(`Got ${itemName(it)}. Hand it out in the Armory.`); break; }
      case 'xpAll': for (const h of run.roster) { const v = Math.round(n * (1 + 0.1 * run.siege)); const l = addXP(h, v); if (l) levels.push([h, l]); } out.push(`Every hero gains ${Math.round(n * (1 + 0.1 * run.siege))} XP.`); break;
      case 'xpOne': { const h = pick(run.roster); if (h) { const v = Math.round(n * (1 + 0.1 * run.siege)); const l = addXP(h, v); if (l) levels.push([h, l]); out.push(`${heroDisplayName(h)} gains ${v} XP.`); } break; }
      case 'secret': if (run.discovered[arg]) { const g = 40; run.gold += g; out.push(`You already know about the ${TECH[arg].name}. They leave ${g} gold for taking up your time.`); } else { run.discovered[arg] = true; out.push(`Discovered: ${TECH[arg].name}. Build it in the Artificers' Hall.`); } break;
      case 'hz': if (HAZARDS[arg]) { run.mods.hz = arg; out.push(`Next siege: ${HAZARDS[arg].name}. ${HAZARDS[arg].desc}`); } break;
      case 'reforge': { const list = reforgeable(run); if (!list.length) { const it = randomFinished(); run.stash.push(it); out.push(`You have nothing finished to reforge, so the smith hands you ${itemName(it)} instead.`); break; }
        run.pendingReforge = true; out.push('Pick an item to reforge.'); break; }
      case 'mod': run.mods[arg] = true; if (arg === 'bossmad') out.push('The boss is coming in a rage.'); break;
      case 'mood': run.mood = (run.mood || 0) + n; out.push(n > 0 ? 'They will remember that kindly.' : 'They will remember that.'); break;
      case 'bossdeal': if ((run.mood || 0) >= 1) { run.mods.bosssoft = true; out.push('They accept. Their heart is not in this siege.'); } else if ((run.mood || 0) <= -1) { run.mods.bossmad = true; out.push('They laugh in your face. After everything you did? The boss is coming in a rage.'); } else out.push('They shrug. Nothing changes.'); break;
      case 'recruit': { if (run.lastRecruit != null && run.siege - run.lastRecruit < RECRUIT_GAP) { const g = Math.round(35 * goldMul(run.siege)); run.gold += g; out.push(`The champion takes one look at your crowded barracks and leaves ${g} gold as an apology.`); break; } run.lastRecruit = run.siege;
        if (Math.random() < 0.8) { run.recruitFrom = 'encounter'; run.post.unshift('draft'); out.push('Three champions step forward. You get to pick one.'); break; } const os = run.roster.length < ROSTER_CAP ? draftOptions(run, meta) : []; const o = os[0]; if (!o) { const g = Math.round(40 * goldMul(run.siege)); run.gold += g; out.push(`Your keep is full, so they pay ${g} gold for the trouble instead.`); break; } const h = addDraftedHero(run, o); out.push(`${HERO_BY_ID[h.id].name} joins your keep at level ${h.level}!`); break; }
      case 'heal': { const a = Math.round(run.castle.max * n / 100); run.castle.hp = Math.min(run.castle.max, run.castle.hp + a); out.push(`Castle repaired by ${a}.`); break; }
      case 'maxhp': if (run.gold >= 50) { run.gold -= 50; run.maxhpMul *= 1.15; const old = run.castle.max; run.castle.max = castleMaxFor(run, meta); run.castle.hp += run.castle.max - old; out.push('Castle max HP +15%.'); } else out.push('You could not afford the masons. They leave, still eating your bread.'); break;
      case 'diamonds': { const g = Math.round(20 * n * goldMul(run.siege)); run.gold += g; out.push(`+${g} gold`); break; } // diamonds only come from achievements now
      case 'mustache': { const c = run.roster.filter(h => !h.mustache); const h = pick(c.length ? c : run.roster); if (h) { h.mustache = true; out.push(`${heroDisplayName(h)} now has a magnificent mustache. +5% attack, ability power and HP.`); } break; }
      case 'duel': { const h = run.roster.slice().sort((a, b) => b.level - a.level)[0]; if (!h) break; if (Math.random() < 0.7) { const v = Math.round(70 * (1 + 0.1 * run.siege)); const l = addXP(h, v); if (l) levels.push([h, l]); out.push(`${heroDisplayName(h)} wins after a tense 40 minutes. +${v} XP. The chicken demands a rematch.`); } else { const l = addXP(h, Math.round(30 * (1 + 0.1 * run.siege))); if (l) levels.push([h, l]); out.push(`The chicken wins. ${heroDisplayName(h)} is humbled, but learns something. +${Math.round(30 * (1 + 0.1 * run.siege))} XP.`); } break; }
      case 'gamble': { const h = pick(run.roster); if (!h) break; if (Math.random() < 0.55) { const v = Math.round(160 * (1 + 0.12 * run.siege)); const l = addXP(h, v); if (l) levels.push([h, l]); out.push(`${heroDisplayName(h)} glows, hiccups, and gains ${v} XP.`); } else { run.mods.shrunk = h.uid; out.push(`${heroDisplayName(h)} is now four inches tall for the next siege. They are furious.`); } break; }
      case 'haggle': if (Math.random() < 0.5) { run.stash.push(makeItem([pick(COMP_KEYS)]), makeItem([pick(COMP_KEYS)])); out.push('The dragon admires your nerve. Two free components.'); } else { const a = Math.round(run.castle.max * 0.1); run.castle.hp = Math.max(1, run.castle.hp - a); out.push(`The dragon sneezes. The castle loses ${a} HP and smells like toast.`); } break;
    }
  }
  const modText = { fewer: 'The next siege will be smaller.', curse: 'The next horde is angry about taxes.', chickens: 'Chickens. So many chickens. They are coming next siege.', partyhats: 'The next horde is wearing party hats.', giant: 'Your heroes will be ENORMOUS next siege.', tiny: 'The next horde will be tiny and zoomy.', inspire: 'Heroes +25% attack next siege.', tonic: 'Heroes start the next siege at full mana.', honked: 'The goose will be at the next siege.' };
  for (const fx of fxs.split(',')) { const [k, a] = fx.split(':'); if (k === 'mod' && modText[a]) out.push(modText[a]); }
  run.stats.encounters.push({ s: run.siege, fx: fxs });
  return { out, levels };
}

// ----- siege end bookkeeping -----
function finishSiege(run, meta, B) {
  const s = run.siege; const bounty = Math.round(0.5 * (3 + s) * (1 + (run.tech.vault1 ? 0.15 : 0) + (run.tech.vault2 ? 0.2 : 0)));
  run.gold += bounty;
  const xpMul = 1 + (run.tech.drill ? 0.15 : 0) + (run.tech.college ? 0.25 : 0);
  const survive = BAL.xpSurvive + BAL.xpSurviveS * s;
  const rep = { siege: s, faction: FACTIONS[factionIndex(s)].name, gold: B.goldEarned + bounty, bounty, kills: B.kills, castleLost: Math.round(B.castleStart - run.castle.hp), time: Math.round(B.t), drops: B.drops.slice(), heroes: [], bossFled: B.bossFled || null, fled: B.fled || 0 };
  for (const u of B.heroes.filter(h => !h.temp)) {
    const h = u.inst; const fromLv = h.level, fromXp = h.xp;
    // a champion called back keeps what they learned, but misses the reward for holding the line
    const safe = u.alive || u.recalled, gained = safe ? Math.round((u.xp + (u.alive ? survive : 0)) * xpMul * catchUpMul(run, h)) : 0;
    const lv = addXP(h, gained);
    if (!safe) run.stats.deaths++;
    const bs = heroBattleStats(B, u);
    rep.heroes.push({ uid: h.uid, id: h.id, dmg: Math.round(bs.dmg), heal: Math.round(bs.heal), taken: Math.round(bs.taken), cc: bs.cc, ccT: bs.ccT, dsrc: bs.dsrc, hsrc: bs.hsrc, tsrc: bs.tsrc, kills: u.kills, alive: safe, recalled: !!u.recalled,
      xp: gained, lost: safe ? 0 : Math.round(u.xp * xpMul), fromLv, fromXp, toLv: h.level, toXp: h.xp, levels: lv });
  }
  // permadeath (Cam 2026-10-15): a legend who falls in a siege is gone for good; their items go back to the stash
  rep.fallen = [];
  for (const u of B.heroes.filter(h => !h.temp && !h.alive && !h.recalled)) { const h = u.inst; if (!run.roster.includes(h)) continue;
    for (const it of run.stash) if (it.holder === h.uid) it.holder = null; h.items = [];
    run.roster = run.roster.filter(x => x !== h); rep.fallen.push({ uid: h.uid, id: h.id, rarity: heroRarity(h), level: h.level, name: heroDisplayName(h) });
    (run.stats.fallen = run.stats.fallen || []).push({ s, id: h.id, rarity: heroRarity(h), lv: h.level }); }
  run.lastStats = rep.heroes.map(h => ({ uid: h.uid, id: h.id, alive: h.alive, dmg: h.dmg, heal: h.heal, taken: h.taken, ccT: h.ccT, cc: h.cc, dsrc: h.dsrc, hsrc: h.hsrc, tsrc: h.tsrc }));
  for (const h of rep.heroes) run.stats.dmgByHero[h.id] = (run.stats.dmgByHero[h.id] || 0) + h.dmg;
  for (const key of B.drops) run.stash.push(makeItem([key]));
  if (run.tech.mimic && s % 3 === 0) { const key = pick(COMP_KEYS); run.stash.push(makeItem([key])); rep.mimic = key; }
  run.stats.kills += B.kills; run.stats.gold += rep.gold;
  const A = run.stats.ach = run.stats.ach || {}; for (const k in B.ach || {}) A[k] = (A[k] || 0) + B.ach[k];
  if (B.bossKilled && run.mods.bossmad) A.mad = (A.mad || 0) + 1; if (B.bossKilled && run.mods.bosssoft) A.soft = (A.soft || 0) + 1;
  A.maxGold = Math.max(A.maxGold || 0, run.gold); if (run.castle.hp >= run.castle.max) A.fullWalls = Math.max(A.fullWalls || 0, s); A.maxRoster = Math.max(A.maxRoster || 0, run.roster.length);
  if (B.bossKilled) { run.stats.bosses.push({ siege: s, kind: B.bossKilled });
    const old = run.castle.max; run.castle.max = castleMaxFor(run, meta); const grow = run.castle.max - old, fix = Math.round(run.castle.max * 0.25);
    run.castle.hp = Math.min(run.castle.max, run.castle.hp + grow + fix); rep.castleGrow = { from: old, to: run.castle.max, trophy: FACTIONS[factionIndex(s)].name }; }
  if (run.tech.fountain) { const a = Math.round(run.castle.max * 0.1); run.castle.hp = Math.min(run.castle.max, run.castle.hp + a); rep.repaired = a; }
  run.history.push({ s, t: rep.time, kills: rep.kills, gold: rep.gold, castle: Math.round(run.castle.hp), heroes: rep.heroes.map(h => ({ id: h.id, lv: h.toLv, dmg: h.dmg, alive: h.alive })) });
  // pressing the attack pays out: more gold now, a second loot pick and a better roll on the next draft
  if (pressOn(run)) { const g = Math.round(B.goldEarned * PRESS.gold); run.gold += g; rep.gold += g; rep.press = { gold: g }; run.pressDraft = Math.min(3, (run.pressDraft || 0) + 1); const A2 = run.stats.ach = run.stats.ach || {}; A2.pressed = (A2.pressed || 0) + 1; }
  run.mods = {};
  // a voice who lost their nerve before the boss (talk.js) comes back to the line
  for (const h of run.roster) if (h.fled) { const p = h.fledPlace; delete h.fled; delete h.fledPlace; if (p && !run.roster.some(x => x !== h && x.place && x.place.type === p.type && x.place.c === p.c && x.place.r === p.r && x.place.i === p.i)) h.place = p; else autoPlace(run, h); }
  run.siege++; run.lootRerolls = 0; run.tactic = rollTactic(run.siege);
  return rep;
}

// diamonds only come from achievements (see achievements.js), never from playing a run
function diamondsForRun(run) { return 0; }
