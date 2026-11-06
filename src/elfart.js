// ===== Elves (Cam 2026-11-06: "lets redesign elves to be unique in this same manner" as the orcs)
// An elf legend carries an `elf` look in its sprite spec. genHumanoid (sprites.js) calls these hooks while it builds the
// 20x20 body, and hdart.js calls hdElfFace after the temper face. Every elf gets long tapered ears, a slim pointed chin and
// upswept lashes; the rest (build, hair, headpiece, gear, face marks) is their own.
// An elf keeps their own hair through an element swap, and the colours they are known by (leaf, bark, trim, accent) are
// never swapped by an element either, so two elves of the same element still read as two different elves.
// The face is never covered: hair, headpieces and marks stay off the eyes and mouth.
//
// e.build : 'lithe' (slim waist, tunic tail), 'robe' (long robe to the feet), 'gown' (flared leaf skirt), 'ranger' (tunic)
// e.ears  : 'long' (swept back), 'tall' (up like a hare), 'droop' (long, pointing back and down)
// e.hairdo: 'shag', 'braid' (one long braid), 'tail' (high ponytail), 'flow' (to the knees), 'float' (streams back), 'bob'
// e.top   : 'leafcowl', 'circlet' (leaves), 'branches' (twig antlers with blossoms), 'crescent' (moon), 'sunburst', 'rose', 'pin'
// e.gear  : 'quiver', 'leafmantle', 'scarf', 'vines', 'sash', 'stars', 'straps', 'flowers', 'mantle' (feathers), 'bracer', 'cuffs', 'rings'
// e.face  : 'freckles', 'stars', 'tattoo' (pale cheek chevron), 'gild' (marks stay on the cheeks, never on the eyes or mouth)

function elfPal(s) {
  const e = s.elf;
  return { leaf: e.leaf || '#4f9a3a', bark: e.bark || '#7a5230', trim: e.trim || '#dfe6f5', accent: e.accent || '#ff9fd0', leather: e.leather || '#7a4e2a' };
}
const elfHas = (s, k) => s.elf && s.elf.gear && s.elf.gear.includes(k);

// behind the body: long hair, quivers
function elfBack(g, s, by) {
  const e = s.elf, P = elfPal(s), h = s.hair, hl = shade(h, 0.25), hd = shade(h, -0.25);
  if (e.hairdo === 'flow') { // hair poured down the back to the knees, with a wavy edge
    g.rect(3, 6 + by, 6, 15 + by, h); g.rect(4, 16, 6, 16, h); g.set(3, 16, h); g.set(2, 9 + by, h); g.set(2, 13 + by, h);
    for (const y of [8, 11, 14]) g.set(4, y + by, hl, true);
    for (const y of [10, 13]) g.set(3, y + by, hd, true);
    if (elfHas(s, 'flowers')) { g.set(3, 8 + by, P.accent, true); g.set(5, 12 + by, P.accent, true); g.set(3, 15 + by, '#ffffff', true); g.set(4, 10 + by, P.leaf, true); }
  }
  if (e.hairdo === 'mane') { // shoulder-length hair that stops above the wings
    g.rect(4, 5 + by, 6, 11 + by, h); g.set(4, 12 + by, h); g.set(5, 9 + by, hl, true); g.set(4, 10 + by, hd, true);
  }
  if (e.hairdo === 'float') { // hair that streams back and up as if in a night wind, with starlit tips
    g.rect(2, 3 + by, 5, 10 + by, h); g.rect(1, 4 + by, 1, 8 + by, h); g.set(0, 5 + by, h); g.set(0, 7 + by, h); g.rect(3, 11 + by, 4, 12 + by, h); g.set(2, 13 + by, h);
    g.set(1, 2 + by, h); g.set(2, 2 + by, h);
    for (const [x, y] of [[2, 5], [3, 8], [1, 6]]) g.set(x, y + by, hd, true);
    g.set(0, 5 + by, s.gem || '#fff3a0', true); g.set(2, 13 + by, s.gem || '#fff3a0', true);
  }
  if (e.hairdo === 'braid') { // one long braid down the back, tied off with a feather
    for (let y = 8; y <= 14; y++) g.set(y % 2 ? 4 : 5, y + by, h); for (let y = 8; y <= 14; y++) g.set(y % 2 ? 5 : 4, y + by, y % 2 ? hd : h);
    g.set(4, 15 + by, P.leather, true); g.set(3, 16 + by, P.accent, true); g.set(4, 16 + by, '#ffffff', true);
  }
  if (e.hairdo === 'tail') { // a high ponytail swept back from the crown
    g.rect(3, 2 + by, 5, 3 + by, h); g.rect(2, 3 + by, 3, 6 + by, h); g.rect(1, 6 + by, 2, 9 + by, h); g.set(1, 10 + by, h);
    g.set(2, 4 + by, hl, true); g.set(1, 7 + by, hd, true);
  }
  if (elfHas(s, 'quiver')) { // quiver over the back shoulder, fletchings poking up
    g.rect(3, 10 + by, 4, 15 + by, P.leather); g.set(3, 14 + by, shade(P.leather, -0.3), true); g.set(4, 11 + by, P.trim, true);
    g.set(2, 9 + by, P.accent, true); g.set(3, 9 + by, '#ffffff', true);
  }
}

