import fs from 'fs'; import vm from 'vm';
const dir = new URL('../src/', import.meta.url).pathname;
const code = ['data.js', 'sim.js', 'styles.js', 'traits.js', 'state.js', 'lore.js', 'achievements.js', 'simbot.js'].map(f => fs.readFileSync(dir + f, 'utf8')).join('\n') + '\n;globalThis.__api={botPlayRun,botMeta,BAL,HERO_BY_ID,heroItems};';
const ctx = { FX: new Proxy({}, { get: () => () => {} }), Math, console, Object, Array, Set, JSON, Date }; vm.createContext(ctx); vm.runInContext(code, ctx);
const A = ctx.__api; if (process.env.BAL) Object.assign(A.BAL, JSON.parse(process.env.BAL));
const C = {}; const orig = ctx.finishSiege;
ctx.finishSiege = (run, meta, B) => { const rep = orig(run, meta, B); const tot = rep.heroes.reduce((a, h) => a + h.dmg, 0) || 1, n = rep.heroes.length;
  for (const h of rep.heroes) { const inst = run.roster.find(x => x.uid === h.uid); if (!inst) continue; const c = A.HERO_BY_ID[h.id].cls, fin = A.heroItems(run, inst).filter(i => i.parts.length === 2).length;
    const k = c + ' items' + fin; const o = C[k] = C[k] || { n: 0, share: 0, s: 0 }; o.n++; o.share += h.dmg / tot * n; o.s += run.siege; }
  return rep; };
const n = +process.argv[2] || 10, styles = (process.argv[3] || 'brawler,arcanist,bulwark,balanced,crit').split(',');
const R = {}; for (const st of styles) for (let i = 0; i < n; i++) { const r = A.botPlayRun(st, A.botMeta(140), { maxSiege: 30, dt: 1 / 20 }); (R[st] = R[st] || []).push(r.reached); }
for (const st in R) { const a = R[st].sort((x, y) => x - y); console.log('REACH', st, 'avg', (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1), 'median', a[a.length >> 1]); }
for (const k of Object.keys(C).sort()) { const o = C[k]; if (o.n < 15) continue; console.log(k.padEnd(18), String(o.n).padStart(5), 'dmg x avg', (o.share / o.n).toFixed(2), 'avg siege', (o.s / o.n).toFixed(1)); }
