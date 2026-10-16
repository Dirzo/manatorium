// ===== Manatorium game data =====
const W = 480, H = 270;
const CASTLE_X = 92;              // front face of the castle wall
const GRID = { x: 104, y: 112, cell: 22, cols: 10, rows: 7, courtCols: 4 };
const RAFTER_Y = 66;
const RAFTER_XS = [16, 34, 52, 70, 86];
// Element sprites retain their own proportions and existing architectural decks.
const CASTLE_SHAPES = {
  fire: { aspect: 961 / 1350, width: 108, slots: [[.49,.40],[.64,.40],[.79,.40]] },
  water: { aspect: 918 / 1266, width: 100, slots: [[.43,.49],[.57,.49],[.71,.49]] },
  nature: { aspect: 1021 / 1315, width: 104, slots: [[.23,.38],[.37,.38],[.80,.51]] },
  ice: { aspect: 992 / 1482, width: 104, slots: [[.34,.61],[.53,.61],[.72,.61]] },
  lightning: { aspect: 1213 / 1235, width: 104, slots: [[.28,.66],[.47,.66],[.66,.66]] },
  dark: { aspect: 1172 / 1290, width: 104, slots: [[.24,.61],[.43,.62],[.66,.62]] },
  light: { aspect: 1006 / 1512, width: 104, slots: [[.48,.43],[.64,.43],[.79,.43]] },
  void: { aspect: 718 / 1142, width: 104, slots: [[.22,.66],[.42,.66],[.75,.51]] },
  salty: { aspect: 1023 / 1484, width: 104, slots: [[.32,.59],[.51,.59],[.70,.59]] },
  sweet: { aspect: 1184 / 1259, width: 104, slots: [[.14,.43],[.47,.59],[.88,.53]] },
  meat: { aspect: 941 / 1492, width: 104, slots: [[.25,.34],[.51,.42],[.76,.43]] },
  treat: { aspect: 1148 / 1243, width: 104, slots: [[.26,.61],[.46,.61],[.66,.61]] }
};
function castleShape(run) {
  const spec = CASTLE_SHAPES[run.castleEl]; if (!spec) return null;
  const tier = Math.min(10, run.stats && run.stats.bosses ? run.stats.bosses.length : 0);
  const width = Math.round(spec.width - (10 - tier) * .6), height = Math.round(width / spec.aspect);
  // Short keeps share the visual center of the castle area, instead of sinking
  // into its bottom corner. Larger keeps retain their established ground line.
  const x = Math.round((110 - width) / 2);
  const y = Math.min(236 - height, Math.round(174 - height / 2));
  return { x, y, width, height, baseY: y + height, slots: spec.slots };
}
function rafterPosition(run, i) {
  const shape = castleShape(run);
  if (!shape) return { x: RAFTER_XS[i], y: RAFTER_Y };
  const slot = shape.slots[Math.min(i, shape.slots.length - 1)];
  return { x: Math.round(shape.x + shape.width * slot[0]), y: Math.round(shape.y + shape.height * slot[1]) };
}
function castleRafterY(run) {
  // Attackers reach the lowest unlocked deck, including staggered balconies.
  return Math.max(...Array.from({length:Math.max(1,rafterSlots(run))},(_,i)=>rafterPosition(run,i).y));
}

const RACES = {
  human:    { name: 'Human',    color: '#ffd166', desc: n => `Valor: Humans gain +${[15, 30][n]}% HP and attack.`, at: [2, 3] },
  elf:      { name: 'Elf',      color: '#7cf0b0', desc: n => `Grace: Elves gain +${[25, 55][n]}% attack speed.`, at: [2, 3] },
  dwarf:    { name: 'Dwarf',    color: '#ffa25e', desc: n => `Stonehide: Dwarves gain +${[25, 55][n]} armor.`, at: [2, 3] },
  orc:      { name: 'Orc',      color: '#9be05a', desc: n => `Bloodlust: Orcs heal ${[15, 30][n]}% of damage dealt and hit +${[10, 25][n]}% harder.`, at: [2, 3] },
  skeleton: { name: 'Skeleton', color: '#e9e4ff', desc: n => n ? 'Undying: every Skeleton rises once at 50% HP.' : 'Undying: the first Skeleton to fall rises at 50% HP.', at: [2, 3] },
  beast:    { name: 'Beastfolk',color: '#ff9fd0', desc: n => `Feral: Beastfolk gain +${[25, 50][n]}% crit chance and +20% speed.`, at: [2, 3] },
  toad:     { name: 'Toadfolk', color: '#5fd3ff', desc: n => `Bog Venom: every hero's attacks poison for ${[4, 10][n]} damage per second.`, at: [2, 3] },
};
const CLASSES = {
  guardian:  { name: 'Guardian',  icon: '⛨', desc: n => `Bulwark: all heroes start each siege with a ${[12, 25][n]}% HP shield, refreshed every 12s.`, at: [2, 3] },
  berserker: { name: 'Berserker', icon: '⚔', desc: n => `Frenzy: Berserkers gain +4% attack speed per hit, up to ${[10, 20][n]} stacks.`, at: [2, 3] },
  ranger:    { name: 'Ranger',    icon: '➶', desc: n => `Volley: Ranger attacks hit ${[1, 2][n]} extra target${n ? 's' : ''}.`, at: [2, 3] },
  mage:      { name: 'Mage',      icon: '✦', desc: n => `Arcana: Mage abilities deal +${[30, 75][n]}% and Mages start with ${[30, 50][n]}% mana.`, at: [2, 3] },
  cleric:    { name: 'Cleric',    icon: '✚', desc: n => `Sanctuary: all heroes regenerate ${[1, 2.5][n]}% max HP per second.`, at: [2, 3] },
  rogue:     { name: 'Rogue',     icon: '◆', desc: n => `Ambush: Rogues dodge ${[20, 35][n]}% of attacks and their first strike deals +${[60, 150][n]}%.`, at: [2, 3] },
};

const CLASS_BASE = {
  guardian:  { hp: 560, atk: 25, as: 0.8, range: 15, spd: 26, armor: 35, mana: 90 },
  berserker: { hp: 420, atk: 34, as: 1.0, range: 15, spd: 32, armor: 15, mana: 80 },
  rogue:     { hp: 320, atk: 36, as: 1.15, range: 15, spd: 46, armor: 10, mana: 70 },
  ranger:    { hp: 270, atk: 29, as: 0.9, range: 118, spd: 26, armor: 5, mana: 80 },
  mage:      { hp: 260, atk: 25, as: 0.75, range: 104, spd: 24, armor: 5, mana: 70 },
  cleric:    { hp: 300, atk: 23, as: 0.8, range: 92, spd: 24, armor: 10, mana: 75 },
};
// base ability power per class (AP scales with level and rarity like attack does)
const CLASS_AP = { guardian: 16, berserker: 14, rogue: 16, ranger: 16, mage: 30, cleric: 28 };

// ===== Rarity (Cam 2026-10-15): no rolled stats. Every legend is rolled at a rarity when drafted.
// Each step is +25% power on top of level, a little bigger on the field, and a stronger signature.
const RARITY = [
  { key: 'common',    name: 'Common',    col: '#b9c2cc', col2: '#6f7a86' },
  { key: 'rare',      name: 'Rare',      col: '#5fb0ff', col2: '#2a5aa8' },
  { key: 'epic',      name: 'Epic',      col: '#b97bff', col2: '#5a2aa8' },
  { key: 'mythic',    name: 'Mythic',    col: '#ff5d8f', col2: '#8a1a4a' },
  { key: 'legendary', name: 'Legendary', col: '#ffb030', col2: '#a8601a' },
  { key: 'god',       name: 'God',       col: '#fff3a0', col2: '#ff7ad8' },
];
const RARITY_STEP = 0.25;
function rarityMul(r) { return 1 + RARITY_STEP * (r || 0); }
function raritySize(r) { return 1 + 0.06 * (r || 0); }
// what each rarity adds to a legend's signature, on top of +25% power per step
const RARITY_PERKS = [
  '',
  'Signature one rank higher: bigger area or more targets.',
  'Signature two ranks higher. Starts every siege with 35% mana.',
  'Signature three ranks higher, 35% mana at the start, and it echoes: a second cast at 50% power.',
  'Signature four ranks higher, echoes at 75% power, costs 25% less mana.',
  'Signature five ranks higher, echoes at full power, costs 25% less mana, and starts every siege ready to cast.',
];
// draft odds by bosses defeated, shaped like TFT shop odds by level: one new rarity opens per boss.
// After the first boss (siege 6 onward) a card is Rare 25% of the time.
const RARITY_ODDS = [
  [100, 0, 0, 0, 0, 0],
  [75, 25, 0, 0, 0, 0],
  [55, 30, 15, 0, 0, 0],
  [45, 33, 20, 2, 0, 0],
  [30, 40, 25, 4, 1, 0],
  [19, 30, 35, 12, 3, 1],
  [15, 25, 32, 20, 6, 2],
  [10, 20, 28, 28, 11, 3],
  [5, 12, 22, 35, 20, 6],
  [1, 5, 15, 40, 28, 11],
];
function rarityOdds(bosses) { return RARITY_ODDS[Math.max(0, Math.min(RARITY_ODDS.length - 1, bosses || 0))]; }
function rollRarity(bosses) { const o = rarityOdds(bosses); let x = Math.random() * 100; for (let i = 0; i < o.length; i++) { x -= o[i]; if (x < 0) return i; } return 0; }
const START_LEGENDS = 2;

// Sprite palettes
const SK = { pale: '#ffd9b8', tan: '#e8a874', brown: '#a86a45', orc: '#6fcf4a', orc2: '#a7d94a', bone: '#f1ecdc', toad: '#56c46a', toad2: '#ff8f3a', fur: '#c98a4a', fur2: '#e8e1d0', gob: '#8fd14f', blue: '#7fb4ff' };