// the body: build first, then what is worn on it (called after the plain torso, before the head)
function elfTorso(g, s, by, frame) {
  const e = s.elf, P = elfPal(s), skin = s.skin, a1 = s.armor, a2 = s.armor2 || shade(a1, -0.3), cl = s.cloth || a2;
  const sway = frame === 'walk0' ? -1 : frame === 'walk1' ? 1 : 0;
  if (e.build === 'lithe') {
    // slim waist: the back arm tucks in, the tunic narrows and ends in a pointed tail
    for (let y = 11; y <= 15; y++) g.clear(5, y + by); for (let y = 13; y <= 15; y++) g.clear(6, y);
    g.rect(6, 12 + by, 6, 13 + by, a2); g.set(6, 14 + by, skin);
    g.rect(7, 14, 12, 14, P.leather); g.set(9, 14, P.trim, true);
    g.rect(8, 15, 11, 15, a1); g.rect(9, 16, 10, 16, a1); g.set(10, 16, a2);
  } else if (e.build === 'robe') {
    // a long robe to the feet, with a trimmed hem that swings as they walk
    for (let y = 16; y <= 18; y++) for (let x = 4; x <= 14; x++) g.clear(x, y);
    g.rect(6, 14, 12, 15, a1); g.rect(6, 16, 12, 17, a1); g.rect(5 + Math.min(0, sway), 17, 13 + Math.max(0, sway), 17, a1);
    g.rect(5 + Math.min(0, sway), 18, 13 + Math.max(0, sway), 18, P.trim); g.set(9, 16, a2); g.set(9, 17, a2);
    g.rect(6, 14, 12, 14, cl); g.set(12, 18, shade(a2, -0.35));
  } else if (e.build === 'gown') {
    // a flared skirt of layered leaves over a fitted bodice
    for (let y = 16; y <= 18; y++) for (let x = 4; x <= 14; x++) g.clear(x, y);
    const L = P.leaf, L2 = shade(L, -0.25), L3 = shade(L, 0.25);
    g.rect(6, 14, 12, 14, cl); g.rect(6, 15, 12, 15, L); g.rect(5, 16, 13, 16, L); g.rect(5, 17, 13, 17, a1); g.rect(4 + Math.min(0, sway), 18, 14 + Math.max(0, sway), 18, L);
    for (const x of [6, 9, 12]) { g.set(x, 15, L3, true); g.set(x + 1, 17, L2, true); }
    for (const x of [5, 8, 11, 14]) g.clear(x + Math.max(0, sway), 18);
    g.set(7, 16, P.accent, true); g.set(11, 16, '#ffffff', true);
  } else { // ranger: a belted tunic with a short skirt
    g.rect(6, 14, 12, 14, P.leather); g.set(10, 14, P.trim, true); g.rect(7, 15, 12, 15, a1); g.set(9, 15, a2);
  }
  if (elfHas(s, 'sash')) { for (let i = 0; i < 4; i++) g.set(7 + i, 11 + by + i, P.trim, true); g.set(11, 14, P.accent, true); }
  if (elfHas(s, 'straps')) { for (let i = 0; i < 4; i++) { g.set(7 + i, 11 + by + i, P.leather); g.set(11 - i, 11 + by + i, P.leather); } g.set(9, 13 + by, P.trim, true); }
  if (elfHas(s, 'stars')) for (const [x, y] of [[7, 12], [11, 13], [8, 16], [11, 17], [6, 15]]) if (g.get(x, y < 16 ? y + by : y)) g.set(x, y < 16 ? y + by : y, s.gem || '#fff3a0', true);
}

