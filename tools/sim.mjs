// Headless bot agents. Usage: node tools/sim.mjs [runsPerStyle=8] [metaRank=0] [styles=brawler,arcanist,bulwark,balanced,chaos] [--json out.json]
import fs from 'fs'; import vm from 'vm';
const dir = new URL('../src/', import.meta.url).pathname;
const code = ['data.js', 'sim.js', 'state.js', 'lore.js', 'achievements.js', 'simbot.js'].map(f => fs.readFileSync(dir + f, 'utf8')).join('\n') + '\n;globalThis.__api={botPlayRun,summarizeBots,newMeta,BAL,BOT_STYLES,VERSION};';
const FX = new Proxy({}, { get: () => () => {} });
const ctx = { FX, Math, console, Object, Array, Set, JSON, Date }; vm.createContext(ctx); vm.runInContext(code, ctx);
const A = ctx.__api;
const args = process.argv.slice(2); const jsonAt = args.indexOf('--json'); const jsonOut = jsonAt >= 0 ? args.splice(jsonAt, 2)[1] : null;
const n = +(args[0] || 8), rank = +(args[1] || 0), styles = (args[2] || 'brawler,arcanist,bulwark,balanced,chaos').split(',');
if (process.env.BAL) Object.assign(A.BAL, JSON.parse(process.env.BAL));
const results = []; const t0 = Date.now();
for (const st of styles) for (let i = 0; i < n; i++) { const meta = A.newMeta(); for (const k of ['masonry', 'hammer', 'drills', 'codex', 'banners', 'chest']) meta.ranks[k] = rank; results.push(A.botPlayRun(st, meta, { maxSiege: 70 })); }
const sum = A.summarizeBots(results);
console.log(`version ${A.VERSION} · ${results.length} runs in ${((Date.now() - t0) / 1000).toFixed(1)}s · meta rank ${rank}`);
for (const [k, v] of Object.entries(sum)) console.log(`${k.padEnd(9)} avg ${String(v.avg).padStart(5)} med ${String(v.median).padStart(3)} best ${String(v.best).padStart(3)} worst ${String(v.worst).padStart(3)} | top lvl @s5 ${v.lv5} @s10 ${v.lv10} @s15 ${v.lv15} @s20 ${v.lv20} | ${JSON.stringify(v.causes)} | ${v.reached.join(' ')}`);
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify({ version: A.VERSION, at: new Date().toISOString(), rank, bal: A.BAL, summary: sum, runs: results }, null, 1));