const HEROES = [
  // tier 1
  { id: 'brann', name: 'Brann Ironward', race: 'human', cls: 'guardian', tier: 1, ability: 'shieldBash', aName: 'Bulwark Comet', aDesc: 'Taunts every foe in a wide circle and hurls a giant shield of light onto the biggest crowd for {0}, stunning them for 1.5s. Brann gains a shield of {1}.',
    spr: { head: 'human', skin: SK.pale, hair: '#8a4b2a', hat: 'helm', armor: '#b9c6e8', armor2: '#6c7fb8', cloth: '#3f6ae0', weapon: 'shield', metal: '#e8eefc', cape: '#e8434d' } },
  { id: 'iria', name: 'Iria Cinderveil', race: 'human', cls: 'mage', tier: 1, ability: 'cinderColossus', aName: 'Cinder Colossus', aDesc: 'Drops a Cinder Colossus onto the biggest crowd for {0}. It stays for 5s, stomping every foe near it for {1} and lumbering after the horde.', proj: 'fire',
    spr: { head: 'human', skin: SK.pale, hair: '#ff6a3d', hairStyle: 'long', hat: 'wizard', armor: '#e2384f', armor2: '#9b1f43', cloth: '#ffcf3a', weapon: 'staff', gem: '#ff8a3d' } },
  { id: 'vale', name: 'Vale Quickthorn', race: 'elf', cls: 'rogue', tier: 1, ability: 'bladeDance', aName: 'Emerald Waltz', aDesc: 'Dashes through up to 4 enemies, striking each for {0}. Every cut leaves a leaf-blade that bursts a moment later for {1}.',
    spr: { head: 'elf', skin: SK.pale, hair: '#f6e27a', hat: 'hood', armor: '#3fae6a', armor2: '#23704a', cloth: '#2f9e5c', weapon: 'daggers', metal: '#dfe9ff' } },
  { id: 'thessa', name: 'Thessa Windleaf', race: 'elf', cls: 'ranger', tier: 1, ability: 'glacierLance', aName: 'Glacier Lance', aDesc: 'Looses a giant arrow of ice across the whole field. The first foe hit takes {0} and freezes for up to 3.5s, longer the farther it flew. Everything else in its path takes 60% and is slowed.', proj: 'arrow',
    spr: { head: 'elf', skin: SK.tan, hair: '#5fe0e8', hairStyle: 'long', hat: 'none', armor: '#7bd36a', armor2: '#3f8c4a', cloth: '#a2672f', weapon: 'bow' } },
  { id: 'grukk', name: 'Grukk Tuskbreaker', race: 'orc', cls: 'berserker', tier: 1, ability: 'whirlwind', aName: 'Tusk Cyclone', aDesc: 'Hurls a roaring cyclone down the lane. It drags foes into its eye and hits everything inside 10 times for {0}.',
    spr: { head: 'orc', skin: SK.orc, hair: '#2b2b2b', hairStyle: 'mohawk', hat: 'none', armor: '#9a6a3e', armor2: '#5d3b22', cloth: '#d84b3a', weapon: 'greataxe', metal: '#d8dde8' } },
  { id: 'rattle', name: 'Rattlebones', race: 'skeleton', cls: 'guardian', tier: 1, ability: 'cryptGrasp', aName: 'Grasp of the Crypt', aDesc: 'Taunts every foe in a wide circle, then grave hands burst up under the biggest crowd, dealing {0} and binding every foe there for 1.5s.',
    spr: { head: 'skeleton', skin: SK.bone, hat: 'horns', hornCol: '#7a6ae0', armor: '#7a6ae0', armor2: '#4b3fa0', cloth: '#4b3fa0', weapon: 'shield', metal: '#f1ecdc' } },
  { id: 'pip', name: 'Pip Puddlefoot', race: 'toad', cls: 'cleric', tier: 1, ability: 'lotusSanctuary', aName: 'Lotus Sanctuary', aDesc: 'A great lotus blooms under your heroes for 4s. Allies inside heal {0} every half second and take 25% less damage, then it bursts to heal {1}.', proj: 'heal',
    spr: { head: 'toad', skin: SK.toad, belly: '#d9f59b', hat: 'none', armor: '#ffd84a', armor2: '#d99a1f', cloth: '#ff7aa8', weapon: 'staff', gem: '#7cf0ff' } },
  { id: 'fenn', name: 'Fenn Burrowpaw', race: 'beast', cls: 'rogue', tier: 1, ability: 'pounce', aName: 'Moonfall Pounce', aDesc: 'Leaps up to the moon and crashes down on the farthest enemy in reach for {0}, cratering every foe nearby for {1} and stunning them.',
    spr: { head: 'beast', skin: SK.fur, snout: '#f3dcc0', hat: 'bandana', armor: '#5a4a8c', armor2: '#3a2f61', cloth: '#ff5d8f', weapon: 'daggers', metal: '#ffffff' } },
  // tier 2
  { id: 'rook', name: 'Rook Bellhammer', race: 'dwarf', cls: 'berserker', tier: 2, ability: 'quake', aName: 'Fault Line', aDesc: 'Splits the earth in a line ahead. Rock spires burst up one after another, dealing {0} to each foe and tossing them into the air.',
    spr: { head: 'dwarf', skin: SK.tan, hair: '#ff8f3a', hat: 'helm', armor: '#c9a35a', armor2: '#8a6a2a', cloth: '#3a64c9', weapon: 'hammer', metal: '#cfd6e6' } },
  { id: 'sera', name: 'Sera Stormglass', race: 'elf', cls: 'mage', tier: 2, ability: 'tempestCage', aName: 'Tempest Cage', aDesc: 'Cages the biggest crowd in lightning for 3s. Bolts strike foes inside for {1}, anyone touching the bars is stunned and thrown back, and it ends in a thunderclap for {0}.', proj: 'spark',
    spr: { head: 'elf', skin: SK.pale, hair: '#c7b7ff', hairStyle: 'long', hat: 'none', armor: '#4a5bd8', armor2: '#2c3592', cloth: '#7cf0ff', weapon: 'staff', gem: '#9ff6ff' } },
  { id: 'mara', name: 'Mara Dawnstitch', race: 'human', cls: 'cleric', tier: 2, ability: 'dawnMend', aName: 'Sunrise Choir', aDesc: 'A dawn sun rises over the field. Its rays heal every ally for {0}, clear poison and stuns, and scorch up to 8 foes for {1}.', proj: 'heal',
    spr: { head: 'human', skin: SK.brown, hair: '#2a1a12', hairStyle: 'bun', hat: 'none', armor: '#f4f1ff', armor2: '#b8b0e0', cloth: '#ffcf3a', weapon: 'staff', gem: '#ffe066' } },
  { id: 'hilda', name: 'Hilda Brassbeard', race: 'dwarf', cls: 'ranger', tier: 2, ability: 'rocketBarrage', aName: 'Rocket Barrage', aDesc: 'Fires a salvo of 6 rockets that carpet the enemy line, each exploding for {0} and knocking foes back.', proj: 'bullet',
    spr: { head: 'dwarf', skin: SK.pale, hair: '#ffd166', hat: 'none', hairStyle: 'bun', armor: '#4fae9c', armor2: '#2a6e64', cloth: '#7a4b2a', weapon: 'cannon', metal: '#5a5a6e' } },
  { id: 'morrow', name: 'Morrow the Hollow', race: 'skeleton', cls: 'mage', tier: 2, ability: 'raiseDead', aName: 'Hollow Legion', aDesc: 'Tears open a bone gate on the field. 2 hollow knights march out with {0} HP and {1} attack and fight until the siege ends.', proj: 'soul',
    spr: { head: 'skeleton', skin: SK.bone, hat: 'hood', armor: '#3b2a5c', armor2: '#24183a', cloth: '#6f4ad8', weapon: 'staff', gem: '#9dff6a' } },
  { id: 'bogs', name: 'Bogsworth', race: 'toad', cls: 'ranger', tier: 2, ability: 'tongueLash', aName: 'Mega Lash', aDesc: 'A tongue the length of the field whips through the enemy line for {1}, then snaps back with the toughest foe, stunning it for 2s and dealing {0}.', proj: 'spit',
    spr: { head: 'toad', skin: SK.toad2, belly: '#ffe3b0', hat: 'bandana', armor: '#3b8f5a', armor2: '#24603a', cloth: '#ffd84a', weapon: 'crossbow', metal: '#e6f0ff' } },
  { id: 'ursa', name: 'Ursa Mossback', race: 'beast', cls: 'guardian', tier: 2, ability: 'thunderRoar', aName: 'Primal Storm', aDesc: 'Taunts every foe in a wide circle and calls a thunderhead over your heroes. Allies gain {0} attack for 4s while lightning strikes nearby foes for {1}.',
    spr: { head: 'beast', skin: '#8a5a32', snout: '#d9b48a', hat: 'none', ears: 'round', armor: '#6aa84f', armor2: '#3f7030', cloth: '#ffd84a', weapon: 'shield', metal: '#d9c38a' } },
  { id: 'zogra', name: 'Zogra Drumhide', race: 'orc', cls: 'cleric', tier: 2, ability: 'warDrums', aName: 'Drums of the Warhost', aDesc: 'Giant spirit drums boom behind your line. Allies get +45% attack speed for 4s and heal {0}, and every beat rolls a shockwave down the field for {1}.', proj: 'heal',
    spr: { head: 'orc', skin: SK.orc2, hair: '#ffffff', hairStyle: 'long', hat: 'none', armor: '#c94a7a', armor2: '#7a2a4a', cloth: '#ffd84a', weapon: 'totem', gem: '#ff5d8f' } },
  // tier 3
  { id: 'aurelle', name: 'Queen Aurelle', race: 'human', cls: 'ranger', tier: 3, ability: 'sunlance', aName: 'Solar Judgement', aDesc: 'Gathers a sun at the bow, then fires a beam across the whole field for {0} to every enemy in the line. The line burns for {1} a second.', proj: 'arrowGold',
    spr: { head: 'human', skin: SK.pale, hair: '#ffcf3a', hairStyle: 'long', hat: 'crown', armor: '#ffffff', armor2: '#d0c8ff', cloth: '#ff5d8f', weapon: 'bow', cape: '#7a4ae0' } },
  { id: 'hrolf', name: 'Hrolf Wildmane', race: 'beast', cls: 'berserker', tier: 2, ability: 'rampage', aName: 'Wild Hunt', aDesc: 'Charges through the enemy line with a pack of spirit wolves. Everything in the way takes {0}, the wolves bite for {1}, and Hrolf fights 40% faster for 4s.',
    spr: { head: 'beast', skin: '#9a5a2a', snout: '#e8c49a', hat: 'horns', hornCol: '#f1ecdc', ears: 'round', armor: '#7a4a2a', armor2: '#4a2a1a', cloth: '#e8434d', weapon: 'axe', metal: '#d8dde8', cape: '#5a3a8c' } },
  { id: 'gorehorn', name: 'Gorehorn', race: 'orc', cls: 'berserker', tier: 3, ability: 'earthsplitter', aName: 'Doomhorn Drop', aDesc: 'Leaps into the sky and crashes into the biggest crowd for {0}, stunning for 1s. The ground splits into lava fissures that burn for {1} a second.',
    spr: { head: 'orc', skin: '#4faa3a', hair: '#1a1a1a', hat: 'horns', hornCol: '#f1ecdc', armor: '#3a3a4a', armor2: '#22222e', cloth: '#e8434d', weapon: 'flail', metal: '#ffcf3a', cape: '#e8434d' } },
  { id: 'vesper', name: 'Lady Vesperine', race: 'skeleton', cls: 'rogue', tier: 3, ability: 'deathMark', aName: 'Danse Macabre', aDesc: 'Marks 4 enemies with a phantom rose. After 1.5s a spectral scythe cuts each for {0}. From Epic up, foes it kills pass the mark on to the nearest enemy.',
    spr: { head: 'skeleton', skin: SK.bone, hat: 'crown', armor: '#2a1f3a', armor2: '#160f22', cloth: '#ff3d6e', weapon: 'daggers', metal: '#ff8ab0', cape: '#ff3d6e' } },
  { id: 'croak', name: 'Old Mother Croak', race: 'toad', cls: 'mage', tier: 3, ability: 'greatFlood', aName: 'Tsunami', aDesc: 'A towering wave rolls across the whole field for {0}, pushing every enemy back and slowing them.', proj: 'bubble',
    spr: { head: 'toad', skin: '#4a9e8f', belly: '#cfeedd', hat: 'wizard', armor: '#5a4ab0', armor2: '#352a7a', cloth: '#7cf0ff', weapon: 'staff', gem: '#5fd3ff' } },
  { id: 'thrain', name: 'Thrain Runeforge', race: 'dwarf', cls: 'guardian', tier: 3, ability: 'runicAegis', aName: 'Runeforge Citadel', aDesc: 'Taunts every foe in a wide circle as rune pillars slam down around your heroes. Every ally gets a shield of {0}, and foes under a pillar take {1}.',
    spr: { head: 'dwarf', skin: SK.brown, hair: '#e8e8f0', hat: 'helm', plume: '#5fd3ff', armor: '#5fd3ff', armor2: '#2a7ab0', cloth: '#ffcf3a', weapon: 'shield', metal: '#ffcf3a' } },
  { id: 'sylvaris', name: 'Sylvaris', race: 'elf', cls: 'cleric', tier: 3, ability: 'bloom', aName: 'World Blossom', aDesc: 'A great blossom tree sprouts among your heroes. It revives a fallen ally at 60% HP and heals everyone for {0}.', proj: 'heal',
    spr: { head: 'elf', skin: '#cfe9ff', hair: '#ff9fd0', hairStyle: 'long', hat: 'crown', armor: '#9be05a', armor2: '#5a9a2a', cloth: '#ff9fd0', weapon: 'staff', gem: '#ffffff' } },
  { id: 'kodo', name: 'Kodo Stormhorn', race: 'beast', cls: 'mage', tier: 3, ability: 'stampede', aName: 'Spirit Stampede', aDesc: 'A storm breaks and spirit beasts thunder across the field, dealing {0} to everything they trample.', proj: 'spark',
    spr: { head: 'beast', skin: '#6a6a8a', snout: '#c8c8e0', hat: 'horns', hornCol: '#ffe9b0', armor: '#2f4fb8', armor2: '#1f3080', cloth: '#ffd84a', weapon: 'totem', gem: '#7cf0ff' } },
  // ----- expansion (Cam 2026-10-15): 24 more legends. fixed: always rolls that rarity (4 Legendary, 5 God) -----
  { id: 'ottoline', name: 'Dame Ottoline', race: 'human', cls: 'guardian', tier: 2, ability: 'bellToll', aName: 'Bell of the Last Stand', aDesc: 'Taunts every foe in a wide circle and drops a giant bronze bell on the biggest crowd for {0}. It tolls 3 times, each toll stunning foes nearby for 0.6s and dealing {1}.',
    spr: { head: 'human', skin: SK.tan, hair: '#c94a2a', hairStyle: 'bun', hat: 'helm', plume: '#ffd84a', armor: '#d9a74a', armor2: '#8a5a2a', cloth: '#7a2a3a', weapon: 'shield', metal: '#ffe08a', cape: '#7a2a3a' } },
  { id: 'gravelgut', name: 'Gravelgut', race: 'orc', cls: 'guardian', tier: 2, ability: 'mountainRoll', aName: "Mountain's Roll", aDesc: 'Taunts every foe in a wide circle and rolls a boulder the size of a hill down the lane, crushing everything in its path for {0}, knocking it back and stunning it.',
    spr: { head: 'orc', skin: '#7fa04a', hair: '#3a2a1a', hat: 'helm', armor: '#8a8a9a', armor2: '#4a4a5a', cloth: '#c98a3a', weapon: 'shield', metal: '#c9b48a' } },
  { id: 'grom', name: 'Shellback Grom', race: 'toad', cls: 'guardian', tier: 2, ability: 'coralBastion', aName: 'Coral Bastion', aDesc: 'Taunts every foe in a wide circle and raises a wall of coral and seawater across the field for 4s. Foes that touch it are shoved back, slowed and take {0}.',
    spr: { head: 'toad', skin: '#3fae9c', belly: '#e0f6c0', hat: 'helm', armor: '#ff8a7a', armor2: '#c04a5a', cloth: '#5fd3ff', weapon: 'shield', metal: '#ffb0a0' } },
  { id: 'morgrave', name: 'Morgrave the Bulwark', race: 'skeleton', cls: 'guardian', tier: 3, fixed: 4, ability: 'tombOfKings', aName: 'Tomb of Kings', aDesc: 'Taunts every foe in a wide circle and slams a royal sarcophagus onto the biggest crowd for {0}, stunning them for 2s. Ghost kings rise from it and shield every ally for {1}.',
    spr: { head: 'skeleton', skin: SK.bone, eye: '#5fd3ff', hat: 'crown', armor: '#3a4a6a', armor2: '#1a2a3a', cloth: '#5fd3ff', weapon: 'shield', metal: '#ffcf3a', cape: '#2a5aa8', wings: '#8ad0ff' } },
  { id: 'fizzwick', name: 'Fizzwick Gearspark', race: 'dwarf', cls: 'mage', tier: 3, fixed: 4, ability: 'clockworkMoon', aName: 'Clockwork Moon', aDesc: 'Lowers a clockwork moon over the field. Its great eye sweeps a beam across the enemy ranks, burning everything it touches for {0} every half second.',
    spr: { head: 'dwarf', skin: SK.pale, hair: '#c8c8d8', hat: 'tricorn', armor: '#c9883a', armor2: '#7a4a1a', cloth: '#5fd3ff', weapon: 'orb', gem: '#ffd84a', cape: '#3a64c9' } },
  { id: 'nyx', name: 'Nyx Hollowstar', race: 'elf', cls: 'mage', tier: 3, fixed: 5, ability: 'starfall', aName: 'Starfall Requiem', aDesc: 'Night falls. For 3s stars rain on the enemy side, each dealing {0} where it lands, then the sky collapses into a supernova that hits every foe for {1}.',
    spr: { head: 'elf', skin: '#d8d0ff', hair: '#ffffff', hairStyle: 'long', hat: 'none', armor: '#2a2a6a', armor2: '#14143a', cloth: '#b8a8ff', weapon: 'orb', gem: '#fff3a0', cape: '#4a2a8a', halo: '#fff3a0', wings: '#b8a8ff' } },
  { id: 'grizelda', name: 'Granny Grizelda', race: 'orc', cls: 'mage', tier: 2, ability: 'cauldron', aName: 'Cauldron Catastrophe', aDesc: 'Drops a bubbling cauldron on the biggest crowd for {0}. It boils over into a toxic bog that deals {1} every half second and slows foes.',
    spr: { head: 'orc', skin: '#8fb85a', hair: '#e8e8f0', hairStyle: 'long', hat: 'wizard', armor: '#5a3a7a', armor2: '#3a2050', cloth: '#7ad43a', weapon: 'staff', gem: '#c8ff6a' } },
  { id: 'snick', name: 'Snick Ratchetknife', race: 'dwarf', cls: 'rogue', tier: 1, ability: 'sawblades', aName: 'Sawblade Spree', aDesc: 'Flings 3 giant sawblades that ricochet between enemies, each cutting for {0} on every hit.',
    spr: { head: 'dwarf', skin: SK.tan, hair: '#2a2a2a', hat: 'bandana', armor: '#5a5a6e', armor2: '#3a3a4a', cloth: '#ff8a3a', weapon: 'daggers', metal: '#e8eefc' } },
  { id: 'whisper', name: 'Whisper', race: 'skeleton', cls: 'rogue', tier: 2, ability: 'guillotine', aName: 'Guillotine Rain', aDesc: 'Giant blades fall on the 4 weakest enemies for {0}. Any foe left under 15% HP is executed.',
    spr: { head: 'skeleton', skin: SK.bone, eye: '#ff3d3d', hat: 'hood', armor: '#2a2a3a', armor2: '#14141e', cloth: '#5a5a7a', weapon: 'daggers', metal: '#d8dde8' } },
  { id: 'tibbs', name: 'Tibbs Lightpaw', race: 'beast', cls: 'rogue', tier: 1, ability: 'alleyAmbush', aName: 'Alley Ambush', aDesc: 'Shadow cats leap from every side onto the toughest enemy in reach, each clawing for {0}. If it falls, the cats pick the next foe.',
    spr: { head: 'beast', skin: '#4a4a5a', snout: '#e8e8f0', hat: 'none', armor: '#7a4ab0', armor2: '#4a2a7a', cloth: '#ffd84a', weapon: 'daggers', metal: '#ffffff', eye: '#ffd84a' } },
  { id: 'veyra', name: 'Veyra Nightbloom', race: 'elf', cls: 'rogue', tier: 3, fixed: 4, ability: 'eclipse', aName: 'Eclipse', aDesc: 'The sun goes dark. Veyra marks up to 8 enemies, then crescent blades cut each for {0}. Marked foes take 20% more damage for 4s.',
    spr: { head: 'elf', skin: '#e8d8ff', hair: '#2a1a4a', hairStyle: 'long', hat: 'hood', armor: '#3a1a5a', armor2: '#1a0a2a', cloth: '#ff5d8f', weapon: 'daggers', metal: '#c8b8ff', cape: '#ff5d8f', wings: '#5a3a8a' } },
  { id: 'murk', name: 'Murk the Smiling', race: 'toad', cls: 'rogue', tier: 2, ability: 'bogJaws', aName: 'Bog Jaws', aDesc: 'Giant jaws of mud burst up under the toughest enemy in reach and chomp it 3 times for {0}, splashing foes beside it.',
    spr: { head: 'toad', skin: '#6a7a3a', belly: '#c8d08a', hat: 'hood', armor: '#4a3a2a', armor2: '#2a1a0a', cloth: '#9a7a4a', weapon: 'daggers', metal: '#c8d0a0' } },
  { id: 'pell', name: 'Pell Featherwind', race: 'human', cls: 'ranger', tier: 1, ability: 'skyhawks', aName: 'Skyhawk Squadron', aDesc: 'A squadron of hawks dives on the front of the enemy line one after another, each hitting for {0} and blinding foes so their attacks can miss.',
    spr: { head: 'human', skin: SK.pale, hair: '#e8b84a', hat: 'tricorn', armor: '#5a8ad8', armor2: '#2a4a8a', cloth: '#ffffff', weapon: 'bow', cape: '#ffd84a' } },
  { id: 'kragg', name: 'Kragg Bonebow', race: 'orc', cls: 'ranger', tier: 2, ability: 'ballista', aName: 'Ballista of Ruin', aDesc: 'Fires a ballista bolt through the whole line for {0}, pinning the first foe in place for 2s. The bolt explodes at the end for {1}.',
    spr: { head: 'orc', skin: '#5aa04a', hair: '#1a1a1a', hairStyle: 'mohawk', hat: 'none', armor: '#e8e0c8', armor2: '#a89878', cloth: '#7a2a2a', weapon: 'bow' } },
  { id: 'lirien', name: 'Lirien Dawnstring', race: 'elf', cls: 'ranger', tier: 3, fixed: 5, ability: 'arrowOfDawn', aName: 'Arrow of Dawn', aDesc: 'Looses one arrow into the sky. It bursts into 20 shards of light over the enemy side, each dealing {0}, and the sunrise heals every ally for {1}.',
    spr: { head: 'elf', skin: SK.pale, hair: '#ffe066', hairStyle: 'long', hat: 'crown', armor: '#ffffff', armor2: '#ffd84a', cloth: '#ff9a4a', weapon: 'bow', cape: '#ffd84a', halo: '#ffffff', wings: '#fff3c0' } },
  { id: 'ribbsby', name: 'Sir Ribbsby', race: 'toad', cls: 'ranger', tier: 1, ability: 'lilyBombs', aName: 'Lily Bombardment', aDesc: 'Lobs 5 giant lily bombs that bounce 3 times along the enemy line, exploding for {0} with every bounce.',
    spr: { head: 'toad', skin: '#7ad46a', belly: '#f0ffd0', hat: 'tricorn', armor: '#ff7aa8', armor2: '#c04a7a', cloth: '#ffffff', weapon: 'crossbow', metal: '#3a8a5a' } },
  { id: 'brakka', name: 'Brakka Skullsplitter', race: 'orc', cls: 'berserker', tier: 1, ability: 'bloodMoon', aName: 'Blood Moon', aDesc: 'A blood moon rises as Brakka leaps into the biggest crowd for {0}. The ground there bleeds for 4s: foes take {1} a second and Brakka heals for half of it.',
    spr: { head: 'orc', skin: '#6aaa3a', hair: '#c02a2a', hairStyle: 'mohawk', hat: 'none', armor: '#5a2a2a', armor2: '#3a1a1a', cloth: '#ff3d3d', weapon: 'cleaver', metal: '#f1ecdc' } },
  { id: 'haldor', name: 'Haldor Ironbelly', race: 'dwarf', cls: 'berserker', tier: 2, ability: 'anvilDrop', aName: 'Anvil of the Mountain King', aDesc: 'Calls down an anvil the size of a house on the biggest crowd for {0}, stunning for 1.2s. Sparks burst out and hit nearby foes for {1}.',
    spr: { head: 'dwarf', skin: SK.brown, hair: '#ff6a2a', hat: 'horns', hornCol: '#e8e8f0', armor: '#4a4a5a', armor2: '#2a2a3a', cloth: '#ff8a2a', weapon: 'maul', metal: '#ffcf3a' } },
  { id: 'bjorna', name: 'Bjorna Frostmaw', race: 'beast', cls: 'berserker', tier: 3, fixed: 4, ability: 'avalanche', aName: 'Avalanche Charge', aDesc: 'A giant spirit bear of ice charges the whole length of the field. Everything in the way takes {0}, is frozen for 1.5s and knocked back. Bjorna fights 50% faster for 4s.',
    spr: { head: 'beast', skin: '#e8eef8', snout: '#ffffff', ears: 'round', hat: 'none', armor: '#5fa8d8', armor2: '#2a5a8a', cloth: '#ffffff', weapon: 'greataxe', metal: '#bff4ff', cape: '#9ff6ff', wings: '#d8f6ff' } },
  { id: 'grimbone', name: 'Grimbone the Reaper', race: 'skeleton', cls: 'berserker', tier: 3, fixed: 5, ability: 'soulHarvest', aName: 'Harvest of Souls', aDesc: 'A scythe as tall as the sky sweeps across the whole field, cutting every enemy for {0}. Each foe it kills sends a soul back that heals Grimbone for {1}.',
    spr: { head: 'skeleton', skin: SK.bone, eye: '#9dff6a', hat: 'hood', armor: '#1a1a2a', armor2: '#0a0a14', cloth: '#3a2a5a', weapon: 'scythe', metal: '#e8ffd0', halo: '#9dff6a', wings: '#3a2a5a' } },
  { id: 'bramble', name: 'Mother Bramble', race: 'beast', cls: 'cleric', tier: 2, ability: 'groveOfRenewal', aName: 'Grove of Renewal', aDesc: 'A great oak bursts up among your heroes. For 4s it heals every ally near it for {0} each second, and its roots bind foes that come close.',
    spr: { head: 'beast', skin: '#a8784a', snout: '#e8d0b0', ears: 'round', hat: 'antlers', hornCol: '#7bd36a', armor: '#5a8a3a', armor2: '#3a5a2a', cloth: '#ff9fd0', weapon: 'staff', gem: '#9be05a' } },
  { id: 'tobias', name: 'Brother Tobias', race: 'human', cls: 'cleric', tier: 3, fixed: 4, ability: 'cathedral', aName: 'Cathedral of Light', aDesc: 'Pillars of stained glass rise around your heroes. For 3s no ally can drop below 1 HP, and everyone heals {0}.',
    spr: { head: 'human', skin: SK.brown, hair: '#e8e8f0', hat: 'none', armor: '#ffffff', armor2: '#c8b8ff', cloth: '#ffd84a', weapon: 'staff', gem: '#ff9fd0', cape: '#ffd84a', halo: '#fff3a0', wings: '#ffffff' } },
  { id: 'oona', name: 'Oona Bonechime', race: 'skeleton', cls: 'cleric', tier: 1, ability: 'lanterns', aName: 'Requiem Lanterns', aDesc: 'Ghost lanterns drift to every ally, shielding them for {0} and healing them for {1} every second for 4s.',
    spr: { head: 'skeleton', skin: SK.bone, eye: '#9ff6ff', hat: 'hood', armor: '#9ff6ff', armor2: '#3a8aa8', cloth: '#e8f6ff', weapon: 'totem', gem: '#9ff6ff' } },
  { id: 'toadmother', name: 'The Great Toadmother', race: 'toad', cls: 'cleric', tier: 3, fixed: 5, ability: 'rainOfPlenty', aName: 'Rain of Plenty', aDesc: 'A cosmic toad on a storm cloud makes it rain for 4s. Every half second the rain heals every ally for {0}, and frogs fall on foes for {1}.',
    spr: { head: 'toad', skin: '#5a9ad8', belly: '#e0f0ff', hat: 'crown', armor: '#2a4a9a', armor2: '#14246a', cloth: '#ffd84a', weapon: 'staff', gem: '#fff3a0', cape: '#5fd3ff', halo: '#fff3a0', wings: '#bff4ff' } },
];
const HERO_BY_ID = Object.fromEntries(HEROES.map(h => [h.id, h]));