// the head: tapered chin and the hair (the default elf hair and ears are skipped)
function elfHead(g, s, by) {
  const e = s.elf, h = s.hair, hl = shade(h, 0.25), hd = shade(h, -0.25);
  // a slim pointed chin
  g.clear(13, 9 + by); g.set(12, 10 + by, s.skin); g.clear(6, 10 + by);
  // the crown of the hair every elf shares: sleek and close to the head
  g.rect(6, 3 + by, 12, 3 + by, h); g.rect(5, 4 + by, 13, 4 + by, h); g.rect(5, 5 + by, 6, 7 + by, h); g.set(7, 5 + by, h);
  g.set(9, 3 + by, hl, true);
  const D = e.hairdo;
  if (D === 'shag') { g.set(13, 5 + by, h); g.set(11, 5 + by, h); g.set(5, 8 + by, h); g.set(8, 5 + by, hd, true); }
  else if (D === 'braid') { g.set(13, 5 + by, h); g.rect(5, 8 + by, 5, 8 + by, h); g.set(10, 4 + by, hl, true); }
  else if (D === 'tail') { g.set(13, 5 + by, h); g.set(5, 3 + by, h); }
  else if (D === 'flow') { g.set(13, 5 + by, h); g.rect(5, 8 + by, 6, 9 + by, h); g.set(7, 4 + by, hl, true); }
  else if (D === 'float' || D === 'mane') { g.set(13, 5 + by, h); g.rect(5, 8 + by, 6, 9 + by, h); }
  else if (D === 'bob') { // sharp bob: thick at the back, cut to a point at the jaw, fringe swept across the brow
    g.rect(5, 5 + by, 7, 9 + by, h); g.set(6, 10 + by, h); g.set(7, 10 + by, hd); g.rect(8, 5 + by, 9, 5 + by, h); g.set(13, 5 + by, h); g.set(13, 6 + by, h);
    g.set(6, 6 + by, hl, true); g.set(6, 8 + by, hd, true);
  }
}

