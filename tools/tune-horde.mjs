// tunes HORDE_DIFF so the average bot (5 styles, crit included) with META_CURVE[k] diamonds beats boss k about TARGET of the time
import { execFile } from 'child_process'; import { promisify } from 'util'; import fs from 'fs';
const run = promisify(execFile);
const TARGET = [0.45, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.25];
const diff = JSON.parse(process.argv[2]), start = +(process.argv[3] || 1), N = +(process.env.N || 10);
let total = 0;
async function P(k, d) { const outs = await Promise.all([0, 1, 2, 3].map(() => run('node', [new URL('boss-odds.mjs', import.meta.url).pathname, k, N, JSON.stringify(d)], { maxBuffer: 1e7, timeout: 1800000 })));
  let w = 0, n = 0; for (const o of outs) { const r = JSON.parse(o.stdout.trim().split('\n').pop()); for (const v of Object.values(r.out)) { w += v.p * v.n; n += v.n; } } total += n; return w / n; }
for (let k = start; k <= 10; k++) {
  let lo = Math.log(0.005), hi = Math.log(25), best = null;
  for (let it = 0; it < 7; it++) {
    const mid = it === 0 ? Math.log(diff[k - 1]) : (lo + hi) / 2; diff[k - 1] = +Math.exp(mid).toFixed(3);
    const p = await P(k, diff); console.log(`k${k} diff ${diff[k - 1]} p ${p.toFixed(3)} (runs so far ${total})`);
    if (!best || Math.abs(p - TARGET[k - 1]) < Math.abs(best.p - TARGET[k - 1])) best = { d: diff[k - 1], p };
    if (Math.abs(p - TARGET[k - 1]) < 0.04) break;
    if (p > TARGET[k - 1]) lo = mid; else hi = mid;
  }
  diff[k - 1] = best.d; console.log('SET', k, JSON.stringify(diff), 'runs', total); fs.writeFileSync('horde-diff.json', JSON.stringify(diff));
}
