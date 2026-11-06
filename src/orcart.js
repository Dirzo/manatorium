// ===== Orcs (Cam 2026-11-06: "brakka and tusk look the same and dont look like proper orcs" ... "all orcs")
// An orc legend carries an `orc` look in its sprite spec. genHumanoid (sprites.js) calls these hooks while it builds the
// 20x20 body, and hdart.js calls hdOrcFace after the temper face, so tusks, scars and paint land at the fine grid.
// The colours an orc is known by (skin, fur, bone, leather, paint, metal) are never swapped by an element, so two orcs
// of the same element still read as two different orcs.
//
// o.build : 'hulk' (huge shoulders, bare chest), 'lean', 'gut' (big belly), 'hunch' (old back), 'stout'
// o.tusk  : 'huge', 'big', 'small', 'snaggle' (one crooked tooth), 'broken' (front one snapped)
// o.top   : 'topknot', 'crest' (tall swept mohawk), 'braids', 'bald'
// o.gear  : list of 'mantle' (fur on the back shoulder), 'harness', 'pauldron' (spiked iron), 'pauldrons' (both),
//           'chain', 'skullbelt', 'drum', 'quiver', 'ribs', 'necklace', 'shawl', 'earrings', 'feather'
// o.face  : list of 'paint', 'scar', 'wart', 'brow' (extra heavy brow)

function orcPal(s) {
  const o = s.orc;
  return { fur: o.fur || '#8a5a32', bone: o.bone || '#efe6cc', leather: o.leather || '#6b4426', paint: o.paint || '#e8434d', metal: o.metal || s.metal || '#a8b0c0' };
}
const orcHas = (s, k) => s.orc && s.orc.gear && s.orc.gear.includes(k);

// behind the body: things worn on the back
function orcBack(g, s, by) {
  const P = orcPal(s);
  if (orcHas(s, 'drum')) { // a hide war drum slung on the back
    g.rect(1, 10 + by, 4, 15 + by, P.leather); g.clear(1, 10 + by); g.clear(1, 15 + by);
    g.rect(2, 11 + by, 3, 14 + by, P.bone); g.set(1, 12 + by, P.paint, true); g.set(4, 13 + by, P.paint, true);
  }
  if (orcHas(s, 'quiver')) { // a quiver over the back shoulder with fletchings poking up
    g.rect(3, 9 + by, 4, 14 + by, P.leather); g.set(3, 13 + by, shade(P.leather, -0.3), true);
    g.set(2, 7 + by, P.paint, true); g.set(3, 7 + by, '#ffffff', true); g.set(3, 8 + by, P.paint, true); g.set(5, 8 + by, '#ffffff', true); g.set(4, 8 + by, P.bone);
  }
  if (s.orc.build === 'hunch') { g.rect(4, 9 + by, 6, 12 + by, s.armor); g.clear(4, 9 + by); }
}

// the torso: build first, then what is worn on the chest
function orcTorso(g, s, by) {
  const o = s.orc, P = orcPal(s), skin = s.skin, a1 = s.armor, a2 = s.armor2 || shade(a1, -0.3), cl = s.cloth || a2;
  if (o.build === 'hulk') {
    // no neck: the traps run straight into the jaw, the chest is bare, the back arm is a slab of muscle
    g.rect(4, 10 + by, 13, 14, skin); g.rect(5, 9 + by, 6, 9 + by, skin);
    g.rect(3, 11 + by, 4, 15 + by, skin); g.rect(3, 14 + by, 4, 14 + by, a2);
    g.set(9, 12 + by, shade(skin, -0.2)); g.set(10, 13 + by, shade(skin, -0.2));
    g.rect(5, 14, 12, 14, P.leather); g.set(9, 14, P.metal, true);
    g.rect(5, 15, 12, 15, cl); g.set(6, 15, shade(cl, -0.3), true); g.set(11, 15, shade(cl, -0.3), true);
  } else if (o.build === 'gut') {
    // a great round belly that spills out under the breastplate
    g.rect(5, 11 + by, 13, 13, a1); g.rect(6, 11 + by, 12, 11 + by, a2); g.set(9, 12 + by, shade(a1, 0.35));
    g.rect(6, 14, 14, 16, skin); g.rect(7, 13, 13, 13, skin); g.rect(7, 17, 13, 17, skin); g.clear(14, 16); g.clear(6, 16);
    g.rect(8, 17, 12, 17, shade(skin, -0.22), true); g.set(12, 15, shade(skin, -0.4), true); g.set(13, 14, shade(skin, 0.18), true);
    g.rect(5, 14, 5, 16, P.leather);
  } else if (o.build === 'stout') {
    g.rect(5, 11 + by, 13, 15, a1); g.rect(5, 11 + by, 13, 11 + by, a2); g.rect(5, 14, 13, 14, cl);
  } else if (o.build === 'hunch') {
    g.rect(6, 11 + by, 12, 15, a1); g.rect(5, 15, 13, 15, a1); g.rect(6, 14, 12, 14, cl);
  } else { // lean
    g.rect(6, 11 + by, 12, 15, a1); g.rect(6, 11 + by, 12, 11 + by, a2); g.rect(6, 14, 12, 14, P.leather);
  }
  if (orcHas(s, 'harness')) { for (let i = 0; i < 4; i++) g.set(6 + i, 10 + by + i, a2); g.set(10, 14, a2); g.set(8, 12 + by, P.metal, true); }
  if (orcHas(s, 'chain')) { for (let y = 12; y <= 13; y++) for (let x = 6; x <= 12; x++) if ((x + y) % 2) g.set(x, y + by, shade(a1, -0.28), true); }
  if (orcHas(s, 'ribs')) { for (const y of [12, 13]) for (let x = 7; x <= 11; x++) if (x !== 9) g.set(x, y + (y === 12 ? by : by), y === 12 ? P.bone : shade(P.bone, -0.25)); g.set(9, 12 + by, P.bone); g.set(9, 13 + by, P.bone); }
  if (orcHas(s, 'skullbelt')) { g.rect(8, 14, 9, 15, P.bone); g.set(8, 14, OUTLINE, true); g.set(9, 15, shade(P.bone, -0.3), true); }
  if (orcHas(s, 'necklace')) { for (const x of [7, 9, 11]) g.set(x, 11 + by, P.bone, true); g.set(8, 12 + by, P.paint, true); g.set(10, 12 + by, P.paint, true); }
}