// ===== Horde =====
// kind: melee | ranged | flyer | healer ; cost = wave budget points
const ENEMIES = {
  // Goblin Warband
  grunt:   { name: 'Goblin', hp: 75, atk: 9, as: 0.9, range: 13, spd: 20, armor: 0, gold: 5, cost: 1, kind: 'melee', spr: { gen: 'humanoid', head: 'goblin', skin: SK.gob, hat: 'none', armor: '#8a5a3a', armor2: '#5a3a22', cloth: '#5a3a22', weapon: 'sword', metal: '#b8b8c8' } },
  slinger: { name: 'Goblin Slinger', hp: 52, atk: 8, as: 0.7, range: 72, spd: 18, armor: 0, gold: 8, cost: 1.5, kind: 'ranged', proj: 'rock', spr: { gen: 'humanoid', head: 'goblin', skin: '#a3d95a', hat: 'bandana', armor: '#6a4a8a', armor2: '#4a2f61', cloth: '#ff7a3a', weapon: 'none' } },
  wolf:    { name: 'Wolf Rider', hp: 110, atk: 13, as: 1.0, range: 13, spd: 30, armor: 5, gold: 12, cost: 2, kind: 'melee', spr: { gen: 'quad', body: '#8a8aa0', belly: '#c8c8d8', rider: SK.gob, riderCloth: '#c94a3a', eye: '#ffde3a' } },
  shaman:  { name: 'Goblin Shaman', hp: 70, atk: 7, as: 0.6, range: 64, spd: 17, armor: 0, gold: 15, cost: 2.5, kind: 'healer', proj: 'soul', spr: { gen: 'humanoid', head: 'goblin', skin: '#6fbf5a', hat: 'hood', armor: '#3a7a8a', armor2: '#24505a', cloth: '#ffd84a', weapon: 'staff', gem: '#ff5dd8' } },
  master:  { name: 'Master Goblin', hp: 300, atk: 22, as: 0.9, range: 14, spd: 18, armor: 20, gold: 30, cost: 6, kind: 'melee', elite: true, spr: { gen: 'humanoid', head: 'goblin', skin: '#5aa83a', hat: 'helm', armor: '#6a6a7a', armor2: '#3a3a4a', cloth: '#d83a3a', weapon: 'axe', metal: '#e0e0f0' } },
  // Bogmire
  slime:   { name: 'Bog Slime', hp: 120, atk: 10, as: 0.8, range: 13, spd: 15, armor: 0, gold: 8, cost: 1.5, kind: 'melee', split: 'slimelet', spr: { gen: 'slime', body: '#7fe05a', eye: '#1a1230' } },
  slimelet:{ name: 'Slimelet', hp: 40, atk: 6, as: 1.0, range: 12, spd: 24, armor: 0, gold: 2, cost: 0.6, kind: 'melee', small: true, spr: { gen: 'slime', body: '#b0f07a', eye: '#1a1230', small: true } },
  lurker:  { name: 'Bog Lurker', hp: 90, atk: 11, as: 0.7, range: 70, spd: 17, armor: 5, gold: 11, cost: 2, kind: 'ranged', proj: 'spit', poison: 4, spr: { gen: 'humanoid', head: 'toad', skin: '#5a7a3a', belly: '#9aaa5a', hat: 'none', armor: '#4a3a2a', armor2: '#2a2018', cloth: '#7a5a3a', weapon: 'none' } },
  wisp:    { name: 'Will-o-Wisp', hp: 60, atk: 10, as: 0.9, range: 50, spd: 28, armor: 0, gold: 10, cost: 2, kind: 'flyer', proj: 'soul', spr: { gen: 'flyer', body: '#8affd8', wing: '#d8fff2', eye: '#1a6a5a', glow: true } },
  troll:   { name: 'Bog Troll', hp: 520, atk: 26, as: 0.7, range: 15, spd: 14, armor: 25, gold: 35, cost: 7, kind: 'melee', elite: true, regen: 0.02, spr: { gen: 'humanoid', head: 'orc', skin: '#4a8a6a', hair: '#2a4a3a', hairStyle: 'long', hat: 'none', armor: '#5a4a3a', armor2: '#3a2a20', cloth: '#5a4a3a', weapon: 'hammer', metal: '#7a6a5a' } },
  // Grave Rot
  zombie:  { name: 'Shambler', hp: 150, atk: 12, as: 0.7, range: 13, spd: 13, armor: 5, gold: 9, cost: 1.5, kind: 'melee', spr: { gen: 'humanoid', head: 'human', skin: '#9ac48a', hair: '#3a4a3a', hat: 'none', armor: '#5a6a8a', armor2: '#3a4a5a', cloth: '#4a3a3a', weapon: 'none', eye: '#ff3a3a' } },
  ghoul:   { name: 'Ghoul', hp: 110, atk: 15, as: 1.2, range: 13, spd: 40, armor: 0, gold: 12, cost: 2, kind: 'melee', spr: { gen: 'quad', body: '#9a8ac0', belly: '#c8b8e0', eye: '#ff3a6a' } },
  bat:     { name: 'Grave Bat', hp: 55, atk: 9, as: 1.1, range: 13, spd: 38, armor: 0, gold: 7, cost: 1.2, kind: 'flyer', spr: { gen: 'flyer', body: '#5a3a7a', wing: '#8a5ab0', eye: '#ff3a3a' } },
  wraith:  { name: 'Wraith', hp: 120, atk: 16, as: 0.7, range: 72, spd: 22, armor: 10, gold: 18, cost: 3, kind: 'flyer', proj: 'soul', spr: { gen: 'flyer', body: '#b8c8ff', wing: '#6a7ab0', eye: '#2a2a6a', glow: true } },
  bonegiant:{ name: 'Bone Giant', hp: 700, atk: 30, as: 0.6, range: 16, spd: 13, armor: 30, gold: 45, cost: 8, kind: 'melee', elite: true, spr: { gen: 'humanoid', head: 'skeleton', skin: SK.bone, hat: 'horns', hornCol: '#5a4a6a', armor: '#5a4a6a', armor2: '#3a2a4a', cloth: '#3a2a4a', weapon: 'axe', metal: '#c8c0b0' } },
  // Imp Carnival
  imp:     { name: 'Imp', hp: 70, atk: 11, as: 1.1, range: 13, spd: 36, armor: 0, gold: 9, cost: 1.4, kind: 'flyer', spr: { gen: 'flyer', body: '#ff4a4a', wing: '#8a1a3a', eye: '#ffde3a', horns: true } },
  hound:   { name: 'Hellhound', hp: 160, atk: 18, as: 1.1, range: 13, spd: 31, armor: 5, gold: 14, cost: 2.2, kind: 'melee', spr: { gen: 'quad', body: '#3a2a3a', belly: '#ff6a2a', eye: '#ffde3a', fire: true } },
  juggler: { name: 'Fire Juggler', hp: 120, atk: 17, as: 0.8, range: 78, spd: 18, armor: 5, gold: 16, cost: 2.5, kind: 'ranged', proj: 'fire', spr: { gen: 'humanoid', head: 'goblin', skin: '#ff7a5a', hat: 'wizard', armor: '#ffd84a', armor2: '#d84a8a', cloth: '#5a2a8a', weapon: 'none' } },
  brute:   { name: 'Pit Brute', hp: 900, atk: 34, as: 0.7, range: 16, spd: 15, armor: 30, gold: 50, cost: 8, kind: 'melee', elite: true, spr: { gen: 'humanoid', head: 'orc', skin: '#d84a4a', hair: '#1a1a1a', hat: 'horns', hornCol: '#ffe9b0', armor: '#3a2a3a', armor2: '#1a121a', cloth: '#ffd84a', weapon: 'axe', metal: '#ff8a3a' } },
  // Frostfang Clans
  snowwolf:{ name: 'Snow Wolf', hp: 170, atk: 18, as: 1.1, range: 13, spd: 44, armor: 5, gold: 14, cost: 2, kind: 'melee', spr: { gen: 'quad', body: '#e8f0ff', belly: '#ffffff', eye: '#3a8aff' } },
  icearcher:{ name: 'Ice Archer', hp: 130, atk: 19, as: 0.8, range: 84, spd: 18, armor: 5, gold: 16, cost: 2.5, kind: 'ranged', proj: 'ice', slow: 0.3, spr: { gen: 'humanoid', head: 'goblin', skin: '#9ad8ff', hat: 'hood', armor: '#e8f0ff', armor2: '#9ab0d8', cloth: '#3a6ad8', weapon: 'bow' } },
  yeti:    { name: 'Yeti', hp: 340, atk: 24, as: 0.8, range: 14, spd: 18, armor: 15, gold: 20, cost: 3, kind: 'melee', spr: { gen: 'humanoid', head: 'beast', skin: '#f4f8ff', snout: '#9ab0d8', ears: 'round', hat: 'none', armor: '#f4f8ff', armor2: '#c8d8f0', cloth: '#c8d8f0', weapon: 'none' } },
  frostwisp:{ name: 'Frost Sprite', hp: 110, atk: 15, as: 1.0, range: 56, spd: 30, armor: 0, gold: 13, cost: 2, kind: 'flyer', proj: 'ice', spr: { gen: 'flyer', body: '#9af0ff', wing: '#ffffff', eye: '#2a4a8a', glow: true } },
  giant:   { name: 'Frost Giant', hp: 1300, atk: 42, as: 0.6, range: 17, spd: 13, armor: 35, gold: 60, cost: 9, kind: 'melee', elite: true, spr: { gen: 'humanoid', head: 'dwarf', skin: '#8ac8ff', hair: '#ffffff', hat: 'helm', armor: '#c8d8f0', armor2: '#7a9ac8', cloth: '#3a5ab8', weapon: 'hammer', metal: '#e8f8ff' } },
  // Clockwork Host
  cog:     { name: 'Cogling', hp: 210, atk: 20, as: 1.0, range: 13, spd: 26, armor: 20, gold: 14, cost: 2, kind: 'melee', spr: { gen: 'golem', body: '#d8a84a', trim: '#8a6a2a', eye: '#5fd3ff', small: true } },
  gyro:    { name: 'Gyrocopter', hp: 170, atk: 20, as: 1.0, range: 60, spd: 30, armor: 10, gold: 16, cost: 2.5, kind: 'flyer', proj: 'bullet', spr: { gen: 'flyer', body: '#c8a04a', wing: '#e8e8f0', eye: '#5fd3ff', rotor: true } },
  cannonbot:{ name: 'Cannon Bot', hp: 220, atk: 28, as: 0.6, range: 90, spd: 15, armor: 20, gold: 20, cost: 3, kind: 'ranged', proj: 'bullet', splash: 14, spr: { gen: 'golem', body: '#8a9ab0', trim: '#4a5a70', eye: '#ff5d3a', cannon: true } },
  golem:   { name: 'Steam Golem', hp: 1800, atk: 50, as: 0.6, range: 17, spd: 12, armor: 45, gold: 75, cost: 10, kind: 'melee', elite: true, spr: { gen: 'golem', body: '#c88a3a', trim: '#6a4a2a', eye: '#ffde3a' } },
  // Fungal Court
  shroom:  { name: 'Shroomling', hp: 140, atk: 14, as: 0.9, range: 13, spd: 20, armor: 5, gold: 10, cost: 1.5, kind: 'melee', split: 'sporelet', spr: { gen: 'humanoid', head: 'goblin', skin: '#f4e4c8', hat: 'wizard', armor: '#e84a5a', armor2: '#a82a3a', cloth: '#f4e4c8', weapon: 'none' } },
  sporelet:{ name: 'Sporelet', hp: 45, atk: 7, as: 1.0, range: 12, spd: 26, armor: 0, gold: 2, cost: 0.6, kind: 'melee', small: true, spr: { gen: 'slime', body: '#e8c8f0', eye: '#3a1a4a', small: true } },
  puffball:{ name: 'Puffball', hp: 100, atk: 13, as: 0.8, range: 62, spd: 22, armor: 0, gold: 12, cost: 2, kind: 'flyer', proj: 'spit', poison: 5, spr: { gen: 'flyer', body: '#d8c89a', wing: '#f4ecd0', eye: '#4a2a1a', glow: true } },
  mycelid: { name: 'Mycelid Hound', hp: 190, atk: 19, as: 1.0, range: 13, spd: 38, armor: 5, gold: 14, cost: 2.2, kind: 'melee', spr: { gen: 'quad', body: '#a86ad8', belly: '#f0d8ff', eye: '#ffde3a' } },
  truffle: { name: 'Truffle Brute', hp: 1100, atk: 38, as: 0.6, range: 16, spd: 13, armor: 35, gold: 55, cost: 8, kind: 'melee', elite: true, regen: 0.015, spr: { gen: 'golem', body: '#7a5a3a', trim: '#c8a070', eye: '#c8ff6a' } },
  // Trashpaw Gang
  bandit:  { name: 'Raccoon Bandit', hp: 170, atk: 21, as: 1.2, range: 13, spd: 34, armor: 5, gold: 16, cost: 2, kind: 'melee', spr: { gen: 'humanoid', head: 'beast', skin: '#8a8a9a', snout: '#3a3a4a', ears: 'round', hat: 'hood', armor: '#3a3a4a', armor2: '#24242e', cloth: '#5a5a6a', weapon: 'daggers', metal: '#c8c8d8' } },
  lobber:  { name: 'Can Lobber', hp: 140, atk: 22, as: 0.7, range: 82, spd: 18, armor: 5, gold: 17, cost: 2.5, kind: 'ranged', proj: 'rock', splash: 12, spr: { gen: 'humanoid', head: 'beast', skin: '#9a9aaa', snout: '#2a2a3a', ears: 'round', hat: 'bandana', armor: '#4a7a3a', armor2: '#2a4a22', cloth: '#7a5a3a', weapon: 'none' } },
  possum:  { name: 'Possum Scout', hp: 150, atk: 17, as: 1.1, range: 13, spd: 48, armor: 0, gold: 13, cost: 1.8, kind: 'melee', spr: { gen: 'quad', body: '#d8d0d8', belly: '#ffffff', eye: '#1a1230' } },
  bruiser: { name: 'Dumpster Bruiser', hp: 1600, atk: 48, as: 0.6, range: 17, spd: 13, armor: 40, gold: 70, cost: 9, kind: 'melee', elite: true, spr: { gen: 'golem', body: '#5a7a5a', trim: '#3a4a3a', eye: '#ffde3a' } },
  // Crab Corsairs
  crab:    { name: 'Deck Crab', hp: 260, atk: 24, as: 0.9, range: 13, spd: 24, armor: 30, gold: 16, cost: 2, kind: 'melee', spr: { gen: 'quad', body: '#ff6a4a', belly: '#ffd0a0', eye: '#1a1230' } },
  deckhand:{ name: 'Corsair', hp: 230, atk: 27, as: 1.0, range: 14, spd: 26, armor: 15, gold: 18, cost: 2.3, kind: 'melee', spr: { gen: 'humanoid', head: 'human', skin: '#e0a878', hair: '#2a1a12', hat: 'bandana', armor: '#f4f0e8', armor2: '#2a4a8a', cloth: '#2a4a8a', weapon: 'sword', metal: '#dfe6f5' } },
  gull:    { name: 'Pirate Gull', hp: 150, atk: 20, as: 1.2, range: 13, spd: 46, armor: 0, gold: 13, cost: 1.8, kind: 'flyer', spr: { gen: 'flyer', body: '#f4f4f0', wing: '#a8b0c0', eye: '#ffb02e' } },
  gunner:  { name: 'Cannon Corsair', hp: 220, atk: 32, as: 0.55, range: 94, spd: 16, armor: 15, gold: 22, cost: 3, kind: 'ranged', proj: 'bullet', splash: 16, spr: { gen: 'humanoid', head: 'orc', skin: '#7a9a6a', hat: 'bandana', armor: '#8a2a3a', armor2: '#5a1a22', cloth: '#2a2a3a', weapon: 'cannon', metal: '#6a6a7a' } },
  kingcrab:{ name: 'King Crab', hp: 2200, atk: 56, as: 0.6, range: 17, spd: 12, armor: 60, gold: 85, cost: 10, kind: 'melee', elite: true, scale: 1.4, spr: { gen: 'quad', body: '#d83a2a', belly: '#ffb080', eye: '#ffde3a', horns: true } },
  // The Feathered Host
  rooster: { name: 'War Rooster', hp: 2600, atk: 60, as: 0.9, range: 15, spd: 30, armor: 40, gold: 95, cost: 10, kind: 'melee', elite: true, scale: 1.5, spr: { gen: 'bird', body: '#c8402a', wing: '#2a6a3a', beak: '#ffb02e', comb: '#ff3d3d' } },
  duck:    { name: 'Duck Sniper', hp: 200, atk: 30, as: 0.7, range: 100, spd: 22, armor: 5, gold: 20, cost: 2.6, kind: 'ranged', proj: 'spit', spr: { gen: 'bird', body: '#4a8a4a', wing: '#c8b890', beak: '#ffd03a' } },
  pigeon:  { name: 'Pigeon Squadron', hp: 140, atk: 22, as: 1.3, range: 13, spd: 50, armor: 0, gold: 13, cost: 1.8, kind: 'flyer', spr: { gen: 'flyer', body: '#8a90a8', wing: '#c8ccd8', eye: '#ff7a3a' } },
  gosling: { name: 'Gosling Shock Troop', hp: 260, atk: 26, as: 1.3, range: 12, spd: 44, armor: 10, gold: 15, cost: 2.2, kind: 'melee', spr: { gen: 'bird', body: '#f4e48a', wing: '#e0c860', beak: '#ff8a1a', neck: true } },
  // chaos guests
  chicken: { name: 'Very Confident Chicken', hp: 38, atk: 5, as: 1.2, range: 12, spd: 46, armor: 0, gold: 4, cost: 0.5, kind: 'melee', small: true, spr: { gen: 'bird', body: '#ffffff', wing: '#e8e4d8', beak: '#ffb02e', comb: '#ff3d3d' } },
  goose:   { name: 'The Goose', hp: 520, atk: 6, as: 1.4, range: 12, spd: 52, armor: 10, gold: 45, cost: 3, kind: 'melee', spr: { gen: 'bird', body: '#f4f4f0', wing: '#c8c8d0', beak: '#ff8a1a', neck: true } },
  // bosses
  grubnose: { name: 'Grubnose the Goblin King', boss: 'mini', hp: 2600, atk: 34, as: 0.8, range: 22, spd: 13, armor: 25, gold: 220, kind: 'melee', scale: 2, skills: ['slam', 'summon:grunt'], spr: { gen: 'humanoid', head: 'goblin', skin: '#7ac83a', hat: 'crown', armor: '#d83a5a', armor2: '#8a1a3a', cloth: '#ffd84a', weapon: 'kingclub', metal: '#ffcf3a', cape: '#7a3ad8' } },
  gloop:    { name: 'Mother Gloop', boss: 'mini', hp: 4200, atk: 36, as: 0.7, range: 22, spd: 11, armor: 15, gold: 300, kind: 'melee', scale: 2, split: 'slime', skills: ['slam', 'summon:slimelet'], spr: { gen: 'slime', body: '#5ad84a', eye: '#1a1230', crown: true } },
  wyrm:     { name: 'Vexmora, the Ashen Wyrm', boss: 'big', hp: 14000, atk: 60, as: 0.6, range: 30, spd: 10, armor: 35, gold: 900, kind: 'melee', scale: 3, skills: ['breath', 'gust', 'fireRain'], spr: { gen: 'quad', body: '#5a4a6a', belly: '#ff9a4a', eye: '#ffde3a', wings: true, horns: true } },
  ringmaster:{ name: 'Ringmaster Malgoth', boss: 'mini', hp: 13000, atk: 70, as: 0.8, range: 22, spd: 13, armor: 40, gold: 700, kind: 'melee', scale: 2, skills: ['slam', 'summon:imp', 'fireRain'], spr: { gen: 'humanoid', head: 'orc', skin: '#ff5a5a', hair: '#1a1a1a', hat: 'wizard', armor: '#2a1a4a', armor2: '#1a0f2a', cloth: '#ffd84a', weapon: 'staff', gem: '#ff3a3a', cape: '#ffd84a' } },
  matriarch:{ name: 'The Yeti Matriarch', boss: 'mini', hp: 22000, atk: 95, as: 0.7, range: 22, spd: 12, armor: 50, gold: 1000, kind: 'melee', scale: 2, skills: ['slam', 'summon:snowwolf', 'gust'], spr: { gen: 'humanoid', head: 'beast', skin: '#ffffff', snout: '#9ab0d8', ears: 'round', hat: 'crown', armor: '#e8f0ff', armor2: '#b8c8e8', cloth: '#5fd3ff', weapon: 'none' } },
  sporebaron:{ name: 'The Spore Baron', boss: 'mini', hp: 16000, atk: 80, as: 0.7, range: 22, spd: 12, armor: 40, gold: 800, kind: 'melee', scale: 2, skills: ['slam', 'summon:shroom', 'gust'], spr: { gen: 'humanoid', head: 'goblin', skin: '#f4e4c8', hat: 'wizard', armor: '#8a3ad8', armor2: '#5a1a9a', cloth: '#e84a5a', weapon: 'staff', gem: '#c8ff6a', cape: '#e84a5a' } },
  trashpaw: { name: 'Big Mama Trashpaw', boss: 'mini', hp: 30000, atk: 110, as: 0.8, range: 22, spd: 14, armor: 55, gold: 1200, kind: 'melee', scale: 2, skills: ['slam', 'summon:bandit', 'fireRain'], spr: { gen: 'humanoid', head: 'beast', skin: '#7a7a8a', snout: '#2a2a3a', ears: 'round', hat: 'none', armor: '#c84a8a', armor2: '#8a2a5a', cloth: '#3a3a4a', weapon: 'pan', metal: '#c8c8d8', cape: '#5a3a7a' } },
  pinchbeard:{ name: 'Captain Pinchbeard', boss: 'mini', hp: 45000, atk: 150, as: 0.8, range: 22, spd: 13, armor: 65, gold: 1600, kind: 'melee', scale: 2, skills: ['slam', 'summon:crab', 'fireRain', 'gust'], spr: { gen: 'humanoid', head: 'orc', skin: '#ff6a4a', hair: '#1a1a1a', hairStyle: 'long', hat: 'helm', armor: '#2a2a3a', armor2: '#1a1a24', cloth: '#d8b84a', weapon: 'cutlass', metal: '#ffd84a', cape: '#a82a3a' } },
  shardgoose: { name: 'The Shard-Crowned Goose', boss: 'big', hp: 120000, atk: 200, as: 0.9, range: 30, spd: 12, armor: 70, gold: 5000, kind: 'melee', scale: 3.2, skills: ['breath', 'slam', 'summon:gosling', 'gust', 'laser'], spr: { gen: 'bird', body: '#fbfbf6', wing: '#d8d0f0', beak: '#ff8a1a', neck: true, crown: '#c98aff' } },
  goosegod: { name: 'The Eternal Goose', boss: 'big', hp: 120000, atk: 200, as: 0.9, range: 30, spd: 12, armor: 70, gold: 5000, kind: 'melee', scale: 3, skills: ['breath', 'slam', 'summon:chicken', 'summon:gosling', 'gust', 'laser'], spr: { gen: 'bird', body: '#fbfbf6', wing: '#c8c8d0', beak: '#ff8a1a', neck: true, crown: '#ffd84a' } },
  colossus: { name: 'The Brass Colossus', boss: 'big', hp: 60000, atk: 130, as: 0.5, range: 30, spd: 9, armor: 60, gold: 2500, kind: 'melee', scale: 3, skills: ['laser', 'slam', 'summon:cog'], spr: { gen: 'golem', body: '#e8b84a', trim: '#8a5a2a', eye: '#ff3a5a', crown: true } },
};

