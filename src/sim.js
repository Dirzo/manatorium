// ===== Combat simulation (no DOM) =====
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function factionIndex(s) { return Math.min(FACTIONS.length - 1, Math.floor((s - 1) / 5)); }
function cycleOf(s) { return 0; } // the campaign ends at FINAL_SIEGE; no ascended loops
// Tuning knobs (tools/sim.mjs and the in-game Sim Lab read these)
const BAL = { huntMelee: 130, huntRanged: 70, foeAtk: 1.8, foeHp: 3.0, hpBase: 1.25, atkBase: 1.18, budget0: 3.5, budgetS: 3, budgetW: 0.8, goldK: 0.21, xpK: 14, xpSurvive: 30, xpSurviveS: 8, lvlGrow: 1.13, bossHp: 1.3, miniBoss: 5, bigBoss: 22, bossDecay: 1, eliteCap: 0.3, late: 1.5, early: 0.9, miniAtk: 2.1, bigAtk: 3.8, bossGold: 0.35, hammer: 0.85, ballista: 0.25, sigMana: 1.5, auto: 0.8, critMul: 1.6,
  otStart: 30, otRamp: 0.08, otCharge: 15, otSlam: 4,
  patMini: 60, patBig: 90, patFinal: 120, patAgain: 45, patTrample: 0.2, patSmashMini: 0.3, patSmashBig: 0.5,
  swarm: 0.05, thin: 0.8, maxSpawn: 240, rafterRange: 360, extraShot: 0.45 };
// HORDE_DIFF scales each horde (five sieges)
// retuned 2026-10-23 for the TFT shop with no meta progression; 2026-10-24 foeHp 2.4->3.0, foeAtk 1.6->1.8 for breaches, race/class thresholds and guild ranks (bots win ~1 run in 6)
// 2026-10-24 (later): retuned per horde for guild levels 3-12, rare items and boss warbands (GUILD_LV.pace, WARBAND); bots ~1 run in 7
const HORDE_DIFF = [1.431, 0.909, 0.681, 0.644, 0.365, 0.405, 0.24, 0.085, 0.201, 0.024];
function hordeDiff(s) { return HORDE_DIFF[Math.min(HORDE_DIFF.length - 1, Math.floor((s - 1) / 5))]; }
// foeAtk/foeHp ramp in over the first sieges so any starter still clears siege 1
function foeRamp(s, k) { return 1 + (k - 1) * Math.min(1, (s - 1) / 6); }
// late ramp (V41): swaps, summons and ascension make late teams stronger, so the horde grows to match from siege 10 on
function lateRamp(s) { return 1 + BAL.late * Math.max(0, s - 10) / 40; }
function hpMul(s) { return foeRamp(s, BAL.foeHp) * Math.pow(BAL.hpBase, s - 1) * hordeDiff(s) * lateRamp(s); }
function atkMul(s) { return foeRamp(s, BAL.foeAtk) * Math.pow(BAL.atkBase, s - 1) * Math.sqrt(hordeDiff(s) * lateRamp(s)); }
function goldMul(s) { return 1 + 0.04 * (s - 1); }
// TFT-scale gold (Cam 2026-10-23): a whole siege's kills are worth a few coins, growing slowly; bosses add a purse on top
function killCoins(s) { return 1.5 + s / 20; }
const BOSS_PURSE = { mini: 2, big: 3 };
function waveGoldRef(queue) { let g = 0; for (const q of queue) { const d = q.id && ENEMIES[q.id]; if (d) g += d.gold * (d.boss ? BAL.bossGold : 1) / (q.sw && !d.boss ? q.sw : 1); } return Math.max(1, g); }
function isBossSiege(s) { return s % 5 === 0; }
// Press or hold (Cam 2026-10-23): before a regular siege, choose to press the attack for a tougher wave and bigger rewards
const PRESS = { budget: 1.35, elites: 1, gold: 2 };
function canPress(run) { return run.siege >= 2 && !isBossSiege(run.siege) && run.siege < FINAL_SIEGE && !run.finale; }
function pressOn(run) { return !!run.press && canPress(run); }
function bossFor(s) { return FACTIONS[factionIndex(s)].boss; }
const BOSS_TOUGH = { grubnose: 0.8, gloop: 0.8, wyrm: 1, ringmaster: 1.05, sporebaron: 1.05, matriarch: 1.1, trashpaw: 1.1, colossus: 0.9, pinchbeard: 1.15, goosegod: 0.55, shardgoose: 1.1 };
const BOSS_NATIVE = { grubnose: 5, gloop: 10, wyrm: 15, ringmaster: 20, matriarch: 25, colossus: 30 };

// ----- lanes (Cam 2026-10-23): the horde comes down three lanes, and champions on the ground hold their own -----
// The scouts report the plan before each siege (run.lanes): how the horde splits, and which lane its elites take.
const LANES = 3, LANE_NAMES = ['Top', 'Middle', 'Bottom'];
// lanes follow the placement grid's rows (Cam 2026-10-23: a champion dropped in a lane must belong to it): 2, 3 and 2 rows
const LANE_ROWS = [2, 3, 2], LANE_EDGE = [0, 2, 5, 7];
function laneH() { return GRID.rows * GRID.cell / LANES; }
function laneSpan(l) { return { y0: GRID.y + LANE_EDGE[l] * GRID.cell, y1: GRID.y + LANE_EDGE[l + 1] * GRID.cell }; }
// unit feet stand 6px below the centre of their cell (cellPos), so the same offset decides the lane
function laneOf(y) { const r = Math.floor((y - 6 - GRID.y) / GRID.cell); return r < LANE_EDGE[1] ? 0 : r < LANE_EDGE[2] ? 1 : 2; }
function laneBand(l) { const S = laneSpan(l); return { y0: S.y0 + 6 + 5, y1: S.y1 + 6 - 5 }; }
function rollLanes(s, tac) {
  const heavy = randi(0, LANES - 1), w = [0, 0, 0], big = tac === 'blitz' ? 0.7 : s < 3 ? 0.34 : rand(0.42, 0.58);
  for (let l = 0; l < LANES; l++) w[l] = l === heavy ? big : (1 - big) / (LANES - 1);
  return { w, heavy, elite: randi(0, LANES - 1) };
}
function pickLane(w) { let x = Math.random(); for (let l = 0; l < w.length; l++) { x -= w[l]; if (x < 0) return l; } return w.length - 1; }
// may this champion take on that foe? Rafters, bosses, overtime and self-defense ignore lanes; ranged champions also cover the
// next lane; and once a champion's own lane has been quiet for 2s they rotate to help next door.
function heroLaneOk(B, u, e) {
  if (u.rafter || u.lane == null || B.overtime || e.boss || e.target === u || !B.lanes) return true;
  const d = Math.abs(laneOf(e.y) - u.lane);
  return d === 0 || (d === 1 && (u.st.range > 40 || (B.laneIdle[u.lane] || 0) > 2));
}
function stepLanes(B, dt) { if (!B.lanes) return; const busy = [0, 0, 0]; for (const e of B.enemies) if (e.alive && e.x < W - 4 && !e.boss) busy[laneOf(e.y)]++; for (let l = 0; l < LANES; l++) B.laneIdle[l] = busy[l] ? 0 : (B.laneIdle[l] || 0) + dt; }

function cellPos(c, r) { return { x: GRID.x + c * GRID.cell + GRID.cell / 2, y: GRID.y + r * GRID.cell + GRID.cell / 2 + 6 }; }

// ----- synergies -----
function placedHeroes(run) { return run.roster.filter(h => h.place && !h.vault && !h.fled); }
function synergyCounts(run) {
  const race = {}, cls = {}, seen = new Set();
  for (const h of placedHeroes(run)) {
    if (seen.has(h.id)) continue; seen.add(h.id);
    const d = HERO_BY_ID[h.id]; race[d.race] = (race[d.race] || 0) + 1; cls[d.cls] = (cls[d.cls] || 0) + 1;
  }
  return { race, cls };
}
function synergyTier(def, n) { let t = -1; def.at.forEach((v, i) => { if (n >= v) t = i; }); return t; }
// temperaments: older saves get one picked from the uid so it never changes
// ----- boss talk (talk.js stages it, simbot.js plays it for the bots) -----
function voiceHero(run) { return run.voice ? run.roster.find(h => h.uid === run.voice.uid) || null : null; }
// a voice who is sold or sent home keeps their record, so the next talk hands the banner on instead of holding a funeral
function voiceLeaves(run, h) { if (run.voice && run.voice.uid === h.uid) run.voice.left = true; }
function dreadedBy(bossId, h) { return !!h && (BOSS_DREAD[bossId] || []).includes(heroTemper(h)); }
// a voice with a temper the boss dreads loses their nerve before the boss siege: they still fight, but start it stunned (mods.shaken)
function mishapDue(run, h) { return !!h && isBossSiege(run.siege) && run.finale !== 'ready' && !h.vault && dreadedBy(bossFor(run.siege), h); }
// the boss-siege replies (taunt / firm / rallycry, goad at the finale): only one counts
const TALK_REPLIES = ['taunt', 'firm', 'rallycry', 'goad'];
function setTalkReply(run, mod) { for (const k of TALK_REPLIES) delete run.mods[k]; if (mod) run.mods[mod] = true; }
function heroTemper(h) { if (!h.temper) { let x = 0; for (const c of String(h.uid)) x = (x * 31 + c.charCodeAt(0)) >>> 0; h.temper = TEMPER_KEYS[x % TEMPER_KEYS.length]; } return h.temper; }
function temperCounts(run) { const c = {}; for (const h of placedHeroes(run)) { const t = heroTemper(h); c[t] = (c[t] || 0) + 1; } return c; }
function activeSynergies(run) {
  const { race, cls } = synergyCounts(run), out = {};
  for (const k in RACES) out[k] = synergyTier(RACES[k], race[k] || 0);
  for (const k in CLASSES) out[k] = synergyTier(CLASSES[k], cls[k] || 0);
  return out;
}

// ----- hero stats -----
function heroLevelMul(lv) { return Math.pow(BAL.lvlGrow, lv - 1); }
function sigRank(lv) { return lv < SIG_LEVEL ? 0 : 1 + [8, 12, 16, 20].filter(x => lv >= x).length; }
function heroSpriteKey(h) { return h.el ? 'h:' + h.id + ':' + h.el : 'h:' + h.id; }
function heroDisplayName(h) { const d = HERO_BY_ID[h.id]; return h.el ? `${d.name.split(' ')[0]} ${ELEMENTS[h.el].title}` : d.name; }
function heroItems(run, h) { return h.items.map(u => run.stash.find(x => x.uid === u)).filter(Boolean); }
function heroElements(run, h) { const out = h.el ? [h.el] : []; for (const it of heroItems(run, h)) for (const e of [it.el, it.sub && it.sub.el]) if (e && !out.includes(e)) out.push(e); return out; }
// flat power bonuses that used to be +1 rolls: mustache, Aether Engine, Heart of the Twelve (+3)
function heroBonusPts(run, h) {
  let bonus = (h.mustache ? 1 : 0) + (run.tech.aether ? 1 : 0);
  for (const it0 of heroItems(run, h)) for (const it of [it0, it0.sub]) if (it && it.parts.length === 2 && itemKey(...it.parts) === 'shard+shard') bonus += 3;
  return bonus;
}
function heroRarity(h) { const d = HERO_BY_ID[h.id]; return d && d.rar != null ? d.rar : h.rarity || 0; }
// which elements are on the field, how many heroes carry each
// element stacks count like races (Cam 2026-10-23): 2, 4 and 6 champions; six of one element unlocks that element's castle
const EL_LEAN = { ad: 0.3, ap: 0.35, def: 0.3 };
const EL_STACK = { at: [2, 4, 6], mul: [1.4, 1.9, 2.5], stat: [0.1, 0.22, 0.4] };
function elTier(n) { let t = -1; EL_STACK.at.forEach((v, i) => { if (n >= v) t = i; }); return t; }
function fieldElements(run) {
  const n = {};
  for (const h of placedHeroes(run)) for (const e of heroElements(run, h)) n[e] = (n[e] || 0) + 1;
  return n;
}
// element stacks also count the castle's element as one more carrier (only when a champion has it).
function stackElements(run) { const n = fieldElements(run); if (run.castleEl && n[run.castleEl]) n[run.castleEl]++; return n; }
// every element pair on the field could form a combo, but only COMBO_SLOTS of them fire: the player picks which.
// An elemental castle counts as an element for combos and opens a 3rd slot that only takes combos with the castle's element (Cam).
const COMBO_SLOTS = 2;
function comboSlots(run) { return COMBO_SLOTS + (run.castleEl ? 1 : 0); }
// a combo needs COMBO_NEED champions of EACH of its two elements on the field (Cam: fewer, earned combos). The castle counts as one.
const COMBO_NEED = 2;
function comboCounts(run) { const n = fieldElements(run); if (run.castleEl) n[run.castleEl] = (n[run.castleEl] || 0) + 1; return n; }
// pairs that are started but not finished, for the synergy list: [{key, a, b, na, nb, name}]
function nearCombos(run) {
  const n = comboCounts(run), ks = Object.keys(n).sort((a, b) => EL_KEYS.indexOf(a) - EL_KEYS.indexOf(b)), out = [], forms = run.comboForm || {};
  for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) { const a = ks[i], b = ks[j]; if (n[a] >= COMBO_NEED && n[b] >= COMBO_NEED) continue;
    const key = comboKey(a, b), I = comboFormInfo(key, forms[key]); if (I) out.push({ key, a, b, na: n[a], nb: n[b], name: forms[key] ? I.name : null, missing: Math.max(0, COMBO_NEED - n[a]) + Math.max(0, COMBO_NEED - n[b]) }); }
  return out.sort((x, y) => x.missing - y.missing);
}
function possibleCombos(run) {
  const n = comboCounts(run); for (const k in n) if (n[k] < COMBO_NEED) delete n[k];
  const ks = Object.keys(n).sort((a, b) => EL_KEYS.indexOf(a) - EL_KEYS.indexOf(b)), out = [], forms = run.comboForm || {};
  for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) { const key = comboKey(ks[i], ks[j]), I = comboFormInfo(key, forms[key]);
    if (I) out.push({ key, a: ks[i], b: ks[j], name: I.name, kind: I.kind, desc: I.desc, sig: I.sig, castle: !!run.castleEl && (ks[i] === run.castleEl || ks[j] === run.castleEl), unpicked: !forms[key] }); }
  return out;
}
function activeCombos(run) {
  const all = possibleCombos(run), out = [];
  if (run.castleEl) { const c = all.find(c => c.castle && c.key === run.castleCombo) || all.find(c => c.castle); if (c) out.push(Object.assign(c, { slot: 'castle' })); }
  const rest = all.filter(c => !out.includes(c)), pick = run.comboPick || [];
  const chosen = pick.map(k => rest.find(c => c.key === k)).filter(Boolean).slice(-COMBO_SLOTS);
  for (const c of rest) if (chosen.length < COMBO_SLOTS && !chosen.includes(c)) chosen.push(c);
  return [...chosen, ...out];
}
// choosing an inactive combo swaps out the one picked longest ago; castle-element combos go to the castle slot first
function toggleCombo(run, key) {
  const act = activeCombos(run), cur = act.filter(c => c.slot !== 'castle').map(c => c.key); if (act.some(c => c.key === key)) return;
  const c = possibleCombos(run).find(c => c.key === key); if (!c) return;
  if (c.castle) { run.castleCombo = key; return; }
  run.comboPick = [...cur, key].slice(-COMBO_SLOTS);
}
function setComboForm(run, key, kind) { run.comboForm = Object.assign({}, run.comboForm, { [key]: kind }); if (run.comboOffer) delete run.comboOffer[key]; }
// releasing a champion pays a little gold back and returns their items to the stash
// selling refunds what the copies cost, TFT style (a starred legend loses 1 gold on the way out)
function sellValue(h) { return shopCost(h.id) * (h.copies || 1) - (heroStar(h) > 1 ? 1 : 0); }
function sellHero(run, h) {
  if (run.roster.length <= 1) return { err: 'You need at least one champion.' };
  for (const it of run.stash) if (it.holder === h.uid) it.holder = null;
  voiceLeaves(run, h); run.roster = run.roster.filter(x => x !== h); poolGive(run, h.id, h.copies || 1); const g = sellValue(h); run.gold += g; const A = run.stats.ach = run.stats.ach || {}; A.sold = (A.sold || 0) + 1;
  return { gold: g };
}
function trinityActive(run) { const st = new Set(Object.keys(fieldElements(run)).map(e => ELEMENTS[e].style)); return st.size >= 3; }

