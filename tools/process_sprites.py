# -*- coding: utf-8 -*-
"""Procesa las hojas raw_*.jpg (grilla 4x3) en tiras de sprites 256x256.
Mejorado: connected components para eliminar basura, encuadre uniforme."""
import os, sys, glob
from collections import deque
import numpy as np
from PIL import Image

SPRITES_DIR = os.path.join("public", "assets", "sprites")
RAW_DIR = "art-src"  # hojas originales: fuera de public/ para que no se publiquen
TARGET_H = 185
CANVAS = 256
FEET_Y = 238
MARGIN = 8
TOL = 100

SEQUENCES = {
    "idle":   [1, 2, 1, 2, 1, 2],
    "walk":   [3, 4, 3, 4, 3, 4, 3, 4],
    "attack": [1, 5, 6, 5, 1],
    "hit":    [9, 10, 11],
    "special": [1, 7, 8, 6, 1, 7, 8, 6, 1, 7, 8, 6],
}
EXPECTED = {"idle": 6, "walk": 8, "attack": 5, "hit": 3, "special": 12}
MIN_COMPONENT_PX = 200  # componentes mas chicos se consideran basura


def cell_rects(w, h):
    cw = w / 4.0
    ch = h / 3.0
    rects = []
    for r in range(3):
        for c in range(4):
            x0 = int(round(c * cw)); y0 = int(round(r * ch))
            x1 = int(round((c + 1) * cw)); y1 = int(round((r + 1) * ch))
            x0 = min(x0 + MARGIN, x1 - 1); y0 = min(y0 + MARGIN, y1 - 1)
            x1 = max(x1 - MARGIN, x0 + 1); y1 = max(y1 - MARGIN, y0 + 1)
            rects.append((x0, y0, x1, y1))
    return rects


def chroma_key(arr_rgb):
    """Devuelve (rgba_array, bg_color). arr_rgb: HxWx3 uint8."""
    h, w, _ = arr_rgb.shape
    corners = np.array([arr_rgb[0, 0], arr_rgb[0, w-1], arr_rgb[h-1, 0], arr_rgb[h-1, w-1]], dtype=np.int16)
    bg = corners.mean(axis=0)
    if not (bg[1] > 150 and bg[0] < 90 and bg[2] < 90):
        bg = np.array([0, 255, 0], dtype=np.int16)
    diff = arr_rgb.astype(np.int16) - bg[None, None, :]
    dist = np.sqrt((diff ** 2).sum(axis=2))
    alpha = np.ones((h, w), dtype=np.uint8) * 255
    alpha[dist <= TOL] = 0
    soft = TOL * 1.6
    ramp = (dist > TOL) & (dist < soft)
    k = (dist[ramp] - TOL) / (soft - TOL)
    alpha[ramp] = np.clip(255 * k, 0, 255).astype(np.uint8)
    # decontaminacion del canal verde en bordes semi-transparentes
    rgb = arr_rgb.astype(np.float32).copy()
    mask = (alpha > 0) & (alpha < 255)
    greenness = (rgb[:, :, 1] - np.maximum(rgb[:, :, 0], rgb[:, :, 2])).clip(0, 255)
    decont = mask & (greenness > 60)
    rgb[:, :, 1][decont] = (rgb[:, :, 1][decont] * 0.55 + rgb[:, :, 0][decont] * 0.25 + rgb[:, :, 2][decont] * 0.20)
    rgba = np.dstack([rgb.astype(np.uint8), alpha])
    return rgba, tuple(int(x) for x in bg)


def largest_component(mask):
    """Devuelve mask con solo el componente conectado mas grande (4-conectado)."""
    h, w = mask.shape
    labels = np.zeros((h, w), dtype=np.int32)
    label_id = 0
    sizes = {}
    # BFS
    for sy in range(h):
        for sx in range(w):
            if mask[sy, sx] and labels[sy, sx] == 0:
                label_id += 1
                # BFS
                q = deque()
                q.append((sy, sx))
                labels[sy, sx] = label_id
                cnt = 0
                while q:
                    y, x = q.popleft()
                    cnt += 1
                    for ny, nx in ((y-1, x), (y+1, x), (y, x-1), (y, x+1)):
                        if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and labels[ny, nx] == 0:
                            labels[ny, nx] = label_id
                            q.append((ny, nx))
                sizes[label_id] = cnt
    if not sizes:
        return mask
    # mantener solo el mas grande (y otros grandes, > 20% del mas grande)
    biggest = max(sizes, key=lambda k: sizes[k])
    threshold = max(MIN_COMPONENT_PX, sizes[biggest] * 0.15)
    keep = np.zeros((h, w), dtype=bool)
    for lid, sz in sizes.items():
        if sz >= threshold:
            keep |= (labels == lid)
    return keep


