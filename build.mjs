// Builds the single-file game: node build.mjs -> dist/manatorium.html
import fs from 'fs';
const read = f => fs.readFileSync(new URL('./src/' + f, import.meta.url), 'utf8');
// game-sized castle sprites (216px wide, made from the full-size art in assets/castles by tools/shrink-castles.py)
const sources = Object.fromEntries(['fire', 'water', 'nature', 'ice', 'lightning', 'dark', 'light', 'void', 'salty', 'sweet', 'meat', 'treat'].map(el => [el, 'data:image/png;base64,' + fs.readFileSync(new URL('./assets/castles/game/' + el + '.png', import.meta.url)).toString('base64')]));
const js = 'const CASTLE_ART_SOURCES = ' + JSON.stringify(sources) + ';\n' + ['data.js', 'sprites.js', 'itemart.js', 'sim.js', 'styles.js', 'traits.js', 'ultkit.js', 'state.js', 'lore.js', 'achievements.js', 'fx.js', 'music.js', 'spellfx.js', 'bossfx.js', 'ultfx.js', 'ultfx2.js', 'render.js', 'idles.js', 'alive.js', 'castle.js', 'element-scenes.js', 'element-terrain.js', 'element-worlds.js', 'castle-art.js', 'simbot.js', 'tips.js', 'ui.js', 'starup.js', 'herald.js', 'telemetry.js', 'tower.js', 'lairs.js', 'talk.js', 'dialogue.js', 'splash.js', 'intro.js', 'intros.js', 'main.js', 'mobile.js', 'demo.js', 'release.js'].map(read).join('\n')
  + '\nloadCastleArt().then(() => { window.claude?.hot?.ready ? window.claude.hot.ready(boot) : boot(window.claude?.hot?.data ?? null); });\n';
const html = read('shell.html').replace('/*CSS*/', () => read('style.css') + read('mobile.css') + read('demo.css')).replace('/*JS*/', () => js);
for (const dir of ['dist', 'site']) fs.mkdirSync(new URL('./' + dir + '/', import.meta.url), { recursive: true });
for (const file of ['dist/manatorium.html', 'index.html', 'site/index.html']) fs.writeFileSync(new URL('./' + file, import.meta.url), html);
console.log('built', (html.length / 1024).toFixed(1) + ' KB');
