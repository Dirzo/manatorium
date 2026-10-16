# Siege of Legends on phones

## What the app does differently

- **Layouts.** Phones get a touch layout in both orientations. Landscape puts the Guild, Armory and Artificers' Hall down the left edge, and speed, Sky Hammer, the castle power and Begin siege down the right edge. Portrait stacks the arena, then the action buttons, then the facilities, then the champion details. Champion cards are a swipeable strip along the bottom in both. Notches and home bars are respected.
- **Placing champions.** Tap a card, then tap a spot on the field. Dragging still works, and the dragged champion floats above your finger so you can see where it lands. Hit areas on the field are wider for fingers.
- **Tooltips.** Press and hold any chip, badge or bar to read its tip.
- **Menus.** Sound, Keep menu, fullscreen and the scout report sit behind the ☰ button. In landscape, the Details button opens the champion inspector and team bonuses.
- **App only.** The app runs full screen with the system bars hidden, keeps the screen awake, works offline (fonts are bundled), gives a light tap of haptic feedback on placement and a heavy one for the Sky Hammer, and maps the Android back button to closing whatever is open. It never asks for the microphone; the playtest voice capture stays a web-only feature.

## Free demo and the unlock

The app is a free download that plays the first three hordes (sieges 1 to 15, through the elemental castle choice). Reaching siege 16 opens **The road ahead**: the seven hordes still to come, what the full game adds, and one purchase that unlocks everything. Players can also end the run there and climb the tower, so demo runs still earn records, achievements and diamonds, and all of it carries over after buying. The unlock button also sits on the title screen.

- The limit applies only in the app. The website stays the full game; add `?demo` to its URL to see the demo there.
- `src/demo.js` holds the demo (`DEMO.LAST` is the last free siege, `DEMO.PRICE` the fallback price label). The store's own local price replaces it when the store answers.
- The purchase goes through [RevenueCat](https://www.revenuecat.com) (`app/native.js`, bundled into the app only). A bought unlock is remembered on the device, so it works offline, and **Restore purchase** brings it back on a new phone.

### Setting up the unlock (needs your accounts)

1. **Store products.** Create one non-consumable in-app product in each store with the id `sol_full_unlock`, priced at $4.99. Apple: App Store Connect → your app → In-App Purchases. Google: Play Console → Monetize → In-app products. Google only lets you create products after you've uploaded one build with billing, so upload a signed release build to internal testing first.
2. **Payments.** Accept Apple's Paid Apps agreement and fill in banking and tax in App Store Connect. Set up a payments profile in Play Console. Enroll in Apple's Small Business Program and Google's 15% tier.
3. **RevenueCat.** Create a free project and add the iOS app (App Store Connect API key or in-app purchase key) and the Android app (Play service account JSON). Create an entitlement `full_game`, attach both store products, and put them in the default offering as one package.
4. **Keys.** Copy the two public SDK keys (`appl_…` and `goog_…`) into `app/app.config.js`, then `npm run build:app`. These keys are meant to ship inside apps.
5. **Xcode.** Under Signing & Capabilities, add **In-App Purchase**.
6. **Test.** Use a Play license tester account and an Apple sandbox account. Buy, delete the app, reinstall and tap Restore purchase.

## Trying it

- **Android, no tools needed:** open the latest run of the **Mobile app** workflow on GitHub (Actions tab), download `siege-of-legends-debug-apk`, unzip it, and open `app-debug.apk` on the phone. Android asks once to allow installs from that source.
- **Android Studio:** `npm install && npm run build:app && npx cap open android`, then Run.
- **iPhone, no Mac:** the same workflow builds `siege-of-legends-ios-unsigned-ipa`. Install it with [Sideloadly](https://sideloadly.io) or AltStore, which sign it with your Apple ID (a free Apple ID works, but the install expires after 7 days; a paid developer account makes it a year). `siege-of-legends-ios-simulator` runs in the Xcode simulator on a Mac.
- **iPhone with a Mac:** needs Xcode. `npm install && npm run build:app && npx cap open ios`, pick your team under Signing & Capabilities, plug in the phone and Run.

## Publishing (needs your accounts)

These steps use your own credentials, so they are not automated here.

1. **Accounts.** Google Play Console (one-time $25) and Apple Developer Program ($99 per year).
2. **Name and app id.** Settle the store name first: other games called "Siege of Legends" are already on both stores. The app id `com.siegeoflegends.game` can't change after the first upload. To rename, change `appId` and `appName` in `capacitor.config.json`, `namespace` and `applicationId` in `android/app/build.gradle`, the strings in `android/app/src/main/res/values/strings.xml`, the `package` line and folder of `MainActivity.java`, and the bundle id and display name in Xcode. Then run `npx cap sync`.
3. **Android release.** In Android Studio, Build → Generate Signed App Bundle, create an upload keystore (keep it and its passwords safe; Play needs it for every update), and upload the `.aab` to a Play Console internal testing track. Bump `versionCode` and `versionName` in `android/app/build.gradle` for each upload.
4. **iOS release.** In Xcode, set the Team and bundle id, then Product → Archive → Distribute App → App Store Connect. Create the app record in App Store Connect first and test through TestFlight. Bump the version and build number for each upload.
5. **Store listing.** Both stores want screenshots, a short and long description, a privacy policy URL (the app collects nothing; a one-page policy on siegeoflegends.com is enough) and an age rating questionnaire.

## Live updates

Game changes reach installed apps without a store release. Each deploy publishes the app's copy of the game next to the website, at `siegeoflegends.com/app/`. When the app opens and the game has loaded, it asks for `/app/manifest.json`; if that copy is newer than the one it is running, it downloads the files in the background, checks each against its SHA-256, and switches to it the next time the app starts. Players see a short "The game was updated" note. Saves, the unlock and settings stay, since every copy runs at the same address on the device.

- **Safety.** The app always starts from the copy it shipped with and hands over to the downloaded one, so nothing can get stuck. If a downloaded copy doesn't reach the title screen within 20 seconds, or a launch of it died before getting there, the app marks it bad, goes back to its own copy and waits for the next deploy. A store release that is newer than the last deploy wins over it.
- **Deploying.** `npm run deploy:worker` builds the game and uploads `tools/deploy-worker.mjs`'s worker: the website at `/` exactly as before, plus `/app/`. Run `node tools/deploy-worker.mjs` alone for a dry run into `dist/worker/`. A plain `wrangler deploy` (or Cloudflare's git builds with `wrangler.jsonc`) publishes the website only, and installed apps then keep the copy they have.
- **Native changes.** Live updates carry the game, not the native shell. When a change needs a new plugin or native code, raise `NATIVE_API` in `app/app.config.js`. Deploys then mark themselves as needing that version, older apps skip them, and the change ships through the stores.
- **Code.** `app/native.js` (`SOL_LIVE`) runs it in the app; `tools/app-html.mjs` turns the website into the app's copy and is used both for the bundled copy and inside the worker, so the two always match.

## Updating the app after game changes

Edit `src/`, then deploy with `npm run deploy:worker`; installed apps pick it up on their own. For store releases, `npm run build:app` rebuilds the HTML, repacks `app/www` and copies it into both native projects. Commit, and the workflow builds a fresh APK and iOS build.
