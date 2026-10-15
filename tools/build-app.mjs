// Packs the single-file game for the Capacitor app: node tools/build-app.mjs -> app/www (then `npx cap sync`)
// Same game as the website; tools/app-html.mjs swaps in bundled fonts and the app-only native.js.
import fs from 'fs';
import crypto from 'crypto';
import { build } from 'esbuild';
import { toAppHtml } from './app-html.mjs';
const root = new URL('../', import.meta.url), at = p => new URL(p, root);

export async function buildNativeJs() {
  const r = await build({ entryPoints: [at('app/native.js').pathname], bundle: true, format: 'iife', target: 'es2019', minify: true, write: false, logLevel: 'warning' });
  return r.outputFiles[0].text;
}
export function fontFiles() { return fs.readdirSync(at('app/fonts')).sort().map(f => ['fonts/' + f, fs.readFileSync(at('app/fonts/' + f))]); }
// every file the app runs from, in one list: the copy inside the app and each live update are built the same way
export async function appFiles() {
  const files = [['index.html', Buffer.from(toAppHtml(fs.readFileSync(at('dist/manatorium.html'), 'utf8')))], ['native.js', Buffer.from(await buildNativeJs())], ...fontFiles()];
  const h = crypto.createHash('sha256'); for (const [p, b] of files) h.update(p).update(b);
  return { files, build: h.digest('hex').slice(0, 12) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { files, build: id } = await appFiles();
  fs.rmSync(at('app/www'), { recursive: true, force: true });
  for (const [p, b] of files) { fs.mkdirSync(new URL('.', at('app/www/' + p)), { recursive: true }); fs.writeFileSync(at('app/www/' + p), b); }
  // which copy this is; native.js compares it with the live manifest
  fs.writeFileSync(at('app/www/build.json'), JSON.stringify({ build: id, seq: Date.now() }));
  console.log('app/www ready, build', id, (files[0][1].length / 1024).toFixed(1) + ' KB');
}
