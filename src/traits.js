// ===== Race and class thresholds (Cam 2026-10-24) =====
// Bots showed that which legends you buy barely mattered: chasing a race or class did no better than random picks.
// Now every race and class keeps its stat bonus at 2, and at 4 and 6 it changes how those champions fight.
// B.syn[key] is the tier index: -1 off, 0 at 2, 1 at 4, 2 at 6. Hooks are called from sim.js.
const TRAIT_PLAY = {
  human:     ['', 'When any champion falls, Humans gain +20% attack for the rest of the siege.', 'Last stand: once per siege, a Human who would fall holds on at 1 HP for 2s.'],
  elf:       ['', 'Every 3rd Elf attack also strikes another foe in reach.', 'That extra strike hits three more foes.'],
  dwarf:     ['', 'Dwarves hit back for 30% of the melee damage they take.', 'Every 6th hit a Dwarf takes sets off a quake that stuns foes around them for 1s.'],
  orc:       ['', 'Kills heal the Orc for 12% of their HP.', 'Below half HP, Orcs hit 40% harder.'],
  skeleton:  ['', '', ''],
  beast:     ['', 'Beastfolk crits make the foe bleed for half the damage again over 3s.', 'A kill lets a Beastfolk attack again at once.'],
  toad:      ['', 'Poisoned foes move 25% slower.', 'Poisoned foes that die burst and poison every foe around them.'],
  guardian:  ['', 'Every 6s each Guardian taunts the foes around them.', 'While a Guardian stands, the walls take 30% less damage.'],
  berserker: ['', 'At full frenzy, hits also cleave the foes next to the target for 40%.', 'At full frenzy, Berserkers heal for 20% of the damage they deal.'],
  ranger:    ['', '', ''],
  mage:      ['', 'Mage signature hits stun for 0.8s.', 'Mages start every siege with a full signature, and the stun lasts 1.5s.'],
  cleric:    ['', 'The first champion to fall each siege gets back up at 40% HP.', 'Healing past full HP becomes a shield (up to 30% of max HP).'],
  rogue:     ['', 'Every kill readies a Rogue\'s ambush strike again.', 'A kill makes the Rogue vanish for 1.5s: nothing can hit them.'],
};
// the tier text the tooltips and synergy lists show: the stat part, plus every fighting change unlocked so far
for (const T of [RACES, CLASSES]) for (const k in T) { const base = T[k].desc, play = TRAIT_PLAY[k] || [];
  T[k].desc = n => [base(n)].concat(play.slice(1, n + 1).filter(Boolean)).join(' '); }

const isTrait = (u, k) => !!(u && u.side === 'hero' && u.def && (u.def.race === k || u.def.cls === k));
const trOn = (B, k, t) => B.syn && B.syn[k] >= t;

