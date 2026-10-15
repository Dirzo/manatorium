// Packs the single-file game for the Capacitor app: node tools/build-app.mjs -> app/www (then `npx cap sync`)
// Same HTML as the website, but the Google Fonts link is swapped for bundled copies so the app plays offline.
import fs from 'fs';
import { build } from 'esbuild';
const root = new URL('../', import.meta.url), at = p => new URL(p, root);
let html = fs.readFileSync(at('dist/manatorium.html'), 'utf8');
const before = html.length;
html = html.replace(/<link rel="preconnect" href="https:\/\/fonts\.g[^>]*>\n?/g, '').replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/, '<link rel="stylesheet" href="fonts/fonts.css">');
if (html.length === before || /fonts\.googleapis/.test(html)) throw new Error('font link not found in dist/manatorium.html; update tools/build-app.mjs');
fs.rmSync(at('app/www'), { recursive: true, force: true });
fs.mkdirSync(at('app/www/fonts'), { recursive: true });
for (const f of fs.readdirSync(at('app/fonts'))) fs.copyFileSync(at('app/fonts/' + f), at('app/www/fonts/' + f));
// plugin registration and the store bridge (RevenueCat) run before the game, so src/mobile.js and src/demo.js find them at boot
await build({ entryPoints: [new URL('app/native.js', root).pathname], bundle: true, format: 'iife', target: 'es2019', minify: true, outfile: new URL('app/www/native.js', root).pathname, logLevel: 'warning' });
html = html.replace('<script>', '<script src="native.js"></script>\n<script>');
fs.writeFileSync(at('app/www/index.html'), html);
console.log('app/www ready', (html.length / 1024).toFixed(1) + ' KB');
