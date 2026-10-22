// Turns the website's single-file game into the app's copy: bundled fonts instead of Google Fonts,
// and app/native.js (plugins, store, live updates) loaded before the game.
// tools/build-app.mjs uses it for the copy inside the app, and tools/deploy-worker.mjs puts the same
// function into the Cloudflare worker, so live updates are byte-identical to what a fresh build would ship.
export function toAppHtml(html) {
  const out = html
    .replace(/<link rel="preconnect" href="https:\/\/fonts\.g[^>]*>\n?/g, '')
    .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/, '<link rel="stylesheet" href="fonts/fonts.css">')
    .replace('<script>', '<script src="native.js"></script>\n<script>');
  if (out === html || /fonts\.googleapis/.test(out) || !out.includes('src="native.js"')) throw new Error('toAppHtml: the page no longer matches; update tools/app-html.mjs');
  return out;
}
