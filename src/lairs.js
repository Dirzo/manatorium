// ===== Boss lairs (Cam 2026-10-22) =====
// In boss talk (talk.js) the camera pans off the right edge of the battlefield into the boss's own home: a silly,
// run-down place that matches their story (Grubnose's leaky ditch, Mother Gloop's bog court, Vexmora's writing crypt...).
// Each lair is LAIR_W x H field pixels: build() paints it once, live() animates on top every frame.
// The boss stands at x = bx on the feet line (y 186) and a few of the horde hang around at camp[].
const LAIR_W = 260, LK = '#1a1230';
const FONT3 = { A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011',
  H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101',
  O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111',
  V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010', Z: '111001010100111', 0: '111101101101111', 1: '010110010010111',
  2: '110001010100111', 3: '110001010001110', 4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010', 8: '111101111101111',
  9: '111101111001110', ' ': '000000000000000', '!': '010010010000010', '?': '110001010000010', '.': '000000000000010', ',': '000000000010100', "'": '010010000000000',
  '-': '000000111000000', '/': '001001010100100', ':': '000010000010000', '*': '000101010101000', '(': '010100100100010', ')': '010001001001010', '>': '100010001010100' };
function lr(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function lbox(g, x, y, w, h, c) { lr(g, x, y, w, h, LK); lr(g, x + 1, y + 1, w - 2, h - 2, c); }
function lspeck(g, x, y, w, h, c, n, seed) { g.fillStyle = c; for (let i = 0; i < n; i++) g.fillRect(x + Math.floor(hash(i, seed) * w), y + Math.floor(hash(i, seed + 1) * h), 1, 1); }
function lell(g, cx, cy, rx, ry, c) { g.fillStyle = c; for (let y = -ry; y <= ry; y++) { const w = Math.round(rx * Math.sqrt(1 - (y / (ry + 0.5)) ** 2)); g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1); } }
function lellO(g, cx, cy, rx, ry, c) { lell(g, cx, cy, rx + 1, ry + 1, LK); lell(g, cx, cy, rx, ry, c); }
function ltextW(s) { return s.length * 4 - 1; }
function ltext(g, s, x, y, c) { g.fillStyle = c; [...s.toUpperCase()].forEach((ch, i) => { const f = FONT3[ch] || FONT3[' ']; for (let j = 0; j < 15; j++) if (f[j] === '1') g.fillRect(x + i * 4 + j % 3, y + Math.floor(j / 3), 1, 1); }); }
// a wooden sign on a post, text centred; returns its width
function lsign(g, x, y, s, board = '#c8945a', ink = '#3a2412', post = 14) {
  const w = ltextW(s) + 6; lr(g, x + Math.floor(w / 2) - 1, y + 8, 3, post, LK); lr(g, x + Math.floor(w / 2), y + 8, 1, post, '#7a4a22');
  lbox(g, x, y, w, 10, board); lr(g, x + 1, y + 8, w - 2, 1, shade(board, -0.2)); ltext(g, s, x + 3, y + 2, ink); return w;
}
function lsky(g, top, bot, h = 150) { for (let y = 0; y < h; y++) { const k = y / h; g.fillStyle = mix(top, bot, Math.round(k * 6) / 6); g.fillRect(0, y, LAIR_W, 1); } }
function lhills(g, y0, amp, c, seed) { g.fillStyle = c; for (let x = 0; x < LAIR_W; x++) { const y = y0 - Math.round((Math.sin(x * 0.03 + seed) + Math.sin(x * 0.071 + seed * 2)) * amp); g.fillRect(x, y, 1, 150 - y); } }
function lground(g, y0, c, c2, c3, seed) { lr(g, 0, y0, LAIR_W, H - y0, c); lr(g, 0, y0, LAIR_W, 2, shade(c, 0.12)); lspeck(g, 0, y0 + 2, LAIR_W, H - y0, c2, 380, seed); lspeck(g, 0, y0 + 2, LAIR_W, H - y0, c3, 200, seed + 7); }

