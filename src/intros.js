// ----- first-time introductions (Cam 2026-10-31: the game never explained items, combining or the upgrades) -----
// One card per visit to the prep phase, each shown once per player (G.meta.seen): items when the first component lands,
// fusing when a legend holds one component and another is loose, then the guild level, then the Artificers' Hall.
const INTROS = [
  { key: 'intro-items', due: run => run.stash.some(it => !it.holder), show: introItems },
  { key: 'intro-fuse', due: run => fusePair(run), show: introFuse },
  { key: 'intro-guild', due: run => run.siege >= 2 && guildCost(run) != null, show: introGuild },
  { key: 'intro-hall', due: run => run.siege >= 3 && openTechs(run).length, show: introHall },
];
function introSeen(key) { return !!(G.meta.seen && G.meta.seen[key]); }
function introDone(key) { G.meta.seen = G.meta.seen || {}; G.meta.seen[key] = 1; save(); }
// called from prepCues; false when nothing was shown (or a card is already up)
function showIntro(run) {
  if (!run || run.finale || run.playtest || !$('modal').hidden) return false;
  const I = INTROS.find(x => !introSeen(x.key) && x.due(run)); if (!I) return false;
  setTimeout(() => { if ($('modal').hidden && G.phase === 'prep') I.show(run, I.key); }, 450);
  return true;
}
function openTechs(run) { return Object.keys(TECH).filter(k => techState(run, k) === 'open').sort((a, b) => TECH[a].cost - TECH[b].cost); }
// a legend holding one component, and a loose component to fuse onto them
function fusePair(run) {
  const loose = run.stash.find(it => !it.holder && it.parts.length === 1); if (!loose) return null;
  const h = run.roster.find(r => heroItems(run, r).some(x => x.parts.length === 1)); if (!h) return null;
  return { h, has: heroItems(run, h).find(x => x.parts.length === 1), loose };
}
function finInfo(a, b) { const F = FINISHED[itemKey(a, b)]; return F[1] === 'crest' ? ['an Elemental Crest', 'Gives the legend a second element.'] : [F[0], F[2]]; }
function introCard(eyebrow, title, body, btn, onGo, key) {
  UI.modal(`<span class="eyebrow">${esc(eyebrow)}</span><h2>${esc(title)}</h2>${body}
    <div class="row" style="justify-content:flex-end;gap:8px;margin-top:12px"><button class="btn" id="introLater">Got it</button><button class="btn primary" id="introGo">${esc(btn)}</button></div>`, sh => {
    sh.querySelector('#introLater').onclick = () => { introDone(key); UI.closeModal(); };
    sh.querySelector('#introGo').onclick = () => { introDone(key); UI.closeModal(); onGo(); };
  }, 'intro');
  SFX.play('level');
}
const recipeRow = (a, b) => { if (a === 'shard' || b === 'shard') return ''; const [n, d] = finInfo(a, b);
  return `<div class="irec"><img class="px" src="${iconURL(COMPONENTS[a].glyph, 2)}" alt=""><span>+</span><img class="px" src="${iconURL(COMPONENTS[b].glyph, 2)}" alt=""><span>=</span><img class="px" src="${itemIconURL({ parts: itemKey(a, b).split('+') }, 2)}" alt=""><div><b>${esc(n)}</b><small>${esc(d)}</small></div></div>`; };