// after the hats: headpieces and the long ears that poke through hoods and hair
function elfTop(g, s, by) {
  const e = s.elf, P = elfPal(s), skin = s.skin, inner = mix(shade(skin, -0.2), '#ff9aa8', 0.35);
  const T = e.top;
  if (T === 'leafcowl') { // a cowl of overlapping leaves with points along its edge, the face left open
    const L = P.leaf, L2 = shade(L, -0.28), L3 = shade(L, 0.3);
    g.rect(5, 2 + by, 12, 3 + by, L); g.rect(4, 4 + by, 7, 4 + by, L); g.rect(4, 5 + by, 6, 10 + by, L); g.rect(7, 4 + by, 12, 4 + by, L);
    for (const x of [5, 8, 11]) g.set(x, 1 + by, L); g.set(13, 3 + by, L); g.set(13, 4 + by, L); g.set(3, 3 + by, L); g.set(2, 3 + by, L); g.set(3, 7 + by, L); g.set(3, 10 + by, L);
    for (const [x, y] of [[6, 2], [9, 2], [12, 3], [5, 6], [5, 9]]) g.set(x, y + by, L3, true);
    for (const [x, y] of [[7, 3], [10, 3], [4, 8], [6, 4]]) g.set(x, y + by, L2, true);
    g.set(12, 5 + by, s.hair); g.set(11, 5 + by, s.hair); // a blond fringe peeks out under the leaves
  }
  if (T === 'circlet') { // a thin circlet of silver and leaves
    g.rect(7, 4 + by, 13, 4 + by, P.trim, true); g.set(10, 4 + by, P.accent, true); g.set(6, 3 + by, P.leaf, true); g.set(5, 2 + by, P.leaf, true); g.set(6, 2 + by, shade(P.leaf, 0.3), true);
  }
  if (T === 'branches') { // twig antlers with blossoms, rising out of the hair
    const B = P.bark;
    g.rect(7, 1 + by, 7, 2 + by, B); g.set(6, 0 + by, B); g.set(8, 0 + by, B); g.set(5, 1 + by, B);
    g.rect(11, 1 + by, 11, 2 + by, B); g.set(12, 0 + by, B); g.set(10, 0 + by, B); g.set(13, 1 + by, B);
    g.set(5, 0 + by, P.accent, true); g.set(13, 0 + by, P.accent, true); g.set(8, 0 + by, '#ffffff', true); g.set(9, 2 + by, P.leaf, true); g.set(12, 1 + by, P.leaf, true);
    g.set(9, 3 + by, P.accent, true);
  }
  if (T === 'crescent') { // a crescent moon set on a silver band
    g.rect(7, 4 + by, 12, 4 + by, P.trim, true); g.set(9, 3 + by, P.accent, true); g.set(11, 3 + by, P.accent, true); g.set(10, 4 + by, P.accent, true);
  }
  if (T === 'sunburst') { // a gold band with sun rays fanning up
    const G = P.trim;
    g.rect(6, 4 + by, 13, 4 + by, G, true); g.set(10, 4 + by, P.accent, true);
    // the rays fan out to the sides, so the halo above stays its own ring
    g.set(6, 3 + by, G, true); g.set(5, 2 + by, G, true); g.set(13, 3 + by, G, true); g.set(14, 2 + by, G, true);
    g.set(8, 3 + by, G, true); g.set(10, 3 + by, G, true); g.set(12, 3 + by, G, true);
  }
  if (T === 'rose') { // a night rose behind the ear
    g.set(6, 2 + by, P.accent, true); g.set(7, 2 + by, shade(P.accent, -0.3), true); g.set(6, 3 + by, shade(P.accent, -0.3), true); g.set(7, 3 + by, P.accent, true); g.set(7, 1 + by, shade(P.accent, 0.3), true);
    g.set(8, 2 + by, P.leaf, true); g.set(5, 3 + by, P.leaf, true);
  }
  if (T === 'pin') { g.set(4, 2 + by, P.trim, true); g.set(3, 1 + by, P.trim, true); g.set(5, 3 + by, P.accent, true); }
  // ears: long and tapered, with a pink inner shadow
  const E = e.ears || 'long';
  let ear;
  // short and leaf-shaped: a two-pixel root against the head and a single-pixel tip, so it reads as an ear and not a horn
  if (E === 'tall') ear = [[4, 7], [4, 6], [4, 5], [3, 5], [3, 4]];
  else if (E === 'droop') ear = [[4, 6], [4, 7], [3, 7], [2, 7], [3, 6]];
  else ear = [[4, 7], [4, 6], [3, 6], [3, 5], [2, 4]];
  for (const [x, y] of ear) g.set(x, y + by, skin);
  if (E === 'tall') g.set(4, 6 + by, inner, true);
  else if (E === 'droop') g.set(3, 7 + by, inner, true);
  else g.set(3, 6 + by, inner, true);
  if (elfHas(s, 'cuffs')) { const c = E === 'tall' ? [3, 5] : E === 'droop' ? [2, 7] : [3, 5]; g.set(c[0], c[1] + by, P.trim, true); }
  if (elfHas(s, 'rings')) { const pts = E === 'tall' ? [[3, 4], [3, 5], [4, 8]] : [[3, 5], [2, 4], [4, 8]]; for (const [x, y] of pts) g.set(x, y + by, P.trim, true); }
}

