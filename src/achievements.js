// ===== Achievements =====
// Checked when a run ends. Each pays its diamonds once, the first time it is earned.
// Achievements are the only source of diamonds: together they pay exactly what every Keep Ledger upgrade costs (1044).
const bossAt = s => run => run.stats.bosses.some(b => b.siege === s);
const A_ = run => run.stats.ach || {};
const ACHIEVEMENTS = [
  // the campaign
  { id: 'first', group: 'Campaign', name: 'Doors Held', desc: 'Survive your first siege.', dia: 5, test: run => run.siege > 1 },
  { id: 'b5', group: 'Campaign', name: 'Long Live the King', desc: 'Defeat Grubnose the Goblin King.', dia: 20, test: bossAt(5) },
  { id: 'b10', group: 'Campaign', name: 'Custody Battle', desc: 'Defeat Mother Gloop.', dia: 30, test: bossAt(10) },
  { id: 'b15', group: 'Campaign', name: 'Bad Review', desc: 'Defeat Vexmora, the Ashen Wyrm.', dia: 40, test: bossAt(15) },
  { id: 'b20', group: 'Campaign', name: 'Show Is Over', desc: 'Defeat Ringmaster Malgoth.', dia: 50, test: bossAt(20) },
  { id: 'b25', group: 'Campaign', name: 'Fungicide', desc: 'Defeat the Spore Baron.', dia: 60, test: bossAt(25) },
  { id: 'b30', group: 'Campaign', name: 'HOA Dissolved', desc: 'Defeat the Yeti Matriarch.', dia: 70, test: bossAt(30) },
  { id: 'b35', group: 'Campaign', name: 'Lid Locked', desc: 'Defeat Big Mama Trashpaw.', dia: 80, test: bossAt(35) },
  { id: 'b40', group: 'Campaign', name: 'Warranty Void', desc: 'Defeat the Brass Colossus.', dia: 90, test: bossAt(40) },
  { id: 'b45', group: 'Campaign', name: 'Walk the Plank', desc: 'Defeat Captain Pinchbeard.', dia: 110, test: bossAt(45) },
  { id: 'b50', group: 'Campaign', name: 'HONK NO MORE', desc: 'Defeat the Eternal Goose and win the campaign.', dia: 150, test: run => !!run.won },
  // champions and builds
  { id: 'full', group: 'Champions', name: 'Full Barracks', desc: 'Have 6 champions at once.', dia: 14, test: run => (A_(run).maxRoster || 0) >= 6 },
  { id: 'lv20', group: 'Champions', name: 'Living Legend', desc: 'Get a champion to level 20.', dia: 29, test: run => run.roster.some(h => h.level >= 20) },
  { id: 'forged', group: 'Champions', name: 'Armed to the Teeth', desc: 'Give one champion 3 finished items.', dia: 18, test: run => run.roster.some(h => heroItems(run, h).filter(i => i.parts.length === 2).length >= 3) },
  { id: 'rainbow', group: 'Champions', name: 'Rainbow Keep', desc: 'Field 5 different elements at once.', dia: 21, test: run => Object.keys(fieldElements(run)).length >= 5 },
  { id: 'trinity', group: 'Champions', name: 'Holy Trinity', desc: 'Field attack, ability and defense elements together.', dia: 14, test: run => trinityActive(run) },
  { id: 'sigs', group: 'Champions', name: 'Signature Move', desc: 'Cast 60 signatures in one run.', dia: 18, test: run => (A_(run).sigs || 0) >= 60 },
  { id: 'combos', group: 'Champions', name: 'Combo Breaker', desc: 'Fire element combos 80 times in one run.', dia: 21, test: run => (A_(run).combos || 0) >= 80 },
  { id: 'sold', group: 'Champions', name: 'Catch and Release', desc: 'Release a champion.', dia: 7, test: run => (A_(run).sold || 0) >= 1 },
  // the castle
  { id: 'hammer', group: 'Castle', name: 'Hammer Time', desc: 'Crush 25 foes with the Sky Hammer in one run.', dia: 18, test: run => (A_(run).hammer || 0) >= 25 },
  { id: 'tech10', group: 'Castle', name: 'Tech Tycoon', desc: "Build 10 techs in the Artificers' Hall in one run.", dia: 21, test: run => Object.keys(run.tech).length >= 10 },
  { id: 'castleEl', group: 'Castle', name: 'The Keep Awakens', desc: 'Give your castle an element.', dia: 11, test: run => !!run.castleEl },
  { id: 'walls', group: 'Castle', name: 'Not a Scratch', desc: 'End siege 10 with the castle at full HP.', dia: 21, test: run => (A_(run).fullWalls || 0) >= 10 },
  { id: 'rich', group: 'Castle', name: 'Dragon Hoard', desc: 'Hold 500 gold at once.', dia: 14, test: run => (A_(run).maxGold || 0) >= 500 },
  // stories and silliness
  { id: 'landlord', group: 'Stories', name: 'Good Landlord', desc: 'Let Grubnose rent the moat.', dia: 14, test: run => (run.storySeen || []).includes('story0_0') && !!run.discovered.goose },
  { id: 'kind', group: 'Stories', name: 'Kill Them With Kindness', desc: 'Beat 3 bosses who were holding back because you were nice to them.', dia: 29, test: run => (A_(run).soft || 0) >= 3 },
  { id: 'rude', group: 'Stories', name: 'Rage Bait', desc: 'Beat 3 enraged bosses in one run.', dia: 29, test: run => (A_(run).mad || 0) >= 3 },
  { id: 'chickens', group: 'Stories', name: 'Poultry in Motion', desc: 'Defeat 40 chickens in one run.', dia: 18, test: run => (A_(run).chickens || 0) >= 40 },
  { id: 'secrets', group: 'Stories', name: 'Secret Keeper', desc: 'Discover 3 secret techs in one run.', dia: 18, test: run => Object.keys(run.discovered || {}).length >= 3 },
  { id: 'humble', group: 'Stories', name: 'Humble Beginnings', desc: 'Lose on the very first siege. It happens.', dia: 4, test: run => run.siege === 1 && !run.won },
];
// grants every newly earned achievement, returns them
function grantAchievements(run, meta) {
  meta.ach = meta.ach || {}; const got = [];
  for (const a of ACHIEVEMENTS) { if (meta.ach[a.id]) continue; let ok = false; try { ok = a.test(run); } catch (e) { ok = false; }
    if (ok) { meta.ach[a.id] = Date.now(); meta.diamonds += a.dia; got.push(a); } }
  return got;
}
