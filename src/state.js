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
  const run = { v: 2, runId: 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), startedAt: Date.now(), siege: 1, gold: START_GOLD, roster: [], stash: [], tech: {}, discovered: {}, castleEl: null,
    vet: meta.ranks.veterans || 0, mods: {}, castle: { hp: 0, max: 0 }, stats: { kills: 0, gold: 0, bosses: [], dmgByHero: {}, deaths: 0, drafts: [], loot: [], encounters: [], techs: [] }, history: [], diamondsFound: 0,
    phase: 'draft', draftRerolls: 0, lootRerolls: 0, maxhpMul: 1, heraldDue: true };
  run.castle.max = castleMaxFor(run, meta); run.castle.hp = run.castle.max;
  return run;
}

// ----- heroes -----
// Cam 2026-10-15: no rolled stats. Each card rolls a rarity from the odds for how many bosses have fallen.
function draftKind(run) { return !run.roster.length ? 'starter' : run.roster.length < START_LEGENDS && run.siege === 1 ? 'partner' : 'reinforce'; }
function draftSize(run, meta) { return 3 + (meta.ranks.muster ? 1 : 0) + (run.tech.pigeon ? 1 : 0); }
// shop odds: one row per guild level (Cam 2026-10-24), plus one while pressing pays off
function shopRank(run) { return Math.min(RARITY_ODDS.length - 1, guildLevel(run) - GUILD_LV.start); }
function draftBosses(run) { return shopRank(run) + (run.pressDraft > 0 && run.roster.length >= START_LEGENDS ? 1 : 0); }
// TFT shop (Cam 2026-10-23): every legend has one rarity (hero.rar). A card rolls a rarity from the odds, then a legend of that
// rarity, weighted by how many copies are still in the pool. Each card also rolls the element that legend would bring.
function draftPool(cands, rarity, run) { return cands.filter(h => h.rar === rarity && (!run || poolLeft(run, h.id) > 0)); }
function draftCard(id, run) { return { id, rarity: HERO_BY_ID[id].rar, temper: rollTemper(), el: rollElement(run) }; }
// each run has four elements in season: most legends arrive with one of them, so six of a kind (and its castle) is reachable
const SEASON = { n: 4, share: 0.7 };
function runSeason(run) { if (!run) return null; if (!run.season) run.season = EL_KEYS.slice().sort(() => Math.random() - 0.5).slice(0, SEASON.n); return run.season; }
// a new horde brings a new season (Cam 2026-10-23): the two in-season elements you field most stay, two new ones arrive
function rotateSeason(run) {
  const old = runSeason(run).slice(), n = fieldElements(run);
  const keep = old.sort((a, b) => (n[b] || 0) - (n[a] || 0) || Math.random() - 0.5).slice(0, SEASON.n - 2);
  const fresh = EL_KEYS.filter(e => !old.includes(e)).sort(() => Math.random() - 0.5).slice(0, SEASON.n - keep.length);
  run.season = [...keep, ...fresh]; run.seasonNew = fresh; run.heraldDue = true;
}
function rollElement(run) { const s = runSeason(run); return s && Math.random() < SEASON.share ? pick(s) : pick(EL_KEYS); }
function draftOptions(run, meta, focus) {
  const n = draftSize(run, meta), own = new Set(run.roster.map(h => h.id)), out = [];
  for (let i = 0; i < n; i++) {
    let rar = rollRarity(draftBosses(run)), pool = draftPool(HEROES.filter(h => !own.has(h.id) && !out.some(o => o.id === h.id)), rar, run);
    while (!pool.length && rar > 0) pool = draftPool(HEROES.filter(h => !own.has(h.id) && !out.some(o => o.id === h.id)), --rar, run);
    if (!pool.length) break;
    out.push(draftCard(pick(pool).id, run));
  }
  if (draftBosses(run) > shopRank(run)) for (const o of out) o.boost = true;
  // a focused search guarantees one card of the class or race you asked for
  if (focus && out.length) { const rar = out[0].rarity, fits = HEROES.filter(h => !own.has(h.id) && h.rar <= Math.max(rar, 1) && poolLeft(run, h.id) > 0 && (focus.kind === 'cls' ? h.cls : h.race) === focus.key && !out.some(o => o.id === h.id));
    if (fits.length && !out.some(o => (focus.kind === 'cls' ? HERO_BY_ID[o.id].cls : HERO_BY_ID[o.id].race) === focus.key)) out[0] = draftCard(pick(fits).id, run); }
  return out;
}
// the first two legends are free; after that each draft costs more the bigger the roster is (losing legends makes it cheaper again)
function draftCost(run) { const n = Math.max(0, run.roster.length - START_LEGENDS); return Math.round(40 * Math.pow(1.8, n) / 5) * 5; }
function draftRerollCost(run) { return run.roster.length === 0 && run.draftRerolls === 0 ? 0 : 2 + run.draftRerolls; }
// every legend starts at level 1 (Cam); the Veterans meta upgrade still adds its levels
function joinLevel(run) { return 1 + (run.vet || 0); }
// legends behind the team's best level learn twice as fast, so a late recruit can catch up
function catchUpMul(run, h) { const top = Math.max(0, ...run.roster.map(x => x.level)); return h.level < top - 1 ? 2 : 1; }
function addDraftedHero(run, opt) {
  const h = { uid: nuid(), id: opt.id, rarity: HERO_BY_ID[opt.id].rar, copies: opt.copies || 1, level: joinLevel(run), xp: 0, temper: opt.temper || rollTemper(), el: opt.el || rollElement(run), items: [], place: null, mustache: false };
  run.roster.push(h); autoPlace(run, h); poolTake(run, h.id, h.copies);
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
  voiceLeaves(run, old); const g = sellValue(old), place = old.place; run.gold += g; run.roster = run.roster.filter(x => x !== old); poolGive(run, old.id, old.copies || 1);
  const A = run.stats.ach = run.stats.ach || {}; A.sold = (A.sold || 0) + 1;
  const h = addDraftedHero(run, opt); h.level = Math.max(h.level, old.level);
  if (place) h.place = place;
  return { h, gold: g };
}
// ----- the Guild Hall shop -----
// Each legend has a limited pool of copies (fewer for rarer ones). Three copies make a 2-star legend, nine a 3-star.
// The horde recruits too: a card left in the shop when a siege starts can defect and fight for the horde (spawnEnemy turncoat).
const SHOP = { size: 5, reroll: 2, pool: [13, 12, 11, 10, 9, 9], stars: [1, 3, 9], starMul: [1, 1.6, 2.5], base: 5, interestPer: 10, interestMax: 5, defect: 0.25 };
function poolLeft(run, id) { const P = run.pool = run.pool || {}; return id in P ? P[id] : SHOP.pool[HERO_BY_ID[id].rar]; }
function poolTake(run, id, n) { const P = run.pool = run.pool || {}; P[id] = Math.max(0, poolLeft(run, id) - n); }
function poolGive(run, id, n) { const P = run.pool = run.pool || {}; P[id] = Math.min(SHOP.pool[HERO_BY_ID[id].rar], poolLeft(run, id) + n); }
function heroStar(h) { const c = h.copies || 1; return c >= SHOP.stars[2] ? 3 : c >= SHOP.stars[1] ? 2 : 1; }
function starMul(h) { return SHOP.starMul[heroStar(h) - 1]; }
function copiesToNext(h) { const s = heroStar(h); return s >= 3 ? 0 : SHOP.stars[s] - (h.copies || 1); }
function shopSize(run, meta) { return SHOP.size + (meta.ranks.muster ? 1 : 0) + (run.tech.pigeon ? 1 : 0); }
function shopCost(id) { return HERO_BY_ID[id].rar + 1; }
function shopOdds(run) { return rarityOdds(draftBosses(run)); }
function rollShopCard(run) {
  let rar = rollRarity(draftBosses(run)), pool = [];
  for (; rar >= 0 && !pool.length; rar--) pool = HEROES.filter(h => h.rar === rar && poolLeft(run, h.id) > 0 && !(run.shop || []).some(c => c && c.id === h.id && poolLeft(run, h.id) < 2));
  if (!pool.length) return null;
  // weighted by copies left, so a legend the horde (or you) has drained turns up less
  let x = Math.random() * pool.reduce((a, h) => a + poolLeft(run, h.id), 0); const d = pool.find(h => (x -= poolLeft(run, h.id)) < 0) || pool[0];
  const c = draftCard(d.id, run);
  if (run.tech.lab && Math.random() < 0.33) { const n = fieldElements(run), top = Object.keys(n).sort((a, b) => n[b] - n[a])[0]; if (top) c.el = top; }
  return c;
}
function rollShop(run, meta) {
  const boosted = draftBosses(run) > shopRank(run), out = [];
  run.shop = out; for (let i = 0; i < shopSize(run, meta); i++) out.push(rollShopCard(run));
  if (boosted && run.pressDraft > 0) run.pressDraft--;
  return out;
}
function shopRerollCost(run) { return SHOP.reroll; }
function rerollShop(run, meta) { const c = shopRerollCost(run); if (run.gold < c) return { err: `A new shop costs ${c} gold.` }; run.gold -= c; run.shopRerolls = (run.shopRerolls || 0) + 1; rollShop(run, meta); return { ok: true }; }
// buying a copy of a legend you already have adds to their copies (and maybe a star); otherwise they join, if there is room
function buyShopCard(run, i) {
  const c = run.shop && run.shop[i]; if (!c) return { err: 'That card is gone.' };
  const cost = shopCost(c.id); if (run.gold < cost) return { err: `${HERO_BY_ID[c.id].name.split(' ')[0]} costs ${cost} gold. You have ${run.gold}.` };
  if (poolLeft(run, c.id) <= 0) { run.shop[i] = null; return { err: 'The horde got there first.' }; }
  const own = run.roster.find(h => h.id === c.id);
  if (own) { const s0 = heroStar(own); run.gold -= cost; own.copies = (own.copies || 1) + 1; poolTake(run, c.id, 1); run.shop[i] = null; return { ok: true, h: own, merged: true, starUp: heroStar(own) > s0 }; }
  if (run.roster.length >= rosterCap(run)) return { full: true, card: c, cost };
  run.gold -= cost; run.shop[i] = null; const h = addDraftedHero(run, c); run.paidDrafts = (run.paidDrafts || 0) + 1; return { ok: true, h };
}
// the horde recruits from your leftovers: each card still in the shop may defect when the siege starts
function shopDefectors(run) {
  const out = []; if (!run.shop) return out;
  run.shop.forEach((c, i) => { if (c && Math.random() < SHOP.defect && poolLeft(run, c.id) > 0) { poolTake(run, c.id, 1); out.push(c); run.shop[i] = null; } });
  return out;
}
// ----- the boss's warband (Cam 2026-10-24) -----
// Each horde's boss recruits legends out of the same pool you buy from, so copies you want can be gone. Copies of one
// legend star up for them too (3 = 2★, 9 = 3★). Cards you leave in the shop can defect into the warband. The strongest
// WARBAND.field(s) of them fight in every siege; when the next horde arrives the warband scatters and its copies go back
// to the pool. buys and field are the difficulty curve; the rarities follow the guild level a run on pace has (GUILD_LV.pace).
const WARBAND = { from: 3, buys: s => s < 3 ? 0 : 1 + Math.floor(s / 12), field: s => Math.min(7, Math.max(0, Math.floor((s + 1) / 6))), hp: [1, 1.6, 2.5], atk: [1, 1.3, 1.7], keep: 0.5 };
function bossShort(id) { return ENEMIES[id].name.split(/,| the /)[0]; }
function paceLevel(s) { return GUILD_LV.start + GUILD_LV.pace.filter(p => s >= p).length; }
function warbandStar(w) { return w.copies >= SHOP.stars[2] ? 3 : w.copies >= SHOP.stars[1] ? 2 : 1; }
function warbandAdd(run, id, defected) { const W = run.warband = run.warband || []; let w = W.find(x => x.id === id); if (!w) W.push(w = { id, copies: 0 }); w.copies++; if (defected) w.defected = run.siege; return w; }
// at the start of each siege's prep: a new horde disbands the old warband, then the boss buys this siege's recruits
function warbandRecruit(run) {
  if (run.finale) return null; const fi = factionIndex(run.siege), out = [];
  if (run.warbandFi !== fi) { for (const w of run.warband || []) poolGive(run, w.id, w.copies); run.warband = []; run.warbandFi = fi; }
  for (let i = 0; i < WARBAND.buys(run.siege); i++) {
    // half the time the boss chases a star on a legend it already has, if the pool still holds a copy
    const own = (run.warband || []).filter(w => poolLeft(run, w.id) > 0 && w.copies < SHOP.stars[2]);
    let id = own.length && Math.random() < WARBAND.keep ? pick(own).id : null;
    if (!id) { let rar = rollRarity(paceLevel(run.siege) - GUILD_LV.start), pool = [];
      for (; rar >= 0 && !pool.length; rar--) pool = HEROES.filter(h => h.rar === rar && poolLeft(run, h.id) > 0);
      if (!pool.length) break; let x = Math.random() * pool.reduce((a, h) => a + poolLeft(run, h.id), 0); id = (pool.find(h => (x -= poolLeft(run, h.id)) < 0) || pool[0]).id; }
    poolTake(run, id, 1); warbandAdd(run, id); out.push(id);
  }
  run.warbandNews = out; return out;
}
// who fights this siege: defectors from this siege's shop always, then the strongest up to WARBAND.field
function warbandFighters(run) {
  if (run.finale) return [];
  const W = (run.warband || []).slice(), val = w => warbandStar(w) * 10 + HERO_BY_ID[w.id].rar;
  const fresh = W.filter(w => w.defected === run.siege), rest = W.filter(w => !fresh.includes(w)).sort((a, b) => val(b) - val(a));
  return fresh.concat(rest.slice(0, Math.max(0, WARBAND.field(run.siege) - fresh.length)));
}
function interestFor(gold) { return Math.min(SHOP.interestMax, Math.floor(Math.max(0, gold) / SHOP.interestPer)); }

