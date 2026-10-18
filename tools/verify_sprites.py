import glob, os
from PIL import Image
import numpy as np

for p in sorted(glob.glob("public/assets/sprites/*_idle.png")):
    name = os.path.basename(p).replace("_idle.png","")
    im = Image.open(p).convert("RGBA")
    w, h = im.size
    arr = np.array(im)
    # por frame
    print(f"\n{name} idle {w}x{h}:")
    for i in range(w//256):
        frame = arr[:, i*256:(i+1)*256, 3]
        ys, xs = np.where(frame > 10)
        if len(xs)==0:
            print(f"  frame {i}: VACIO")
            continue
        print(f"  frame {i}: bbox x={xs.min()}-{xs.max()} y={ys.min()}-{ys.max()}  alto={ys.max()-ys.min()+1}  ancho={xs.max()-xs.min()+1}  base_y={ys.max()}  verdes_rest={int(((arr[:,i*256:(i+1)*256,1]>180)&(arr[:,i*256:(i+1)*256,0]<70)&(arr[:,i*256:(i+1)*256,2]<70)&(arr[:,i*256:(i+1)*256,3]>10)).sum())}")
