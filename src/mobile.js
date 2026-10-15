// ===== Mobile: phone layouts (landscape and portrait), touch controls, and the native app shell =====
// Loaded after main.js and before boot(). It wraps a few functions instead of editing them, so desktop play is unchanged.
// Layout mode (html.m) is on for narrow windows and phones; touch features (html.touch) follow the primary pointer.
// native plugin calls return promises; a missing plugin or a refusal must never surface as an error
const quiet = f => { try { const r = f(); if (r && r.catch) r.catch(() => { }); } catch (e) { } };
const MOB = {
  on: false, land: false, touch: false, native: false, det: false, ready: false,
  wanted() {
    const q = location.search;
    if (/[?&]desktop\b/.test(q)) return false;
    if (/[?&]mobile\b/.test(q) || MOB.native) return true;
    return innerWidth < 900 || (MOB.touch && Math.min(innerWidth, innerHeight) <= 600);
  },
  init() {
    MOB.native = !!(window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform());
    MOB.touch = matchMedia('(pointer: coarse)').matches || /[?&]mobile\b/.test(location.search);
    const de = document.documentElement;
    de.classList.toggle('touch', MOB.touch); de.classList.toggle('native', MOB.native);
    if (MOB.touch) $('prepHint').textContent = 'Tap a champion card, then tap the field to place them. Drag to move them.';
    // a probe that reports the notch and home-bar insets
    const pr = document.createElement('div'); pr.id = 'safeProbe'; document.body.appendChild(pr); MOB.probe = pr;
    // phone-only controls: the "more" menu, the details toggle and the details panel wrapper
    const more = document.createElement('button'); more.id = 'mMore'; more.className = 'btn small'; more.setAttribute('aria-label', 'More options'); more.setAttribute('aria-expanded', 'false'); more.textContent = '☰';
    document.querySelector('.hud').appendChild(more);
    const menu = document.createElement('div'); menu.id = 'mMenu'; menu.hidden = true; menu.setAttribute('role', 'menu');
    menu.innerHTML = '<button class="btn small" id="mIntel">Scouts &amp; stats</button>';
    document.body.appendChild(menu);
    more.onclick = e => { e.stopPropagation(); MOB.menu(menu.hidden); };
    document.addEventListener('pointerdown', e => { if (!menu.hidden && !menu.contains(e.target) && e.target !== more) MOB.menu(false); });
    menu.addEventListener('click', e => { if (e.target.closest('button') && e.target.id !== 'soundBtn') setTimeout(() => MOB.menu(false), 0); });
    $('mIntel').onclick = () => { MOB.details(false); UI.setIntel($('intel').classList.contains('closed'), true); };
    const det = document.createElement('button'); det.id = 'mDet'; det.className = 'mdet'; det.setAttribute('aria-expanded', 'false'); det.innerHTML = '<span class="ico">☰</span><span>Details</span>';
    det.onclick = () => MOB.details(!MOB.det);
    document.querySelector('.hud .rail').appendChild(det);
    const detX = document.createElement('button'); detX.id = 'mDetX'; detX.className = 'btn small'; detX.textContent = 'Done ▼';
    detX.onclick = () => MOB.details(false);
    document.querySelector('#roster > header').appendChild(detX);
    const box = document.createElement('div'); box.className = 'm-det'; box.id = 'mDetBox'; MOB.box = box;
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => MOB.on && UI.layout()).observe($('rosterCards'));
    if (screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener('change', () => setTimeout(() => UI.layout(), 60));
    // iOS Safari ignores user-scalable=no; stop pinch zoom from moving the game
    document.addEventListener('gesturestart', e => e.preventDefault());
    MOB.wireTouch();
    if (MOB.native) MOB.wireNative();
    if (!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen) || MOB.native) de.classList.add('nofs');
    MOB.ready = true; UI.layout();
  },
  menu(open) { $('mMenu').hidden = !open; $('mMore').setAttribute('aria-expanded', String(open)); },
  details(open) {
    MOB.det = open; $('roster').classList.toggle('m-details', open); $('mDet').setAttribute('aria-expanded', String(open));
    if (open) { UI.setIntel(false, true); UI.renderInspector && UI.renderInspector(); }
    UI.layout();
  },
  // switch the DOM between the desktop and phone arrangements
  sync() {
    if (!MOB.ready) return;
    const want = MOB.wanted(), land = innerWidth > innerHeight, de = document.documentElement;
    MOB.land = land; de.classList.toggle('m-land', want && land); de.classList.toggle('m-port', want && !land);
    if (want === MOB.on) return;
    MOB.on = want; de.classList.toggle('m', want);
    const menu = $('mMenu'), ctl = document.querySelector('.hud .controls'), rb = document.querySelector('#roster .rbody'), cards = $('rosterCards');
    if (want) {
      for (const id of ['soundBtn', 'menuBtn', 'fsBtn', 'recBadge']) menu.appendChild($(id));
      // the arena and stage are their own stacking layers; panels move out so they can sit above the floating buttons
      document.body.appendChild($('drawer')); document.body.appendChild($('intel'));
      rb.insertBefore(MOB.box, cards); MOB.box.appendChild($('inspector')); MOB.box.appendChild($('teamPanel'));
      UI.setRoster(false); UI.setIntel(false, true);
    } else {
      for (const id of ['recBadge', 'soundBtn', 'menuBtn', 'fsBtn']) ctl.appendChild($(id));
      rb.appendChild($('inspector')); rb.appendChild($('teamPanel')); MOB.box.remove();
      $('arenaWrap').appendChild($('drawer')); document.querySelector('.stage').appendChild($('intel'));
      MOB.menu(false); MOB.details(false);
      for (const k of ['--ctlT', '--railT', '--pTop', '--stripH', '--colL', '--colR']) de.style.removeProperty(k);
    }
  },
  safe() { const s = getComputedStyle(MOB.probe); return { l: parseFloat(s.paddingLeft) || 0, r: parseFloat(s.paddingRight) || 0, t: parseFloat(s.paddingTop) || 0, b: parseFloat(s.paddingBottom) || 0 }; },
  // place the arena and the floating panels around it; the CSS reads these variables
  layout() {
    const st = document.documentElement.style, S = MOB.safe(), set = (k, v) => st.setProperty(k, Math.round(v) + 'px');
    const hud = document.querySelector('.hud').getBoundingClientRect().height;
    const strip = $('rosterCards').getBoundingClientRect().height + 8 + S.b;
    let w, h, ax, ay;
    if (MOB.land) {
      const colL = document.querySelector('.hud .rail').getBoundingClientRect().width + S.l + 10;
      const colR = document.querySelector('.hud .controls').getBoundingClientRect().width + S.r + 10;
      const availW = innerWidth - colL - colR, availH = innerHeight - hud - strip;
      w = availW; h = w * 9 / 16; if (h > availH) { h = availH; w = h * 16 / 9; }
      ax = colL + (availW - w) / 2; ay = hud + (availH - h) / 2;
      set('--colL', colL); set('--colR', colR);
    } else {
      w = innerWidth - S.l - S.r; h = w * 9 / 16; ax = S.l; ay = hud;
      const ctlT = ay + h + 6, ctlH = document.querySelector('.hud .controls').getBoundingClientRect().height;
      const railT = ctlT + ctlH + 6, railH = document.querySelector('.hud .rail').getBoundingClientRect().height;
      set('--ctlT', ctlT); set('--railT', railT); set('--pTop', railT + railH + 6);
    }
    set('--aw', w); set('--ah', h); set('--ax', ax); set('--ay', ay); set('--hudH', hud); set('--rosH', strip); set('--stripH', strip);
    if (typeof R !== 'undefined' && R.cv) resizeRender();
  },
  haptic(kind) {
    if (!MOB.touch) return;
    const H = MOB.native && Capacitor.Plugins && Capacitor.Plugins.Haptics;
    if (H) quiet(() => H.impact({ style: kind === 'heavy' ? 'HEAVY' : kind === 'medium' ? 'MEDIUM' : 'LIGHT' })); else try { if (navigator.vibrate) navigator.vibrate(kind === 'heavy' ? 30 : kind === 'medium' ? 18 : 8); } catch (e) { }
  },
  // tips sit above the finger instead of under it
  showTip(el, x, y) {
    const t = $('tip'), key = el.dataset && el.dataset.tip;
    if (key) UI.tipShow(el, x, y);
    else { const txt = el.getAttribute('title'); if (!txt) return; t.innerHTML = `<p>${esc(txt)}</p>`; t.hidden = false; UI.tipKey = 'title'; UI.tipEl = el; }
    if (t.hidden) return;
    const r = t.getBoundingClientRect(), L = Math.max(8, Math.min(innerWidth - r.width - 8, x - r.width / 2));
    const T = y - r.height - 28 >= 8 ? y - r.height - 28 : Math.min(innerHeight - r.height - 8, y + 28);
    t.style.left = L + 'px'; t.style.top = T + 'px';
    MOB.haptic('light');
  },
  wireTouch() {
    // long press shows the same tips a mouse gets on hover
    let lp = null, eat = false;
    const clear = () => { if (lp) clearTimeout(lp.t); lp = null; };
    document.addEventListener('pointerdown', e => {
      clear(); eat = false; if (e.pointerType === 'mouse') return;
      const el = e.target.closest && e.target.closest('[data-tip],[title]'); if (!el || el.id === 'arena') return;
      const x = e.clientX, y = e.clientY;
      lp = { x, y, t: setTimeout(() => { if (G.drag && G.drag.active) return clear(); if (G.drag) { G.drag = null; } MOB.showTip(el, x, y); eat = true; lp = null; }, 430) };
    }, true);
    document.addEventListener('pointermove', e => { if (lp && Math.hypot(e.clientX - lp.x, e.clientY - lp.y) > 10) clear(); }, true);
    document.addEventListener('pointerup', clear, true); document.addEventListener('pointercancel', clear, true);
    document.addEventListener('click', e => { if (eat) { eat = false; e.preventDefault(); e.stopPropagation(); } }, true);
    document.addEventListener('contextmenu', e => { if (MOB.touch && !e.target.closest('input,textarea')) e.preventDefault(); });
    // a scroll that steals the finger ends the drag cleanly
    document.addEventListener('pointercancel', () => { if (!G.drag) return; G.drag = null; $('ghost').hidden = true; G.hover = null; changed(); });
  },
  wireNative() {
    const P = Capacitor.Plugins || {};
    quiet(() => P.StatusBar.hide());
    quiet(() => P.SplashScreen.hide());
    if (P.App) {
      quiet(() => P.App.addListener('backButton', () => {
        if (!$('tip').hidden) return UI.tipHide();
        if (!$('mMenu').hidden) return MOB.menu(false);
        if (UI.page) return UI.openPage(null);
        if (!$('intel').classList.contains('closed')) return UI.setIntel(false, true);
        if (MOB.det) return MOB.details(false);
        if (G.armed) { G.armed = null; UI.hud(); return; }
        if (!$('modal').hidden || TOWER.on) return;
        if ($('title').hidden && G.run) { showTitle(); return; }
        quiet(() => P.App.minimizeApp());
      }));
      quiet(() => P.App.addListener('pause', () => { try { save(); } catch (e) { } }));
    }
  },
};