function heroStats(h, run, meta, syn) {
  const d = HERO_BY_ID[h.id], b = CLASS_BASE[d.cls], rar = heroRarity(h), tm = rarityMul(rar) * starMul(h), lm = heroLevelMul(h.level), bp = 1 + 0.05 * heroBonusPts(run, h);
  const gm = 1 + 0.1 * (meta.ranks.drills || 0);
  const sm = 1 + 0.15 * (meta.ranks.banners || 0);
  // no rolled stats any more: rarity (tm) and level (lm) set a legend's power
  const adM = 1.1 * bp, defM = 1.07 * bp;
  const s = { hp: b.hp * tm * lm * gm * defM, atk: b.atk * tm * lm * gm * adM, as: b.as, range: b.range, spd: b.spd, armor: b.armor + 11 + 4 * rar, mana: b.mana * (rar >= 4 ? 0.75 : 1),
    crit: 0.05, critMul: BAL.critMul, dodge: 0, lifesteal: 0, reflect: 0, startMana: 0, manaGain: 1, revive: 0, storm: 0, frost: 0, midas: 0,
    ap: (1 + 0.15 * (meta.ranks.codex || 0)) * bp, firstStrike: 0, frenzy: 0, sp: {}, el: {}, rank: sigRank(h.level), sigOn: h.level >= SIG_LEVEL,
    sigMul: h.level >= SIG_LEVEL ? 1 + 0.07 * (h.level - SIG_LEVEL) : 0, regen: 0, scale: raritySize(rar) * (1 + 0.08 * (heroStar(h) - 1)), rarity: rar, star: heroStar(h), echo: [0, 0, 0, 0.5, 0.75, 1][rar], dmgTaken: 1, bossDmg: 0, greed: 0, startShield: 0 };
  if (run.tech.focus) s.sigMul *= 1.25;
  if (s.rank > 0) s.rank += rar; // rarer legends cast a higher-ranked signature
  if (rar >= 2) s.startMana += rar >= 5 ? 1 : 0.35;
  s.ability = d.ability; s.aName = d.aName; s.aDesc = d.aDesc;
  const sp = meta.spec && meta.spec[d.cls];
  if (sp && sp.rank) { const P = SPECS[d.cls][sp.path];
    if (sp.path === 'a') { s.sigMul *= 1 + 0.4 * sp.rank; s.rank += 1; }
    else { s.ability = P.ability; s.aName = P.name; s.aDesc = SPEC_ADESC[P.ability]; s.sigMul *= 1 + 0.25 * (sp.rank - 1); } }
  s.startMana += 0.25 * (run.tech.wells ? 1 : 0) + 0.1 * (meta.ranks.codex || 0) + (run.tech.focus ? 0.5 : 0);
  syn = syn || activeSynergies(run);
  const Y = syn;
  if (d.race === 'human' && Y.human >= 0) { const v = [0.12, 0.28, 0.5][Y.human] * sm; s.hp *= 1 + v; s.atk *= 1 + v; }
  if (d.race === 'elf' && Y.elf >= 0) s.as *= 1 + [0.2, 0.45, 0.85][Y.elf] * sm;
  if (d.race === 'dwarf' && Y.dwarf >= 0) s.armor += [20, 50, 90][Y.dwarf] * sm;
  if (d.race === 'orc' && Y.orc >= 0) { s.lifesteal += [0.12, 0.25, 0.45][Y.orc] * sm; s.atk *= 1 + [0.08, 0.22, 0.45][Y.orc] * sm; }
  if (d.race === 'beast' && Y.beast >= 0) { s.crit += [0.2, 0.4, 0.7][Y.beast] * sm; s.spd *= 1 + [0.15, 0.25, 0.4][Y.beast]; }
  if (d.cls === 'mage' && Y.mage >= 0) { s.ap *= 1 + [0.25, 0.6, 1.2][Y.mage] * sm; s.startMana += [0.25, 0.45, 0.7][Y.mage]; }
  if (d.cls === 'rogue' && Y.rogue >= 0) { s.dodge += [0.15, 0.3, 0.45][Y.rogue] * Math.min(sm, 1.4); s.firstStrike = [0.5, 1.2, 2.5][Y.rogue] * sm; }
  if (d.cls === 'berserker' && Y.berserker >= 0) s.frenzy = [8, 16, 30][Y.berserker];
  // temperament: its own trade-off, its pair bonus when a twin is on the field, and team-wide pair bonuses
  const tk = heroTemper(h), T = TEMPERS[tk], tc = temperCounts(run);
  T.fx(s); if (h.place && tc[tk] >= 2 && T.pfx) T.pfx(s);
  for (const k in tc) if (tc[k] >= 2 && TEMPERS[k].team) TEMPERS[k].team(s);
  s.armor = Math.max(0, s.armor);
  // elements: each one is a fighting style (styles.js). A small stat lean toward the element's playstyle stays;
  // stacks of 2, 4 and 6 raise the style's level (s.sty) instead of multiplying stats (Cam 2026-10-23)
  const fe = stackElements(run); s.sty = {};
  for (const e of heroElements(run, h)) {
    const E = ELEMENTS[e], et = elTier(fe[e] || 0), p = sm * (1 + 0.5 * (et + 1));
    s.el[e] = p; s.sty[e] = et + 1;
    const b = EL_STACK.stat[et] || 0;
    if (E.style === 'ad') s.atk *= 1 + EL_LEAN.ad * p + b; else if (E.style === 'ap') s.ap *= 1 + EL_LEAN.ap * p + b; else { s.hp *= 1 + EL_LEAN.def * p + b; s.armor += 12 * p; }
    styleStats(s, e, et + 1, p);
  }
  if (trinityActive(run)) { s.hp *= 1.12 * sm; s.atk *= 1.12 * sm; }
  // items: a component gives its stat (a bit more inside a finished item); a finished item adds one effect of its own
  for (const it0 of heroItems(run, h)) for (const it of it0.sub ? [it0, it0.sub] : [it0]) {
    const fi = it.parts.length === 2 ? 1 : 0;
    for (const c of it.parts) { const C = COMPONENTS[c]; if (!C || !C.stat) continue; const v = C.stat[fi] / 100; switch (c) {
      case 'sword': s.atk *= 1 + v; break;
      case 'bow': s.as *= 1 + v; break;
      case 'rod': s.ap *= 1 + v; break;
      case 'tear': s.startMana += v; s.manaGain *= 1 + C.stat2[fi] / 100; break;
      case 'vest': s.armor += C.stat[fi]; break;
      case 'cloak': s.dodge += v; break;
      case 'belt': s.hp *= 1 + v; break;
      case 'glove': s.crit += v; break;
    } }
    if (it.parts.length === 2) {
      const sp = FINISHED[itemKey(...it.parts)][1]; s.sp[sp] = true;
      switch (sp) {
        case 'lifesteal': s.lifesteal += 0.2; break;
        case 'ambush': s.firstStrike += 2; break;
        case 'thorns': s.reflect += 0.3; break;
        case 'chainZap': s.storm = Math.max(s.storm, 0.25); break; case 'chill': s.frost = 0.3; break; case 'revive': s.revive = 0.5; break; case 'goldFinger': s.midas = 0.5; break;
        case 'fogstep': s.spd *= 1.3; break;
        case 'farsight': s.range *= 1.4; break;
        case 'bigHat': s.ap *= 1.5; break;
        case 'sigBoost': s.sigMul *= 1.4; break;
        case 'bubble': s.startShield = Math.max(s.startShield, 0.25); break;
        case 'heavyPlate': s.armor += 60; break;
        case 'ghost': s.dodge += 0.3; break;
        case 'regen': s.regen += 0.03; break;
        case 'bigBelt': s.hp *= 1.6; s.scale *= 1.15; break;
        case 'dice': s.crit += 0.2; break;
      }
    }
  }
  for (const it of heroItems(run, h)) if (it.sup) { const sp = s.sp; switch (it.sup) {
    case 'sword': s.atk *= 1.25; sp.splash = sp.twinStrike = sp.execute = true; break;
    case 'bow': s.as *= 1.25; sp.haste = true; s.storm = Math.max(s.storm || 0, 0.35); break;
    case 'rod': s.ap *= 1.35; s.sigMul *= 1.2; sp.curse = sp.runeStrike = true; break;
    case 'tear': s.startMana += 0.3; sp.wellspring = sp.refill = sp.manaHit = true; break;
    case 'vest': s.armor += 80; s.reflect += 0.3; sp.arrowWard = true; break;
    case 'cloak': s.dodge += 0.2; sp.counter = true; break;
    case 'belt': s.hp *= 1.4; s.regen += 0.03; sp.emberAura = true; break;
    case 'glove': s.crit += 0.25; sp.dice = sp.heavyHands = sp.execute = true; break;
  } }
  s.dodge = Math.min(0.6, s.dodge); s.crit = Math.min(1, s.crit);
  if (run.mods.giant) { s.hp *= 1.4; s.scale *= 1.4; }
  if (run.mods.shrunk === h.uid) { s.hp *= 0.7; s.atk *= 0.85; s.scale *= 0.6; }
  s.hp = Math.round(s.hp); s.atk = Math.round(s.atk);
  // ability power as a number, so signatures can show and scale with it (st.ap stays the multiplier)
  s.apv = Math.round(CLASS_AP[d.cls] * tm * lm * gm * 1.1 * s.ap);
  return s;
}

// ----- wave generation -----
function swarmK(s) { return 1 + BAL.swarm * (s - 1); }
function genWave(s, mods, tac, finale, lanes) {
  const fi = factionIndex(s), F = FACTIONS[fi], within = (s - 1) % 5, cyc = cycleOf(s);
  const pool = F.pool.slice(0, Math.min(F.pool.length, 2 + within));
  let budget = (BAL.budget0 + s * BAL.budgetS + within * BAL.budgetW + cyc * 10) * (s < 5 ? BAL.early + (1 - BAL.early) * (s - 1) / 4 : 1);
  if (mods.fewer) budget *= 0.75;
  if (mods.press) budget *= PRESS.budget;
  if (tac === 'swarm') budget *= 1.5; if (tac === 'shieldwall') budget *= 0.85;
  const list = [];
  const boss = finale ? 'shardgoose' : isBossSiege(s) ? bossFor(s) : null;
  if (boss) budget *= finale ? 0.4 : 0.5;
  let elites = within >= 3 ? 1 + Math.floor(s / 14) : within === 2 && s > 5 ? 1 : 0;
  if (cyc > 0) elites += 1;
  if (tac === 'captain') elites = Math.max(1, elites);
  if (mods.press) elites += PRESS.elites;
  for (let i = 0; i < elites && budget > ENEMIES[F.elite].cost; i++) { list.push(F.elite); budget -= ENEMIES[F.elite].cost; }
  // swarm: later sieges send more, individually weaker foes for the same total power, so the horde looks bigger every time
  const sw = swarmK(s) * BAL.thin; budget *= sw;
  let guard = 0;
  // tactics: a warband mixes in an earlier horde, an air raid calls flyers from every horde so far
  const old = tac === 'warband' ? FACTIONS[Math.max(0, fi - randi(1, 2))].pool : null;
  const air = tac === 'airraid' ? FACTIONS.slice(0, fi + 1).flatMap(f => f.pool).filter(id => ENEMIES[id].kind === 'flyer') : null;
  while (budget > 0.5 && guard++ < 600 && list.length < BAL.maxSpawn) { const id = old && Math.random() < 0.4 ? pick(old) : air && air.length && Math.random() < 0.35 ? pick(air) : pick(pool); list.push(id); budget -= ENEMIES[id].cost; }
  if (mods.chickens) { for (let i = 0; i < list.length; i++) if (!ENEMIES[list[i]].elite && Math.random() < 0.35) list[i] = 'chicken'; for (let i = 0; i < 6; i++) list.push('chicken'); }
  if (mods.honked) list.push('goose');
  for (let i = list.length - 1; i > 0; i--) { const j = randi(0, i); [list[i], list[j]] = [list[j], list[i]]; }
  list.sort((a, b) => (ENEMIES[a].elite ? 1 : 0) - (ENEMIES[b].elite ? 1 : 0));
  // three waves that build: a probe, a push, then the surge that pours in all at once
  const out = []; let t = 0.8; const n = list.length, n1 = Math.max(1, Math.round(n * 0.2)), n2 = Math.max(n1 + 1, Math.round(n * 0.5));
  const waves = n >= 8 && tac !== 'blitz' ? [list.slice(0, n1), list.slice(n1, n2), list.slice(n2)] : [list];
  let capt = tac === 'captain';
  waves.forEach((w, wi) => { const last = (wi === waves.length - 1 && waves.length > 1) || tac === 'blitz';
    if (wi > 0) { t += 2.5; out.push({ t: t - 1.2, event: last ? 'surge' : 'wave', wave: wi + 1, of: waves.length, n: w.length }); }
    w.forEach((id, i) => { const cp = capt && ENEMIES[id].elite; if (cp) capt = false; out.push({ t, id, sw: ENEMIES[id].elite ? 1 : sw, rush: last, captain: cp || undefined });
      t += last ? (i % 6 === 5 ? rand(0.5, 0.8) : rand(0.04, 0.12)) : wi === 1 ? rand(0.2, 0.45) : (i % 4 === 3 ? rand(1.2, 1.8) : rand(0.4, 0.8)); }); });
  if (boss) out.push({ t: Math.max(4, t * 0.45), id: boss, boss: true });
  if (lanes) for (const q of out) if (q.id && !q.boss) q.lane = ENEMIES[q.id].elite ? lanes.elite : pickLane(lanes.w);
  out.sort((a, b) => a.t - b.t);
  return out;
}

// ----- battle construction -----
function makeUnit(side, o) {
  return Object.assign({ side, alive: true, cd: rand(0.1, 0.6), mana: 0, shield: 0, stun: 0, slowT: 0, slowAmt: 0, poison: [], taunt: null, tauntT: 0,
    buffAtk: 0, buffAtkT: 0, buffAs: 0, buffAsT: 0, armorBuff: 0, armorBuffT: 0, anim: 0, atkT: 0, hitT: 0, facing: side === 'hero' ? 1 : -1, dmg: 0, heal: 0, taken: 0, kills: 0, dsrc: {}, hsrc: {}, tsrc: {}, cc: { stun: 0, taunt: 0, slow: 0 },
    frenzyStacks: 0, struck: false, retarget: 0, target: null, z: 0, vz: 0, hits: 0, xp: 0, soakT: 0, blindT: 0, curseT: 0, shred: 0, grumble: 0, qs: 0, spellblade: 0, uid: Math.random().toString(36).slice(2) }, o);
}

function startBattle(run, meta) {
  enforceField(run);
  const syn = activeSynergies(run);
  const B = { t: 0, siege: run.siege, heroes: [], enemies: [], queue: genWave(run.siege, pressOn(run) ? Object.assign({}, run.mods, { press: true }) : run.mods, run.tactic, run.finale === 'ready', run.finale === 'ready' ? null : run.lanes || (run.lanes = rollLanes(run.siege, run.tactic))), projs: [], zones: [], waves: [], marks: [], summons: [],
    ach: { sigs: 0, combos: 0, hammer: 0, chickens: 0 }, castle: run.castle, ballistaCd: 1.5, hammer: { cd: 0, pending: null }, cpow: { cd: 4 }, syn, done: null, goldEarned: 0, kills: 0, bossUnit: null, events: [], run, meta,
    bulwarkT: 0, undyingUsed: false, totalSpawn: 0, castleStart: run.castle.hp, drops: [], combos: [], goldBonus: 0, pinataT: 0, gooseT: 0, cheeseT: 4, bardT: 9, kettleT: 0 };
  // the horde recruits from your shop: leftover cards may defect and join this siege as elites
  const F0 = FACTIONS[factionIndex(run.siege)];
  // the boss's warband: legends it recruited from the pool, plus any cards you left in the shop that defect to it now
  if (!run.finale && run.siege > 1) for (const c of shopDefectors(run)) warbandAdd(run, c.id, true);
  for (const w of warbandFighters(run)) B.queue.push({ t: rand(4, 16), id: F0.elite, turncoat: w.id, wstar: warbandStar(w), defected: w.defected === run.siege, lane: run.lanes ? run.lanes.elite : undefined });
  B.queue.sort((a, b) => a.t - b.t); B.defectors = B.queue.filter(q => q.turncoat).map(q => q.turncoat);
  B.lanes = run.finale === 'ready' ? null : run.lanes; B.laneIdle = [0, 0, 0];
  B.totalSpawn = B.queue.length; B.goldRef = waveGoldRef(B.queue); B.coinAcc = 0; B.goldStart = run.gold;
  B.hz = HAZARDS[run.mods.hz] ? run.mods.hz : null; B.hzK = B.hz && HAZARDS[B.hz].kind; B.hzT = 2; B.hzPatches = [];
  const cp = (1 + (run.tech.resonance ? 0.3 : 0)) * (1 + 0.15 * (meta.ranks.banners || 0));
  B.combos = activeCombos(run).map((c, i) => Object.assign(c, { t: -1.5 * i, every: 9 * (run.tech.prism ? 0.77 : 1), power: cp }));
  for (const c of B.combos) if (c.kind === 'gold') B.goldBonus += 0.3 * cp;
  const teamItem = sp => placedHeroes(run).some(h => heroItems(run, h).some(it => [it, it.sub].some(x => x && x.parts.length === 2 && FINISHED[itemKey(...x.parts)][1] === sp)));
  const teamMana = teamItem('teamMana'), rally = teamItem('rally');
  for (const h of placedHeroes(run)) {
    const d = HERO_BY_ID[h.id], st = heroStats(h, run, meta, syn);
    let pos, rafter = false;
    st.groundRange = st.range;
    if (h.place.type === 'rafter') { pos = rafterPosition(run, h.place.i); rafter = true; st.range = BAL.rafterRange; }
    else pos = cellPos(h.place.c, h.place.r);
    if (run.mods.inspire) st.atk = Math.round(st.atk * 1.25);
    if (B.hzK === 'fog' && st.range > 40) st.range = Math.max(40, st.range * 0.7);
    if (B.hzK === 'gale') st.as *= 1.2;
    if (teamMana) st.startMana += 0.2;
    if (run.mods.rallycry) st.startMana += 0.5; // boss talk: rally
    if (run.mods.goad) st.atk = Math.round(st.atk * 1.15); // boss talk (finale): goad
    if (rally) st.as *= 1.1;
    const u = makeUnit('hero', { def: d, inst: h, key: heroSpriteKey(h), x: pos.x, y: pos.y, hx: pos.x, hy: pos.y, rafter, maxHp: st.hp, hp: st.hp, st, vscale: st.scale,
      maxMana: st.mana * BAL.sigMana, mana: !st.sigOn ? 0 : run.mods.tonic ? st.mana * BAL.sigMana - 1 : Math.min(st.mana * BAL.sigMana - 1, st.mana * BAL.sigMana * st.startMana), name: heroDisplayName(h), els: Object.keys(st.el) });
    if (run.mods.shaken === h.uid) u.stun = Math.max(u.stun || 0, 5); // boss talk: the voice lost their nerve
    if (st.startShield) u.shield = Math.max(u.shield || 0, u.maxHp * st.startShield);
    u.lane = laneOf(u.hy); B.heroes.push(u);
  }
  if (run.tech.intern) for (let i = 0; i < 2; i++) summonThrall(B, B.heroes[0] || { x: GRID.x + 30, y: GRID.y + 60, inst: { level: Math.max(1, run.siege) }, st: { ap: 1 } }, 0.6, 'thrall');
  applyBulwark(B);
  return B;
}

function applyBulwark(B) {
  const g = B.syn.guardian; if (g < 0) return;
  const pct = [0.1, 0.22, 0.4][g] * (1 + 0.15 * (B.meta.ranks.banners || 0));
  for (const u of B.heroes) if (u.alive) { u.shield = Math.max(u.shield, u.maxHp * pct); }
  FX.sound('shield');
}

function spawnEnemy(B, id, opts = {}) {
  const d = ENEMIES[id], s = B.siege, mods = B.run.mods;
  let hm = hpMul(s), am = atkMul(s);
  if (d.boss) { const f = BOSS_TOUGH[id] || 1, big = d.boss === 'big'; const decay = Math.pow(BAL.bossDecay, Math.max(0, s / 5 - 1)); hm = (big ? BAL.bigBoss : BAL.miniBoss) * decay * 75 * f * BAL.bossHp * hpMul(s) / d.hp; am = (big ? BAL.bigAtk : BAL.miniAtk) * 9 * f * atkMul(s) / d.atk; }
  // elites stay well below the siege's boss: never more than eliteCap of a mini-boss
  if (d.elite && !d.boss) hm = Math.min(hm, BAL.eliteCap * BAL.miniBoss * 75 * BAL.bossHp * hpMul(s) / d.hp);
  const tac = !d.boss && B.run.tactic, cap = !!opts.captain, tc = opts.turncoat && HERO_BY_ID[opts.turncoat];
  if (cap) { hm *= 2; am *= 1.4; }
  const ws = opts.wstar || 1; if (tc) { hm *= (1 + 0.3 * tc.rar) * WARBAND.hp[ws - 1]; am *= (1 + 0.15 * tc.rar) * WARBAND.atk[ws - 1]; }
  if (tac === 'swarm') hm *= 0.65; if (tac === 'blitz') hm *= 0.85;
  if (mods.curse) hm *= 1.3;
  if (d.boss && mods.bossmad) hm *= 1.25; if (d.boss && mods.bosssoft) hm *= 0.8;
  if (d.boss && mods.goad) am *= 1.15; // boss talk (finale): you goaded the goose
  let vs = 1, spdM = rand(0.92, 1.08);
  if (mods.tiny && !d.boss) { hm *= 0.75; vs = 0.7; spdM *= 1.3; }
  if (mods.partyhats) spdM *= 0.85;
  const hzK = HAZARDS[mods.hz] && HAZARDS[mods.hz].kind;
  if (hzK === 'gale') spdM *= 1.2;
  if (hzK === 'goldrush') hm *= 1.2;
  const fly = d.kind === 'flyer';
  const band = opts.lane != null ? laneBand(opts.lane) : null;
  const y = opts.y != null ? opts.y : band ? rand(band.y0, band.y1) : rand(GRID.y + 4, GRID.y + GRID.rows * GRID.cell + 2);
  const swk = opts.sw && !d.boss ? opts.sw : 1; hm /= swk; am /= swk; if (opts.rush) spdM *= 1.15; if (tac === 'blitz') spdM *= 1.35;
  const hp = Math.round(d.hp * hm);
  const u = makeUnit('enemy', { def: d, id, key: 'e:' + id, x: opts.x != null ? opts.x : W + rand(8, 30), y, maxHp: hp, hp, atk: d.atk * am, as: d.as, range: d.range, spd: d.spd * spdM, armor: d.armor,
    flying: fly, z: fly ? 16 : 0, scale: d.scale || 1, vscale: vs, gold: Math.round(d.gold * goldMul(s) / swk * BAL.goldK * (d.boss ? BAL.bossGold * (mods.bossmad ? 2 : 1) * (mods.taunt ? 1.25 : 1) : 1)), xpv: (d.boss === 'big' ? 200 : d.boss ? 90 : (d.cost || 1) * BAL.xpK / swk) * (1 + 0.07 * (s - 1)),
    boss: d.boss, skillT: {}, name: d.name, hat: !!mods.partyhats });
  if (tac === 'shieldwall') u.armor += 30;
  if (cap) { u.captain = true; u.scale *= 1.25; u.name = 'Captain ' + u.name; }
  // a legend you left in the shop, fighting for the horde (beat them and their copy goes back to the pool)
  if (tc) { u.turncoat = tc.id; u.wstar = ws; u.key = 'h:' + tc.id; u.nativeFace = 1; u.scale = 1.1;
    u.name = (opts.defected ? 'Turncoat ' : bossShort(bossFor(s)) + '\'s ') + tc.name.split(' ')[0] + (ws > 1 ? ' ' + '★'.repeat(ws) : '');
    if (CLASS_BASE[tc.cls].range > 40) { u.range = Math.min(110, CLASS_BASE[tc.cls].range); u.proj = tc.cls === 'mage' || tc.cls === 'cleric' ? 'spark' : 'arrow'; }
    FX.text(u.x - 20, u.y - 22, opts.defected ? 'TURNCOAT' : 'WARBAND', '#c58cff', true, true); }
  if (hzK === 'fog' && u.range > 40) u.range = Math.max(40, u.range * 0.7);
  if (hzK === 'goldrush') u.gold = Math.round(u.gold * 1.5);
  if (id === 'shardgoose') { u.shards = 12; u.shardBase = { atk: u.atk, armor: u.armor }; }
  if (d.boss) { B.bossUnit = u; u.final = s >= FINAL_SIEGE; u.y = GRID.y + GRID.rows * GRID.cell / 2 + 6; for (const sk of d.skills) u.skillT[sk] = rand(3, 6); if (BOSS_MOVES[id]) u.skillT.move = 5;
    if (mods.taunt) for (const sk in u.skillT) u.skillT[sk] = Math.min(u.skillT[sk], 1.5); // boss talk: taunted, it opens with its fury
    FX.shake(14); FX.flash('#ffffff', 0.25); FX.combo(W / 2, 64, d.name.toUpperCase(), ['#ff5d8f', '#ffd84a']); FX.sound('roar');
    FX.banner(d.boss === 'big' ? 'BOSS' : 'MINI-BOSS', d.name, { kind: 'boss', spr: 'e:' + id }); FX.shake(6); FX.sound('boss'); }
  if (id === 'goose') FX.text(u.x - 20, u.y - 20, 'HONK', '#ffffff', true, true);
  B.enemies.push(u); return u;
}

