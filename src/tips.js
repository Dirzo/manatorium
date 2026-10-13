// ===== Hover tips: classes, elements, abilities, rarity =====
// Power = Attack × Ability power × signature power (signature power grows 7% a level from level 5)
const CLASS_REC = {
  guardian: { stats: ['def', 'ap'], why: 'Defense keeps a Guardian standing at the front. Ability power makes their shields and stuns land harder.' },
  berserker: { stats: ['ad', 'ap'], why: 'Attack drives every swing. Their signatures hit for Attack × Ability power, so Ability power is a strong second.' },
  rogue: { stats: ['ad', 'ap'], why: 'Rogues live on fast, heavy hits. Ability power multiplies their dash and mark damage.' },
  ranger: { stats: ['ad', 'ap'], why: 'Attack powers every arrow, including Volley extras. Ability power multiplies their signature.' },
  mage: { stats: ['ap', 'ad'], why: 'Mage damage comes from signatures, which hit for Attack × Ability power. Ability power also feeds their summons.' },
  cleric: { stats: ['ap', 'def'], why: 'Every heal and shield scales with Ability power. Defense keeps the healer alive.' },
};
// kind: dmg (Power), heal (target max HP × Ability power × signature power), rank (rank only), summon, buff
const ABILITY_SCALE = {
  shieldBash: { rec: ['ap', 'def'], txt: 'Taunts foes in a wide circle for 2s. 120% Power to nearby foes and a 1.5s stun (+0.2s per rank). Shields itself for 25% of max HP (+5% per rank).' },
  fireball: { rec: ['ap', 'ad'], txt: '320% Power in an area. Each rank widens the blast 12%.' },
  bladeDance: { rec: ['ad', 'ap'], txt: '200% Power per dash. Hits 4 foes, +1 per rank.' },
  arrowRain: { rec: ['ad', 'ap'], txt: '6 volleys of 70% Power, +2 volleys per rank.' },
  rampage: { rec: ['ad', 'def'], txt: 'Charges the farthest foe in reach (120 range, +10 per rank) for 220% Power (+25% per rank) to everything in the path, stuns them briefly, then +40% attack speed for 4s.' },
  whirlwind: { rec: ['ad', 'ap'], txt: 'Spins for 2s (+0.4s per rank), hitting for 60% Power four times a second.' },
  boneWall: { rec: ['def'], txt: 'Taunts foes in a wide circle for 3s (+0.5s per rank) and gains 60 armor (+20 per rank). Scales with rank, not Power.' },
  lilySplash: { rec: ['ap', 'def'], txt: 'Heals the 3 most hurt allies (+1 per rank) for 35% of their max HP (+5% per rank) × Ability power × signature power.' },
  pounce: { rec: ['ad', 'ap'], txt: '450% Power to the furthest foe (+50% per rank) and 120% Power around it.' },
  quake: { rec: ['ad', 'ap'], txt: '280% Power shockwave with knockback. Each rank makes it longer and taller.' },
  chainLightning: { rec: ['ap', 'ad'], txt: '230% Power that jumps to 6 foes, +1 per rank.' },
  dawnMend: { rec: ['ap'], txt: 'Heals every hero 30% of max HP (+4% per rank) × Ability power × signature power, and clears poison and stuns.' },
  cannonball: { rec: ['ad', 'ap'], txt: '380% Power blast that knocks foes back. Each rank widens it 12%.' },
  raiseDead: { rec: ['ap'], txt: 'Raises 2 thralls (+1 every 2 ranks). Thrall HP and attack scale with level and Ability power.' },
  tongueLash: { rec: ['ad', 'ap'], txt: '300% Power to the toughest foe in range, pulls it in and stuns 2s (+0.3s per rank).' },
  thunderRoar: { rec: ['def'], txt: 'Taunts foes in a wide circle for 2.5s and gives every hero +35% attack (+5% per rank) for 4s. Scales with rank, not Power.' },
  warDrums: { rec: ['ap'], txt: 'Every hero gets +45% attack speed (+5% per rank) and heals 12% of max HP × Ability power × signature power.' },
  sunlance: { rec: ['ap', 'ad'], txt: '420% Power to every foe in a line. Each rank widens the beam.' },
  earthsplitter: { rec: ['ad', 'ap'], txt: '500% Power slam with a 1s stun. Each rank widens it 12%.' },
  deathMark: { rec: ['ad', 'ap'], txt: 'Marks the 4 toughest foes (+1 per rank). Each mark bursts for 600% Power after 1.5s.' },
  greatFlood: { rec: ['ap', 'ad'], txt: 'A wave across the whole field for 260% Power (+30% per rank) with knockback.' },
  runicAegis: { rec: ['ap', 'def'], txt: 'Taunts foes in a wide circle for 2.5s. Shields every hero for 40% of their max HP (+5% per rank) × Ability power × signature power.' },
  bloom: { rec: ['ap'], txt: 'Revives the best fallen hero at 60% HP, then heals everyone 25% of max HP (+4% per rank) × Ability power × signature power.' },
  stampede: { rec: ['ap', 'ad'], txt: '4 spirit beasts (+1 per rank), each hitting for 350% Power.' },
  aegisDome: { rec: ['ap', 'def'], txt: 'Taunts foes in a wide circle for 2.5s. Shields everyone for 35% of max HP (+4% per rank) × Ability power × signature power, and blasts nearby foes for 150% Power with a stun.' },
  bloodFrenzy: { rec: ['ad'], txt: 'Heals 30% of max HP, then +100% attack speed (+10% per rank) and +50% attack for 5s. Scales with Attack, not Ability power.' },
  hawkStrike: { rec: ['ad', 'ap'], txt: '320% Power to a whole lane. Foes hit take 20% more damage for 5s.' },
  meteor: { rec: ['ap', 'ad'], txt: '600% Power after a short warning, with a stun. Each rank widens it.' },
  massRez: { rec: ['ap'], txt: 'Revives every fallen hero at 40% HP (+5% per rank) and heals everyone 20% of max HP × Ability power × signature power.' },
  shadowClones: { rec: ['ap'], txt: 'Two shadow copies at 60% thrall strength (+8% per rank). They scale with level and Ability power.' },
};
const EL_SCALE = {
  dark: 'Lifesteal 18% × element power.', light: 'Crit +15% × element power. Signature heals 10% max HP × element power.', lightning: 'Attack speed +30% × element power. Arcs hit for 60% attack × element power.',
  fire: 'Burns for 25% attack per second × element power. Signatures +25% × element power.', water: 'Soaked foes take +15% damage.', ice: 'Freeze lasts 0.8s × element power (shorter on bosses).',
  nature: 'HP +30%, thorns 20% and regeneration, all × element power.', void: 'Armor shred 3 per hit × element power, up to 30.', salty: 'Flat +20% crit, crits hit 2×. Each hit taken adds 2% damage, up to 25 stacks.',
  sweet: 'Sticky slow on hit.', meat: 'HP +45% and +20 armor × element power.', treat: 'Kills drop +40% gold and snacks that heal 5% max HP.',
};
const statLine = st => `<span class="tstat st-${st}">${STYLE_NAME[st]}</span>`;
function clsTipHTML(c) {
  const C = CLASSES[c], R = CLASS_REC[c]; if (!C) return '';
  const heroes = HEROES.filter(d => d.cls === c);
  return `<b>${C.icon} ${esc(C.name)}</b><p>${esc(CLASS_ROLE[c] || '')}</p><div class="trec">Best stats: ${R.stats.map(statLine).join(' then ')}</div><p class="note">${esc(R.why)}</p>
    <div class="tsub">Signatures</div>${heroes.map(d => `<div class="tab"><b>${esc(d.aName)}</b> <small>${esc(d.name)}</small><span>${esc(ABILITY_SCALE[d.ability] ? ABILITY_SCALE[d.ability].txt : d.aDesc)}</span></div>`).join('')}
    <p class="note">Power = Attack × Ability power × signature power. Signature power starts at level ${SIG_LEVEL} and grows 7% a level. Ranks come at levels 8, 12, 16 and 20.</p>`;
}
function abilityTipHTML(ab) {
  const A = ABILITY_SCALE[ab]; if (!A) return '';
  const d = HEROES.find(x => x.ability === ab), nm = d ? d.aName : Object.values(SPECS).map(s => s.b).find(b => b.ability === ab)?.name || ab;
  return `<b>${esc(nm)}</b><div class="trec">Scales with: ${A.rec.map(statLine).join(' and ')}</div><p>${esc(A.txt)}</p><p class="note">Power = Attack × Ability power × signature power (grows 7% a level from level ${SIG_LEVEL}). Ranks at levels 8, 12, 16 and 20.</p>`;
}
function elTipHTML(e) {
  const E = ELEMENTS[e]; if (!E) return '';
  const base = { ad: '+20% attack', ap: '+25% Ability power', def: '+20% HP and +15 armor' }[E.style];
  return `<b style="color:${E.col}">${esc(E.name)}</b><p>${esc(E.desc)}</p><div class="trec">Best stat: ${statLine(E.style)}</div>
    <p>Element power is 60% plus 8% per point of the hero's ${esc(STAT_NAME[E.style])} roll (a 10 roll gives 140%). Two or more ${esc(E.name)} heroes on the field multiply it by 1.4.</p>
    <p>Every ${esc(E.name)} hero gets ${base} × element power. ${esc(EL_SCALE[e] || '')}</p>`;
}
function tierTipHTML(t) {
  const why = ['', 'Common champions have standard base stats. Your first champion is always Common.',
    'This champion is Rare: 40% more base HP and attack than a Common one, plus 5 armor. Rare champions show up in drafts from your second champion on.',
    'This champion is Epic: 95% more base HP and attack than a Common one, plus 10 armor. Epic champions only show up in drafts after siege 6.'][t];
  return `<b>${NAMES_TIER[t]}</b><p>${why}</p><p class="note">Rarity only changes base stats. Rolls, items and elements stack on top.</p>`;
}
function statTipHTML(st) {
  const t = { ad: 'Attack damage powers basic hits and every Power-based signature.', ap: 'Ability power multiplies signature damage, heals and shields, and summon strength.', def: 'Defense adds HP and armor so the hero survives longer.' }[st];
  return `<b>${STYLE_NAME[st]}</b><p>${t}</p>`;
}