function traitInit(B) {
  B.trInit = true;
  if (trOn(B, 'mage', 2)) for (const u of B.heroes) if (isTrait(u, 'mage') && u.st.sigOn) u.mana = u.maxMana;
  for (const u of B.heroes) if (isTrait(u, 'guardian')) u.trTaunt = 1 + Math.random();
}
function traitTick(B, dt) {
  if (!B.trInit) traitInit(B);
  if (trOn(B, 'guardian', 1)) for (const u of B.heroes) if (u.alive && isTrait(u, 'guardian')) { u.trTaunt = (u.trTaunt || 6) - dt; if (u.trTaunt <= 0) { u.trTaunt = 6; guardTaunt(B, u, 2); } }
}
// after each attack a hero makes
function traitAttacked(B, u, t, ranged) {
  if (!t || !t.alive) return;
  if (trOn(B, 'elf', 1) && isTrait(u, 'elf') && u.hits % 3 === 0) {
    const n = trOn(B, 'elf', 2) ? 3 : 1, more = B.enemies.filter(e => e.alive && e !== t && dist(e, u) < u.st.range + 10).sort((a, b) => dist(a, u) - dist(b, u)).slice(0, n);
    for (const e of more) { if (ranged) fireProj(B, u, e, u.def.proj && u.def.proj !== 'heal' ? u.def.proj : 'arrow', heroAtk(u) * 0.8, { speed: 300, rafter: u.rafter, from: 'bonus' }); else dealDamage(B, u, e, heroAtk(u) * 0.8, { from: 'bonus', noProc: true }); }
  }
}
// outgoing damage multiplier
function traitDmgMul(B, src, tgt) {
  let m = 1;
  if (src && trOn(B, 'orc', 2) && isTrait(src, 'orc') && src.hp < src.maxHp * 0.5) m *= 1.4;
  if (src && src.trRally && isTrait(src, 'human')) m *= 1 + src.trRally;
  return m;
}
// damage a hero is about to take (after armour and shields)
function traitTaken(B, src, tgt, dmg) {
  if (tgt.side !== 'hero') return dmg;
  if (tgt.vanishT > B.t) return 0;
  if (trOn(B, 'human', 2) && isTrait(tgt, 'human') && !tgt.lastStand && tgt.hp - dmg < 1) { tgt.lastStand = true; tgt.undyingT = B.t + 2; FX.text(tgt.x, tgt.y - 22, 'LAST STAND', '#ffd166', true); }
  if (isTrait(tgt, 'dwarf') && src && src.alive && src.side === 'enemy') {
    if (trOn(B, 'dwarf', 1) && !(src.range > 40)) dealDamage(B, tgt, src, dmg * 0.3, { from: 'bonus', noProc: true, quiet: true, noCrit: true });
    if (trOn(B, 'dwarf', 2) && (tgt.trHits = (tgt.trHits || 0) + 1) % 6 === 0) { for (const e of inRadius(B.enemies, tgt, 30)) if (!e.boss) e.stun = Math.max(e.stun || 0, 1); FX.shockwave && FX.shockwave(tgt.x, tgt.y, 30, '#ffa25e'); FX.shake && FX.shake(3); }
  }
  return dmg;
}
// after a hero's hit lands
function traitHit(B, src, tgt, dmg, o, crit) {
  if (!tgt) return;
  if (o.sig && trOn(B, 'mage', 1) && isTrait(src, 'mage') && tgt.alive && !tgt.boss) tgt.stun = Math.max(tgt.stun || 0, trOn(B, 'mage', 2) ? 1.5 : 0.8);
  if (o.noProc) return;
  if (crit && trOn(B, 'beast', 1) && isTrait(src, 'beast') && tgt.alive) tgt.poison.push({ dps: dmg / 6, t: 3, src, from: 'bonus' });
  if (trOn(B, 'toad', 1) && tgt.poison && tgt.poison.length && tgt.alive) { tgt.slowT = Math.max(tgt.slowT, 1); tgt.slowAmt = Math.max(tgt.slowAmt, 0.25); }
  if (isTrait(src, 'berserker') && src.st.frenzy && src.frenzyStacks >= src.st.frenzy) {
    if (trOn(B, 'berserker', 1)) for (const e of inRadius(B.enemies, tgt, 16)) if (e !== tgt) dealDamage(B, src, e, dmg * 0.4, { from: 'bonus', noProc: true, quiet: true });
    if (trOn(B, 'berserker', 2)) healUnit(B, src, src, dmg * 0.2, true, 'bonus');
  }
}
// a foe died; src is whoever killed it
function traitKill(B, src, v) {
  if (trOn(B, 'toad', 2) && v.poison && v.poison.length) for (const e of inRadius(B.enemies, v, 24)) if (e.alive) e.poison.push({ dps: [3, 8, 20][B.syn.toad] * (1 + 0.04 * B.siege) * 2, t: 3, src: null, from: 'bonus' });
  if (!src || src.side !== 'hero' || !src.alive) return;
  if (trOn(B, 'orc', 1) && isTrait(src, 'orc')) healUnit(B, src, src, src.maxHp * 0.12, true, 'bonus');
  if (trOn(B, 'beast', 2) && isTrait(src, 'beast')) src.cd = 0;
  if (trOn(B, 'rogue', 1) && isTrait(src, 'rogue')) src.struck = false;
  if (trOn(B, 'rogue', 2) && isTrait(src, 'rogue')) { src.vanishT = B.t + 1.5; FX.text(src.x, src.y - 20, 'vanish', '#c8a0ff', false, true); }
}
// a hero is about to fall: true keeps them up
function traitSave(B, u) {
  if (u.temp || !trOn(B, 'cleric', 1) || B.trRevived) return false;
  B.trRevived = true; u.hp = u.maxHp * 0.4; FX.text(u.x, u.y - 22, 'SANCTUARY', '#bfffe0', true); FX.particles(u.x, u.y - 8, 16, '#bfffe0', { spread: 30, up: true }); FX.sound('revive');
  return true;
}
// a hero has fallen
function traitFell(B, u) {
  if (u.temp || !trOn(B, 'human', 1)) return;
  for (const h of B.heroes) if (h.alive && isTrait(h, 'human')) { h.trRally = (h.trRally || 0) + 0.2; FX.text(h.x, h.y - 20, 'VALOR', '#ffd166', false, true); }
}
// healing past full HP (cleric six)
function traitOverheal(B, tgt, over) {
  if (over <= 0 || tgt.side !== 'hero' || !trOn(B, 'cleric', 2)) return;
  tgt.shield = Math.min(tgt.maxHp * 0.3, (tgt.shield || 0) + over);
}
function traitCastleMul(B) { return trOn(B, 'guardian', 2) && B.heroes.some(u => u.alive && isTrait(u, 'guardian')) ? 0.7 : 1; }