const FACTIONS = [
  { name: 'Goblin Warband', pool: ['grunt', 'slinger', 'wolf', 'shaman'], elite: 'master', boss: 'grubnose', tint: '#3a5a2a', sky: ['#7cc8ff', '#d4f0ff'], hill: '#6aa0e0' },
  { name: 'Bogmire Oozes', pool: ['slime', 'lurker', 'wisp'], elite: 'troll', boss: 'gloop', tint: '#2a4a3a', sky: ['#8ad8c8', '#e0fff0'], hill: '#5ab0a0' },
  { name: 'Grave Rot', pool: ['zombie', 'ghoul', 'bat', 'wraith'], elite: 'bonegiant', boss: 'wyrm', tint: '#3a2a4a', sky: ['#a89ae8', '#ffd8f0'], hill: '#8a7ad0' },
  { name: 'Imp Carnival', pool: ['imp', 'hound', 'juggler'], elite: 'brute', boss: 'ringmaster', tint: '#4a1a2a', sky: ['#ff9a8a', '#ffe8b0'], hill: '#e07a8a' },
  { name: 'Fungal Court', pool: ['shroom', 'puffball', 'mycelid'], elite: 'truffle', boss: 'sporebaron', tint: '#3a2a3a', sky: ['#c8a8e8', '#fff0d8'], hill: '#a888c8' },
  { name: 'Frostfang Clans', pool: ['snowwolf', 'icearcher', 'yeti', 'frostwisp'], elite: 'giant', boss: 'matriarch', tint: '#2a3a5a', sky: ['#9ad0ff', '#f4fbff'], hill: '#b0d0f0' },
  { name: 'Trashpaw Gang', pool: ['bandit', 'lobber', 'possum'], elite: 'bruiser', boss: 'trashpaw', tint: '#2a2a2a', sky: ['#5a6a9a', '#ffc87a'], hill: '#4a5a7a' },
  { name: 'Clockwork Host', pool: ['cog', 'gyro', 'cannonbot'], elite: 'golem', boss: 'colossus', tint: '#3a2a1a', sky: ['#ffc87a', '#fff4d8'], hill: '#d0a070' },
  { name: 'Crab Corsairs', pool: ['crab', 'deckhand', 'gull', 'gunner'], elite: 'kingcrab', boss: 'pinchbeard', tint: '#1a3a4a', sky: ['#5ac8ff', '#e8fbff'], hill: '#3a9ad0' },
  { name: 'The Feathered Host', pool: ['chicken', 'gosling', 'duck', 'pigeon', 'goose'], elite: 'rooster', boss: 'goosegod', tint: '#4a4a2a', sky: ['#ffd8a8', '#fff8e8'], hill: '#e0c080' },
];
// horde tactics (Cam 2026-10-15: late sieges felt predictable): most sieges from 6 on roll one, shown in the scouts report
const TACTICS = {
  warband:    { name: 'Mixed Warband', icon: '⚔', desc: 'Stragglers from an earlier horde march with this one.' },
  blitz:      { name: 'Blitz',         icon: '»', desc: 'Everything comes in one rush, 35% faster, with 15% less HP.' },
  captain:    { name: 'War Captain',   icon: '♛', desc: 'An elite leads the charge with double HP and harder hits. It always drops loot.' },
  swarm:      { name: 'Swarm',         icon: '∴', desc: 'Half again as many foes, each with 35% less HP.' },
  shieldwall: { name: 'Shieldwall',    icon: '▣', desc: 'Foes carry shields for +30 armor, but 15% fewer come.' },
  airraid:    { name: 'Air Raid',      icon: '^', desc: 'Flyers from every horde so far join the attack.' },
};
function rollTactic(s) { if (s < 6 || s % 5 === 0 || s >= FINAL_SIEGE || Math.random() < 0.2) return null; const k = Object.keys(TACTICS); return k[Math.floor(Math.random() * k.length)]; }
const FINAL_SIEGE = 50;
// Cam 2026-10-15, the goose finale: before each of the last five sieges the goose swoops in and carries off one
// champion (they sit out), so the goose is beaten by a small team. Then it storms the castle for the twelve
// elemental shards, the captives break free, and everyone fights one last battle inside the castle's great hall.
const VAULT_FROM = 46;
const VAULT_LORE = {
  46: ['Something Big Overhead', 'A shadow crosses the courtyard. The Eternal Goose drops out of the sky, grabs {name} by the collar and flaps off toward its nest. "HONK," it says, which you are fairly sure means "collateral".'],
  47: ['Again', 'It came back. You heard the wings this time, but not soon enough. {name} is carried off over the walls, still shouting instructions.'],
  48: ['Ransom Note', 'A gosling delivers a note: "I HAVE YOUR FRIENDS. BRING SHARDS." Before you can reply, the goose swoops down and takes {name} as well.'],
  49: ['The Nest Grows', 'Scouts spot the goose\'s nest on the far hill, made of stolen banners and your champions\' capes. Tonight it adds {name} to the collection.'],
  50: ['The Last Snatch', 'The Eternal Goose is at the gates, and it takes one more for luck. {name} is gone. A small team will have to hold the walls.'],
}; // ten hordes of five sieges; the Eternal Goose waits at the end

// ===== Progression =====
const VERSION = 'phase3.6';
function xpNeed(lv) { return Math.round(26 * Math.pow(lv, 1.45)); }
const SIG_LEVEL = 5, ELEMENT_LEVEL = 7, CASTLE_SIEGE = 15;
const STAT_KEYS = ['ad', 'ap', 'def'];
const STAT_NAME = { ad: 'Attack', ap: 'Ability power', def: 'Defense' };

