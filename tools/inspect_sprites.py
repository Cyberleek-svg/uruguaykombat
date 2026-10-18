import glob, os
from PIL import Image

for p in sorted(glob.glob("public/assets/sprites/*.png")):
    im = Image.open(p)
    w, h = im.size
    name = os.path.basename(p)
    anim = name.split("_", 1)[1].replace(".png", "") if "_" in name else "?"
    fw = w / 256
    fh = h / 256
    alpha = im.mode in ("RGBA", "LA") or "transparency" in im.info
    print(f"{name}: {w}x{h}  mode={im.mode}  alpha={alpha}  ->  ancho/256={fw:.2f}  alto/256={fh:.2f}")

    # Si el alto NO es 256, medimos el contenido real (bounding box de lo no-transparente)
    if im.mode in ("RGBA", "LA"):
        bbox = im.getchannel("A").getbbox()
        if bbox:
            print(f"    contenido visible: x={bbox[0]}..{bbox[2]}  y={bbox[1]}..{bbox[3]}  (w={bbox[2]-bbox[0]}, h={bbox[3]-bbox[1]})")
