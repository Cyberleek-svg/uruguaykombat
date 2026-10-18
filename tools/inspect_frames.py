import numpy as np
from PIL import Image

# Frames problemáticos detectados por la auditoría
casos = [
    ("ojeda_idle.png", [0,5]),
    ("ojeda_walk.png", [0,7]),
    ("orsi_walk.png", None),   # todos, para ver el rango
]

for fname, frames in casos:
    im = Image.open(f"public/assets/sprites/{fname}").convert("RGBA")
    arr = np.array(im)
    w = im.size[0]
    print(f"\n=== {fname} ({w}x{im.size[1]}) ===")
    n = w // 256
    idxs = frames if frames else list(range(n))
    for i in idxs:
        fr = arr[:, i*256:(i+1)*256]
        fa = fr[:,:,3]
        total_px = fa.size
        opacos = int((fa > 10).sum())
        semi = int(((fa > 0) & (fa <= 10)).sum())
        ys, xs = np.where(fa > 10)
        if len(xs) == 0:
            # buscar cualquier pixel no totalmente transparente
            ys2, xs2 = np.where(fa > 0)
            print(f"  frame {i}: SIN contenido opaco. pixeles con alpha>0: {len(xs2)} (max alpha={fa.max()})")
            if len(xs2) > 0:
                print(f"     bbox (alpha>0): x={xs2.min()}-{xs2.max()} y={ys2.min()}-{ys2.max()}")
        else:
            # histograma de alpha
            print(f"  frame {i}: opacos={opacos} semi={semi}  bbox x={xs.min()}-{xs.max()} y={ys.min()}-{ys.max()}  base_y={ys.max()}  alto={ys.max()-ys.min()+1}  ancho={xs.max()-xs.min()+1}")
            # color dominante (no transparente)
            rgb = fr[fa>10, :3]
            if len(rgb) > 0:
                print(f"     color medio RGB: {rgb.mean(axis=0).astype(int)}  min/max R={rgb[:,0].min()}-{rgb[:,0].max()}")