// ===== Elements =====
// style: which stat the element boosts (ad | ap | def)
const ELEMENTS = {
  dark:      { name: 'Dark',      col: '#8a5ad8', col2: '#2a1a4a', style: 'ad',  title: 'the Umbral',      desc: 'Heals 18% of damage dealt. Finishes off non-boss foes under 10% HP.' },
  light:     { name: 'Light',     col: '#fff3b0', col2: '#ffcf3a', style: 'ap',  title: 'the Radiant',     desc: '+15% crit. Signatures also heal every ally 10%. Hits blind foes so they miss 25%.' },
  lightning: { name: 'Lightning', col: '#9ff6ff', col2: '#4a8aff', style: 'ad',  title: 'Stormcaller',     desc: '+30% attack speed. Every third hit arcs to 2 more foes.' },
  fire:      { name: 'Fire',      col: '#ff6a3d', col2: '#ffd23a', style: 'ap',  title: 'the Blazing',     desc: 'Hits set foes on fire. Signatures deal +25% damage.' },
  water:     { name: 'Water',     col: '#4ab8ff', col2: '#bff4ff', style: 'def', title: 'the Tidal',       desc: 'Regenerates fast below half HP. Soaked foes take +15% damage.' },
  ice:       { name: 'Ice',       col: '#bfeeff', col2: '#5fa8ff', style: 'def', title: 'Frostbound',      desc: 'Hits chill foes. Every fourth hit freezes them solid.' },
  nature:    { name: 'Nature',    col: '#6fdc5a', col2: '#2f8a3a', style: 'def', title: 'the Overgrown',   desc: '+30% HP, steady regeneration, and thorns that hurt attackers.' },
  void:      { name: 'Void',      col: '#5a3aff', col2: '#0f0a2a', style: 'ap',  title: 'the Hollow',      desc: 'Hits shred armor. Signatures drag nearby foes into a pile.' },
  salty:     { name: 'Salty',     col: '#e8eef8', col2: '#8a9ab8', style: 'ad',  title: 'the Salty',       desc: '+20% crit and crits hit 2×. Gets angrier every time they are hit.' },
  sweet:     { name: 'Sweet',     col: '#ff8ad8', col2: '#ffd1f0', style: 'ap',  title: 'the Sugarcoated', desc: 'Nearby allies get a sugar rush (+15% attack speed). Hits make foes sticky.' },
  meat:      { name: 'Meat',      col: '#ff6a6a', col2: '#ffd0b0', style: 'def', title: 'the Meaty',       desc: '+45% HP and +20 armor. Gets visibly bigger. Signatures taunt.' },
  treat:     { name: 'Treat',     col: '#ffb02e', col2: '#8a4a1a', style: 'ad',  title: 'the Treat-Laden', desc: 'Kills drop +40% gold and snacks that heal allies. Hits can distract foes.' },
};
const EL_KEYS = Object.keys(ELEMENTS);
const STYLE_NAME = { ad: 'Attack damage', ap: 'Ability power', def: 'Defense' };

// combo kinds: nova | rain | wave | heal | shield | haste | rage | freeze | gold | shred | vortex | critter
const COMBOS = {
  'dark+light': ['Eclipse', 'nova', 'The sun blinks. Everything near the biggest crowd explodes.'],
  'dark+lightning': ['Black Thunder', 'rain', 'Purple lightning strikes random foes.'],
  'dark+fire': ['Hellfire', 'nova', 'A pillar of black flame erupts in the crowd.'],
  'dark+water': ['Abyssal Tide', 'wave', 'An inky wave rolls across the field.'],
  'dark+ice': ['Grave Frost', 'freeze', 'Cold hands grab every foe near the front.'],
  'dark+nature': ['Rotwood', 'shred', 'Creeping rot softens all enemy armor.'],
  'dark+void': ['The Big Nothing', 'vortex', 'A tiny black hole eats the middle of the horde.'],
  'dark+salty': ['Brooding Teen', 'rage', 'Everyone sulks so hard they hit harder.'],
  'dark+sweet': ['Dark Chocolate', 'heal', 'Bittersweet healing for the whole team.'],
  'dark+meat': ['Blood Sausage', 'rage', 'Questionable sausage. Heroes hit much harder.'],
  'dark+treat': ['Trick or Treat', 'critter', 'Little ghosts in bedsheets join the fight.'],
  'light+lightning': ['Radiant Storm', 'rain', 'Golden bolts rain from a clear sky.'],
  'light+fire': ['Solar Flare', 'nova', 'A miniature sun goes off in the crowd.'],
  'light+water': ['Double Rainbow', 'haste', 'Everyone stops to admire it, then attacks faster.'],
  'light+ice': ['Prism Shards', 'rain', 'Rainbow icicles fall on random foes.'],
  'light+nature': ['Photosynthesis', 'heal', 'Heroes heal in the sunshine.'],
  'light+void': ['Event Horizon', 'shred', 'Light bends wrong. Enemy armor gives up.'],
  'light+salty': ['Sunburnt Tourist', 'shred', 'Foes get painfully sunburnt and lose armor.'],
  'light+sweet': ['Rock Candy Halo', 'shield', 'Crunchy halos shield every hero.'],
  'light+meat': ['Holy Ham', 'shield', 'A glowing ham descends. It blesses everyone with shields.'],
  'light+treat': ['Gold Star Sticker', 'gold', 'Every kill earns a sticker and extra gold.'],
  'lightning+fire': ['Plasma', 'rain', 'Plasma bolts strike random foes.'],
  'lightning+water': ['Electrified Pool', 'wave', 'The field becomes a very bad swimming pool.'],
  'lightning+ice': ['Hailstorm', 'rain', 'Electric hailstones pelt the horde.'],
  'lightning+nature': ['Electric Bloom', 'haste', 'Charged pollen speeds every hero up.'],
  'lightning+void': ['Static Rift', 'shred', 'Crackling rifts strip enemy armor.'],
  'lightning+salty': ['Battery Acid', 'shred', 'Licking the battery was a mistake. For them.'],
  'lightning+sweet': ['Pop Rocks', 'nova', 'Fizzing candy explodes in the crowd.'],
  'lightning+meat': ['Jump-Started Jerky', 'rage', 'Electrified jerky. Heroes hit harder.'],
  'lightning+treat': ['Zappy Snacks', 'haste', 'Snacks with a kick. Attack speed up.'],
  'fire+water': ['Steam Bath', 'freeze', 'A sauna cloud makes foes too relaxed to move.'],
  'fire+ice': ['Thermal Shock', 'nova', 'Hot then cold then very loud.'],
  'fire+nature': ['Wildfire', 'wave', 'A wall of fire sweeps the field.'],
  'fire+void': ['Black Sun', 'vortex', 'A burning void pulls foes in.'],
  'fire+salty': ['Hot Sauce Incident', 'rage', 'Eyes watering, heroes swing harder.'],
  'fire+sweet': ['Crème Brûlée', 'shield', 'Caramelized sugar shells protect the team.'],
  'fire+meat': ['Backyard BBQ', 'heal', 'Someone fired up the grill. Everyone heals.'],
  'fire+treat': ["Campfire S'mores", 'haste', 'Sugar and smoke. Heroes attack faster.'],
  'water+ice': ['Blizzard', 'freeze', 'A whiteout freezes the front lines.'],
  'water+nature': ['Monsoon Bloom', 'heal', 'Warm rain heals the team.'],
  'water+void': ['Whirlpool', 'vortex', 'The moat spins up and swallows foes.'],
  'water+salty': ['Seawater', 'shred', 'Rust spreads on every enemy blade and plate.'],
  'water+sweet': ['Lemonade Stand', 'gold', 'Business is booming. Kills pay extra.'],
  'water+meat': ['Soup of the Day', 'heal', 'Hearty soup heals every hero.'],
  'water+treat': ['Bubble Tea', 'shield', 'Chewy tapioca pearls shield everyone.'],
  'ice+nature': ['Evergreen', 'shield', 'Frosted pine bark shields the team.'],
  'ice+void': ['Absolute Zero', 'freeze', 'Everything near the front stops. Completely.'],
  'ice+salty': ['Road Salt', 'shred', 'Salt melts enemy armor like a winter road.'],
  'ice+sweet': ['Brain Freeze', 'freeze', 'Foes grab their heads and stop moving.'],
  'ice+meat': ['Freezer Burn', 'nova', 'A frozen roast is dropped on the crowd.'],
  'ice+treat': ['Ice Cream Truck', 'haste', 'The jingle plays. Heroes attack faster.'],
  'nature+void': ['Weeds From Nowhere', 'vortex', 'Vines from the void drag foes together.'],
  'nature+salty': ['Pickled', 'shred', 'Foes get brined. Armor goes soft.'],
  'nature+sweet': ['Honeycomb', 'shield', 'Sticky honey shields every hero.'],
  'nature+meat': ['Balanced Diet', 'rage', 'The cook approves. Heroes hit harder.'],
  'nature+treat': ['Trail Mix', 'heal', 'Mostly raisins, but it heals.'],
  'void+salty': ['Existential Dread', 'freeze', 'Foes stop to question everything.'],
  'void+sweet': ['Black Hole Donut', 'vortex', 'A donut with an event horizon pulls foes in.'],
  'void+meat': ['Mystery Meat', 'critter', 'The meat stands up and fights for you.'],
  'void+treat': ['Bag of Holding Snacks', 'gold', 'Endless snacks. Kills drop extra gold.'],
  'salty+sweet': ['Kettle Corn', 'rain', 'Popcorn kernels explode on random foes.'],
  'salty+meat': ['Beef Jerky', 'rage', 'Chewy and furious. Heroes hit harder.'],
  'salty+treat': ['Pretzel Party', 'haste', 'Twisty snacks, twisty attacks. Speed up.'],
  'sweet+meat': ['Honey Glazed Ham', 'heal', 'Sticky, sweet, healing.'],
  'sweet+treat': ['Sugar Rush', 'haste', 'Everyone is vibrating quietly. Huge attack speed boost.'],
  'meat+treat': ['Doggy Bag', 'critter', 'Very good dogs arrive for the leftovers.'],
};
function comboKey(a, b) { return EL_KEYS.indexOf(a) < EL_KEYS.indexOf(b) ? a + '+' + b : b + '+' + a; }
const CRITTERS = { 'dark+treat': 'ghost', 'void+meat': 'meatman', 'meat+treat': 'dog' };
// ----- combo forms: the first time a pair shows up the player picks 1 of 3 versions of it (Cam).
// Option 1 is always the pair's signature combo above; the other two are drawn from what the two elements are good at.
const COMBO_FORM = {
  nova:   ['Burst',     'Explodes in the biggest crowd of foes.'],
  rain:   ['Barrage',   'Strikes rain down on random foes.'],
  wave:   ['Surge',     'A wave rolls across the field, hitting and pushing back every foe.'],
  heal:   ['Bloom',     'Heals every hero for 15% of their max HP.'],
  shield: ['Ward',      'Shields every hero for 18% of their max HP.'],
  haste:  ['Rush',      'Heroes attack 35% faster for 4s.'],
  rage:   ['Fury',      'Heroes deal 35% more damage for 4s.'],
  freeze: ['Lock',      'Freezes foes near the castle in place.'],
  shred:  ['Rend',      'Shreds the armor of every foe and nicks them.'],
  vortex: ['Maelstrom', 'Pulls the biggest crowd together and crushes it.'],
};
const STYLE_FORMS = { ad: ['rage', 'shred', 'rain', 'haste'], ap: ['nova', 'rain', 'vortex', 'wave'], def: ['shield', 'heal', 'freeze', 'wave'] };
const EL_PREFIX = { dark: 'Shadow', light: 'Sun', lightning: 'Storm', fire: 'Flame', water: 'Tide', ice: 'Frost', nature: 'Thorn', void: 'Void', salty: 'Brine', sweet: 'Sugar', meat: 'Meat', treat: 'Snack' };
function comboFormInfo(key, kind) {
  const C = COMBOS[key]; if (!C) return null; if (!kind || kind === C[1]) return { name: C[0], kind: C[1], desc: C[2], sig: true };
  const [a, b] = key.split('+'), F = COMBO_FORM[kind]; return { name: `${EL_PREFIX[a]}-${EL_PREFIX[b]} ${F[0]}`, kind, desc: F[1], sig: false };
}
function comboFormOptions(key) {
  const C = COMBOS[key], [a, b] = key.split('+');
  let pool = [...new Set([...STYLE_FORMS[ELEMENTS[a].style], ...STYLE_FORMS[ELEMENTS[b].style]])].filter(k => k !== C[1]);
  if (pool.length < 2) pool = Object.keys(COMBO_FORM).filter(k => k !== C[1]);
  pool.sort(() => Math.random() - 0.5);
  return [C[1], pool[0], pool[1]];
}

// Elemental castle defense abilities (manual, key E)
const CASTLE_POWERS = {
  dark:      { name: 'Shadow Portcullis', kind: 'execute', desc: 'Shadow hands finish weakened foes and hurt the rest.' },
  light:     { name: 'Cathedral Beam',    kind: 'beam',    desc: 'A holy beam sweeps the whole field.' },
  lightning: { name: 'Tesla Spires',      kind: 'bolts',   desc: 'The towers fire 14 lightning bolts.' },
  fire:      { name: 'Dragonmouth Gate',  kind: 'firewave',desc: 'The gate breathes a wall of fire down the field.' },
  water:     { name: 'Moat Tsunami',      kind: 'flood',   desc: 'The moat stands up and crashes over the horde.' },
  ice:       { name: 'Glacier Slam',      kind: 'freeze',  desc: 'Freezes every foe on the field for 2.5 seconds.' },
  nature:    { name: 'Treant Gate',       kind: 'roots',   desc: 'Roots grab the front line and the heroes heal 35%.' },
  void:      { name: 'Singularity Keep',  kind: 'vortex',  desc: 'Opens a black hole where you click.' },
  salty:     { name: 'Salt Cannon',       kind: 'salt',    desc: 'Blasts the horde with salt, shredding armor.' },
  sweet:     { name: 'Candy Catapult',    kind: 'candy',   desc: 'Gumdrops rain on the field and glue foes in place.' },
  meat:      { name: 'Ham Trebuchet',     kind: 'ham',     desc: 'Launches a gigantic ham where you click. Heroes nearby eat.' },
  treat:     { name: 'Piñata Keep',       kind: 'pinata',  desc: 'The keep bursts with candy. Foes drop triple gold for 6s.' },
};

