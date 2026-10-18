import glob, os
import numpy as np
from PIL import Image

EXPECTED = {"idle": (6,1536), "walk": (8,2048), "attack": (5,1280), "hit": (3,768), "special": (12,3072)}

print("="*70)
print("AUDITORIA DE SPRITES")
print("="*70)

errores = []
for p in sorted(glob.glob("public/assets/sprites/*.png")):
    name = os.path.basename(p)
    im = Image.open(p).convert("RGBA")
    w, h = im.size
    arr = np.array(im)
    alpha = arr[:,:,3]

    # identificar anim
    anim = None
    for a in EXPECTED:
        if name.endswith(f"_{a}.png"):
            anim = a
            break
    exp_frames, exp_w = EXPECTED[anim]
    n_frames = w // 256

    # chequeos globales
    if h != 256:
        errores.append(f"{name}: alto {h} != 256")
    if w != exp_w:
        errores.append(f"{name}: ancho {w} != {exp_w} (esperado {exp_frames} frames)")
    if n_frames != exp_frames:
        errores.append(f"{name}: {n_frames} frames detectados, esperado {exp_frames}")
    if im.mode != "RGBA":
        errores.append(f"{name}: mode {im.mode} != RGBA")

    # verdes restantes (chroma key residual)
    verdes = int(((arr[:,:,0] < 70) & (arr[:,:,1] > 180) & (arr[:,:,2] < 70) & (arr[:,:,3] > 10)).sum())
    # pixeles casi-negros opacos (posibles lineas divisorias)
    negros = int(((arr[:,:,0] < 40) & (arr[:,:,1] < 40) & (arr[:,:,2] < 40) & (arr[:,:,3] > 200)).sum())
    # transparencia total
    transp = int((alpha == 0).sum())
    pct_transp = transp / (w*h) * 100

    print(f"\n{name}  {w}x{h}  frames={n_frames}  transp={pct_transp:.1f}%  verdes={verdes}  negros_opacos={negros}")

    # por frame
    bases = []
    anchos = []
    altos = []
    for i in range(n_frames):
        fr = arr[:, i*256:(i+1)*256]
        fa = fr[:,:,3]
        ys, xs = np.where(fa > 10)
        if len(xs) == 0:
            print(f"   frame {i}: VACIO (sin contenido)")
            errores.append(f"{name} frame {i}: vacio")
            continue
        x0,x1 = int(xs.min()), int(xs.max())
        y0,y1 = int(ys.min()), int(ys.max())
        bases.append(y1)
        anchos.append(x1-x0+1)
        altos.append(y1-y0+1)
        # detectar lineas divisorias verticales dentro del frame (columnas con >90% pixeles negros opacos)
        col_negros = (fr[:,:,0] < 40) & (fr[:,:,1] < 40) & (fr[:,:,2] < 40) & (fr[:,:,3] > 200)
        cols_sospechosas = [c for c in range(256) if col_negros[:,c].mean() > 0.85]
        if cols_sospechosas:
            print(f"   frame {i}: POSIBLE LINEA NEGRA vertical en cols {cols_sospechosas[:5]}{'...' if len(cols_sospechosas)>5 else ''}")

    if bases:
        print(f"   bases_y: min={min(bases)} max={max(bases)}  (target 238)  | anchos: min={min(anchos)} max={max(anchos)} | altos: min={min(altos)} max={max(altos)}")
        if max(bases) > 245 or min(bases) < 225:
            errores.append(f"{name}: base de pies fuera de rango [{min(bases)},{max(bases)}] (target ~238)")
        if verdes > 0:
            errores.append(f"{name}: {verdes} pixeles verdes residuales")
        if negros > 500:
            errores.append(f"{name}: {negros} pixeles negros opacos (posibles lineas divisorias)")

print("\n" + "="*70)
if errores:
    print(f"ERRORES DETECTADOS ({len(errores)}):")
    for e in errores:
        print("  - " + e)
else:
    print("SIN ERRORES: todos los sprites cumplen el contrato.")
print("="*70)
