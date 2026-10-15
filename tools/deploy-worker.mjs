// Packs the Cloudflare worker that serves the website and the app's live updates.
//   node build.mjs && node tools/deploy-worker.mjs            -> dist/worker/ (dry run, nothing leaves the machine)
//   node tools/deploy-worker.mjs --upload                     -> uploads it as worker "manatorium" (needs CLOUDFLARE_ACCOUNT_ID
//                                                                and API access to api.cloudflare.com)
// Routes:  /app/manifest.json   build id, seq, minNative and every file with its size and sha256 (app/native.js reads it)
//          /app/index.html      the app's copy of the game, made from the page at request time by toAppHtml
//          /app/native.js, /app/build.json, /app/fonts/*
//          anything else        the website (site/index.html), as before
// The app copy is derived inside the worker instead of uploaded twice, which keeps the script under the size limit.
import fs from 'fs';
import crypto from 'crypto';
import { toAppHtml } from './app-html.mjs';
import { buildNativeJs, fontFiles } from './build-app.mjs';
import { NATIVE_API } from '../app/app.config.js';
const root = new URL('../', import.meta.url), at = p => new URL(p, root);
const NAME = 'manatorium';
const sha = b => crypto.createHash('sha256').update(b).digest('hex');

export async function workerParts({ seq = Date.now() } = {}) {
  const page = fs.readFileSync(at('site/index.html'), 'utf8');
  const nativeJs = await buildNativeJs(), fonts = fontFiles();
  const app = [['index.html', Buffer.from(toAppHtml(page))], ['native.js', Buffer.from(nativeJs)], ...fonts];
  // same id rule as tools/build-app.mjs, so a fresh app build and this deploy agree on what "the same copy" is
  const h = crypto.createHash('sha256'); for (const [p, b] of app) h.update(p).update(b);
  const build = h.digest('hex').slice(0, 12);
  const buildJson = JSON.stringify({ build, seq });
  app.push(['build.json', Buffer.from(buildJson)]);
  const manifest = JSON.stringify({ build, seq, minNative: NATIVE_API, files: app.map(([path, b]) => ({ path, size: b.length, sha256: sha(b) })) });

  const fontMods = fonts.map(([p], i) => ({ path: p, mod: `font${i}.bin` }));
  const worker = `import page from "./page.html";
import nativeJs from "./native.js.txt";
${fontMods.map((f, i) => `import font${i} from "./${f.mod}";`).join('\n')}
const toAppHtml = ${toAppHtml.toString()};
const MANIFEST = ${JSON.stringify(manifest)}, BUILD_JSON = ${JSON.stringify(buildJson)};
let appHtml = null;
const TYPES = { html: "text/html; charset=utf-8", js: "text/javascript; charset=utf-8", json: "application/json", css: "text/css; charset=utf-8", woff2: "font/woff2" };
const send = (body, path) => new Response(body, { headers: { "content-type": TYPES[path.split(".").pop()] || "application/octet-stream", "cache-control": "no-cache" } });
const APP = {
  "manifest.json": () => MANIFEST,
  "build.json": () => BUILD_JSON,
  "index.html": () => appHtml || (appHtml = toAppHtml(page)),
  "native.js": () => nativeJs,
${fontMods.map((f, i) => `  ${JSON.stringify(f.path)}: () => font${i},`).join('\n')}
};
export default {
  async fetch(req) {
    const path = new URL(req.url).pathname;
    if (path === "/app" || path === "/app/") return Response.redirect(new URL("/app/index.html", req.url), 302);
    if (path.startsWith("/app/")) { const f = APP[path.slice(5)]; return f ? send(f(), path) : new Response("not found", { status: 404 }); }
    return send(page, "x.html");
  }
};
`;
  const parts = [
    { name: 'worker.js', type: 'application/javascript+module', body: worker },
    { name: 'page.html', type: 'text/plain', body: page },
    { name: 'native.js.txt', type: 'text/plain', body: nativeJs },
    ...fonts.map(([p, b], i) => p.endsWith('.css') ? { name: fontMods[i].mod, type: 'text/plain', body: b.toString('utf8') } : { name: fontMods[i].mod, type: 'application/octet-stream', body: b }),
  ];
  return { parts, build, seq, manifest: JSON.parse(manifest) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { parts, build, seq, manifest } = await workerParts();
  const out = at('dist/worker/'); fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  for (const p of parts) fs.writeFileSync(new URL(p.name, out), p.body);
  fs.writeFileSync(new URL('manifest.json', out), JSON.stringify(manifest, null, 1));
  const kb = parts.reduce((n, p) => n + Buffer.byteLength(p.body), 0) / 1024;
  console.log(`worker ready in dist/worker: app build ${build}, seq ${seq}, ${manifest.files.length} app files, ${kb.toFixed(0)} KB before compression`);
  if (process.argv.includes('--upload')) {
    const id = process.env.CLOUDFLARE_ACCOUNT_ID; if (!id) throw new Error('set CLOUDFLARE_ACCOUNT_ID');
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify({ main_module: 'worker.js', compatibility_date: '2025-01-01' })], { type: 'application/json' }));
    for (const p of parts) form.append(p.name, new Blob([p.body], { type: p.type }), p.name);
    const headers = process.env.CLOUDFLARE_API_TOKEN ? { authorization: 'Bearer ' + process.env.CLOUDFLARE_API_TOKEN } : {};
    const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${id}/workers/scripts/${NAME}`, { method: 'PUT', body: form, headers });
    const j = await r.json().catch(() => ({}));
    if (!j.success) { console.error('upload failed', r.status, JSON.stringify(j.errors || j).slice(0, 500)); process.exit(1); }
    console.log('uploaded worker', NAME);
  }
}
