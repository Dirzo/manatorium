// ===== Champion idles: every legend has a little fidget of its own =====
// While a champion stands still it plays its own short action every few seconds (and a few magical
// ones have a constant ambient touch). Everything is a pure function of time, so nothing to save.
// pose(k, t) nudges the sprite: dx/dy shift, sx/sy squash, hx/hy lift the head (rows above `cut`),
// a fades it. back/front(P, k, t) draw extra pixels on the 20x20 sprite grid, behind or in front.
// k is the action's progress 0..1, or -1 between actions.
const TAU = Math.PI * 2;
const bump = k => k <= 0 || k >= 1 ? 0 : Math.sin(Math.PI * k);
const seg = (k, a, b) => Math.max(0, Math.min(1, (k - a) / (b - a)));
const inK = (k, a, b) => k >= a && k < b;
const IDLE_ART = {
  note: ['.##', '.#.', '##.'], heart: ['#.#', '###', '.#.'], bell: ['.#.', '###', '###', '#.#'],
  rune: ['#.#', '.#.', '#.#'], rune2: ['##.', '.#.', '.##'], gearA: ['.#.', '###', '.#.'], gearB: ['#.#', '.#.', '#.#'],
  cloud: ['..###...', '.#####..', '########'], bubble: ['.#.', '#.#', '.#.'],
};
const IDLES = {
  // --- tier 1 ---
  brann: { ev: 4.5, d: 1.2, pose: k => ({ sy: 1 + 0.05 * bump(k) }), // puffs up while a glint sweeps his shield
    front(P, k) { if (k < 0) return; const x = 13 + k * 8; for (let i = 0; i < 3; i++) { const gx = Math.round(x - i); if (gx >= 14 && gx <= 19) P.px(gx, 9 + i * 2, '#ffffff', 1, 2); }
      if (k > 0.7) P.star(19, 7, '#ffffff', bump(seg(k, 0.7, 1)) > 0.5 ? 2 : 1); } },
  iria: { ev: 3.6, d: 1.6, pose: k => ({ hy: inK(k, 0.15, 0.85) ? -1 : 0 }), // juggles two little fireballs off her staff
    front(P, k, t) { P.px(13, 2, Math.floor(t * 9) % 2 ? '#ffd23a' : '#ff8a3d'); if (k < 0) return;
      for (const o of [0, 0.5]) { const kk = (k * 2 + o) % 1, y = 3 - 9 * bump(kk), x = 13 + Math.sin(kk * TAU) * 2.5;
        P.px(x, y + 2, '#ff5a2a', 1, 1, 0.5); P.px(x - 0.5, y, '#ff5a2a', 2, 2); P.px(x, y, '#ffe680'); } } },
  vale: { ev: 4, d: 1.1, pose: k => ({ dy: k > 0.85 ? 1 : 0 }), // flips her spare dagger end over end
    front(P, k) { if (k < 0) return; const y = 15 - 11 * bump(k), sp = Math.floor(k * 12) % 2;
      if (sp) { P.px(4, y, '#dfe9ff', 3, 1); P.px(3, y, '#ffcf3a'); } else { P.px(5, y - 1, '#dfe9ff', 1, 3); P.px(5, y + 2, '#ffcf3a'); } } },
  thessa: { ev: 5, d: 2, pose: k => ({ hx: k > 0.45 && k < 0.95 ? -1 : 0 }), // a leaf drifts past and she watches it go
    front(P, k) { if (k < 0) return; const x = 22 - k * 26, y = 3 + Math.sin(k * TAU * 1.5) * 2 + k * 7;
      P.px(x, y, '#3f8c4a', 3, 2); P.px(x + (Math.floor(k * 10) % 2), y, '#9be05a', 2, 1); } },
  grukk: { ev: 4, d: 1.1, pose: k => ({ sy: 1 + 0.06 * bump(seg(k, 0, 0.4)), dy: Math.round(bump(seg(k, 0.45, 1))) }), // rolls his shoulders and snorts
    front(P, k) { if (k < 0) return; for (const o of [0.35, 0.6]) { const kk = seg(k, o, o + 0.4); if (kk <= 0 || kk >= 1) continue;
      P.ph(15 + kk * 4, 8 - kk * 2, '#e8e8f0', kk > 0.5 ? 2 : 1, kk > 0.5 ? 2 : 1, 1 - kk); } } },
  rattle: { ev: 5, d: 1.2, pose: k => ({ cut: 11, hy: -Math.round(5 * bump(k)), hx: inK(k, 0.15, 0.85) ? Math.round(Math.sin(k * TAU * 3)) : 0, sy: k > 0.9 ? 0.95 : 1 }), // skull pops off and clatters back
    back(P, k) { if (k < 0 || bump(k) < 0.4) return; P.px(9, 9, '#f1ecdc', 1, 2); P.px(10, 10, '#c9c4b0'); } },
  pip: { ev: 4.2, d: 1.5, pose: k => ({ sy: 1 + 0.07 * bump(seg(k, 0.7, 0.9)) }), // catches a fly with his tongue
    front(P, k) { if (k < 0) return; const fl = q => [17 + Math.cos(q * TAU * 3) * 3, 3 + Math.sin(q * TAU * 4) * 2];
      if (k < 0.55) { const [x, y] = fl(k); P.px(x, y, OUTLINE); P.px(x, y - 1, '#ffffff', 1, 1, Math.floor(k * 30) % 2 ? 1 : 0.4); return; }
      if (k < 0.7) { const [x, y] = fl(0.55), r = bump(seg(k, 0.55, 0.7)); for (let i = 0; i <= 8; i++) { const f = i / 8 * r; P.ph(13 + (x - 13) * f, 8 + (y - 8) * f, '#ff8fb0'); }
        if (seg(k, 0.55, 0.7) < 0.5) P.px(x, y, OUTLINE); return; }
      if (k > 0.78) { const kk = seg(k, 0.78, 1); P.art('heart', 8, -1 - kk * 3, '#ff5d8f', 'h', 1 - kk); } } },
  fenn: { ev: 4, d: 1.1, pose: k => ({ dy: k < 0 ? 0 : -Math.round(Math.abs(Math.sin(k * TAU)) * 3) }), // two playful hops
    front(P, k) { if (k < 0) return; for (const l of [0.5, 1]) { const kk = seg(k, l - 0.08, l + 0.1); if (kk > 0 && kk < 1) { P.pg(6 - kk * 3, 19, '#d8c8b0', 1, 1, 1 - kk); P.pg(13 + kk * 3, 19, '#d8c8b0', 1, 1, 1 - kk); } } } },
  // --- tier 2 ---
  rook: { ev: 4.4, d: 1.2, pose: k => ({ dy: k < 0.4 ? -Math.round(2 * bump(seg(k, 0, 0.4))) : 0, sy: inK(k, 0.4, 0.5) ? 0.94 : 1 }), // stomps and sparks fly
    front(P, k) { if (k < 0.4) return; const kk = seg(k, 0.4, 1); for (let i = 0; i < 5; i++) { const a = Math.PI + (i + 0.5) / 5 * Math.PI;
      P.pg(10 + Math.cos(a) * kk * 9, 19 + Math.sin(a) * kk * 6 + kk * kk * 4, i % 2 ? '#ffd23a' : '#ff8a3a', 1, 1, 1 - kk); } } },
  sera: { ev: 3.8, d: 0.9, pose: k => ({ hy: inK(k, 0.1, 0.9) ? -1 : 0, hx: inK(k, 0.1, 0.9) ? Math.floor(k * 20) % 2 : 0 }), // static crackles until her hair stands up
    front(P, k, t) { const f = Math.floor(t * 7); if (f % 4 === 0) P.ph(5 + (f * 7) % 7, 3 + (f * 3) % 4, '#9ff6ff');
      if (k < 0) return; let x = 13, y = 3; for (let i = 0; i < 4; i++) { const nx = x + (i % 2 ? 2 : -2), ny = y - 2; P.px((x + nx) / 2, (y + ny) / 2, '#ffffff'); P.px(nx, ny, Math.floor(k * 16) % 2 ? '#9ff6ff' : '#ffffff'); x = nx; y = ny; } } },
  mara: { ev: 5, d: 2.4, pose: k => ({ dx: k < 0 ? 0 : Math.round(Math.sin(k * TAU)) }), // hums a little dawn song
    front(P, k) { if (k < 0) return; for (const o of [0, 0.35]) { const kk = seg(k, o, o + 0.65); if (kk <= 0 || kk >= 1) continue;
      P.art('note', 13 + kk * 5, 6 - kk * 10 + Math.sin(kk * TAU) * 1.2, '#ffcf3a', 'p', Math.min(1, (1 - kk) * 2)); } } },
  hilda: { ev: 4.6, d: 1.5, pose: k => ({ dx: -Math.round(bump(seg(k, 0, 0.25))) }), // a smoke ring puffs out of the cannon
    front(P, k) { if (k < 0) return; if (k < 0.12) P.px(20, 10, '#ffde3a', 1, 2); const kk = seg(k, 0.08, 1), r = 1 + kk * 2;
      P.ring(20 + kk * 6, 11 - kk * 4, r, '#d8dce8', 1 - kk); } },
  morrow: { ev: 5, d: 0.8, pose: k => ({ cut: 11, hy: k >= 0 && Math.floor(k * 14) % 2 ? -1 : 0 }), // soul wisps circle him, his jaw chatters
    back(P, k, t) { idleOrbit(P, t, 1.8, 8, 3, 2, '#9dff6a', false); }, front(P, k, t) { idleOrbit(P, t, 1.8, 8, 3, 2, '#9dff6a', true); } },
  bogs: { ev: 4.4, d: 1.3, pose: k => ({ sy: 1 + 0.04 * bump(seg(k, 0, 0.7)) }), // throat sac swells into a croak
    front(P, k) { if (k < 0) return; if (k < 0.72) { const r = 0.6 + 2 * seg(k, 0, 0.6); P.disc(13, 10, r + 0.8, OUTLINE, 'h'); P.disc(13, 10, r, '#ffe3b0', 'h'); P.ph(12, 9, '#ffffff'); }
      else { const kk = seg(k, 0.72, 1); P.ring(13, 10, 2 + kk * 4, '#ffe3b0', 1 - kk, 'h'); } } },
  ursa: { ev: 6, d: 2.2, pose: k => ({ cut: 11, hy: -Math.round(2 * bump(k)), sy: 1 + 0.07 * bump(k) }), // a huge sleepy yawn and stretch
    front(P, k) { if (k < 0 || bump(k) < 0.3) return; P.ph(13, 9, '#3a1a2a', 2, 1 + Math.round(bump(k))); P.ph(13, 9, '#ff9aa8'); } },
  zogra: { ev: 3.4, d: 1.6, pose: k => ({ dy: k >= 0 && (k * 3) % 1 < 0.2 ? 1 : 0 }), // drums a three-beat rhythm
    front(P, k) { if (k < 0) return; const kb = (k * 3) % 1; P.ell(10, 19, kb * 9, kb * 2.5, '#ff5d8f', 1 - kb); if (kb < 0.3) P.px(13, 1, '#ffffff'); } },
  aurelle: { ev: 5, d: 1.3, pose: k => ({ cut: 11, hy: inK(k, 0.2, 0.8) ? -1 : 0 }), // chin up, crown glinting, cape stirring
    back(P, k, t) { for (let i = 0; i < 5; i++) if (Math.sin(t * 4 - i) > 0.2) P.px(3, 12 + i, '#7a4ae0'); },
    front(P, k) { if (k < 0) return; P.star(9, 1, '#ffffff', bump(k) > 0.6 ? 2 : 1, 'h'); } },
  hrolf: { ev: 5.5, d: 1.6, pose: k => ({ cut: 11, hy: -Math.round(2 * seg(k, 0, 0.15)) * (k < 0.85 ? 1 : 0) }), // throws his head back and howls
    front(P, k) { if (k < 0) return; for (let i = 0; i < 3; i++) { const kk = seg(k, 0.15 + i * 0.15, 0.55 + i * 0.15); if (kk <= 0 || kk >= 1) continue; const x = 16 + kk * 6, a = 1 - kk;
      P.ph(x, 5, '#ffffff', 1, 1, a); P.ph(x + 1, 6, '#ffffff', 1, 2, a); P.ph(x, 8, '#ffffff', 1, 1, a); } } },
  // --- tier 3 ---
  gorehorn: { ev: 4.6, d: 1.5, pose: k => ({ dx: k >= 0 && k < 0.55 ? Math.round(Math.sin(k * TAU * 2)) : 0 }), // paws the ground like a bull, eyes go red, snorts
    front(P, k) { if (k < 0) return; if (k < 0.55) P.pg(5 - seg(k, 0, 0.55) * 3, 19, '#a89878', 2, 1, 0.8);
      else { P.ph(10, 6, '#ff3d3d'); P.ph(12, 6, '#ff3d3d'); const kk = seg(k, 0.6, 1); P.ph(15 + kk * 4, 8 - kk, '#ffb0a0', 2, 1, 1 - kk); if (kk < 0.5) P.ph(16 + kk * 6, 7, '#ffde3a'); } } },
  vesper: { ev: 5, d: 2, pose: k => ({ dy: Math.round(bump(seg(k, 0.05, 0.45))) }), // a curtsey, rose petals falling from her hand
    front(P, k) { if (k < 0) return; for (let i = 0; i < 4; i++) { const kk = seg(k, i * 0.13, i * 0.13 + 0.6); if (kk <= 0 || kk >= 1) continue;
      P.px(16 + Math.sin(kk * TAU + i) * 2 - kk * 3, 10 + kk * 9, i % 2 ? '#ff3d6e' : '#ff8ab0', 2 - (i % 2), 1, 1 - kk * 0.6); } } },
  croak: { ev: 4, d: 1.8, // bubbles burble up out of her staff
    front(P, k) { if (k < 0) return; for (let i = 0; i < 3; i++) { const kk = seg(k, i * 0.2, i * 0.2 + 0.6); if (kk <= 0) continue;
      const x = 12 + Math.sin(kk * TAU * 1.5 + i) * 1.5, y = 2 - kk * 9; if (kk < 0.95) { P.art('bubble', x, y, '#5fd3ff'); P.px(x + 1, y + 1, '#ffffff', 1, 1, 0.5); } else P.star(x + 1, y + 1, '#bff4ff', 1); } } },
  thrain: { ev: 5, d: 1.6, // the runes on his shield wake and float up
    front(P, k) { if (k < 0) return; P.px(16, 10, '#9ff6ff', 2, 2, bump(k)); for (let i = 0; i < 2; i++) { const kk = seg(k, 0.2 + i * 0.25, 0.75 + i * 0.25); if (kk <= 0 || kk >= 1) continue;
      P.art(i ? 'rune2' : 'rune', 15 + i * 2, 8 - kk * 9, '#9ff6ff', 'p', 1 - kk); } } },
  sylvaris: { ev: 4.5, d: 2.2, // flowers bloom at her feet and a butterfly visits
    front(P, k) { if (k < 0) return; const fade = 1 - seg(k, 0.82, 1);
      [3, 9, 16].forEach((x, i) => { const g = seg(k, i * 0.12, i * 0.12 + 0.3); if (!g) return; P.pg(x, 19 - Math.round(g * 2), '#5a9a2a', 1, Math.round(g * 2) + 1, fade);
        if (g >= 1) { P.pg(x - 1, 16, '#ff9fd0', 3, 1, fade); P.pg(x, 15, '#ff9fd0', 1, 3, fade); P.pg(x, 16, '#ffd84a', 1, 1, fade); } });
      const bx = 6 + Math.sin(k * TAU) * 7, by2 = 2 + Math.cos(k * TAU * 2) * 2, w = Math.floor(k * 24) % 2; P.px(bx, by2, '#ffcf3a'); P.px(bx - 1, by2 - w, '#ff9fd0'); P.px(bx + 1, by2 - w, '#ff9fd0'); } },
  kodo: { ev: 5, d: 2, // a tiny thundercloud gathers over his horns
    front(P, k) { if (k < 0) return; const a = Math.min(seg(k, 0, 0.15), 1 - seg(k, 0.85, 1));
      P.art('cloud', 5, -5, '#8a8aa8', 'h', a); P.art('cloud', 5, -6, '#c8c8e0', 'h', a * 0.6);
      for (let i = 0; i < 3; i++) { const kk = (k * 3 + i * 0.37) % 1; if (inK(k, 0.15, 0.85)) P.ph(6 + i * 3, -2 + kk * 5, '#7cf0ff', 1, 1, 0.9); }
      if (inK(k, 0.55, 0.65)) { P.ph(10, -2, '#ffffff'); P.ph(11, -1, '#fff1a8'); P.ph(10, 0, '#fff1a8'); P.ph(11, 1, '#ffffff'); } } },
  // --- expansion legends ---
  ottoline: { ev: 5, d: 1.5, pose: k => ({ cut: 11, hy: inK(k, 0.2, 0.5) ? 1 : 0 }), // a knightly nod, and her little bell rings
    front(P, k) { if (k < 0.35) return; const kk = seg(k, 0.35, 1), sw = Math.round(Math.sin(kk * TAU * 3)); P.art('bell', 8 + sw * 0.5, -6, '#ffcf3a', 'h', 1 - seg(k, 0.85, 1));
      if (kk < 0.6) { P.ph(6, -5, '#ffffff', 1, 2, 1 - kk); P.ph(12, -5, '#ffffff', 1, 2, 1 - kk); } } },
  gravelgut: { ev: 4.5, d: 1.5, pose: k => ({ cut: 11, hy: inK(k, 0.6, 0.95) && Math.floor(k * 14) % 2 ? 1 : 0 }), // tosses a pebble into his mouth and crunches it
    front(P, k) { if (k < 0) return; if (k < 0.6) { const kk = seg(k, 0, 0.6); P.px(16 - 4 * kk, 12 - 3 * kk - 10 * bump(kk), OUTLINE, 2, 2); P.px(16 - 4 * kk, 12 - 3 * kk - 10 * bump(kk), '#c9c4d8'); }
      else if (k < 0.95 && Math.floor(k * 14) % 3 === 0) P.ph(13, 11, '#c9c4d8'); } },
  grom: { ev: 4.6, d: 1.6, pose: k => ({ dx: inK(k, 0, 0.45) ? (Math.floor(k * 22) % 2 ? 1 : -1) : 0 }), // shakes himself off like a wet dog
    front(P, k) { if (k < 0) return; const kk = seg(k, 0.05, 0.7); if (kk > 0 && kk < 1) for (let i = 0; i < 6; i++) { const a = -Math.PI * (0.1 + 0.8 * i / 5);
      P.px(10 + Math.cos(a) * kk * 11, 10 + Math.sin(a) * kk * 6 + kk * kk * 8, i % 2 ? '#5fd3ff' : '#bff4ff'); }
      const pk = seg(k, 0.45, 1); if (pk > 0) P.ell(10, 19, 6, 1, '#5fd3ff', 0.6 * (1 - pk)); } },
  morgrave: { ev: 5.5, d: 1.6, pose: k => ({ cut: 11, hy: inK(k, 0.1, 0.9) ? -1 : 0 }), // ghost kings rise from his crown
    back(P, k, t) { for (let i = 0; i < 3; i++) { const q = (t * 0.6 + i / 3) % 1; P.px(2 + i * 7, 17 - q * 16, '#8ad0ff', 1, 1, 0.6 * bump(q)); } },
    front(P, k) { if (k < 0) return; const kk = seg(k, 0.1, 1); const a = 0.7 * (1 - kk), y = 2 - kk * 7; P.ph(6, y, '#8ad0ff', 7, 1, a); P.ph(6, y - 1, '#8ad0ff', 1, 1, a); P.ph(9, y - 1, '#8ad0ff', 1, 1, a); P.ph(12, y - 1, '#8ad0ff', 1, 1, a); P.ph(9, y - 2, '#ffffff', 1, 1, a); } },
  fizzwick: { ev: 4, d: 1.4, // a gear springs out of his hat, spins and drops back in
    front(P, k, t) { if (Math.floor(t * 5) % 3 === 0) P.px(15, 11, '#ffffff'); if (k < 0) return; const kk = seg(k, 0, 0.8);
      if (kk < 1) P.art(Math.floor(k * 16) % 2 ? 'gearA' : 'gearB', 8 + kk * 2, -1 - 8 * bump(kk), '#cfd6e6', 'h');
      if (k > 0.75) P.ph(11 + seg(k, 0.75, 1) * 2, -1 - seg(k, 0.75, 1) * 3, '#ffffff', 2, 1, 1 - seg(k, 0.75, 1)); } },
  nyx: { ev: 5, d: 1, pose: (k, t) => ({ dy: -1 + Math.round(Math.sin(t * 2) * 1.2) }), // floats among her own little stars
    back(P, k, t) { idleOrbit(P, t, 1.2, 9, 4, 3, '#fff3a0', false); },
    front(P, k, t) { idleOrbit(P, t, 1.2, 9, 4, 3, '#fff3a0', true); if (k < 0) return; P.star(9, 0, '#fff3a0', bump(k) > 0.5 ? 3 : 2, 'h'); P.star(9, 0, '#ffffff', 1, 'h'); } },
  grizelda: { ev: 4.2, d: 1.5, pose: k => ({ cut: 11, hx: inK(k, 0.1, 0.7) ? Math.floor(k * 18) % 2 : 0, dy: inK(k, 0.1, 0.7) ? Math.floor(k * 9) % 2 : 0 }), // cackles over green bubbles
    front(P, k) { if (k < 0) return; for (let i = 0; i < 2; i++) { const kk = seg(k, i * 0.3, i * 0.3 + 0.55); if (kk <= 0 || kk >= 1) continue;
      P.px(13 + Math.sin(kk * 9 + i) * 1.2, 2 - kk * 8, '#c8ff6a', kk > 0.5 ? 2 : 1, kk > 0.5 ? 2 : 1, 1 - kk * 0.5); } } },
  snick: { ev: 3.8, d: 1.2, // flips a gold coin and snatches it
    front(P, k) { if (k < 0) return; const kk = seg(k, 0, 0.75); if (kk < 1) { const y = 9 - 11 * bump(kk), w = Math.floor(k * 18) % 3 ? 2 : 1; P.px(16 + (2 - w) / 2, y, '#ffcf3a', w, 2); if (w === 2) P.px(16, y, '#fff1a8'); }
      else P.star(16, 9, '#ffffff', 1); } },
  whisper: { ev: 5, d: 2.2, pose: k => ({ a: 1 - 0.75 * bump(k) }), // fades into smoke, leaving only his red eyes
    front(P, k) { if (k < 0) return; P.solid(); P.ph(9, 6, '#ff3d3d'); P.ph(12, 6, '#ff3d3d');
      for (let i = 0; i < 3; i++) { const q = (k * 2 + i / 3) % 1; P.pg(5 + i * 4 + Math.sin(q * 6) , 19 - q * 8, '#8a8aa8', 1, 1, 0.6 * bump(k) * (1 - q)); } } },
  tibbs: { ev: 4.6, d: 1.6, pose: k => ({ dx: inK(k, 0.65, 0.8) ? 2 : 0, dy: inK(k, 0.65, 0.75) ? -1 : 0, cut: 11, hy: inK(k, 0.2, 0.65) ? Math.round(Math.sin(k * 20) * 0.6) : 0 }), // tail swishing, swats at a firefly
    back(P, k, t) { const sw = Math.sin(t * 3); P.px(4, 15, '#4a4a5a'); P.px(3, 14, '#4a4a5a'); P.px(2, sw > 0 ? 12 : 13, '#4a4a5a', 1, 2); P.px(2, sw > 0 ? 11 : 12, '#e8e8f0'); },
    front(P, k) { if (k < 0) return; const x = 18 + Math.sin(k * TAU * 2) * 2 + (k > 0.7 ? (k - 0.7) * 30 : 0), y = 5 + Math.cos(k * TAU * 3) * 2 - (k > 0.7 ? (k - 0.7) * 30 : 0);
      if (Math.floor(k * 20) % 3) P.px(x, y, '#ffd84a'); } },
  veyra: { ev: 5, d: 1.4, // moths drift around her; now and then night petals spiral up
    front(P, k, t) { for (let i = 0; i < 2; i++) { const a = t * (1.3 + i * 0.4) + i * 3; const x = 10 + Math.cos(a) * 8, y = 4 + Math.sin(a * 1.7) * 3, w = Math.floor(t * 12 + i) % 2;
        P.px(x, y, '#5a3a8a'); P.px(x - 1, y - w, '#c8b8ff'); P.px(x + 1, y - w, '#c8b8ff'); }
      if (k < 0) return; for (let i = 0; i < 5; i++) { const a = k * TAU * 1.2 + i * TAU / 5, r = 7 * (1 - k * 0.5); P.px(10 + Math.cos(a) * r, 14 - k * 14 + Math.sin(a) * 2, '#ff5d8f', 1, 1, 1 - k); } } },
  murk: { ev: 4.5, d: 1, pose: k => ({ dx: Math.round(bump(k)), cut: 11, hx: Math.round(bump(k)) }), // leans in with a gleaming grin
    front(P, k) { if (!inK(k, 0.35, 0.8)) return; P.star(13, 9, '#ffffff', seg(k, 0.35, 0.8) < 0.5 ? 1 : 2, 'h'); } },
  pell: { ev: 6, d: 2.8, // a little bird lands on his hat, hops and flies off
    front(P, k) { if (k < 0) return; let x, y, fly = true;
      if (k < 0.3) { const kk = seg(k, 0, 0.3); x = 24 - 14 * kk; y = -9 + 9 * kk; } else if (k < 0.75) { x = 10; y = inK(k, 0.48, 0.55) ? -1 : 0; fly = false; } else { const kk = seg(k, 0.75, 1); x = 10 - 18 * kk; y = -12 * kk; }
      P.ph(x - 1, y - 2, OUTLINE, 4, 4); P.ph(x + 2, y - 1, OUTLINE); P.ph(x, y - 1, '#5fa8ff', 2, 2); P.ph(x + 1, y - 1, '#ffffff'); P.ph(x + 2, y - 1, '#ffb02e');
      if (fly) P.ph(x - 1, y + (Math.floor(k * 30) % 2 ? -3 : 1), '#bfe0ff', 3, 1); } },
  kragg: { ev: 4.4, d: 1.4, // holds an arrow up to one squinting eye to check it's straight
    front(P, k) { if (k < 0) return; const kk = seg(k, 0, 0.2) * (1 - seg(k, 0.8, 1)), y = 12 - 5 * kk; if (kk <= 0) return;
      P.ph(11, y - 1, OUTLINE, 9, 3); P.ph(11, y, '#ff5d6e'); P.ph(12, y, '#e8c08a', 6, 1); P.ph(18, y, '#ffffff'); if (kk >= 1) { P.ph(12, 6, '#5aa04a', 1, 2); } } },
  lirien: { ev: 5, d: 1.1, pose: (k, t) => ({ dy: -1 + Math.round(Math.sin(t * 1.7 + 1) * 1.2) }), // drifts on light, golden motes falling around her
    back(P, k, t) { for (let i = 0; i < 4; i++) { const q = (t * 0.4 + i / 4) % 1; P.pg(1 + i * 6, -2 + q * 21, '#fff3c0', 1, 1, bump(q)); } },
    front(P, k) { if (k < 0) return; const a = bump(k); P.ph(5, -1, '#ffffff', 9, 1, a * 0.8); P.ph(6, 1, '#fff3c0', 7, 1, a * 0.6); P.star(13, -1, '#ffffff', 1, 'h'); } },
  ribbsby: { ev: 5, d: 1.4, pose: k => ({ cut: 5, hy: -Math.round(3 * bump(seg(k, 0.1, 0.75))), dy: Math.round(bump(seg(k, 0.15, 0.7))) }), // tips his hat, very proper
    front(P, k) { if (!inK(k, 0.3, 0.55)) return; P.star(15, 0, '#ffffff', 1, 'p'); } },
  brakka: { ev: 3.8, d: 1.2, pose: k => ({ dy: inK(k, 0.55, 1) && Math.floor(k * 10) % 2 ? 1 : 0 }), // runs a thumb down the cleaver, then taps an impatient foot
    front(P, k) { if (!inK(k, 0, 0.55)) return; const y = 6 + seg(k, 0, 0.5) * 5; P.px(16, y, '#ffffff', 4, 1); if (k > 0.45) P.star(19, 11, '#ffffff', 1); } },
  haldor: { ev: 5, d: 1.7, pose: k => ({ sx: 1 + 0.06 * bump(seg(k, 0, 0.4)), sy: 1 - 0.03 * bump(seg(k, 0, 0.4)) }), // pats his belly and lets out a burp
    front(P, k) { if (k < 0.45) return; if (k < 0.85) { const r = 0.5 + seg(k, 0.45, 0.8) * 1.8; P.ring(13, 11 - seg(k, 0.45, 0.85) * 3, r, '#e8f0c0', 1, 'h'); }
      else P.star(13, 8, '#ffffff', 1, 'h'); } },
  bjorna: { ev: 4.5, d: 1.4, // snow settles around her, frosty breath puffs from her snout
    back(P, k, t) { for (let i = 0; i < 3; i++) { const q = (t * 0.35 + i / 3) % 1; P.pg(((i * 7 + t * 2) % 22) - 1, -2 + q * 22, '#ffffff', 1, 1, 0.85 * bump(q)); } },
    front(P, k) { if (k < 0) return; for (let i = 0; i < 3; i++) { const kk = seg(k, i * 0.2, i * 0.2 + 0.5); if (kk <= 0 || kk >= 1) continue; P.ph(16 + kk * 6, 8 - kk * 2, '#bff4ff', kk > 0.4 ? 2 : 1, 1, 1 - kk); } } },
  grimbone: { ev: 5.5, d: 1.6, pose: (k, t) => ({ dy: -1 + Math.round(Math.sin(t * 1.6) * 1.2) }), // hovers, soul fire on the blade, a gleam runs along it
    front(P, k, t) { P.px(9, 1 - (Math.floor(t * 8) % 2), '#9dff6a'); if (k < 0) return; const x = 9 + seg(k, 0, 0.5) * 8; if (k < 0.5) P.px(x, 1, '#ffffff', 2, 1);
      const kk = seg(k, 0.3, 1); if (kk > 0 && kk < 1) { P.art('heart', 9, 2 - kk * 9, '#9dff6a', 'h', 1 - kk); P.ph(10, 3 - kk * 9, OUTLINE, 1, 1, 1 - kk); } } },
  bramble: { ev: 5, d: 2.2, // her antlers bud with leaves and a butterfly lands on them
    front(P, k) { if (k < 0) return; const g = seg(k, 0, 0.3), f = 1 - seg(k, 0.85, 1);
      if (g > 0.3) { P.ph(3, 0, '#7bd36a', 1, 1, f); P.ph(15, 0, '#7bd36a', 1, 1, f); } if (g > 0.7) { P.ph(7, 0, '#9be05a', 1, 1, f); P.ph(11, 0, '#9be05a', 1, 1, f); P.ph(4, -1, '#ff9fd0', 1, 1, f); }
      let x = 13, y = -1; if (k < 0.35) { const kk = seg(k, 0.1, 0.35); x = 22 - 9 * kk; y = -8 + 7 * kk + Math.sin(kk * 12); } else if (k > 0.7) { const kk = seg(k, 0.7, 1); x = 13 + 10 * kk; y = -1 - 9 * kk + Math.sin(kk * 12); }
      if (k > 0.1) { const w = Math.floor(k * (k > 0.35 && k < 0.7 ? 6 : 24)) % 2; P.ph(x, y, OUTLINE); P.ph(x - 1, y - w, '#ffcf3a'); P.ph(x + 1, y - w, '#ffcf3a'); } } },
  tobias: { ev: 6, d: 2.2, pose: k => ({ cut: 11, hy: inK(k, 0.15, 0.85) ? 1 : 0 }), // bows his head in prayer, his halo shines
    front(P, k) { if (k < 0) return; const a = bump(k); P.ph(9, -3, '#fff3a0', 1, 2, a); P.ph(4, 0, '#fff3a0', 2, 1, a); P.ph(13, 0, '#fff3a0', 2, 1, a); P.ph(5, -2, '#fff3a0', 1, 1, a); P.ph(13, -2, '#fff3a0', 1, 1, a);
      if (a > 0.6) P.star(9 + Math.sin(k * 20) * 5, 3 - k * 4, '#ffffff', 1, 'h'); } },
  oona: { ev: 4, d: 1.8, // the bone chimes on her totem sway and ring
    front(P, k, t) { const sw = k < 0 ? 0.3 : 1.2 * bump(k); for (let i = 0; i < 3; i++) { const o = Math.round(Math.sin(t * 5 + i * 1.3) * sw); P.px(12 + i + o * 0.5, 7, '#e8f6ff'); P.px(12 + i + o, 8, '#9ff6ff', 1, 1 + (i % 2)); }
      if (k < 0) return; const kk = (k * 2) % 1; P.star(16 + kk * 2, 6 - kk * 5, '#ffffff', kk < 0.5 ? 1 : 0); } },
  toadmother: { ev: 5, d: 1.7, pose: (k, t) => ({ dy: -1 + Math.round(Math.sin(t * 1.4 + 2) * 1.2) }), // floats with tadpoles circling, a royal croak rings out
    front(P, k, t) { for (let i = 0; i < 2; i++) { const a = t * 1.5 + i * Math.PI, x = 10 + Math.cos(a) * 10, y = 20 + Math.sin(a) * 2; if (Math.sin(a) < 0) continue; P.pg(x, y, OUTLINE); P.pg(x + Math.sign(Math.sin(a)), y, '#5a9ad8'); }
      if (k < 0) return; if (k < 0.5) { const r = 0.6 + 2 * seg(k, 0, 0.4); P.disc(10, 10, r + 0.8, OUTLINE, 'h'); P.disc(10, 10, r, '#fff3a0', 'h'); }
      else { const kk = seg(k, 0.5, 1); P.ell(10, 21, 3 + kk * 10, 1 + kk * 2.5, '#fff3a0', 1 - kk); } } },
};
// a few points circling the champion, drawn behind on the far side and in front on the near side
function idleOrbit(P, t, sp, rx, ry, n, col, near) {
  for (let i = 0; i < n; i++) { const a = t * sp + i * TAU / n, s = Math.sin(a); if ((s > 0) !== near) continue; const x = 10 + Math.cos(a) * rx, y = 11 + s * ry;
    P.px(x, y, col); P.px(x - Math.sign(Math.cos(a + Math.PI / 2)), y, col, 1, 1, 0.4); }
}