function summonTier(s) { return s === 35 ? 4 : s === 40 ? 5 : 0; }
function summonOptions(run, tier) {
  const own = new Set(run.roster.map(h => h.id));
  return HEROES.filter(h => h.rar === tier && !own.has(h.id)).sort(() => Math.random() - 0.5).slice(0, 3).map(h => draftCard(h.id, run));
}
const ASCEND_COST = [150, 400, 1000, 2500, 6000];
function maxRarityNow(run) { return rarityOdds(castleTier(run)).reduce((m, v, i) => v ? i : m, 0); }
function ascendCost(h) { return null; } // Ascension is gone: stars from copies replaced it (TFT shop, 2026-10-23)
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
// elements are rolled when a legend joins (Cam 2026-10-23); older saves roll one the first time they're checked
function needsElement(h) { if (!h.el) h.el = pick(EL_KEYS); return false; }
// six champions of one element on the field unlock that element's castle; the first one claims the keep, later ones can be switched to
function castleUnlocks(run) { const n = fieldElements(run); return EL_KEYS.filter(e => (n[e] || 0) >= EL_STACK.at[2]); }
function checkCastleUnlock(run) { const fresh = castleUnlocks(run).filter(e => !(run.castleOpen || []).includes(e)); if (!fresh.length) return null; run.castleOpen = [...(run.castleOpen || []), ...fresh]; if (!run.castleEl) run.castleEl = fresh[0]; return fresh[0]; }
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
function fieldCount(run, except) { return run.roster.filter(h => h !== except && h.place && !h.vault && !h.fled).length; }
function fieldFull(run, except) { return !run.finale && fieldCount(run, except) >= fieldCap(run); }
// more champions on the field than the barracks allow (old saves, champions back from the goose's nest): the weakest go to the bench
function enforceField(run) {
  // saves from the square grid: a champion on a hex that no longer exists (the bottom of an odd column) steps up one
  for (const h of run.roster) if (h.place && h.place.type === 'grid' && !hexOk(h.place.c, h.place.r)) { const c = clamp(h.place.c, 0, GRID.cols - 1), r = Math.min(h.place.r, hexRows(c) - 1); h.place = cellFree(run, c, r, h) ? { type: 'grid', c, r } : null; if (!h.place) autoPlace(run, h); }
  if (run.finale) return; const on = run.roster.filter(h => h.place && !h.vault && !h.fled), cap = fieldCap(run); if (on.length <= cap) return;
  on.sort((a, b) => heroRarity(b) * 3 + heroStar(b) * 4 + b.level / 10 - (heroRarity(a) * 3 + heroStar(a) * 4 + a.level / 10)).slice(cap).forEach(h => { h.place = null; });
}
// does a champion on this hex reach the route with its two-hex circle?
function hexCovers(c, r, route, extra = 0) {
  const p = cellPos(c, r), R = guardRadius() + 12 + extra;
  for (let x = CASTLE_X + 20; x < W - 30; x += 8) if (Math.hypot(x - p.x, routeY(route, x) - p.y) <= R) return true;
  return false;
}
// which of the scouts' routes each placed champion guards (rafters guard none; they shoot whatever comes close)
function routeGuards(run, except) {
  const plan = planOf(run), n = plan ? plan.routes.map(() => 0) : [];
  if (plan) for (const x of run.roster) if (x !== except && x.place && x.place.type === 'grid' && !x.vault && !x.fled) plan.routes.forEach((rt, i) => { if (hexCovers(x.place.c, x.place.r, rt, isRangedHero(x.id) ? 40 : 0)) n[i]++; });
  return n;
}
function autoPlace(run, h) {
  if (h.vault || fieldFull(run, h)) return;
  const d = HERO_BY_ID[h.id], ranged = isRangedHero(h.id);
  if (ranged && !run.finale) for (let i = 0; i < rafterSlots(run); i++) if (rafterFree(run, i)) { h.place = { type: 'rafter', i }; return; }
  const cols = ranged ? [1, 2, 0, 3, 4, 5] : d.cls === 'guardian' ? [5, 6, 4, 7, 3] : [4, 5, 3, 6, 2, 7];
  // champions go where their circle covers the most of the horde's columns that nobody guards yet; ranged ones stand further back
  const plan = planOf(run), held = routeGuards(run, h);
  let best = null, bs = -1;
  cols.forEach((c, ci) => { for (let r = 0; r < hexRows(c); r++) { if (!cellFree(run, c, r)) continue;
    let sc = 1 - ci * 0.04 - Math.abs(r - (hexRows(c) - 1) / 2) * 0.01;
    if (plan) plan.routes.forEach((rt, i) => { if (hexCovers(c, r, rt, ranged ? 40 : 0)) sc += 4 * rt.w / (1 + held[i]); });
    if (sc > bs) { bs = sc; best = { type: 'grid', c, r }; } } });
  if (best) h.place = best;
}

