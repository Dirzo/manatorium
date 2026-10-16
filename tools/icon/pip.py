# Siege of Legends app icon: Pip Puddlefoot raising his staff. Pixel art in the game's palette.
# Art is drawn on a 32x32 "visible" square inside a 48x48 canvas, which is exactly an Android adaptive
# icon (108dp layer, 72dp visible). Everything important sits inside the 32px circle.
# python3 pip.py OUTDIR  ->  bg48.png, fg48.png (transparent), full48.png, icon32.png
from PIL import Image
import math, sys, os
G48, O = 60, 14          # canvas (108dp layer); the visible 72dp square is the central 40px; art box is 32px
DY = 1                   # character sits a little low so the head clears a round mask
K = '#1a1230'
P = dict(g='#56c46a', G='#8fe07a', d='#2f8a4a', b='#d9f59b', w='#ffffff', e=K,
         y='#ffd84a', Y='#d99a1f', h='#fff1a8', p='#ff7aa8', q='#c04a7a', n='#a8703a', m='#6a4220',
         c='#7cf0ff', C='#eaffff', D='#2aa8d8', r='#ff8fb0', L='#ff9ac8', l='#ffe0f0', M='#e0508f', v='#ffd84a')
fg = [[None] * G48 for _ in range(G48)]
ink = [[None] * G48 for _ in range(G48)]
def gx(x): return x + O
def gy(y): return y + O + DY
def px(x, y, c, layer=fg):
    X, Y = gx(x), gy(y)
    if 0 <= X < G48 and 0 <= Y < G48: layer[Y][X] = c
def rect(x0, y0, x1, y1, c, layer=fg):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1): px(x, y, c, layer)
def ell(cx, cy, rx, ry, c, layer=fg):
    for y in range(-14, 46):
        for x in range(-14, 46):
            if ((x + .5 - cx) / rx) ** 2 + ((y + .5 - cy) / ry) ** 2 <= 1: px(x, y, c, layer)
N4 = ((1, 0), (-1, 0), (0, 1), (0, -1))
def near(layer, X, Y, keys=None):
    return any(0 <= X + dx < G48 and 0 <= Y + dy < G48 and layer[Y + dy][X + dx] and (keys is None or layer[Y + dy][X + dx] in keys) for dx, dy in N4)

# --- staff, gem ---
SX = 25
rect(SX, 4, SX, 34, 'n'); rect(SX + 1, 4, SX + 1, 34, 'm')
rect(SX - 1, 3, SX + 2, 4, 'Y'); rect(SX - 1, 3, SX + 1, 3, 'y')
for i, row in enumerate(['   C   ', '  CCc  ', ' CCccc ', 'CCCcccD', ' cccDD ', '  cDD  ', '   D   ']):
    for j, ch in enumerate(row):
        if ch != ' ': px(SX - 3 + j, -3 + i, ch)
# --- body ---
ell(13, 25.5, 10, 7.5, 'y'); rect(5, 24, 21, 34, 'y')
for x in range(5, 22):                                   # sash
    y = 21 + (x - 5) // 2
    px(x, y, 'p'); px(x, y + 1, 'p'); px(x, y + 2, 'q')
for t in range(0, 5):                                    # raised arm
    x, y = 18 + t * 1.0, 23 - t * 0.9
    rect(int(x), int(y), int(x) + 2, int(y) + 2, 'p' if t == 4 else 'y')
rect(SX - 2, 16, SX + 2, 19, 'g'); rect(SX - 1, 16, SX + 1, 16, 'G'); px(SX + 2, 19, 'd'); rect(SX - 2, 19, SX - 1, 19, 'd')
# --- head ---
ell(12.5, 13, 10.5, 7.5, 'g')
ell(8, 6, 3.6, 3.6, 'g'); ell(17.5, 6, 3.6, 3.6, 'g')
ell(12.5, 16.8, 7.6, 3.9, 'b')
# shade the tunic's far side
for y in range(18, 35):
    for x in range(0, 8):
        if fg[gy(y)][gx(x)] == 'y' if 0 <= gy(y) < G48 else False:
            if x < 6 or (x == 6 and y > 21): fg[gy(y)][gx(x)] = 'Y'
# belt + pink skirt, as on the in-game sprite
for y in range(29, 35):
    for x in range(-4, 32):
        Y, X = gy(y), gx(x)
        if Y < G48 and fg[Y][X] in ('y', 'Y', 'p', 'q'): fg[Y][X] = 'Y' if y == 29 else ('q' if x < 8 or y == 33 else 'p')
