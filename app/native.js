// App-only JavaScript: tools/build-app.mjs bundles this into app/www/native.js, loaded before the game (the website never loads it).
// Importing each plugin registers it, which is what fills Capacitor.Plugins for src/mobile.js.
// window.SOL_IAP is the store bridge for src/demo.js; window.SOL_LIVE runs live updates. Both resolve with plain
// result objects instead of throwing.
import { Capacitor, CapacitorHttp, WebView } from '@capacitor/core';
import '@capacitor/app';
import '@capacitor/haptics';
import '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Purchases } from '@revenuecat/purchases-capacitor';
import { REVENUECAT, LIVE, NATIVE_API } from './app.config.js';

// ---------- store ----------
let pkg = null, configured = false;
const owned = ci => !!(ci && ci.entitlements && ci.entitlements.active && ci.entitlements.active[REVENUECAT.entitlement]);
const why = e => (e && e.message) || 'The store did not respond.';

window.SOL_IAP = {
  async init() {
    const key = REVENUECAT[Capacitor.getPlatform()];
    if (!Capacitor.isNativePlatform() || !key) return { ready: false, why: 'no store key' };
    if (!configured) { await Purchases.configure({ apiKey: key }); configured = true; }
    const { customerInfo } = await Purchases.getCustomerInfo();
    try { const o = await Purchases.getOfferings(); pkg = (o.current && o.current.availablePackages[0]) || null; } catch (e) { pkg = null; }
    return { ready: true, owned: owned(customerInfo), price: pkg && pkg.product ? pkg.product.priceString : null };
  },
  async buy() {
    if (!pkg) return { ok: false, error: 'The unlock is not set up in the store yet.' };
    try { const r = await Purchases.purchasePackage({ aPackage: pkg }); return { ok: owned(r.customerInfo) }; }
    catch (e) { return e && e.userCancelled ? { ok: false, cancelled: true } : { ok: false, error: why(e) }; }
  },
  async restore() {
    try { const { customerInfo } = await Purchases.restorePurchases(); return { ok: owned(customerInfo) }; }
    catch (e) { return { ok: false, error: why(e) }; }
  },
};

// ---------- live updates ----------
// Every deploy publishes the app's copy of the game at LIVE.url (manifest.json lists the files and their hashes).
// A newer copy downloads in the background and starts on the next launch. The app's own copy always starts first
// and hands over to the downloaded one, nothing is persisted natively, so a broken update can never stick:
// if an update doesn't report ready in time, or a launch of it never got that far, it is marked bad and skipped.
const KEY = { next: 'sol.live.next', trying: 'sol.live.trying', bad: 'sol.live.bad', shown: 'sol.live.shown' };
const LS = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); } catch (e) { } },
  json(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
};
const DIR = () => (Capacitor.getPlatform() === 'ios' ? Directory.Library : Directory.Data);
const READY_WITHIN = 20000;
const log = (...a) => console.log('[live]', ...a);
const sha256 = async b64 => {
  const bin = atob(b64), bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(x => x.toString(16).padStart(2, '0')).join('');
};

let me = { build: '?', seq: 0 }, inUpdate = false, switching = false, readyT = null;

function giveUp(build, reason) {
  log('update', build, 'failed:', reason);
  LS.set(KEY.bad, build); LS.set(KEY.next, null); LS.set(KEY.trying, null);
}

const start = (async () => {
  if (!Capacitor.isNativePlatform()) return;
  // the splash stays up until the game boots (src/mobile.js hides it); this is the backstop
  setTimeout(() => SplashScreen.hide().catch(() => { }), 10000);
  try { me = await (await fetch('build.json', { cache: 'no-store' })).json(); } catch (e) { }
  try { const { path } = await WebView.getServerBasePath(); inUpdate = /\/live\/[^/]+\/?$/.test(path || ''); } catch (e) { }
  if (inUpdate) {
    // the downloaded copy must reach the title screen, or the app goes back to its own copy right away
    readyT = setTimeout(() => { giveUp(me.build, 'not ready in time'); WebView.setServerAssetPath({ path: 'public' }).catch(() => { }); }, READY_WITHIN);
    return;
  }
  const nx = LS.json(KEY.next);
  if (!nx || !(nx.seq > me.seq) || nx.build === LS.get(KEY.bad)) return;
  if (LS.get(KEY.trying) === nx.build) return giveUp(nx.build, 'last launch never got ready');
  LS.set(KEY.trying, nx.build); switching = true; window.__SOL_SWITCHING = true;
  log('starting update', nx.build);
  await WebView.setServerBasePath({ path: nx.path });
})().catch(e => log('start', e));

async function check() {
  const r = await CapacitorHttp.get({ url: LIVE.url + 'manifest.json?t=' + Date.now(), responseType: 'json' });
  const m = typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
  if (r.status !== 200 || !m || !m.build || !Array.isArray(m.files)) return { ok: false, why: 'no manifest' };
  if (m.build === me.build || !(m.seq > me.seq)) return { ok: true, current: true };
  if (m.minNative > NATIVE_API) return { ok: false, why: 'needs a store update' };
  if (m.build === LS.get(KEY.bad)) return { ok: false, why: 'known bad' };
  const nx = LS.json(KEY.next); if (nx && nx.build === m.build) return { ok: true, staged: m.build };
  const base = 'live/' + m.build + '/';
  for (const f of m.files) {
    await Filesystem.downloadFile({ url: LIVE.url + f.path + '?b=' + m.build, path: base + f.path, directory: DIR(), recursive: true });
    const got = await Filesystem.readFile({ path: base + f.path, directory: DIR() });
    if (await sha256(got.data) !== f.sha256) throw new Error('checksum mismatch on ' + f.path);
  }
  const { uri } = await Filesystem.getUri({ path: 'live/' + m.build, directory: DIR() });
  LS.set(KEY.next, { build: m.build, seq: m.seq, path: decodeURIComponent(uri.replace(/^file:\/\//, '')).replace(/\/$/, '') });
  log('staged', m.build, 'for next launch');
  // keep only the copy running now and the one staged
  try { const { files } = await Filesystem.readdir({ path: 'live', directory: DIR() });
    for (const d of files) if (d.name !== m.build && d.name !== me.build) await Filesystem.rmdir({ path: 'live/' + d.name, directory: DIR(), recursive: true }).catch(() => { }); } catch (e) { }
  return { ok: true, staged: m.build };
}

window.SOL_LIVE = {
  // the game calls this once it has booted; resolves { updated: true } on the first launch of a new copy
  async ready() {
    await start;
    if (switching) return { switching: true };
    if (!Capacitor.isNativePlatform()) return {};
    clearTimeout(readyT); LS.set(KEY.trying, null);
    setTimeout(() => check().then(r => log('check', JSON.stringify(r)), e => log('check failed', e && e.message)), 4000);
    if (inUpdate && LS.get(KEY.shown) !== me.build) { LS.set(KEY.shown, me.build); return { updated: true, build: me.build }; }
    return {};
  },
  check, info: () => ({ ...me, inUpdate }),
};
