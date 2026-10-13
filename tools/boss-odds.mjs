// node mass.mjs <k> <runsPerStyle> [diffJSON] -> per-style fraction beating boss k with META_CURVE[k-1] diamonds
import fs from 'fs'; import vm from 'vm';
const dir = new URL('../src/', import.meta.url).pathname;
const code = ['data.js', 'sim.js', 'state.js', 'lore.js', 'achievements.js', 'simbot.js'].map(f => fs.readFileSync(dir + f, 'utf8')).join('\n') + '\n;globalThis.__api={botPlayRun,botMeta,BAL,HORDE_DIFF};';
const CURVE = [0, 20, 50, 90, 140, 200, 270, 350, 440, 560];
const [k, n, diff] = [+process.argv[2], +process.argv[3], JSON.parse(process.argv[4] || 'null')];
const ctx = { FX: new Proxy({}, { get: () => () => {} }), Math, console, Object, Array, Set, JSON, Date }; vm.createContext(ctx); vm.runInContext(code, ctx);
const A = ctx.__api; if (diff) diff.forEach((v, i) => A.HORDE_DIFF[i] = v); if (process.env.BAL) Object.assign(A.BAL, JSON.parse(process.env.BAL));
const styles = (process.env.STYLES || 'brawler,arcanist,bulwark,balanced,crit').split(','); const out = {}; const t0 = Date.now();
for (const st of styles) { let w = 0; const r = []; for (let i = 0; i < n; i++) { const x = A.botPlayRun(st, A.botMeta(CURVE[k - 1]), { maxSiege: 5 * k, dt: 1 / 20 }); r.push(x.reached); if (x.reached > 5 * k || x.cause === 'won') w++; } out[st] = { p: +(w / n).toFixed(3), n }; }
console.log(JSON.stringify({ k, out, s: Math.round((Date.now() - t0) / 1000) }));