// the head: heavy jaw with an underbite, a brow that juts out, short ears swept back, and an orc's hair
function orcHead(g, s, by) {
  const o = s.orc, P = orcPal(s), skin = s.skin, hair = s.hair || shade(skin, -0.4);
  // sloped cranium (narrower on top), broad jaw that pushes past the face
  g.clear(5, 3 + by); g.clear(6, 3 + by); g.clear(5, 4 + by); g.clear(12, 3 + by);
  g.rect(13, 5 + by, 14, 5 + by, shade(skin, -0.2)); if (o.face && o.face.includes('brow')) g.set(14, 4 + by, shade(skin, -0.2));
  g.rect(13, 8 + by, 14, 10 + by, skin); g.set(13, 10 + by, skin);
  // the underside of the jaw sits in shadow, so the head never melts into a bare chest
  g.rect(7, 11 + by, 13, 11 + by, shade(skin, -0.32), true);
  // pointed ear swept back
  g.rect(4, 6 + by, 4, 8 + by, skin); g.set(3, 5 + by, skin); g.set(3, 6 + by, skin); g.set(4, 7 + by, shade(skin, -0.25), true);
  if (orcHas(s, 'earrings')) { g.set(3, 8 + by, '#ffcf3a', true); g.set(4, 9 + by, '#ffcf3a', true); }
  // hair
  if (o.top === 'topknot') { g.rect(7, 1 + by, 8, 2 + by, hair); g.set(8, 0 + by, hair); g.rect(6, 2 + by, 6, 2 + by, hair); g.rect(7, 3 + by, 8, 3 + by, '#ffcf3a', true); g.rect(5, 4 + by, 5, 6 + by, hair); }
  else if (o.top === 'crest') { for (const [x, t] of [[6, 2], [7, 0], [8, 1], [9, 0], [10, 2]]) g.rect(x, t + by, x, 3 + by, hair); g.set(9, 1 + by, shade(hair, 0.25), true); g.set(7, 1 + by, shade(hair, 0.25), true); }
  else if (o.top === 'braids') { g.rect(7, 2 + by, 12, 3 + by, hair); g.rect(5, 4 + by, 6, 5 + by, hair); g.rect(5, 6 + by, 5, 9 + by, hair); g.rect(4, 9 + by, 4, 14 + by, hair);
    for (const y of [11, 13]) g.set(4, y + by, shade(hair, -0.3), true); g.set(5, 8 + by, P.bone, true); g.set(4, 15 + by, P.paint, true); }
  if (orcHas(s, 'feather')) { g.set(4, 2 + by, P.paint, true); g.set(3, 1 + by, P.paint, true); g.set(3, 0 + by, '#ffffff', true); }
}

