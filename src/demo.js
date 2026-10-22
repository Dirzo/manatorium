// ===== Store demo: the app plays the first three hordes free, then one purchase unlocks the rest =====
// The limit only applies in the native app (or with ?demo on the web). The purchase itself lives in app/native.js
// (RevenueCat), which only the app build includes; this file talks to it through window.SOL_IAP.
const DEMO = {
  LAST: CASTLE_SIEGE, // the demo ends after the siege 15 boss, right after the elemental castle choice
  PRICE: '$4.99',     // shown until the store reports the real local price
  unlocked: false, ready: false, price: null, busy: false,
  enforced() { return /[?&]demo\b/.test(location.search) || !!(window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform()); },
  on() { return DEMO.enforced() && !DEMO.unlocked; },
  locked(run) { return DEMO.on() && run && run.siege > DEMO.LAST && !run.won; },
  async init() {
    try { DEMO.unlocked = localStorage.getItem('sol.unlocked') === '1'; } catch (e) { }
    if (!window.SOL_IAP) return;
    try { const r = await SOL_IAP.init(); DEMO.ready = !!r.ready; DEMO.why = r.why || null; DEMO.price = r.price || null; if (r.owned) DEMO.grant(true); }
    catch (e) { console.warn('store', e); }
  },
  grant(quiet) {
    const was = DEMO.unlocked; DEMO.unlocked = true; try { localStorage.setItem('sol.unlocked', '1'); } catch (e) { }
    if (quiet || was) return;
    UI.closeModal(); SFX.play('victory'); FX.flash('#ffcf3a', 0.5);
    UI.banner('Full game unlocked', 'Seven more hordes await'); TEL.event('unlock', { s: G.run && G.run.siege });
    if (!$('title').hidden) showTitle();
  },
  async buy() {
    if (DEMO.busy) return;
    if (!window.SOL_IAP || !DEMO.ready) { UI.toast(DEMO.why === 'no store key' ? 'Purchases are not set up in this build yet.' : 'The store is not reachable right now. Check your connection and try again.', true); if (window.SOL_IAP) DEMO.init(); return; }
    DEMO.busy = true; DEMO.mark('Opening the store…');
    const r = await SOL_IAP.buy().catch(e => ({ ok: false, error: e && e.message }));
    DEMO.busy = false; DEMO.mark('');
    if (r.ok) DEMO.grant(); else if (!r.cancelled) UI.toast(r.error || 'The purchase did not go through.', true);
  },
  async restore() {
    if (DEMO.busy) return;
    if (!window.SOL_IAP || !DEMO.ready) { UI.toast('The store is not reachable right now.', true); return; }
    DEMO.busy = true; DEMO.mark('Checking your purchases…');
    const r = await SOL_IAP.restore().catch(e => ({ ok: false, error: e && e.message }));
    DEMO.busy = false; DEMO.mark('');
    if (r.ok) DEMO.grant(); else UI.toast(r.error || 'No purchase found for this store account.', true);
  },
  mark(t) { const m = document.getElementById('demoMsg'); if (m) m.textContent = t; document.querySelectorAll('#demoBuy,#demoRestore').forEach(b => b.disabled = !!t); },
  // ---- the "road ahead" screen ----
  html(run) {
    const hordes = [];
    for (let s = DEMO.LAST + 5; s <= FINAL_SIEGE; s += 5) { const F = FACTIONS[factionIndex(s)], b = ENEMIES[bossFor(s)];
      hordes.push(`<div class="rah"><img class="px" src="${portrait('e:' + bossFor(s))}" alt=""><b>${esc(F.name)}</b><small>${s === FINAL_SIEGE ? 'Final boss' : 'Siege ' + s}: ${esc(b ? b.name : '')}</small></div>`); }
    const done = run && run.siege > DEMO.LAST;
    return `<span class="eyebrow">${done ? `Demo complete · ${DEMO.LAST} sieges held` : `Free demo · sieges 1 to ${DEMO.LAST}`}</span>
      <h2>The road ahead</h2>
      <p class="lede">${done ? `Your keep has held through three hordes. Seven more are marching, and the goose is watching.` : `The demo plays the first three hordes. The full game has seven more.`}</p>
      <div class="rahs">${hordes.join('')}</div>
      <ul class="raf">
        <li><b>Legend Summons.</b> A Legendary champion after siege 35, a God after siege 40.</li>
        <li><b>Ascension.</b> Raise your favourite legends all the way to God rarity.</li>
        <li><b>The goose.</b> From siege 46 it carries off a champion before every siege.</li>
        <li><b>The Shard War.</b> The final battle, fought inside your own great hall.</li>
      </ul>
      <p class="note">One purchase unlocks everything, forever, with no ads. Your keep, diamonds and achievements carry over.</p>
      <div class="raact">
        <button class="btn primary go" id="demoBuy">Unlock the full game · ${esc(DEMO.price || DEMO.PRICE)}</button>
        <button class="btn small ghost" id="demoRestore">Restore purchase</button>
      </div>
      <p class="note" id="demoMsg" aria-live="polite"></p>
      <div class="raact sub">${done ? `<button class="btn small" id="demoEnd">End this run and climb the tower</button>` : ''}<button class="btn small ghost" id="demoClose">Not now</button></div>`;
  },
  show() {
    const run = G.run;
    UI.modal(DEMO.html(run), s => {
      s.querySelector('#demoBuy').onclick = () => DEMO.buy();
      s.querySelector('#demoRestore').onclick = () => DEMO.restore();
      s.querySelector('#demoClose').onclick = () => UI.closeModal();
      const end = s.querySelector('#demoEnd'); if (end) end.onclick = () => DEMO.endRun();
      requestAnimationFrame(() => { s.scrollTop = 0; });
    }, 'wide');
    TEL.event('paywall', { s: run && run.siege });
  },
  // the demo run ends like a fallen keep: the tower climb, records and achievements
  endRun() {
    UI.closeModal(); G.phase = 'over'; G.armed = null;
    TEL.runEnd(G.run, 'demo');
    UI.banner('The demo ends here', `You held ${G.run.siege - 1} sieges`);
    setTimeout(() => startTower(), 1800);
  },
};