// ===== Items: components combine into finished items =====
// stat: [value alone, value inside a finished item]; every finished item has one effect no other item shares
const COMPONENTS = {
  sword:   { name: 'Rusty Shortsword',   glyph: 'sword',   stat: [25, 30], unit: '% attack' },
  bow:     { name: 'Slingbow',           glyph: 'bow',     stat: [25, 30], unit: '% attack speed' },
  rod:     { name: 'Wand of Mild Peril', glyph: 'rod',     stat: [30, 35], unit: '% ability power' },
  tear:    { name: 'Dewdrop Vial',       glyph: 'tear',    stat: [25, 30], unit: '% starting mana', stat2: [20, 25], unit2: '% mana gain' },
  vest:    { name: 'Padded Jerkin',      glyph: 'vest',    stat: [30, 40], unit: ' armor' },
  cloak:   { name: 'Dusk Cloak',         glyph: 'cloak',   stat: [10, 15], unit: '% dodge' },
  belt:    { name: 'Ogre Belt',          glyph: 'belt',    stat: [25, 30], unit: '% max HP' },
  glove:   { name: 'Knuckle Mitt',       glyph: 'glove',   stat: [20, 25], unit: '% crit chance' },
  shard:   { name: 'Stray Shard',        glyph: 'shard',   desc: 'A splinter of an elemental shard that fell off a certain crown. It hums. Combines into crests.', rare: true },
};
function compStat(c, fin, k = 1) { const C = COMPONENTS[c], i = fin ? 1 : 0; if (!C.stat) return ''; return `+${C.stat[i] * k}${C.unit}` + (C.stat2 ? `, +${C.stat2[i] * k}${C.unit2}` : ''); }
for (const k in COMPONENTS) if (!COMPONENTS[k].desc) COMPONENTS[k].desc = compStat(k, false);
const COMP_KEYS = ['sword', 'bow', 'rod', 'tear', 'vest', 'cloak', 'belt', 'glove'];
const FINISHED = {
  'sword+sword': ['Twin-Forged Greatblade', 'splash', 'Attacks splash 40% damage onto foes nearby.'],
  'sword+bow':   ['Gale Cutlass', 'twinStrike', 'Every third attack strikes twice.'],
  'sword+rod':   ['Runeslash Rapier', 'runeStrike', 'After a signature, the next 3 attacks deal double damage.'],
  'sword+tear':  ['Brook Cleaver', 'brimming', 'Attacks deal up to +40% damage, the fuller the hero\'s mana.'],
  'sword+vest':  ['Thornwood Sword', 'thorns', 'Reflects 30% of melee damage taken.'],
  'sword+cloak': ['Moonless Shroud', 'ambush', 'The first attack each siege deals triple damage.'],
  'sword+belt':  ['Vampire Hatchet', 'lifesteal', 'Heals for 20% of damage dealt.'],
  'sword+glove': ['Grimgrin Charm', 'execute', 'Crits finish non-boss foes under 20% HP.'],
  'bow+bow':     ['Hasty Longbow', 'haste', 'Each attack grants +5% attack speed, up to +50%.'],
  'bow+rod':     ['Thunder Band', 'chainZap', 'Attacks have a 25% chance to chain lightning.'],
  'bow+tear':    ['Hummingbird Harp', 'manaHit', 'Each attack grants 5 extra mana.'],
  'bow+vest':    ['Porcupine Plate', 'arrowWard', 'Takes 40% less damage from ranged foes.'],
  'bow+cloak':   ['Fogstep Boots', 'fogstep', '+30% move speed. Can\'t be slowed.'],
  'bow+belt':    ['Pep Rally Sash', 'rally', 'Every hero gains +10% attack speed.'],
  'bow+glove':   ['Squint Monocle', 'farsight', '+40% range.'],
  'rod+rod':     ['Too-Tall Wizard Hat', 'bigHat', '+50% more ability power. Pointy.'],
  'rod+tear':    ['Wellspring Staff', 'wellspring', 'Gains 4 mana every second.'],
  'rod+vest':    ['Snowglobe', 'chill', 'Attacks slow foes 30% for 2s.'],
  'rod+cloak':   ['Curse-Lace Veil', 'curse', 'Signatures curse foes nearby: they take +20% damage for 4s.'],
  'rod+belt':    ['Firebird Plume', 'revive', 'Revives once per siege at 50% HP.'],
  'rod+glove':   ['Bedazzled Scepter', 'sigBoost', 'Signatures deal 40% more damage.'],
  'tear+tear':   ['Bottomless Teacup', 'refill', 'Refunds 40% mana after a signature.'],
  'tear+vest':   ['Bubble Mail', 'bubble', 'Starts each siege with a shield worth 25% max HP.'],
  'tear+cloak':  ['Cup of Plenty', 'teamMana', 'Every hero starts sieges with +20% mana.'],
  'tear+belt':   ['Second-Wind Kettle', 'kettle', 'Every 10s, heals every hero 10% HP.'],
  'tear+glove':  ['Sticky Fingers', 'goldFinger', 'Kills by this hero drop +50% gold.'],
  'vest+vest':   ['Doorframe Cuirass', 'heavyPlate', '+60 more armor. Very heavy. Very safe.'],
  'vest+cloak':  ['Statue Skin', 'statue', 'Once per siege, below 30% HP, turns to stone for 2s and takes no damage.'],
  'vest+belt':   ['Ember Mantle', 'emberAura', 'Burns foes nearby for 3% of the hero\'s max HP every second.'],
  'vest+glove':  ['Can-Opener Gauntlet', 'armorBreak', 'Crits strip 10 armor from the foe, up to 50.'],
  'cloak+cloak': ['Bedsheet Ghost Costume', 'ghost', '+30% more dodge. Very spooky.'],
  'cloak+belt':  ['Swamp Tonic', 'regen', 'Regenerates 3% HP every second.'],
  'cloak+glove': ["Prankster's Hood", 'counter', 'Dodging counterattacks for full damage.'],
  'belt+belt':   ['Big Belt Energy', 'bigBelt', '+60% more HP. Grows the hero.'],
  'belt+glove':  ['Haymakers', 'heavyHands', 'Crits deal bonus damage equal to 5% of the hero\'s max HP.'],
  'glove+glove': ['Lucky Dice', 'dice', '+20% more crit. Crits deal a random 1.5× to 2.5×.'],
  'shard+shard': ['Heart of the Twelve', 'twelve', '+15% attack, ability power and HP. It remembers being a crown.'],
};
for (const c of COMP_KEYS) FINISHED[c + '+shard'] = ['Crest', 'crest', 'Grants the hero a second element.'];
function itemKey(a, b) { const o = [...COMP_KEYS, 'shard']; return o.indexOf(a) <= o.indexOf(b) ? a + '+' + b : b + '+' + a; }
// ===== Super Anvil: two finished items forge into one super item. A Hall tech that opens at siege 29. =====
const SUPER_COST = 40;
const SUPERS = {
  sword: ['Worldsplitter', 'Attack +25%. Attacks splash, every third strikes twice and crits finish weak foes.'],
  bow: ['Stormstring', 'Attack speed +25%. Speeds up with every shot and calls lightning 35% of the time.'],
  rod: ['Starfall Crown', 'Ability power +35% and signatures +20%. Signatures curse foes and double the next 3 attacks.'],
  tear: ['Moonwell Chalice', 'Starts with +30% mana, gains mana every second and from every hit, and refunds mana after a signature.'],
  vest: ['Castle-Heart Armor', '+80 armor. Reflects 30% of melee damage and takes 40% less from ranged foes.'],
  cloak: ['Ghostweave', '+20% dodge. Dodges counterattack.'],
  belt: ["Giant's Girth", 'Max HP +40%. Regenerates 3% HP per second and burns foes nearby.'],
  glove: ["Fortune's Favor", '+25% crit. Crits roll big, hit harder and finish weak foes.'],
};
// the super's flavour comes from the component the two items share most
function superKind(a, b) {
  const n = {}, all = [...a.parts, ...b.parts].filter(p => p !== 'shard');
  for (const p of all) n[p] = (n[p] || 0) + 1;
  let best = all[0] || 'sword'; for (const p of all) if (n[p] > n[best]) best = p; return best;
}
function finishedName(parts, el) { const F = FINISHED[itemKey(...parts)]; return F[1] === 'crest' ? `${ELEMENTS[el].name} Crest` : F[0]; }
function itemName(it) { if (it.sup) return SUPERS[it.sup][0]; if (it.parts.length < 2) return COMPONENTS[it.parts[0]].name; const F = FINISHED[itemKey(...it.parts)]; return F[1] === 'crest' ? `${ELEMENTS[it.el].name} Crest` : F[0]; }
function itemDesc(it) {
  if (it.sup) return `Super item: ${finishedName(it.parts, it.el)} + ${finishedName(it.sub.parts, it.sub.el)}, with both of their powers. ${SUPERS[it.sup][1]}`;
  if (it.parts.length < 2) return COMPONENTS[it.parts[0]].desc;
  const F = FINISHED[itemKey(...it.parts)];
  if (F[1] === 'crest') return `The hero gains ${ELEMENTS[it.el].name} as a second element, plus ${compStat(it.parts.find(p => p !== 'shard') || 'sword', true)}.`;
  const ps = it.parts.filter(p => p !== 'shard'), stats = ps.length === 2 && ps[0] === ps[1] ? compStat(ps[0], true, 2) : ps.map(p => compStat(p, true)).join(', ');
  return stats ? `${stats}. ${F[2]}` : F[2];
}
const ITEM_SLOTS = 3;
// the Hall opens one tier at a time so early sieges have fewer, harder choices
const TECH_OPENS = { 1: 1, 2: 5, 3: 10, 4: 15, 5: 29 };
const TECH_LATE_T1 = { wells: 3, vault1: 3 };
function techOpensAt(id) { const T = TECH[id]; return T.secret ? 1 : TECH_LATE_T1[id] || TECH_OPENS[T.t] || 1; }

// ===== Artificers' Hall tech tree =====
// branch columns: 0 Stonework, 1 Engineering, 2 Alchemy, 3 Logistics ; secret: discovered through encounters
const TECH_BRANCHES = ['Stonework', 'Engineering', 'Alchemy', 'Logistics'];
const TECH = {
  walls1:   { name: 'Thick Walls',        b: 0, t: 1, cost: 30,  req: [],                 desc: '+25% castle max HP, repaired now.' },
  fountain: { name: 'Healing Fountain',   b: 0, t: 2, cost: 65,  req: ['walls1'],         desc: 'Repair 10% castle HP after every siege.' },
  rafters1: { name: 'Rafters',            b: 0, t: 2, cost: 70,  req: ['walls1'],         desc: 'A rafter slot on the wall. Ranged heroes there can shoot across the whole field and are hard to reach. Their shots leave a gold streak.' },
  walls2:   { name: 'Granite Facing',     b: 0, t: 3, cost: 150, req: ['fountain'],       desc: '+35% castle max HP, repaired now.' },
  rafters2: { name: 'More Rafters',       b: 0, t: 3, cost: 155, req: ['rafters1'],       desc: 'Two more rafter slots.' },
  bastion:  { name: 'Spiked Bastion',     b: 0, t: 4, cost: 320, req: ['walls2', 'rafters2'], desc: 'Foes hitting the wall take damage back. +30% castle HP.' },
  ballista1:{ name: 'Ballista',           b: 1, t: 1, cost: 40,  req: [],                 desc: 'A ballista on the wall shoots the nearest foe.' },
  ballista2:{ name: 'Repeating Ballista', b: 1, t: 2, cost: 100, req: ['ballista1'],      desc: 'Ballista reloads 30% faster.' },
  pulleys:  { name: 'Sky Hammer Pulleys', b: 1, t: 2, cost: 85,  req: ['ballista1'],      desc: 'Sky Hammer cooldown −6s and +30% damage.' },
  ballista3:{ name: 'Piercing Bolts',     b: 1, t: 3, cost: 195, req: ['ballista2'],      desc: 'Ballista bolts pierce through the whole line and hit 60% harder.' },
  hammer2:  { name: 'Heavier Hammer',     b: 1, t: 3, cost: 180, req: ['pulleys'],        desc: 'Sky Hammer radius +50% and damage +50%.' },
  superanvil:{ name: 'Super Anvil',      b: 1, t: 5, cost: 350, req: [],                 desc: 'A great anvil in the Armory that forges two finished items into one super item with both powers and a bonus.' },
  kiln:     { name: "Philosopher's Kiln", b: 1, t: 4, cost: 300, req: ['ballista3', 'hammer2'], desc: 'Castle power cooldown −35%.' },
  wells:    { name: 'Mana Wells',         b: 2, t: 1, cost: 45,  req: [],                 desc: 'Heroes begin sieges with +25% mana.' },
  lab:      { name: 'Elemental Lab',      b: 2, t: 2, cost: 110, req: ['wells'],          desc: 'Element choices show 4 cards instead of 3.' },
  resonance:{ name: 'Resonance Coils',    b: 2, t: 2, cost: 115, req: ['wells'],          desc: 'Element combos are 30% stronger.' },
  prism:    { name: 'Prism Array',        b: 2, t: 3, cost: 215, req: ['resonance'],      desc: 'Element combos pulse 30% more often.' },
  focus:    { name: 'Signature Focus',    b: 2, t: 3, cost: 195, req: ['lab'],            desc: 'Signatures deal +25% and start each siege half charged.' },
  aether:   { name: 'Aether Engine',      b: 2, t: 4, cost: 340, req: ['prism', 'focus'], desc: 'Every hero gains +5% attack, ability power and HP.' },
  vault1:   { name: 'Gold Vault',         b: 3, t: 1, cost: 30,  req: [],                 desc: '+15% gold from kills.' },
  scav:     { name: 'Scavengers',         b: 3, t: 2, cost: 85,  req: ['vault1'],         desc: 'Loot after a siege offers 4 choices.' },
  drill:    { name: 'Drill Yard',         b: 3, t: 2, cost: 90, req: ['vault1'],         desc: 'Heroes earn 15% more experience.' },
  vault2:   { name: 'Counting House',     b: 3, t: 3, cost: 165, req: ['scav'],           desc: '+20% gold from kills.' },
  trophy:   { name: 'Trophy Room',        b: 3, t: 3, cost: 185, req: ['drill'],          desc: 'Mini-bosses and bosses drop an extra component.' },
  college:  { name: 'War College',        b: 3, t: 4, cost: 320, req: ['vault2', 'trophy'], desc: 'Heroes earn 25% more experience.' },
  // secrets (discovered by encounters)
  goose:    { name: 'Goose Moat',         b: 4, secret: true, cost: 35,  req: [], desc: 'Geese guard the gate and honk at foes that reach the wall, biting for damage.' },
  cheese:   { name: 'Cheese Trebuchet',   b: 4, secret: true, cost: 55,  req: [], desc: 'Every 7s a wheel of cheese rolls down the field, bowling foes over.' },
  bard:     { name: 'Bard Tower',         b: 4, secret: true, cost: 50,  req: [], desc: 'Every 18s the bard plays a rousing number: heroes +40% attack speed for 5s.' },
  pigeon:   { name: 'Pigeon Post',        b: 4, secret: true, cost: 40,  req: [], desc: 'Hero drafts offer one more champion.' },
  mimic:    { name: 'Mimic Pantry',       b: 4, secret: true, cost: 65, req: [], desc: 'A friendly mimic spits out a component after every third siege.' },
  intern:   { name: 'Necromancy Intern',  b: 4, secret: true, cost: 60, req: [], desc: 'Hires two skeleton helpers who fight beside your heroes in every siege. They are interns. They are trying their best.' },
  hottub:   { name: 'Hero Hot Tub',       b: 4, secret: true, cost: 70, req: [], desc: 'Heroes regenerate 1.2% HP per second during sieges.' },
};

// ===== Diamond meta (between runs) =====
const META = {
  masonry: { name: 'Masonry',        max: 6, cost: l => 4 + l * 4, desc: l => `Castle starts with +15% HP (now +${l * 15}%).` },
  hammer:  { name: 'Sky Hammer',     max: 5, cost: l => 4 + l * 4, desc: l => `+25% Sky Hammer damage and −2s cooldown (now rank ${l}).` },
  drills:  { name: 'Champion Drills',max: 6, cost: l => 5 + l * 5, desc: l => `All heroes +10% HP and attack (now +${l * 10}%).` },
  veterans: { name: 'Veteran Recruits', max: 3, cost: l => 15 + l * 15, desc: l => `Champions join one level higher per rank (now +${l}).` },
  codex:   { name: 'Arcane Codex',   max: 5, cost: l => 5 + l * 5, desc: l => `Signatures +15% power, heroes start +10% mana (now rank ${l}).` },
  banners: { name: 'War Banners',    max: 4, cost: l => 8 + l * 6, desc: l => `Element combos and synergies +15% stronger (now +${l * 15}%).` },
  chest:   { name: 'Lucky Purse',    max: 5, cost: l => 3 + l * 3, desc: l => `+8% gold from kills (now +${l * 8}%). Runs still start with no gold.` },
  muster:  { name: 'Scout Network',  max: 1, cost: l => 25,        desc: l => `Hero drafts offer one more champion (${l ? 'owned' : 'not owned'}).` },
};

// ===== Class specs (meta) =====
// each class picks one path. Path a makes the champion's own signature bigger, path b swaps it for a class-wide one.
// rank 1 picks the path, ranks 2 and 3 strengthen it. Switching paths is free and keeps the rank.
const SPEC_COST = [12, 25, 45];
const SPECS = {
  guardian:  { a: { name: 'Unbreakable', desc: r => `Guardian signatures are ${40 * r}% stronger and one rank higher.` },
               b: { name: 'Bastion Dome', ability: 'aegisDome', desc: r => `Guardians cast Bastion Dome instead: every hero gets a big shield and nearby foes are blasted back and stunned. Power ${100 + 25 * (r - 1)}%.` } },
  berserker: { a: { name: 'Bloodlust', desc: r => `Berserker signatures are ${40 * r}% stronger and one rank higher.` },
               b: { name: 'Blood Frenzy', ability: 'bloodFrenzy', desc: r => `Berserkers cast Blood Frenzy instead: they heal, double their attack speed and hit much harder for a few seconds. Power ${100 + 25 * (r - 1)}%.` } },
  ranger:    { a: { name: 'Eagle Eye', desc: r => `Ranger signatures are ${40 * r}% stronger and one rank higher.` },
               b: { name: 'Hawk Strike', ability: 'hawkStrike', desc: r => `Rangers cast Hawk Strike instead: a spirit hawk dives across a whole lane, and every foe it hits takes 20% more damage. Power ${100 + 25 * (r - 1)}%.` } },
  mage:      { a: { name: 'Archmage', desc: r => `Mage signatures are ${40 * r}% stronger and one rank higher.` },
               b: { name: 'Meteor', ability: 'meteor', desc: r => `Mages cast Meteor instead: after a short warning, a huge meteor flattens the biggest crowd. Power ${100 + 25 * (r - 1)}%.` } },
  cleric:    { a: { name: 'High Priest', desc: r => `Cleric signatures are ${40 * r}% stronger and one rank higher.` },
               b: { name: 'Mass Resurrection', ability: 'massRez', desc: r => `Clerics cast Mass Resurrection instead: every fallen hero gets back up and the whole team heals. Power ${100 + 25 * (r - 1)}%.` } },
  rogue:     { a: { name: 'Assassin', desc: r => `Rogue signatures are ${40 * r}% stronger and one rank higher.` },
               b: { name: 'Shadow Clones', ability: 'shadowClones', desc: r => `Rogues cast Shadow Clones instead: two shadow copies join the fight for the rest of the siege. Power ${100 + 25 * (r - 1)}%.` } },
};
const SPEC_ADESC = { aegisDome: 'Taunts foes in a wide circle, shields every hero for {0} and blasts nearby foes back for {1}, stunning them.', bloodFrenzy: 'Heals {0}, then attacks twice as fast and hits much harder for a few seconds.', hawkStrike: 'A spirit hawk dives across a whole lane for {0}. Foes it hits take 20% more damage.', meteor: 'After a short warning, a huge meteor flattens the biggest crowd for {0}.', massRez: 'Every fallen hero gets back up and the whole team heals for {0}.', shadowClones: 'Two shadow copies join the fight for the rest of the siege.' };

