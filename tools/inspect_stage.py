"""Analiza las capas del stage: tamano, canal alpha y bounding box de contenido."""
import sys
from PIL import Image

FILES = [
    ("stage_bg",  "public/assets/stages/stage_bg.png"),
    ("stage_mid", "public/assets/stages/stage_mid.png"),
    ("stage_fg",  "public/assets/stages/stage_fg.png"),
]

for name, path in FILES:
    try:
        im = Image.open(path)
    except Exception as e:
        print(f"{name}: ERROR {e}")
        continue
    print(f"\n=== {name} ({path}) ===")
    print(f"  size={im.size} mode={im.mode}")
    rgba = im.convert("RGBA")
    bbox = rgba.getbbox()  # bbox de pixeles no transparentes
    print(f"  content bbox (non-transparent) = {bbox}")
    # Analiza opacidad por fila (para saber hasta donde llega el contenido)
    w, h = rgba.size
    alpha = rgba.getchannel("A")
    rows = []
    for y in range(h):
        # muestreo rapido cada 4 px
        vals = list(alpha.crop((0, y, w, y + 1)).getdata())
        nz = sum(1 for v in vals[::4] if v > 8)
        rows.append(nz)
    top = next((y for y, n in enumerate(rows) if n > 0), None)
    bottom = next((y for y in range(h - 1, -1, -1) if rows[y] > 0), None)
    print(f"  first row with content: y={top}   last row with content: y={bottom}")
    # perfiles: cuantas columnas tienen contenido en algunas bandas
    bands = [(0, 100), (100, 200), (200, 300), (300, 400), (400, 500),
             (500, 600), (600, 700), (700, 800), (800, 892), (892, 1080)]
    for (a, b) in bands:
        tot = sum(rows[a:b])
        print(f"    rows {a:>4}-{b:<4}: content px (sampled) = {tot}")

# Compara con la linea de piso declarada
print("\n\nFloor line declared in code: source y = 892 (of 1080) -> screen 595 (of 720)")