// ----- items -----
function makeItem(parts, el) { return { uid: nuid(), parts: parts.slice(), el: el || null, holder: null }; }
function randomFinished() { const a = pick(COMP_KEYS), b = pick(COMP_KEYS); return makeItem(itemKey(a, b).split('+')); }
// kind 'comp' always deals components (the extra pick for taunting a boss)
function lootOptions(run, meta, kind) {
  const n = 3 + (run.tech.scav ? 1 : 0), boss = kind !== 'comp' && isBossSiege(run.siege - 1) && (ENEMIES[bossFor(run.siege - 1)].boss === 'big' || run.siege - 1 === 5), out = []; // the first boss also gives a finished item, so the first carry shows up early
  for (let i = 0; i < n; i++) {
    if (boss) { let key, tries = 0; do { key = itemKey(pick(COMP_KEYS), pick(COMP_KEYS)); } while (out.some(o => o.parts.join('+') === key) && ++tries < 50); out.push({ parts: key.split('+') }); }
    else { const k = Math.random() < 0.05 && !out.some(o => o.parts[0] === 'shard') ? 'shard' : pick(COMP_KEYS.filter(c => !out.some(o => o.parts[0] === c))); out.push({ parts: [k] }); }
  }
  return out;
}
function lootRerollCost(run) { return 1 + run.lootRerolls; }
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
const UNFORGE_COST = 3;
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
function repairCost(run) { return 2 + Math.floor(run.siege / 10); }
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
      case 'gold': { const g = n; run.gold = Math.max(0, run.gold + g); out.push(g >= 0 ? `+${g} gold` : `${g} gold`); break; }
      case 'pay': if (run.gold < n) { out.push(`You only have ${run.gold} gold. The dragon is unimpressed and keeps the box.`); return { out, levels }; } run.gold -= n; out.push(`−${n} gold`); break;
      case 'comp': { const key = arg === 'any' ? pick(COMP_KEYS) : arg; run.stash.push(makeItem([key])); out.push(`Got a ${COMPONENTS[key].name}. Hand it out in the Armory.`); break; }
      case 'item': { const it = randomFinished(); run.stash.push(it); out.push(`Got ${itemName(it)}. Hand it out in the Armory.`); break; }
      case 'xpAll': for (const h of run.roster) { const v = Math.round(n * (1 + 0.1 * run.siege)); const l = addXP(h, v); if (l) levels.push([h, l]); } out.push(`Every hero gains ${Math.round(n * (1 + 0.1 * run.siege))} XP.`); break;
      case 'xpOne': { const h = pick(run.roster); if (h) { const v = Math.round(n * (1 + 0.1 * run.siege)); const l = addXP(h, v); if (l) levels.push([h, l]); out.push(`${heroDisplayName(h)} gains ${v} XP.`); } break; }
      case 'secret': if (run.discovered[arg]) { const g = 4; run.gold += g; out.push(`You already know about the ${TECH[arg].name}. They leave ${g} gold for taking up your time.`); } else { run.discovered[arg] = true; out.push(`Discovered: ${TECH[arg].name}. Build it in the Artificers' Hall.`); } break;
      case 'hz': if (HAZARDS[arg]) { run.mods.hz = arg; out.push(`Next siege: ${HAZARDS[arg].name}. ${HAZARDS[arg].desc}`); } break;
      case 'reforge': { const list = reforgeable(run); if (!list.length) { const it = randomFinished(); run.stash.push(it); out.push(`You have nothing finished to reforge, so the smith hands you ${itemName(it)} instead.`); break; }
        run.pendingReforge = true; out.push('Pick an item to reforge.'); break; }
      case 'mod': run.mods[arg] = true; if (arg === 'bossmad') out.push('The boss is coming in a rage.'); break;
      case 'mood': run.mood = (run.mood || 0) + n; out.push(n > 0 ? 'They will remember that kindly.' : 'They will remember that.'); break;
      case 'bossdeal': if ((run.mood || 0) >= 1) { run.mods.bosssoft = true; out.push('They accept. Their heart is not in this siege.'); } else if ((run.mood || 0) <= -1) { run.mods.bossmad = true; out.push('They laugh in your face. After everything you did? The boss is coming in a rage.'); } else out.push('They shrug. Nothing changes.'); break;
      case 'recruit': { if (run.lastRecruit != null && run.siege - run.lastRecruit < RECRUIT_GAP) { const g = 3; run.gold += g; out.push(`The champion takes one look at your crowded barracks and leaves ${g} gold as an apology.`); break; } run.lastRecruit = run.siege;
        if (Math.random() < 0.8) { run.recruitFrom = 'encounter'; run.post.unshift('draft'); out.push('Three champions step forward. You get to pick one.'); break; } const os = run.roster.length < rosterCap(run) ? draftOptions(run, meta) : []; const o = os[0]; if (!o) { const g = Math.round(40 * goldMul(run.siege)); run.gold += g; out.push(`Your keep is full, so they pay ${g} gold for the trouble instead.`); break; } const h = addDraftedHero(run, o); out.push(`${HERO_BY_ID[h.id].name} joins your keep at level ${h.level}!`); break; }
      case 'heal': { const a = Math.round(run.castle.max * n / 100); run.castle.hp = Math.min(run.castle.max, run.castle.hp + a); out.push(`Castle repaired by ${a}.`); break; }
      case 'maxhp': if (run.gold >= 5) { run.gold -= 5; run.maxhpMul *= 1.15; const old = run.castle.max; run.castle.max = castleMaxFor(run, meta); run.castle.hp += run.castle.max - old; out.push('Castle max HP +15%.'); } else out.push('You could not afford the masons. They leave, still eating your bread.'); break;
      case 'diamonds': { const g = 2 * n; run.gold += g; out.push(`+${g} gold`); break; } // diamonds only come from achievements now
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
  // TFT-style income: interest on what you banked, then the siege's pay
  const s = run.siege, interest = interestFor(run.gold), bounty = SHOP.base + interest;
  run.gold += bounty;
  const xpMul = 1 + (run.tech.drill ? 0.15 : 0) + (run.tech.college ? 0.25 : 0);
  const survive = BAL.xpSurvive + BAL.xpSurviveS * s;
  const rep = { siege: s, faction: FACTIONS[factionIndex(s)].name, gold: B.goldEarned + bounty, bounty, interest, kills: B.kills, castleLost: Math.round(B.castleStart - run.castle.hp), time: Math.round(B.t), drops: B.drops.slice(), heroes: [], bossFled: B.bossFled || null, fled: B.fled || 0 };
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
  // no permadeath (Cam 2026-10-24): a legend who falls is back for the next siege, but earns nothing from this one
  rep.fallen = B.heroes.filter(u => !u.temp && !u.alive && !u.recalled).map(u => ({ uid: u.inst.uid, id: u.inst.id, name: heroDisplayName(u.inst) }));
  // the horde got in: the keep takes a crack (two if the boss is still standing), and the walls are patched back up
  if (B.done !== 'victory') { const n = B.bossUnit && B.bossUnit.alive && B.bossUnit.boss ? BREACH.boss : 1; run.breaches = (run.breaches || 0) + n;
    rep.breach = { n, total: run.breaches, max: BREACH.max, over: run.breaches >= BREACH.max, boss: !!(B.bossUnit && B.bossUnit.alive), foe: run.finale === 'ready' ? 'shardgoose' : bossFor(s), f: factionIndex(s) }; run.lastBreach = s;
    run.castle.hp = Math.max(run.castle.hp, Math.round(run.castle.max * BREACH.rebuild)); }
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
  run.history.push({ s, lost: !!rep.breach, t: rep.time, kills: rep.kills, gold: rep.gold, castle: Math.round(run.castle.hp), heroes: rep.heroes.map(h => ({ id: h.id, lv: h.toLv, dmg: h.dmg, alive: h.alive })) });
  // pressing the attack pays out: more gold now, a better roll on the next shop, and every fourth press a loot pick
  if (pressOn(run) && !rep.breach) { const g = PRESS.gold; run.gold += g; rep.gold += g; run.pressDraft = Math.min(3, (run.pressDraft || 0) + 1); const A2 = run.stats.ach = run.stats.ach || {}; A2.pressed = (A2.pressed || 0) + 1; rep.press = { gold: g, loot: A2.pressed % 4 === 0 }; }
  run.mods = {};
  // a voice who lost their nerve before the boss (talk.js) comes back to the line
  for (const h of run.roster) if (h.fled) { const p = h.fledPlace; delete h.fled; delete h.fledPlace; if (p && !run.roster.some(x => x !== h && x.place && x.place.type === p.type && x.place.c === p.c && x.place.r === p.r && x.place.i === p.i)) h.place = p; else autoPlace(run, h); }
  run.siege++; if (factionIndex(run.siege) !== factionIndex(run.siege - 1) && run.siege < FINAL_SIEGE) rotateSeason(run);
  rep.warband = warbandRecruit(run);
  run.lootRerolls = 0; run.tactic = rollTactic(run.siege); run.plan = null; planOf(run);
  if (!run.shopLock) rollShop(run, meta);
  return rep;
}

// diamonds only come from achievements (see achievements.js), never from playing a run
function diamondsForRun(run) { return 0; }