// ===== Signature scalings (Cam 2026-10-15): every number on a signature comes from AD, AP and HP, so items matter.
// ad/ap: share of attack damage / ability power, hp: share of the caster's max HP, thp: share of the target's max HP.
const SIG_SCALE = {
  shieldBash: [{ ad: 0.6, hp: 0.05 }, { hp: 0.25, ap: 1 }],
  fireball: [{ ad: 0.5, ap: 2.4 }],
  bladeDance: [{ ad: 1.5, ap: 0.3 }, { ad: 0.6, ap: 0.3 }],
  arrowRain: [{ ad: 0.6, ap: 0.2 }],
  whirlwind: [{ ad: 0.5, hp: 0.015 }],
  boneWall: [{ base: 40, ap: 1.5 }],
  lilySplash: [{ ap: 3.5, thp: 0.1 }],
  pounce: [{ ad: 3.5, ap: 0.7 }, { ad: 1, ap: 0.3 }],
  quake: [{ ad: 2.4, hp: 0.04 }],
  chainLightning: [{ ad: 0.3, ap: 1.7 }],
  dawnMend: [{ ap: 2.5, thp: 0.12 }, { ad: 0.2, ap: 0.6 }],
  cannonball: [{ ad: 3.2, ap: 0.8 }],
  raiseDead: [{ ap: 6, hp: 0.15 }, { ap: 0.45, ad: 0.15 }],
  tongueLash: [{ ad: 2.4, ap: 1 }, { ad: 0.8, ap: 0.3 }],
  thunderRoar: [{ base: 25, ap: 0.7, pct: true }, { ad: 0.2, ap: 0.8 }],
  warDrums: [{ ap: 1.2, thp: 0.06 }, { ad: 0.1, ap: 0.5 }],
  sunlance: [{ ad: 3.6, ap: 1 }, { ad: 0.2, ap: 0.3 }],
  rampage: [{ ad: 1.8, hp: 0.04 }, { ad: 0.8 }],
  earthsplitter: [{ ad: 4.2, hp: 0.08 }, { ad: 0.25, hp: 0.008 }],
  deathMark: [{ ad: 5, ap: 2 }],
  greatFlood: [{ ad: 0.4, ap: 1.9 }],
  runicAegis: [{ hp: 0.2, ap: 1.5 }, { hp: 0.03, ap: 0.5 }],
  bloom: [{ ap: 2, thp: 0.12 }],
  stampede: [{ ad: 0.5, ap: 2.5 }],
  aegisDome: [{ hp: 0.18, ap: 1.5 }, { ad: 0.6, hp: 0.06 }],
  bloodFrenzy: [{ hp: 0.3 }],
  hawkStrike: [{ ad: 2.7, ap: 0.8 }],
  meteor: [{ ad: 0.8, ap: 4.3 }],
  massRez: [{ ap: 1.5, thp: 0.1 }],
  shadowClones: [{ ap: 1 }],
  cinderColossus: [{ ad: 0.4, ap: 1.8 }, { ad: 0.2, ap: 0.7 }],
  glacierLance: [{ ad: 3.0, ap: 0.6 }],
  cryptGrasp: [{ ad: 0.4, hp: 0.1 }],
  tempestCage: [{ ad: 0.3, ap: 1.6 }, { ad: 0.1, ap: 0.6 }],
  rocketBarrage: [{ ad: 1.1, ap: 0.3 }],
  lotusSanctuary: [{ ap: 0.35, thp: 0.015 }, { ap: 1.5, thp: 0.08 }],
  bellToll: [{ ad: 0.5, hp: 0.06 }, { ad: 0.1, hp: 0.025 }],
  mountainRoll: [{ ad: 0.4, hp: 0.12 }],
  coralBastion: [{ ap: 0.5, hp: 0.05 }],
  tombOfKings: [{ ad: 0.6, hp: 0.1 }, { hp: 0.12, ap: 1 }],
  clockworkMoon: [{ ad: 0.2, ap: 0.9 }],
  starfall: [{ ad: 0.2, ap: 0.9 }, { ad: 0.3, ap: 2 }],
  cauldron: [{ ad: 0.3, ap: 1.6 }, { ap: 0.35 }],
  sawblades: [{ ad: 0.9, ap: 0.2 }],
  guillotine: [{ ad: 3, ap: 0.8 }],
  alleyAmbush: [{ ad: 0.8, ap: 0.2 }],
  eclipse: [{ ad: 2.2, ap: 0.6 }],
  bogJaws: [{ ad: 1.6, ap: 0.4 }],
  skyhawks: [{ ad: 1, ap: 0.2 }],
  ballista: [{ ad: 2.6, ap: 0.4 }, { ad: 1 }],
  arrowOfDawn: [{ ad: 1, ap: 0.3 }, { ap: 1, thp: 0.05 }],
  lilyBombs: [{ ad: 0.8, ap: 0.4 }],
  bloodMoon: [{ ad: 2, hp: 0.03 }, { ad: 0.3 }],
  anvilDrop: [{ ad: 3, hp: 0.05 }, { ad: 0.8 }],
  avalanche: [{ ad: 2.4, hp: 0.06 }],
  soulHarvest: [{ ad: 2.6, hp: 0.06 }, { hp: 0.06 }],
  groveOfRenewal: [{ ap: 0.6, thp: 0.025 }],
  cathedral: [{ ap: 2, thp: 0.1 }],
  lanterns: [{ ap: 1.2, thp: 0.06 }, { ap: 0.25, thp: 0.01 }],
  rainOfPlenty: [{ ap: 0.3, thp: 0.012 }, { ad: 0.15, ap: 0.5 }],
};
// the caster-side value of a scaling line (target-HP shares are added per target by the ability)
function scaleValue(c, st, maxHp) { return (c.base || 0) + (c.ad || 0) * (st.atk || 0) + (c.ap || 0) * (st.apv || 0) + (c.hp || 0) * (maxHp || st.hp || 0); }
function scaleParts(c) {
  const out = [], pc = v => Math.round(v * 100) + '%';
  if (c.ad) out.push(`<span class="sc-ad">${pc(c.ad)} AD</span>`); if (c.ap) out.push(`<span class="sc-ap">${pc(c.ap)} AP</span>`); if (c.hp) out.push(`<span class="sc-hp">${pc(c.hp)} max HP</span>`);
  return out.join(' + ');
}
// colour of the scaling that adds the most, so the total reads as "an AP spell" at a glance
function scaleKind(c, st) {
  const ad = (c.ad || 0) * (st ? st.atk || 0 : 1), ap = (c.ap || 0) * (st ? st.apv || 0 : 1), hp = (c.hp || 0) * (st ? st.hp || 0 : 10) + (c.thp ? 1e-6 : 0);
  return hp > ad && hp > ap ? 'hp' : ap > ad ? 'ap' : ad > 0 ? 'ad' : c.thp ? 'hp' : 'base';
}
// "84 (50% AD + 240% AP)" with stats, the bare scaling without
function scaleText(c, st) {
  const parts = scaleParts(c), thp = c.thp ? `<span class="sc-hp">${Math.round(c.thp * 100)}% of their max HP</span>` : '';
  if (c.pct) { const v = st ? Math.round(scaleValue(c, st) * (st.sigMul || 1)) : null; return `<b class="sv sv-${scaleKind(c, st)}">${v != null ? '+' + v + '%' : '+' + c.base + '%'}</b>` + ` (${parts.replace(/(\d+)% AP/, (m, n) => (n / 100) + '% per AP')})`; }
  if (!st) return [c.base ? String(c.base) : '', parts, thp].filter(Boolean).join(' + ');
  const v = Math.round(scaleValue(c, st) * (st.sigMul || 1));
  return `<b class="sv sv-${scaleKind(c, st)}">${v}</b>${parts ? ` (${parts})` : ''}${thp ? ' + ' + thp : ''}`;
}
function abilityText(ab, desc, st) { const S = SIG_SCALE[ab] || []; return String(desc || '').replace(/\{(\d)\}/g, (m, i) => S[+i] ? scaleText(S[+i], st) : m); }

// ===== Field hazards: a card can change the battlefield for the next siege only =====
// kind picks the mechanic, so several hazards can share one (mud, slime and snow all slow walkers).
const HAZARDS = {
  flood:    { kind: 'flood', name: 'Flooded Field', short: 'Flood', col: '#5fb8ff', desc: 'A channel of water crosses the field. Anyone wading through is slowed. Foes stay slowed for a moment after they climb out, and soaked foes take 15% more damage.' },
  mud:      { kind: 'mud', name: 'Mud Season', short: 'Mud', col: '#a07a4a', desc: 'Ankle-deep mud everywhere. Everyone on foot moves 25% slower.' },
  slime:    { kind: 'mud', name: 'Bog Slime', short: 'Slime', col: '#7ad46a', desc: 'Sticky slime covers the field. Everyone on foot moves 25% slower.' },
  snow:     { kind: 'mud', name: 'Snowdrifts', short: 'Snow', col: '#e8f4ff', desc: 'Deep snow everywhere. Everyone on foot moves 25% slower.' },
  fog:      { kind: 'fog', name: 'Thick Fog', short: 'Fog', col: '#c9d0d8', desc: 'Nobody can see far. Every ranged attacker, yours and theirs, loses 30% range.' },
  rocks:    { kind: 'rocks', name: 'Rock Rain', short: 'Rocks', col: '#b0a090', desc: 'Goblin catapults lob rocks all siege. Watch for the red circles: rocks hit heroes and foes alike.' },
  embers:   { kind: 'embers', name: 'Falling Embers', short: 'Embers', col: '#ff8a3a', desc: 'Burning bits drift down and set patches of the field alight. Fire burns anyone standing in it.' },
  gale:     { kind: 'gale', name: 'Gale', short: 'Gale', col: '#dff4ff', desc: 'A gale blows at the castle. Foes march 20% faster, but your heroes attack 20% faster too.' },
  goldrush: { kind: 'goldrush', name: 'Gold Rush', short: 'Gold Rush', col: '#ffd84a', desc: 'Foes carry 50% more gold, but they are 20% tougher.' },
};

// little chips on each choice so a card reads at a glance: what you get, what it costs
function encTags(fx) {
  const t = [];
  for (const f of fx.split(',')) { const [k, a] = f.split(':'), n = +a;
    if (k === 'hz' && HAZARDS[a]) t.push({ k: 'hz', s: HAZARDS[a].short + ' next siege' });
    else if (k === 'gold') t.push(n >= 0 ? { k: 'gold', s: 'Gold' } : { k: 'cost', s: `−${-n} gold` });
    else if (k === 'pay') t.push({ k: 'cost', s: `−${n} gold` });
    else if (k === 'xpAll' || k === 'xpOne') t.push({ k: 'xp', s: k === 'xpAll' ? 'XP for all' : 'XP' });
    else if (k === 'reforge') t.push({ k: 'forge', s: 'Reforge' });
    else if (k === 'item' || k === 'comp' || k === 'haggle') t.push({ k: 'item', s: 'Item' });
    else if (k === 'heal' || k === 'maxhp') t.push({ k: 'walls', s: 'Walls' });
    else if (k === 'secret') t.push({ k: 'secret', s: 'Discovery' });
    else if (k === 'mood') t.push(n > 0 ? { k: 'kind', s: 'Kind' } : { k: 'rude', s: 'Grudge' });
    else if (k === 'mod' && ['fewer', 'tiny', 'bosssoft'].includes(a)) t.push({ k: 'good', s: 'Weaker horde' });
    else if (k === 'mod' && ['curse', 'chickens', 'honked', 'bossmad'].includes(a)) t.push({ k: 'risk', s: 'Tougher horde' });
    else if (k === 'mod' && ['inspire', 'tonic', 'giant'].includes(a)) t.push({ k: 'good', s: 'Hero buff' });
    else if (k === 'mod' && a === 'partyhats') t.push({ k: 'gold', s: 'Party hats' });
    else if (k === 'gamble' || k === 'duel') t.push({ k: 'risk', s: 'Gamble' }); }
  return t;
}

