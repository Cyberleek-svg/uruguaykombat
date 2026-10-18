import glob, os
from collections import Counter
from PIL import Image

for p in sorted(glob.glob("public/assets/sprites/*.png")):
    im = Image.open(p).convert("RGB")
    name = os.path.basename(p)
    w, h = im.size
    corners = [im.getpixel((0, 0)), im.getpixel((w - 1, 0)), im.getpixel((0, h - 1)), im.getpixel((w - 1, h - 1))]
    c = Counter(im.getdata())
    top = c.most_common(5)
    print(f"{name}")
    print(f"   esquinas: {corners}")
    print(f"   colores mas usados: {[(col, f'{n*100/(w*h):.0f}%') for col, n in top]}")
