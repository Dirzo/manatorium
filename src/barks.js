// ===== Fight barks (Cam 2026-11-06): the talk keeps going once the siege starts =====
// Short speech bubbles over a boss or your voice at a few key moments, typed out in their own babble (voices.js).
// sim.js calls FX.cue(B, kind, unit, src); the headless sims stub FX, so none of this touches the fight itself.
// Kinds: start (a second in), fury (the boss winds up, first two times), low (boss under 35%), wall (keep under half while the
// boss stands), kill (the boss drops a champion), fall (another champion drops), slain (the boss goes down).
const BOSS_BARK = {
  grubnose: { start: 'CHARGE-ISH!', low: 'Ow! OW! Not the face! Not the BUCKET!', kill: 'BONK! Royal bonk!', wall: 'I can see your SPOONS from here!', down: 'My bucket... look after my bucket...' },
  gloop: { start: 'Wobble at them, sweeties!', low: 'Mother is... leaking...', kill: 'Into the pudding with you, dear.', wall: 'Ooh, damp walls. Mother likes damp walls.', down: 'Mother will... reform... eventually...' },
  wyrm: { start: 'Chapter one. The siege begins.', low: 'This was NOT in the outline!', kill: 'And so they fell. Beautiful prose.', wall: 'The walls crumble. Foreshadowing!', down: 'The end... ugh... a cliffhanger...' },
  ringmaster: { start: 'LADIES AND GENTLEMEN!', low: 'Intermission! INTERMISSION!', kill: 'And they DISAPPEAR!', wall: 'The crowd goes WILD!', down: 'Curtain... call...' },
  sporebaron: { start: 'Court is in session.', low: 'I seem to be... wilting.', kill: 'Back to the soil, darling.', wall: 'Such lovely damp cracks.', down: 'Plant me... somewhere shady...' },
  matriarch: { start: 'Inspection begins NOW.', low: 'This is highly irregular!', kill: 'Evicted.', wall: 'Structural failure. Noted. FINED.', down: 'I want... to speak... to your manager...' },
  trashpaw: { start: 'Dinner time, babies!', low: 'Mama needs a minute, sugar!', kill: 'Mama ate that one.', wall: 'Lid\'s comin\' off, sugar!', down: 'Save Mama... a plate...' },
  colossus: { start: 'DEMOLITION: STARTED.', low: 'WARNING. WARNING. OUCH.', kill: 'UNIT REMOVED. SORRY.', wall: 'WALL INTEGRITY: LOW. HAPPINESS: HIGH.', down: 'WARRANTY... VOID...' },
  pinchbeard: { start: 'BOARD \'EM, ME CRABS!', low: 'I\'m takin\' on water!', kill: 'Overboard with ye!', wall: 'Breach in the hull! THEIR hull!', down: 'Tell me crabs... I loved \'em...' },
  goosegod: { start: 'HONK!', low: 'honk... (Translation: ow.)', kill: 'HONK. (Translation: Mine.)', wall: 'HONK HONK! (Translation: Bread time.)', down: 'HOOonk... (Translation: I will be back.)' },
  shardgoose: { start: 'HOOOONK!', low: 'HONK?! (Translation: My shards!)', kill: 'HONK. (Translation: Into the nest.)', wall: 'HONK! (Translation: The hall is MINE.)', down: 'honk... (Translation: ...fine. Keep them.)' },
};
// your voice, by temper: start = a battle cry (or an answer to the boss's), fall = another champion drops, slay = they finish the boss
const HERO_BARK = {
  heroic: { start: 'Hold the line!', fall: 'I\'ll carry on for you!', slay: 'For the keep!' },
  cheerful: { start: 'Let\'s go, team!', fall: 'Nooo! Get up! Please?', slay: 'We did it! Yay!' },
  honorable: { start: 'Fight with honour!', fall: 'You fought well, friend.', slay: 'A fair fight. Well fought.' },
  wholesome: { start: 'Everyone be careful!', fall: 'Oh no! Someone get a blanket!', slay: 'Sorry! Sorry! Good fight!' },
  zealous: { start: 'FOR THE LIGHT!', fall: 'Your sacrifice burns bright!', slay: 'JUDGEMENT!' },
  wise: { start: 'As planned.', fall: 'That was not in the plan.', slay: 'Predictable.' },
  loyal: { start: 'Together, everyone!', fall: 'I\'ve got your back!', slay: 'That one\'s for my friends!' },
  optimistic: { start: 'This is going to go great!', fall: 'Still going great! Mostly!', slay: 'Told you so!' },
  angry: { start: 'COME HERE!', fall: 'NOW I\'M ANGRY!', slay: 'AND STAY DOWN!' },
  cruel: { start: 'Make it hurt.', fall: 'Weak.', slay: 'Pathetic.' },
  greedy: { start: 'Loot first, questions later!', fall: 'Dibs on their stuff!', slay: 'Mine! The loot is mine!' },
  vain: { start: 'Watch this, everyone.', fall: 'Ugh. Not in front of me.', slay: 'Did everyone see that?' },
  deranged: { start: 'Hehehe. Fight time!', fall: 'They\'re just napping! Probably!', slay: 'Can I keep the head?' },
  paranoid: { start: 'It\'s a trap! It\'s always a trap!', fall: 'I KNEW it!', slay: 'Is it really dead? Poke it.' },
  cowardly: { start: 'I\'ll be... right here. At the back.', fall: 'Eep! Who\'s next? Not me!', slay: 'D-did I do that?' },
  lazy: { start: 'Wake me when it\'s over.', fall: 'Ugh. More work for me.', slay: 'Can I go back to bed now?' },
};
const BARKS = [];
const BARK_MAX = 4, BARK_GAP = 3.2, BARK_CPS = 34;
function barkVoiceUnit(B) { const v = B.run && B.run.voice; return v ? B.heroes.find(x => x.alive && x.inst && x.inst.uid === v.uid) : null; }
function barkSay(B, u, text, voice, hero, force) {
  if (!u || !text) return false;
  if (!force && ((B.barkN || 0) >= BARK_MAX || B.t - (B.barkT != null ? B.barkT : -99) < BARK_GAP)) return false;
  B.barkN = (B.barkN || 0) + 1; B.barkT = B.t;
  for (let i = BARKS.length - 1; i >= 0; i--) if (BARKS[i].u === u) BARKS.splice(i, 1);
  BARKS.push({ u, text, n: 0, t: 0, life: text.length / BARK_CPS + 1.7, vx: voiceFor(voice), hero, caps: false });
  if (BARKS.length > 2) BARKS.shift();
  return true;
}
Object.assign(FX, {
  cue(B, kind, u, src) {
    if (typeof TALK_PREF !== 'undefined' && TALK_PREF.mode === 'off') return;
    if (!B || !B.run) return;
    const boss = B.bossUnit && B.bossUnit.boss ? B.bossUnit : null, L = boss && BOSS_BARK[boss.id], vu = barkVoiceUnit(B);
    const hv = h => ({ hero: h.inst.id, temper: heroTemper(h.inst) }), H = h => HERO_BARK[heroTemper(h.inst)] || HERO_BARK.heroic;
    // the boss arrives with its battle cry and your voice answers it; an ordinary siege sometimes opens with the voice's cry
    if (kind === 'arrive') { if (L && u.alive && barkSay(B, u, L.start, u.id, false, true) && vu) B.barkReply = B.t + 1.6; }
    else if (kind === 'reply') { if (vu) barkSay(B, vu, H(vu).start, hv(vu), true, true); }
    else if (kind === 'start') { if (vu && !B.bossUnit && !isBossSiege(B.siege) && B.run.finale !== 'ready' && Math.random() < 0.6) barkSay(B, vu, H(vu).start, hv(vu), true); } else if (kind === 'fury') { if (L && u === boss && (B.furyBarks = (B.furyBarks || 0) + 1) <= 2) return barkSay(B, u, pick(FURY_LINES[u.id] || FURY_LINES._), u.id, false, true); return false; }
    else if (kind === 'low' && L) barkSay(B, boss, L.low, boss.id, false);
    else if (kind === 'wall' && L) barkSay(B, boss, L.wall, boss.id, false);
    else if (kind === 'kill' && L && src === boss) barkSay(B, boss, L.kill, boss.id, false);
    else if (kind === 'fall' && vu && u !== vu && !u.temp && !B.fallBark) { B.fallBark = true; barkSay(B, vu, H(vu).fall, hv(vu), true); }
    else if (kind === 'slain' && L && u === boss) {
      const k = src && (src.owner || src);
      if (vu && k === vu) barkSay(B, vu, H(vu).slay, hv(vu), true, true); else barkSay(B, u, L.down, u.id, false, true);
    }
  },
});
function stepBarks(dt) {
  for (const b of BARKS) {
    b.t += dt; const want = Math.min(b.text.length, Math.floor(b.t * BARK_CPS));
    while (b.n < want) { b.n++; const ch = b.text[b.n - 1]; try { if (VOX.due(b.vx, ch, b.n)) VOX.say(b.vx, ch, b.n, b.text[b.n] || ' '); } catch (e) { } }
  }
  for (let i = BARKS.length - 1; i >= 0; i--) if (BARKS[i].t >= BARKS[i].life) BARKS.splice(i, 1);
}
// drawn on the hi-res layer above the fight: a comic bubble over the speaker's head, tail pointing down at them
function drawBarks(ctx, k, ox, oy, B) {
  if (!B || !BARKS.length) { if (!B) BARKS.length = 0; return; }
  for (const b of BARKS) {
    const u = b.u, a = Math.min(1, (b.life - b.t) * 3), pop = b.t < 0.12 ? 0.7 + b.t * 2.5 : 1;
    const fs = 5.2 * k, pad = 3 * k, maxW = 96 * k;
    ctx.save(); ctx.globalAlpha = Math.max(0, a);
    ctx.font = `700 ${fs}px "Cinzel", "Atkinson Hyperlegible", sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    // wrap the full line so the bubble keeps its size while it types
    const words = b.text.split(' '), lines = []; let cur = '';
    for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; } if (cur) lines.push(cur);
    const tw = Math.max(...lines.map(l => ctx.measureText(l).width)), lh = fs * 1.2, bw = tw + pad * 2, bh = lines.length * lh + pad * 2 - fs * 0.15;
    const hx = u.x * k + ox, top = (u.y - 20 * (u.vscale || u.scale || 1) - (u.z || 0) - 6) * k + oy;
    let bx = hx - bw / 2; bx = Math.max(2 * k, Math.min(W * k - bw - 2 * k, bx)); const by = Math.max(14 * k, top - bh - 4 * k);
    ctx.translate(hx, by + bh); ctx.scale(pop, pop); ctx.translate(-hx, -(by + bh));
    const r = 3 * k; ctx.fillStyle = '#fffdf4'; ctx.strokeStyle = OUTLINE; ctx.lineWidth = 1.2 * k;
    ctx.beginPath(); ctx.moveTo(bx + r, by); ctx.lineTo(bx + bw - r, by); ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + r); ctx.lineTo(bx + bw, by + bh - r); ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - r, by + bh);
    const tx = Math.max(bx + r + 3 * k, Math.min(bx + bw - r - 3 * k, hx));
    ctx.lineTo(tx + 2.5 * k, by + bh); ctx.lineTo(tx, by + bh + 4 * k); ctx.lineTo(tx - 2.5 * k, by + bh);
    ctx.lineTo(bx + r, by + bh); ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - r); ctx.lineTo(bx, by + r); ctx.quadraticCurveTo(bx, by, bx + r, by); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = b.hero ? '#1a1230' : '#8a1a3a';
    let left = b.n;
    lines.forEach((l, i) => { if (left <= 0) return; const s = l.slice(0, left); left -= l.length + 1; ctx.fillText(s, bx + pad, by + pad + i * lh); });
    ctx.restore();
  }
}