// in front of everything: shoulder plates
function orcFront(g, s, by) {
  const P = orcPal(s), m = P.metal, d = shade(m, -0.35);
  const spike = (x, y, h) => { for (let k = 0; k < h; k++) g.set(x, y - k, k === h - 1 ? '#f4f1ff' : shade(m, 0.25)); };
  const plate = () => { g.rect(2, 10 + by, 6, 12 + by, m); g.clear(2, 12 + by); g.rect(3, 12 + by, 6, 12 + by, d); g.set(4, 11 + by, '#e8434d', true); spike(2, 9 + by, 3); spike(4, 9 + by, 2); spike(6, 9 + by, 2); };
  if (orcHas(s, 'pauldron')) plate();
  // rounded iron plates on both shoulders, studded with rivets (no spikes: that is Brakka's)
  if (orcHas(s, 'pauldrons')) { const rv = s.orc.rivet || '#ffcf3a';
    g.rect(2, 10 + by, 6, 12 + by, m); g.clear(2, 10 + by); g.rect(3, 9 + by, 5, 9 + by, m); g.rect(2, 12 + by, 6, 12 + by, d); g.set(3, 11 + by, rv, true); g.set(5, 11 + by, rv, true);
    g.rect(11, 11 + by, 13, 12 + by, m); g.set(12, 10 + by, m); g.rect(11, 12 + by, 13, 12 + by, d); g.set(12, 11 + by, rv, true); }
  if (orcHas(s, 'shawl')) { g.rect(4, 11 + by, 12, 12 + by, P.fur); g.rect(7, 13 + by, 10, 13 + by, P.fur); g.set(8, 14 + by, P.fur); g.set(6, 12 + by, shade(P.fur, -0.25), true); g.set(10, 12 + by, shade(P.fur, -0.25), true); g.set(12, 11 + by, P.paint, true); }
  if (orcHas(s, 'mantle')) { const f = P.fur, f2 = shade(f, 0.3);
    g.rect(2, 10 + by, 7, 11 + by, f); g.set(3, 9 + by, f); g.set(5, 9 + by, f); g.set(7, 9 + by, f); g.set(2, 12 + by, f); g.set(4, 12 + by, f); g.set(6, 12 + by, f);
    g.set(4, 10 + by, f2, true); g.set(6, 10 + by, f2, true); g.set(3, 11 + by, shade(f, -0.25), true); }
}

// ===== fine-grid face extras (after the temper face): tusks, nose, scars, war paint, warts
function hdOrcFace(G, s, by) {
  const o = s.orc; if (!o) return;
  const P = orcPal(s), dy = by * HDK, skin = s.skin, ink = mix(OUTLINE, skin, 0.15);
  const put = (x, y, c) => { if (G.get(x, y)) G.set(x, y, c, true); };
  // a broad flat nose between the eyes and the mouth
  put(26, 15 + dy, shade(skin, -0.3)); put(27, 15 + dy, shade(skin, -0.3)); put(27, 14 + dy, shade(skin, 0.15)); put(26, 16 + dy, shade(skin, -0.12));
  // tusks jut up from the lower jaw on either side of the mouth: ivory with a shaded back edge and an ink outline
  const iv = P.bone === '#efe6cc' ? '#fff4d8' : P.bone;
  // a tusk curves up and outward (dir -1 back, +1 forward): a wide shaded base, then a lean to a sharp tip
  const tusk = (x, h, wide, dir = 1) => {
    const base = 20 + dy;
    for (let k = 0; k < h; k++) { const y = base - k, lean = k >= h - 2 && h > 2 ? dir : 0, w = wide && k < h - 2 ? 2 : 1, x0 = x + lean;
      for (let i = 0; i < w; i++) put(x0 + i, y, i === 0 && w === 2 ? shade(iv, -0.22) : iv);
      put(dir > 0 ? x0 - 1 : x0 + w, y, ink); }
    put(x + (h > 2 ? dir : 0), base - h, ink);
  };
  const T = o.tusk || 'big';
  if (T === 'huge') { tusk(19, 5, true, -1); tusk(26, 6, true, 1); }
  else if (T === 'big') { tusk(19, 4, true, -1); tusk(26, 4, true, 1); }
  else if (T === 'small') { tusk(20, 2, false, -1); tusk(26, 3, false, 1); }
  else if (T === 'snaggle') { tusk(26, 4, true, 1); }
  else if (T === 'broken') { tusk(19, 4, true, -1); tusk(26, 2, true, 1); put(26, 18 + dy, shade(iv, -0.4)); put(27, 18 + dy, shade(iv, -0.25)); }
  const F = o.face || [];
  if (F.includes('paint')) for (let x = 16; x <= 19; x++) { put(x, 15 + dy, P.paint); put(x + 1, 16 + dy, P.paint); }
  if (F.includes('scar')) for (let k = 0; k < 6; k++) put(21 + k, 9 + dy + k, k === 2 || k === 3 ? '#ffb3a0' : mix('#ffb3a0', skin, 0.4));
  if (F.includes('wart')) { put(21, 16 + dy, shade(skin, -0.3)); put(22, 16 + dy, shade(skin, -0.3)); put(21, 15 + dy, shade(skin, 0.25)); }
  if (F.includes('brow')) for (let x = 18; x <= 27; x++) put(x, 10 + dy, shade(skin, -0.38));
}
