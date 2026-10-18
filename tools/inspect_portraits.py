"""Analiza los retratos y spark: detecta si tienen fondo solido (sin alpha)
y de que color, para decidir si conviene sacarles el fondo."""
import glob
import os
from collections import Counter

from PIL import Image

for f in sorted(glob.glob('public/assets/portraits/*.png')):
    im = Image.open(f).convert('RGBA')
    w, h = im.size
    px = im.load()
    # Esquinas y borde
    corners = [px[0, 0], px[w - 1, 0], px[0, h - 1], px[w - 1, h - 1]]
    # Colores del marco (1px de borde)
    border = []
    for x in range(w):
        border.append(px[x, 0])
        border.append(px[x, h - 1])
    for y in range(h):
        border.append(px[0, y])
        border.append(px[w - 1, y])
    comunes = Counter(border).most_common(3)
    alphas = {p[3] for p in border}
    print(f"\n=== {os.path.basename(f)} ({w}x{h}) ===")
    print(f"  esquinas: {corners}")
    print(f"  colores de borde mas comunes: {comunes}")
    print(f"  valores de alpha en el borde: {sorted(alphas)[:6]}{' ...' if len(alphas) > 6 else ''}")
    # % del borde que es un solo color
    top_color, top_n = comunes[0]
    print(f"  borde uniforme: {top_n * 100 // len(border)}% del borde es {top_color}")

print("\n\n=== spark.png ===")
im = Image.open('public/assets/particles/spark.png').convert('RGBA')
print('  size', im.size, 'alpha min/max', im.getchannel('A').getextrema())
