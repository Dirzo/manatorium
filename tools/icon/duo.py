# Siege of Legends app icon: Pip Puddlefoot and Rattlebones, pixel art in the game's palette.
# 66px canvas = Android adaptive layer (108dp); the visible 72dp square is the central 44px.
# python3 duo.py OUTDIR -> bg.png, fg.png (transparent), full.png, icon.png (visible 44px)
from PIL import Image
import math, sys, os
W, VIS0, VIS = 66, 11, 44
K = '#1a1230'
P = dict(g='#56c46a', G='#8fe07a', d='#2f8a4a', b='#d9f59b', w='#ffffff', e=K,
         y='#ffd84a', Y='#d99a1f', h='#fff1a8', p='#b8402a', q='#7a2418', n='#a8703a', m='#6a4220',
         c='#7cf0ff', C='#eaffff', D='#2aa8d8',
         # Rattlebones
         s='#f1ecdc', S='#bdb39a', u='#7a6ae0', U='#4b3fa0', V='#2e2668', x='#ff5d8f', X='#ffb0c8')
N4 = ((1, 0), (-1, 0), (0, 1), (0, -1))

class Layer:
    def __init__(self, ox, oy): self.ox, self.oy = ox, oy; self.f = [[None] * W for _ in range(W)]; self.i = [[None] * W for _ in range(W)]; self.o = [[None] * W for _ in range(W)]
    def px(self, x, y, c, ink=False):
        X, Y = x + self.ox, y + self.oy
        if 0 <= X < W and 0 <= Y < W: (self.i if ink else self.f)[Y][X] = c
    def rect(self, x0, y0, x1, y1, c, ink=False):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1): self.px(x, y, c, ink)
    def ell(self, cx, cy, rx, ry, c, ink=False):
        for y in range(-30, 70):
            for x in range(-30, 70):
                if ((x + .5 - cx) / rx) ** 2 + ((y + .5 - cy) / ry) ** 2 <= 1: self.px(x, y, c, ink)
    def get(self, x, y):
        X, Y = x + self.ox, y + self.oy
        return self.f[Y][X] if 0 <= X < W and 0 <= Y < W else None
    def setf(self, x, y, c):
        X, Y = x + self.ox, y + self.oy
        if 0 <= X < W and 0 <= Y < W: self.f[Y][X] = c
    def outline(self):
        for Y in range(W):
            for X in range(W):
                if self.f[Y][X] is None and any(0 <= X + dx < W and 0 <= Y + dy < W and self.f[Y + dy][X + dx] for dx, dy in N4): self.o[Y][X] = 'e'
    def at(self, X, Y): return self.i[Y][X] or self.o[Y][X] or self.f[Y][X]

# ---------------- Rattlebones (behind, to the left) ----------------
R = Layer(13, 20)
# horns curling up and out
for (x, y) in [(3, 4), (2, 4), (1, 3), (2, 3), (0, 2), (1, 2), (0, 1), (0, 0), (1, -1), (1, -2), (2, -3),
               (12, 4), (13, 4), (14, 3), (13, 3), (15, 2), (14, 2), (15, 1), (15, 0), (14, -1), (14, -2), (13, -3)]:
    R.px(x, y, 'u')
# skull
R.ell(7.5, 8.5, 6.3, 5.6, 's')
R.rect(4, 12, 11, 15, 's')                       # jaw
# armour body + pauldron
R.ell(8, 22, 8.5, 6.5, 'u'); R.rect(0, 20, 16, 34, 'u')
R.rect(0, 18, 5, 21, 'U')
# shield raised in front (bone rim, purple field)
R.ell(4.5, 26, 5.2, 6.4, 's')
R.outline()
# skull details
R.rect(4, 7, 6, 9, 'e', True); R.rect(9, 7, 11, 9, 'e', True)          # sockets
R.px(5, 8, 'x', True); R.px(10, 8, 'x', True); R.px(5, 7, 'X', True); R.px(10, 7, 'X', True)  # glowing eyes
R.rect(4, 6, 6, 6, 'S', True); R.rect(9, 6, 11, 6, 'S', True)          # brow ridge
R.px(7, 10, 'e', True); R.px(8, 10, 'e', True)                         # nose
R.rect(4, 12, 11, 12, 'e', True)                                       # jaw line
for x in (5, 7, 9): R.px(x, 13, 'e', True)                             # teeth gaps
R.rect(4, 14, 11, 14, 'S', True); R.rect(2, 5, 3, 7, 'S', True)        # shade
R.rect(2, 3, 2, 3, 'U', True); R.px(13, 3, 'U', True)                  # horn shade at base
for y in range(16, 40):
    for x in range(-2, 20):
        if R.get(x, y) == 'u' and x >= 13: R.setf(x, y, 'U')
R.outline()
R.rect(1, 22, 8, 31, 'U', True); R.ell(4.5, 26, 4.1, 5.3, 'V', True)  # shield field
R.rect(4, 22, 5, 30, 's', True); R.rect(2, 25, 7, 26, 's', True)       # bone cross on the shield
R.px(4, 22, 'S', True)
for y in range(18, 40):
    for x in range(-2, 12):
        X, Y = x + R.ox, y + R.oy
        if 0 <= X < W and 0 <= Y < W and R.i[Y][X] == 'U' and not (((x + .5 - 4.5) / 4.1) ** 2 + ((y + .5 - 26) / 5.3) ** 2 <= 1): R.i[Y][X] = None