// ----- combat helpers -----
function nearest(list, p, maxD = Infinity, filter) {
  let best = null, bd = maxD;
  for (const u of list) { if (!u.alive || (filter && !filter(u))) continue; const d = dist(u, p); if (d < bd) { bd = d; best = u; } }
  return best;
}
function inRadius(list, p, r) { return list.filter(u => u.alive && dist(u, p) <= r); }
// every guardian signature taunts in a wide circle (Cam: guardians must pull the whole front line)
const TAUNT_R = 120;
function guardTaunt(B, u, t) { const rad = TAUNT_R + 10 * RK(u); for (const e of inRadius(B.enemies, u, rad)) { e.taunt = u; e.tauntT = Math.max(e.tauntT, t); } FX.shockwave(u.x, u.y - 4, rad, '#ff3d6e'); }
function densest(list, r, near, maxD = 999) {
  let best = null, bc = 0;
  for (const u of list) { if (!u.alive || (near && dist(u, near) > maxD)) continue; const c = inRadius(list, u, r).length; if (c > bc) { bc = c; best = u; } }
  return best;
}
function armorFactor(a) { return 100 / (100 + Math.max(-50, a)); }
function teamAtk(B) { const hs = B.heroes.filter(h => h.alive && !h.temp); return hs.length ? hs.reduce((a, h) => a + h.st.atk * Math.max(1, h.st.ap), 0) / hs.length : 20; }

// battle stats for one hero, its summons folded in
function heroBattleStats(B, u) {
  const r = { dmg: u.dmg, heal: u.heal, taken: u.taken, dsrc: Object.assign({}, u.dsrc), hsrc: Object.assign({}, u.hsrc), tsrc: Object.assign({}, u.tsrc), cc: Object.assign({}, u.cc) };
  for (const t of B.heroes) if (t.temp && t.owner === u) { r.dmg += t.dmg; addTo(r.dsrc, 'summon', t.dmg); r.heal += t.heal; }
  r.ccT = r.cc.stun + r.cc.taunt + r.cc.slow; return r;
}
// DTAG names where hero damage and healing come from (auto, ability, item, element, bonus) for the battle stats panel
let DTAG = null;
const addTo = (m, k, v) => { m[k] = (m[k] || 0) + v; };
function dealDamage(B, src, tgt, amount, o = {}) {
  if (!tgt.alive) return 0;
  if (tgt.side === 'hero' && !o.unavoidable) {
    if (src && src.blindT > 0 && Math.random() < 0.25) { FX.text(tgt.x, tgt.y - 18, 'miss', '#fff3b0'); return 0; }
    if (tgt.st.dodge && Math.random() < tgt.st.dodge) { FX.text(tgt.x, tgt.y - 18, 'dodge', '#bff4ff');
      if (src && src.alive && src.side === 'enemy') { if (tgt.st.sp.counter) dealDamage(B, tgt, src, tgt.st.atk, { from: 'item', noProc: true }); }
      return 0; }
  }
  let crit = false;
  if (src && src.side === 'hero' && src.st && !o.noCrit && Math.random() < src.st.crit) { amount *= src.st.sp.dice ? rand(1.5, 2.5) : src.st.critMul; crit = true; }
  if (src && src.side === 'hero' && src.st && src.st.firstStrike && !src.struck) { amount *= 1 + src.st.firstStrike; src.struck = true; crit = true; }
  if (src && src.side === 'hero' && src.spellblade > 0 && !o.noProc && !o.sig) { amount *= 2; src.spellblade--; }
  if (src && src.side === 'hero' && src.st && src.st.sp.brimming && !o.sig && src.maxMana > 0) amount *= 1 + 0.4 * Math.min(1, src.mana / src.maxMana);
  if (tgt.side === 'hero' && tgt.stoneT > B.t) return 0;
  if (tgt.side === 'hero' && o.ranged && tgt.st.sp.arrowWard) amount *= 0.6;
  if (B.sty) amount *= styleDmgMul(B, src, tgt, o, amount);
  if (src && src.side === 'hero') amount *= traitDmgMul(B, src, tgt);
  if (src && src.side === 'hero' && src.st && src.st.bossDmg && tgt.boss) amount *= 1 + src.st.bossDmg;
  if (tgt.side === 'hero' && tgt.st && tgt.st.dmgTaken && tgt.st.dmgTaken !== 1) amount *= tgt.st.dmgTaken;
  if (tgt.side === 'hero' && tgt.lotusT > B.t) amount *= 0.75;
  if (tgt.side === 'enemy' && tgt.vulnT > B.t) amount *= 1.2;
  if (B.otT && src) amount *= src.side === 'hero' ? 1 + BAL.otRamp * B.otT : 1;
  const armor = tgt.side === 'hero' ? tgt.st.armor + tgt.armorBuff : tgt.armor - tgt.shred - (tgt.pry || 0);
  let dmg = amount * armorFactor(armor);
  if (tgt.side === 'enemy') { if (tgt.soakT > 0) dmg *= 1.2; if (tgt.curseT > 0) dmg *= 1.2; }
  if (tgt.shield > 0) { const ab = Math.min(tgt.shield, dmg); tgt.shield -= ab; dmg -= ab; if (ab > 0 && tgt.side === 'hero') addTo(tgt.tsrc, 'shield', ab); if (ab > 0 && dmg <= 0) FX.text(tgt.x, tgt.y - 18, Math.round(ab), '#9ff6ff'); }
  dmg = Math.max(0, dmg);
  if (tgt.side === 'hero') dmg = traitTaken(B, src, tgt, dmg);
  tgt.hp -= dmg; tgt.hitT = 0.12; tgt.taken += dmg;
  if (tgt.side === 'hero' && tgt.undyingT > B.t && tgt.hp < 1) tgt.hp = 1;
  if (tgt.side === 'hero' && tgt.st.sp.statue && !tgt.stoneUsed && tgt.hp > 0 && tgt.hp < tgt.maxHp * 0.3) { tgt.stoneUsed = true; tgt.stoneT = B.t + 2; tgt.stun = Math.max(tgt.stun || 0, 2); FX.text(tgt.x, tgt.y - 22, 'STONE', '#c8c2b4', true); FX.particles(tgt.x, tgt.y - 8, 12, ['#9a9488', '#d8d2c4'], { spread: 14 }); }
  if (src) src.dmg += dmg;
  if (src && src.side === 'hero') { addTo(src.dsrc, src.temp ? 'summon' : o.from || (o.sig ? 'ability' : DTAG || 'auto'), dmg); if (tgt.side === 'enemy') tgt.ccBy = src.temp && src.owner ? src.owner : src; }
  else if (!src && tgt.side === 'enemy') tgt.ccBy = null;
  if (tgt.side === 'hero') addTo(tgt.tsrc, !src ? 'other' : src.boss ? 'boss' : o.ranged ? 'ranged' : 'melee', dmg);
  if (dmg >= 1 && !o.quiet) FX.dmg(tgt, dmg, tgt.side === 'hero' ? 'taken' : crit ? 'crit' : o.sig ? 'sig' : o.kind || 'hit');
  if (tgt.side === 'hero') { if (tgt.st.sigOn) tgt.mana = Math.min(tgt.maxMana, tgt.mana + 3 * tgt.st.manaGain); if (tgt.sty) styleHurt(B, tgt, src, o); }
  if (src && src.side === 'hero' && src.st) {
    if (src.st.lifesteal) healUnit(B, src, src, dmg * src.st.lifesteal, true, 'lifesteal');
    if (crit && src.st.sp.heavyHands && !o.noProc && tgt.alive) dealDamage(B, src, tgt, src.maxHp * 0.05, { from: 'item', noProc: true, noCrit: true, quiet: true });
    if (crit && src.st.sp.armorBreak && tgt.side === 'enemy') tgt.pry = Math.min(50, (tgt.pry || 0) + 10);
    if (!o.noProc) {
      if (B.syn.toad >= 0) tgt.poison.push({ dps: [3, 8, 20][B.syn.toad] * (1 + 0.04 * B.siege) * (1 + 0.15 * (B.meta.ranks.banners || 0)), t: 3, src, from: 'bonus' });
      if (src.st.frost) { tgt.slowT = 2; tgt.slowAmt = Math.max(tgt.slowAmt, src.st.frost); }
      if (src.st.storm && Math.random() < src.st.storm) chainLightning(B, src, tgt, src.st.atk * 1.2, 3, '#bff4ff', 'item');
      if (src.sty) styleHit(B, src, tgt, dmg, o);
      if (crit && src.st.sp.execute && !tgt.boss && tgt.hp > 0 && tgt.hp < tgt.maxHp * 0.2) { FX.text(tgt.x, tgt.y - 22, 'EXECUTED', '#ff3d6e', true); tgt.hp = 0; }
      if (src.st.sp.splash) for (const e of inRadius(B.enemies, tgt, 18)) if (e !== tgt) dealDamage(B, src, e, amount * 0.4, { from: 'item', noProc: true, quiet: true });
      if (src.st.sp.manaHit && src.st.sigOn) src.mana = Math.min(src.maxMana, src.mana + 5);
    }
    traitHit(B, src, tgt, dmg, o, crit);
  }
  if (tgt.side === 'hero' && src && src.side === 'enemy' && !o.ranged && tgt.st.reflect) dealDamage(B, tgt, src, dmg * tgt.st.reflect, { from: tgt.st.el.nature ? 'element' : 'item', noProc: true, quiet: true, noCrit: true });
  if (tgt.hp <= 0) killUnit(B, tgt, src);
  return dmg;
}

function healUnit(B, src, tgt, amt, quiet, from) {
  if (!tgt.alive) return;
  const before = tgt.hp; tgt.hp = Math.min(tgt.maxHp, tgt.hp + amt); const got = tgt.hp - before;
  if (B.syn) traitOverheal(B, tgt, amt - got);
  if (src) { src.heal += got; if (src.hsrc) addTo(src.hsrc, from || DTAG || 'auto', got); }
  if (!quiet && got >= 1) FX.dmg(tgt, got, 'heal');
}

function giveXP(B, killer, v) {
  const hs = B.heroes.filter(h => !h.temp);
  if (!hs.length) return;
  if (killer && killer.side === 'hero' && !killer.temp) killer.xp += v * 0.5; else v *= 2;
  const share = v * 0.5 / hs.length; for (const h of hs) h.xp += share;
}

function killUnit(B, u, src) {
  if (!u.alive) return;
  if (u.side === 'hero') {
    const sk = B.syn.skeleton, bone = u.def && u.def.race === 'skeleton';
    if (!u.temp && sk >= 0 && !u.risen && (bone ? (sk >= 1 || !B.undyingUsed) : sk >= 2 && !B.undyingOther)) {
      if (!bone) B.undyingOther = true; else B.undyingUsed = true; u.risen = true; u.hp = u.maxHp * (sk >= 2 ? 1 : 0.5); FX.text(u.x, u.y - 22, 'UNDYING', '#e9e4ff', true); FX.particles(u.x, u.y - 8, 14, '#e9e4ff', { spread: 30 }); FX.sound('revive'); return;
    }
    if (B.sty && styleSave(B, u)) return;
    if (u.alive && traitSave(B, u)) return;
    if (u.st && u.st.revive && !u.phoenixUsed) { u.phoenixUsed = true; u.hp = u.maxHp * u.st.revive; FX.text(u.x, u.y - 22, 'REBORN', '#ff8a3a', true); FX.particles(u.x, u.y - 8, 20, '#ff8a3a', { spread: 40, up: true }); FX.sound('revive'); return; }
    u.alive = false; u.hp = 0; u.deadT = 0; FX.particles(u.x, u.y - 8, 12, '#ffffff', { spread: 30 }); FX.sound('herodie');
    if (!u.temp) FX.text(u.x, u.y - 26, 'XP lost', '#ff7a9a', true, true);
    traitFell(B, u);
    if (B.heroes.every(h => !h.alive || h.temp)) FX.text(W / 2, 60, 'The heroes have fallen!', '#ff7a9a', true);
    return;
  }
  u.alive = false; u.hp = 0;

  traitKill(B, src && src.owner ? src.owner : src, u);
  B.kills++; if (src) src.kills++; if (B.ach) { if (B.hammering) B.ach.hammer++; if (u.id === 'chicken') B.ach.chickens++; }
  giveXP(B, src && src.owner ? src.owner : src, u.xpv || 0);
  const run = B.run;
  let g = u.gold / (goldMul(B.siege) * BAL.goldK) / B.goldRef * killCoins(B.siege) * (1 + (run.tech.vault1 ? 0.15 : 0) + (run.tech.vault2 ? 0.2 : 0) + 0.08 * (B.meta.ranks.chest || 0) + B.goldBonus + (u.hat ? 0.25 : 0));
  if (src && src.st && src.st.midas) g *= 1 + src.st.midas;
  if (src && src.st && src.st.greed) g *= 1 + src.st.greed;
  if (B.sty) g *= styleKill(B, src, u);
  if (B.pinataT > 0) g *= 3;
  if (u.boss) g += u.final ? 5 : BOSS_PURSE[u.boss === 'big' ? 'big' : 'mini'];
  B.coinAcc += g; g = Math.floor(B.coinAcc); B.coinAcc -= g;
  if (g > 0) { run.gold += g; B.goldEarned += g; FX.coins(u.x, u.y - 8 - u.z, g); }
  FX.particles(u.x, u.y - 6 - u.z, u.boss ? 60 : u.def.elite ? 20 : 9, u.def.spr.body || u.def.spr.skin || '#8fd14f', { spread: u.boss ? 80 : 30 });
  FX.puff(u.x, u.y - u.z, u.scale);
  FX.sound(u.id === 'chicken' ? 'bawk' : u.id === 'goose' ? 'honk' : u.boss ? 'bossdie' : 'kill');
  if (u.id === 'chicken') FX.text(u.x, u.y - 18, 'BAWK', '#ffffff', false, true);
  // loot drops: elites sometimes, bosses always
  let drops = 0;
  if (u.boss) drops = (u.def.boss === 'big' ? ITEM_DROP.bigBoss : ITEM_DROP.miniBoss) + (run.tech.trophy ? 1 : 0);
  else if (u.captain) drops = Math.random() < ITEM_DROP.captain ? 1 : 0;
  else if (u.def.elite && Math.random() < ITEM_DROP.elite) drops = 1;
  else if (u.id === 'goose') drops = 1;
  for (let i = 0; i < drops; i++) { const key = Math.random() < ITEM_DROP.shard ? 'shard' : pick(COMP_KEYS); B.drops.push(key); FX.drop(u.x + i * 6, u.y - 10 - u.z, key); }
  if (u.def.split) { const n = u.boss ? 6 : 2; for (let i = 0; i < n; i++) spawnEnemy(B, u.def.split, { x: u.x + rand(-10, 10), y: clamp(u.y + rand(-14, 14), GRID.y, GRID.y + GRID.rows * GRID.cell) }); }
  if (u.boss) { FX.hitstop(0.35); FX.shake(10); FX.flash('#ffffff', 0.6); FX.banner(u.def.boss === 'big' ? 'BOSS SLAIN' : 'MINI-BOSS SLAIN', u.def.name, { kind: 'slain', spr: 'e:' + u.id }); B.bossKilled = u.def.boss; }
}

function chainLightning(B, src, first, dmg, n, color, from) {
  let cur = first; const hit = new Set(); const pts = [{ x: src.x, y: src.y - 12 - (src.z || 0) }];
  for (let i = 0; i < n && cur; i++) {
    hit.add(cur); pts.push({ x: cur.x, y: cur.y - 8 - cur.z });
    dealDamage(B, src, cur, dmg, { noProc: true, kind: 'magic', from });
    cur = nearest(B.enemies, cur, 64, e => !hit.has(e));
  }
  FX.bolt(pts, color || '#9ff6ff'); FX.sound('zap');
}

function fireProj(B, src, tgt, type, dmg, o = {}) {
  const sx = src.x + (src.facing || 1) * 6, sy = src.y - 10 - (src.z || 0);
  const tx = o.tx != null ? o.tx : tgt.x, ty = o.ty != null ? o.ty : tgt.y - 8 - (tgt.z || 0);
  const d = Math.hypot(tx - sx, ty - sy), spd = o.speed || 220; if (!o.from && DTAG) o.from = DTAG;
  B.projs.push({ src, tgt, type, dmg, x: sx, y: sy, sx, sy, tx, ty, t: 0, dur: Math.max(0.08, d / spd), arc: o.arc || (type === 'rock' || type === 'bullet' || type === 'fireBig' || type === 'ham' || type === 'cheese' ? 0.25 : 0.06) * d, o });
}

function projLand(B, p) {
  const o = p.o;
  if (o.vfx && !o.onLand) FX.vfxLand(p);
  if (o.onLand) { o.onLand(p); return; }
  if (p.tgt && p.tgt.alive) {
    if (p.type === 'heal' && p.tgt.side === 'hero') healUnit(B, p.src, p.tgt, p.dmg, false, o.from);
    else dealDamage(B, p.src, p.tgt, p.dmg, { ranged: true, sig: o.sig, from: o.from });
  }
  if (p.type === 'fire' || p.type === 'bullet') FX.particles(p.tx, p.ty, 5, p.type === 'fire' ? '#ff8a3a' : '#ffde3a', { spread: 14 });
  if (o.splash) { for (const h of inRadius(p.src.side === 'enemy' ? B.heroes : B.enemies, { x: p.tx, y: p.ty + 8 }, o.splash)) if (h !== p.tgt) dealDamage(B, p.src, h, p.dmg * 0.6, { ranged: true, from: o.from }); }
  if (o.slow && p.tgt) { p.tgt.slowT = 2; p.tgt.slowAmt = o.slow; }
  if (o.poison && p.tgt) p.tgt.poison.push({ dps: o.poison * atkMul(B.siege), t: 3 });
}

// ----- castle -----
// melee foes at the wall raise a ladder to reach rafter heroes; once someone is up, a pack of three or more grabs a ram
function siegeTricks(B, u, dt) {
  if (u.onRafter) { u.y = castleRafterY(B.run); u.z = 0; u.x = clamp(u.x, 4, CASTLE_X - 2); }
  if (u.climb) { const L = u.climb; L.t += dt;
    if (L.phase === 'raise') { u.atkT = 0.1; if (L.t >= 1.1) { L.phase = 'up'; L.t = 0; } return true; }
    const top = Math.max(0, u.y - castleRafterY(B.run)); u.z = Math.min(top, top * L.t / 1.4); u.x = CASTLE_X + 11;
    if (L.t >= 1.4) { u.climb = null; u.onRafter = true; u.z = 0; u.y = castleRafterY(B.run); u.x = CASTLE_X - 4; u.retarget = 0; B.ladders = (B.ladders || 0) + 1; FX.text(u.x, u.y - 22, 'OVER THE WALL', '#ff7a9a', true); }
    return true; }
  if (u.onRafter || u.flying || u.boss || u.range > 40 || u.ram || u.x > CASTLE_X + 14 + (u.scale - 1) * 10 || (u.target && u.target.alive)) return false;
  const rafters = B.heroes.some(h => h.alive && h.rafter);
  if (rafters && !(u.ladderCd > 0)) { const up = B.enemies.filter(e => e.alive && (e.climb || e.onRafter)).length;
    if (up < 2 && Math.random() < dt * 0.25) { u.climb = { phase: 'raise', t: 0, y0: u.y }; FX.text(u.x, u.y - 22, 'LADDER!', '#ffd84a', true); FX.sound('thud'); return true; } }
  u.ladderCd = (u.ladderCd || 0) - dt;
  if (!B.ram && B.ladders > 0) { const crew = B.enemies.filter(e => e.alive && !e.boss && !e.flying && e.range <= 40 && !e.climb && !e.onRafter && e.x < CASTLE_X + 16 + (e.scale - 1) * 10 && Math.abs(e.y - u.y) < 30);
    if (crew.length >= 3) { const c3 = crew.slice(0, 3); B.ram = { crew: c3, t: 0, swing: 0, y: c3.reduce((a, e) => a + e.y, 0) / 3 }; for (const e of c3) e.ram = B.ram; FX.text(u.x, u.y - 26, 'BATTERING RAM!', '#ff9a3a', true); FX.sound('thud'); } }
  return false;
}
function stepRam(B, dt) { const R = B.ram; if (!R) return; for (const e of R.crew) if (e.alive && e.x > CASTLE_X + 34) e.ram = null; R.crew = R.crew.filter(e => e.alive && e.ram === R);
  if (R.crew.length < 2) { for (const e of R.crew) e.ram = null; B.ram = null; return; }
  R.t += dt; R.swing = (R.t % 2.4) / 2.4; for (const e of R.crew) { e.atkT = 0.1; e.facing = -1; }
  if (R.t >= 2.4) { R.t = 0; for (const e of R.crew) e.siegeT = B.t; const dmg = R.crew.reduce((a, e) => a + e.atk, 0) * 2.2; damageCastle(B, dmg, null); FX.shake(5); FX.text(CASTLE_X + 6, R.y - 30, 'BOOM', '#ff9a3a', true); FX.particles(CASTLE_X, R.y - 10, 10, ['#c9c4e6', '#8a6a4a'], { spread: 14 }); FX.sound('thud'); } }
