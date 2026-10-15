// App settings shared by the app bundle (app/native.js) and the deploy script (tools/deploy-worker.mjs).

// RevenueCat public SDK keys (safe to ship in the app). Fill these in from
// RevenueCat → Project settings → API keys after creating the project (see docs/MOBILE.md).
export const REVENUECAT = {
  ios: '',      // appl_...
  android: '',  // goog_...
  entitlement: 'full_game', // the entitlement that the unlock product grants
};

// Live updates: where installed apps look for a newer copy of the game (served by the Cloudflare worker).
export const LIVE = { url: 'https://siegeoflegends.com/app/' };

// Bump when the native shell changes in a way older installed apps can't run
// (a new Capacitor plugin, a new permission). Updates that need a newer shell are skipped
// by older apps until they install the new version from the store.
export const NATIVE_API = 1;