def process_cell(cell_img):
    arr = np.array(cell_img.convert("RGB"), dtype=np.uint8)
    rgba, bg = chroma_key(arr)
    alpha = rgba[:, :, 3]
    # mantener solo el componente mas grande (elimina basura pequeña)
    mask = alpha > 10
    mask = largest_component(mask)
    rgba[:, :, 3] = np.where(mask, rgba[:, :, 3], 0)
    # tambien poner RGB a 0 donde alpha 0 (limpieza)
    rgba[:, :, :3] = np.where(rgba[:, :, 3:4] > 0, rgba[:, :, :3], 0)

    alpha2 = rgba[:, :, 3]
    ys, xs = np.where(alpha2 > 10)
    if len(xs) == 0:
        return Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    x0, x1 = int(xs.min()), int(xs.max())
    y0, y1 = int(ys.min()), int(ys.max())
    crop = Image.fromarray(rgba, "RGBA").crop((x0, y0, x1 + 1, y1 + 1))

    w, h = crop.size
    # escalar a TARGET_H de alto, limitar ancho a 240
    scale = TARGET_H / float(h)
    new_w = int(round(w * scale))
    new_h = int(round(h * scale))
    if new_w > 240:
        scale = 240.0 / w
        new_w = 240
        new_h = int(round(h * scale))
    crop_r = crop.resize((new_w, new_h), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    x_off = (CANVAS - new_w) // 2
    y_off = FEET_Y - new_h
    if y_off < 0:
        y_off = 0
    canvas.paste(crop_r, (x_off, y_off), crop_r)
    return canvas


def main():
    os.makedirs(SPRITES_DIR, exist_ok=True)
    raws = sorted(glob.glob(os.path.join(RAW_DIR, "raw_*.jpg")))
    if not raws:
        print("No se encontraron raw_*.jpg en", RAW_DIR)
        return
    force = "--force" in sys.argv
    if not force:
        print("MODO SEGURO: no se pisan sprites que ya existen (agrega --force para regenerarlos).")

    for raw_path in raws:
        name = os.path.basename(raw_path).replace("raw_", "").replace(".jpg", "")
        print(f"\n=== {name} ===")
        img = Image.open(raw_path)
        w, h = img.size
        rects = cell_rects(w, h)
        cells = []
        for i, (x0, y0, x1, y1) in enumerate(rects, start=1):
            cell = img.crop((x0, y0, x1, y1))
            proc = process_cell(cell)
            cells.append(proc)
            print(f"  celda {i}: {cell.size} -> procesada")

        for anim, seq in SEQUENCES.items():
            n = EXPECTED[anim]
            assert len(seq) == n
            strip = Image.new("RGBA", (n * CANVAS, CANVAS), (0, 0, 0, 0))
            for i, idx in enumerate(seq):
                frame = cells[idx - 1]
                strip.paste(frame, (i * CANVAS, 0), frame)
            out_path = os.path.join(SPRITES_DIR, f"{name}_{anim}.png")
            if os.path.exists(out_path) and not force:
                print(f"  (se conserva {name}_{anim}.png existente)")
                continue
            strip.save(out_path, "PNG", optimize=True)
            print(f"  -> {name}_{anim}.png  {strip.size}")

    print("\n=== VERIFICACION ===")
    ok = True
    for raw_path in raws:
        name = os.path.basename(raw_path).replace("raw_", "").replace(".jpg", "")
        for anim, n in EXPECTED.items():
            p = os.path.join(SPRITES_DIR, f"{name}_{anim}.png")
            if not os.path.exists(p):
                print(f"  FALTA: {p}"); ok = False; continue
            im = Image.open(p)
            if im.size != (n * CANVAS, CANVAS):
                print(f"  DIMENSION MAL: {p} = {im.size}"); ok = False
            elif im.mode != "RGBA":
                print(f"  SIN ALPHA: {p}"); ok = False
    print("TODO OK" if ok else "HAY ERRORES")


if __name__ == "__main__":
    main()