function damageCastle(B, dmg, src) {
  if (B.run.mods.firm) dmg *= 0.85; // boss talk: stand firm
  dmg *= traitCastleMul(B);
  B.castle.hp -= dmg; B.castleHitT = 0.15; if (src) src.siegeT = B.t;
  if (Math.random() < 0.35) FX.dmg({ x: CASTLE_X - 6 + rand(-8, 4), y: rand(120, 200), z: 0, uid: 'castle' }, dmg, 'taken');
  if (src && src.alive && src.range <= 40 && B.run.tech.bastion) dealDamage(B, null, src, dmg * 0.8, { quiet: true });
  if (B.castle.hp <= 0 && !B.done) { B.castle.hp = 0; B.done = 'defeat'; FX.shake(12); FX.sound('castlefall'); }
}

// ----- signatures (hero abilities) -----
// r = extra rank (0 at level 5, grows at 8/12/16/20). S(u) = signature power.
const S = u => u.st.atk * Math.max(0.3, u.st.ap) * Math.max(0.3, u.st.sigMul);
// signature numbers from SIG_SCALE: AD, AP and HP shares, times signature power and the echo multiplier
function AB(u, i = 0) { const c = (SIG_SCALE[u.st.ability || u.def.ability] || [])[i]; if (!c) return S(u); return scaleValue(c, u.st, u.maxHp) * Math.max(0.3, u.st.sigMul) * (u.abMul || 1); }
// heals and shields that also take a share of the target's max HP
function ABH(u, i, t) { const c = (SIG_SCALE[u.st.ability || u.def.ability] || [])[i] || {}; return AB(u, i) + (c.thp || 0) * t.maxHp * Math.max(0.3, u.st.sigMul) * (u.abMul || 1); }
const RK = u => Math.max(0, u.st.rank - 1);
const ABILITIES = {
  shieldBash(B, u) { const r = RK(u), rad = 34 * (1 + 0.12 * r), t = nearest(B.enemies, u, 170); if (!t) return false; const pw = sigPower(u), D = AB(u); u.shield += AB(u, 1) + u.maxHp * 0.05 * r; guardTaunt(B, u, 2);
    fireProj(B, u, t, 'orb', 0, { speed: 260, vfx: { shape: 'disc', col: '#ffe066', col2: '#fff7c0', pw }, onLand: p => { for (const e of inRadius(B.enemies, { x: p.tx, y: p.ty + 8 }, rad)) { dealDamage(B, u, e, D, { sig: true }); e.stun = Math.max(e.stun, 1.5 + 0.2 * r); }
      FX.blast(p.tx, p.ty + 6, rad, ['#ffffff', '#fff3a0', '#ffe066', '#c99a2a'], pw); FX.sound('bash'); } }); FX.sound('whoosh'); },
  fireball(B, u) { const r = RK(u), rad = 30 * (1 + 0.12 * r); const c = densest(B.enemies, 28, u, u.st.range * 1.4) || nearest(B.enemies, u); if (!c) return false;
    const pw = sigPower(u), D = AB(u); fireProj(B, u, c, 'fireBig', 0, { speed: 170, pw, onLand: p => { for (const e of inRadius(B.enemies, { x: p.tx, y: p.ty + 8 }, rad)) dealDamage(B, u, e, D, { sig: true }); FX.fireburst(p.tx, p.ty + 6, rad, pw); FX.sound('boom'); } }); FX.sound('cast'); },
  bladeDance(B, u) { const r = RK(u); const ts = B.enemies.filter(e => e.alive && dist(e, u) < 130 + 15 * r).sort((a, b) => dist(a, u) - dist(b, u)).slice(0, 4 + r); if (!ts.length) return false; u.dash = { ts, i: 0, t: 0, dmg: AB(u) }; FX.sound('dash'); },
  arrowRain(B, u) { const r = RK(u); const c = densest(B.enemies, 30, u, u.st.range * 1.4) || nearest(B.enemies, u); if (!c) return false; B.zones.push({ type: 'arrows', x: c.x, y: c.y, r: 32 * (1 + 0.12 * r), n: 6 + 2 * r, every: 0.3, t: 0, src: u, dmg: AB(u), pw: sigPower(u) }); FX.launch(u.x + 4, u.y - 14 - (u.z || 0), 8 + 2 * r); FX.sound('cast'); },
  whirlwind(B, u) { u.spin = 2 + 0.4 * RK(u); u.spinTick = 0; u.spinDmg = AB(u); FX.sound('whirl'); },
  boneWall(B, u) { const r = RK(u); guardTaunt(B, u, 3 + 0.5 * r); u.armorBuff = AB(u) + 20 * r; u.armorBuffT = 4; for (let i = 0; i < 9 + r; i++) { const a = -1.2 + i * 2.4 / (8 + r); FX.spikes(u.x + 14 + Math.cos(a) * 40, u.y + Math.sin(a) * 30, '#f1ecdc', i * 0.03); } FX.text(u.x, u.y - 24, 'TAUNT', '#e9e4ff', true); FX.shake(4); FX.sound('bash'); },
  lilySplash(B, u) { const r = RK(u); const allies = B.heroes.filter(h => h.alive && h.hp < h.maxHp).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp).slice(0, 3 + r); if (!allies.length) return false; for (const a of allies) fireProj(B, u, a, 'heal', ABH(u, 0, a) * (1 + 0.14 * r), { speed: 160, vfx: { shape: 'lily', col: '#7cf0ff', col2: '#ffffff', pw: sigPower(u) } }); FX.particles(u.x, u.y - 14, 20, '#7cf0ff', { spread: 26, up: true }); FX.sound('heal'); },
  pounce(B, u) { const t = B.enemies.filter(e => e.alive && dist(e, u) < 170).sort((a, b) => b.x - a.x)[0]; if (!t) return false; const r = RK(u), D = AB(u); u.leap = { sx: u.x, sy: u.y, tx: t.x - 8, ty: t.y, t: 0, dur: 0.35, h: 30, onLand: () => { dealDamage(B, u, t, D * (1 + 0.11 * r), { sig: true }); FX.claws(t.x, t.y - 10, '#ff9a3a'); for (const e of inRadius(B.enemies, t, 18 + 4 * r)) if (e !== t) dealDamage(B, u, e, D * 0.27, { sig: true }); FX.particles(t.x, t.y - 8, 24, '#ff5d8f', { spread: 30 }); FX.shockwave(t.x, t.y, 40, '#ff5d8f'); FX.shake(4); FX.sound('slash'); } }; },
  rampage(B, u) { const r = RK(u); const t = B.enemies.filter(e => e.alive && !e.onRafter && dist(e, u) < 120 + 10 * r).sort((a, b) => b.x - a.x)[0]; if (!t) return false; const D = AB(u);
    const sx = u.x, sy = u.y; u.leap = { sx, sy, tx: t.x + 10, ty: t.y, t: 0, dur: 0.4, h: 6, onLand: () => { const dx = t.x + 10 - sx, dy = t.y - sy, L2 = dx * dx + dy * dy || 1;
      for (const e of B.enemies) if (e.alive && !e.onRafter) { const f = clamp(((e.x - sx) * dx + (e.y - sy) * dy) / L2, 0, 1), px = sx + f * dx, py = sy + f * dy; if (Math.hypot(e.x - px, e.y - py) < 14 + 2 * r) { dealDamage(B, u, e, D * (1 + 0.11 * r), { sig: true }); e.stun = Math.max(e.stun || 0, 0.4); } }
      u.buffAs = Math.max(u.buffAs, 0.4 + 0.05 * r); u.buffAsT = 4; FX.blast(u.x, u.y, 26, ['#ffffff', '#ffd0a0', '#ff9a3a', '#8a5a2a'], sigPower(u)); FX.claws(u.x + 6, u.y - 10, '#ff3d3d'); FX.sound('quake'); } }; FX.sound('roar'); },
  quake(B, u) { const r = RK(u); B.waves.push({ type: 'quake', x: u.x, y: u.y, vx: 170, life: 0.75 + 0.15 * r, t: 0, src: u, dmg: AB(u), hit: new Set(), kb: 24, h: 20 + 4 * r }); FX.shake(6); FX.sound('quake'); },
  chainLightning(B, u) { const t = nearest(B.enemies, u, u.st.range * 1.4); if (!t) return false; const pw = sigPower(u), D = AB(u);
    fireProj(B, u, t, 'orb', 0, { speed: 300, vfx: { shape: 'bolt', col: '#5fd3ff', col2: '#bff4ff', pw }, onLand: p => { const f = p.tgt && p.tgt.alive ? p.tgt : nearest(B.enemies, { x: p.tx, y: p.ty }, 60); if (f) chainLightning(B, u, f, D, 6 + RK(u), '#bff4ff');
      FX.blast(p.tx, p.ty + 4, 18, ['#ffffff', '#bff4ff', '#5fd3ff', '#2a5aa8'], pw, { shards: 4 }); FX.flash('#bff4ff', 0.12); } }); FX.sound('zap'); },
  dawnMend(B, u) { const r = RK(u); for (const h of B.heroes) if (h.alive) { healUnit(B, u, h, ABH(u, 0, h) * (1 + 0.13 * r)); h.poison = []; h.stun = 0; FX.skyRay(h.x, h.y, '#ffe066', rand(0, 0.15)); } FX.flash('#fff3b0', 0.12); FX.sound('heal'); },
  cannonball(B, u) { const r = RK(u), rad = 26 * (1 + 0.12 * r); const t = nearest(B.enemies, u, u.st.range * 1.5); if (!t) return false; const pw = sigPower(u), D = AB(u); fireProj(B, u, t, 'orb', 0, { speed: 230, arc: 0.3 * dist(u, t), fixed: true, vfx: { shape: 'cannon', col: '#4a4a5e', col2: '#a8a8c0', pw, size: 1.2 }, onLand: p => { for (const e of inRadius(B.enemies, { x: p.tx, y: p.ty + 8 }, rad)) { dealDamage(B, u, e, D, { sig: true }); if (!e.boss) e.x += 20; } FX.blast(p.tx, p.ty + 6, rad * 1.2, ['#ffffff', '#ffde3a', '#ff8a2a', '#3a3a4e'], pw, { shards: 12 }); FX.sound('boom'); } }); FX.particles(u.x + 10, u.y - 12, 14, ['#ffffff', '#c8c8d8'], { spread: 8, up: true, grav: -20 }); FX.sound('cannon'); },
  raiseDead(B, u) { const r = RK(u); const n = B.heroes.filter(h => h.alive && h.temp && h.owner === u).length; const k = Math.min(2 + Math.floor(r / 2), 4 + r - n); if (k <= 0) return false;
    for (let i = 0; i < k; i++) { summonThrall(B, u, 1 + 0.1 * r, 'thrall'); const th = B.heroes[B.heroes.length - 1]; FX.fly(u.x, u.y - 14, th.x, th.y - 6, 'skull', '#9dff6a', '#e8ffd0', sigPower(u), 0.35, i * 0.08); FX.spikes(th.x - 4, th.y, '#f1ecdc', 0.3); FX.spikes(th.x + 4, th.y, '#f1ecdc', 0.33); } FX.sound('summon'); },
  tongueLash(B, u) { const t = B.enemies.filter(e => e.alive && dist(e, u) < u.st.range * 1.3).sort((a, b) => b.hp - a.hp)[0]; if (!t) return false;
    FX.beam(u.x + 6, u.y - 10, t.x, t.y - 8 - t.z, '#ff7aa8', 3, 0.3); if (!t.boss) { t.x = u.x + 22; t.y = u.y; t.z = 0; } t.stun = 2 + 0.3 * RK(u); dealDamage(B, u, t, AB(u), { sig: true }); FX.blast(t.x, t.y - 2, 12, ['#ffffff', '#ffb0cc', '#ff7aa8', '#8a2a4a'], sigPower(u), { shards: 4 }); FX.sound('slurp'); },
  thunderRoar(B, u) { const r = RK(u); guardTaunt(B, u, 2.5); for (const h of B.heroes) if (h.alive) { h.buffAtk = AB(u) / 100 + 0.05 * r; h.buffAtkT = 4; } FX.roar(u.x + 8, u.y - 10, '#ffd84a', sigPower(u)); FX.shake(5); FX.text(u.x, u.y - 26, 'ROAR!', '#ffd84a', true); FX.sound('roar'); },
  warDrums(B, u) { const r = RK(u); for (const h of B.heroes) if (h.alive) { h.buffAs = 0.45 + 0.05 * r; h.buffAsT = 4; healUnit(B, u, h, ABH(u, 0, h), true); if (h !== u) FX.fly(u.x, u.y - 14, h.x, h.y - 14, 'note', '#ff5d8f', '#ffffff', sigPower(u), 0.4, rand(0, 0.2)); } FX.text(u.x, u.y - 26, 'BOOM BOOM', '#ff5d8f', true); FX.sound('drums'); },
  sunlance(B, u) { const t = nearest(B.enemies, u, 999); if (!t) return false; const D = AB(u); const y = t.y - 8 - t.z, sy = u.y - 12 - (u.z || 0), w = 13 + 2 * RK(u);
    for (const e of B.enemies) if (e.alive && e.x > u.x && Math.abs((e.y - 8 - e.z) - lerpY(u.x, sy, t.x, y, e.x)) < w) dealDamage(B, u, e, D, { sig: true });
    const ex = W + 20, ey = lerpY(u.x, sy, t.x, y, ex); FX.beam(u.x + 6, sy, ex, ey, '#fff3b0', 9, 0.6); FX.blast(t.x, t.y - 4, 16, ['#ffffff', '#fff3b0', '#ffd84a', '#c99a2a'], sigPower(u), { shards: 5 }); FX.flash('#fff3b0', 0.3); FX.shake(5); FX.sound('beam'); },
  earthsplitter(B, u) { const r = RK(u), rad = 40 * (1 + 0.12 * r); const c = densest(B.enemies, 38, u, 200) || nearest(B.enemies, u); if (!c) return false; const D = AB(u);
    u.leap = { sx: u.x, sy: u.y, tx: c.x - 6, ty: c.y, t: 0, dur: 0.45, h: 50, onLand: () => { for (const e of inRadius(B.enemies, u, rad)) { dealDamage(B, u, e, D, { sig: true }); e.stun = Math.max(e.stun, 1); } FX.blast(u.x, u.y, rad, ['#ffffff', '#ffcf3a', '#c9a35a', '#5a4a2a'], sigPower(u), { shards: 16 }); FX.shake(6); FX.sound('quake'); } }; },
  deathMark(B, u) { const ts = B.enemies.filter(e => e.alive).sort((a, b) => b.hp - a.hp).slice(0, 4 + RK(u)); if (!ts.length) return false; const pw = sigPower(u), D = AB(u); for (const e of ts) fireProj(B, u, e, 'orb', 0, { speed: 340, vfx: { shape: 'dagger', col: '#8a5aff', col2: '#ff3d6e', pw, size: 0.9 }, onLand: p => { if (e.alive) { B.marks.push({ e, t: 1.5, src: u, dmg: D }); FX.claws(e.x, e.y - 10, '#8a5aff'); } } }); FX.sound('mark'); },
  greatFlood(B, u) { B.waves.push({ type: 'flood', x: CASTLE_X, vx: 240, life: 1.7, t: 0, src: u, dmg: AB(u) * (1 + 0.115 * RK(u)), hit: new Set(), kb: 40 }); FX.sound('flood'); },
  runicAegis(B, u) { const pw = sigPower(u); guardTaunt(B, u, 2.5); for (const h of B.heroes) if (h.alive) { h.shield += AB(u) * (1 + 0.12 * RK(u)); if (h !== u) FX.fly(u.x, u.y - 14, h.x, h.y - 10, 'rune', '#5fd3ff', '#bff4ff', pw, 0.4, rand(0, 0.12)); } FX.particles(u.x, u.y - 14, 12, ['#5fd3ff', '#ffffff'], { spread: 8, up: true }); FX.sound('shield'); },
  bloom(B, u) { const dead = B.heroes.filter(h => !h.alive && !h.temp).sort((a, b) => (b.inst ? heroRarity(b.inst) : 0) - (a.inst ? heroRarity(a.inst) : 0))[0];
    if (dead) { dead.alive = true; dead.hp = dead.maxHp * 0.6; dead.stun = 0; dead.poison = []; FX.text(dead.x, dead.y - 24, 'BLOOM', '#ff9fd0', true); FX.particles(dead.x, dead.y - 8, 24, '#ff9fd0', { spread: 30, up: true }); }
    for (const h of B.heroes) if (h.alive) { healUnit(B, u, h, ABH(u, 0, h) * (1 + 0.16 * RK(u))); if (h !== u) FX.fly(u.x, u.y - 14, h.x, h.y - 10, 'seed', '#ff9fd0', '#ffffff', sigPower(u), 0.5, rand(0, 0.15)); } FX.petals(); FX.sound('heal'); },
  stampede(B, u) { const n = 4 + RK(u), D = AB(u); for (let i = 0; i < n; i++) B.waves.push({ type: 'spirit', x: CASTLE_X - i * 18, y: GRID.y + 12 + i * (GRID.rows * GRID.cell - 20) / (n - 1), vx: 180, life: 2.6, t: 0, src: u, dmg: D, hit: new Set(), h: 14 }); FX.shake(5); FX.sound('stampede'); },
  // ----- ultimates (Cam 2026-10-15): big, animated, and grander with every rarity step -----
  cinderColossus(B, u) { const c = densest(B.enemies, 34, u, 999) || nearest(B.enemies, u, 999); if (!c) return false;
    const rar = u.st.rarity || 0, rk = RK(u), size = 1 + 0.08 * rar + 0.03 * rk, D0 = AB(u, 0), D1 = AB(u, 1);
    B.zones.push({ type: 'ult', vis: 'colossus', x: clamp(c.x, CASTLE_X + 30, W - 70), y: c.y, r: 26 * size, size, rar, pw: sigPower(u), t: 0, dur: 5 + rar, src: u, landed: false, tick: 0.9, stompT: -1, face: 1,
      step(B, z, dt) {
        if (!z.landed) { if (z.t >= 0.45) { z.landed = true; for (const e of inRadius(B.enemies, z, z.r * 1.4)) { dealDamage(B, u, e, D0, { sig: true }); e.stun = Math.max(e.stun, e.boss ? 0.4 : 0.9); }
          FX.ultImpact(z.x, z.y, z.r * 1.4, 'colossus', z.rar); FX.sound('quake'); } return; }
        const t = densest(B.enemies, 26, z, 160) || nearest(B.enemies, z, 200);
        if (t && dist(t, z) > z.r * 0.6) { const d = dist(t, z) || 1, sp = 16 + 3 * z.rar; z.x = clamp(z.x + (t.x - z.x) / d * sp * dt, CASTLE_X + 30, W - 70); z.y = clamp(z.y + (t.y - z.y) / d * sp * dt, GRID.y + 10, GRID.y + GRID.rows * GRID.cell); z.face = t.x >= z.x ? 1 : -1; }
        z.tick -= dt; if (z.tick <= 0) { z.tick = z.rar >= 5 ? 0.65 : 0.9; z.stompT = z.t;
          for (const e of inRadius(B.enemies, z, z.r)) { dealDamage(B, u, e, D1, { sig: true }); if (!e.boss) e.x += 6 * Math.sign(e.x - z.x || 1); }
          if (z.rar >= 5 && t) { for (const e of B.enemies) if (e.alive && Math.abs(e.y - z.y) < 22 && (e.x - z.x) * z.face > 0 && Math.abs(e.x - z.x) < 90) dealDamage(B, u, e, D1 * 0.6, { sig: true }); FX.ultBreath(z.x + 10 * z.face * z.size, z.y - 26 * z.size, z.face); }
          FX.ultStomp(z.x, z.y, z.r, z.rar); FX.sound('thud'); } },
      end(B, z) { FX.ultImpact(z.x, z.y, z.r, 'colossusGone', z.rar); } });
    FX.sound('cast'); },
  glacierLance(B, u) { const c = densest(B.enemies, 30, u, 999) || nearest(B.enemies, u, 999); if (!c) return false;
    const rar = u.st.rarity || 0, D0 = AB(u), sx = u.x + 6, sy = u.y - 8, base = Math.atan2(c.y - u.y, c.x - u.x), angs = rar >= 5 ? [base - 0.16, base, base + 0.16] : [base];
    for (const a of angs) { const hit = new Set();
      B.zones.push({ type: 'ult', vis: 'lance', sx, sy, x: sx, y: sy, a, w: 10 + 3 * rar, rar, pw: sigPower(u), t: 0, dur: 1.6, src: u, first: false, trail: [],
        step(B, z, dt) { const v = 430, px = z.x, py = z.y; z.x += Math.cos(z.a) * v * dt; z.y += Math.sin(z.a) * v * dt; z.trail.push([z.x, z.y]);
          for (const e of B.enemies) { if (!e.alive || hit.has(e)) continue;
            const L = Math.hypot(z.x - px, z.y - py) || 1, f = clamp(((e.x - px) * (z.x - px) + (e.y - py) * (z.y - py)) / (L * L), 0, 1);
            if (Math.hypot(e.x - (px + f * (z.x - px)), e.y - (py + f * (z.y - py))) > z.w) continue; hit.add(e);
            if (!z.first) { z.first = true; const fl = Math.min(1, Math.hypot(e.x - z.sx, e.y - z.sy) / 300); dealDamage(B, u, e, D0, { sig: true }); e.stun = Math.max(e.stun, (1 + 2.5 * fl) * (e.boss ? 0.4 : 1)); e.frozen = Math.max(e.frozen || 0, 1 + 2.5 * fl); FX.ultImpact(e.x, e.y, 24 + 4 * z.rar, 'ice', z.rar); FX.sound('freeze'); }
            else { dealDamage(B, u, e, D0 * 0.6, { sig: true }); e.slowT = Math.max(e.slowT || 0, 2); e.slowAmt = Math.max(e.slowAmt || 0, 0.35); FX.particles(e.x, e.y - 8, 6, ['#ffffff', '#bff4ff', '#5fd3ff'], { spread: 8 }); } }
          if (z.rar >= 3 && Math.random() < 0.5) FX.particles(z.x, z.y, 2, ['#ffffff', '#bff4ff'], { spread: 4 });
          if (z.x > W + 30 || z.y < 0 || z.y > H) z.t = z.dur; },
        end(B, z) { if (z.rar >= 3) B.zones.push({ type: 'ult', vis: 'frostTrail', pts: z.trail.filter((p, i) => i % 3 === 0), w: z.w, rar: z.rar, t: 0, dur: 3, tick: 0,
          step(B, y, dt) { y.tick -= dt; if (y.tick > 0) return; y.tick = 0.3; for (const e of B.enemies) if (e.alive && y.pts.some(p => Math.abs(p[0] - e.x) < 8 && Math.abs(p[1] - e.y) < y.w)) { e.slowT = Math.max(e.slowT || 0, 0.6); e.slowAmt = Math.max(e.slowAmt || 0, 0.45); } } }); } }); }
    FX.ultMuzzle(sx, sy, base, 'ice', rar); FX.sound('beam'); },
  cryptGrasp(B, u) { const c = densest(B.enemies, 34, u, 170) || nearest(B.enemies, u, 200); if (!c) return false;
    const rar = u.st.rarity || 0, rk = RK(u), rad = 40 * (1 + 0.1 * rar) + 5 * rk, D0 = AB(u), bind = 1.5 + 0.25 * rar;
    guardTaunt(B, u, 3);
    B.zones.push({ type: 'ult', vis: 'grasp', x: c.x, y: c.y, r: rad, rar, pw: sigPower(u), t: 0, dur: 0.35 + bind, src: u, done: false,
      step(B, z, dt) { if (z.done || z.t < 0.35) return; z.done = true;
        for (const e of inRadius(B.enemies, z, z.r)) { dealDamage(B, u, e, D0, { sig: true }); e.stun = Math.max(e.stun, bind * (e.boss ? 0.4 : 1)); e.bound = z.t + bind;
          if (z.rar >= 4 && !e.boss) { e.x += (z.x - e.x) * 0.45; e.y += (z.y - e.y) * 0.45; } }
        FX.ultImpact(z.x, z.y, z.r, 'grasp', z.rar); FX.shake(5 + z.rar); FX.sound('bash'); } });
    FX.text(u.x, u.y - 24, 'TAUNT', '#e9e4ff', true); FX.sound('summon'); },
  tempestCage(B, u) { const c = densest(B.enemies, 34, u, u.st.range * 1.8) || nearest(B.enemies, u, 999); if (!c) return false;
    const rar = u.st.rarity || 0, rk = RK(u), rad = 44 * (1 + 0.1 * rar) + 4 * rk, D0 = AB(u, 0), D1 = AB(u, 1), inside = new Set(inRadius(B.enemies, c, rad));
    B.zones.push({ type: 'ult', vis: 'cage', x: c.x, y: c.y, r: rad, rar, pw: sigPower(u), t: 0, dur: 3 + 0.5 * rar, src: u, tick: 0, bolts: [],
      step(B, z, dt) {
        for (const e of B.enemies) { if (!e.alive) continue; const d = dist(e, z);
          if (d < z.r * 0.9) inside.add(e);
          else if (inside.has(e) && d > z.r * 0.92) { const k = z.r * 0.85 / (d || 1); if (!e.boss) { e.x = z.x + (e.x - z.x) * k; e.y = z.y + (e.y - z.y) * k; }
            if (!(e.cageT > B.t)) { e.cageT = B.t + 1; e.stun = Math.max(e.stun, e.boss ? 0.3 : 0.8); dealDamage(B, u, e, D1, { sig: true }); FX.ultBolt(e.x, e.y - 10, z.rar, true); } } }
        z.tick -= dt; if (z.tick <= 0) { z.tick = 0.4 - 0.04 * z.rar; const live = [...inside].filter(e => e.alive && dist(e, z) <= z.r * 1.05);
          for (let i = 0; i < 1 + (z.rar >= 4 ? 1 : 0) && live.length; i++) { const e = pick(live); dealDamage(B, u, e, D1, { sig: true }); FX.ultBolt(e.x, e.y - 8, z.rar, false); } FX.sound('zap'); } },
      end(B, z) { for (const e of B.enemies) if (e.alive && dist(e, z) <= z.r * 1.05) { dealDamage(B, u, e, D0, { sig: true }); e.stun = Math.max(e.stun, 0.5); }
        FX.ultImpact(z.x, z.y, z.r, 'thunder', z.rar); FX.flash(z.rar >= 5 ? '#fff3a0' : '#bff4ff', 0.25); FX.shake(6 + z.rar); FX.sound('boom'); } });
    FX.sound('zap'); },
  rocketBarrage(B, u) { const live = B.enemies.filter(e => e.alive && !e.onRafter); if (!live.length) return false;
    const rar = u.st.rarity || 0, rk = RK(u), n = 6 + 2 * rar + rk, D0 = AB(u), rad = 16 + 2 * rar, pw = sigPower(u), gold = rar >= 5;
    const front = live.slice().sort((a, b) => a.x - b.x).slice(0, Math.max(4, Math.ceil(live.length * 0.7)));
    B.zones.push({ type: 'ult', vis: null, t: 0, dur: 0.12 * n + 0.1, left: n, tick: 0, src: u,
      step(B, z, dt) { z.tick -= dt; if (z.tick > 0 || z.left <= 0 || !u.alive) return; z.tick = 0.12; z.left--;
        const e = pick(front.filter(x => x.alive)) || nearest(B.enemies, u, 999); if (!e) return; const tx = e.x + rand(-12, 12), ty = e.y + rand(-8, 8);
        fireProj(B, u, null, 'orb', 0, { tx, ty: ty - 6, fixed: true, speed: 240, arc: 0.45 * Math.abs(tx - u.x), vfx: { shape: 'rocket', col: gold ? '#ffd84a' : '#ff6a3a', col2: gold ? '#ffffff' : '#ffe08a', pw, size: 1 + 0.08 * rar },
          onLand: p => { for (const x of inRadius(B.enemies, { x: p.tx, y: p.ty + 6 }, rad)) { dealDamage(B, u, x, D0, { sig: true }); if (!x.boss) x.x += 8; }
            FX.blast(p.tx, p.ty + 6, rad, gold ? ['#ffffff', '#fff3a0', '#ffd84a', '#a8601a'] : ['#ffffff', '#ffe08a', '#ff6a3a', '#5a2a2a'], pw, { shards: 6 }); FX.sound('boom'); } });
        FX.particles(u.x + 6, u.y - 14, 6, ['#ffffff', '#c8c8d8'], { spread: 6, up: true, grav: -30 }); FX.sound('cannon'); } });
    return true; },
  lotusSanctuary(B, u) { const allies = B.heroes.filter(h => h.alive && !h.rafter); if (!allies.length) return false;
    const rar = u.st.rarity || 0, rk = RK(u), cx = allies.reduce((a, h) => a + h.x, 0) / allies.length, cy = allies.reduce((a, h) => a + h.y, 0) / allies.length, rad = 52 * (1 + 0.1 * rar) + 4 * rk;
    B.zones.push({ type: 'ult', vis: 'lotus', x: cx, y: cy, r: rad, rar, pw: sigPower(u), t: 0, dur: 4 + 0.5 * rar, src: u, tick: 0,
      step(B, z, dt) { z.tick -= dt; for (const h of B.heroes) if (h.alive && dist(h, z) <= z.r) h.lotusT = B.t + 0.3;
        if (z.tick <= 0) { z.tick = 0.5; for (const h of B.heroes) if (h.alive && dist(h, z) <= z.r) { healUnit(B, u, h, ABH(u, 0, h), true); if (Math.random() < 0.5) FX.particles(h.x, h.y - 6, 3, ['#ffb0d8', '#ffffff'], { spread: 6, up: true }); } } },
      end(B, z) { for (const h of B.heroes) if (h.alive && dist(h, z) <= z.r * 1.1) healUnit(B, u, h, ABH(u, 1, h));
        if (z.rar >= 5) { const dead = B.heroes.find(h => !h.alive && !h.temp && dist(h, z) <= z.r * 1.5); if (dead) { dead.alive = true; dead.hp = dead.maxHp * 0.5; dead.stun = 0; dead.poison = []; FX.text(dead.x, dead.y - 24, 'BLOOM', '#ffd84a', true); } }
        FX.ultImpact(z.x, z.y, z.r, 'lotus', z.rar); FX.sound('heal'); } });
    FX.sound('heal'); },
  // ----- class spec signatures (meta) -----
  aegisDome(B, u) { const r = RK(u); guardTaunt(B, u, 2.5); for (const h of B.heroes) if (h.alive) { h.shield += AB(u) * (1 + 0.11 * r); }
    for (const e of inRadius(B.enemies, u, 60 + 6 * r)) { if (!e.boss) e.x += 30; e.stun = Math.max(e.stun, 1.2); dealDamage(B, u, e, AB(u, 1), { sig: true }); } FX.blast(u.x + 10, u.y, 40, ['#ffffff', '#dffcff', '#9ff6ff', '#3a8aa8'], sigPower(u)); FX.sound('shield'); },
  bloodFrenzy(B, u) { const r = RK(u); healUnit(B, u, u, AB(u), true); u.buffAs = Math.max(u.buffAs, 1 + 0.1 * r); u.buffAsT = 5; u.buffAtk = Math.max(u.buffAtk, 0.5 + 0.05 * r); u.buffAtkT = 5; FX.particles(u.x, u.y - 8, 24, ['#ff3d3d', '#ffffff'], { spread: 16, up: true }); FX.sound('roar'); },
  hawkStrike(B, u) { const t = densest(B.enemies, 30, u, 999) || nearest(B.enemies, u, 999); if (!t) return false; const y = t.y, D = AB(u);
    for (const e of B.enemies) if (e.alive && Math.abs(e.y - y) < 16 + 2 * RK(u)) { dealDamage(B, u, e, D, { sig: true }); e.curseT = Math.max(e.curseT, 5); }
    FX.fly(CASTLE_X, y - 14, W + 20, y - 10, 'hawk', '#c99a5a', '#ffe7a0', sigPower(u), 0.45); FX.beam(CASTLE_X, y - 12, W + 10, y - 8, '#ffe7a0', 3, 0.45); FX.sound('beam'); },
  meteor(B, u) { const c = densest(B.enemies, 40, u, 999) || nearest(B.enemies, u, 999); if (!c) return false; const rad = 46 + 5 * RK(u), dmg = AB(u);
    B.zones.push({ type: 'telegraph', x: c.x, y: c.y, r: rad, t: 0, dur: 0.9, meteor: true, friendly: true, onEnd: z => { for (const e of inRadius(B.enemies, z, z.r)) { dealDamage(B, u, e, dmg, { sig: true }); e.stun = Math.max(e.stun, 0.8); } FX.fireburst(z.x, z.y, z.r * 0.8, sigPower(u) + 0.6); FX.sound('boom'); } }); },
  massRez(B, u) { let n = 0; for (const h of B.heroes) { if (!h.alive && !h.temp) { h.alive = true; h.hp = h.maxHp * (0.4 + 0.05 * RK(u)); h.stun = 0; h.poison = []; n++; FX.text(h.x, h.y - 24, 'RISE', '#fff3b0', true); FX.skyRay(h.x, h.y, '#fff3b0'); } }
    for (const h of B.heroes) if (h.alive) healUnit(B, u, h, ABH(u, 0, h)); FX.flash('#fff3b0', 0.25); FX.sound('heal'); },
  shadowClones(B, u) { const mine = B.heroes.filter(h => h.alive && h.temp && h.owner === u).length; if (mine >= 2) { u.buffAtk = Math.max(u.buffAtk, 0.4); u.buffAtkT = 4; return; }
    for (let i = mine; i < 2; i++) summonThrall(B, u, 0.6 + 0.08 * RK(u), u.key, { name: 'Shadow', col: '#8a5aff' }); FX.sound('summon'); },
};
function lerpY(x0, y0, x1, y1, x) { return x1 === x0 ? y0 : y0 + (y1 - y0) * (x - x0) / (x1 - x0); }