{
  const begin0 = beginSiege, prep0 = toPrep, title0 = showTitle, boot0 = boot;
  // Begin siege past the last demo siege opens the road ahead instead
  beginSiege = function () { if (G.phase === 'prep' && DEMO.locked(G.run)) { DEMO.show(); return; } return begin0.apply(this, arguments); };
  // reaching siege 16 in the demo shows it once on its own
  toPrep = function () { const r = prep0.apply(this, arguments); const run = G.run; if (DEMO.locked(run) && !run.demoSeen) { run.demoSeen = true; save(); setTimeout(() => { if (G.phase === 'prep' && $('modal').hidden) DEMO.show(); }, 900); } return r; };
  // the title says it is a demo and offers the unlock
  showTitle = function () {
    const r = title0.apply(this, arguments);
    const cta = document.querySelector('#title .cta');
    if (cta && DEMO.on() && !document.getElementById('tUnlock')) {
      const b = document.createElement('button'); b.className = 'btn primary'; b.id = 'tUnlock'; b.textContent = `Unlock the full game · ${DEMO.price || DEMO.PRICE}`; b.onclick = () => DEMO.show();
      const n = document.createElement('p'); n.className = 'demonote'; n.textContent = `Free demo: the first ${DEMO.LAST} sieges.`;
      cta.appendChild(b); cta.after(n);
    }
    return r;
  };
  // the store answers after boot: refresh the title button with the local price, or drop it if already bought
  boot = function () {
    DEMO.init().then(() => { const b = document.getElementById('tUnlock'); if (!b) return; if (!DEMO.on()) { b.remove(); document.querySelectorAll('.demonote').forEach(n => n.remove()); } else b.textContent = `Unlock the full game · ${DEMO.price || DEMO.PRICE}`; });
    return boot0.apply(this, arguments);
  };
}