// ----- wrap the desktop input handlers (wire() binds them at boot, after this file runs) -----
const MOB_LIFT = 34; // px the dragged hero floats above the finger so it stays visible
const mobEv = e => (G.drag && G.drag.active && e.pointerType !== 'mouse') ? { clientX: e.clientX, clientY: e.clientY - MOB_LIFT, button: e.button, pointerType: e.pointerType } : e;
{
  const move0 = docMove, up0 = docUp, down0 = canvasDown, hero0 = heroAtPoint, place0 = placeHero, ham0 = castHammer, coach0 = UI.coach, init0 = UI.init, layout0 = UI.layout;
  // cards ignore the browser's own panning (it would cancel drags), so a sideways swipe on the strip scrolls it here,
  // and lifting the finger above the strip turns the swipe into a drag
  docMove = e => {
    const d = G.drag, strip = $('rosterCards');
    if (d && d.fromCard && !d.active && e.pointerType !== 'mouse') {
      const dx = e.clientX - d.sx, dy = e.clientY - d.sy, above = e.clientY < strip.getBoundingClientRect().top - 16;
      if (d.scroll && above) { d.scroll = false; }
      else if (d.scroll || (!above && strip.scrollWidth > strip.clientWidth + 4 && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.5)) {
        if (!d.scroll) { d.scroll = true; d.sl = strip.scrollLeft + dx; }
        strip.scrollLeft = d.sl - dx; return;
      }
    }
    return move0(mobEv(e));
  };
  docUp = e => up0(mobEv(e));
  // fingers are wide: pick the nearest hero within a forgiving radius
  heroAtPoint = function (p) {
    const hit = hero0(p); if (hit || !MOB.touch) return hit;
    let best = null, bd = 13; for (const u of G.prepUnits) { if (!u.inst) continue; const d = Math.hypot(p.x - u.x, p.y - (u.y - 8)); if (d < bd) { bd = d; best = u.inst; } }
    return best;
  };
  // tap a card, then tap the field: the selected champion walks to that spot
  canvasDown = function (e) {
    if (MOB.touch && e.pointerType !== 'mouse' && G.phase === 'prep' && G.run && G.selected) {
      const p = toLogical(e), h = G.run.roster.find(x => x.uid === G.selected);
      if (h && !heroAtPoint(p)) { const s = slotAt(p); if (slotOk(h, s)) { G.mouse = p; placeHero(h, s); UI.coachDone('place'); changed(); return; } if (s && s.type === 'rafter') { UI.toast('Only ranged heroes can stand on the rafters.', true); return; } }
    }
    return down0(e);
  };
  placeHero = function (h, s) { const r = place0(h, s); MOB.haptic('light'); return r; };
  castHammer = function () { const r = ham0.apply(this, arguments); if (r) MOB.haptic('heavy'); return r; };
  // coach lines name keys and drags; on touch they name taps
  UI.coach = function (key, el, text) {
    if (MOB.touch && text) text = text.replace('Drag them anywhere on the field, then press Begin siege.', 'Tap their card, then tap a spot on the field (or drag them there). Then tap Begin siege.').replace(', or press Space', '').replace(' or the E key', '');
    return coach0.call(UI, key, el, text);
  };
  // after the desktop init, so its rail wiring never sees the phone-only buttons
  UI.init = function () { const r = init0.apply(UI, arguments); MOB.init(); return r; };
  UI.layout = function () { MOB.sync(); return MOB.on ? MOB.layout() : layout0.call(UI); };
  // the native app never asks for the microphone (that capture is for web playtests)
  if (window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) REC.startMic = function () { this.asked = true; this.state = 'off'; };
}