function summonThrall(B, u, mul, key, opts = {}) {
  const lv = u.inst ? u.inst.level : 1, ap = u.st ? Math.max(0.5, u.st.ap) : 1, dead = u.st && (u.st.ability || u.def.ability) === 'raiseDead';
  const st = { hp: (dead ? AB(u, 0) : 200 * heroLevelMul(lv) * ap) * mul, atk: (dead ? AB(u, 1) : 18 * heroLevelMul(lv) * ap) * mul, as: 1, range: 14, spd: 30, armor: 15, mana: 999, crit: 0.05, critMul: BAL.critMul, dodge: 0, lifesteal: 0, reflect: 0, manaGain: 0, ap: 1, sp: {}, el: {}, sigOn: false, regen: 0 };
  const p = { x: (u.x || GRID.x) + 14 + rand(0, 10), y: clamp((u.y || GRID.y + 60) + rand(-16, 16), GRID.y, GRID.y + GRID.rows * GRID.cell) };
  B.heroes.push(makeUnit('hero', { def: { cls: 'berserker', race: 'skeleton', name: opts.name || 'Thrall' }, key, temp: true, owner: u.inst ? u : null, x: p.x, y: p.y, hx: p.x, hy: p.y, maxHp: st.hp, hp: st.hp, st, maxMana: 999, name: opts.name || 'Thrall' }));
  FX.particles(p.x, p.y - 4, 14, opts.col || '#9dff6a', { spread: 16, up: true });
}

// ----- element combos (team synergies) -----
function comboPulse(B, c) {
  if (B.ach) B.ach.combos++;
  const A = ELEMENTS[c.a], Bc = ELEMENTS[c.b], cols = [A.col, Bc.col, A.col2, Bc.col2], P = c.power, base = teamAtk(B) * P;
  const live = B.enemies.filter(e => e.alive); const heroes = B.heroes.filter(h => h.alive);
  let x = W / 2, y = GRID.y + 70;
  switch (c.kind) {
    case 'nova': { const t = densest(B.enemies, 30) || live[0]; if (!t) return; x = t.x; y = t.y; for (const e of inRadius(B.enemies, t, 40)) dealDamage(B, null, e, base * 2.4, { kind: 'combo' }); FX.explode(x, y - 6, 44, cols); FX.shockwave(x, y, 80, cols[0]); FX.shake(5); FX.sound('boom'); break; }
    case 'rain': { if (!live.length) return; for (let i = 0; i < 7; i++) { const e = pick(live); B.zones.push({ type: 'telegraph', x: e.x, y: e.y, r: 12, t: 0, dur: 0.35 + i * 0.08, meteor: true, cols, friendly: true, onEnd: z => { for (const ee of inRadius(B.enemies, z, 14)) dealDamage(B, null, ee, base * 1.1, { kind: 'combo' }); FX.explode(z.x, z.y - 4, 14, cols); FX.sound('zap'); } }); } x = live[0].x; y = live[0].y; break; }
    case 'wave': B.waves.push({ type: 'flood', x: CASTLE_X, vx: 260, life: 1.6, t: 0, src: null, dmg: base * 1.6, hit: new Set(), kb: 20, cols }); FX.sound('flood'); break;
    case 'heal': for (const h of heroes) { healUnit(B, null, h, h.maxHp * 0.15 * P); FX.ring(h.x, h.y - 4, 14, cols[0]); } x = heroes[0] ? heroes[0].x : x; FX.sound('heal'); break;
    case 'shield': for (const h of heroes) { h.shield += h.maxHp * 0.18 * P; FX.ring(h.x, h.y - 6, 16, cols[0]); } FX.sound('shield'); break;
    case 'haste': { const big = c.key === 'sweet+treat' ? 1.6 : 1; for (const h of heroes) { h.buffAs = Math.max(h.buffAs, 0.35 * P * big); h.buffAsT = 4; FX.particles(h.x, h.y - 10, 6, cols, { spread: 10, up: true }); } FX.sound(c.key === 'ice+treat' ? 'jingle' : 'drums'); break; }
    case 'rage': for (const h of heroes) { h.buffAtk = Math.max(h.buffAtk, 0.35 * P); h.buffAtkT = 4; FX.particles(h.x, h.y - 10, 6, cols, { spread: 10, up: true }); } FX.sound('roar'); break;
    case 'freeze': for (const e of live) if (e.x < CASTLE_X + 220) { e.stun = Math.max(e.stun, e.boss ? 0.4 : 1.5); e.frozen = 1.5; } FX.flash(cols[0], 0.2); FX.sound('freeze'); break;
    case 'gold': for (let i = 0; i < 4; i++) FX.particles(rand(120, 400), rand(110, 240), 5, ['#ffcf3a', cols[0]], { spread: 10, up: true }); FX.sound('coin'); break;
    case 'shred': for (const e of live) { e.shred = Math.min(60, e.shred + 20 * P); FX.particles(e.x, e.y - 8, 3, cols, { spread: 8 }); dealDamage(B, null, e, base * 0.4, { kind: 'combo', quiet: true }); } FX.sound('zap'); break;
    case 'vortex': { const t = densest(B.enemies, 40) || live[0]; if (!t) return; x = t.x; y = t.y; for (const e of inRadius(B.enemies, t, 70)) { if (!e.boss) { e.x += (t.x - e.x) * 0.7; e.y += (t.y - e.y) * 0.7; } dealDamage(B, null, e, base * 1.5, { kind: 'combo' }); } FX.vortex(x, y, cols); FX.sound('mark'); break; }
    case 'critter': { const n = B.heroes.filter(h => h.alive && h.temp && h.critter).length; if (n >= 4) return; const ck = CRITTERS[c.key]; const anchor = heroes[0] || { x: GRID.x + 40, y: GRID.y + 60 };
      for (let i = 0; i < 2; i++) { summonThrall(B, anchor, 0.7 * P, 'crit:' + ck, { name: c.name, col: cols[0] }); B.heroes[B.heroes.length - 1].critter = true; } FX.sound('summon'); break; }
  }
  FX.combo(x, Math.max(70, y - 30), c.name, cols);
}