function synTipHTML(k) {
  const run = G.run, isRace = !!RACES[k], D = RACES[k] || CLASSES[k]; if (!D) return '';
  const { race, cls } = synergyCounts(run), n = (isRace ? race : cls)[k] || 0, t = activeSynergies(run)[k];
  const who = placedHeroes(run).filter(h => (isRace ? HERO_BY_ID[h.id].race : HERO_BY_ID[h.id].cls) === k).map(h => esc(heroDisplayName(h).split(' ')[0]));
  const tiers = D.at.map((v, i) => `<div class="ttier ${t === i ? 'on' : n >= v ? 'past' : ''}"><b>${v}</b><span>${esc(D.desc(i).replace(/^[^:]+: /, ''))}</span></div>`).join('');
  return `<b style="color:${isRace ? D.color : 'var(--sky)'}">${isRace ? '' : D.icon + ' '}${esc(D.name)} <small class="note">${esc((D.desc(0).match(/^([^:]+):/) || [])[1] || '')}</small></b>${tiers}<p class="note">${n} placed${who.length ? ': ' + who.join(', ') : ''}.</p>`;
}
function comboTipHTML(key) {
  const C = COMBOS[key]; if (!C) return ''; const [a, b] = key.split('+'), on = activeCombos(G.run).some(c => c.key === key);
  return `<b><span style="color:${ELEMENTS[a].col}">${ELEMENTS[a].name}</span> + <span style="color:${ELEMENTS[b].col}">${ELEMENTS[b].name}</span>: ${esc(C[0])}</b><p>${esc(C[2])}</p><p class="note">${on ? 'On. Fires during sieges.' : 'Off. Click between sieges to switch it on.'}</p>`;
}
