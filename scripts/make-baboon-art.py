"""Convierte la imagen generada del babuino (líneas blancas sobre azul) en un WebP con transparencia.
Uso: python3 scripts/make-baboon-art.py scripts/src/babuino-blueprint-original.png public/img/babuino-lineas.webp
Las líneas claras pasan a opacidad y el fondo azul queda transparente, para fundirse con el plano."""
import sys
import numpy as np
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
a = np.asarray(Image.open(src).convert("RGB")).astype("float32") / 255.0
w = (a[..., 0] + a[..., 1]) / 2.0                     # el fondo azul tiene R y G casi nulos
alpha = np.clip((w - 0.10) / 0.55, 0, 1) ** 0.85
rgba = np.zeros(a.shape[:2] + (4,), dtype="float32")
rgba[..., 0], rgba[..., 1], rgba[..., 2] = 0.94, 0.97, 1.0
rgba[..., 3] = alpha
Image.fromarray((rgba * 255).astype("uint8"), "RGBA").save(out, "WEBP", quality=84, method=6)
print("ok", out, a.shape[1], "x", a.shape[0])
