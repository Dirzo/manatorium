# Exports the Pip icon to Play Store, iOS, Capacitor source and Android mipmap sizes.
# python3 export.py PXDIR OUTDIR [APPDIR]
from PIL import Image
import sys, os
px, od = sys.argv[1], sys.argv[2]; app = sys.argv[3] if len(sys.argv) > 3 else None
def up(im, size):
    # integer nearest upscale, then one smooth resample to the exact size: crisp, even pixels
    k = -(-size // im.width) * 4
    return im.resize((im.width * k, im.height * k), Image.NEAREST).resize((size, size), Image.LANCZOS)
full60 = Image.open(f'{px}/full.png').convert('RGBA'); fg60 = Image.open(f'{px}/fg.png'); bg60 = Image.open(f'{px}/bg.png').convert('RGB')
vis = (11, 11, 55, 55)  # the visible 72dp of the 108dp adaptive layer
icon = full60.crop(vis).convert('RGB'); fgv = fg60.crop(vis); bgv = bg60.crop(vis)
os.makedirs(od, exist_ok=True)
up(icon, 512).save(f'{od}/play-store-icon-512.png')
up(icon, 1024).save(f'{od}/app-icon-1024.png')
icon.save(f'{od}/app-icon-44px-source.png')
up(fg60, 1024).save(f'{od}/adaptive-foreground-1024.png'); up(bg60, 1024).save(f'{od}/adaptive-background-1024.png')
if app:
    up(icon, 1024).save(f'{app}/app/icons/icon-only.png')
    up(fg60, 1024).save(f'{app}/app/icons/icon-foreground.png')
    up(bg60, 1024).save(f'{app}/app/icons/icon-background.png')
    up(icon, 1024).save(f'{app}/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png')
    res = f'{app}/android/app/src/main/res'
    from PIL import ImageDraw
    for d, s in dict(ldpi=36, mdpi=48, hdpi=72, xhdpi=96, xxhdpi=144, xxxhdpi=192).items():
        f = f'{res}/mipmap-{d}'
        up(fgv, s).save(f'{f}/ic_launcher_foreground.png'); up(bgv, s).save(f'{f}/ic_launcher_background.png')
        sq = up(icon, s).convert('RGBA')
        m = Image.new('L', (s * 4, s * 4), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, s * 4 - 1, s * 4 - 1), radius=s * 4 // 6, fill=255)
        sq.putalpha(m.resize((s, s), Image.LANCZOS)); sq.save(f'{f}/ic_launcher.png')
        rd = up(icon, s).convert('RGBA'); m = Image.new('L', (s * 4, s * 4), 0); ImageDraw.Draw(m).ellipse((0, 0, s * 4 - 1, s * 4 - 1), fill=255)
        rd.putalpha(m.resize((s, s), Image.LANCZOS)); rd.save(f'{f}/ic_launcher_round.png')
print('ok')