# ---------------- Pip (front, right) ----------------
L = Layer(23, 17)
SX = 25
L.rect(SX, 4, SX, 40, 'n'); L.rect(SX + 1, 4, SX + 1, 40, 'm')
L.rect(SX - 1, 3, SX + 2, 4, 'Y'); L.rect(SX - 1, 3, SX + 1, 3, 'y')
for i, row in enumerate(['   C   ', '  CCc  ', ' CCccc ', 'CCCcccD', ' cccDD ', '  cDD  ', '   D   ']):
    for j, ch in enumerate(row):
        if ch != ' ': L.px(SX - 3 + j, -3 + i, ch)
L.ell(13, 25.5, 10, 7.5, 'y'); L.rect(5, 24, 21, 40, 'y')
for x in range(5, 22):                                   # leather strap across the chest
    yy = 21 + (x - 5) // 2
    L.px(x, yy, 'p'); L.px(x, yy + 1, 'p'); L.px(x, yy + 2, 'q')
for t in range(0, 5):
    x, y = 18 + t * 1.0, 23 - t * 0.9
    L.rect(int(x), int(y), int(x) + 2, int(y) + 2, 'q' if t == 4 else 'y')
L.rect(SX - 2, 16, SX + 2, 19, 'g'); L.rect(SX - 1, 16, SX + 1, 16, 'G'); L.px(SX + 2, 19, 'd'); L.rect(SX - 2, 19, SX - 1, 19, 'd')
L.ell(12.5, 13, 10.5, 7.5, 'g')
L.ell(8, 6, 3.6, 3.6, 'g'); L.ell(17.5, 6, 3.6, 3.6, 'g')
L.ell(12.5, 16.8, 7.6, 3.9, 'b')
for y in range(18, 41):
    for x in range(0, 8):
        if L.get(x, y) == 'y' and (x < 6 or (x == 6 and y > 21)): L.setf(x, y, 'Y')
for y in range(29, 41):
    for x in range(-4, 32):
        if L.get(x, y) in ('y', 'Y', 'p', 'q'): L.setf(x, y, 'Y' if y == 29 else ('m' if x < 8 else 'n'))
L.outline()
# face: narrowed, determined eyes under a heavy brow, a sly smirk
for ex in (8, 17):
    L.rect(ex - 2, 4, ex + 1, 7, 'w', True)
    L.rect(ex, 5, ex + 1, 7, 'e', True); L.px(ex + 1, 5, 'C', True)
    L.rect(ex - 2, 8, ex + 1, 8, 'd', True)
# angry brows slanting down toward the middle
for (x, y) in [(5, 3), (6, 3), (7, 4), (8, 4), (9, 5), (19, 3), (18, 3), (17, 4), (16, 4), (15, 5)]: L.px(x, y, 'e', True)
L.px(5, 4, 'w', True); L.px(19, 4, 'g', True)
L.rect(3, 11, 4, 13, 'G', True); L.px(5, 10, 'G', True)
for x in range(7, 19): L.px(x, 14, 'e', True)                    # smirk: flat line, one corner up
L.px(19, 13, 'e', True); L.px(20, 12, 'e', True); L.px(6, 14, 'd', True)
L.rect(18, 9, 22, 9, 'd', True)
L.px(13, 22, 'h', True); L.px(14, 22, 'h', True)
for x in range(-4, 32):
    if L.get(x, 29): L.px(x, 29, 'Y', True)
L.rect(11, 29, 13, 29, 'y', True); L.px(12, 29, 'h', True)
L.rect(14, 26, 15, 26, 'h', True)                                # strap buckle
L.px(14, 27, 'Y', True); L.px(15, 27, 'Y', True)

# ---------------- sky ----------------
BANDS = ['#fff6c8', '#ffe07a', '#ffb84a', '#3aa0e0', '#2a6ac0', '#284a98', '#22306e', '#1c2050']
GX, GY = SX + L.ox + .5, L.oy + 0
def sky(X, Y):
    d = math.hypot(X + .5 - GX, Y + .5 - GY)
    t = d / 3.8; i = int(t); f = t - i
    if i >= len(BANDS) - 1: return BANDS[-1]
    return BANDS[i + 1] if (f > 0.7 and (X + Y) % 2) else BANDS[i]
def rgb(h): return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))

bg = Image.new('RGB', (W, W)); fg = Image.new('RGBA', (W, W), (0, 0, 0, 0))
used = [[False] * W for _ in range(W)]
for Y in range(W):
    for X in range(W):
        bg.putpixel((X, Y), rgb(sky(X, Y)))
        c = L.at(X, Y) or R.at(X, Y)
        if c: fg.putpixel((X, Y), rgb(P[c]) + (255,)); used[Y][X] = True
def free(X, Y): return 0 <= X < W and 0 <= Y < W and not used[Y][X]
for (X, Y, big) in [(39, 13, 1), (55, 30, 1), (19, 14, 1), (56, 43, 0), (29, 12, 0), (13, 28, 0)]:
    for dx, dy in [(0, 0)] + list(N4) + ([(2, 0), (-2, 0), (0, 2), (0, -2)] if big else []):
        if free(X + dx, Y + dy): fg.putpixel((X + dx, Y + dy), (255, 255, 255, 255) if (dx, dy) == (0, 0) else (124, 240, 255, 255))
od = sys.argv[1] if len(sys.argv) > 1 else '.'
os.makedirs(od, exist_ok=True)
full = bg.convert('RGBA'); full.alpha_composite(fg)
bg.save(f'{od}/bg.png'); fg.save(f'{od}/fg.png'); full.save(f'{od}/full.png')
full.crop((VIS0, VIS0, VIS0 + VIS, VIS0 + VIS)).convert('RGB').save(f'{od}/icon.png')
