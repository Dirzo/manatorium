# Builds the grounded Void keep (void-16bit-v3.png) from the floating-island painting:
# the gate block sits on the ground, the second island stacks on top as an upper tier,
# and the rift rises from the roof with a few loose shards. Run from the repo root.
from PIL import Image, ImageDraw
from collections import deque
src = Image.open('assets/castles/void-16bit-v2.png').convert('RGBA')
A = src.split()[3].load(); Wd, Ht = src.size

def piece(box, seed, cut=None, skip=None):
    # keep only pixels connected to seed inside box (drops stray shards and the beam)
    x0, y0, x1, y1 = box; keep = set(); q = deque([seed]); seen = {seed}
    while q:
        x, y = q.popleft()
        if not (x0 <= x < x1 and y0 <= y < y1) or A[x, y] < 100: continue
        if cut and y > cut(x): continue
        if skip and skip(x, y): continue
        keep.add((x, y))
        for n in ((x+1,y),(x-1,y),(x,y+1),(x,y-1)):
            if n not in seen: seen.add(n); q.append(n)
    out = Image.new('RGBA', (x1-x0, y1-y0), (0,0,0,0)); sp = src.load(); op = out.load()
    for x, y in keep: op[x-x0, y-y0] = sp[x, y]
    return out.crop(out.getbbox())

sp0 = src.load()
beam = lambda x, y: y < 840 and sp0[x, y][0] > 110 and sp0[x, y][2] > 170
base = piece((270, 740, 990, 1374), (620, 1000), cut=lambda x: 1238, skip=beam)
top = piece((620, 290, 1120, 780), (860, 470), cut=lambda x: 650)
left = piece((0, 0, 560, 640), (250, 250), cut=lambda x: 470)
print(base.size, top.size, left.size)
Wc = base.width + 40; Hc = 1300
cv = Image.new('RGBA', (Wc, Hc), (0,0,0,0))
by = Hc - base.height
# upper tiers first so the lower roofs overlap their undersides
lt = left.resize((round(left.width*0.62), round(left.height*0.62)), Image.LANCZOS)
tp = top.resize((round(top.width*0.86), round(top.height*0.86)), Image.LANCZOS)
ty = by - tp.height + 150
ly = ty - lt.height + 105
# rift: a glowing violet column from the top tier up into the sky
d = ImageDraw.Draw(cv)
cx = 20 + base.width//2 + 30
import math
for y in range(ly - 330, ly + 120, 4):
    w = 26 + 10*math.sin(y/37.0)
    off = 18*math.sin(y/53.0)
    d.rectangle([cx+off-w, y, cx+off+w, y+4], fill=(120, 60, 200, 255))
    d.rectangle([cx+off-w*0.55, y, cx+off+w*0.55, y+4], fill=(186, 120, 255, 255))
    d.rectangle([cx+off-w*0.2, y, cx+off+w*0.2, y+4], fill=(244, 220, 255, 255))
cv.alpha_composite(lt, (cx - lt.width//2 - 40, ly))
cv.alpha_composite(tp, (Wc - tp.width - 10, ty))
cv.alpha_composite(base, (20, by))
# rubble mound so the keep stands on the ground instead of hanging rock
import random; random.seed(7)
gy = Hc - 125
pts = [(0, Hc)] + [(x, gy + random.randint(-14, 10) + (abs(x - Wc/2) / (Wc/2))**2 * 30) for x in range(0, Wc + 1, 24)] + [(Wc, Hc)]
d.polygon(pts, fill=(44, 34, 62, 255))
for x in range(10, Wc - 10, 36):
    yy = gy + random.randint(4, 30); d.rectangle([x, yy, x + random.randint(14, 26), yy + 12], fill=(70, 58, 96, 255))
for x in range(50, Wc - 60, 110):
    yy = gy + random.randint(30, 60)
    d.line([(x, yy), (x + 18, yy + 14), (x + 10, yy + 30), (x + 28, yy + 46)], fill=(170, 100, 250, 255), width=5)
# floating shards around the rift
sh = [(cx-140, ly-230, 30), (cx+120, ly-150, 24), (cx-120, ly-60, 20), (cx+140, ly-300, 18)]
for x, y, r in sh:
    d.polygon([(x, y-r), (x+r*0.7, y), (x, y+r*1.2), (x-r*0.7, y)], fill=(52, 40, 74, 255))
    d.polygon([(x, y-r), (x+r*0.7, y), (x, y)], fill=(92, 72, 128, 255))
    d.line([(x, y-r*0.5), (x, y+r*0.8)], fill=(180, 110, 255, 255), width=4)
cv = cv.crop(cv.getbbox())
cv.save('assets/castles/void-16bit-v3.png')
print(cv.size)
# Deeper night-indigo stone and hotter violet glow so the keep reads against the lavender field.
px = cv.load()
for y in range(cv.height):
    for x in range(cv.width):
        r, g, b, a = px[x, y]
        if a < 100: continue
        if b > 150 and r > 90 and b - g > 60:   # glow
            px[x, y] = (min(255, int(r * 1.15)), int(g * 0.9), 255, a)
        else:                                    # stone
            l = (r + g + b) / 3
            px[x, y] = (min(255, int(l * 0.8 + 16)), min(255, int(l * 0.68 + 12)), min(255, int(l * 1.02 + 36)), a)
cv.save('assets/castles/void-16bit-v3.png')
