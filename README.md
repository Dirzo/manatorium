# Siege of Legends

**Elemental castle preview branch:** start with [the preview guide and gameplay screenshots](previews/elemental-castles/README.md). Download this branch and open `previews/elemental-castles/index.html` in Chrome to play and compare all twelve castles. Integration instructions are in that guide.

A browser castle-defense auto battler. Draft champions, build items, and hold the castle against ten hordes over 50 sieges, ending with The Eternal Goose.

![The castle at 0, 2, 5 and 10 bosses slain](docs/castle-stages.png)

## Play

Open `index.html` in any modern browser. The whole game is one self-contained file with no server and no installs. `dist/manatorium.html` is the same file.

Saves are kept in the browser's local storage.

## Website (Cloudflare)

`wrangler.jsonc` publishes `site/` as the static Cloudflare Worker `manatorium`, live at https://manatorium.noobscrub.workers.dev. Connect this repository once under Workers & Pages → Create → Import a repository; after that, every push to the chosen branch redeploys the site. `npm run deploy` deploys by hand with Wrangler. `npm run deploy:worker` deploys the site together with the phone app's live updates at `/app/` (see docs/MOBILE.md).

## Phone app (iOS and Android)

The same game runs as a native app through [Capacitor](https://capacitorjs.com). On phones, in the app or in a mobile browser, the layout switches to a touch version: in landscape the facilities sit down the left side and the actions down the right, and in portrait they sit under the arena. Champions are in a swipeable card strip along the bottom. Tap a card, then tap the field to place that champion, or drag the card there. Press and hold anything for its tooltip. Add `?mobile` or `?desktop` to the URL to force a layout.

```
npm install
npm run build:app     # builds the game, packs app/www with bundled fonts, syncs android/ and ios/
npx cap open android  # opens Android Studio
npx cap open ios      # opens Xcode (macOS only)
```

`src/mobile.js` and `src/mobile.css` hold the phone layouts and touch controls. App icons and splash art are in `app/icons` (regenerate them with `npx @capacitor/assets generate --ios --android --assetPath app/icons`). The **Mobile app** GitHub workflow builds an installable debug APK on every push to the mobile branch, and builds the iOS project on request. The app is a free demo of the first 15 sieges with a one-time unlock (`src/demo.js`, RevenueCat in `app/native.js`). Publishing and setting up the unlock are covered in [docs/MOBILE.md](docs/MOBILE.md).

## Build

The game is split into plain JavaScript files in `src/` and bundled into one HTML file:

```
node build.mjs        # refreshes dist/manatorium.html, index.html and site/index.html
```

`npm run build` does both steps and also refreshes `site/index.html`, which the website serves.

| File | What it holds |
| --- | --- |
| `src/data.js` | Heroes, races, classes, elements, temperaments, horde factions, bosses, items, research, encounters, draft and loot pacing |
| `src/sim.js` | Combat simulation and balance knobs (`BAL`, `HORDE_DIFF`). No DOM, so it runs headless |
| `src/state.js` | Run economy: drafts, loot, research, castle growth |
| `src/sprites.js`, `src/itemart.js` | Procedural 16px pixel art |
| `src/render.js` | Arena canvas, including the castle that grows with every boss |
| `src/castle.js` | Layered pixel castle architecture, growth stages, elemental palettes and facility upgrades |
| `src/fx.js`, `src/spellfx.js` | Effects, sound, and per-hero signature projectiles |
| `src/ui.js`, `src/tips.js` | Drawers, modals, draft screen, tooltips |
| `src/lore.js`, `src/achievements.js`, `src/tower.js` | Story beats, achievements and diamonds, end-of-run tower climb |
| `src/telemetry.js` | Optional playtest logging when hosted as a claude.ai artifact; inert elsewhere |
| `src/main.js`, `src/shell.html`, `src/style.css` | Game flow, input, layout |
| `src/mobile.js`, `src/mobile.css` | Phone layouts, touch controls, native app hooks (back button, haptics) |
| `src/demo.js`, `src/demo.css` | App demo limit (first 15 sieges), the road-ahead screen and the unlock |

## Balance tools

The castle renderer keeps the original battlefield footprint and rafter positions. Its
rear spires, slate-roofed hall, curtain wall and gatehouse grow as bosses fall;
later stages add turrets, a glowing crest and gilded roofs. Elemental choices tint
the stone and roofing, while purchased facilities add their own visible equipment.

With Playwright installed, `node tools/check-castle.cjs` checks all 143 tier/element
combinations, verifies cached rendering and preview isolation, starts a real siege,
and regenerates the castle screenshots in `docs/`. It uses Chrome in headless
mode. Set `BROWSER_CHANNEL=msedge` to use Edge, or `PLAYWRIGHT_PATH` to use an
existing Playwright installation.

Headless bots play full runs with the real simulation (Node 18+):

```
node tools/boss-odds.mjs <boss 1-10> <runsPerStyle>   # how often each bot style beats boss k
node tools/item-scaling.mjs <runsPerStyle> [styles]  # damage share by class and finished-item count, plus how far bots reach
node tools/tune-horde.mjs '<HORDE_DIFF json>' <startBoss>   # retunes HORDE_DIFF toward the target boss win rates
node tools/sim.mjs [runsPerStyle] [metaRank] [styles]       # older summary runner
```

Current targets: bots with the expected meta upgrades beat each boss about 40% of the time (first boss 45%, final 25%), and a carry with 3 finished items deals about 1.5x the team average.

## Elemental architecture preview

src/element-scenes.js composes element scenery with the current horde. src/castle-art.js renders the distinct 16-bit castle sprites for all twelve elements from assets/castles, embedded in the standalone HTML at build time. The sprites decode before game startup; each whole sprite is scaled uniformly to its own aspect ratio, height and width, then cached. Every element has its own construction and measured sprite proportions. The battlefield grid and siege-15 elemental unlock are unchanged. Rafter rendering, selection, combat placement and ladder destinations follow each elemental sprite's existing decks, including the staggered Nature platforms.

With Playwright and Chrome installed, node tools/check-element-scenes.cjs renders all 120 element/horde combinations, checks 1,320 growth cases, and verifies combat plus saved-run reload at desktop and phone viewport sizes. It exports ../elemental-preview.html with an attacking-horde selector. Set PLAYWRIGHT_PATH when using an existing Playwright installation.

The surroundings pass adds src/element-terrain.js: reinforced basalt courts and lava channels for Fire, limestone mosaics, canals and bridges for Water, and grass-separated stepping stones, roots and timber crossings for Nature. Element terrain extends under and around each castle into the approach road; distant scenery and the current attacking horde camp are composed independently. These are visual changes only: placement cells, pathfinding, castle proportions and combat rules retain their existing coordinates. The latest scene sheet is docs/elemental-surroundings.png.

All-element worlds are defined in src/element-worlds.js: frozen floes, riveted conductor plates, Gothic diamond paving, radiant marble mosaics, suspended Void plates, salt-flat causeways, candy checkerboards, smokehouse planks and waffle slabs. Each world includes a distinct horizon, edge props, approach road and courtyard construction. Fire, Water and Nature retain their approved sprites and terrain. tools/check-castle-proportions.cjs also checks all twelve sprites and their rafter hitboxes. Exact built-in imagegen prompts are stored beside the sprite assets.

Presence revision: Ice, Meat and Salty use rebuilt v3 architecture with substantial vertical mass. At growth tier 5 their sprites occupy 151, 160 and 147 game pixels in height, respectively, while remaining uniformly scaled to their measured aspect ratios. Every castle is horizontally centered in its 110-pixel region; shorter designs center around y=174, and larger keeps retain their established foundation at y=236. Defender decks, upgrade marks, fountains, trophies and lower fortifications follow the actual sprite position. The v3 imagegen prompts are assets/castles/presence-prompts.md.

Light now uses light-16bit-v3.png: a flat side elevation with an ivory sun tower, straight defensive gallery, gold details and substantial gatehouse. Its three defender slots follow the upper gallery. At growth tier 5 it stands 152 game pixels tall without stretching. The generation prompt is assets/castles/light-side-view-prompt.md.