// ===== Encounters: between sieges, mostly unhinged =====
// opts fx: comma list of effects. sub = what the player is told.
// Trade-off cards bend the next siege (hz: field hazards, mod: horde changes). Boon cards (boon: true) are all upside:
// gold, XP for everyone, or reforging an item, and the player picks which.
const ENCOUNTERS = [
  { id: 'gobunion', title: 'The Goblin Union Is On Strike', text: 'The horde is picketing outside the walls. Their signs say "FAIR WAGES" and "DENTAL" and one just says "ROCKS". A goblin with a megaphone wants to negotiate.',
    opts: [{ label: 'Offer dental', fx: 'gold:-20,mod:fewer', sub: 'Lose 20 gold. Half the strikers stay home next siege.' }, { label: 'Break the strike', fx: 'gold:45,hz:rocks', sub: 'You raid the union fund. Next siege the strikers throw their signs, then their rocks, at everyone.' }] },
  { id: 'gobcatapult', title: 'Catapult Malfunction', text: 'A goblin catapult misfired and launched a sack into your courtyard. The sack is clanking. The catapult is still firing.',
    opts: [{ label: 'Open the sack', fx: 'item:any,hz:rocks', sub: 'A finished item. The catapult crew wants it back and keeps lobbing rocks all next siege.' }, { label: 'Return to sender', fx: 'gold:30,xpAll:20', sub: 'Throw it back over the wall. The goblins pay a ransom out of confusion.' }] },
  { id: 'rentdue', title: 'The Rent Is Due', text: 'A goblin in a tiny waistcoat slides an invoice under the gate. It says the field outside your castle is a rental. Late fees are itemized on a second invoice.',
    opts: [{ label: 'Pay the rent', fx: 'pay:30,xpAll:35', sub: 'Spend 30 gold. The goblins throw your heroes a housewarming party.' }, { label: 'Refuse to pay', fx: 'gold:30,hz:rocks', sub: 'The invoice envelope had 30 gold in it. Collections arrives next siege with a catapult.' }] },
  { id: 'leakyditch', title: 'The Ditch Is Leaking', text: 'The goblin ditch by your walls sprang a leak. Water is pooling across the field and a frog has declared it a sovereign nation.',
    opts: [{ label: 'Let it flood', fx: 'hz:flood,xpAll:20', sub: 'Foes wade through it next siege: slowed and soaked. Mind your melee heroes, they wade too.' }, { label: 'Patch it', fx: 'pay:20,heal:25', sub: 'Spend 20 gold. The masons patch the ditch and your walls on the way back.' }] },
  { id: 'mudseason', title: 'Mud Season', text: 'It rained for three days. The field is now soup. A pig is having the best week of its life.',
    opts: [{ label: 'Charge pig rides', fx: 'gold:45,hz:mud', sub: 'Big money. Next siege everyone on foot slogs 25% slower, heroes too.' }, { label: 'Lay down planks', fx: 'pay:20,xpAll:30', sub: 'Spend 20 gold. Your heroes learn carpentry.' }] },
  { id: 'dragoncold', title: 'A Dragon With a Cold', text: 'A dragon is camped beside the field with a terrible cold. Every sneeze sets something on fire. It apologizes after each one.',
    opts: [{ label: 'Bring it soup', fx: 'xpAll:25,heal:15', sub: 'It sneezes gratefully onto nothing important.' }, { label: 'Sell tickets', fx: 'gold:55,hz:embers', sub: 'Crowds love it. Next siege burning patches fall on the field and burn anyone in them.' }] },
  { id: 'windmill', title: "The Wizard's Windmill", text: 'A wizard bolted a windmill to your tower. It runs backwards and makes weather. He will not say why.',
    opts: [{ label: 'Switch it on', fx: 'hz:gale,xpOne:80', sub: 'Gale next siege: foes march 20% faster, your heroes attack 20% faster. A hero clings on for 80 XP.' }, { label: 'Sell it for parts', fx: 'gold:40', sub: 'The wizard is offended but takes the money.' }] },
  { id: 'fogman', title: 'Fog Machine Salesman', text: '"It is the future of siege warfare." He pulls a lever. Nobody can see him anymore. He keeps talking.',
    opts: [{ label: 'Buy the demo model', fx: 'pay:15,hz:fog,mod:fewer', sub: 'Spend 15 gold. Thick fog next siege cuts all ranged attacks by 30%, and a quarter of the horde gets lost in it.' }, { label: 'Find him and shoo him', fx: 'xpAll:25', sub: 'It takes hours. He was behind you the whole time.' }] },
  { id: 'goldrush', title: 'Gold in the Field', text: 'Prospectors struck gold right where the horde likes to march. So did the horde. Everyone is digging.',
    opts: [{ label: 'Let them dig', fx: 'hz:goldrush', sub: 'Next siege foes carry 50% more gold, but all that digging made them 20% tougher.' }, { label: 'Claim it first', fx: 'gold:35', sub: 'You stake the claim. Modest but safe.' }] },
  { id: 'snowday', title: 'A Wizard Sneezed Snow', text: 'It is midsummer. There are four feet of snow on the field. The wizard says "bless me" to himself and leaves.',
    opts: [{ label: 'Build snow forts', fx: 'hz:snow,heal:20', sub: 'Next siege everyone on foot slogs 25% slower. The snow packs your wall cracks too.' }, { label: 'Sell snowcones', fx: 'gold:40', sub: 'In midsummer, the queue goes twice round the keep.' }] },
  { id: 'gobwedding', title: 'You Are Invited to a Goblin Wedding', text: 'Grubnose\'s cousin is getting married between sieges. The invitation is written in mud. Plus-ones welcome. Weapons mandatory.',
    opts: [{ label: 'Attend and dance', fx: 'xpAll:40,hz:mud', sub: 'Your heroes dance badly but sincerely. The dance floor was the field. It is mud now.' }, { label: 'Object to the marriage', fx: 'duel', sub: 'Your best hero fights the groom. Probably wins.' }] },
  { id: 'gobmom', title: "Grubnose's Mom", text: 'A tiny goblin grandmother is knocking on the gate with a casserole. "Have you seen my boy? Big crown. Smells like feet."',
    opts: [{ label: 'Tell her the truth', fx: 'xpAll:50', sub: 'She cries, hugs every hero, and teaches them a thing or two.' }, { label: 'Lie and take the casserole', fx: 'gold:45,mod:curse', sub: 'It is delicious. The next horde senses your guilt: +30% HP.' }] },
  { id: 'gobstartup', title: 'A Goblin Business Plan', text: 'Three goblins with one clipboard each pitch a rock delivery service. They need investors. The business plan is drawn on a cave wall.',
    opts: [{ label: 'Invest 40 gold', fx: 'pay:40,gamble', sub: 'A random hero becomes a partner. Results will vary. The goblins insist this is normal.' }, { label: 'Steal the idea', fx: 'gold:35,hz:rocks', sub: 'You launch it first. The goblins demonstrate the product on your field next siege.' }] },
  { id: 'gobmime', title: 'A Goblin Mime', text: 'He is trapped in an invisible box. He has been trapped in it since the last siege. He looks genuinely distressed.',
    opts: [{ label: 'Free him', fx: 'mustache', sub: 'Grateful, he paints a mustache on a hero. It does not wash off.' }, { label: 'Applaud', fx: 'xpOne:90', sub: 'A hero learns the art of silence. And 90 XP.' }] },
  { id: 'gobtavern', title: 'The Wrong Tavern', text: 'Your heroes went for drinks and ended up in a goblin tavern. Everyone is staring. The fireplace is large and nobody is minding it.',
    opts: [{ label: 'Buy a round for the house', fx: 'pay:30,mod:inspire', sub: 'Spend 30 gold. Heroes +25% attack next siege, mostly from confidence.' }, { label: 'Start a bar fight', fx: 'xpAll:35,hz:embers', sub: 'You win. Someone kicked the fireplace. Embers rain on the field next siege.' }] },
  { id: 'gobfortune', title: 'Goblin Fortune Teller', text: '"I see... a castle. And goblins. Many goblins. Hitting it." She is not wrong. She wants a coin.',
    opts: [{ label: 'Pay for the full reading', fx: 'pay:15,gold:45', sub: 'She reveals where some treasure is buried. It is under her chair.' }, { label: 'Ask about the weather', fx: 'hz:fog,mod:fewer', sub: '"Foggy," she says, and it is. A quarter of the horde gets lost. Ranged attacks lose 30% range.' }] },
  { id: 'goose', title: 'A Goose Has Entered the Keep', text: 'Nobody let it in. It has taken the throne and will not be moved. It honks at the Sky Hammer.',
    opts: [{ label: 'Befriend the goose', fx: 'secret:goose', sub: 'Discovers the Goose Moat in the Artificers\' Hall' }, { label: 'Chase it out', fx: 'xpAll:30,mod:honked', sub: 'Heroes earn 30 XP. The goose writes something down.' }] },
  { id: 'accountant', title: "The Horde's Accountant", text: 'A goblin in tiny spectacles is auditing your siege. "You killed 40 of our employees. That\'s a lot of paperwork."',
    opts: [{ label: 'Pay the "fine"', fx: 'gold:-25,mod:fewer', sub: 'Lose 25 gold. Next siege has 25% fewer foes.' }, { label: 'Commit light tax fraud', fx: 'gold:60,mod:curse', sub: '+60 gold. Next horde is 30% tougher and furious.' }] },
  { id: 'barrel', title: 'Wizard Stuck in a Barrel', text: '"Don\'t ask how. Just roll me somewhere useful." The barrel is humming.',
    opts: [{ label: 'Roll him to the Armory', fx: 'comp:rod', sub: 'He leaves a Wand of Mild Peril behind' }, { label: 'Roll him downhill', fx: 'xpOne:90,hz:mud', sub: 'A hero chases him for 90 XP. The barrel leaks potion. The field turns to mud.' }] },
  { id: 'trenchcoat', title: 'Three Kobolds in a Trench Coat', text: '"Hello. I am a normal human consultant. I would like to improve your castle." One of the kobolds sneezes.',
    opts: [{ label: 'Hire the consultant', fx: 'xpAll:35,hz:fog', sub: 'They teach your heroes some tricks. Their smoke machine fogs the next siege.' }, { label: 'Pull off the coat', fx: 'gold:45', sub: 'They scatter, leaving the consulting fee behind.' }] },
  { id: 'cheese', title: 'The Cheese Wheel of Destiny', text: 'An enormous wheel of cheese is rolling toward the keep. It has been rolling for three days. It is still accelerating.',
    opts: [{ label: 'Catch it with engineering', fx: 'secret:cheese', sub: "Discovers the Cheese Trebuchet" }, { label: 'Eat it', fx: 'heal:30,xpAll:20', sub: 'Repair 30% castle. Heroes +20 XP. Everyone is sleepy.' }] },
  { id: 'mimic', title: 'The Mimic Wants a Hug', text: 'A treasure chest with a long tongue is looking at you with enormous eyes.',
    opts: [{ label: 'Hug it', fx: 'secret:mimic,comp:any', sub: 'It loves you. Discovers the Mimic Pantry and spits out a component.' }, { label: 'Hug it, but nervously', fx: 'item:any', sub: 'It respects the caution and gives you a finished item' }] },
  { id: 'chicken', title: 'A Very Confident Chicken', text: 'A chicken has challenged your strongest champion to a duel. It is doing warm-up stretches.',
    opts: [{ label: 'Accept the duel', fx: 'duel', sub: 'Your strongest hero duels the chicken for honor and XP' }, { label: 'Decline', fx: 'mod:chickens', sub: 'It brings friends to the next siege. Many friends.' }] },
  { id: 'groupchat', title: "The Horde's Mail Came Here", text: 'The horde\'s mailbag was left at your gate. 214 letters. Mostly complaints about the food. One says "everyone attack the left side".',
    opts: [{ label: 'Read the plans', fx: 'mod:fewer,xpAll:15', sub: 'Next siege is smaller. Heroes +15 XP from reading the complaints.' }, { label: 'Send party invitations', fx: 'mod:partyhats', sub: 'The horde is distracted. They arrive wearing party hats.' }] },
  { id: 'painter', title: 'The Royal Portrait Painter', text: '"Hold still. Look heroic. No, MORE heroic." Your champion has been posing for six hours.',
    opts: [{ label: 'Add a mustache', fx: 'mustache', sub: 'A random hero grows a magnificent mustache: +5% attack, ability power and HP' }, { label: 'Sell the painting', fx: 'gold:55', sub: '+55 gold. It was a bad painting.' }] },
  { id: 'trebuchet', title: 'Package Delivered by Mistake', text: 'A crate addressed to "The Other Castle" arrived. It contains one humming crystal splinter and a feather. A goose feather.',
    opts: [{ label: 'Keep it', fx: 'comp:shard', sub: 'A Stray Shard. It combines into elemental crests.' }, { label: 'Send it on', fx: 'gold:60', sub: '+60 gold. The courier pays a finder\'s fee.' }] },
  { id: 'intern', title: 'The Necromancy Intern', text: '"I was told to raise the dead but I raised dinner." The roast chicken is walking around. It seems happy.',
    opts: [{ label: 'Give them a job', fx: 'secret:intern', sub: 'Discovers the Necromancy Intern' }, { label: 'Eat the walking dinner', fx: 'xpAll:25,heal:15', sub: 'Heroes +25 XP and the castle is repaired 15%' }] },
  { id: 'bard', title: 'A Bard at the Gate', text: 'Their song about your last siege is wildly exaggerated. In this version, your castle can fly.',
    opts: [{ label: 'Build them a stage', fx: 'secret:bard', sub: 'Discovers the Bard Tower' }, { label: 'Let them sing once', fx: 'mod:inspire,hz:gale', sub: 'Heroes +25% attack. The song is so loud it whips up a gale next siege.' }] },
  { id: 'pigeons', title: 'Pigeons With Opinions', text: 'Forty pigeons have landed on the walls and are all looking at you. One has a tiny scroll.',
    opts: [{ label: 'Read the scroll', fx: 'secret:pigeon', sub: 'Discovers Pigeon Post (one more champion to pick from in the Guild Hall)' }, { label: 'Feed the pigeons', fx: 'xpAll:20,gold:20', sub: 'They leave gold on the walls in thanks. Heroes +20 XP.' }] },
  { id: 'hottub', title: 'Hot Spring Under the Keep', text: 'The dwarves dug too deep. They found a hot spring. The dwarves are now refusing to leave the hot spring.',
    opts: [{ label: 'Build a hot tub', fx: 'secret:hottub', sub: 'Discovers the Hero Hot Tub' }, { label: 'Pipe it onto the field', fx: 'hz:flood,heal:15', sub: 'A warm river crosses the field next siege. Foes wading in are slowed and soaked.' }] },
  { id: 'alchemist', title: 'Free Sample Day', text: 'The alchemist is offering free samples. All the potions are bubbling. One is screaming quietly.',
    opts: [{ label: 'Drink the screaming one', fx: 'gamble', sub: '55%: a random hero gains a huge pile of XP. 45%: they turn tiny for a siege.' }, { label: 'Drink the calm one', fx: 'mod:tonic', sub: 'Heroes start the next siege at full mana' }] },
  { id: 'mushroom', title: 'A Suspicious Mushroom', text: 'It is red with white dots and smells faintly of ambition.',
    opts: [{ label: 'Feed it to a hero', fx: 'mod:giant', sub: 'Heroes are GIANT next siege: +40% HP and bigger' }, { label: 'Feed it to the horde', fx: 'mod:tiny', sub: 'The next horde is tiny. Weaker, but very fast.' }] },
  { id: 'dragon', title: "A Dragon's Garage Sale", text: 'Everything must go. The dragon is downsizing to a smaller cave. Prices are negotiable, and so is the fire.',
    opts: [{ label: 'Buy the mystery box (40g)', fx: 'pay:40,item:any', sub: 'Costs 40 gold. A finished item.' }, { label: 'Haggle aggressively', fx: 'haggle', sub: '50%: two free components. 50%: the castle gets singed.' }] },
  { id: 'masons', title: 'Traveling Masons', text: 'A crew of masons offers a quick patch-up. They are already eating your bread.',
    opts: [{ label: 'Quick patch', fx: 'heal:35', sub: 'Repair 35% castle HP' }, { label: 'Proper job (50g)', fx: 'maxhp', sub: '+15% castle max HP, costs 50 gold' }] },
  // ---- boon cards: every choice is good. Gold, XP for everyone, or reforge an item ----
  { id: 'merchant', boon: true, title: 'A Grateful Merchant', text: 'Your heroes saved her caravan from the horde last siege. She insists on paying you back, and she has options.' },
  { id: 'smith', boon: true, title: 'The Wandering Smith', text: 'A smith with a portable anvil and enormous forearms is passing through. "Coin, a lesson, or a bit of hammering. Pick one."' },
  { id: 'festival', boon: true, title: 'Festival of the Walls', text: 'The townsfolk are throwing a festival because the castle is still standing. Everyone wants to give your heroes something.' },
  { id: 'geode', boon: true, title: 'A Glittering Geode', text: 'Diggers in the cellar hit something sparkly. It hums the castle anthem and seems happy to help.' },
  { id: 'tinker', boon: true, title: 'The Wandering Tinker', text: 'A tinker with a squeaky cart offers a trade from the pile. Everything on it is, suspiciously, exactly what you need.' },
  { id: 'luckycoin', boon: true, title: 'The Lucky Coin', text: 'A coin landed on its edge in the courtyard and stayed there. The court wizard says this is a once-a-century omen. Of what, he is not sure.' },
];
// the three choices on every boon card
function boonOpts(run) {
  return [{ label: 'Take the gold', fx: 'gold:55', sub: 'A fat purse for the Guild Hall or the Artificers.' },
    { label: 'Train every hero', fx: 'xpAll:45', sub: 'Every champion on your roster gains XP.' },
    { label: 'Reforge an item', fx: 'reforge', sub: 'Pick one of your finished items and turn it into a different one. Shuffles your build.' }];
}

// ===== Temperaments: every champion is born with one. Half are good-guy energy, half bad-guy energy.
// Each one trades a strength for a weakness. Two champions on the field with the same temperament unlock its pair bonus.
const TEMPERS = {
  heroic:     { name: 'Heroic',     side: 'good', icon: '🦸', up: '+20% HP', down: '−10% ability power', fx: s => { s.hp *= 1.2; s.ap *= 0.9; },
                pair: 'Shining Example', pdesc: 'Both Heroic champions +15% attack.', pfx: s => { s.atk *= 1.15; } },
  cheerful:   { name: 'Cheerful',   side: 'good', icon: '😄', up: 'Starts sieges with +25% mana', down: '−10% HP', fx: s => { s.startMana += 0.25; s.hp *= 0.9; },
                pair: 'Good Vibes', pdesc: 'The whole team +10% attack speed.', team: s => { s.as *= 1.1; } },
  honorable:  { name: 'Honorable',  side: 'good', icon: '🎖️', up: '+25 armor', down: '−10% attack', fx: s => { s.armor += 25; s.atk *= 0.9; },
                pair: 'Code of Honor', pdesc: 'Both Honorable champions take 15% less damage.', pfx: s => { s.dmgTaken *= 0.85; } },
  wholesome:  { name: 'Wholesome',  side: 'good', icon: '🧸', up: 'Regenerates 1% HP per second', down: '−10% attack speed', fx: s => { s.regen += 0.01; s.as *= 0.9; },
                pair: 'Group Hug', pdesc: 'The whole team regenerates 0.6% HP per second.', team: s => { s.regen += 0.006; } },
  zealous:    { name: 'Zealous',    side: 'good', icon: '🔥', up: '+15% attack speed', down: '−15 armor', fx: s => { s.as *= 1.15; s.armor -= 15; },
                pair: 'Crusade', pdesc: 'Both Zealous champions +20% damage to bosses.', pfx: s => { s.bossDmg += 0.2; } },
  wise:       { name: 'Wise',       side: 'good', icon: '🦉', up: '+20% ability power', down: '−10% attack speed', fx: s => { s.ap *= 1.2; s.as *= 0.9; },
                pair: 'Council of Elders', pdesc: 'Both Wise champions: signatures +20%.', pfx: s => { s.sigMul *= 1.2; } },
  loyal:      { name: 'Loyal',      side: 'good', icon: '🐕', up: '+15% HP and +10% attack', down: 'Signature charges 20% slower', fx: s => { s.hp *= 1.15; s.atk *= 1.1; s.manaGain *= 0.8; },
                pair: 'Brothers in Arms', pdesc: 'Both Loyal champions +20% HP.', pfx: s => { s.hp *= 1.2; } },
  optimistic: { name: 'Optimistic', side: 'good', icon: '🌈', up: '+10% crit chance', down: '−10 armor', fx: s => { s.crit += 0.1; s.armor -= 10; },
                pair: 'Silver Lining', pdesc: 'Both Optimistic champions: crits hit 30% harder.', pfx: s => { s.critMul += 0.3; } },
  angry:      { name: 'Angry',      side: 'bad',  icon: '😠', up: '+25% attack', down: '−20 armor', fx: s => { s.atk *= 1.25; s.armor -= 20; },
                pair: 'Road Rage', pdesc: 'Both Angry champions +15% attack speed.', pfx: s => { s.as *= 1.15; } },
  deranged:   { name: 'Deranged',   side: 'bad',  icon: '🤪', up: '+30% ability power', down: '−15% attack', fx: s => { s.ap *= 1.3; s.atk *= 0.85; },
                pair: 'Folie à Deux', pdesc: 'Both Deranged champions need 20% less mana for signatures.', pfx: s => { s.mana *= 0.8; } },
  greedy:     { name: 'Greedy',     side: 'bad',  icon: '🤑', up: '+30% gold from their kills', down: '−10% HP', fx: s => { s.greed += 0.3; s.hp *= 0.9; },
                pair: 'Heist', pdesc: 'Every kill by the team drops 10% more gold.', team: s => { s.greed += 0.1; } },
  cowardly:   { name: 'Cowardly',   side: 'bad',  icon: '😱', up: '15% chance to dodge', down: '−15% attack', fx: s => { s.dodge += 0.15; s.atk *= 0.85; },
                pair: 'Run Away!', pdesc: 'Both Cowardly champions +10% dodge and move 30% faster.', pfx: s => { s.dodge += 0.1; s.spd *= 1.3; } },
  vain:       { name: 'Vain',       side: 'bad',  icon: '💅', up: '+15% crit chance', down: '−15% HP', fx: s => { s.crit += 0.15; s.hp *= 0.85; },
                pair: 'Mirror Mirror', pdesc: 'Both Vain champions: crits hit 40% harder.', pfx: s => { s.critMul += 0.4; } },
  cruel:      { name: 'Cruel',      side: 'bad',  icon: '😈', up: '+15% attack and heals 10% of damage dealt', down: '−20% HP', fx: s => { s.atk *= 1.15; s.lifesteal += 0.1; s.hp *= 0.8; },
                pair: 'Villain Monologue', pdesc: 'Both Cruel champions +25% damage to bosses.', pfx: s => { s.bossDmg += 0.25; } },
  paranoid:   { name: 'Paranoid',   side: 'bad',  icon: '👀', up: '+30 armor', down: 'Signature charges 20% slower', fx: s => { s.armor += 30; s.manaGain *= 0.8; },
                pair: "They're Watching", pdesc: 'Both Paranoid champions start each siege with a 20% HP shield.', pfx: s => { s.startShield += 0.2; } },
  lazy:       { name: 'Lazy',       side: 'bad',  icon: '😴', up: '+30% HP', down: '−20% attack speed', fx: s => { s.hp *= 1.3; s.as *= 0.8; },
                pair: 'Nap Time', pdesc: 'Both Lazy champions regenerate 2% HP per second.', pfx: s => { s.regen += 0.02; } },
};
const TEMPER_KEYS = Object.keys(TEMPERS);
function rollTemper() { return TEMPER_KEYS[Math.floor(Math.random() * TEMPER_KEYS.length)]; }



const LOOT_AFTER = s => s % 3 === 0 || s % 5 === 0;   // a component every third siege, and after bosses
const ROSTER_CAP = 8;
const RECRUIT_GAP = 6; // goblin encounters add at most one champion per this many sieges