out = [[None] * G48 for _ in range(G48)]
for Y in range(G48):
    for X in range(G48):
        if fg[Y][X] is None and near(fg, X, Y): out[Y][X] = 'e'
# --- face ---
for ex in (7.5, 17):
    ex = int(ex + .5)
    rect(ex - 2, 4, ex + 1, 7, 'w')
    rect(ex, 5, ex + 1, 7, 'e'); px(ex, 5, 'C')
    rect(ex - 2, 8, ex + 1, 8, 'd')
px(5, 4, 'G'); px(6, 3, 'G'); px(15, 3, 'G'); px(16, 3, 'G')
rect(3, 11, 4, 13, 'G'); px(5, 10, 'G')
for x in range(6, 20):
    px(x, 14 if 8 <= x <= 17 else 13, 'e')
rect(10, 15, 15, 15, 'p'); rect(11, 16, 14, 16, 'q')
px(9, 15, 'e'); px(16, 15, 'e'); px(10, 16, 'e'); px(15, 16, 'e'); rect(11, 17, 14, 17, 'e')
px(5, 12, 'r'); px(6, 12, 'r'); px(19, 12, 'r'); px(20, 12, 'r')
rect(18, 9, 22, 9, 'd')
px(13, 22, 'h'); px(14, 22, 'h')
rect(27, 27, 27, 27, 'Y')
for x in range(-4, 32):
    if 0 <= gy(29) < G48 and fg[gy(29)][gx(x)]: ink[gy(29)][gx(x)] = 'Y'
rect(11, 29, 13, 29, 'v', ink); px(12, 29, 'h', ink)
# lotus blossom on the head
for i, row in enumerate(['  l  ', ' lLl ', 'lLvLl', 'MLLLM', ' MMM ']):
    for j, ch in enumerate(row):
        if ch != ' ': px(10 + j, 0 + i, ch, ink)
for Y in range(gy(-2), gy(6)):
    for X in range(gx(7), gx(17)):
        if ink[Y][X] is None and not fg[Y][X] and near(ink, X, Y, ('L', 'l', 'M', 'v')): ink[Y][X] = 'e'

BANDS = ['#fff6c8', '#ffe07a', '#ffb84a', '#3aa0e0', '#2a6ac0', '#284a98', '#22306e', '#1c2050']
def bg_pixel(x, y):
    d = math.hypot(x + .5 - (SX + .5), y + .5 - (0 + DY))
    t = d / 3.6; i = int(t); f = t - i
    if i >= len(BANDS) - 1: return BANDS[-1]
    return BANDS[i + 1] if (f > 0.7 and (x + y) % 2) else BANDS[i]
def rgb(h): return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))

bg = Image.new('RGB', (G48, G48)); fgi = Image.new('RGBA', (G48, G48), (0, 0, 0, 0))
for Y in range(G48):
    for X in range(G48):
        bg.putpixel((X, Y), rgb(bg_pixel(X - O, Y - O)))
        c = ink[Y][X] or out[Y][X] or fg[Y][X]
        if c: fgi.putpixel((X, Y), rgb(P[c]) + (255,))
# sparkles (part of the foreground so they sit over the sky)
def free(X, Y): return 0 <= X < G48 and 0 <= Y < G48 and not (fg[Y][X] or ink[Y][X] or out[Y][X])
for (x, y, big) in [(19, -2, 1), (31, 10, 1), (1, 3, 1), (30, 22, 0), (-2, 17, 0), (21, 6, 0), (31, 1, 0), (-1, 27, 0)]:
    X, Y = gx(x), gy(y)
    for dx, dy in [(0, 0)] + list(N4) + ([(2, 0), (-2, 0), (0, 2), (0, -2)] if big else []):
        if free(X + dx, Y + dy): fgi.putpixel((X + dx, Y + dy), (255, 255, 255, 255) if (dx, dy) == (0, 0) else (124, 240, 255, 255))
od = sys.argv[1] if len(sys.argv) > 1 else '.'
os.makedirs(od, exist_ok=True)
full = bg.convert('RGBA'); full.alpha_composite(fgi)
bg.save(f'{od}/bg48.png'); fgi.save(f'{od}/fg48.png'); full.save(f'{od}/full48.png')
full.crop((10, 10, 50, 50)).convert('RGB').save(f'{od}/icon40.png')
