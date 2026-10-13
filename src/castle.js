// Pixel architecture: rear spires, great hall, curtain wall, then gate towers.
// All geometry stays inside the existing 110px castle footprint.
function buildCastle(run) {
  const elemental = elementArchitecture(run); if (elemental) return elemental;
  const T = run.tech || {}, tier = Math.min(10, castleTier(run));
  const rf = rafterSlots(run), bl = T.ballista1 ? 1 + !!T.ballista2 + 2 * !!T.ballista3 : 0;
  const armor = !!T.walls1 + !!T.walls2 + !!T.bastion;
  const key = [tier, armor, rf, bl, !!T.fountain, run.castleEl].join();
  if (R.castleKey === key) return R.castle;
  const c = document.createElement('canvas'); c.width = 110; c.height = H;
  const g = c.getContext('2d');
  const [stone, mortar, dark, blue, navy, light] = CASTLE_PAL[run.castleEl] ||
    ['#d6d9da', '#929aa5', '#626e82', '#446c9b', '#263d66', '#f2eee0'];
  const gold = tier >= 5 || armor >= 2 ? '#e6ba63' : light;
  const roof = tier >= 9 ? '#dca84d' : blue, roofShade = tier >= 9 ? '#91632e' : navy;
  R.castleFlags = []; R.castleTorches = []; R.castleGlow = [];
  const p = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const poly = (points, col) => {
    g.fillStyle = col; g.beginPath(); points.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill();
  };
  const masonry = (x, y, w, h, shaded = false) => {
    p(x - 1, y - 1, w + 2, h + 2, OUTLINE);
    p(x, y, w, h, shaded ? dark : mortar);
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    for (let yy = y, row = 0; yy < y + h; yy += 6, row++) {
      for (let xx = x - (row % 2) * 5; xx < x + w; xx += 10) {
        const v = hash(xx, yy), col = shaded ? shade(stone, -0.24) : v < 0.18 ? shade(stone, -0.07) : stone;
        p(xx, yy, 9, 5, col);
        // Sparse highlights keep large walls readable at game scale.
        if (v > 0.65) p(xx + 1, yy, 6, 1, shaded ? mortar : light);
      }
    }
    g.restore(); p(x, y, 1, h, shaded ? mortar : light); p(x + w - 2, y, 2, h, dark);
  };
  const course = (x, y, w) => { p(x - 1, y, w + 2, 4, OUTLINE); p(x, y, w, 2, gold); p(x, y + 2, w, 1, dark); };
  const battlements = (x, y, w) => {
    course(x, y, w);
    for (let xx = x; xx < x + w - 3; xx += 8) {
      p(xx - 1, y - 6, 6, 7, OUTLINE); p(xx, y - 5, 4, 6, stone);
      p(xx, y - 5, 4, 1, light); p(xx + 3, y - 4, 1, 5, dark);
    }
    for (let xx = x + 2; xx < x + w - 2; xx += 8) p(xx, y + 4, 2, 3, dark);
  };
  const window = (x, y, w = 5, h = 10) => {
    p(x - 1, y + 2, w + 2, h - 1, light); p(x, y + 1, w, h - 1, OUTLINE);
    p(x + 1, y, w - 2, h, OUTLINE); p(x + 1, y + 3, w - 2, h - 4, '#e8b65e');
    p(x + 1, y + 3, 1, h - 4, '#ffe9a3'); p(x - 1, y + h, w + 2, 2, dark);
    if (w >= 7) { p(x + Math.floor(w / 2), y + 2, 1, h - 2, OUTLINE); p(x, y + 6, w, 1, OUTLINE); }
  };
  const flag = (x, y, col, big = false) => {
    p(x, y - 11, 1, 12, dark); p(x - 1, y - 13, 3, 2, '#e6ba63');
    R.castleFlags.push({ x: x + 1, y: y - 11, col, w: big ? 9 : 7 });
  };
  const spire = (x, y, w, h) => {
    const cx = x + w / 2;
    poly([[x - 3, y], [cx, y - h], [x + w + 3, y]], OUTLINE);
    poly([[x - 1, y - 1], [cx, y - h + 2], [x + w + 1, y - 1]], roof);
    poly([[cx, y - h + 2], [cx + 1, y - 1], [x + w + 1, y - 1]], roofShade);
    for (let yy = y - h + 7; yy < y - 2; yy += 5) {
      const half = (yy - (y - h)) / h * (w / 2 + 1);
      p(cx - half, yy, half, 1, shade(roof, 0.22)); p(cx + 1, yy, half - 1, 1, roofShade);
    }
    course(x - 2, y, w + 4);
  };
  const tower = (x, y, w, bottom, pointed = false) => {
    masonry(x, y, w, bottom - y);
    p(x + w - 5, y + 3, 4, bottom - y - 3, shade(stone, -0.24));
    course(x - 1, bottom - 7, w + 2);
    if (pointed) spire(x, y, w, 16 + Math.min(8, tier)); else battlements(x - 1, y, w + 2);
    for (let yy = y + 13; yy < bottom - 15; yy += 28) window(x + Math.floor(w / 2) - 2, yy, 4, 9);
  };
  const banner = (x, y, col) => {
    p(x - 1, y - 1, 10, 22, OUTLINE); p(x, y, 8, 18, col);
    poly([[x, y + 17], [x + 4, y + 21], [x + 8, y + 17]], col);
    p(x, y, 8, 2, '#e6ba63'); p(x + 3, y + 6, 2, 6, '#fff2ca'); p(x + 1, y + 8, 6, 2, '#fff2ca');
  };

  // Foundation and side face establish a single direction for depth and light.
  poly([[2, 219], [24, 206], [92, 208], [103, 228], [84, 239], [9, 239]], '#505767');
  poly([[2, 219], [24, 212], [94, 215], [99, 224], [12, 229]], '#8a9098');
  for (let i = 0; i < 20; i++) { const x = 5 + Math.floor(hash(i, 2) * 88), y = 224 + Math.floor(hash(i, 5) * 10); p(x, y, 5, 2, hash(i, 7) < 0.5 ? '#626b78' : '#a0a5ac'); }
  p(9, 239, 86, 2, '#589047');
  // Rear towers are visible above the great hall from the first siege.
  const top = 75 - tier * 1.5;
  tower(8, top - 12, 17, 141, true); flag(16, top - 30 - Math.min(8, tier), '#b84b65');
  tower(66, top - 19, 17, 142, true); flag(74, top - 37 - Math.min(8, tier), '#477da4');
  if (tier >= 2) { const crownY = 58 - tier * 1.5; tower(39, crownY, 18, 96, true); flag(48, crownY - 16 - Math.min(8, tier), '#b84b65', true); }
  // A broad hall, with a hip roof instead of an undifferentiated slab.
  masonry(18, top + 18, 14, 126 - top, true);
  masonry(32, top + 18, 42, 126 - top);
  poly([[16, top + 18], [28, top - 1], [61, top - 1], [77, top + 18]], OUTLINE);
  poly([[18, top + 17], [29, top + 1], [60, top + 1], [74, top + 17]], roof);
  poly([[29, top + 1], [33, top + 17], [18, top + 17]], roofShade);
  for (let yy = top + 5; yy < top + 16; yy += 4) p(31, yy, 29 + (yy - top) / 2, 1, roofShade);
  course(18, top + 18, 57);
  for (const x of [38, 56]) window(x, top + 29, 7, 14);
  course(31, top + 51, 44);
  if (tier >= 5) {
    p(46, top + 27, 9, 13, OUTLINE); p(48, top + 29, 5, 9, palAccent(run));
    p(50, top + 29, 1, 9, light); R.castleGlow.push({ x: 50, y: top + 34 });
  }
  // Curtain wall has a shaded return and a walkable parapet at RAFTER_Y.
  masonry(3, 113, 16, 106, true); masonry(19, 120, 72, 99);
  battlements(19, 119, 72); course(19, 207, 72);
  for (const x of [28, 79]) { p(x, 132, 5 + armor, 73, mortar); p(x, 132, 2, 73, light); p(x + 4 + armor, 132, 1, 73, dark); }
  banner(31, 140, '#b84b65'); banner(77, 140, '#477da4');
  // Gatehouse: stone voussoirs, deep passage, iron teeth, and timber doors.
  masonry(43, 111, 32, 106); battlements(42, 110, 34);
  const gateX = 50, gateY = 174;
  p(gateX - 3, gateY, 25, 39, dark);
  poly([[gateX - 3, gateY], [gateX + 2, gateY - 9], [gateX + 10, gateY - 13], [gateX + 18, gateY - 9], [gateX + 22, gateY]], light);
  poly([[gateX, gateY + 1], [gateX + 4, gateY - 6], [gateX + 10, gateY - 9], [gateX + 16, gateY - 6], [gateX + 19, gateY + 1]], OUTLINE);
  p(gateX, gateY, 19, 38, OUTLINE); p(gateX + 3, gateY + 14, 16, 24, '#6b432c');
  for (let x = gateX + 4; x < gateX + 19; x += 4) p(x, gateY + 14, 1, 24, '#aa7548');
  p(gateX + 10, gateY + 14, 1, 24, OUTLINE);
  for (const yy of [gateY + 20, gateY + 32]) { p(gateX + 3, yy, 16, 2, '#394350'); for (let xx = gateX + 5; xx < gateX + 19; xx += 5) p(xx, yy, 1, 1, '#bcc2c4'); }
  for (let xx = gateX + 2; xx < gateX + 19; xx += 4) p(xx, gateY - 1, 1, 12, '#a6acb6');
  p(gateX + 1, gateY + 5, 17, 1, '#a6acb6');
  window(56, 127, 7, 13); course(43, 148, 32);
  for (let i = 0; i < tier; i++) drawTrophy(g, 22 + i * 6, 199, i);
  // Front corner towers anchor the fortress rather than hiding its main hall.
  tower(7, 109 - Math.min(tier, 4), 18, 221, tier >= 4);
  tower(82, 112 - Math.min(tier, 4), 16, 221, tier >= 6);
  if (tier >= 4) flag(15, 109 - Math.min(tier, 4) - 16 - Math.min(8, tier), '#b84b65');
  for (const x of [46, 73]) { p(x, 181, 2, 7, '#64462d'); R.castleTorches.push({ x, y: 179 }); }
  // Drawbridge points towards the battlefield and joins the road.
  poly([[50, 214], [69, 214], [92, 185], [79, 185]], OUTLINE);
  poly([[52, 214], [68, 214], [90, 186], [79, 186]], '#986b43');
  for (let i = 0; i < 6; i++) { const y = 190 + i * 4, x = 77 - i * 3; p(x, y, 13, 1, '#cd9a5f'); }
  // Lower lane defenses retain the existing collision boundary.
  for (let y = 232; y < H; y += 8) {
    p(89, y - 9, 9, 15, OUTLINE); p(90, y - 8, 7, 13, '#85603d'); p(90, y - 8, 2, 13, '#b78751');
    p(92, y - 11, 3, 3, '#b78751'); p(90, y, 7, 2, '#46505b');
  }
  if (rf) {
    p(4, RAFTER_Y + 1, 94, 6, OUTLINE); p(4, RAFTER_Y + 2, 94, 3, '#976a41'); p(4, RAFTER_Y + 2, 94, 1, '#d5ac70');
    for (let x = 8; x < 95; x += 12) { p(x, RAFTER_Y + 6, 2, 7, '#674730'); p(x + 2, RAFTER_Y + 6, 2, 3, '#674730'); }
    RAFTER_XS.forEach((x, i) => p(x - 3, RAFTER_Y + 2, 6, 1, i < rf ? '#e6ba63' : dark));
  }
  if (bl) {
    p(78, 90, 15, 4, OUTLINE); p(80, 94, 2, 9, '#674730'); p(89, 94, 2, 9, '#674730');
    p(79, 91, 13, 2, '#b78751'); p(83, 88, 16, 2, '#dce3e5');
    poly([[91, 82], [97, 89], [91, 96], [93, 89]], bl >= 4 ? '#e6ba63' : '#aab8c6');
  }
  if (T.fountain) { p(99, 107, 9, 5, dark); p(100, 106, 7, 3, light); p(101, 107, 5, 2, '#509fcb'); p(103, 99, 1, 8, '#bdefff'); p(102, 100, 3, 1, '#bdefff'); }
  R.castleKey = key; R.castle = c; return c;
}
function palAccent(run) { return (CASTLE_PAL[run.castleEl] || [null, null, null, null, null, '#94deee'])[5]; }