// ----- castle power (elemental castle, manual) -----
function castlePowerCooldown(run) { return 22 * (run.tech.kiln ? 0.65 : 1); }
function castCastlePower(B, x, y) {
  const el = B.run.castleEl; if (!el || B.cpow.cd > 0) return false;
  B.cpow.cd = castlePowerCooldown(B.run);
  const P = CASTLE_POWERS[el], E = ELEMENTS[el], cols = [E.col, E.col2, '#ffffff'], s = B.siege;
  const dmg = 85 * hpMul(s) * (1 + 0.15 * (B.meta.ranks.banners || 0));
  const live = B.enemies.filter(e => e.alive);
  switch (P.kind) {
    case 'execute': for (const e of live) { if (!e.boss && e.hp < e.maxHp * 0.3) { FX.text(e.x, e.y - 20, 'GONE', E.col, true); e.hp = 0; killUnit(B, e, null); } else dealDamage(B, null, e, dmg * 0.6, { kind: 'combo' }); } FX.flash('#2a1a4a', 0.35); break;
    case 'beam': for (let i = 0; i < 5; i++) { const yy = GRID.y + 10 + i * 30; FX.beam(CASTLE_X, yy - 8, W + 20, yy - 8, E.col, 8, 0.6); for (const e of live) if (Math.abs(e.y - yy) < 16) dealDamage(B, null, e, dmg, { kind: 'combo' }); } FX.flash('#fff3b0', 0.3); break;
    case 'bolts': for (let i = 0; i < 14 && live.length; i++) { const e = pick(live); FX.bolt([{ x: 30 + rand(0, 60), y: 20 }, { x: e.x, y: e.y - 8 }], E.col); dealDamage(B, null, e, dmg * 0.7, { kind: 'combo' }); } FX.sound('zap'); break;
    case 'firewave': B.waves.push({ type: 'flood', x: CASTLE_X, vx: 230, life: 1.8, t: 0, src: null, dmg: dmg * 1.4, hit: new Set(), kb: 10, cols: ['#ff3d3d', '#ff8a3a', '#ffde3a'], burn: dmg * 0.15 }); break;
    case 'flood': B.waves.push({ type: 'flood', x: CASTLE_X, vx: 240, life: 1.8, t: 0, src: null, dmg: dmg * 1.1, hit: new Set(), kb: 50, cols }); break;
    case 'freeze': for (const e of live) { e.stun = Math.max(e.stun, e.boss ? 0.8 : 2.5); e.frozen = 2.5; } FX.flash('#bfeeff', 0.35); break;
    case 'roots': for (const e of live) if (e.x < CASTLE_X + 200) { e.stun = Math.max(e.stun, e.boss ? 0.6 : 2); dealDamage(B, null, e, dmg * 0.5, { kind: 'combo' }); } for (const h of B.heroes) if (h.alive) healUnit(B, null, h, h.maxHp * 0.35); break;
    case 'vortex': for (const e of inRadius(B.enemies, { x, y }, 90)) { if (!e.boss) { e.x += (x - e.x) * 0.8; e.y += (y - e.y) * 0.8; } dealDamage(B, null, e, dmg * 1.3, { kind: 'combo' }); } FX.vortex(x, y, cols); break;
    case 'salt': for (const e of live) { e.shred = Math.min(80, e.shred + 40); dealDamage(B, null, e, dmg * 0.5, { kind: 'combo' }); FX.particles(e.x, e.y - 8, 5, ['#ffffff', '#e8eef8'], { spread: 10 }); } break;
    case 'candy': for (const e of live) { e.slowT = 4; e.slowAmt = 0.6; dealDamage(B, null, e, dmg * 0.6, { kind: 'combo' }); FX.particles(e.x, e.y - 12, 4, ['#ff8ad8', '#5fd3ff', '#ffd84a', '#7cf09a'], { spread: 10 }); } break;
    case 'ham': fireProj(B, { x: 40, y: 50, side: 'castle', facing: 1, z: 0 }, null, 'ham', 0, { tx: x, ty: y, fixed: true, speed: 160, onLand: p => { for (const e of inRadius(B.enemies, { x: p.tx, y: p.ty }, 50)) { dealDamage(B, null, e, dmg * 2, { kind: 'combo' }); if (!e.boss) e.stun = Math.max(e.stun, 1.5); } for (const h of inRadius(B.heroes, { x: p.tx, y: p.ty }, 80)) healUnit(B, null, h, h.maxHp * 0.3); FX.explode(p.tx, p.ty, 50, ['#ff6a6a', '#ffd0b0', '#ffffff']); FX.shockwave(p.tx, p.ty, 90, '#ffd0b0'); FX.shake(8); FX.text(p.tx, p.ty - 30, 'HAM', '#ffd0b0', true, true); FX.sound('boom'); } }); break;
    case 'pinata': B.pinataT = 6; for (const e of live) dealDamage(B, null, e, dmg * 0.4, { kind: 'combo' }); for (let i = 0; i < 6; i++) FX.particles(rand(110, 460), rand(100, 240), 8, ['#ff8ad8', '#5fd3ff', '#ffd84a', '#7cf09a', '#ff6a3d'], { spread: 20, up: true }); FX.text(W / 2, 90, 'PIÑATA!', '#ffb02e', true, true); break;
  }
  FX.castlePower(P.kind, x, y, cols, B);
  FX.combo(W / 2, 80, P.name, cols); FX.shake(6); FX.sound('hammer');
  return true;
}


// ----- boss signature moves: one funny or epic move per boss, announced across the screen -----
function bossCall(B, u, title, quip, cols, shake) { FX.combo(W / 2, 64, title, cols); FX.text(u.x, u.y - 30 * (u.scale || 1) - 12, quip, '#ffffff', true, true); FX.shake(shake || 8); FX.flash(cols[0], 0.18); }
const BOSS_MOVES = {
  grubnose(B, u, hs) { const t = hs.slice().sort((a, b) => b.maxHp - a.maxHp)[0]; if (!t) return 4; bossCall(B, u, 'BUCKET THROW', 'MY THRONE. CATCH.', ['#c9a35a', '#8a6a2a']);
    const fl = 1.1; FX.boss('bucket', { sx: u.x - 10, sy: u.y - 30, tx: t.x, ty: t.y - 6, life: fl });
    B.zones.push({ type: 'telegraph', x: t.x, y: t.y, r: 26, t: 0, dur: fl, onEnd: z => { for (const h of inRadius(B.heroes, z, 26)) { dealDamage(B, u, h, u.atk * 2.2); h.stun = Math.max(h.stun, 2); } FX.text(z.x, z.y - 16, 'CLANG', '#ffde3a', true); FX.explode(z.x, z.y - 4, 20, ['#c9a35a', '#8a6a2a', '#e0e0f0']); FX.shake(10); FX.sound('hammer'); } }); return 11; },
  gloop(B, u, hs) { bossCall(B, u, 'MOM HUG', 'come here, sweetie', ['#7fe05a', '#ff8fb0']); for (const h of hs) { if (h.rafter) continue; if (dist(h, u) < 140) { FX.boss('tendril', { sx: u.x - 8, sy: u.y - 14, tx: h.x, ty: h.y - 8, life: 0.8 }); h.x += (u.x - 20 - h.x) * 0.6; h.y += (u.y - h.y) * 0.4; h.slowT = 3; h.slowAmt = 0.5; dealDamage(B, u, h, u.atk * 0.8); } } FX.sound('summon'); return 12; },
  wyrm(B, u, hs) { bossCall(B, u, 'DRAMATIC READING', '"Chapter Three: My Feelings"', ['#a89ae8', '#ff9a4a'], 6);
    FX.boss('pages', { sx: u.x - 10, sy: u.y - 40, life: 1.6, pts: hs.filter(h => dist(h, u) < 220).flatMap(h => [0, 1, 2].map(i => ({ x: h.x + rand(-8, 8), y: h.y - 10 + rand(-6, 6), d: rand(0, 0.35) }))) }); for (const h of hs) if (dist(h, u) < 220) { h.stun = Math.max(h.stun, 1.6); FX.text(h.x, h.y - 22, 'zzz', '#c8c8ff', false); } return 13; },
  ringmaster(B, u, hs) { const t = hs.slice().sort((a, b) => a.x - b.x)[0]; if (!t) return 4; bossCall(B, u, 'HUMAN CANNONBALL', 'LADIES AND GOBLINS!', ['#ff5a5a', '#ffd84a'], 10); FX.boss('spotlight', { sx: u.x, sy: u.y - 20, tx: t.x, ty: t.y, life: 1 });
    B.zones.push({ type: 'telegraph', x: t.x, y: t.y, r: 40, t: 0, dur: 1, meteor: true, onEnd: z => { u.x = Math.max(u.x - 60, z.x + 30); for (const h of inRadius(B.heroes, z, z.r)) dealDamage(B, u, h, u.atk * 2.4); FX.explode(z.x, z.y - 4, 36, ['#ff5a5a', '#ffd84a', '#ffffff']); FX.shake(12); FX.sound('boom'); } }); return 12; },
  sporebaron(B, u, hs) { bossCall(B, u, 'SPORE CLOUD', 'smell that? POTENTIAL.', ['#c8ff6a', '#a86ad8'], 6); FX.boss('spores', { sx: u.x, life: 1.8 }); for (const h of hs) { h.poison.push({ dps: u.atk * 0.25, t: 6, src: u }); FX.particles(h.x, h.y - 10, 8, ['#c8ff6a', '#a86ad8'], { spread: 12, up: true }); } return 12; },
  matriarch(B, u, hs) { bossCall(B, u, 'AVALANCHE', 'THIS IS A BYLAW VIOLATION', ['#e8f0ff', '#9ad8ff'], 12); FX.boss('avalanche', { sx: W + 20, life: 1.2 }); for (const h of hs) { if (!h.rafter) h.x = Math.max(CASTLE_X + 8, h.x - 50); dealDamage(B, u, h, u.atk * 1.2); h.slowT = 3; h.slowAmt = 0.4; } for (let i = 0; i < 10; i++) FX.particles(rand(120, 460), rand(90, 230), 6, ['#ffffff', '#c8e8ff'], { spread: 18 }); FX.sound('gust'); return 13; },
  trashpaw(B, u, hs) { bossCall(B, u, 'DUMPSTER DIVE', 'MAMA NEEDS A SNACK', ['#5a7a5a', '#c84a8a']); FX.boss('dumpster', { sx: u.x, sy: u.y, life: 1.6 }); u.hp = Math.min(u.maxHp, u.hp + u.maxHp * 0.08); for (let i = 0; i < 3; i++) spawnEnemy(B, i ? 'bandit' : 'possum', { x: u.x + rand(-10, 20), y: clamp(u.y + rand(-34, 34), GRID.y, GRID.y + GRID.rows * GRID.cell) }); FX.sound('summon'); return 14; },
  colossus(B, u, hs) { bossCall(B, u, 'FACTORY RESET', 'PLEASE HOLD.', ['#e8b84a', '#5fd3ff'], 9); FX.boss('reset', { sx: u.x, life: 1 }); for (const h of hs) { h.mana = 0; h.buffAs = 0; h.buffAtk = 0; } u.shield = (u.shield || 0) + u.maxHp * 0.06; FX.ring(u.x, u.y - 20, 60, '#5fd3ff'); FX.sound('beam'); return 14; },
  pinchbeard(B, u, hs) { bossCall(B, u, 'BROADSIDE', 'THE TOLL IS DUE', ['#2a2a3a', '#ffd84a'], 10); FX.boss('ship', { life: 2 }); const ys = [0, 1, 2, 3].map(i => GRID.y + 14 + i * (GRID.rows * GRID.cell - 20) / 3);
    for (const y of ys) for (let x = CASTLE_X + 20; x < u.x - 10; x += 46) B.zones.push({ type: 'telegraph', x: x + rand(-8, 8), y, r: 16, t: 0, dur: 0.8 + Math.random() * 0.8, meteor: true, onEnd: z => { for (const h of inRadius(B.heroes, z, z.r)) dealDamage(B, u, h, u.atk * 1.1); FX.explode(z.x, z.y - 4, 14, ['#ffd84a', '#ff8a3a', '#2a2a3a']); } }); FX.sound('boom'); return 13; },
  // the finale: it wears the twelve shards and throws them around; each sixth of its HP knocks two loose
  shardgoose(B, u, hs) { const m = (u.mv = (u.mv || 0) + 1) % 3, left = EL_KEYS.filter((e, i) => i < (u.shards || 0));
    if (m === 1 && left.length) { bossCall(B, u, 'SHARD STORM', 'MY SHARDS. MY CASTLE.', [ELEMENTS[pick(left)].col, '#ffffff'], 10);
      for (let i = 0; i < Math.min(8, 2 + left.length); i++) { const t = pick(hs); if (!t) break; const e = pick(left);
        const zx = t.x + rand(-14, 14), zy = t.y + rand(-8, 8); FX.boss('shardStreak', { sx: u.x, sy: u.y - 60, tx: zx, ty: zy, col: ELEMENTS[e].col, life: 1.2 + i * 0.12 });
        B.zones.push({ type: 'telegraph', x: zx, y: zy, r: 20, t: 0, dur: 0.8 + i * 0.12, meteor: true, col: ELEMENTS[e].col, onEnd: z => { for (const h of inRadius(B.heroes, z, z.r)) dealDamage(B, u, h, u.atk * 1.1); FX.explode(z.x, z.y - 4, 22, [ELEMENTS[e].col, ELEMENTS[e].col2, '#ffffff']); } }); }
      return 10; }
    if (m === 2) { bossCall(B, u, 'THE HONK', 'GIVE. THEM. BACK.', ['#ffffff', '#c98aff'], 16); FX.boss('honk', { sx: u.x - 20, sy: u.y - 40, life: 1.2 }); for (const h of hs) { h.stun = Math.max(h.stun, 1.2); dealDamage(B, u, h, u.atk * 0.8); } return 12; }
    bossCall(B, u, 'GOSLING GUARD', 'protect the crown', ['#f4e48a', '#c98aff'], 8); for (let i = 0; i < 4; i++) spawnEnemy(B, 'gosling', { x: u.x + rand(0, 30), y: GRID.y + 10 + i * (GRID.rows * GRID.cell - 16) / 3 }); return 11; },
  goosegod(B, u, hs) { const m = (u.mv = (u.mv || 0) + 1) % 3;
    if (m === 1) { bossCall(B, u, 'THE HONK', 'HONK', ['#ffffff', '#ff8a1a'], 16); FX.boss('honk', { sx: u.x - 20, sy: u.y - 40, life: 1.2 }); for (const h of hs) { h.stun = Math.max(h.stun, 1.4); dealDamage(B, u, h, u.atk * 0.9); } B.castle.hp = Math.max(1, B.castle.hp - B.castle.max * 0.05); for (let i = 1; i <= 4; i++) FX.ring(u.x, u.y - 20, 50 * i, '#ffffff'); FX.sound('honk'); return 9; }
    if (m === 2) { bossCall(B, u, 'STOLEN HAMMER', 'mine now. honk.', ['#ffd84a', '#ffffff'], 6); FX.boss('hammerSteal', { sx: CASTLE_X - 30, sy: 70, tx: u.x, ty: u.y - 40, life: 1 }); B.hammer.cd = hammerCooldown(B.run, B.meta); B.hammer.pending = null; FX.sound('gust'); return 10; }
    bossCall(B, u, 'GOOSE STAMPEDE', 'release the goslings', ['#f4e48a', '#ff8a1a'], 10); for (let i = 0; i < 5; i++) spawnEnemy(B, 'gosling', { x: u.x + rand(0, 30), y: GRID.y + 10 + i * (GRID.rows * GRID.cell - 16) / 4 }); return 11; },
};
// ----- boss skills -----
function bossSkill(B, u, sk) {
  const [name, arg] = sk.split(':');
  const targets = B.heroes.filter(h => h.alive);
  switch (name) {
    case 'slam': B.zones.push({ type: 'telegraph', x: u.x - 10, y: u.y, r: 44, t: 0, dur: 0.9, onEnd: z => { for (const h of inRadius(B.heroes, z, z.r)) { dealDamage(B, u, h, u.atk * 1.6); h.stun = Math.max(h.stun, 1); } FX.ring(z.x, z.y, z.r, '#ff5d8f'); FX.explode(z.x, z.y - 4, 30, ['#c9a35a', '#8a6a2a', '#ffffff']); FX.shake(8); FX.sound('quake'); } }); return 6.5;
    case 'summon': { const mini = ENEMIES[u.id] && ENEMIES[u.id].boss === 'mini'; for (let i = 0; i < 2; i++) spawnEnemy(B, arg, { x: u.x + rand(-6, 14), y: clamp(u.y + rand(-30, 30), GRID.y, GRID.y + GRID.rows * GRID.cell) }); FX.text(u.x, u.y - 50, 'Minions!', '#ffcf3a', true); FX.sound('summon'); return mini ? 15 : 12; }
    case 'breath': { B.zones.push({ type: 'breath', x: u.x - 30, y: u.y, t: 0, dur: 1.4, src: u, tick: 0 }); FX.sound('breath'); return 7; }
    case 'gust': for (const h of targets) { if (!h.rafter) { h.x = Math.max(CASTLE_X + 8, h.x - 30); } dealDamage(B, u, h, u.atk * 0.4, { quiet: false }); } FX.gust(); FX.shake(5); FX.sound('gust'); return 9;
    case 'fireRain': { const ts = targets.slice().sort(() => Math.random() - 0.5).slice(0, 5); for (const h of ts) B.zones.push({ type: 'telegraph', x: h.x, y: h.y, r: 18, t: 0, dur: 1.1, meteor: true, onEnd: z => { for (const hh of inRadius(B.heroes, z, z.r)) dealDamage(B, u, hh, u.atk * 1.3); FX.explode(z.x, z.y - 4, 18, ['#ffde3a', '#ff8a3a', '#ff3d3d']); FX.shake(3); FX.sound('boom'); } }); return 8; }
    case 'move': if (!BOSS_MOVES[u.id]) return 8; u.fury = { t: 0, dur: 1.1 }; FX.fury(u); return 99;
    case 'laser': { const t = pick(targets); if (!t) return 3; B.zones.push({ type: 'laser', t: 0, dur: 1.6, src: u, ty: t.y, tick: 0 }); FX.sound('beam'); return 8; }
  }
  return 6;
}

// ----- step -----
// ----- field hazards (one siege only, set by encounter cards) -----
const FLOOD = { x0: 338, x1: 382 };
function inFlood(u) { return !u.flying && u.x > FLOOD.x0 && u.x < FLOOD.x1; }
function hzSpd(B, u) {
  const k = B.hzK; if (!k || u.flying || u.onRafter || u.rafter) return 1;
  if (k === 'mud') return 0.75;
  if (k === 'flood' && inFlood(u)) return 0.6;
  return 1;
}
function hzFieldPoint() { return { x: rand(CASTLE_X + 30, W - 24), y: rand(GRID.y + 8, GRID.y + GRID.rows * GRID.cell - 4) }; }
function stepHazard(B, dt) {
  const k = B.hzK; if (!k) return;
  const live = B.enemies.filter(e => e.alive && !e.flying), heroes = B.heroes.filter(h => h.alive && !h.rafter);
  if (k === 'flood') for (const e of live) if (inFlood(e)) { e.soakT = Math.max(e.soakT, 0.4); e.slowT = Math.max(e.slowT, 1.5); e.slowAmt = Math.max(e.slowAmt, 0.3); if (Math.random() < dt * 4) FX.particles(e.x, e.y + 2, 2, ['#bff4ff', '#5fb8ff'], { spread: 5, up: true }); } // foes leave the ditch dripping and slow
  if (k === 'rocks') { B.hzT -= dt; if (B.hzT <= 0) { B.hzT = rand(1.6, 2.4);
      // aim: mostly at the horde, sometimes at your heroes, sometimes nowhere in particular
      const r = Math.random(), tg = r < 0.5 && live.length ? pick(live) : r < 0.8 && heroes.length ? pick(heroes) : null, p = tg ? { x: tg.x + rand(-6, 6), y: tg.y + rand(-4, 4) } : hzFieldPoint();
      B.zones.push({ type: 'telegraph', x: p.x, y: p.y, r: 16, t: 0, dur: 1.1, meteor: true, rock: true, cols: ['#6a5a4a', '#c9bca8'], onEnd: z => {
        for (const h of inRadius(B.heroes, z, z.r)) if (!h.rafter) dealDamage(B, null, h, h.maxHp * 0.1, { unavoidable: true, kind: 'hazard' });
        for (const e of inRadius(B.enemies, z, z.r)) if (!e.flying) { dealDamage(B, null, e, e.maxHp * (e.boss ? 0.02 : 0.16), { kind: 'hazard' }); e.stun = Math.max(e.stun, e.boss ? 0 : 0.5); }
        FX.explode(z.x, z.y - 2, 14, ['#b0a090', '#7a6a5a', '#e0d4c0']); FX.particles(z.x, z.y - 2, 8, ['#8a7a6a', '#c9bca8'], { spread: 12, up: true }); FX.shake(2); FX.sound('thud'); } }); } }
  if (k === 'embers') { B.hzT -= dt; if (B.hzT <= 0) { B.hzT = rand(2, 3); const r = Math.random(), tg = r < 0.45 && live.length ? pick(live) : r < 0.7 && heroes.length ? pick(heroes) : null;
      B.hzPatches.push(Object.assign(tg ? { x: tg.x + rand(-10, 10), y: tg.y + rand(-6, 6) } : hzFieldPoint(), { r: 15, t: 0, life: 6, tick: 0 })); }
    for (const P of B.hzPatches) { P.t += dt; if (P.t < 0.8) continue; P.tick -= dt; if (P.tick > 0) continue; P.tick = 0.5;
      for (const h of inRadius(B.heroes, P, P.r)) if (!h.rafter) dealDamage(B, null, h, h.maxHp * 0.02, { unavoidable: true, kind: 'hazard' });
      for (const e of inRadius(B.enemies, P, P.r)) if (!e.flying) dealDamage(B, null, e, e.maxHp * (e.boss ? 0.004 : 0.035), { kind: 'hazard' }); }
    B.hzPatches = B.hzPatches.filter(P => P.t < P.life); }
}

