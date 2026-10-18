# -*- coding: utf-8 -*-
"""Quita metadatos (XMP/EXIF/texto) de los PNG y las etiquetas ID3 de los MP3.
No cambia ni un pixel ni el audio: verifica antes de reemplazar cada archivo.
Uso:  python tools/strip_metadata.py [carpeta ...]   (por defecto: public/assets)
"""
import os, sys, glob, tempfile, shutil
from PIL import Image

roots = sys.argv[1:] or ["public/assets"]


def png_has_meta(im):
    skip = {"dpi", "transparency", "gamma", "srgb", "icc_profile", "interlace"}
    return len(im.getexif()) > 0 or any(k not in skip for k in im.info)


def clean_png(path):
    im = Image.open(path)
    if not png_has_meta(im):
        return "limpio"
    meta = [k for k in im.info if k not in ("dpi", "transparency", "gamma", "srgb", "icc_profile", "interlace")]
    before = im.convert("RGBA").tobytes()
    out = Image.frombytes("RGBA", im.size, before) if im.mode in ("RGBA", "RGB", "L", "LA", "P") else im
    # Conserva el modo original cuando es posible (RGB/RGBA/L/LA)
    if im.mode in ("RGB", "L", "LA", "RGBA"):
        out = Image.frombytes(im.mode, im.size, im.tobytes())
    fd, tmp = tempfile.mkstemp(suffix=".png")
    os.close(fd)
    out.save(tmp, "PNG", optimize=True)  # sin exif / xmp / texto
    after = Image.open(tmp)
    if after.convert("RGBA").tobytes() != before or png_has_meta(after):
        os.remove(tmp)
        return "ERROR verificacion (no se toco)"
    shutil.move(tmp, path)
    return f"limpiado ({', '.join(meta)[:60]})"


def syncsafe(b):
    return (b[0] << 21) | (b[1] << 14) | (b[2] << 7) | b[3]


def clean_mp3(path):
    data = open(path, "rb").read()
    orig = len(data)
    notes = []
    if data[:3] == b"ID3":
        size = syncsafe(data[6:10]) + 10 + (10 if data[5] & 0x10 else 0)
        tag = data[:size]
        frames = []
        for fid in (b"TPE1", b"TPE2", b"TIT2", b"TALB", b"TENC", b"TCOP", b"COMM", b"TXXX", b"TSSE", b"WXXX"):
            i = tag.find(fid)
            if i != -1:
                frames.append(fid.decode() + "=" + tag[i + 10:i + 40].decode("latin-1", "ignore").strip("\x00\x03\x01 ")[:24])
        notes.append("ID3v2 " + str(size) + "B " + str(frames))
        data = data[size:]
    if len(data) >= 128 and data[-128:-125] == b"TAG":
        notes.append("ID3v1")
        data = data[:-128]
    if not notes:
        return "limpio"
    # El audio debe empezar con un frame MPEG valido (0xFF 0xEx)
    k = 0
    while k < len(data) - 1 and not (data[k] == 0xFF and (data[k + 1] & 0xE0) == 0xE0):
        k += 1
    data = data[k:]
    open(path, "wb").write(data)
    return f"limpiado ({'; '.join(notes)}) {orig}->{len(data)} bytes"


for root in roots:
    for p in sorted(glob.glob(os.path.join(root, "**", "*.*"), recursive=True)):
        ext = p.lower().rsplit(".", 1)[-1]
        if ext == "png":
            print(f"{p}: {clean_png(p)}")
        elif ext == "mp3":
            print(f"{p}: {clean_mp3(p)}")
        elif ext in ("jpg", "jpeg"):
            im = Image.open(p)
            exif = len(im.getexif())
            xmp = "xmp" in im.info or "XML:com.adobe.xmp" in im.info
            print(f"{p}: {'CON METADATOS (re-exportar a mano)' if exif or xmp else 'limpio'}")
