# Siege of Legends on phones

## What the app does differently

- **Layouts.** Phones get a touch layout in both orientations. Landscape puts the Guild, Armory and Artificers' Hall down the left edge, and speed, Sky Hammer, the castle power and Begin siege down the right edge. Portrait stacks the arena, then the action buttons, then the facilities, then the champion details. Champion cards are a swipeable strip along the bottom in both. Notches and home bars are respected.
- **Placing champions.** Tap a card, then tap a spot on the field. Dragging still works, and the dragged champion floats above your finger so you can see where it lands. Hit areas on the field are wider for fingers.
- **Tooltips.** Press and hold any chip, badge or bar to read its tip.
- **Menus.** Sound, Keep menu, fullscreen and the scout report sit behind the ☰ button. In landscape, the Details button opens the champion inspector and team bonuses.
- **App only.** The app runs full screen with the system bars hidden, keeps the screen awake, works offline (fonts are bundled), gives a light tap of haptic feedback on placement and a heavy one for the Sky Hammer, and maps the Android back button to closing whatever is open. It never asks for the microphone; the playtest voice capture stays a web-only feature.

## Trying it

- **Android, no tools needed:** open the latest run of the **Mobile app** workflow on GitHub (Actions tab), download `siege-of-legends-debug-apk`, unzip it, and open `app-debug.apk` on the phone. Android asks once to allow installs from that source.
- **Android Studio:** `npm install && npm run build:app && npx cap open android`, then Run.
- **iPhone:** needs a Mac with Xcode. `npm install && npm run build:app && npx cap open ios`, pick your team under Signing & Capabilities, plug in the phone and Run.

## Publishing (needs your accounts)

These steps use your own credentials, so they are not automated here.

1. **Accounts.** Google Play Console (one-time $25) and Apple Developer Program ($99 per year).
2. **App id.** The app id is `com.siegeoflegends.game` in `capacitor.config.json`. Change it before the first upload if you want another; it cannot change after that.
3. **Android release.** In Android Studio, Build → Generate Signed App Bundle, create an upload keystore (keep it and its passwords safe; Play needs it for every update), and upload the `.aab` to a Play Console internal testing track. Bump `versionCode` and `versionName` in `android/app/build.gradle` for each upload.
4. **iOS release.** In Xcode, set the Team and bundle id, then Product → Archive → Distribute App → App Store Connect. Create the app record in App Store Connect first and test through TestFlight. Bump the version and build number for each upload.
5. **Store listing.** Both stores want screenshots, a short and long description, a privacy policy URL (the app collects nothing; a one-page policy on siegeoflegends.com is enough) and an age rating questionnaire.

## Updating the app after game changes

Edit `src/`, then `npm run build:app`. That rebuilds the HTML, repacks `app/www` and copies it into both native projects. Commit, and the workflow builds a fresh APK.