// shard-crowned goose: every sixth of its HP knocks two shards loose; they fly home to the vault, mend the
// hall a little, and the goose gets weaker without them
function stepShards(B) {
  const u = B.bossUnit; if (!u || !u.alive || !u.shards) return;
  const want = Math.ceil(12 * u.hp / u.maxHp / 2) * 2; if (want >= u.shards) return;
  while (u.shards > want) { u.shards--; const e = EL_KEYS[u.shards];
    FX.text(u.x + rand(-20, 20), u.y - 40 * u.scale + rand(-6, 6), ELEMENTS[e].name.toUpperCase() + ' SHARD', ELEMENTS[e].col, true);
    FX.particles(u.x, u.y - 30, 16, [ELEMENTS[e].col, ELEMENTS[e].col2, '#ffffff'], { spread: 30, up: true });
    B.castle.hp = Math.min(B.castle.max, B.castle.hp + B.castle.max * 0.02); }
  const k = u.shards / 12; u.atk = u.shardBase.atk * (0.7 + 0.3 * k); u.armor = u.shardBase.armor * (0.5 + 0.5 * k);
  FX.shake(6); FX.sound('jingle');
}
function stepBattle(B, dt) {
  if (B.done) return;
  B.t += dt;
  const run = B.run;
  stepLanes(B, dt);
  if (B.bossUnit && B.bossUnit.shards) stepShards(B);
  while (B.queue.length && B.queue[0].t <= B.t) { const q = B.queue.shift();
    if (q.event) { B.wave = q.wave; B.waves_of = q.of; if (q.event === 'surge') { FX.combo(W / 2, 46, 'THE HORDE SURGES', ['#ff3d6e', '#ffd84a']); FX.shake(8); FX.sound('roar'); FX.surge && FX.surge(q.n); } else { FX.combo(W / 2, 46, `WAVE ${q.wave}`, ['#ffd84a', '#ffffff']); FX.sound('boss'); } continue; }
    spawnEnemy(B, q.id, { sw: q.sw, rush: q.rush, captain: q.captain, turncoat: q.turncoat, wstar: q.wstar, defected: q.defected, lane: q.lane }); B.lastSpawn = B.t; }
  // overtime: once the last foe has arrived and the fight drags on, heroes hit harder every second.
  // Normal foes still standing after a while stop fighting and charge the wall instead, so a siege always ends.
  if (!B.overtime && !B.queue.length && !(B.bossUnit && B.bossUnit.alive) && B.t - Math.max(B.lastSpawn || 0, B.bossGoneT || 0) > BAL.otStart) {
    B.overtime = true; B.otT = 0; FX.banner('OVERTIME', 'Heroes hit harder. Stragglers will charge the wall.'); FX.sound('boss'); }
  if (B.overtime) B.otT = (B.otT || 0) + dt;
  B.bulwarkT += dt; if (B.bulwarkT >= 12) { B.bulwarkT = 0; applyBulwark(B); }
  const banner = 1 + 0.15 * (B.meta.ranks.banners || 0);
  const anyFoe = B.enemies.some(e => e.alive);
  // regen: cleric synergy, hot tub, nature, troll blood, water below half
  for (const h of B.heroes) if (h.alive && h.st) {
    let r = (B.syn.cleric >= 0 ? [0.008, 0.02, 0.04][B.syn.cleric] * banner : 0) + (run.tech.hottub ? 0.012 : 0) + (h.st.regen || 0);
    if (r) h.hp = Math.min(h.maxHp, h.hp + h.maxHp * r * dt);
    if (h.st.sp && h.st.sp.wellspring && h.st.sigOn) h.mana = Math.min(h.maxMana, h.mana + 4 * dt);
  }
  // fighting styles (styles.js), ember mantle, kettle
  styleTick(B, dt); traitTick(B, dt);
  B.kettleT += dt; const tick = B.kettleT >= 1; if (tick) B.kettleT = 0;
  for (const h of B.heroes) if (h.alive && h.st && h.st.sp) {
    if (tick && h.st.sp.emberAura) for (const e of inRadius(B.enemies, h, 26)) dealDamage(B, h, e, h.maxHp * 0.03, { noProc: true, kind: 'magic', from: 'item' });
    if (h.st.sp.kettle) { h.redT = (h.redT || 0) + dt; if (h.redT >= 10) { h.redT = 0; for (const a of B.heroes) if (a.alive) healUnit(B, h, a, a.maxHp * 0.1, false, 'item'); FX.ring(h.x, h.y - 6, 30, '#7cf09a'); FX.sound('heal'); } }
  }
  // combos
  if (anyFoe) for (const c of B.combos) { c.t += dt; if (c.t >= c.every) { c.t = 0; comboPulse(B, c); } }
  // secrets
  if (run.tech.bard && anyFoe) { B.bardT -= dt; if (B.bardT <= 0) { B.bardT = 18; for (const h of B.heroes) if (h.alive) { h.buffAs = Math.max(h.buffAs, 0.4); h.buffAsT = 5; } FX.combo(70, 40, '♪ The bard plays the big number ♪', ['#ff9fd0', '#ffd84a']); FX.sound('jingle'); } }
  if (run.tech.cheese && anyFoe) { B.cheeseT -= dt; if (B.cheeseT <= 0) { B.cheeseT = 7; B.waves.push({ type: 'cheese', x: CASTLE_X, y: GRID.y + randi(0, GRID.rows - 1) * GRID.cell + 14, vx: 150, life: 2.6, t: 0, src: null, dmg: teamAtk(B) * 1.4, hit: new Set(), kb: 30, h: 12 }); FX.sound('whoosh'); } }
  if (run.tech.goose) { B.gooseT -= dt; if (B.gooseT <= 0) { B.gooseT = 1; for (const e of B.enemies) if (e.alive && !e.flying && e.x < CASTLE_X + 14) { dealDamage(B, null, e, e.maxHp * (e.boss ? 0.005 : 0.05), { kind: 'combo' }); if (Math.random() < 0.3) { FX.text(e.x, e.y - 22, 'HONK', '#ffffff', true); FX.sound('honk'); } } } }
  if (B.pinataT > 0) B.pinataT -= dt;
  if (B.cpow.cd > 0) B.cpow.cd -= dt;
  // hammer
  const hm = B.hammer; if (hm.cd > 0) hm.cd -= dt;
  if (hm.pending) { hm.pending.t -= dt; if (hm.pending.t <= 0) { const p = hm.pending; hm.pending = null;
    B.hammering = true; for (const e of inRadius(B.enemies, p, p.r)) { dealDamage(B, null, e, p.dmg, { kind: 'hammer' }); e.stun = Math.max(e.stun, 1.2); if (!e.boss) e.x += 14; } B.hammering = false;
    FX.explode(p.x, p.y, p.r, ['#ffffff', '#ffcf3a', '#c9a35a', '#8a6a2a']); FX.ring(p.x, p.y, p.r, '#ffcf3a'); FX.shockwave(p.x, p.y, p.r * 1.8, '#ffcf3a'); FX.shake(10); FX.hitstop(0.08); FX.sound('hammer'); } }
  // ballista
  const bl = run.tech.ballista1 ? 1 + (run.tech.ballista2 ? 1 : 0) + (run.tech.ballista3 ? 1 : 0) : 0;
  if (bl > 0) { B.ballistaCd -= dt; if (B.ballistaCd <= 0) { const t = nearest(B.enemies, { x: 60, y: 60 }, 420); if (t) { B.ballistaCd = run.tech.ballista2 ? 2.2 : 3.2; const src = { x: 74, y: 50, side: 'castle', facing: 1, z: 0 };
    const dmg = 22 * hpMul(B.siege) * BAL.ballista * (run.tech.ballista3 ? 1.6 : 1);
    if (run.tech.ballista3) { const yy = t.y; for (const e of B.enemies) if (e.alive && Math.abs(e.y - yy) < 9) dealDamage(B, null, e, dmg, { kind: 'hit' }); FX.beam(74, 40, W + 10, yy - 8, '#dfe6f5', 2, 0.15); }
    else B.projs.push({ src, tgt: t, type: 'bolt', dmg, x: 74, y: 40, sx: 74, sy: 40, tx: t.x, ty: t.y - 8 - t.z, t: 0, dur: Math.max(0.1, dist({ x: 74, y: 40 }, t) / 320), arc: 6, o: {} });
    FX.sound('twang'); } else B.ballistaCd = 0.3; } }

  stepHazard(B, dt);
  for (const u of B.heroes) if (u.alive) stepHero(B, u, dt);
  for (const u of B.enemies) if (u.alive) stepEnemy(B, u, dt);
  stepRam(B, dt);
  for (const u of [...B.heroes, ...B.enemies]) {
    if (!u.alive) { if (u.deadT != null) u.deadT += dt; continue; }
    u.anim += dt; if (u.atkT > 0) u.atkT -= dt; if (u.hitT > 0) u.hitT -= dt;
    if (u.side === 'enemy') { const c = u.ccBy && u.ccBy.cc; if (c) { if (u.stun > 0) c.stun += dt; else if (u.slowT > 0) c.slow += dt * 0.5; } if (u.tauntT > 0 && u.taunt && u.taunt.cc) u.taunt.cc.taunt += dt; }
    if (u.stun > 0) u.stun -= dt; if (u.slowT > 0) u.slowT -= dt; else u.slowAmt = 0;
    if (u.frozen > 0) u.frozen -= dt; if (u.soakT > 0) u.soakT -= dt; if (u.blindT > 0) u.blindT -= dt; if (u.curseT > 0) u.curseT -= dt;
    if (u.tauntT > 0) { u.tauntT -= dt; if (u.tauntT <= 0 || (u.taunt && !u.taunt.alive)) u.taunt = null; }
    if (u.buffAtkT > 0) { u.buffAtkT -= dt; if (u.buffAtkT <= 0) u.buffAtk = 0; }
    if (u.buffAsT > 0) { u.buffAsT -= dt; if (u.buffAsT <= 0) u.buffAs = 0; }
    if (u.armorBuffT > 0) { u.armorBuffT -= dt; if (u.armorBuffT <= 0) u.armorBuff = 0; }
    if (u.def && u.def.regen) u.hp = Math.min(u.maxHp, u.hp + u.maxHp * u.def.regen * dt);
    if (u.poison.length) { let tot = 0; for (const p of u.poison) { tot += p.dps * dt; p.t -= dt; if (p.src) { p.src.dmg += p.dps * dt; if (p.src.side === 'hero') addTo(p.src.dsrc, p.from || 'element', p.dps * dt); } } if (u.side === 'hero') { u.taken += tot; addTo(u.tsrc, 'poison', tot); } const fire = u.poison.some(p => p.fire); u.poison = u.poison.filter(p => p.t > 0); u.hp -= tot; u.poisonTick = (u.poisonTick || 0) + tot;
      if (fire && Math.random() < dt * 8) FX.particles(u.x, u.y - 10 - u.z, 1, ['#ff6a3d', '#ffd23a'], { spread: 4, up: true, grav: -40 });
      if (u.poisonTick > u.maxHp * 0.04) { FX.dmg(u, u.poisonTick, fire ? 'burn' : 'poison'); u.poisonTick = 0; } if (u.hp <= 0) killUnit(B, u, u.poison[0] && u.poison[0].src); }
  }
  separate(B.heroes.filter(h => h.alive && !h.rafter)); separate(B.enemies.filter(e => e.alive && !e.flying)); separate(B.enemies.filter(e => e.alive && e.flying));
  for (const p of B.projs) { p.t += dt; const k = Math.min(1, p.t / p.dur);
    if (p.tgt && p.tgt.alive && !p.o.fixed && p.type !== 'fireBig' && p.type !== 'cannon') { p.tx = p.tgt.x; p.ty = p.tgt.y - 8 - p.tgt.z; }
    p.x = p.sx + (p.tx - p.sx) * k; p.y = p.sy + (p.ty - p.sy) * k - Math.sin(k * Math.PI) * p.arc; p.k = k;
    if (k >= 1) { p.dead = true; projLand(B, p); } }
  B.projs = B.projs.filter(p => !p.dead);
  for (const z of B.zones) { z.t += dt;
    if (z.type === 'arrows') { if (z.t >= z.every) { z.t = 0; z.n--; for (const e of inRadius(B.enemies, z, z.r)) dealDamage(B, z.src, e, z.dmg, { noProc: true, sig: true }); FX.arrowStorm(z.x, z.y, z.r, z.pw || 1); FX.sound('arrows'); if (z.n <= 0) z.dead = true; } }
    else if (z.type === 'telegraph') { if (z.t >= z.dur) { z.dead = true; z.onEnd(z); } }
    else if (z.type === 'ult') { z.step(B, z, dt); if (z.t >= z.dur && !z.dead) { z.dead = true; if (z.end) z.end(B, z); } }
    else if (z.type === 'breath') { z.tick -= dt; if (z.tick <= 0) { z.tick = 0.2; const src = z.src; if (!src.alive) { z.dead = true; continue; }
        for (const h of B.heroes) if (h.alive && h.x < src.x && h.x > src.x - 110 && Math.abs(h.y - src.y) < 10 + (src.x - h.x) * 0.45) dealDamage(B, src, h, src.atk * 0.35);
        if (src.x - 110 < CASTLE_X) damageCastle(B, src.atk * 0.2); FX.breath(src.x - 26, src.y - 22); } if (z.t >= z.dur) z.dead = true; }
    else if (z.type === 'laser') { const src = z.src; z.tick -= dt; if (!src.alive) { z.dead = true; continue; } if (z.tick <= 0) { z.tick = 0.15; for (const h of B.heroes) if (h.alive && Math.abs(h.y - z.ty) < 12 && h.x < src.x) dealDamage(B, src, h, src.atk * 0.3); damageCastle(B, src.atk * 0.025); }
      FX.beam(src.x - 10, src.y - 40, CASTLE_X - 10, z.ty - 8, '#ff3a5a', 4, 0.05); if (z.t >= z.dur) z.dead = true; }
  }
  B.zones = B.zones.filter(z => !z.dead);
  for (const w of B.waves) { w.t += dt; w.x += w.vx * dt;
    for (const e of B.enemies) { if (!e.alive || w.hit.has(e)) continue;
      const hitIt = w.type === 'flood' ? e.x <= w.x && e.x >= w.x - 30 : Math.abs(e.x - w.x) < 12 && Math.abs(e.y - w.y) < w.h;
      if (hitIt) { w.hit.add(e); dealDamage(B, w.src, e, w.dmg, { noProc: true, sig: !!w.src, kind: w.src ? undefined : 'combo' }); if (w.kb && !e.boss) e.x += w.kb; if (w.type === 'flood' && !w.burn) { e.slowT = 3; e.slowAmt = 0.4; } if (w.burn) e.poison.push({ dps: w.burn, t: 3, fire: true }); } }
    if (w.type === 'quake') FX.particles(w.x, w.y - 2, 2, '#c9a35a', { spread: 8, up: true });
    if (w.t >= w.life || w.x > W + 30) w.dead = true; }
  B.waves = B.waves.filter(w => !w.dead);
  for (const m of B.marks) { m.t -= dt; if (m.t <= 0) { m.dead = true; if (m.e.alive) { dealDamage(B, m.src, m.e, m.dmg, { sig: true }); FX.explode(m.e.x, m.e.y - 8 - m.e.z, 18, ['#ff3d6e', '#2a1f3a', '#ffffff']); FX.sound('slash'); } } }
  B.marks = B.marks.filter(m => !m.dead);
  if (B.echoes && B.echoes.length) { for (const E of B.echoes) { E.t -= dt; if (E.t <= 0 && (!E.u.alive || E.t < -3 || castEcho(B, E))) E.done = true; } B.echoes = B.echoes.filter(E => !E.done); }
  B.enemies = B.enemies.filter(e => e.alive || (e.deadT = (e.deadT || 0) + dt) < 0.01);
  if (!B.done && !B.queue.length && !B.enemies.some(e => e.alive)) B.done = 'victory';
}

function separate(list) {
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    const a = list[i], b = list[j]; const dx = b.x - a.x, dy = b.y - a.y; if (dx > 14 || dx < -14 || dy > 14 || dy < -14) { if (!(a.scale > 1 || b.scale > 1)) continue; }
    const d = Math.hypot(dx, dy) || 0.01, min = 7 * Math.max(a.scale || 1, b.scale || 1);
    if (d < min) { const push = (min - d) / 2, nx = dx / d, ny = dy / d; const wa = a.boss ? 0 : 1, wb = b.boss ? 0 : 1;
      a.x -= nx * push * wa; a.y -= ny * push * wa; b.x += nx * push * wb; b.y += ny * push * wb;
      const top = a.flying ? 50 : GRID.y - 4, bot = GRID.y + GRID.rows * GRID.cell + 6; a.y = clamp(a.y, top, bot); b.y = clamp(b.y, top, bot);
      if (!a.flying) { a.x = Math.max(CASTLE_X - 2, a.x); b.x = Math.max(CASTLE_X - 2, b.x); } }
  }
}

function chaseTarget(B, u, groundOnly) {
  let best = null, bs = Infinity;
  for (const e of B.enemies) { if (!e.alive || e.x > W - 4 || (groundOnly && (e.flying || e.onRafter || e.climb)) || (u.side === 'hero' && !heroLaneOk(B, u, e))) continue; const sc = dist(e, u) + 0.6 * (e.x - CASTLE_X); if (sc < bs) { bs = sc; best = e; } }
  return best;
}
function moveToward(u, tx, ty, spd, dt) {
  const dx = tx - u.x, dy = ty - u.y, d = Math.hypot(dx, dy); if (d < 0.5) return;
  const s = Math.min(d, spd * dt); u.x += dx / d * s; u.y += dy / d * s; if (Math.abs(dx) > 1) u.facing = dx > 0 ? 1 : -1; u.moving = true;
}

function heroAS(u) { return u.st.as * (1 + u.buffAs + (u.auraAs || 0) + (u.st.frenzy ? 0.04 * u.frenzyStacks : 0) + (u.st.sp && u.st.sp.haste ? 0.05 * u.qs : 0)) * (1 - (u.slowAmt || 0) * 0.5); }
function heroAtk(u) { return u.st.atk * (1 + u.buffAtk) * BAL.auto; } // basic attacks only; signatures use S(u)

// a rafter hero leaps down to fight on the field for the rest of the siege
function rafterJump(B, u) {
  if (!u || !u.alive || !u.rafter || u.leap) return false;
  const tx = CASTLE_X + 40 + rand(0, 20), ty = GRID.y + GRID.rows * GRID.cell / 2 + rand(-16, 16);
  u.rafter = false; u.st.range = u.st.groundRange || u.st.range; u.target = null;
  u.leap = { sx: u.x, sy: u.y, tx, ty, t: 0, dur: 0.55, h: 34, onLand: () => { u.hx = tx; u.hy = ty; u.lane = laneOf(ty); FX.shockwave(tx, ty, 30, '#ffd84a'); FX.particles(tx, ty, 12, ['#c9b48a', '#ffffff'], { spread: 14 }); FX.shake(3); FX.sound('thud'); } };
  FX.text(u.x, u.y - 24, 'TO THE FRONT!', '#ffd84a', true); FX.sound('whoosh'); return true;
}
// Call them back (Cam 2026-10-23): pull a champion into the keep mid-siege. They keep the XP they earned (a fallen legend earns none), out for the rest of the siege
function recallsMax(run) { return 1 + (run.tech.sally ? 1 : 0); }
function recallsLeft(B) { return recallsMax(B.run) - (B.recalled || 0); }
function recallHero(B, u) {
  if (!u || !u.alive || u.temp || u.leap || u.dash || recallsLeft(B) <= 0 || B.done) return false;
  u.alive = false; u.recalled = true; u.target = null; B.recalled = (B.recalled || 0) + 1;
  for (const e of B.enemies) if (e.target === u) e.target = null;
  FX.puff(u.x, u.y, 1); FX.text(u.x, u.y - 24, 'CALLED BACK', '#9fd8ff', true); FX.sound('whoosh'); return true;
}
// how grand a signature looks: signature power x ability power, square-rooted, about 1 early and up to 3 late
function sigPower(u) { const st = u && u.st; if (!st) return 1; return Math.max(0.8, Math.min(3.6, Math.sqrt((st.sigMul || 1) * (st.ap || 1)) * (1 + 0.12 * (st.rarity || 0)))); }
function castSignature(B, u) {
  DTAG = 'ability'; let ok; try { ok = ABILITIES[u.st.ability || u.def.ability](B, u); } finally { DTAG = null; }
  if (ok === false) return false;
  // Mythic and rarer legends echo their signature a moment later
  if (u.st.echo && !u.echoing) (B.echoes = B.echoes || []).push({ u, t: 0.9, mul: u.st.echo });
  if (B.ach) B.ach.sigs++;
  u.mana = u.st.sp.refill ? u.maxMana * 0.4 : 0; u.atkT = 0.35;
  const E = u.st.el, ecol = u.els && u.els[0] ? ELEMENTS[u.els[0]].col : '#fff1a8';
  const myEl = u.els || [], cb = (B.combos || []).find(c => myEl.includes(c.a) || myEl.includes(c.b));
  FX.cutin(u, u.st.aName || u.def.aName, ecol, { ab: u.st.ability || u.def.ability, els: myEl, col2: myEl[0] ? ELEMENTS[myEl[0]].col2 : '#ffffff', combo: cb ? { name: cb.name, ca: ELEMENTS[cb.a].col, cb: ELEMENTS[cb.b].col } : null, pw: sigPower(u) });
  FX.castSpark(u, ecol);
  if (u.st.sp.runeStrike) u.spellblade = 3;
  if (u.st.sp.curse) for (const e of B.enemies) if (e.alive && dist(e, u) < 200) e.curseT = 4;
  if (E.light) for (const h of B.heroes) if (h.alive) healUnit(B, u, h, h.maxHp * 0.1 * E.light, true, 'element');
  if (E.void) { const t = densest(B.enemies, 30) ; if (t) { for (const e of inRadius(B.enemies, t, 60)) if (!e.boss) { e.x += (t.x - e.x) * 0.6; e.y += (t.y - e.y) * 0.6; } FX.vortex(t.x, t.y, [ELEMENTS.void.col, '#0f0a2a']); } }
  if (E.meat) for (const e of inRadius(B.enemies, u, TAUNT_R)) { e.taunt = u; e.tauntT = Math.max(e.tauntT, 2.5); }
  return true;
}