// in front of everything: shoulder pieces, scarves, arm wraps
function elfFront(g, s, by) {
  const P = elfPal(s);
  if (elfHas(s, 'leafmantle')) { const L = P.leaf;
    g.rect(5, 11 + by, 12, 11 + by, L); for (const x of [5, 7, 9, 11]) g.set(x, 12 + by, L); g.set(4, 11 + by, L);
    for (const x of [6, 10]) g.set(x, 11 + by, shade(L, 0.3), true); g.set(8, 11 + by, P.trim, true); }
  if (elfHas(s, 'scarf')) { const c = P.accent;
    g.rect(7, 11 + by, 12, 11 + by, c); g.set(6, 12 + by, c); g.set(5, 12 + by, c); g.set(4, 13 + by, c); g.set(3, 13 + by, shade(c, -0.25)); g.set(10, 11 + by, shade(c, -0.25), true); }
  if (elfHas(s, 'mantle')) { const f = P.accent, f2 = shade(f, -0.2);
    g.rect(4, 10 + by, 7, 11 + by, f); g.set(3, 11 + by, f); g.set(4, 12 + by, f); g.set(6, 12 + by, f); g.set(8, 11 + by, f);
    g.set(5, 11 + by, f2, true); g.set(7, 12 + by, f2); g.set(5, 10 + by, P.trim, true); }
  if (elfHas(s, 'vines')) { g.set(5, 13 + by, P.leaf, true); g.set(6, 12 + by, P.leaf, true); g.set(13, 13 + by, P.leaf, true); g.set(12, 12 + by, P.leaf, true); g.set(5, 14 + by, '#ffffff', true); }
  if (elfHas(s, 'bracer')) { g.set(13, 13 + by, P.leather, true); g.set(12, 13 + by, P.leather, true); }
}

// ===== fine-grid face extras (after the temper face): upswept lashes, cheekbones, marks
function hdElfFace(G, s, by) {
  const e = s.elf; if (!e) return;
  const P = elfPal(s), dy = by * HDK, skin = s.skin, ink = mix(OUTLINE, skin, 0.18);
  // only on bare skin, so nothing ever lands on an eye, a mouth or the hair
  const put = (x, y, c) => { if (G.get(x, y) === skin) G.set(x, y, c, true); };
  // the outer corner of the front eye flicks up, and a soft light sits on the high cheekbone
  put(26, 11 + dy, ink); put(27, 10 + dy, ink);
  put(25, 15 + dy, shade(skin, 0.14));
  const F = e.face || [];
  if (F.includes('freckles')) { const c = mix(skin, '#b0603a', 0.4); for (const [x, y] of [[20, 16], [22, 17], [25, 17], [27, 16], [19, 17]]) put(x, y + dy, c); }
  if (F.includes('stars')) { const c = P.accent; put(27, 15 + dy, c); put(19, 16 + dy, c); put(18, 15 + dy, shade(c, -0.2)); put(26, 17 + dy, '#ffffff'); }
  if (F.includes('tattoo')) { const c = mix(skin, '#ffffff', 0.55); put(18, 15 + dy, c); put(19, 16 + dy, c); put(18, 17 + dy, c); }
  if (F.includes('gild')) { const c = P.trim; put(19, 16 + dy, c); put(26, 15 + dy, c); put(22, 10 + dy, '#ffffff'); }
}
