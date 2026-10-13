// ===== DOM interface =====
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = n => n >= 10000 ? (n / 1000).toFixed(1) + 'k' : String(Math.round(n));
const PORTRAIT = {};
function portrait(key, frame = 'idle0') { ensureSprite(key); const k = key + frame; return PORTRAIT[k] || (PORTRAIT[k] = spriteURL(key, frame, 3)); }
const coinImg = () => iconURL('coin', 3);
const COST = n => `<span class="cost"><img class="px" src="${coinImg()}" alt="">${n}</span>`;
const DIA = n => `<span class="cost"><img class="px" src="${iconURL('diamond', 3)}" alt="">${n}</span>`;
const temperChip = (t, paired) => { const T = TEMPERS[t]; return `<span class="chip tmp ${T.side} ${paired ? 'paired' : ''}" data-tip="tmp:${t}">${T.icon} ${T.name}</span>`; };
const raceChip = r => `<span class="chip race" style="background:${RACES[r].color}">${RACES[r].name}</span>`;
const elChip = e => e ? `<span class="chip el" data-tip="el:${e}" style="--ec:${ELEMENTS[e].col}">${ELEMENTS[e].name}</span>` : '';
const styleChip = st => `<span class="chip st-${st}" data-tip="stat:${st}">${STYLE_NAME[st]}</span>`;
const clsChip = c => `<span class="chip" data-tip="cls:${c}">${CLASSES[c].icon} ${CLASSES[c].name}</span>`;
const tierBadge = t => `<span class="stars t${t}" data-tip="tier:${t}">${NAMES_TIER[t]}</span>`;

// ----- drafting with your team in view: what you own, and what each card would add -----
function teamCounts(run) { const c = {}, r = {}; for (const h of run.roster) { const d = HERO_BY_ID[h.id]; c[d.cls] = (c[d.cls] || 0) + 1; r[d.race] = (r[d.race] || 0) + 1; } return { c, r }; }
const pips = (n, at) => { const top = at[at.length - 1]; let s = ''; for (let i = 1; i <= top; i++) s += `<i class="${i <= n ? 'on' : ''} ${at.includes(i) ? 'mile' : ''}"></i>`; return `<span class="pips">${s}</span>`; };
// how a card fits: which bonuses it would switch on or move closer
function draftFit(run, o) {
  const d = HERO_BY_ID[o.id], { c, r } = teamCounts(run), out = [];
  for (const [kind, key, T, n0] of [['cls', d.cls, CLASSES[d.cls], c[d.cls] || 0], ['race', d.race, RACES[d.race], r[d.race] || 0]]) {
    const n = n0 + 1, lvl = T.at.indexOf(n), label = kind === 'cls' ? `${T.icon} ${T.name}` : T.name;
    if (lvl >= 0) out.push({ score: 3 + lvl, html: `<div class="fit up" data-tip="syn:${key}"><b>Unlocks ${esc(label)}</b>${pips(n, T.at)}<small>${esc(T.desc(lvl))}</small></div>` });
    else if (n < T.at[0]) out.push({ score: n0 ? 1 : 0, html: `<div class="fit" data-tip="syn:${key}"><b>${esc(label)} ${n}/${T.at[0]}</b>${pips(n, T.at)}<small>${n0 ? 'You have one. ' : ''}${T.at[0] - n} more for the bonus.</small></div>` });
    else out.push({ score: 0, html: `<div class="fit dim"><b>${esc(label)} full</b>${pips(Math.min(n, T.at[T.at.length - 1]), T.at)}</div>` });
  }
  if (o.temper) { const mate = run.roster.find(h => heroTemper(h) === o.temper), T = TEMPERS[o.temper];
    if (mate && T.pdesc) out.push({ score: 2, html: `<div class="fit up tmpfit" data-tip="tmp:${o.temper}"><b>${T.icon} Pairs with ${esc(HERO_BY_ID[mate.id].name.split(' ')[0])}</b><small>${esc(T.pdesc)}</small></div>` }); }
  return { score: out.reduce((a, f) => a + f.score, 0), html: out.map(f => f.html).join('') };
}
// your keep at a glance: every champion you own, then class and race progress
function keepStripHTML(run) {
  if (!run.roster.length) return '';
  const { c, r } = teamCounts(run);
  const heroes = run.roster.map(h => { const d = HERO_BY_ID[h.id], els = heroElements(run, h);
    return `<div class="kh" data-tip="txt:${esc(heroDisplayName(h))}|Level ${h.level} ${esc(RACES[d.race].name)} ${esc(CLASSES[d.cls].name)}"><img class="px" src="${portrait(heroSpriteKey(h), 'idle0')}" alt=""><span class="kn">${esc(d.name.split(' ')[0])}</span><span class="km">${CLASSES[d.cls].icon}${els.map(e => `<i class="eld" style="background:${ELEMENTS[e].col}"></i>`).join('')}<small>Lv ${h.level}</small></span></div>`; }).join('');
  const prog = (obj, defs, kind) => Object.keys(defs).filter(k => obj[k]).sort((a, b) => obj[b] - obj[a]).map(k => { const T = defs[k], n = obj[k], on = n >= T.at[0];
    return `<span class="kp ${on ? 'on' : ''}" data-tip="syn:${k}">${kind === 'cls' ? T.icon + ' ' : ''}${esc(T.name)} ${pips(n, T.at)}</span>`; }).join('');
  return `<div class="keepstrip"><div class="kst"><span class="eyebrow">Your champions · ${run.roster.length}/${ROSTER_CAP}</span><div class="khs">${heroes}</div></div>
    <div class="kst"><span class="eyebrow">Team bonuses · a bonus switches on at 2</span><div class="kps">${prog(c, CLASSES, 'cls')}${prog(r, RACES, 'race')}</div></div></div>`;
}
// classes and races you are one champion away from: cheap targeted searches
function draftFocusOptions(run) {
  const { c, r } = teamCounts(run), out = [];
  for (const [k, n] of Object.entries(c)) if (CLASSES[k].at.includes(n + 1)) out.push({ kind: 'cls', key: k, label: `${CLASSES[k].icon} ${CLASSES[k].name}` });
  for (const [k, n] of Object.entries(r)) if (RACES[k].at.includes(n + 1)) out.push({ kind: 'race', key: k, label: RACES[k].name });
  return out.slice(0, 4);
}

// NPC visitors for encounters (generated with the same sprite kit)
const VISITORS = {
  gobunion: { head: 'goblin', skin: '#7ac83a', hat: 'helm', armor: '#d83a3a', armor2: '#8a1a1a', cloth: '#ffffff', weapon: 'totem' },
  gobcatapult: { head: 'goblin', skin: '#8ad84a', hat: 'helm', armor: '#8a6a4a', armor2: '#5a4a3a', cloth: '#c8a06a', weapon: 'none' },
  gobwedding: { head: 'goblin', skin: '#a3d95a', hat: 'crown', armor: '#ffffff', armor2: '#d8d8f0', cloth: '#ff7ab0', weapon: 'none' },
  gobmom: { head: 'goblin', skin: '#9ac87a', hat: 'hood', armor: '#a86ad8', armor2: '#6a3a8a', cloth: '#ffcf3a', weapon: 'staff' },
  gobstartup: { head: 'goblin', skin: '#7ac83a', hat: 'none', armor: '#1a1a2a', armor2: '#0f0f1a', cloth: '#1a1a2a', weapon: 'none', eye: '#5fd3ff' },
  gobmime: { head: 'goblin', skin: '#e8f0e0', hat: 'none', armor: '#1a1a2a', armor2: '#ffffff', cloth: '#ffffff', weapon: 'none' },
  gobtavern: { head: 'goblin', skin: '#6ab83a', hat: 'bandana', armor: '#8a5a2a', armor2: '#5a3a1a', cloth: '#ffcf3a', weapon: 'axe' },
  gobfortune: { head: 'goblin', skin: '#8ad84a', hat: 'wizard', armor: '#5a3ad8', armor2: '#3a1a8a', cloth: '#ffcf3a', weapon: 'none', eye: '#ff5dd8' },
  goose: { gen: 'bird', body: '#f4f4f0', wing: '#c8c8d0', beak: '#ff8a1a', neck: true },
  accountant: { head: 'goblin', skin: SK.gob, hat: 'none', armor: '#5a5a7a', armor2: '#3a3a5a', cloth: '#ffffff', weapon: 'none', eye: '#5fd3ff' },
  barrel: { gen: 'golem', body: '#a8703f', trim: '#5a3a1a', eye: '#ff5dd8', small: true },
  trenchcoat: { head: 'goblin', skin: '#c8a06a', hat: 'hood', armor: '#8a6a4a', armor2: '#5a4a3a', cloth: '#8a6a4a', weapon: 'none' },
  cheese: { gen: 'slime', body: '#ffd84a', eye: '#3a2600' },
  mimic: { gen: 'golem', body: '#c98a4a', trim: '#ffcf3a', eye: '#ff3d6e' },
  chicken: { gen: 'bird', body: '#ffffff', wing: '#e8e4d8', beak: '#ffb02e', comb: '#ff3d3d' },
  groupchat: { head: 'goblin', skin: '#a3d95a', hat: 'bandana', armor: '#6a4a8a', armor2: '#4a2f61', cloth: '#ff7a3a', weapon: 'none' },
  painter: { head: 'human', skin: SK.pale, hair: '#2a1a12', hat: 'wizard', armor: '#ff5d8f', armor2: '#c03a6a', cloth: '#ffd84a', weapon: 'staff', gem: '#5fd3ff' },
  trebuchet: { head: 'dwarf', skin: SK.tan, hair: '#ff8f3a', hat: 'bandana', armor: '#c9a35a', armor2: '#8a6a2a', cloth: '#3a64c9', weapon: 'none' },
  intern: { head: 'skeleton', skin: SK.bone, hat: 'hood', armor: '#3b2a5c', armor2: '#24183a', cloth: '#9dff6a', weapon: 'staff', gem: '#9dff6a' },
  bard: { head: 'elf', skin: SK.pale, hair: '#ff9fd0', hat: 'wizard', armor: '#7a4ae0', armor2: '#4a2aa0', cloth: '#ff5d8f', weapon: 'none' },
  pigeons: { gen: 'bird', body: '#9aa0b8', wing: '#6a7088', beak: '#ffb02e' },
  hottub: { head: 'dwarf', skin: SK.pale, hair: '#e8e8f0', hat: 'none', armor: '#5fd3ff', armor2: '#2a7ab0', cloth: '#ffffff', weapon: 'none' },
  alchemist: { head: 'toad', skin: '#a07ae0', belly: '#e0d0ff', hat: 'hood', armor: '#3a2a5a', armor2: '#24183a', cloth: '#9be05a', weapon: 'staff', gem: '#c86aff' },
  mushroom: { gen: 'slime', body: '#ff3d3d', eye: '#ffffff', crown: false },
  dragon: { gen: 'quad', body: '#7a5ad8', belly: '#ffd84a', eye: '#ffde3a', wings: true, horns: true },
  masons: { head: 'dwarf', skin: SK.pale, hair: '#8a4b2a', hat: 'helm', armor: '#c9a35a', armor2: '#8a6a2a', cloth: '#5a4a8c', weapon: 'hammer', metal: '#a8a8c0' },
  geode: { head: 'beast', skin: '#8a6a5a', snout: '#d8c0b0', ears: 'round', hat: 'none', armor: '#5fd3ff', armor2: '#2a7ab0', cloth: '#5a4a3a', weapon: 'none' },
  rentdue: { head: 'goblin', skin: '#8ad84a', hat: 'none', armor: '#5a3a8a', armor2: '#3a2a5a', cloth: '#ffcf3a', weapon: 'none', eye: '#5fd3ff' },
  leakyditch: { head: 'toad', skin: '#7ac85a', belly: '#e0f0c0', hat: 'crown', armor: '#3a8ad8', armor2: '#2a5a9a', cloth: '#ffcf3a', weapon: 'none' },
  mudseason: { gen: 'quad', body: '#ff9fb0', belly: '#ffc9d0', eye: '#1a1a2a' },
  dragoncold: { gen: 'quad', body: '#5ab84a', belly: '#ffd84a', eye: '#ff8a3a', wings: true, horns: true },
  windmill: { head: 'human', skin: SK.pale, hair: '#e8e8f0', hat: 'wizard', armor: '#5fd3ff', armor2: '#2a7ab0', cloth: '#ffffff', weapon: 'staff', gem: '#dff4ff' },
  fogman: { head: 'human', skin: SK.tan, hair: '#2a1a12', hat: 'none', armor: '#8a90a8', armor2: '#5a6078', cloth: '#ff5d8f', weapon: 'none' },
  goldrush: { head: 'dwarf', skin: SK.tan, hair: '#8a4b2a', hat: 'helm', armor: '#8a6a4a', armor2: '#5a4a3a', cloth: '#ffd84a', weapon: 'hammer', metal: '#ffd84a' },
  snowday: { head: 'human', skin: SK.pale, hair: '#c8e8ff', hat: 'wizard', armor: '#e8f4ff', armor2: '#9ac8ff', cloth: '#5fd3ff', weapon: 'staff', gem: '#ffffff' },
  merchant: { head: 'human', skin: SK.tan, hair: '#8a4b2a', hat: 'hood', armor: '#ff8a3a', armor2: '#c05a1a', cloth: '#ffd84a', weapon: 'none' },
  smith: { head: 'dwarf', skin: SK.pale, hair: '#ff6a3a', hat: 'none', armor: '#4a4f63', armor2: '#262a38', cloth: '#c9a35a', weapon: 'hammer', metal: '#cfd6e6' },
  festival: { head: 'elf', skin: SK.pale, hair: '#ffd84a', hat: 'crown', armor: '#ff5d8f', armor2: '#c03a6a', cloth: '#7cf09a', weapon: 'none' },
  luckycoin: { head: 'human', skin: SK.pale, hair: '#c8c8d8', hat: 'wizard', armor: '#3a64c9', armor2: '#24408a', cloth: '#ffcf3a', weapon: 'staff', gem: '#ffcf3a' },
  tinker: { head: 'dwarf', skin: SK.tan, hair: '#c8c8d8', hat: 'bandana', armor: '#8a5a3a', armor2: '#5a3a22', cloth: '#ffd84a', weapon: 'hammer', metal: '#cfd6e6' },
};