function introItems(run, key) {
  const it = run.stash.find(x => !x.holder), c = it.parts.length === 1 ? it.parts[0] : null;
  const others = c && c !== 'shard' ? COMP_KEYS.filter(k => k !== c).sort(() => Math.random() - 0.5).slice(0, 3) : [];
  introCard('New: items', c ? `Your first component: ${COMPONENTS[c].name}` : `Your first item: ${itemName(it)}`,
    `<div class="iitem"><img class="px" src="${itemIconURL(it, 4)}" alt=""><p class="lede">${c ? `This is a <b>component</b>. On its own it gives a legend ${esc(compStat(c, false))}.` : esc(itemDesc(it))}</p></div>
    <ul class="nag"><li>Components drop from the horde. A foe carries one in each of the first three sieges, then one every few sieges, and bosses leave bigger loot.</li>
    <li>Give a second component to the <b>same legend</b> and the two fuse into a <b>finished item</b> with its own power. Every pair makes something different.</li>
    <li>Each legend holds ${ITEM_SLOTS} items. Taking one off is free; splitting a finished item back into components costs ${UNFORGE_COST} gold.</li></ul>
    ${c ? `<div class="eyebrow">What a ${esc(COMPONENTS[c].name)} can become</div><div class="irecs">${others.map(o => recipeRow(c, o)).join('')}</div>` : ''}`,
    'Open the Armory', () => { UI.setRoster(true); UI.openPage('armory'); }, key);
}
function introFuse(run, key) {
  const p = fusePair(run), name = heroShortName(HERO_BY_ID[p.h.id].name), [n] = finInfo(p.has.parts[0], p.loose.parts[0]);
  introCard('Combining', `Fuse your first item`,
    `<p class="lede">${esc(name)} holds the ${esc(COMPONENTS[p.has.parts[0]].name)}. Hand them the ${esc(COMPONENTS[p.loose.parts[0]].name)} and the two fuse into <b>${esc(n)}</b>.</p>
    <div class="irecs">${recipeRow(p.has.parts[0], p.loose.parts[0])}</div>
    <p class="note">Finished items are what make a legend your carry. Two on one legend is a big deal, so pick who hits hardest or holds the line.</p>`,
    `Fuse it on ${name}`, () => { G.selected = p.h.uid; UI.setRoster(true); UI.openPage('armory'); setTimeout(() => { const b = document.querySelector(`#drawerBody [data-act="give"][data-arg="${p.loose.uid}"]`); if (b) b.scrollIntoView({ block: 'center' }); UI.coach('intro-fuse-btn', b, `Press Fuse to forge ${n}.`); }, 300); }, key);
}
function introGuild(run, key) {
  const lv = guildLevel(run), c = guildCost(run), now = rarityOdds(shopRank(run)), next = rarityOdds(Math.min(RARITY_ODDS.length - 1, shopRank(run) + 1));
  const odds = o => o.map((v, i) => v ? `<b style="color:${RARITY[i].col}">${RARITY[i].name} ${v}%</b>` : '').filter(Boolean).join(' · ');
  introCard('Upgrade: guild level', `Guild level ${lv}: ${lv} legends fight`,
    `<p class="lede">The guild level is your main upgrade. Each level puts <b>one more legend on the field</b> and deals <b>rarer legends</b> in the shop.</p>
    <ul class="nag"><li>Level ${lv + 1} costs ${COST(c)}. Buy it in the Guild Hall, under the shop.</li>
    <li>Shop odds now: ${odds(now)}</li><li>At level ${lv + 1}: ${odds(next)}</li>
    <li>Gold you keep earns interest, so level up when you have a legend worth fielding.</li></ul>`,
    'Open the Guild Hall', () => { UI.setRoster(true); UI.openPage('guild'); setTimeout(() => UI.coach('intro-guild-btn', document.querySelector('#drawerBody [data-act="guildlevel"]'), `Raise the guild to level ${lv + 1} here.`), 300); }, key);
}
function introHall(run, key) {
  const ts = openTechs(run).slice(0, 3);
  introCard("Upgrade: the Artificers' Hall", 'Build up your castle',
    `<p class="lede">The Hall is a tree of castle tech bought with gold. Each build opens the next, and some branches fork so you pick one path.</p>
    <ul class="nag">${ts.map(k => `<li><b>${esc(TECH[k].name)}</b> ${COST(TECH[k].cost)}: ${esc(TECH[k].desc)}</li>`).join('')}</ul>
    <p class="note">More techs open as the sieges go on. A NEW badge on the Hall means something just opened.</p>`,
    "Open the Hall", () => { UI.setRoster(true); UI.openPage('hall'); }, key);
}