const IDLE_CLOCK = new WeakMap();   // unit (or its roster hero) -> when it started standing still
function idleFor(u, t, fr) {
  if (!u.key || u.key[0] !== 'h' || u.key[1] !== ':') return null;
  const id = u.key.split(':')[1], def = IDLES[id]; if (!def) return null;
  const who = u.inst || u; let c = IDLE_CLOCK.get(who);
  if (!c || t - c.last > 0.3 || t < c.since) { c = { since: t, last: t }; IDLE_CLOCK.set(who, c); }
  c.last = t;
  const still = t - c.since, seed = hash(id.length * 31 + id.charCodeAt(0), (who.uid || id).charCodeAt(1) || 7);
  const off = def.d + seed * (def.ev - def.d), cy = (still - 0.8 + off) % def.ev;
  const k = still > 0.8 && cy < def.d ? cy / def.d : -1;
  return { def, k, t, by: fr === 'idle1' ? 1 : 0, spr: HERO_BY_ID[id] && HERO_BY_ID[id].spr };
}

// Draw a standing champion with its idle pose applied; (x, y) is the feet, as in drawUnit.
function drawIdleUnit(g, img, x, y, fs, flip, I) {
  const { def, k, t } = I, p = def.pose ? def.pose(k, t) || {} : {}, s = fs / 20, dir = flip ? -1 : 1;
  const hx = p.hx || 0, hy = p.hy || 0, base = g.globalAlpha;
  g.save(); g.translate(x + Math.round((p.dx || 0) * s) * dir, y + 1 + Math.round((p.dy || 0) * s)); if (flip) g.scale(-1, 1);
  const P = idlePainter(g, s, I.by, hx, hy, base);
  if (def.back) { def.back(P, k, t); g.globalAlpha = base; }
  g.globalAlpha = base * (p.a != null ? p.a : 1);
  const w = Math.round(fs * (p.sx || 1)), h = Math.round(fs * (p.sy || 1));
  // starred legends have a padded frame (sprites.js STAR_PAD): L, T are the pad left of and above the 20x20 body
  // hi-detail frames (hdart.js) carry img.hd source pixels per grid pixel
  const D = img.hd || 1, IW = img.width / D, IH = img.height / D, pad = IW === STAR_PAD.w && IH === STAR_PAD.h, L = pad ? STAR_PAD.l : 0, T = pad ? STAR_PAD.t : 0;
  const pl = Math.round(L * w / 20), pt = Math.round(T * h / 20), fw = Math.round(IW * w / 20), fh = Math.round(IH * h / 20);
  if (hx || hy) { // the head (rows above cut, left of the weapon column hc) moves on its own
    const cut = p.cut || 11, hc = p.hc || 14, ch = Math.round(cut * h / 20), cw = Math.round(hc * w / 20);
    g.drawImage(img, 0, (T + cut) * D, IW * D, (IH - T - cut) * D, -w / 2 - pl, -h + ch, fw, fh - pt - ch);
    g.drawImage(img, (L + hc) * D, 0, (IW - L - hc) * D, (T + cut) * D, -w / 2 + cw, -h - pt, fw - pl - cw, pt + ch);
    g.drawImage(img, 0, 0, (L + hc) * D, (T + cut) * D, -w / 2 - pl + Math.round(hx * s), -h - pt + Math.round(hy * s), pl + cw, pt + ch); }
  else g.drawImage(img, -w / 2 - pl, -h - pt, fw, fh);
  P.fade = g.globalAlpha;
  if (def.front) { def.front(P, k, t); }
  g.restore();
}
// pixel helpers on the 20x20 grid: px moves with the body bob, ph with the head, pg stays on the ground
function idlePainter(g, s, by, hx, hy, base) {
  const P = { fade: base,
    raw(x, y, c, w, h, a) { if (a != null && a <= 0) return; g.globalAlpha = P.fade * (a == null ? 1 : a); g.fillStyle = c; g.fillRect(Math.round((x - 10) * s), Math.round((y - 20) * s), Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s))); },
    px(x, y, c, w = 1, h = 1, a) { P.raw(x, y + by, c, w, h, a); },
    ph(x, y, c, w = 1, h = 1, a) { P.raw(x + hx, y + by + hy, c, w, h, a); },
    pg(x, y, c, w = 1, h = 1, a) { P.raw(x, y, c, w, h, a); },
    at(sp) { return sp === 'h' ? P.ph : sp === 'g' ? P.pg : P.px; },
    solid() { P.fade = base; },
    star(x, y, c, r = 1, sp) { const f = P.at(sp); f(x, y, c); for (let i = 1; i <= r; i++) { f(x - i, y, c); f(x + i, y, c); f(x, y - i, c); f(x, y + i, c); } },
    art(name, x, y, c, sp, a) { const f = P.at(sp); IDLE_ART[name].forEach((row, r) => { for (let i = 0; i < row.length; i++) if (row[i] === '#') f(x + i, y + r, c, 1, 1, a); }); },
    disc(x, y, r, c, sp) { const f = P.at(sp), R = Math.ceil(r); for (let dy = -R; dy <= R; dy++) { const w = Math.round(Math.sqrt(Math.max(0, r * r - dy * dy))); if (w > 0 || Math.abs(dy) < r) f(x - w, y + dy, c, w * 2 + 1, 1); } },
    ring(x, y, r, c, a, sp) { const f = P.at(sp), n = Math.max(6, Math.round(r * 6)); for (let i = 0; i < n; i++) { const q = i / n * TAU; f(x + Math.cos(q) * r, y + Math.sin(q) * r, c, 1, 1, a); } },
    ell(x, y, rx, ry, c, a) { if (rx < 0.5) return; const n = Math.max(8, Math.round(rx * 3)); for (let i = 0; i < n; i++) { const q = i / n * TAU; P.pg(x + Math.cos(q) * rx, y + Math.sin(q) * ry, c, 1, 1, a); } },
  };
  return P;
}
