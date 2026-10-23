// ===== Hover tips: classes, elements, abilities, rarity =====
// Signatures scale with AD, AP and HP (SIG_SCALE in data.js) times signature power (grows 7% a level from level 5)
const CLASS_REC = {
  guardian: { stats: ['def', 'ap'], why: 'HP and armor keep a Guardian standing at the front, and their slams and shields scale with max HP. Ability power adds to their shields.' },
  berserker: { stats: ['ad', 'ap'], why: 'Attack damage drives every swing and most of their signature damage. Max HP adds a little to their slams.' },
  rogue: { stats: ['ad', 'ap'], why: 'Rogues live on fast, heavy hits. Their dashes and marks scale mostly with Attack damage, with some Ability power.' },
  ranger: { stats: ['ad', 'ap'], why: 'Attack damage powers every arrow, including Volley extras, and most of their signature. Ability power adds a little.' },
  mage: { stats: ['ap', 'ad'], why: 'Mage damage comes from signatures, which scale mostly with Ability power. Ability power also feeds their summons.' },
  cleric: { stats: ['ap', 'def'], why: 'Every heal scales with Ability power plus a share of the target\'s max HP. Defense keeps the healer alive.' },
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
    <div class="tsub">Signatures</div>${heroes.map(d => `<div class="tab"><b>${esc(d.aName)}</b> <small>${esc(d.name)}</small><span>${abilityText(d.ability, d.aDesc, null)}</span></div>`).join('')}
    <p class="note">Signature numbers scale with AD, AP and HP, times signature power. Signature power starts at level ${SIG_LEVEL} and grows 7% a level. Ranks come at levels 8, 12, 16 and 20, and rarer legends get extra ranks.</p>`;
}
function abilityTipHTML(ab) {
  const d = HEROES.find(x => x.ability === ab), alt = Object.values(SPECS).map(s => s.b).find(b => b.ability === ab), nm = d ? d.aName : alt ? alt.name : ab;
  const desc = d ? d.aDesc : SPEC_ADESC[ab] || '', lines = (SIG_SCALE[ab] || []).map(scaleParts).filter(Boolean);
  return `<b>${esc(nm)}</b>${lines.length ? `<div class="trec">Scales with: ${lines.join(' · ')}</div>` : ''}<p>${abilityText(ab, desc, null)}</p><p class="note">Items that add <span class="sc-ad">Attack damage</span>, <span class="sc-ap">Ability power</span> or <span class="sc-hp">HP</span> raise these numbers directly. Signature power grows 7% a level from level ${SIG_LEVEL}. Ranks at levels 8, 12, 16 and 20 add targets or area, and rarer legends get extra ranks.</p>`;
}
function elTipHTML(e) {
  const E = ELEMENTS[e]; if (!E) return '';
  const I = STYLE_INFO[e], base = { ad: '+10% attack', ap: '+12% Ability power', def: '+10% HP and +8 armor' }[E.style];
  return `<b style="color:${E.col}">${esc(E.name)}: ${esc(I.style)}</b><p><i>${esc(I.role)}.</i> ${esc(I.how)}</p>${I.tiers.map((t, i) => `<div class="ttier"><b>${EL_STACK.at[i]}</b><span>${esc(t)}${i === 2 ? ` The ${esc(E.name)} castle wakes.` : ''}</span></div>`).join('')}
    <p class="note">Every ${esc(E.name)} champion also gets ${base}. Best stat: ${statLine(E.style)}</p>`;
}
function rarityTipHTML(r) {
  const Rr = RARITY[r]; if (!Rr) return '';
  const opens = r === 0 ? 'Always in the draft.' : `Shows up in drafts once you have beaten ${r} boss${r > 1 ? 'es' : ''}.`;
  return `<b style="color:${Rr.col}">${Rr.name}</b><p>${r ? `+${Math.round(RARITY_STEP * 100 * r)}% HP, attack and ability power over a Common legend of the same level, and ${Math.round((raritySize(r) - 1) * 100)}% bigger.` : 'Standard power for its level.'}</p>${RARITY_PERKS[r] ? `<p>${esc(RARITY_PERKS[r])}</p>` : ''}<p class="note">${opens} Every legend starts at level 1.</p>`;
}
function statTipHTML(st) {
  const t = { ad: 'Attack damage powers basic hits and the AD share of every signature. Swords raise it.', ap: 'Ability power drives the AP share of signatures, heals, shields and summons. Rods raise it.', def: 'Max HP keeps a legend alive, and some signatures (slams, shields) scale with it. Belts raise HP, vests add armor.' }[st];
  return `<b>${st === 'def' ? 'Health' : STYLE_NAME[st]}</b><p>${t}</p><p class="note">Level and rarity raise all three. Each rarity step is +25%.</p>`;
}

function synTipHTML(k) {
  const run = G.run, isRace = !!RACES[k], D = RACES[k] || CLASSES[k]; if (!D) return '';
  const { race, cls } = synergyCounts(run), n = (isRace ? race : cls)[k] || 0, t = activeSynergies(run)[k];
  const who = placedHeroes(run).filter(h => (isRace ? HERO_BY_ID[h.id].race : HERO_BY_ID[h.id].cls) === k).map(h => esc(heroDisplayName(h).split(' ')[0]));
  const tiers = D.at.map((v, i) => `<div class="ttier ${t === i ? 'on' : n >= v ? 'past' : ''}"><b>${v}</b><span>${esc(D.desc(i).replace(/^[^:]+: /, ''))}</span></div>`).join('');
  return `<b style="color:${isRace ? D.color : 'var(--sky)'}">${isRace ? '' : D.icon + ' '}${esc(D.name)} <small class="note">${esc((D.desc(0).match(/^([^:]+):/) || [])[1] || '')}</small></b>${tiers}<p class="note">${n} placed${who.length ? ': ' + who.join(', ') : ''}.</p>`;
}
function comboTipHTML(key) {
  const c = possibleCombos(G.run).find(c => c.key === key); if (!c) return ''; const [a, b] = key.split('+'), act = activeCombos(G.run).find(x => x.key === key);
  const st = c.unpicked ? 'New pair. Click between sieges to choose what it becomes.' : act ? (act.slot === 'castle' ? 'On, in the castle slot. Fires during sieges.' : 'On. Fires during sieges.') : c.castle ? 'Off. Click between sieges to put it in the castle slot.' : 'Off. Click between sieges to switch it on.';
  return `<b><span style="color:${ELEMENTS[a].col}">${ELEMENTS[a].name}</span> + <span style="color:${ELEMENTS[b].col}">${ELEMENTS[b].name}</span>: ${esc(c.name)}</b><p>${esc(c.desc)}</p><p class="note">${st}</p>`;
}