const LAIRS = {
  grubnose: { name: 'The Ditch', bx: 140, camp: [[86, 178, 1.7], [196, 200, 1.9], [62, 196, 1.5]],
    build(g) {
      lsky(g, '#8a98aa', '#c4ccd4'); lhills(g, 132, 6, '#7a8a6e', 1); lhills(g, 142, 4, '#6a7a5a', 3);
      lground(g, 146, '#7a5a3a', '#5e4228', '#96704a', 11);
      // the ditch itself: a wet trench with puddles
      lr(g, 0, 178, LAIR_W, 24, '#4e3a26'); lr(g, 0, 178, LAIR_W, 2, '#3a2a1a'); lspeck(g, 0, 182, LAIR_W, 18, '#6a4e32', 120, 5);
      lellO(g, 56, 192, 22, 4, '#7a8ea0'); lellO(g, 196, 194, 26, 4, '#7a8ea0'); lr(g, 44, 190, 10, 1, '#c4d4e0'); lr(g, 186, 192, 12, 1, '#c4d4e0');
      // a lone window frame with curtains on a stick: "a window for the ditch"
      lbox(g, 22, 112, 28, 30, '#a07040'); lr(g, 25, 115, 22, 24, '#9fb8cc'); lr(g, 35, 113, 2, 28, '#a07040'); lr(g, 23, 126, 26, 2, '#a07040');
      lr(g, 18, 110, 36, 2, LK); lr(g, 20, 112, 6, 20, '#ff8fb0'); lr(g, 46, 112, 6, 20, '#ff8fb0'); lr(g, 35, 142, 2, 20, '#6a4a2a');
      // laundry line: one sock, one pair of royal underpants
      lr(g, 62, 96, 1, 52, '#6a4a2a'); lr(g, 120, 100, 1, 48, '#6a4a2a'); for (let x = 62; x < 120; x++) lr(g, x, 98 + Math.round(Math.sin((x - 62) / 58 * Math.PI) * 5), 1, 1, LK);
      lbox(g, 74, 102, 7, 9, '#e8e4ff'); lbox(g, 92, 103, 12, 7, '#ff3d6e'); lr(g, 96, 107, 4, 3, '#1a1230'); lbox(g, 108, 101, 5, 8, '#ffcf3a');
      // the bucket throne, with a hole in it
      lr(g, 196, 150, 34, 3, LK); for (let y = 0; y < 34; y++) { const w = 30 - Math.floor(y / 6); lr(g, 213 - w / 2 - 1, 152 + y, w + 2, 1, LK); lr(g, 213 - w / 2, 152 + y, w, 1, y % 9 === 4 ? '#7a8090' : '#a8aebb'); }
      lr(g, 200, 158, 4, 18, '#d0d6e0'); lellO(g, 221, 175, 2, 2, '#1a1230'); lr(g, 199, 146, 28, 2, '#7a8090'); lr(g, 212, 140, 2, 8, '#7a8090');
      // the rent: a pile of rocks
      for (let i = 0; i < 9; i++) lellO(g, 236 + (i % 4) * 5 - (i > 3 ? 3 : 0) - (i > 7 ? 2 : 0), 170 - Math.floor(i / 4) * 4, 3, 2, i % 2 ? '#9a9aa8' : '#7a7a88');
      lsign(g, 226, 140, 'RENT'); lsign(g, 6, 152, 'THE DITCH', '#c8945a', '#3a2412', 12);
      // the drizzle cloud that only rains on Grubnose
      for (const [x, y, r] of [[60, 26, 14], [84, 20, 18], [112, 24, 16], [140, 18, 20], [170, 24, 16], [196, 22, 18], [222, 28, 14]]) lell(g, x, y, r, r * 0.55, '#6a7280');
      lr(g, 40, 30, 200, 6, '#6a7280'); lr(g, 44, 36, 192, 2, '#5a6270');
    },
    live(g, t) {
      g.fillStyle = '#c4d4e8'; for (let i = 0; i < 46; i++) { const x = 44 + hash(i, 3) * 190, y = 38 + ((t * 120 + hash(i, 4) * 400) % 150); g.fillRect(Math.round(x), Math.round(y), 1, 3); }
      const d = (t * 1.4) % 1; lr(g, 221, 177 + d * 12, 1, 2, '#9fc8ff'); if (d > 0.9) lr(g, 218, 189, 6, 1, '#c4d4e0');
      for (const [x, y] of [[56, 192], [196, 194]]) { const r = Math.floor((t * 6 + x) % 10); if (r < 8) { g.fillStyle = '#c4d4e0'; g.fillRect(x - r, y, 1, 1); g.fillRect(x + r, y, 1, 1); } }
    } },
  gloop: { name: 'Bog Court', bx: 150, camp: [[90, 182, 1.6], [208, 176, 1.5], [236, 194, 1.8]],
    build(g) {
      lsky(g, '#8aa88a', '#cad8b0'); lhills(g, 136, 5, '#6a7a5a', 2);
      for (const x of [30, 70, 210, 244]) { lr(g, x, 96, 3, 50, '#4a4a3a'); lr(g, x - 6, 108, 8, 2, '#4a4a3a'); lr(g, x + 2, 118, 9, 2, '#4a4a3a'); }
      lground(g, 146, '#4a5a32', '#3a4a26', '#5e6e3a', 21);
      lellO(g, 120, 192, 110, 22, '#4e7a5a'); lell(g, 120, 188, 100, 14, '#5a8a66'); lspeck(g, 20, 176, 200, 30, '#6aa078', 60, 9);
      for (const [x, y] of [[44, 186], [176, 198], [206, 184], [86, 204]]) { lellO(g, x, y, 6, 2, '#4aa04a'); lr(g, x, y - 2, 1, 2, '#4e7a5a'); }
      for (let i = 0; i < 18; i++) { const x = 6 + i * 14 + Math.floor(hash(i, 2) * 6); if (x > 60 && x < 200) continue; lr(g, x, 150 + hash(i, 5) * 8, 1, 26, '#6a8a3a'); lr(g, x - 1, 150 + hash(i, 5) * 8, 3, 6, '#7a4a2a'); }
      // jars on a plank: the slimelets in custody
      lbox(g, 6, 160, 64, 4, '#8a6a3a'); lr(g, 10, 164, 2, 12, '#6a4a2a'); lr(g, 62, 164, 2, 12, '#6a4a2a');
      for (let i = 0; i < 4; i++) { const x = 9 + i * 15; lbox(g, x, 146, 12, 14, '#cfeeff'); lr(g, x + 2, 152, 8, 7, '#5ad84a'); lr(g, x + 4, 154, 1, 2, LK); lr(g, x + 7, 154, 1, 2, LK); lr(g, x, 144, 12, 2, '#8a6a3a'); }
      // the court: a stump bench, a stack of lawsuits, a gavel
      lbox(g, 206, 150, 34, 30, '#7a5a3a'); lr(g, 206, 150, 34, 4, '#a07a4a'); lspeck(g, 208, 156, 30, 22, '#5a4026', 30, 3);
      for (let i = 0; i < 6; i++) { lbox(g, 210 + (i % 2), 140 - i * 3, 22, 4, '#fbfbf2'); lr(g, 213, 141 - i * 3, 14, 1, '#9a9aa8'); }
      lr(g, 226, 128, 12, 5, '#8a5a2a'); lr(g, 231, 133, 2, 7, '#6a4a2a');
      lsign(g, 82, 134, 'BOG COURT', '#9ab070', '#203018'); lsign(g, 160, 128, 'NO POPPING', '#e8e0c8', '#a01830', 18);
    },
    live(g, t) {
      for (let i = 0; i < 7; i++) { const p = (t * 0.5 + hash(i, 6)) % 1, x = 40 + hash(i, 7) * 160, y = 200 - p * 20; if (p < 0.85) lellO(g, x, y, 1 + p * 2, 1 + p * 2, '#8ac89a'); else { g.fillStyle = '#cfeedf'; g.fillRect(x - 3, y, 1, 1); g.fillRect(x + 3, y, 1, 1); g.fillRect(x, y - 3, 1, 1); } }
      g.fillStyle = LK; for (let i = 0; i < 6; i++) { const a = t * (3 + i) + i; g.fillRect(Math.round(224 + Math.cos(a) * (8 + i)), Math.round(126 + Math.sin(a * 1.3) * 5), 1, 1); }
      g.fillStyle = 'rgba(120,180,80,.55)'; for (let k = 0; k < 3; k++) for (let y = 0; y < 14; y++) g.fillRect(Math.round(110 + k * 18 + Math.sin(t * 3 + y * 0.6 + k) * 2), 168 - y - Math.floor((t * 8) % 4), 1, 1);
    } },
  wyrm: { name: 'The Writing Crypt', bx: 150, camp: [[80, 182, 1.7], [212, 194, 1.7], [240, 174, 1.6]],
    build(g) {
      lr(g, 0, 0, LAIR_W, 150, '#2e2640'); lspeck(g, 0, 0, LAIR_W, 150, '#3a3050', 500, 31); lspeck(g, 0, 0, LAIR_W, 150, '#241e34', 300, 37);
      for (const x of [20, 110, 200]) { lr(g, x, 40, 60, 110, '#3e3456'); lell(g, x + 30, 40, 30, 20, '#3e3456'); lr(g, x + 6, 48, 48, 102, '#1e1830'); lell(g, x + 30, 48, 24, 14, '#1e1830'); }
      lr(g, 0, 0, LAIR_W, 8, '#1a1428');
      // the banner: Scales of Woe
      lr(g, 92, 20, 76, 2, '#6a4a2a'); lbox(g, 96, 22, 68, 30, '#6a3a9a'); lr(g, 96, 52, 68, 4, LK); for (let i = 0; i < 6; i++) lr(g, 98 + i * 11, 52, 8, 3, '#6a3a9a');
      ltext(g, 'SCALES', 118, 28, '#ffcf3a'); ltext(g, 'OF WOE', 118, 38, '#ffcf3a');
      lground(g, 146, '#5e5668', '#4a4456', '#7a7286', 41); lspeck(g, 0, 150, LAIR_W, 120, '#d8d0c0', 40, 43);
      // crumpled drafts everywhere
      for (let i = 0; i < 26; i++) { const x = 14 + hash(i, 8) * 70 + (i > 18 ? 120 : 0), y = 184 - hash(i, 9) * (i > 18 ? 4 : 18) + (i > 18 ? 6 : 0); lellO(g, x, y, 3, 2, i % 3 ? '#efe8d8' : '#d0c8b8'); lr(g, x - 1, y - 1, 1, 1, '#a8a090'); }
      // the desk: a tombstone slab with the manuscript, ink and a quill
      lbox(g, 196, 150, 50, 8, '#8a8298'); lbox(g, 200, 158, 8, 28, '#7a7288'); lbox(g, 234, 158, 8, 28, '#7a7288');
      for (let i = 0; i < 5; i++) lbox(g, 206, 145 - i * 3, 20, 4, '#f4ecd8'); lbox(g, 230, 142, 7, 8, '#1a1230'); lr(g, 233, 128, 1, 14, '#e8e4ff'); lr(g, 234, 126, 2, 8, '#ffffff');
      lbox(g, 30, 142, 26, 24, '#8a8298'); lell(g, 43, 142, 13, 6, '#8a8298'); ltext(g, 'CH 3', 36, 146, '#3a3248'); ltext(g, 'DRAFT', 34, 153, '#3a3248'); ltext(g, '41', 39, 160, '#3a3248');
      for (const [x, y] of [[198, 148], [244, 148], [18, 184], [100, 186]]) lbox(g, x - 1, y - 8, 3, 8, '#f1e6c8');
    },
    live(g, t) {
      for (const [x, y] of [[198, 148], [244, 148], [18, 184], [100, 186]]) { const f = Math.floor(t * 10 + x) % 3; lr(g, x - 1, y - 12 + (f === 1 ? 1 : 0), 3, 4, '#ff9a3a'); lr(g, x, y - 11, 1, 2, '#ffe680'); g.fillStyle = 'rgba(255,170,80,.12)'; g.fillRect(x - 8, y - 18, 17, 14); }
      const p = (t * 0.35) % 1; if (p < 0.5) { const q = p / 0.5, x = 214 - q * 150, y = 140 - Math.sin(q * Math.PI) * 50 + q * 40; lellO(g, x, y, 2, 2, '#efe8d8'); }
      g.fillStyle = '#ff8a3a'; for (let i = 0; i < 8; i++) { const q = (t * 0.3 + hash(i, 4)) % 1; g.fillRect(Math.round(20 + hash(i, 5) * 220 + Math.sin(t + i) * 4), Math.round(180 - q * 170), 1, 1); }
    } },
  ringmaster: { name: 'The Carnival Lot', bx: 136, camp: [[76, 180, 1.6], [196, 190, 1.7], [228, 176, 1.5]],
    build(g) {
      lsky(g, '#ff9a8a', '#ffd6a8'); lhills(g, 138, 5, '#d07a7a', 4);
      lground(g, 146, '#b08060', '#9a6a4a', '#fff4c8', 51);
      // the saggy big top, patched, with a hole
      const tx = 150, tw = 104; for (let y = 0; y < 70; y++) { const sag = Math.round(Math.sin(y / 70 * Math.PI) * 3), w = 20 + y * 1.2; for (let s = 0; s < w; s++) { const x = tx + 50 - w / 2 + s; g.fillStyle = Math.floor(s / (w / 8)) % 2 ? '#fff0d8' : '#e83a4a'; g.fillRect(Math.round(x), 78 + y + (s > w * 0.3 && s < w * 0.7 ? sag : 0), 1, 1); } }
      lr(g, tx + 6, 148, 88, 2, LK); lr(g, tx + 50, 64, 2, 16, '#6a4a2a'); lr(g, tx + 52, 64, 8, 5, '#ffcf3a');
      lbox(g, tx + 40, 118, 22, 30, '#2a1020'); lbox(g, tx + 14, 100, 10, 8, '#7ab0e8'); lbox(g, tx + 70, 112, 9, 9, '#8ad05a'); lellO(g, tx + 76, 94, 5, 4, '#1a0a10');
      // bunting rope, half fallen
      for (let x = 20; x < 150; x++) { const y = 70 + Math.round(((x - 20) / 130) * 50 + Math.sin((x - 20) / 130 * Math.PI) * 12); lr(g, x, y, 1, 1, LK); if (x % 9 === 0) { lr(g, x, y + 1, 5, 2, ['#ffcf3a', '#5fd3ff', '#ff3d6e'][x % 3]); lr(g, x + 1, y + 3, 3, 2, ['#ffcf3a', '#5fd3ff', '#ff3d6e'][x % 3]); } }
      lr(g, 18, 66, 3, 84, '#6a4a2a'); for (let i = 0; i < 5; i++) lr(g, 30 + i * 8, 178 + (i % 2) * 6, 5, 2, ['#ffcf3a', '#5fd3ff', '#ff3d6e'][i % 3]);
      // the guestbook on a podium, on fire (it might be part of the show)
      lbox(g, 36, 152, 16, 26, '#7a3a5a'); lbox(g, 32, 146, 24, 7, '#fbf6e8'); lr(g, 43, 147, 1, 5, '#9a9aa8');
      lsign(g, 40, 102, '5 STARS PLS', '#ffe680', '#a01830', 40); lsign(g, 224, 150, 'HELP', '#fbfbf2', '#3a3aaa', 10);
      lbox(g, 94, 168, 10, 16, '#e8e4ff'); lell(g, 99, 166, 5, 4, '#ff3d6e'); lr(g, 96, 184, 6, 2, LK);
    },
    live(g, t) {
      const fire = (x, y, n) => { for (let i = 0; i < n; i++) { const h = 3 + ((Math.floor(t * 12) + i * 3) % 5); lr(g, x + i, y - h, 1, h, i % 2 ? '#ff8a3a' : '#ffcf3a'); } lr(g, x + 1, y - 2, n - 2, 2, '#ff3d3d'); };
      fire(221, 96, 9); fire(34, 146, 20);
      const p = (t * 0.22) % 1, bx = 120 + Math.sin(t * 2) * 6, by = 160 - p * 160; lellO(g, bx, by, 4, 5, '#5fd3ff'); lr(g, bx, by + 6, 1, 8, LK); if (p > 0.3) fire(bx - 2, by - 4, 5);
      g.fillStyle = '#ffcf3a'; for (let i = 0; i < 3; i++) { const a = t * 6 + i * 2.1; g.fillRect(Math.round(212 + Math.cos(a) * 6), Math.round(146 - Math.abs(Math.sin(a)) * 12), 2, 2); }
    } },
  sporebaron: { name: 'Compost Manor', bx: 140, camp: [[78, 182, 1.6], [206, 194, 1.7], [232, 176, 1.5]],
    build(g) {
      lsky(g, '#b89ad8', '#e8d6e0'); lhills(g, 136, 5, '#8a7aa0', 5);
      lground(g, 146, '#4a3a2a', '#3a2a1e', '#7a5a2a', 61); lspeck(g, 0, 150, LAIR_W, 120, '#a07a3a', 140, 63);
      // the manor: a hollow rotting stump with a door, a window and a top-hat chimney
      lbox(g, 172, 92, 76, 94, '#7a5a3a'); for (let x = 176; x < 246; x += 6) lr(g, x, 94, 1, 90, '#6a4a2e');
      lell(g, 210, 92, 38, 8, '#a07a4a'); lr(g, 174, 92, 72, 1, LK); for (let i = 0; i < 6; i++) lell(g, 180 + hash(i, 3) * 60, 110 + hash(i, 4) * 60, 5, 3, '#6aa04a');
      lbox(g, 200, 150, 16, 36, '#3a2418'); lr(g, 212, 168, 2, 2, '#ffcf3a'); lbox(g, 222, 112, 14, 12, '#ffe8a0'); lr(g, 228, 112, 1, 12, LK); lr(g, 222, 118, 14, 1, LK);
      lbox(g, 182, 66, 14, 22, '#1a1230'); lbox(g, 178, 86, 22, 4, '#1a1230'); lr(g, 182, 80, 14, 3, '#a03a5a');
      const shroom = (x, y, s, c) => { lr(g, x - 1, y - s * 2, 3, s * 2, '#f4ecd8'); lellO(g, x, y - s * 2, s * 2, s, c); lr(g, x - s, y - s * 2 - 1, 1, 1, '#ffffff'); };
      [[20, 186, 2, '#e83a4a'], [34, 182, 3, '#c8a8e8'], [110, 190, 2, '#e8a03a'], [250, 190, 3, '#e83a4a'], [160, 184, 2, '#c8a8e8'], [60, 200, 2, '#e8a03a']].forEach(a => shroom(...a));
      for (let i = 0; i < 12; i++) { const x = 36 + (i % 5) * 6 + (i > 4 ? 3 : 0) + (i > 8 ? 3 : 0), y = 172 - Math.floor(i / 5) * 5; lellO(g, x, y, 2, 3, '#8a5a2a'); lr(g, x - 1, y - 1, 1, 1, '#b07a3a'); }
      lsign(g, 30, 150, '41', '#c8945a', '#3a2412', 8); lsign(g, 180, 134, 'MANOR (DAMP)', '#a8c070', '#203018', 0);
    },
    live(g, t) {
      for (let i = 0; i < 18; i++) { const q = (t * 0.12 + hash(i, 9)) % 1; g.fillStyle = i % 2 ? 'rgba(220,200,255,.8)' : 'rgba(200,240,160,.7)'; g.fillRect(Math.round(10 + hash(i, 8) * 240 + Math.sin(t * 1.5 + i) * 5), Math.round(200 - q * 180), 1, 1); }
      for (let i = 0; i < 3; i++) { const q = (t * 0.4 + i / 3) % 1; lell(g, 189 + Math.sin(t + i) * 3 + q * 8, 62 - q * 40, 3 + q * 4, 2 + q * 3, `rgba(150,200,110,${0.6 - q * 0.6})`); }
    } },
  matriarch: { name: 'HOA Headquarters', bx: 140, camp: [[80, 180, 1.6], [208, 194, 1.8], [236, 176, 1.5]],
    build(g) {
      lsky(g, '#a8d0f8', '#eef8ff'); lhills(g, 120, 12, '#e4eefc', 6); lhills(g, 138, 6, '#c8daf0', 7);
      lground(g, 146, '#eef4ff', '#c8d8f0', '#ffffff', 71);
      // the igloo office
      for (let r = 0; r < 34; r++) { const w = Math.round(Math.sqrt(34 * 34 - r * r)); lr(g, 214 - w - 1, 186 - r - 1, w * 2 + 2, 1, LK); lr(g, 214 - w, 186 - r, w * 2, 1, r % 6 === 0 ? '#c8d8f0' : '#f4f8ff'); }
      lbox(g, 200, 166, 18, 20, '#4a5a7a'); lr(g, 202, 168, 14, 18, '#2a3450'); lsign(g, 196, 128, 'HOA', '#5fd3ff', '#102040', 8);
      // filing cabinets half buried, a desk of forms, a snowman with a clipboard
      for (let i = 0; i < 3; i++) { lbox(g, 12 + i * 15, 150 + i * 4, 13, 26 - i * 4, '#8a94b8'); for (let d = 0; d < 3 - i; d++) lr(g, 16 + i * 15, 156 + i * 4 + d * 7, 5, 1, LK); }
      lr(g, 8, 172, 54, 6, '#eef4ff'); lbox(g, 92, 160, 30, 5, '#8a6a4a'); lr(g, 94, 165, 2, 18, '#6a4a2a'); lr(g, 118, 165, 2, 18, '#6a4a2a');
      for (let i = 0; i < 4; i++) lbox(g, 96 + (i % 2), 156 - i * 3, 12, 4, '#fbfbf2'); lbox(g, 110, 154, 10, 6, '#ffe8a0');
      lellO(g, 70, 180, 9, 8, '#ffffff'); lellO(g, 70, 166, 6, 6, '#ffffff'); lr(g, 68, 164, 1, 1, LK); lr(g, 72, 164, 1, 1, LK); lr(g, 70, 166, 3, 1, '#ff8a3a'); lbox(g, 76, 168, 7, 9, '#a07040'); lr(g, 78, 170, 3, 1, LK);
      lsign(g, 60, 126, 'NO PINK', '#ffe8f0', '#c01850', 22); lsign(g, 6, 110, 'VIOLATION', '#fff0a0', '#a01830', 30);
    },
    live(g, t) {
      g.fillStyle = '#ffffff'; for (let i = 0; i < 60; i++) { const q = (t * 0.18 + hash(i, 2)) % 1; g.fillRect(Math.round((hash(i, 3) * LAIR_W + Math.sin(t + i) * 6 + LAIR_W) % LAIR_W), Math.round(q * 200), 1, 1); }
      const q = (t * 0.25) % 1, x = 104 + q * 140, y = 150 - Math.sin(q * 9) * 6 - q * 60; lbox(g, x, y, 6, 4 + Math.round(Math.sin(t * 9)), '#fbfbf2');
    } },
  trashpaw: { name: 'Home Sweet Bin', bx: 138, camp: [[78, 182, 1.6], [204, 196, 1.7], [240, 178, 1.5]],
    build(g) {
      lsky(g, '#1e2440', '#3a4670', 70); lspeck(g, 0, 0, LAIR_W, 60, '#ffffff', 30, 81); lellO(g, 40, 22, 9, 9, '#fff4c8'); lell(g, 44, 20, 7, 7, '#1e2440');
      lr(g, 0, 60, LAIR_W, 90, '#5a4458'); for (let y = 60; y < 150; y += 6) for (let x = (y / 6) % 2 ? 0 : 6; x < LAIR_W; x += 12) lr(g, x, y, 11, 5, '#6a5068');
      lbox(g, 100, 80, 26, 22, '#ffd27a'); lr(g, 112, 80, 2, 22, LK); lr(g, 100, 90, 26, 2, LK);
      lground(g, 146, '#3a3a44', '#2e2e36', '#4a4a56', 91); lellO(g, 60, 196, 18, 3, '#4a5a7a');
      // the dumpster, lid propped open, a family inside
      lbox(g, 166, 140, 80, 46, '#3a7a4a'); lr(g, 168, 142, 76, 3, '#4a9a5a'); for (let x = 176; x < 240; x += 16) lr(g, x, 146, 2, 38, '#2e6a3e'); lr(g, 168, 140, 76, 2, '#1a2a1a');
      for (let i = 0; i <= 80; i++) { lr(g, 166 + i, 112 - i * 0.3 - 1, 1, 6, LK); lr(g, 166 + i, 112 - i * 0.3, 1, 4, '#4a9a5a'); } lr(g, 167, 112, 3, 30, '#6a6a6a');
      lr(g, 170, 132, 72, 10, '#1a1420');
      lbox(g, 222, 78, 18, 9, '#9a9aa8'); lr(g, 239, 81, 2, 2, '#ff9ab0'); lr(g, 234, 80, 1, 1, LK); for (let i = 0; i < 10; i++) lr(g, 222 - i, 84 + Math.round(Math.sin(i / 2) * 2), 1, 1, '#ff9ab0');
      for (const [x, y, r] of [[30, 180, 9], [46, 176, 7], [252, 182, 8]]) { lellO(g, x, y, r, r - 2, '#2a2a30'); lr(g, x - 1, y - r + 1, 3, 2, '#6a6a7a'); }
      lbox(g, 84, 168, 22, 14, '#a07040'); lbox(g, 86, 162, 18, 7, '#c8c8d0'); lr(g, 88, 163, 14, 4, '#e8603a'); lr(g, 90, 163, 3, 1, '#ffcf3a');
      lsign(g, 12, 96, 'HOME SWEET BIN', '#ffe680', '#5a2a1a', 0);
    },
    live(g, t) {
      for (let i = 0; i < 7; i++) { const blink = Math.floor(t * 2 + hash(i, 5) * 8) % 7 === 0; if (blink) continue; const x = 174 + i * 10, y = 135 + (i % 2) * 3; lr(g, x, y, 1, 1, '#ffe680'); lr(g, x + 3, y, 1, 1, '#ffe680'); }
      g.fillStyle = LK; for (let i = 0; i < 5; i++) { const a = t * (4 + i) + i * 2; g.fillRect(Math.round(94 + Math.cos(a) * (6 + i)), Math.round(154 + Math.sin(a * 1.4) * 4), 1, 1); }
      lr(g, 234, 80 - (Math.floor(t * 1.5) % 4 === 0 ? 1 : 0), 1, 1, LK);
    } },
  colossus: { name: 'The Scrapyard', bx: 140, camp: [[78, 182, 1.6], [206, 196, 1.7], [236, 176, 1.5]],
    build(g) {
      lsky(g, '#ffb86a', '#fff0d0'); lhills(g, 134, 6, '#d09a5a', 8);
      lground(g, 146, '#a08050', '#8a6a3a', '#c86a3a', 101);
      // scrap mountains: plates, pipes and gears
      for (const [cx, w, h] of [[34, 40, 46], [96, 30, 30], [240, 34, 52]]) { for (let y = 0; y < h; y++) { const ww = Math.round(w * (1 - y / h)); lr(g, cx - ww - 1, 146 - y, ww * 2 + 2, 1, LK); lr(g, cx - ww, 146 - y, ww * 2, 1, (y + cx) % 7 < 3 ? '#c8a040' : '#a87a30'); } lspeck(g, cx - w, 146 - h, w * 2, h, '#7a5a2a', 40, cx); }
      // the workshop shed
      lbox(g, 176, 104, 50, 82, '#8a7060'); lr(g, 172, 100, 58, 6, LK); lr(g, 174, 101, 54, 4, '#a06040'); lbox(g, 190, 140, 22, 46, '#4a3a30'); for (let y = 108; y < 186; y += 8) lr(g, 178, y, 46, 1, '#7a6050');
      lsign(g, 172, 112, 'WARRANTY VOID', '#fff0a0', '#a01830', 0);
      for (let i = 0; i < 4; i++) { const x = 30 + i * 13, y = 182 - (i % 2) * 2; if (i === 2) { lbox(g, x, y - 6, 12, 7, '#7a8a9a'); lr(g, x + 11, y - 4, 3, 2, '#5a6a7a'); } else { lbox(g, x, y - 12, 9, 12, '#7a8a9a'); lr(g, x + 2, y - 15, 3, 3, '#5a6a7a'); } }
      lsign(g, 34, 150, 'OIL?', '#e8e4ff', '#1a1230', 12); lr(g, 228, 150, 3, 36, '#6a6a7a'); lr(g, 228, 150, 16, 3, '#6a6a7a');
    },
    live(g, t) {
      const cx = 100, cy = 128, R = 9; for (let i = 0; i < 8; i++) { const a = t * 1.2 + i * Math.PI / 4; lr(g, cx + Math.cos(a) * (R + 2) - 1, cy + Math.sin(a) * (R + 2) - 1, 3, 3, LK); }
      lellO(g, cx, cy, R, R, '#c8a040'); lellO(g, cx, cy, 3, 3, '#7a5a2a');
      for (let i = 0; i < 4; i++) { const q = (t * 0.6 + i / 4) % 1; lell(g, 243 + q * 6, 146 - q * 40, 2 + q * 5, 2 + q * 4, `rgba(255,255,255,${0.7 - q * 0.7})`); }
      if (Math.floor(t * 3) % 5 === 0) { g.fillStyle = '#ffe680'; for (let i = 0; i < 5; i++) g.fillRect(Math.round(200 + hash(i, Math.floor(t * 9)) * 12), Math.round(178 - hash(i, 4) * 10), 1, 1); }
    } },
  pinchbeard: { name: 'Port Pinchbeard', bx: 150, camp: [[74, 184, 1.6], [196, 200, 1.7], [112, 198, 1.5]],
    build(g) {
      lsky(g, '#5ac8ff', '#e8fbff', 118); lr(g, 0, 118, LAIR_W, 32, '#3a9ad0'); for (let y = 122; y < 150; y += 5) lr(g, (y * 7) % 30, y, LAIR_W, 1, '#6ab8e8');
      lground(g, 146, '#f0d89a', '#d8bc7a', '#fff0c0', 111);
      // the "international waters": a big puddle with a very small listing ship
      lellO(g, 226, 188, 40, 16, '#3a9ad0'); lell(g, 226, 186, 34, 10, '#5ab0e0');
      g.save(); g.translate(228, 176); g.rotate(-0.14); lbox(g, -28, -8, 56, 14, '#8a5a2a'); lr(g, -26, -6, 52, 2, '#a87a4a'); lr(g, -1, -54, 3, 48, '#6a4a2a');
      lbox(g, -18, -48, 34, 24, '#efe8d8'); lbox(g, -4, -40, 9, 8, '#d8c8a8'); lr(g, 4, -34, 6, 6, '#c8b090'); g.restore();
      lbox(g, 222, 196, 8, 3, '#8a5a2a');
      // the toll booth and the imported sand
      lbox(g, 14, 140, 30, 30, '#d86a4a'); lr(g, 12, 136, 34, 5, LK); lr(g, 14, 137, 30, 3, '#ffcf3a'); lbox(g, 20, 148, 18, 10, '#9fd8ff');
      lsign(g, 48, 126, 'TOLL 3G/CLAW', '#fff4c8', '#a01830', 22); lbox(g, 120, 176, 14, 12, '#9aa0aa'); lr(g, 121, 175, 12, 3, '#f0d89a'); lsign(g, 108, 152, 'FINE SAND', '#efe8d8', '#1a1230', 14);
    },
    live(g, t) {
      for (let i = 0; i < 4; i++) { const q = (t * 0.6 + i / 4) % 1; lr(g, 196 + i * 12 + q * 8, 184 + (i % 2) * 6, 6, 1, `rgba(255,255,255,${0.8 - q * 0.8})`); }
      g.save(); g.translate(230, 122 + Math.sin(t * 1.6)); g.rotate(-0.14); for (let i = 0; i < 12; i++) lr(g, i, -2 + Math.sin(t * 7 - i * 0.7) * (i / 6), 1, 6, i < 2 ? LK : '#1a1230'); lr(g, 5, 0, 3, 2, '#ffffff'); g.restore();
      g.fillStyle = '#ffffff'; for (let i = 0; i < 2; i++) { const x = (t * 18 + i * 120) % (LAIR_W + 40) - 20, y = 40 + i * 20 + Math.sin(t * 3 + i) * 4, f = Math.floor(t * 6 + i) % 2; g.fillRect(Math.round(x), Math.round(y), 2, 1); g.fillRect(Math.round(x + 2), Math.round(y - f), 2, 1); g.fillRect(Math.round(x - 2), Math.round(y - f), 2, 1); }
    } },
  goosegod: { name: 'The Nest', bx: 140, camp: [[80, 180, 1.6], [236, 198, 1.7], [104, 198, 1.5]],
    build(g) {
      lsky(g, '#ffc88a', '#fff8e8'); for (let i = 0; i < 7; i++) { g.fillStyle = 'rgba(255,240,180,.35)'; g.beginPath(); g.moveTo(200, -10); g.lineTo(140 + i * 26, 150); g.lineTo(152 + i * 26, 150); g.fill(); }
      lhills(g, 134, 6, '#e0c080', 9); lground(g, 146, '#c8b070', '#a8904a', '#e8d090', 121);
      // the manifesto, thirty feet long
      lbox(g, 10, 176, 98, 12, '#fbf2d8'); lr(g, 8, 174, 4, 16, '#c8a870'); lr(g, 106, 174, 4, 16, '#c8a870'); ltext(g, 'HONK HONK HONK', 18, 180, '#5a3a1a');
      // the nest: woven from stolen banners and capes, full of bread
      const NC = ['#e83a4a', '#3a6ae0', '#a98aff', '#ffcf3a', '#9a6332', '#5ee07a'];
      lell(g, 206, 168, 58, 22, LK); for (let y = -21; y <= 21; y++) { const w = Math.round(57 * Math.sqrt(1 - (y / 22.5) ** 2)); for (let x = -w; x <= w; x++) lr(g, 206 + x, 168 + y, 1, 1, NC[Math.floor((x + y * 2 + 300) / 6) % 6]); }
      lell(g, 206, 160, 46, 9, '#5a3a1a'); for (let i = 0; i < 6; i++) { lellO(g, 172 + i * 13, 158 + (i % 2), 6, 3, '#e8a84a'); lr(g, 170 + i * 13, 156 + (i % 2), 4, 1, '#ffd88a'); }
      for (let i = 0; i < 40; i++) lr(g, 152 + hash(i, 7) * 108, 150 + hash(i, 8) * 38, 4, 1, NC[i % 6]);
      for (const [x, c] of [[134, '#3a6ae0'], [250, '#e83a4a']]) { lr(g, x, 120, 2, 50, '#6a4a2a'); lbox(g, x + 2, 120, 14, 18, c); lr(g, x + 6, 126, 6, 6, '#ffffff'); }
      lsign(g, 40, 140, 'HONK', '#ffffff', '#ff8a1a', 22);
    },
    live(g, t) {
      for (let i = 0; i < 10; i++) { const q = (t * 0.1 + hash(i, 3)) % 1, x = hash(i, 4) * LAIR_W + Math.sin(t * 2 + i) * 8, y = q * 190; g.fillStyle = '#ffffff'; g.fillRect(Math.round(x), Math.round(y), 3, 1); g.fillRect(Math.round(x + 1), Math.round(y + 1), 1, 1); }
      g.fillStyle = '#e8a84a'; for (let i = 0; i < 4; i++) g.fillRect(Math.round(120 + i * 9 + hash(i, 6) * 4), 190 - (Math.floor(t * 3 + i) % 3 === 0 ? 1 : 0), 1, 1);
    } },
};
const LAIR_CACHE = {};
// the lair painted once onto its own canvas; the first 28 columns dither away so it melts into the battlefield's edge
function lairCanvas(id) {
  if (LAIR_CACHE[id]) return LAIR_CACHE[id];
  const L = LAIRS[id]; if (!L) return null;
  const c = document.createElement('canvas'); c.width = LAIR_W; c.height = H; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  L.build(g);
  for (let x = 0; x < 28; x++) for (let y = 0; y < H; y++) if (hash(x * 7 + (y >> 1), y) > x / 28) g.clearRect(x, y, 1, 1);
  return (LAIR_CACHE[id] = c);
}
