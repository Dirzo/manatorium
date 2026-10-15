// App-only JavaScript: tools/build-app.mjs bundles this into app/www/native.js, loaded before the game (the website never loads it).
// Importing each plugin registers it, which is what fills Capacitor.Plugins for src/mobile.js.
// window.SOL_IAP is the store bridge for src/demo.js; every method resolves with a plain result object instead of throwing.
import { Capacitor } from '@capacitor/core';
import '@capacitor/app';
import '@capacitor/haptics';
import '@capacitor/status-bar';
import '@capacitor/splash-screen';
import { Purchases } from '@revenuecat/purchases-capacitor';
import { REVENUECAT } from './iap.config.js';

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
