// Builds the single-file game: node build.mjs -> dist/manatorium.html
import fs from 'fs';
const src = new URL('./src/', import.meta.url).pathname;
const read = f => fs.readFileSync(src + f, 'utf8');
const js = ['data.js', 'sprites.js', 'itemart.js', 'sim.js', 'state.js', 'lore.js', 'achievements.js', 'fx.js', 'spellfx.js', 'render.js', 'simbot.js', 'tips.js', 'ui.js', 'telemetry.js', 'tower.js', 'main.js'].map(read).join('\n')
  + '\nwindow.claude?.hot?.ready ? window.claude.hot.ready(boot) : boot(window.claude?.hot?.data ?? null);\n';
const html = read('shell.html').replace('/*CSS*/', () => read('style.css')).replace('/*JS*/', () => js);
fs.mkdirSync(new URL('./dist/', import.meta.url).pathname, { recursive: true });
fs.writeFileSync(new URL('./dist/manatorium.html', import.meta.url).pathname, html);
console.log('built', (html.length / 1024).toFixed(1) + ' KB');