function castEcho(B, E) {
  const u = E.u; if (u.leap || u.dash || u.spin > 0 || u.stun > 0) return false;
  u.echoing = true; u.abMul = E.mul; DTAG = 'ability'; let ok;
  try { ok = ABILITIES[u.st.ability || u.def.ability](B, u); } finally { DTAG = null; u.abMul = 1; u.echoing = false; }
  if (ok !== false) { FX.text(u.x, u.y - 28, 'ECHO', RARITY[u.st.rarity || 0].col, true); FX.castSpark(u, RARITY[u.st.rarity || 0].col); }
  return true;
}
function stepHero(B, u, dt) {
  u.moving = false;
  if (u.leap) { const L = u.leap; L.t += dt; const k = Math.min(1, L.t / L.dur); u.x = L.sx + (L.tx - L.sx) * k; u.y = L.sy + (L.ty - L.sy) * k; u.z = Math.sin(k * Math.PI) * L.h; if (k >= 1) { u.z = 0; u.leap = null; L.onLand(); } return; }
  if (u.dash) { const D = u.dash; D.t -= dt; if (D.t <= 0) { const e = D.ts[D.i]; if (e && e.alive) { FX.afterimage(u); u.x = e.x - 6; u.y = e.y; dealDamage(B, u, e, D.dmg != null ? D.dmg : S(u) * D.mul, { sig: true }); FX.slash(e.x, e.y - 8, 1, '#ffffff', true); FX.sound('slash'); } D.i++; D.t = 0.11; if (D.i >= D.ts.length) u.dash = null; } return; }
  if (u.stun > 0) return;
  if (u.spin > 0) { u.spin -= dt; u.spinTick -= dt; u.atkT = 0.1; if (u.spinTick <= 0) { u.spinTick = 0.25; for (const e of inRadius(B.enemies, u, 28 + 3 * RK(u))) dealDamage(B, u, e, u.spinDmg || S(u) * 0.6, { sig: true }); FX.ring(u.x, u.y - 6, 26, '#ffffff'); } const t = nearest(B.enemies, u, 140); if (t) moveToward(u, t.x, t.y, u.st.spd * 0.8, dt); return; }
  if (u.sty && styleStep(B, u, dt)) return;
  if (!u.temp && u.st.sigOn && u.mana >= u.maxMana && B.enemies.some(e => e.alive)) {
    if (castSignature(B, u)) return;
    u.mana = u.maxMana * 0.8;
  }
  const cls = u.def.cls, ranged = u.st.range > 40;
  u.retarget -= dt;
  if (u.retarget <= 0 || !u.target || !u.target.alive) {
    u.retarget = 0.3; u.target = null;
    const held = u.sty && styleTarget(B, u);
    if (held) {} else if (cls === 'cleric') { const a = B.heroes.filter(h => h.alive && h.hp < h.maxHp * 0.85 && dist(h, u) <= u.st.range * 1.2).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0]; if (a) { u.target = a; u.healing = true; } else u.healing = false; }
    // awareness: anything hitting the castle gets dealt with first by heroes close enough to reach it
    if (!held && !u.target) { const near = u.rafter ? u.st.range : ranged ? u.st.range + 90 : 240;
      u.target = nearest(B.enemies, u, near, e => e.siegeT != null && B.t - e.siegeT < 2 && heroLaneOk(B, u, e) && (u.rafter || ranged || (!e.onRafter && !e.climb && !e.flying))); }
    if (!held && !u.target) {
      if (ranged) u.target = u.rafter ? nearest(B.enemies, u, u.st.range, e => e.x < W - 6) : nearest(B.enemies, u, u.st.range + (B.overtime ? 999 : 70), e => heroLaneOk(B, u, e));
      else if (cls === 'rogue' && !u.struck) u.target = B.enemies.filter(e => e.alive && dist(e, { x: u.hx, y: u.hy }) < 120 && heroLaneOk(B, u, e)).sort((a, b) => b.x - a.x)[0] || null;
      else u.target = nearest(B.enemies, { x: u.hx, y: u.hy }, B.overtime ? 999 : cls === 'guardian' ? 110 : cls === 'rogue' ? 160 : 130, e => !e.onRafter && !e.climb && heroLaneOk(B, u, e) && (B.overtime || !e.flying || dist(e, u) < 40)) || nearest(B.enemies, u, 30, e => !e.onRafter && !e.climb)
        || nearest(B.enemies, u, 150, e => e.target && e.target.side === 'hero' && e.range > 40 && heroLaneOk(B, u, e));
      // nothing in the hero's zone: chase whatever is left, leakers nearest the castle first
      if (!u.target && !u.rafter) u.target = chaseTarget(B, u, !ranged);
    }
  }
  const t = u.target;
  if (t && t.alive) {
    const d = dist(u, t), reach = (u.healing ? u.st.range * 1.2 : u.st.range) + (t.scale > 1 ? 8 * t.scale : 0) + (t.flying ? 8 : 0);
    if (d > reach) { if (!u.rafter && !u.noMove) { moveToward(u, t.x - (ranged ? 0 : 9 * Math.sign(t.x - u.x || 1)), t.y, u.st.spd * (1 - u.slowAmt) * hzSpd(B, u), dt); } }
    else {
      u.facing = t.x >= u.x ? 1 : -1;
      u.cd -= dt;
      if (u.cd <= 0) {
        u.cd = 1 / heroAS(u); u.atkT = 0.18; u.hits++;
        if (u.st.sigOn) u.mana = Math.min(u.maxMana, u.mana + 10 * u.st.manaGain);
        if (u.st.frenzy) u.frenzyStacks = Math.min(u.st.frenzy, u.frenzyStacks + 1);
        if (u.st.sp.haste) u.qs = Math.min(10, u.qs + 1);
        if (u.healing) fireProj(B, u, t, 'heal', u.st.atk * (1 + u.buffAtk) * 1.6, { speed: 150 });
        else if (ranged) {
          const pt = u.def.proj && u.def.proj !== 'heal' ? u.def.proj : (cls === 'mage' || cls === 'cleric' ? 'spark' : 'arrow');
          fireProj(B, u, t, pt, heroAtk(u), { speed: u.rafter ? 360 : pt === 'arrow' || pt === 'arrowGold' ? 300 : 200, rafter: u.rafter });
          if (u.rafter && typeof FXS !== 'undefined') { u.flashT = 0.12; for (let i = 0; i < 4; i++) FXS.parts.push({ x: u.x + 6, y: u.y - 12, vx: rand(10, 40), vy: rand(-20, 5), life: 0.25, t: 0, color: '#ffe680', size: 1, grav: 0 }); }
          const extraN = cls === 'ranger' && B.syn.ranger >= 0 ? [1, 2, 4][B.syn.ranger] : 0;
          if (extraN) { const extra = B.enemies.filter(e => e.alive && e !== t && dist(e, u) < u.st.range).sort((a, b) => dist(a, u) - dist(b, u)).slice(0, extraN); for (const e of extra) fireProj(B, u, e, pt, heroAtk(u) * BAL.extraShot, { speed: 300, rafter: u.rafter, from: 'bonus' }); }
          FX.sound(pt === 'arrow' || pt === 'arrowGold' ? 'bow' : 'pew');
        } else { dealDamage(B, u, t, heroAtk(u)); FX.slash(t.x, t.y - 8 - t.z, u.facing, u.els && u.els[0] ? ELEMENTS[u.els[0]].col : '#ffffff'); FX.sound('hit'); }
        // Gale Cutlass: every third attack strikes twice
        if (u.sty) styleAttacked(B, u, t);
        traitAttacked(B, u, t, ranged);
        if (u.st.sp.twinStrike && !u.healing && u.hits % 3 === 0 && t.alive) { if (ranged) fireProj(B, u, t, u.def.proj && u.def.proj !== 'heal' ? u.def.proj : 'arrow', heroAtk(u), { speed: 300, rafter: u.rafter, from: 'item' }); else dealDamage(B, u, t, heroAtk(u), { from: 'item' }); }
      }
    }
  } else if (!u.rafter && !u.noMove) {
    const dh = dist(u, { x: u.hx, y: u.hy }); if (dh > 2) moveToward(u, u.hx, u.hy, u.st.spd, dt); else u.facing = 1;
  }
}

function stepEnemy(B, u, dt) {
  u.moving = false;
  if (u.rage) { bossPatience(B, u, dt); return; }
  if (u.stun > 0) return;
  if (u.lureT > 0 && styleLured(B, u, dt)) return;
  if (B.otT > BAL.otCharge && !u.boss) { overtimeCharge(B, u, dt); return; }
  if (u.boss && bossPatience(B, u, dt)) return;
  // the angry wind-up before a signature move: the boss plants its feet, steams, then unleashes it
  if (u.fury) { u.fury.t += dt; u.moving = false; if (u.fury.t >= u.fury.dur) { u.fury = null; u.skillT.move = BOSS_MOVES[u.id](B, u, B.heroes.filter(h => h.alive)); u.atkT = 0.4; } return; }
  if (u.boss) { for (const sk in u.skillT) { u.skillT[sk] -= dt; if (u.skillT[sk] <= 0) { u.skillT[sk] = bossSkill(B, u, sk); u.atkT = 0.4; } } }
  const spd = u.spd * (1 - u.slowAmt) * hzSpd(B, u);
  const heroes = B.heroes;
  u.retarget -= dt;
  // siege ladders and rams: wall-huggers climb to the rafters, crowds bring a ram
  if (siegeTricks(B, u, dt)) return;
  if (u.taunt && u.taunt.alive && !u.onRafter) u.target = u.taunt;
  else if (u.onRafter && (u.retarget <= 0 || !u.target || !u.target.alive)) { u.retarget = 0.35; u.target = nearest(heroes, u, 999, h => h.rafter); if (!u.target) { u.onRafter = false; u.y = GRID.y + 8; u.x = CASTLE_X + 10; FX.text(u.x, u.y - 20, 'jumps down', '#ffffff'); } }
  else if (u.retarget <= 0 || (u.target && !u.target.alive)) {
    u.retarget = 0.35; u.target = null;
    if (u.def.kind === 'healer') { const a = B.enemies.filter(e => e.alive && e !== u && e.hp < e.maxHp * 0.8 && dist(e, u) < u.range).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0]; if (a) { u.target = a; u.healing = true; } else u.healing = false; }
    if (!u.target) {
      if (u.flying) u.target = nearest(heroes, u, u.range + 30, h => h.rafter) || nearest(heroes, u, Math.max(u.range, 20) + 6);
      // the horde hunts heroes first and only hits the wall when none are close (Cam: combat is about keeping heroes alive)
      else if (u.range > 40) u.target = nearest(heroes, u, u.range + BAL.huntRanged);
      else u.target = nearest(heroes, u, BAL.huntMelee + 8 * (u.scale - 1), h => !h.rafter && (!B.lanes || u.boss || laneOf(h.y) === laneOf(u.y) || dist(h, u) < 36));
    }
  }
  const t = u.target;
  const reach = u.range + (u.scale - 1) * 8 + (t && t.scale > 1 ? 6 : 0);
  if (t && t.alive && !u.healing && t.side === 'enemy') u.target = null;
  if (t && t.alive) {
    const d = dist(u, t);
    if (d > reach) moveToward(u, t.x + (u.range > 40 ? 0 : 8 * (u.x > t.x ? 1 : -1)), t.y, spd, dt);
    else { u.facing = t.x >= u.x ? 1 : -1; u.cd -= dt; if (u.cd <= 0) { u.cd = 1 / u.as; u.atkT = 0.2;
      if (u.healing) { healUnit(B, null, t, u.atk * 2.5); FX.particles(t.x, t.y - 10, 5, '#ff5dd8', { spread: 10, up: true }); }
      else if (u.range > 40) fireProj(B, u, t, u.proj || u.def.proj || 'rock', u.atk, { speed: 170, splash: u.def.splash, slow: u.def.slow, poison: u.def.poison });
      else { dealDamage(B, u, t, u.atk); FX.slash(t.x, t.y - 8, -1, '#ff7a9a'); FX.sound('ehit'); } } }
  } else {
    const stopX = CASTLE_X + (u.range > 40 ? u.range * 0.8 : 6) + (u.scale - 1) * 10;
    if (u.x > stopX) { moveToward(u, u.x - 30, clamp(u.y, GRID.y, GRID.y + GRID.rows * GRID.cell), spd, dt); u.facing = -1; }
    else { u.facing = -1; u.cd -= dt; if (u.cd <= 0) { u.cd = 1 / u.as; u.atkT = 0.2;
      if (u.range > 40) fireProj(B, u, null, u.def.proj || 'rock', 0, { tx: CASTLE_X - rand(4, 30), ty: rand(70, 180), fixed: true, onLand: p => { damageCastle(B, u.atk, u); FX.particles(p.tx, p.ty, 4, '#c9c4e6', { spread: 10 }); } });
      else if (!u.ram) { damageCastle(B, u.atk, u); FX.particles(CASTLE_X, u.y - 10, 3, '#c9c4e6', { spread: 8 }); FX.sound('thud'); } } }
  }
}

// overtime stragglers: shrug off heroes, sprint to the wall, slam it once and leave the field (no gold)
function overtimeCharge(B, u, dt) {
  if (!u.rampage) { u.rampage = true; u.ram = null; u.onRafter = false; u.climb = null; u.taunt = null; u.target = null; u.healing = false; if (u.y < GRID.y) u.y = GRID.y + 8; FX.text(u.x, u.y - 24, 'CHARGE!', '#ff9a5c', true); }
  const stopX = CASTLE_X + 6 + (u.scale - 1) * 10; u.facing = -1; u.moving = true;
  if (u.x > stopX) { u.x = Math.max(stopX, u.x - Math.max(u.spd * 1.8, 45) * dt); u.y += (clamp(u.y, GRID.y, GRID.y + GRID.rows * GRID.cell) - u.y) * Math.min(1, dt * 3); return; }
  damageCastle(B, u.atk * BAL.otSlam, u); FX.shake(4); FX.text(u.x, u.y - 24, 'BREAKS THROUGH', '#ff9a5c', true); FX.particles(CASTLE_X, u.y - 10, 10, ['#c9c4e6', '#8a6a4a'], { spread: 14 }); FX.sound('thud');
  u.alive = false; u.hp = 0; u.fled = true; B.fled = (B.fled || 0) + 1;
}
// boss patience: a boss you can't kill in time taunts, tramples through your heroes and smashes the wall.
// Normal bosses leave after the hit (no trophy, no loot). The final boss turns around and comes back.
function bossLimit(u) { return u.final ? BAL.patFinal : u.def.boss === 'big' ? BAL.patBig : BAL.patMini; }
function bossPatience(B, u, dt) {
  if (!u.rage) { u.patT = (u.patT || 0) + dt; u.patMax = u.patMax || bossLimit(u) * (B.run.mods.firm ? 1.2 : 1);
    if (!u.warned && u.patT > u.patMax - 10) { u.warned = true; FX.text(u.x, u.y - 34 * u.scale, 'getting impatient...', '#ff9a5c', true); }
    if (u.patT < u.patMax) return false;
    u.rage = { ph: 'taunt', t: 0, hit: new Set() }; u.stun = 0; u.slowAmt = 0; u.target = null; u.taunt = null;
    FX.combo(clamp(u.x, 70, W - 70), u.y - 30 - 12 * u.scale, "YOU'RE TOO WEAK FOR ME!", ['#ff3d6e', '#ffd84a']); FX.shake(8); FX.flash('#ff3d6e', 0.3); FX.sound('roar'); FX.hitstop(0.2); }
  const R = u.rage; R.t += dt; u.facing = -1;
  if (R.ph === 'taunt') { u.atkT = 0.15 * (Math.sin(R.t * 30) > 0 ? 1 : 0); if (Math.random() < dt * 20) FX.particles(u.x + rand(-10, 10), u.y - 4, 2, ['#ff3d6e', '#ffd84a'], { spread: 8, up: true });
    if (R.t > 1.6) { R.ph = 'charge'; R.t = 0; FX.sound('whoosh'); } return true; }
  if (R.ph === 'charge') { u.moving = true; const stopX = CASTLE_X + 8 + (u.scale - 1) * 10;
    u.x = Math.max(stopX, u.x - (90 + 160 * Math.min(1, R.t / 0.5)) * dt);
    if (Math.random() < dt * 30) FX.particles(u.x + 8 * u.scale, u.y, 2, ['#c9b48a', '#8a6a4a'], { spread: 6 });
    for (const h of B.heroes) if (h.alive && !h.rafter && !R.hit.has(h) && Math.abs(h.x - u.x) < 10 + 6 * u.scale && Math.abs(h.y - u.y) < 14 + 6 * u.scale) {
      R.hit.add(h); dealDamage(B, u, h, h.maxHp * BAL.patTrample, { unavoidable: true, from: 'boss' }); h.stun = Math.max(h.stun || 0, 0.9);
      h.y = clamp(h.y + (h.y >= u.y ? 1 : -1) * rand(16, 26), GRID.y, GRID.y + GRID.rows * GRID.cell); h.x -= rand(4, 10);
      FX.text(h.x, h.y - 22, 'TRAMPLED', '#ff9a5c', true); FX.particles(h.x, h.y - 8, 8, '#ffffff', { spread: 14 }); FX.shake(3); FX.sound('thud'); }
    if (u.x <= stopX) { R.ph = 'smash'; R.t = 0;
      const dmg = B.castle.max * (u.def.boss === 'big' ? BAL.patSmashBig : BAL.patSmashMini);
      FX.hitstop(0.3); FX.shake(18); FX.flash('#ffffff', 0.5); FX.sound('castlefall'); FX.text(CASTLE_X + 4, u.y - 40, 'CRASH!', '#ff3d6e', true);
      FX.particles(CASTLE_X, u.y - 20, 40, ['#c9c4e6', '#8a6a4a', '#ffffff'], { spread: 50, up: true });
      damageCastle(B, dmg, null); B.bossSmashed = (B.bossSmashed || 0) + 1; }
    return true; }
  if (R.ph === 'smash') { if (R.t < 0.7) return true;
    if (u.final) { R.ph = 'back'; R.t = 0; FX.text(u.x, u.y - 30, 'HONK. AGAIN.', '#ffffff', true); return true; }
    u.alive = false; u.hp = 0; u.fled = true; B.bossFled = u.def.name; B.bossGoneT = B.t; FX.puff(u.x, u.y, u.scale); FX.particles(u.x, u.y - 8, 30, ['#c9b48a', '#8a6a4a'], { spread: 40 });
    FX.banner('THE BOSS GOT AWAY', `${u.def.name} smashed the wall and left. No trophy this time.`); return true; }
  if (R.ph === 'back') { u.moving = true; u.facing = 1; u.x += 110 * dt; if (u.x >= W - 70) { u.rage = null; u.patT = 0; u.patMax = BAL.patAgain; u.warned = false; } return true; }
  return true;
}
function hammerDamage(run, meta, s) { return BAL.hammer * 75 * hpMul(s) * (1 + 0.25 * (meta.ranks.hammer || 0)) * (run.tech.pulleys ? 1.3 : 1) * (run.tech.hammer2 ? 1.5 : 1); }
function castHammer(B, x, y) {
  if (B.hammer.cd > 0 || B.hammer.pending) return false;
  B.hammer.cd = hammerCooldown(B.run, B.meta);
  B.hammer.pending = { x, y, r: 34 * (B.run.tech.hammer2 ? 1.5 : 1), t: 0.65, dmg: hammerDamage(B.run, B.meta, B.siege) };
  FX.sound('whoosh'); return true;
}
function hammerCooldown(run, meta) { return Math.max(10, 34 - 2 * (meta.ranks.hammer || 0) - (run.tech.pulleys ? 6 : 0)); }