const rollBars = (r, base) => `<div class="rolls">${STAT_KEYS.map(k => `<div class="rb st-${k}"><span>${k === 'ad' ? 'AD' : k === 'ap' ? 'AP' : 'DEF'}</span><i><b style="width:${Math.min(100, r[k] * 10)}%"></b></i><em>${r[k]}${base && r[k] !== base[k] ? `<small>+${r[k] - base[k]}</small>` : ''}</em></div>`).join('')}</div>`;
const xpBar = h => `<div class="xpbar" title="${Math.floor(h.xp)} / ${xpNeed(h.level)} XP"><i style="width:${Math.min(100, 100 * h.xp / xpNeed(h.level))}%"></i></div>`;
const CLASS_ROLE = { guardian: 'Front-line tank. Soaks hits and protects allies.', berserker: 'Front-line bruiser. Big melee damage.', rogue: 'Fast melee assassin. Dives the back line.', ranger: 'Ranged attacker. Steady damage from afar.', mage: 'Ranged caster. Damage from spells and signatures.', cleric: 'Ranged healer. Heals hurt allies, zaps foes otherwise.' };
const bestStyle = r => STAT_KEYS.slice().sort((a, b) => r[b] - r[a])[0];

// where damage, healing and damage taken come from, for the battle stats tips
const STAT_SRC = {
  auto: { name: 'Basic attacks', col: '#f4f1ff' }, ability: { name: 'Signature ability', col: '#ffd84a' }, item: { name: 'Items', col: '#5fd3ff' }, element: { name: 'Element', col: '#ff7a3d' },
  bonus: { name: 'Team bonuses', col: '#7cf09a' }, summon: { name: 'Summons', col: '#b48aff' }, lifesteal: { name: 'Lifesteal', col: '#ff5d8f' },
  melee: { name: 'Melee foes', col: '#ff8a8a' }, ranged: { name: 'Ranged foes', col: '#ffb07a' }, boss: { name: 'The boss', col: '#ff3d6e' }, poison: { name: 'Poison and burns', col: '#9be05a' }, other: { name: 'Traps and boss moves', col: '#c9a8ff' }, shield: { name: 'Blocked by shields (not counted)', col: '#9ff6ff' },
  stun: { name: 'Stuns and freezes', col: '#bfeeff' }, taunt: { name: 'Taunts', col: '#ffd84a' }, slow: { name: 'Slows (half credit)', col: '#8ab8ff' },
};
const COMBO_GLYPH = { nova: '✹', rain: '☄', wave: '≋', heal: '✚', shield: '⛨', haste: '➹', rage: '✊', freeze: '❄', gold: '◉', shred: '✂', vortex: '◎', critter: '❧', execute: '☠', beam: '═', bolts: 'ϟ', roots: '❦', salt: '✧', candy: '✿', ham: '♨', pinata: '★' };
const DSRC_ORDER = ['auto', 'ability', 'item', 'element', 'bonus', 'summon'], HSRC_ORDER = ['ability', 'auto', 'lifesteal', 'item', 'element'], TSRC_ORDER = ['melee', 'ranged', 'boss', 'poison', 'other'];
const UI = {
  pendingGold: 0, shownGold: 0, page: null, techSel: null, recipeSel: null,
  init() {
    $('goldIcon').src = iconURL('coin', 3); $('diaIcon').src = iconURL('diamond', 3); $('hammerIcon').src = iconURL('hammer', 2);
    const navIcon = { guild: portrait('h:brann'), armory: iconURL('sword', 4), hall: iconURL('gem', 4) };
    document.querySelectorAll('.rail button').forEach(b => { b.querySelector('img').src = navIcon[b.dataset.page]; b.onclick = () => { SFX.play('click'); UI.openPage(UI.page === b.dataset.page ? null : b.dataset.page); UI.coachDone('rail-' + b.dataset.page); if (b.dataset.page === 'guild') UI.coachDone('draft-ready'); }; });
    $('drawerBack').onclick = () => UI.openPage(null);
    document.addEventListener('pointerover', e => { if (e.pointerType === 'touch') return; const el = e.target.closest && e.target.closest('[data-tip]'); if (el) { if (el !== UI.tipEl) UI.tipShow(el, e.clientX, e.clientY); } else if (UI.tipKey) UI.tipHide(); });
    document.addEventListener('pointermove', e => { if (UI.tipKey) UI.tipMove(e.clientX, e.clientY); });
    document.addEventListener('pointerdown', () => UI.tipHide());
    $('rosterToggle').onclick = () => UI.setRoster(!$('roster').classList.contains('collapsed'));
    $('rosterPull').onclick = () => UI.setRoster(!$('roster').classList.contains('collapsed'));
    $('intelTab').onclick = () => UI.setIntel($('intel').classList.contains('closed'));
    $('fsBtn').onclick = () => UI.fullscreen();
    let iv = null; try { iv = localStorage.getItem('sol.intel'); } catch (e) {}
    UI.setIntel(iv ? iv === 'open' : innerWidth >= 1400, true);
    addEventListener('resize', () => UI.layout()); document.addEventListener('fullscreenchange', () => { UI.layout(); UI.fsLabel(); });
    if (typeof ResizeObserver !== 'undefined') { const ro = new ResizeObserver(() => UI.layout()); ro.observe(document.querySelector('.hud')); ro.observe(document.querySelector('#roster > header')); }
    UI.layout();
  },
  recBadge() {
    const b = $('recBadge'); if (!b) return; const st = REC.state;
    b.hidden = st === 'off';
    b.className = 'recb ' + st;
    b.textContent = st === 'on' ? 'Recording playtest' : st === 'asking' ? 'Starting playtest mic…' : 'Logging playtest (mic off)';
    b.title = (st === 'on' ? 'Your mic and every click are saved with this run for Claude to review.' : 'Every click is saved with this run for Claude to review. The microphone is not available in this view.') + (TEL.ready ? '' : ' Saved on this device until the shared log connects.');
  },
  // forge cutscene: the inputs fly onto an anvil, a hammer strikes, and the new item bursts out. Click to skip.
  forge(o) {
    const old = document.querySelector('.forgefx'); if (old) old.remove();
    const sup = !!o.super, hits = sup ? 3 : 2, d = document.createElement('div');
    d.className = 'forgefx' + (sup ? ' sup' : '');
    d.innerHTML = `<div class="ff-stage"><div class="ff-rays"></div><canvas class="ff-anvil px" width="32" height="20"></canvas>
      ${o.inputs.map((u, i) => `<img class="px ff-in ff-in${i}" src="${u}" alt="">`).join('')}
      <div class="ff-hammer"></div><div class="ff-flash"></div><img class="px ff-out" src="${o.out}" alt="">
      <div class="ff-name"><small>${o.title || (sup ? 'Super item forged' : 'Item combined')}</small><b>${esc(o.name)}</b>${o.sub ? `<span>${esc(o.sub)}</span>` : ''}</div></div><p class="ff-skip">Click to continue</p>`;
    document.body.appendChild(d);
    // pixel anvil, violet and gold for the super anvil
    const g = d.querySelector('.ff-anvil').getContext('2d'), A = sup ? ['#5b2a9e', '#8a4fe0', '#ffcf3a', '#2a1846'] : ['#4a4f63', '#7a8199', '#c9cfe0', '#262a38'];
    g.fillStyle = A[1]; g.fillRect(2, 2, 26, 5); g.fillRect(0, 2, 4, 3); g.fillStyle = A[2]; g.fillRect(2, 2, 26, 1); g.fillStyle = A[0]; g.fillRect(9, 7, 12, 6); g.fillRect(6, 13, 18, 3); g.fillStyle = A[3]; g.fillRect(4, 16, 22, 3);
    if (sup) { g.fillStyle = '#ffcf3a'; g.fillRect(14, 9, 2, 2); g.fillRect(8, 14, 2, 1); g.fillRect(20, 14, 2, 1); }
    const T = [], at = (ms, f) => T.push(setTimeout(f, ms)), base = 650, step = sup ? 330 : 300;
    for (let i = 0; i < hits; i++) at(base + i * step, () => { d.classList.remove('hit'); void d.offsetWidth; d.classList.add('hit'); SFX.play('anvil'); UI.forgeSparks(d.querySelector('.ff-stage'), sup ? 16 : 10, sup); });
    const done = base + hits * step;
    at(done, () => { d.classList.add('done'); SFX.play('forged'); if (sup) SFX.play('boom'); UI.forgeSparks(d.querySelector('.ff-stage'), sup ? 40 : 22, sup, true); });
    const close = () => { T.forEach(clearTimeout); d.classList.add('out'); setTimeout(() => d.remove(), 250); if (o.after) o.after(); };
    at(done + (sup ? 2600 : 1700), close);
    d.addEventListener('click', () => { if (!d.classList.contains('done')) { T.forEach(clearTimeout); T.length = 0; d.classList.add('done'); at(sup ? 1400 : 900, close); return; } close(); });
  },
  forgeSparks(el, n, sup, big) {
    const cols = sup ? ['#ffcf3a', '#ffffff', '#b06cff', '#ff8af0'] : ['#ffcf3a', '#ffffff', '#ff9a3a'];
    for (let i = 0; i < n; i++) { const s = document.createElement('i'), a = Math.random() * Math.PI * 2, r = (big ? 90 : 50) + Math.random() * (big ? 110 : 60);
      s.className = 'ff-spark'; s.style.cssText = `--dx:${Math.cos(a) * r}px;--dy:${Math.sin(a) * r * 0.8 - (big ? 0 : 30)}px;background:${cols[i % cols.length]};animation-duration:${0.4 + Math.random() * 0.5}s`;
      el.appendChild(s); setTimeout(() => s.remove(), 1000); }
  },
  toast(msg, err) { const d = document.createElement('div'); d.textContent = msg; if (err) d.className = 'err'; $('toast').appendChild(d); setTimeout(() => d.remove(), 2900); if (err) SFX.play('error'); },
  banner(title, sub) { $('banner').innerHTML = `<div class="in"><h2>${esc(title)}</h2>${sub ? `<p>${esc(sub)}</p>` : ''}</div>`; },
  flyTo(src, el, sx, sy, done) {
    const layer = $('fxlayer'); if (layer.childElementCount > 50 || document.hidden || !el) { done && done(); return; }
    const tg = el.getBoundingClientRect(); const im = document.createElement('img'); im.className = 'px'; im.src = src; layer.appendChild(im);
    const dx = tg.left + tg.width / 2 - 7, dy = tg.top + tg.height / 2 - 7, mx = (sx + dx) / 2 + rand(-60, 60), my = Math.min(sy, dy) - rand(30, 90);
    const anim = im.animate([{ transform: `translate(${sx - 7}px, ${sy - 7}px) scale(1)` }, { transform: `translate(${mx}px, ${my}px) scale(1.4)`, offset: 0.45 }, { transform: `translate(${dx}px, ${dy}px) scale(0.8)` }], { duration: rand(560, 760), easing: 'cubic-bezier(.5,0,.7,1)' });
    anim.onfinish = () => { im.remove(); done && done(); };
  },
  flyCoin(c) { const cv = $('arena').getBoundingClientRect(); UI.flyTo(coinImg(), $('goldIcon'), cv.left + c.x * cv.width / W, cv.top + c.y * cv.height / H, () => { UI.pendingGold -= c.v; UI.bumpGold(); SFX.play('coin'); }); },
  flyItem(d) { const cv = $('arena').getBoundingClientRect(); UI.flyTo(iconURL(COMPONENTS[d.key].glyph, 3), $('nav-armory'), cv.left + d.x * cv.width / W, cv.top + d.y * cv.height / H, () => { const b = $('nav-armory'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }); },
  bumpGold() { const b = $('goldBox'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); UI.hud(); },

  hud() {
    const run = G.run; if (!run) return;
    const shown = Math.max(0, run.gold - Math.max(0, UI.pendingGold));
    $('gold').textContent = fmt(shown);
    $('diamonds').textContent = G.meta.diamonds;
    const s = run.siege, F = FACTIONS[factionIndex(s)];
    $('siegeName').textContent = `Siege ${s}`;
    const sub = $('siegeSub');
    if (isBossSiege(s)) { sub.textContent = s === FINAL_SIEGE ? 'FINAL BOSS' : ENEMIES[bossFor(s)].boss === 'big' ? 'BOSS SIEGE' : 'MINI-BOSS SIEGE'; sub.className = 'boss'; }
    else { const nb = 5 - (s % 5); sub.textContent = `${F.name} · boss in ${nb}`; sub.className = ''; }
    if (G.B && !G.B.done && G.B.wave && !G.B.overtime) { sub.textContent = G.B.wave === G.B.waves_of ? `${F.name} · FINAL WAVE` : `${F.name} · wave ${G.B.wave} of ${G.B.waves_of}`; sub.className = G.B.wave === G.B.waves_of ? 'boss' : ''; }
    if (G.B && !G.B.done && G.B.bossUnit && G.B.bossUnit.alive) { const u = G.B.bossUnit, left = Math.ceil((u.patMax || bossLimit(u)) - (u.patT || 0)); if (u.rage || left <= 15) { sub.textContent = u.rage ? 'THE BOSS IS CHARGING' : `Boss charges the wall in ${left}s`; sub.className = 'boss'; } }
    if (G.B && G.B.overtime && !G.B.done) { const B = G.B, left = Math.ceil(BAL.otCharge - B.otT); sub.textContent = `OVERTIME · heroes +${Math.round(BAL.otRamp * B.otT * 100)}%${B.bossUnit && B.bossUnit.alive ? '' : left > 0 ? ` · charge in ${left}s` : ' · foes charging'}`; sub.className = 'boss'; }
    const hp = Math.max(0, Math.round(run.castle.hp)); $('castleTxt').textContent = `${fmt(hp)} / ${fmt(run.castle.max)}`;
    const f = $('castleFill'); f.style.width = (100 * hp / run.castle.max) + '%'; f.classList.toggle('low', hp / run.castle.max < 0.35);
    $('castleLabel').textContent = run.castleEl ? `${ELEMENTS[run.castleEl].name} Castle` : 'Castle';
    const B = G.B, hb = $('hammerBtn');
    if (B && !B.done) { const cd = B.hammer.cd, max = hammerCooldown(run, G.meta); hb.disabled = cd > 0 || !!B.hammer.pending; $('hammerCd').style.transform = `scaleX(${Math.max(0, cd / max)})`; }
    else { hb.disabled = true; $('hammerCd').style.transform = 'scaleX(0)'; }
    hb.classList.toggle('armed', G.armed === 'hammer');
    const pb = $('powerBtn'); pb.hidden = !run.castleEl;
    if (run.castleEl) { const P = CASTLE_POWERS[run.castleEl]; $('powerName').textContent = P.name; pb.style.setProperty('--ec', ELEMENTS[run.castleEl].col);
      if (B && !B.done) { const cd = B.cpow.cd, max = castlePowerCooldown(run); pb.disabled = cd > 0; $('powerCd').style.transform = `scaleX(${Math.max(0, cd / max)})`; } else { pb.disabled = true; $('powerCd').style.transform = 'scaleX(0)'; }
      pb.classList.toggle('armed', G.armed === 'power'); }
    const bb = $('beginBtn');
    if (G.phase === 'prep') { bb.disabled = false; bb.innerHTML = `Begin siege <kbd>Space</kbd>`; }
    else if (B && B.done) { bb.disabled = true; bb.textContent = B.done === 'victory' ? 'Siege held' : 'The keep fell'; }
    else if (B && !B.done) { bb.disabled = true; const left = B.queue.length + B.enemies.filter(e => e.alive).length; bb.textContent = `${left} foes remain`; }
    else bb.disabled = true;
    $('sp1').setAttribute('aria-pressed', String(G.speed === 1)); $('sp2').setAttribute('aria-pressed', String(G.speed === 2)); $('sp4').setAttribute('aria-pressed', String(G.speed === 4));
    $('prepHint').hidden = G.phase !== 'prep'; document.querySelectorAll('.arena-tag').forEach(t => t.hidden = G.phase !== 'prep');
    document.querySelectorAll('.rail button').forEach(b => { b.disabled = G.phase !== 'prep'; b.setAttribute('aria-pressed', String(UI.page === b.dataset.page)); });
    $('railHint').textContent = G.phase === 'prep' ? 'Spend gold between sieges.' : 'Facilities open between sieges.';
    // badges
    const loose = run.stash.filter(it => !it.holder).length;
    $('nav-armory').dataset.badge = loose ? loose : '';
    const canTech = Object.keys(TECH).some(k => techState(run, k) === 'open' && run.gold >= TECH[k].cost);
    const fresh = Object.keys(TECH).filter(k => techState(run, k) === 'open' && !(run.techSeen || {})[k]).length;
    $('nav-hall').dataset.badge = fresh ? 'NEW' : canTech ? '!' : '';
    $('nav-guild').dataset.badge = '';
  },

  refresh() { const gb = $('nav-guild'), run = G.run; if (gb) gb.classList.toggle('ready', !!run && G.phase === 'prep' && run.roster.length < ROSTER_CAP && run.gold >= draftCost(run)); UI.hud(); UI.renderRoster(); UI.renderIntel(); UI.renderStats(); if (UI.page) UI.renderPage(); },
  intelKey: '',
  renderIntel() {
    const run = G.run, B = G.B, s = run.siege, fi = factionIndex(s), F = FACTIONS[fi], within = (s - 1) % 5;
    const tag = d => d.boss ? (d.boss === 'big' ? 'Boss' : 'Mini-boss') : d.elite ? 'Elite · may drop an item' : d.kind === 'flyer' ? 'Flies over the line' : d.kind === 'ranged' ? 'Ranged' : d.kind === 'healer' ? 'Heals the horde' : d.split ? 'Splits when slain' : d.spd > 35 ? 'Fast' : 'Melee';
    let ids, counts = null, title;
    if (B && G.phase === 'siege') { counts = {}; for (const q of B.queue) counts[q.id] = (counts[q.id] || 0) + 1; for (const e of B.enemies) if (e.alive) counts[e.id] = (counts[e.id] || 0) + 1; ids = Object.keys(counts); title = 'Still coming'; }
    else { ids = F.pool.slice(0, Math.min(F.pool.length, 2 + within)); if (within >= 2 && s > 5) ids.push(F.elite); if (isBossSiege(s)) ids.push(bossFor(s)); if (run.mods.chickens) ids.unshift('chicken'); if (run.mods.honked) ids.unshift('goose'); title = `Scouts report: siege ${s}`; }
    const act = activeSynergies(run); const synKeys = [...Object.keys(RACES), ...Object.keys(CLASSES)].filter(k => act[k] >= 0);
    const combos = activeCombos(run), fe = fieldElements(run);
    const key = JSON.stringify([s, G.phase, counts, synKeys, act, combos.map(c => c.key), fe, run.mods]); if (key === UI.intelKey) return; UI.intelKey = key;
    let h = `<div><span class="eyebrow">${esc(F.name)}${cycleOf(s) ? ' · ascended' : ''}</span><h3>${title}</h3></div>`;
    for (const id of ids) { const d = ENEMIES[id]; if (!d) continue; h += `<div class="foe ${d.boss ? 'boss' : ''}"><img class="px" src="${portrait('e:' + id)}" alt=""><div><b>${esc(d.name)}</b><span>${esc(tag(d))}</span></div><span class="num" style="color:var(--gold)">${counts ? '×' + counts[id] : ''}</span></div>`; }
    const modNote = { chickens: 'Chickens incoming.', partyhats: 'The horde is wearing party hats (+25% gold).', giant: 'Your heroes are enormous this siege.', tiny: 'The horde is tiny and zoomy.', fewer: 'A smaller horde this time.', curse: 'The horde is angry about taxes (+30% HP).', inspire: 'Heroes +25% attack.', tonic: 'Heroes start at full mana.', honked: 'The goose is back.', bossmad: 'The boss is enraged: +25% HP, double gold.', bosssoft: 'The boss is holding back: −20% HP.' };
    const hzN = run.mods.hz && HAZARDS[run.mods.hz]; if (hzN) h += `<div class="mods hz"><p><b>${esc(hzN.name)}.</b> ${esc(hzN.desc)}</p></div>`;
    const mods = Object.keys(run.mods).filter(m => modNote[m]); if (mods.length) h += `<div class="mods">${mods.map(m => `<p>${esc(modNote[m])}</p>`).join('')}</div>`;
    $('intelMain').innerHTML = h;
  },

  // ----- immersive layout: fit the arena between the floating HUD and the champion drawer's header -----
  layout() {
    const st = document.documentElement.style;
    if (!matchMedia('(min-width: 900px)').matches) { for (const k of ['--ax', '--ay', '--aw', '--ah', '--hudH', '--rosH']) st.removeProperty(k); return; }
    const hud = document.querySelector('.hud').getBoundingClientRect().height, ros = document.querySelector('#roster > header').getBoundingClientRect().height;
    const availH = innerHeight - ros; let w = innerWidth, h = w * 9 / 16; if (h > availH) { h = availH; w = h * 16 / 9; }
    const free = availH - h, ay = free >= hud ? hud + (free - hud) / 2 : free / 2;
    st.setProperty('--aw', w + 'px'); st.setProperty('--ah', h + 'px'); st.setProperty('--ax', (innerWidth - w) / 2 + 'px'); st.setProperty('--ay', ay + 'px');
    st.setProperty('--hudH', hud + 'px'); st.setProperty('--rosH', ros + 'px');
  },
  setRoster(collapse) { const r = $('roster'); r.classList.toggle('collapsed', collapse); $('rosterToggle').textContent = collapse ? 'Show champions ▲' : 'Hide ▼'; $('rosterToggle').setAttribute('aria-expanded', String(!collapse)); $('rosterPull').firstChild.textContent = collapse ? '▲' : '▼'; $('rosterPull').setAttribute('aria-expanded', String(!collapse)); UI.layout(); },
  setIntel(open, quiet) { $('intel').classList.toggle('closed', !open); $('intelTab').setAttribute('aria-expanded', String(open)); if (!quiet) try { localStorage.setItem('sol.intel', open ? 'open' : 'closed'); } catch (e) {} },
  fullscreen() {
    if (document.fullscreenElement) { document.exitFullscreen && document.exitFullscreen(); return; }
    const el = document.documentElement, req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!req) { UI.toast('Fullscreen is not available here. Try your browser\'s fullscreen key (F11).', true); return; }
    try { const p = req.call(el); if (p && p.catch) p.catch(() => UI.toast('The browser blocked fullscreen. Try F11, or open the game in its own tab.', true)); } catch (e) { UI.toast('The browser blocked fullscreen. Try F11.', true); }
  },
  fsLabel() { $('fsBtn').textContent = document.fullscreenElement ? '⛶ Exit fullscreen' : '⛶ Fullscreen'; },

  // ----- battle stats: four small bars per champion, hover for where it came from -----
  renderStats() {
    const run = G.run, B = G.B, box = $('statsChart'); if (!box || !run) return;
    let rows; const live = B && G.phase === 'siege';
    if (live) rows = B.heroes.filter(u => !u.temp && u.inst).map(u => Object.assign({ uid: u.inst.uid, id: u.inst.id, alive: u.alive }, heroBattleStats(B, u)));
    else rows = (run.lastStats || []).filter(r => run.roster.some(h => h.uid === r.uid));
    UI.statsData = {};
    if (!rows.length) { box.innerHTML = ''; box.hidden = true; const tc = $('teamChart'); if (tc) tc.innerHTML = '<p class="note">Fills in once a siege starts.</p>'; UI.tipRefresh(); return; }
    box.hidden = false; box.innerHTML = UI.statsChartHTML(rows, live ? 'Live' : 'Last siege');
    const tc = $('teamChart'); if (tc) tc.innerHTML = UI.statsChartHTML(rows, live ? 'Live' : 'Last siege', true);
    UI.tipRefresh();
  },
  // one group of four vertical bars per champion: dealt, taken, CC, healed. Hover a bar for where it came from.
  statsChartHTML(rows, label, big) {
    // one small panel per category, each with its own y axis in its own unit (damage, damage, seconds, HP)
    const run = G.run;
    UI.statsData = UI.statsData || {}; for (const r of rows) UI.statsData[r.uid] = r;
    const nice = v => { if (v <= 0) return 1; const e = Math.pow(10, Math.floor(Math.log10(v))), f = v / e; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * e; };
    const tick = (v, sec) => sec ? (v >= 10 ? Math.round(v) : +v.toFixed(1)) + 's' : fmt(v);
    const cats = [['dmg', 'k-dmg', 'Dealt', 'Damage dealt|Every point of damage this champion dealt, including summons.'], ['taken', 'k-taken', 'Taken', 'Damage taken|Damage that got through shields and armor.'],
      ['ccT', 'k-cc', 'Control', 'Crowd control|Seconds foes spent stunned, frozen or taunted by this champion. Slows count half.'], ['heal', 'k-heal', 'Healed', 'Healing|HP restored to allies, counting only missing HP.']];
    const order = rows.slice().sort((a, b) => b.dmg - a.dmg);
    let h = `<div class="vchart ${big ? 'big' : ''}"><span class="vlabel">${esc(label)}</span>`;
    for (const [k, c, name, tip] of cats) {
      const max = nice(Math.max(0, ...rows.map(r => r[k] || 0))), sec = k === 'ccT';
      const none = !rows.some(r => (r[k] || 0) > 0);
      h += `<div class="vpanel"><b class="vt ${c}-t" data-tip="txt:${tip}">${name}</b><div class="vplot"><div class="vaxis"><span>${none ? '' : tick(max, sec)}</span><span>${none ? '' : tick(max / 2, sec)}</span><span>0</span></div><div class="vbars">`;
      for (const r of order) { const v = r[k] || 0, inst = run.roster.find(x => x.uid === r.uid);
        h += `<div class="vcol ${r.alive ? '' : 'dead'}" data-tip="st:${r.uid}:${k}"><i class="${c}" style="height:${v > 0 ? Math.max(2, 100 * v / max) : 0}%"></i>${big ? `<img class="px" src="${portrait(inst ? heroSpriteKey(inst) : 'h:' + r.id)}" alt="">` : ''}</div>`; }
      h += `</div></div></div>`;
    }
    return h + `</div>`;
  },
  // ----- hover tips: one floating box for every [data-tip] -----
  tipHTML(key) {
    const [kind, a, b] = key.split(':');
    if (kind === 'st') { const r = UI.statsData && UI.statsData[a]; if (!r) return '';
      const nm = (() => { const inst = G.run.roster.find(x => x.uid === a); return inst ? heroDisplayName(inst) : HERO_BY_ID[r.id].name; })();
      const list = (src, order, tot, unit) => order.filter(s => (src[s] || 0) > 0.5).map(s => `<div class="tl"><i style="background:${STAT_SRC[s].col}"></i><span>${STAT_SRC[s].name}</span><b>${unit ? src[s].toFixed(1) + unit : fmt(src[s])}</b><small>${tot > 0 ? Math.round(100 * src[s] / tot) + '%' : ''}</small></div>`).join('') || '<p class="note">Nothing yet.</p>';
      if (b === 'dmg') return `<b>${esc(nm)}: damage dealt ${fmt(r.dmg)}</b>${list(r.dsrc, DSRC_ORDER, r.dmg)}`;
      if (b === 'heal') return `<b>${esc(nm)}: healing done ${fmt(r.heal)}</b>${list(r.hsrc, HSRC_ORDER, r.heal)}<p class="note">Only healing that restored missing HP counts.</p>`;
      if (b === 'taken') return `<b>${esc(nm)}: damage taken ${fmt(r.taken)}</b>${list(r.tsrc, TSRC_ORDER, r.taken)}${r.tsrc.shield > 0.5 ? `<div class="tl"><i style="background:${STAT_SRC.shield.col}"></i><span>${STAT_SRC.shield.name}</span><b>${fmt(r.tsrc.shield)}</b><small></small></div>` : ''}`;
      if (b === 'ccT') return `<b>${esc(nm)}: crowd control ${(r.ccT || 0).toFixed(1)}s</b>${list(r.cc, ['stun', 'taunt', 'slow'], r.ccT, 's')}<p class="note">Seconds foes spent stunned, frozen or taunted by this champion. Slows count at half.</p>`;
    }
    if (kind === 'els') { const E = ELEMENTS[a], n = G.run ? (stackElements(G.run)[a] || 0) : 0, stat = { ad: 'attack', ap: 'ability power', def: 'HP' }[E.style];
      const who = G.run ? placedHeroes(G.run).filter(h => heroElements(G.run, h).includes(a)).map(h => esc(heroDisplayName(h).split(' ')[0])) : [];
      return `<b>${E.name} stack <small>${n} on the field</small></b><p>Champions who share an element power each other up.</p>${EL_STACK.at.map((v, i) => `<div class="ttier ${Math.min(n, 4) === v ? 'on' : n > v ? 'past' : ''}"><b>${v}</b><span>${E.name} power ×${EL_STACK.mul[i]} and +${Math.round(EL_STACK.stat[i] * 100)}% ${stat}</span></div>`).join('')}${G.run && G.run.castleEl === a && n ? `<p class="note">+1 from your castle (counts for stacks, not combos).</p>` : ''}<p class="note">${who.length ? who.join(', ') : 'Nobody yet'}</p>`; }
    if (kind === 'help' && a === 'els') return `<b>Element stacks</b><p>Two, three or four champions with the same element (crests count) multiply that element's power and boost their matching stat.</p>`;
    if (kind === 'tmp') { const T = TEMPERS[a], n = G.run ? (temperCounts(G.run)[a] || 0) : 0, who = G.run ? placedHeroes(G.run).filter(h => heroTemper(h) === a).map(h => esc(heroDisplayName(h).split(' ')[0])) : [];
      return `<b>${T.icon} ${T.name} <small>${T.side === 'good' ? 'good-guy energy' : 'bad-guy energy'}</small></b><p><span style="color:var(--mint)">▲ ${esc(T.up)}</span><br><span style="color:var(--rose)">▼ ${esc(T.down)}</span></p><div class="ttier ${n >= 2 ? 'on' : ''}"><b>2</b><span><i>${esc(T.pair)}:</i> ${esc(T.pdesc)}</span></div><p class="note">${n >= 2 ? 'Pair active: ' + who.join(' + ') : n === 1 ? `Place a second ${T.name} champion to unlock the pair bonus. Now: ${who[0]}.` : `Two ${T.name} champions on the field unlock the pair bonus.`}</p>`; }
    if (kind === 'cls') return clsTipHTML(a);
    if (kind === 'el') return elTipHTML(a);
    if (kind === 'ab') return abilityTipHTML(a);
    if (kind === 'tier') return tierTipHTML(+a);
    if (kind === 'syn') return synTipHTML(a);
    if (kind === 'combo') return comboTipHTML(key.slice(6));
    if (kind === 'help' && a === 'tmp') return `<b>Temperament pairs</b><p>Every champion has a temperament, half good-guy and half bad-guy energy. Two champions with the same one on the field unlock its pair bonus.</p>`;
    if (kind === 'help') return a === 'combo' ? `<b>Element combos</b><p>Every pair of different elements on the field could form a combo, but only ${COMBO_SLOTS} fire. Click a combo between sieges to switch it on.</p>` : `<b>Team bonuses</b><p>Place heroes of the same race or class to switch on a bonus. The dots show how many you need for each level.</p>`;
    if (kind === 'txt') { const [t, d] = key.slice(4).split('|'); return `<b>${esc(t)}</b><p>${esc(d || '')}</p>`; }
    if (kind === 'stat') return statTipHTML(a);
    return '';
  },
  tipShow(el, x, y) { const t = $('tip'), key = el && el.dataset.tip; if (!key) return UI.tipHide(); const h = UI.tipHTML(key); if (!h) return UI.tipHide(); UI.tipKey = key; UI.tipEl = el; t.innerHTML = h; t.hidden = false; UI.tipMove(x, y); },
  tipMove(x, y) { const t = $('tip'); if (t.hidden) return; UI.tipXY = [x, y]; const r = t.getBoundingClientRect(), vw = innerWidth, vh = innerHeight;
    let L = x + 14, T = y + 14; if (L + r.width > vw - 8) L = x - r.width - 14; if (T + r.height > vh - 8) T = Math.max(8, y - r.height - 14); t.style.left = Math.max(8, L) + 'px'; t.style.top = T + 'px'; },
  tipHide() { const t = $('tip'); if (t) t.hidden = true; UI.tipKey = null; UI.tipEl = null; },
  tipRefresh() { if (!UI.tipKey || $('tip').hidden) return; if (UI.tipKey.startsWith('st:')) { const h = UI.tipHTML(UI.tipKey); if (h) { $('tip').innerHTML = h; if (UI.tipXY) UI.tipMove(...UI.tipXY); } } },

  // ----- left drawer -----
  openPage(p) {
    if (p && G.phase !== 'prep') { UI.toast('Facilities open between sieges.', true); return; }
    if (p === 'hall') { const run = G.run; run.techSeen = run.techSeen || {}; UI.hallNew = new Set(Object.keys(TECH).filter(k => techState(run, k) === 'open' && !run.techSeen[k])); UI.hallNew.forEach(k => run.techSeen[k] = 1); }
    UI.page = p; $('drawer').classList.toggle('open', !!p); if (p) UI.renderPage(); UI.hud();
    if (p === 'armory') UI.coachLater('armory-give', () => document.querySelector('#drawerBody .give'), 'Pick a hero in the roster, then hand them an item. Two components on the same hero fuse into a finished item.');
    if (p === 'hall') UI.coachLater('hall-tree', () => document.querySelector('#drawerBody .trow.open'), 'Glowing rows are ready to build. Each one opens the next step in its branch. Secret techs at the bottom are found through encounters.');
  },
  renderPage() {
    const run = G.run, p = UI.page, body = $('drawerBody');
    const titles = { guild: ['Guild Hall', 'Where champions are drafted and trained.'], armory: ['Armory', 'Hand out components. Two on one hero fuse into a finished item.'], hall: ["Artificers' Hall", 'A tree of castle technology. Some branches are found, not bought.'] };
    $('drawerTitle').textContent = titles[p][0]; $('drawerSub').textContent = titles[p][1];
    const scroll = body.scrollTop;
    body.innerHTML = p === 'guild' ? UI.guildHTML(run) : p === 'armory' ? UI.armoryHTML(run) : UI.hallHTML(run);
    body.scrollTop = scroll;
    body.querySelectorAll('[data-act]').forEach(b => b.onclick = () => G.act(b.dataset.act, b.dataset.arg));
    body.querySelectorAll('details.hbranch').forEach(d => d.ontoggle = () => { UI.hallOpen[d.dataset.br] = d.open; });
  },
  guildHTML(run) {
    const c = draftCost(run), full = run.roster.length >= ROSTER_CAP, can = !full && run.gold >= c && G.phase === 'prep';
    let h = `<div class="card buydraft"><div><span class="eyebrow">Draft a champion</span><p style="margin:4px 0 0">${run.roster.length < 2 ? 'Your partner joins free after siege 1. ' : ''}Each draft costs more than the last, so save up between sieges. New champions arrive at about three quarters of your team's average level.</p>
      <p class="note">${full ? `Your keep is full (${ROSTER_CAP} champions).` : run.gold >= c ? `You have ${run.gold} gold.` : `You have ${run.gold} gold. Save ${c - run.gold} more.`}</p></div>
      <button class="btn primary dbtn" data-act="buydraft" ${can ? '' : 'disabled'}><b>Draft champion</b><span>${COST(c)} gold</span></button></div>`;
    h += `<div class="group-title">Your champions</div>`;
    for (const hr of run.roster) {
      const d = HERO_BY_ID[hr.id], st = heroStats(hr, run, G.meta);
      const ms = hr.level < SIG_LEVEL ? `Signature unlocks at level ${SIG_LEVEL}` : !hr.el ? (hr.level < ELEMENT_LEVEL ? `Element choice at level ${ELEMENT_LEVEL}` : 'Element choice pending') : `Signature rank ${st.rank}`;
      h += `<div class="card recruit"><img class="px" src="${portrait(heroSpriteKey(hr))}" alt=""><div><h4>${esc(heroDisplayName(hr))} ${tierBadge(d.tier)}</h4><div class="chips">${raceChip(d.race)}${clsChip(d.cls)}${elChip(hr.el)}${temperChip(heroTemper(hr))}</div>
        <p>Level ${hr.level} · ${Math.floor(hr.xp)} / ${xpNeed(hr.level)} XP · ${esc(ms)}</p>${xpBar(hr)}${rollBars(effRolls(run, hr), hr.rolls)}</div><span></span></div>`;
    }
    h += `<div class="group-title">Champion codex</div><div class="codex">`;
    for (const d of HEROES) { const own = run.roster.some(x => x.id === d.id); h += `<div class="cx ${own ? 'own' : ''}" title="${esc(d.name)} · ${esc(d.aName)}: ${esc(d.aDesc)}"><img class="px" src="${portrait('h:' + d.id)}" alt=""><span>${esc(d.name.split(' ')[0])}</span></div>`; }
    return h + `</div><p class="note">Signatures unlock at level ${SIG_LEVEL} and grow every level, with a new rank at levels 8, 12, 16 and 20.</p>`;
  },
  armoryHTML(run) {
    let sel = run.roster.find(h => h.uid === G.selected);
    if (!sel && run.roster.length) { sel = run.roster[0]; G.selected = sel.uid; }
    let h = `<div class="eyebrow">1. Pick a champion</div><div class="hpick">${run.roster.map(r => { const n = heroItems(run, r).length;
      return `<button class="hp ${sel === r ? 'on' : ''}" data-act="pickhero" data-arg="${r.uid}" title="${esc(heroDisplayName(r))}"><img class="px" src="${portrait(heroSpriteKey(r))}" alt=""><span>${esc(HERO_BY_ID[r.id].name.split(' ')[0])}</span><i class="pips">${Array.from({ length: ITEM_SLOTS }, (_, k) => `<b class="${k < n ? 'on' : ''}"></b>`).join('')}</i></button>`; }).join('')}</div>`;
    if (sel) h += `<div class="eyebrow">2. Their item slots</div>`;
    if (sel) {
      const its = heroItems(run, sel);
      h += `<div class="card loadout"><div class="row"><img class="px" src="${portrait(heroSpriteKey(sel))}" alt="" style="width:40px;height:40px"><div><span class="eyebrow">Equipping</span><h4>${esc(heroDisplayName(sel))}</h4></div></div><div class="lslots">`;
      for (let i = 0; i < ITEM_SLOTS; i++) { const it = its[i];
        h += it ? `<div class="lslot ${it.parts.length === 2 ? 'fin' : ''}"><img class="px" src="${itemIconURL(it)}" alt=""><div><b>${esc(itemName(it))}</b><p>${esc(itemDesc(it))}</p><div class="row"><button class="btn small" data-act="unequip" data-arg="${it.uid}">Take off</button>${it.parts.length === 2 ? `<button class="btn small ghost" data-act="unforge" data-arg="${it.uid}">Split ${COST(UNFORGE_COST)}</button>` : ''}</div></div></div>`
          : `<div class="lslot empty">Empty slot</div>`; }
      h += `</div></div>`;
    } else h += `<div class="note">Select a hero in the roster below to hand out items.</div>`;
    const loose = run.stash.filter(it => !it.holder), held = run.stash.filter(it => it.holder);
    h += UI.superAnvilHTML(run);
    h += `<div class="group-title">3. Items in the stash${sel ? ` · tap Give to equip ${esc(HERO_BY_ID[sel.id].name.split(' ')[0])}` : ''}</div>`;
    if (!loose.length) h += `<div class="note">Nothing here. Components drop from elites and bosses, and you choose one after every siege.</div>`;
    for (const it of loose) {
      const fuse = sel && it.parts.length === 1 && heroItems(run, sel).find(x => x.parts.length === 1);
      const into = fuse ? FINISHED[itemKey(fuse.parts[0], it.parts[0])] : null;
      h += `<div class="card item"><img class="px" src="${itemIconURL(it)}" alt=""><div><h4>${esc(itemName(it))} ${it.parts.length === 2 ? '<span class="tier">finished</span>' : ''}</h4><p>${esc(itemDesc(it))}</p>${into ? `<p style="color:var(--gold)">Fuses with ${esc(COMPONENTS[fuse.parts[0]].name)} into <b>${esc(into[1] === 'emblem' ? 'a Crest' : into[0])}</b>.</p>` : ''}</div>
        ${sel ? `<button class="btn small primary give" data-act="give" data-arg="${it.uid}">${into ? 'Fuse' : 'Give'}</button>` : '<span></span>'}</div>`;
    }
    if (held.length) { h += `<div class="group-title">Carried</div>`; for (const it of held) { const ho = run.roster.find(x => x.uid === it.holder); h += `<div class="card item sm"><img class="px" src="${itemIconURL(it)}" alt=""><div><h4>${esc(itemName(it))}</h4><p>${ho ? esc(heroDisplayName(ho)) : ''}</p></div>${sel && it.holder !== sel.uid ? `<button class="btn small" data-act="give" data-arg="${it.uid}">Move here</button>` : '<span></span>'}</div>`; } }
    // recipe book
    const ks = COMP_KEYS;
    h += `<details class="recipes" ${UI.recipeSel ? 'open' : ''}><summary>Recipe book</summary><div class="rgrid" style="grid-template-columns:repeat(${ks.length + 1}, minmax(0,1fr))"><span></span>${ks.map(k => `<img class="px" src="${iconURL(COMPONENTS[k].glyph, 2)}" alt="${esc(COMPONENTS[k].name)}">`).join('')}`;
    for (const a of ks) { h += `<img class="px" src="${iconURL(COMPONENTS[a].glyph, 2)}" alt="${esc(COMPONENTS[a].name)}">`; for (const b of ks) { const key = itemKey(a, b); h += `<button class="rc ${UI.recipeSel === key ? 'on' : ''}" data-act="recipe" data-arg="${key}" title="${esc(FINISHED[key][0])}"><img class="px" src="${itemIconURL({ parts: key.split('+') }, 2)}" alt="${esc(FINISHED[key][0])}"></button>`; } }
    h += `</div>`;
    if (UI.recipeSel) { const F = FINISHED[UI.recipeSel], [a, b] = UI.recipeSel.split('+'); h += `<p class="rdesc"><b>${esc(F[0])}</b> = ${esc(COMPONENTS[a].name)} + ${esc(COMPONENTS[b].name)}. ${esc(F[2])}</p>`; }
    else h += `<p class="note">Tap a square to see what two components make. A Golden Ladle with any component makes a Crest: a second element.</p>`;
    return h + `</details>`;
  },
  superAnvilHTML(run) {
    if (!superAnvilOpen(run)) return run.siege < techOpensAt('superanvil') ? '' : `<div class="superanvil locked"><h4>Super Anvil</h4><p class="note">Build it in the Artificers' Hall to forge two finished items into one super item that keeps both powers and adds a new one.</p></div>`;
    const fin = superForgeable(run); UI.saSel = (UI.saSel || []).filter(u => fin.some(it => it.uid === u));
    let h = `<div class="superanvil"><h4>Super Anvil</h4><p class="note">Pick two finished items. They forge into one super item with both powers, plus a bonus from the part they share most. It takes one slot. Each champion can carry one. ${COST(SUPER_COST)}</p>`;
    if (fin.length < 2) return h + `<p class="note">You need two finished items to forge.</p></div>`;
    h += `<div class="sa-items">${fin.map(it => { const ho = run.roster.find(x => x.uid === it.holder);
      return `<button class="sa-it ${UI.saSel.includes(it.uid) ? 'on' : ''}" data-act="sa-pick" data-arg="${it.uid}" data-tip="txt:${esc(itemName(it))}|${esc(itemDesc(it))}"><img class="px" src="${itemIconURL(it)}" alt=""><span>${esc(itemName(it))}<small>${ho ? esc(HERO_BY_ID[ho.id].name.split(' ')[0]) : 'Stash'}</small></span></button>`; }).join('')}</div>`;
    if (UI.saSel.length === 2) { const [a, b] = UI.saSel.map(u => run.stash.find(x => x.uid === u)), k = superKind(a, b), prev = { parts: a.parts, el: a.el, sub: { parts: b.parts, el: b.el }, sup: k };
      h += `<div class="sa-prev"><img class="px" src="${itemIconURL(prev)}" alt=""><div><b style="color:#e2c4ff">${esc(SUPERS[k][0])}</b><p>${esc(SUPERS[k][1])}</p></div><button class="btn primary" data-act="sa-forge">Forge ${COST(SUPER_COST)}</button></div>`; }
    else h += `<p class="note">${UI.saSel.length ? 'Pick one more.' : 'Pick the first item.'}</p>`;
    return h + `</div>`;
  },
  hallHTML(run) {
    // one dropdown per branch. Built techs shrink to chips, ready ones glow, newly opened ones say NEW.
    const isNew = k => UI.hallNew && UI.hallNew.has(k);
    UI.hallOpen = UI.hallOpen || {};
    const row = k => { const T = TECH[k], st = techState(run, k);
      if (st === 'hidden') return `<div class="trow hidden"><div><b>??? Secret tech</b><p>Found by helping visitors between sieges.</p></div><span class="chip">Rumored</span></div>`;
      const act = st === 'soon' ? `<span class="chip">Siege ${techOpensAt(k)}</span>` : st === 'locked' ? `<span class="chip">Needs ${esc(T.req.filter(r => !run.tech[r]).map(r => TECH[r].name).join(' + '))}</span>` : `<button class="btn small ${run.gold >= T.cost ? 'primary' : ''}" data-act="tech" data-arg="${k}" ${run.gold < T.cost ? 'disabled' : ''}>Build ${COST(T.cost)}</button>`;
      return `<div class="trow ${st} ${st === 'open' && run.gold >= T.cost ? 'afford' : ''}"><span class="tt">T${T.t || '★'}</span><div><b>${esc(T.name)}${isNew(k) ? ' <i class="newb">NEW</i>' : ''}</b><p>${esc(T.desc)}</p></div>${act}</div>`; };
    const branch = (key, title, icon, ids) => {
      const built = ids.filter(k => run.tech[k]), rest = ids.filter(k => !run.tech[k]);
      const ready = rest.filter(k => techState(run, k) === 'open'), afford = ready.filter(k => run.gold >= TECH[k].cost).length, fresh = ready.filter(isNew).length;
      const open = key in UI.hallOpen ? UI.hallOpen[key] : (ready.length > 0 || fresh > 0);
      const tags = `${fresh ? `<i class="newb">${fresh} NEW</i>` : ''}${ready.length ? `<span class="rdy ${afford ? 'ok' : ''}">${ready.length} ready</span>` : ''}`;
      return `<details class="hbranch" data-br="${key}" ${open ? 'open' : ''}><summary><span class="bi">${icon}</span><b>${title}</b>${tags}<span class="prog"><i style="width:${100 * built.length / Math.max(1, ids.length)}%"></i></span><small>${built.length}/${ids.length}</small><span class="car">▾</span></summary>
        ${built.length ? `<div class="tbuilt">${built.map(k => `<span class="chip ok" data-tip="txt:${esc(TECH[k].name)}|${esc(TECH[k].desc)}">✓ ${esc(TECH[k].name)}</span>`).join('')}</div>` : ''}
        <div class="tlist">${rest.map(row).join('') || '<p class="note">Every tech in this branch is built.</p>'}</div></details>`; };
    const icons = ['🧱', '⚙️', '⚗️', '💰'];
    const totalReady = Object.keys(TECH).filter(k => techState(run, k) === 'open'), canBuy = totalReady.filter(k => run.gold >= TECH[k].cost).length;
    let h = `<div class="hallsum"><span>${totalReady.length ? `<b>${totalReady.length}</b> ready to build${canBuy ? `, <b>${canBuy}</b> affordable now` : ''}` : 'Nothing to build right now.'}</span>${UI.hallNew && UI.hallNew.size ? `<i class="newb">${UI.hallNew.size} new unlock${UI.hallNew.size > 1 ? 's' : ''}</i>` : ''}</div>`;
    for (let b = 0; b < TECH_BRANCHES.length; b++) {
      const ids = Object.keys(TECH).filter(k => TECH[k].b === b && !TECH[k].secret).sort((x, y) => TECH[x].t - TECH[y].t);
      h += branch('b' + b, TECH_BRANCHES[b], icons[b], ids);
    }
    h += branch('sec', 'Secrets', '🗝️', Object.keys(TECH).filter(k => TECH[k].secret));
    const rc = repairCost(run);
    h += `<div class="card row between"><div><h4>Hire masons</h4><p class="note" style="margin:0">Repair 20% of the castle.</p></div><button class="btn small" data-act="repair" ${run.gold < rc || run.castle.hp >= run.castle.max ? 'disabled' : ''}>${COST(rc)}</button></div>`;
    return h;
  },

  // ----- roster drawer -----
  renderRoster() {
    const run = G.run, B = G.B;
    $('rosterTitle').textContent = `Champions ${run.roster.length}`;
    const { race, cls } = synergyCounts(run); const act = activeSynergies(run);
    // synergies as icon badges: race portraits, class glyphs, element combo orbs. Details live in the hover tip.
    const badge = (key, def, n, isRace) => { if (!n) return ''; const t = act[key], on = t >= 0, next = def.at.find(v => v > n);
      const pips = def.at.map(v => `<i class="${n >= v ? 'f' : ''}"></i>`).join('');
      const icon = isRace ? `<img class="px" src="${portrait('h:' + HEROES.find(d => d.race === key).id)}" alt="">` : `<span class="glyph">${def.icon}</span>`;
      return `<div class="syb ${on ? 'on' : ''} ${isRace ? 'race' : 'cls'}" style="--rc:${isRace ? def.color : 'var(--sky)'}" data-tip="syn:${key}" aria-label="${esc(def.name)} ${n}${next ? ' of ' + next : ''}">${icon}<b class="cnt">${n}</b><span class="pips">${pips}</span></div>`; };
    let bon = ''; for (const k in RACES) bon += badge(k, RACES[k], race[k], true); for (const k in CLASSES) bon += badge(k, CLASSES[k], cls[k], false);
    const all = possibleCombos(run), on = new Set(activeCombos(run).map(c => c.key));
    let com = '';
    for (const c of all) com += `<button class="syb combo ${on.has(c.key) ? 'on' : ''}" data-act="combo" data-arg="${c.key}" data-tip="combo:${c.key}" style="--ec:${ELEMENTS[c.a].col};--ec2:${ELEMENTS[c.b].col}" ${G.phase !== 'prep' ? 'disabled' : ''} aria-label="${esc(c.name)} ${on.has(c.key) ? 'on' : 'off'}"><span class="orb"></span><span class="glyph">${COMBO_GLYPH[c.kind] || '✦'}</span></button>`;
    const fe = stackElements(run); let elb = '';
    for (const e of EL_KEYS) { const n = fe[e] || 0; if (!n) continue; const t = n >= 2; elb += `<div class="syb elst ${t ? 'on' : ''}" style="--rc:${ELEMENTS[e].col};--ec:${ELEMENTS[e].col};--ec2:${ELEMENTS[e].col2}" data-tip="els:${e}" aria-label="${ELEMENTS[e].name} ${n}"><span class="orb"></span><b class="cnt">${n}</b><span class="pips">${EL_STACK.at.map(v => `<i class="${n >= v ? 'f' : ''}"></i>`).join('')}</span></div>`; }
    const tc = temperCounts(run); let tmb = '';
    for (const k in tc) { const T = TEMPERS[k]; if (tc[k] >= 2) tmb += `<div class="syb tmp on ${T.side}" data-tip="tmp:${k}" aria-label="${esc(T.pair)}"><span class="glyph">${T.icon}</span><b class="cnt">${tc[k]}</b></div>`; }
    let sh = '';
    if (bon) sh += `<div class="sygroup"><span class="sylabel" data-tip="help:bonus">Bonuses</span>${bon}</div>`;
    if (elb) sh += `<div class="sygroup"><span class="sylabel" data-tip="help:els">Elements</span>${elb}</div>`;
    if (tmb) sh += `<div class="sygroup"><span class="sylabel" data-tip="help:tmp">Pairs</span>${tmb}</div>`;
    if (all.length) sh += `<div class="sygroup"><span class="sylabel" data-tip="help:combo">Combos <b>${on.size}/${COMBO_SLOTS}</b></span>${com}</div>`;
    $('synChips').innerHTML = sh || '<span class="note">Two heroes of the same race or class switch on a bonus.</span>';
    $('synChips').querySelectorAll('[data-act]').forEach(b => b.onclick = () => G.act(b.dataset.act, b.dataset.arg));
    // expanded drawer: battle chart on top, then live bonuses spelled out, near-misses as small badges, then combos
    let tp = `<section class="tsec"><h4>Battle stats <small id="teamChartLabel"></small></h4><div id="teamChart"><p class="note">Fills in once a siege starts.</p></div></section>`;
    const live = [], near = [];
    const sort = (key, def, n, isRace) => { if (!n) return; const t = act[key], next = def.at.find(v => v > n);
      if (t >= 0) live.push(`<div class="trait on" data-tip="syn:${key}" style="--rc:${isRace ? def.color : 'var(--sky)'}">${badge(key, def, n, isRace)}<div><b>${esc(def.name)}</b><small>${next ? `${n} / ${next} for more` : 'max'}</small><p>${esc(def.desc(t).replace(/^[^:]+: /, ''))}</p></div></div>`);
      else near.push(`<span class="near" data-tip="syn:${key}" style="--rc:${isRace ? def.color : 'var(--sky)'}">${badge(key, def, n, isRace)}<b>${esc(def.name)}</b><small>${n}/${def.at[0]}</small></span>`); };
    for (const k in RACES) sort(k, RACES[k], race[k], true); for (const k in CLASSES) sort(k, CLASSES[k], cls[k], false);
    tp += `<section class="tsec"><h4>Team bonuses <b>${live.length}</b></h4>${live.length ? `<div class="tgrid">${live.join('')}</div>` : '<p class="note">Place two heroes of the same race or class to switch on a bonus.</p>'}${near.length ? `<div class="nears"><small>One more hero away</small>${near.join('')}</div>` : ''}</section>`;
    { const st = EL_KEYS.filter(e => (fe[e] || 0) >= 1).map(e => { const n = fe[e], E = ELEMENTS[e], i = Math.min(n, 4) - 2, stat = { ad: 'attack', ap: 'ability power', def: 'HP' }[E.style];
        return n >= 2 ? `<div class="trait on" data-tip="els:${e}" style="--rc:${E.col}"><span class="syb elst on" style="--rc:${E.col};--ec:${E.col};--ec2:${E.col2}"><span class="orb"></span><b class="cnt">${n}</b></span><div><b>${E.name} ×${n}</b><small>${n < 4 ? `${n} / ${n + 1} for more` : 'max'}</small><p>${E.name} power ×${EL_STACK.mul[i]}, +${Math.round(EL_STACK.stat[i] * 100)}% ${stat}.</p></div></div>`
          : `<span class="near" data-tip="els:${e}" style="--rc:${E.col}"><span class="syb elst" style="--rc:${E.col};--ec:${E.col};--ec2:${E.col2}"><span class="orb"></span></span><b>${E.name}</b><small>1/2</small></span>`; });
      const on = st.filter(r => r.startsWith('<div')), off = st.filter(r => !r.startsWith('<div'));
      if (st.length) tp += `<section class="tsec"><h4>Element stacks <b>${on.length}</b></h4>${on.length ? `<div class="tgrid">${on.join('')}</div>` : ''}${off.length ? `<div class="nears"><small>One more of the same element</small>${off.join('')}</div>` : ''}</section>`; }
    { const rows = Object.keys(tc).sort((x, y) => tc[y] - tc[x]).map(k => { const T = TEMPERS[k], on = tc[k] >= 2;
        return on ? `<div class="trait on tmpr ${T.side}" data-tip="tmp:${k}"><span class="syb tmp on ${T.side}"><span class="glyph">${T.icon}</span><b class="cnt">${tc[k]}</b></span><div><b>${esc(T.pair)}</b><small>${T.name} pair</small><p>${esc(T.pdesc)}</p></div></div>`
          : `<span class="near tmpn ${T.side}" data-tip="tmp:${k}"><span class="syb tmp ${T.side}"><span class="glyph">${T.icon}</span></span><b>${T.name}</b><small>1/2</small></span>`; });
      const on = rows.filter(r => r.startsWith('<div')), off = rows.filter(r => !r.startsWith('<div'));
      if (rows.length) tp += `<section class="tsec"><h4>Temperaments <b>${on.length}</b></h4>${on.length ? `<div class="tgrid">${on.join('')}</div>` : ''}${off.length ? `<div class="nears"><small>${on.length ? 'Unpaired' : 'Pair two of the same for a bonus'}</small>${off.join('')}</div>` : ''}</section>`; }
    if (all.length) tp += `<section class="tsec"><h4>Element combos <b>${on.size}/${COMBO_SLOTS}</b> <small>${G.phase === 'prep' ? 'click to switch' : 'switch between sieges'}</small></h4><div class="tgrid">${all.map(c => `<button class="trait combo ${on.has(c.key) ? 'on' : ''}" data-act="combo" data-arg="${c.key}" data-tip="combo:${c.key}" style="--ec:${ELEMENTS[c.a].col};--ec2:${ELEMENTS[c.b].col}" ${G.phase !== 'prep' ? 'disabled' : ''}><span class="syb combo ${on.has(c.key) ? 'on' : ''}"><span class="orb"></span><span class="glyph">${COMBO_GLYPH[c.kind] || '✦'}</span></span><div><b>${esc(c.name)}</b><small>${on.has(c.key) ? 'ON' : 'off'}</small><p>${esc(c.desc)}</p></div></button>`).join('')}</div></section>`;
    if (UI.teamKey !== tp) { UI.teamKey = tp; $('teamPanel').innerHTML = tp; $('teamPanel').querySelectorAll('[data-act]').forEach(b => b.onclick = () => G.act(b.dataset.act, b.dataset.arg)); UI.renderStats(); }
    let h = '';
    for (const hr of run.roster) {
      const d = HERO_BY_ID[hr.id], u = B && B.heroes.find(x => x.inst === hr);
      const where = !hr.place ? '<span class="where off">bench</span>' : hr.place.type === 'rafter' ? '<span class="where">rafter</span>' : `<span class="where">${hr.place.c < GRID.courtCols ? 'court' : 'front'}</span>`;
      const pend = u && !u.alive ? `<span class="dmg" style="color:var(--rose)">fallen · XP lost</span>` : u ? `<span class="dmg">${fmt(u.dmg)} dmg · +${Math.round(u.xp)} xp</span>` : `<span class="dmg">${CLASSES[d.cls].icon} ${CLASSES[d.cls].name}</span>`;
      h += `<div class="hcard ${G.selected === hr.uid ? 'sel' : ''} ${hr.place ? '' : 'benched'}" data-uid="${hr.uid}" tabindex="0" role="button" aria-label="${esc(heroDisplayName(hr))}, level ${hr.level}" ${hr.el ? `style="--ec:${ELEMENTS[hr.el].col}"` : ''}>
        <div class="port ${hr.el ? 'elemental' : ''}"><img class="px" src="${portrait(heroSpriteKey(hr))}" alt="" draggable="false"><span class="lv">Lv ${hr.level}</span>${where}</div>
        <b>${esc(heroDisplayName(hr))}</b>${xpBar(hr)}
        <div class="hmeta"><span class="cg" data-tip="cls:${d.cls}">${CLASSES[d.cls].icon}</span><span class="cg tg ${TEMPERS[heroTemper(hr)].side}" data-tip="tmp:${heroTemper(hr)}">${TEMPERS[heroTemper(hr)].icon}</span>${hr.el ? `<span class="eg" data-tip="el:${hr.el}" style="--ec:${ELEMENTS[hr.el].col}"></span>` : ''}${heroItems(run, hr).map(it => `<img class="px hi" src="${itemIconURL(it, 2)}" alt="" data-tip="txt:${esc(itemName(it))}|${esc(itemDesc(it))}">`).join('')}</div>
        ${u ? `<div class="live"><i style="width:${Math.max(0, 100 * u.hp / u.maxHp)}%;${u.alive ? '' : 'background:var(--rose)'}"></i></div>` : ''}${pend}</div>`;
    }
    $('rosterCards').innerHTML = h;
    $('rosterCards').querySelectorAll('.hcard[data-uid]').forEach(el => {
      el.onpointerdown = e => G.cardDown(e, el.dataset.uid);
      el.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); G.select(el.dataset.uid); } };
    });
    UI.renderInspector();
  },
  renderInspector() {
    const run = G.run, h = run.roster.find(x => x.uid === G.selected), el = $('inspector');
    if (!h) { el._html = null; el.innerHTML = `<h3>Pick a champion</h3><p class="note">Click a card or a hero on the field to see their rolls, signature and items. Drag cards onto the field to place them.</p>`; return; }
    const d = HERO_BY_ID[h.id], st = heroStats(h, run, G.meta);
    const its = heroItems(run, h);
    const sig = h.level < SIG_LEVEL ? `<div class="ability locked"><b data-tip="ab:${st.ability}" class="tipped">${esc(st.aName)}</b> <span class="chip">Unlocks at Lv ${SIG_LEVEL}</span><p>${esc(st.aDesc)}</p><p class="note">Until then ${esc(d.name.split(' ')[0])} only uses basic attacks.</p></div>`
      : `<div class="ability"><b data-tip="ab:${st.ability}" class="tipped">${esc(st.aName)}</b> <span class="chip">Rank ${st.rank} · ${Math.round(st.sigMul * 100)}% power</span><p>${esc(st.aDesc)}</p><p class="note">${st.rank < 5 ? `Next rank at level ${[8, 12, 16, 20][st.rank - 1]}: more targets, bigger area.` : 'Maximum rank.'} Power grows every level.</p></div>`;
    const html = `<div class="icol"><div class="top"><img class="px" src="${portrait(heroSpriteKey(h), 'atk')}" alt=""><div><h3>${esc(heroDisplayName(h))}</h3><div class="chips">${raceChip(d.race)}${clsChip(d.cls)}${elChip(h.el)}${temperChip(heroTemper(h), h.place && (temperCounts(run)[heroTemper(h)] || 0) >= 2)}<span class="chip">Level ${h.level}</span>${tierBadge(d.tier)}</div>${xpBar(h)}<small class="note">${Math.floor(h.xp)} / ${xpNeed(h.level)} XP · earned from kills and surviving</small></div></div>
      ${rollBars(st.rolls, h.rolls)}
      <div class="stats"><div><small>HP</small><span>${fmt(st.hp)}</span></div><div><small>Attack</small><span>${fmt(st.atk)}</span></div><div><small>Speed</small><span>${st.as.toFixed(2)}/s</span></div>
      <div><small>Ability</small><span>${Math.round(st.ap * 100)}%</span></div><div><small>Armor</small><span>${Math.round(st.armor)}</span></div><div><small>Crit</small><span>${Math.round(st.crit * 100)}%</span></div></div>
      </div><div class="icol">${sig}
      ${h.el ? `<div class="ability el" style="--ec:${ELEMENTS[h.el].col}"><b data-tip="el:${h.el}" class="tipped">${ELEMENTS[h.el].name}</b> <span class="chip">${STYLE_NAME[ELEMENTS[h.el].style]}</span><p>${esc(ELEMENTS[h.el].desc)}</p></div>` : h.level >= ELEMENT_LEVEL ? '' : `<p class="note">Picks an element at level ${ELEMENT_LEVEL}.</p>`}
      <div class="slots">${Array.from({ length: ITEM_SLOTS }, (_, i) => its[i] ? `<span class="slot"><img class="px" src="${itemIconURL(its[i], 2)}" alt="">${esc(itemName(its[i]))}</span>` : `<span class="slot">Empty</span>`).join('')}</div>
      ${(() => { const u = G.phase === 'siege' && G.B && G.B.heroes.find(x => x.inst === h); return u && u.alive && u.rafter ? `<div class="row"><button class="btn small primary" data-iact="jump" title="Leap down and fight on the field for the rest of this siege">Jump to the front ⤵</button></div>` : u && h.place && h.place.type === 'rafter' && !u.rafter ? '<p class="note">Fighting on the field this siege. Back on the rafters next siege.</p>' : ''; })()}
      ${G.phase === 'prep' ? `<div class="row"><button class="btn small" data-iact="items">Items</button>
        ${h.place ? `<button class="btn small" data-iact="bench">Bench</button>` : `<button class="btn small" data-iact="place">Place</button>`}
        ${run.roster.length > 1 ? `<button class="btn small danger" data-iact="sell" title="Release this champion for gold. Their items go back to the Armory.">${UI.sellArm === h.uid ? 'Click again to confirm' : `Release for ${COST(sellValue(h))}`}</button>` : ''}</div>` : ''}</div>`;
    if (el._html === html) return; el._html = html; el.innerHTML = html;
    el.querySelectorAll('[data-iact]').forEach(b => b.onclick = () => G.act('h-' + b.dataset.iact, h.uid));
  },

  // ----- modals -----
  modal(html, onBind, cls) { $('sheet').innerHTML = html; $('sheet').className = 'sheet ' + (cls || ''); $('modal').hidden = false; if (onBind) onBind($('sheet')); const f = $('sheet').querySelector('button:not(.x)'); if (f) f.focus({ preventScroll: true }); },
  closeModal() { $('modal').hidden = true; },
  draftHTML(opts, kind, rerollCost) {
    const head = { starter: ['Choose your champion', 'Your first hero holds the gate alone for one siege. Stats are rolled 1 to 10 for each card.'], partner: ['Choose a partner', 'Your champion learned to level up and carry items. Time for backup.'], guild: ['Draft a champion', 'The Guild took your gold. Pick one to join your keep.'], recruit: ['Pick your new champion', 'The goblins brought company. Three champions want in. Choose one to join your keep.'], reinforce: ['A champion answers the call', G.run.siege <= 5 ? 'A boss is coming. The Guild sent help. Pick one to join.' : 'The boss is down and the Guild found new blood. Pick one to join.'] }[kind];
    const run = G.run, fits = opts.map(o => draftFit(run, o)), best = run.roster.length ? fits.reduce((b, f, i) => f.score > fits[b].score ? i : b, 0) : -1;
    let h = `<span class="eyebrow">Hero draft</span><h2>${head[0]}</h2><p class="lede">${head[1]}</p>${keepStripHTML(run)}<div class="draft">`;
    opts.forEach((o, i) => { const d = HERO_BY_ID[o.id], tot = o.rolls.ad + o.rolls.ap + o.rolls.def, bs = bestStyle(o.rolls);
      h += `<button class="dcard ${i === best && fits[i].score >= 3 ? 'bestfit' : ''}" data-pick="${i}" style="animation-delay:${i * 0.08}s">${i === best && fits[i].score >= 3 ? '<span class="bfb">Best fit</span>' : ''}<div class="dport"><img class="px" src="${portrait('h:' + o.id, 'idle0')}" alt="">${tierBadge(d.tier)}</div>
        <h3>${esc(d.name)}</h3><div class="chips">${raceChip(d.race)}${clsChip(d.cls)}${o.temper ? temperChip(o.temper, G.run.roster.some(h => heroTemper(h) === o.temper)) : ''}</div><p class="role">${esc(CLASS_ROLE[d.cls] || '')}</p>${run.roster.length ? `<div class="fits">${fits[i].html}</div>` : ''}${rollBars(o.rolls)}<div class="dtot"><span>Roll total <b>${tot}</b></span>${styleChip(bs)}</div>
        ${(() => { const sp = G.meta.spec && G.meta.spec[d.cls], alt = sp && sp.rank && sp.path === 'b' ? SPECS[d.cls].b : null; return `<p><b data-tip="ab:${alt ? alt.ability : d.ability}" class="tipped">${esc(alt ? alt.name : d.aName)}</b> <small>(signature, Lv ${SIG_LEVEL}${alt ? ', class spec' : ''})</small><br>${esc(alt ? SPEC_ADESC[alt.ability] : d.aDesc)}</p>`; })()}</button>`; });
    h += `</div><div class="row between"><span class="note">Attack powers basic hits, Ability power powers signatures, Defense powers HP and armor. Elements later scale with the matching roll.</span>
      <span class="row" style="gap:6px;flex-wrap:wrap;justify-content:flex-end">${draftFocusOptions(G.run).map(f => `<button class="btn small ghost" data-focus="${f.kind}:${f.key}" ${G.run.gold < rerollCost ? 'disabled' : ''} data-tip="txt:Search for a ${esc(f.label.replace(/^[^ ]+ /, ''))}|New cards, and at least one of them is a ${esc(f.label.replace(/^[^ ]+ /, ''))}. Same price as new cards.">Find ${f.label} ${rerollCost ? COST(rerollCost) : ''}</button>`).join('')}
      <button class="btn small" id="draftReroll" ${G.run.gold < rerollCost ? 'disabled' : ''}>New cards ${rerollCost ? COST(rerollCost) : '(free once)'}</button></span></div>`;
    return h;
  },
  lootHTML(opts, cost) {
    const boss = opts[0] && opts[0].parts.length === 2;
    let h = `<span class="eyebrow">Spoils of the siege</span><h2>${boss ? 'The boss dropped its hoard' : 'Pick a component'}</h2><p class="lede">${boss ? 'Choose one finished item.' : 'Two components on one hero fuse into a finished item. Check the recipe book in the Armory.'}</p><div class="loot">`;
    // components you already hold, and what each offered component would make with them
    const run = G.run, owned = run.stash.filter(it => it.parts.length === 1), keys = [...new Set(owned.map(it => it.parts[0]))];
    const holderName = it => { const hr = it.holder && run.roster.find(x => x.uid === it.holder); return hr ? 'on ' + heroDisplayName(hr).split(' ')[0] : 'in the Armory'; };
    const fin = (a, b) => { const F = FINISHED[itemKey(a, b)]; return F ? (F[1] === 'emblem' ? ['Elemental Crest', 'Gives the hero a second element.'] : [F[0], F[2]]) : null; };
    opts.forEach((o, i) => { const it = { parts: o.parts, el: null };
      const builds = !boss && o.parts.length === 1 ? keys.map(k => { const f = fin(o.parts[0], k); return f ? `<div class="bld" data-tip="txt:${esc(f[0])}|${esc(f[1])}"><img class="px" src="${iconURL(COMPONENTS[k].glyph, 2)}" alt=""><span>+ ${esc(COMPONENTS[k].name)}</span><b>${esc(f[0])}</b></div>` : ''; }).join('') : '';
      h += `<button class="lcard" data-pick="${i}" style="animation-delay:${i * 0.07}s"><img class="px" src="${itemIconURL(it, 5)}" alt=""><b>${esc(o.parts.length === 2 && o.parts.includes('spatula') ? 'Crest' : itemName(it))}</b><span>${esc(o.parts.length === 2 && o.parts.includes('spatula') ? 'A random second element' : itemDesc(it))}</span>
        ${!boss && o.parts.length === 1 ? `<div class="blds"><small>${keys.length ? 'Builds with what you have' : 'Nothing to combine with yet'}</small>${builds}</div>` : ''}</button>`; });
    h += `</div>`;
    if (!boss) h += `<div class="owned"><span class="eyebrow">Your components</span>${owned.length ? owned.map(it => `<span class="own"><img class="px" src="${iconURL(COMPONENTS[it.parts[0]].glyph, 2)}" alt=""><b>${esc(COMPONENTS[it.parts[0]].name)}</b><small>${esc(holderName(it))}</small></span>`).join('') : '<span class="note">None yet. This will be your first.</span>'}</div>`;
    return h + `<div class="row" style="justify-content:flex-end"><button class="btn small" id="lootReroll" ${G.run.gold < cost ? 'disabled' : ''}>Reroll ${COST(cost)}</button></div>`;
  },
  elementHTML(hr, opts) {
    const r = effRolls(G.run, hr);
    let h = `<span class="eyebrow">Level ${hr.level} · elemental awakening</span><div class="visitor"><img class="px" src="${portrait(heroSpriteKey(hr), 'atk')}" alt=""><div><h2>${esc(HERO_BY_ID[hr.id].name)} awakens</h2><p class="lede">Pick an element. Its power scales with the matching roll, and different elements across your heroes form combos.</p>${rollBars(r)}</div></div><div class="elcards">`;
    opts.forEach((e, i) => { const E = ELEMENTS[e], p = 0.6 + 0.08 * r[E.style];
      const combos = [...new Set(G.run.roster.filter(x => x !== hr).flatMap(x => heroElements(G.run, x)))].filter(x => x !== e).map(x => COMBOS[comboKey(e, x)]).filter(Boolean);
      h += `<button class="ecard" data-pick="${i}" data-tip="el:${e}" style="--ec:${E.col};--ec2:${E.col2};animation-delay:${i * 0.09}s"><div class="eorb"><img class="px" src="${portrait('h:' + hr.id + ':' + e, 'idle0')}" alt=""></div><h3>${E.name}</h3>${styleChip(E.style)}<p>${esc(E.desc)}</p>
        <small>Power ${Math.round(p * 100)}% from ${STAT_NAME[E.style]} ${r[E.style]}</small>${combos.length ? `<small class="cmb">Combos: ${combos.map(c => esc(c[0])).join(', ')}</small>` : ''}<em>${esc(HERO_BY_ID[hr.id].name.split(' ')[0])} ${esc(E.title)}</em></button>`; });
    return h + `</div>`;
  },
  castleHTML(opts) {
    let h = `<span class="eyebrow">Siege ${CASTLE_SIEGE} · the keep awakens</span><h2>Choose your castle's element</h2><p class="lede">The castle takes on an element and gains a new defense power you fire with <kbd>E</kbd>. Elements your heroes carry are offered first.</p><div class="elcards">`;
    opts.forEach((e, i) => { const E = ELEMENTS[e], P = CASTLE_POWERS[e]; h += `<button class="ecard" data-pick="${i}" style="--ec:${E.col};--ec2:${E.col2};animation-delay:${i * 0.09}s"><div class="eorb castle"><img class="px" src="${castlePreviewURL(e)}" alt=""></div><h3>${E.name} Castle</h3><b class="pw">${esc(P.name)}</b><p>${esc(P.desc)}</p></button>`; });
    return h + `</div>`;
  },
  reportHTML(rep) {
    const max = Math.max(1, ...rep.heroes.map(h => Math.max(h.dmg, h.heal)));
    const mvp = rep.heroes.slice().sort((a, b) => (b.dmg + b.heal) - (a.dmg + a.heal))[0];
    let h = `<span class="eyebrow">${esc(rep.faction)}</span><h2>Siege ${rep.siege} held</h2>`;
    h += `<div class="tiles"><div class="tile"><small>Gold</small><span style="color:var(--gold)">+${fmt(rep.gold)}</span></div><div class="tile"><small>Foes slain</small><span>${rep.kills}</span></div><div class="tile"><small>Castle damage</small><span style="color:${rep.castleLost > 0 ? 'var(--rose)' : 'var(--mint)'}">${fmt(Math.max(0, rep.castleLost))}</span></div>${rep.drops.length ? `<div class="tile"><small>Item drops</small><span>${rep.drops.map(k => `<img class="px" src="${iconURL(COMPONENTS[k].glyph, 2)}" alt="${esc(COMPONENTS[k].name)}" style="width:20px;height:20px">`).join('')}</span></div>` : ''}${rep.castleGrow ? `<div class="tile grow"><small>Keep grows</small><span style="color:var(--gold)">${fmt(rep.castleGrow.from)} → ${fmt(rep.castleGrow.to)}</span></div>` : ''}${rep.bossFled ? `<div class="tile"><small>Boss got away</small><span style="color:var(--rose)">${esc(rep.bossFled)}</span></div>` : ''}${rep.fled ? `<div class="tile"><small>Broke through</small><span style="color:var(--rose)">${rep.fled}</span></div>` : ''}${rep.repaired ? `<div class="tile"><small>Fountain</small><span style="color:var(--mint)">+${fmt(rep.repaired)}</span></div>` : ''}</div>`;
    h += `<div class="eyebrow">Experience</div><div class="xprep">`;
    for (const hr of rep.heroes) { const inst = G.run.roster.find(x => x.uid === hr.uid);
      h += `<div class="xrow ${hr.alive ? '' : 'dead'}"><img class="px" src="${portrait(inst ? heroSpriteKey(inst) : 'h:' + hr.id)}" alt=""><div><b>${esc(inst ? heroDisplayName(inst) : HERO_BY_ID[hr.id].name)}</b>
        ${hr.alive ? `<span class="xpgain">+${hr.xp} XP</span>` : `<span class="xplost">Fell in battle. Lost ${hr.lost} XP.</span>`}
        <div class="xpbar big" data-from="${hr.levels ? 0 : Math.min(100, 100 * hr.fromXp / xpNeed(hr.fromLv))}" data-to="${Math.min(100, 100 * hr.toXp / xpNeed(hr.toLv))}"><i></i></div></div>
        <div class="lvl">${hr.levels ? `<span class="lvup">LEVEL UP</span><b>Lv ${hr.fromLv} → ${hr.toLv}</b>` : `<b>Lv ${hr.toLv}</b>`}</div></div>`; }
    h += `</div><div class="eyebrow" style="margin-top:8px">Battle stats${mvp ? ` · MVP ${esc(HERO_BY_ID[mvp.id].name)}` : ''}</div>${UI.statsChartHTML(rep.heroes, 'Hover a bar', true)}`;
    h += `</div><div class="row" style="justify-content:flex-end"><button class="btn primary" id="repNext">Claim the spoils →</button></div>`;
    return h;
  },
  animateXP(sheet) { sheet.querySelectorAll('.xpbar.big').forEach(b => { const i = b.querySelector('i'); i.style.transition = 'none'; i.style.width = b.dataset.from + '%'; requestAnimationFrame(() => requestAnimationFrame(() => { i.style.transition = 'width 1.1s cubic-bezier(.3,.9,.3,1)'; i.style.width = b.dataset.to + '%'; })); }); },
  encounterHTML(enc) {
    return `<span class="eyebrow">${enc.story ? `The story so far · ${esc(FACTIONS[enc.f].name)}` : 'Between the sieges'}</span><div class="visitor ${enc.story ? 'story' : ''}"><img class="px" src="${enc.portrait ? portrait(enc.portrait, 'idle0') : portrait('npc:' + enc.id, 'idle0')}" alt=""><div><h2>${esc(enc.title)}</h2><p class="lede">${esc(enc.text)}</p></div></div>
      ${enc.boon ? '<p class="boonnote">Every choice here is good. Pick what your keep needs.</p>' : ''}
      <div class="opts ${enc.boon ? 'boon' : ''}">${enc.opts.map((o, i) => `<button class="opt" data-opt="${i}"><b>${esc(o.label)}</b><span class="etags">${encTags(o.fx).map(t => `<i class="et ${t.k}">${esc(t.s)}</i>`).join('')}</span>${o.sub ? `<span>${esc(o.sub)}</span>` : ''}</button>`).join('')}</div>`;
  },
  siegeBlurb(s) { const F = FACTIONS[factionIndex(s)]; return isBossSiege(s) ? `${F.name} · ${ENEMIES[bossFor(s)].name}${s === FINAL_SIEGE ? ' (final boss)' : ''}` : `${F.name} · siege ${(s - 1) % 5 + 1} of 5`; },
  playtestHTML(P) {
    const els = [['', 'Run picks', null], ...EL_KEYS.map(e => [e, ELEMENTS[e].name, castleThumbURL(e)])];
    const jumps = [1, 5, 10, 15, 20, 25, 29, 30, 35, 40, 45, 50];
    return `<span class="eyebrow">Playtest</span><h2>Jump to any siege</h2>
      <p class="lede">A bot plays every siege before the one you pick, so your champions, items, tech and gold look like a real run there. It never loses on the way. Playtest runs earn no diamonds or achievements.</p>
      <div class="pt">
        <div class="ptrow"><b>Start at siege <span id="ptSiegeV"></span></b><input type="range" id="ptSiege" min="1" max="${FINAL_SIEGE}" value="${P.siege}"><span id="ptSiegeInfo" class="muted"></span>
          <div class="ptjumps">${jumps.map(j => `<button class="btn small" data-ptsiege="${j}">${j}${isBossSiege(j) ? ' ☠' : ''}</button>`).join('')}</div></div>
        <div class="ptrow"><b>Castle</b><div class="ptcastles">${els.map(([e, n, url]) => `<button class="ptc ${(P.el || '') === e ? 'on' : ''}" data-ptel="${e}" ${e ? `style="--ec:${ELEMENTS[e].col}"` : ''}>${url ? `<img class="px" src="${url}" alt="">` : '<span class="ptq">?</span>'}<small>${esc(n)}</small></button>`).join('')}</div>
          <small class="muted">"Run picks" leaves it to the bot at siege ${CASTLE_SIEGE}. Picking one gives you that castle from the start.</small></div>
        <div class="ptsel"><label>Field hazard<select id="ptHz"><option value="">None</option>${Object.entries(HAZARDS).map(([k, z]) => `<option value="${k}" ${P.hz === k ? 'selected' : ''}>${esc(z.name)}</option>`).join('')}</select></label>
          <label>Bonus gold<select id="ptGold">${[0, 300, 1000, 5000].map(g => `<option value="${g}" ${P.gold === g ? 'selected' : ''}>${g ? '+' + g : 'None'}</option>`).join('')}</select></label>
          <label>Bot builds like<select id="ptStyle">${['balanced', 'brawler', 'arcanist', 'bulwark', 'crit'].map(k => `<option value="${k}" ${P.style === k ? 'selected' : ''}>${esc(BOT_STYLES[k].name)}</option>`).join('')}</select></label></div>
      </div>
      <div class="row" style="justify-content:space-between;align-items:center;margin-top:12px"><span id="ptMsg" class="muted"></span><span class="row"><button class="btn" id="ptCancel">Back</button><button class="btn primary" id="ptGo">Start playtest</button></span></div>`;
  },
  // a hazard's field preview: a tiny painted strip plus what it does
  hazardCard(id) { const z = HAZARDS[id]; return `<div class="hzcard" style="--hz:${z.col}"><img class="px" src="${hazardThumbURL(id)}" alt=""><div><b>${esc(z.name)}</b><span>${esc(z.desc)}</span><small>Only for the next siege.</small></div></div>`; },
  reforgeHTML(run, list, title) {
    const who = it => { const h = it.holder && run.roster.find(x => x.uid === it.holder); return h ? heroDisplayName(h) : 'In the stash'; };
    return `<span class="eyebrow">${esc(title)}</span><h2>Reforge an item</h2><p class="lede">Pick a finished item. It becomes a different random finished item and stays with whoever holds it.</p>
      <div class="rflist">${list.map(it => `<button class="rf" data-rf="${it.uid}"><img class="px" src="${itemIconURL(it)}" alt=""><div><b>${esc(itemName(it))}</b><span>${esc(who(it))}</span></div></button>`).join('')}</div>`;
  },

  // ----- coach: one-time highlights that point at trays as they appear -----
  coachQ: [], coachOn: null,
  coach(key, el, text) {
    if (!el || (G.meta.seen && G.meta.seen[key])) return;
    if (UI.coachOn) { if (!UI.coachQ.some(q => q.key === key)) UI.coachQ.push({ key, el, text }); return; }
    UI.coachOn = { key, el }; el.classList.add('spot');
    const c = $('coach'); c.innerHTML = `<p>${esc(text)}</p><button class="btn small primary">Got it</button>`; c.hidden = false;
    const r = el.getBoundingClientRect(), cw = Math.min(280, window.innerWidth - 32);
    const below = r.bottom + 120 < window.innerHeight;
    c.style.width = cw + 'px'; c.style.left = Math.max(16, Math.min(window.innerWidth - cw - 16, r.left + r.width / 2 - cw / 2)) + 'px';
    c.style.top = (below ? r.bottom + 12 : Math.max(8, r.top - c.offsetHeight - 12)) + 'px'; c.classList.toggle('above', !below);
    c.querySelector('button').onclick = () => UI.coachDone(key);
  },
  coachLater(key, getEl, text) { setTimeout(() => UI.coach(key, getEl(), text), 260); },
  coachDone(key) {
    const on = UI.coachOn; if (!on || (key && on.key !== key)) return;
    on.el.classList.remove('spot'); $('coach').hidden = true; UI.coachOn = null;
    G.meta.seen = G.meta.seen || {}; G.meta.seen[on.key] = 1; save();
    const n = UI.coachQ.shift(); if (n) setTimeout(() => UI.coach(n.key, n.el, n.text), 200);
  },
};
