# Makes the game-sized castle sprites the build embeds: crop each chosen full-size sprite to its
# visible pixels and scale it to 216px wide (about twice its on-screen size). Run from the repo root.
from PIL import Image
pick = {'fire': 'fire-16bit', 'water': 'water-16bit', 'nature': 'nature-16bit'}
for el in ['fire', 'water', 'nature', 'ice', 'lightning', 'dark', 'light', 'void', 'salty', 'sweet', 'meat', 'treat']:
    f = pick.get(el) or (el + ('-16bit-v3' if el in ['ice', 'meat', 'salty', 'light'] else '-16bit-v2'))
    im = Image.open(f'assets/castles/{f}.png').convert('RGBA'); im = im.crop(im.getbbox())
    w = 216; out = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    out.save(f'assets/castles/game/{el}.png', optimize=True)
