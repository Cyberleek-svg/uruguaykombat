# ASSETS FALTANTES — Uruguay Kombat

Estado de los assets respecto al **Contrato de Assets**.

## Ya provistos (y en uso) ✅

Estos archivos ya los subiste y el juego los carga automáticamente desde `/public/assets`:

| Archivo | Ruta | Estado |
|---|---|---|
| `stage_bg.png` | `public/assets/stages/stage_bg.png` | ✅ 1920x1080, fondo (parallax capa 1) |
| `stage_mid.png` | `public/assets/stages/stage_mid.png` | ✅ 1920x1080, capa media (parallax capa 2) |
| `stage_fg.png` | `public/assets/stages/stage_fg.png` | ✅ 1920x1080, primer plano (parallax capa 3) |
| `menu_bg.png` | `public/assets/ui/menu_bg.png` | ✅ 1280x720, fondo del menú |
| `select_bg.png` | `public/assets/ui/select_bg.png` | ✅ 1280x720, fondo de selección |
| `portraits/orsi.png` | `public/assets/portraits/orsi.png` | ✅ 256x256, selector + HUD + pantalla VS |
| `portraits/lacalle.png` | `public/assets/portraits/lacalle.png` | ✅ 256x256, selector + HUD + pantalla VS |
| `portraits/mujica.png` | `public/assets/portraits/mujica.png` | ✅ 256x256, selector + HUD + pantalla VS |
| `portraits/ojeda.png` | `public/assets/portraits/ojeda.png` | ✅ 256x256, selector + HUD + pantalla VS |
| `spark.png` | `public/assets/particles/spark.png` | ✅ 40x40, partícula de impacto (en uso) |

> ⚠️ **Corrección aplicada a tus escenarios:** `stage_mid.png` y `stage_fg.png` estaban exportados en
> 24 bits **sin canal alpha**, con el "cielo" en **blanco sólido**. Eso tapaba las capas de atrás y
> rompía el parallax. Se les quitó el blanco (solo el blanco del fondo; los blancos internos se
> conservan) y ahora son PNG de 32 bits con transparencia.
> **Para futuras exportaciones: exportá siempre con fondo transparente (PNG-24/32 con alpha).**

> 📐 **Línea de piso:** el piso visible de `stage_fg.png` arranca en el píxel **y = 892** de 1080
> → equivale a **y = 595** en pantalla (1280x720). Los personajes apoyan los pies exactamente ahí.
> Si cambiás el escenario, ajustá `GROUND_TOP` en `src/game/config.js` (o dejá que se autodetecte).

> 🏛️ **Medición de las capas (para el encaje del palacio):**
> - `stage_fg.png`: contenido de **y 892 → 1080** (solo el piso).
> - `stage_mid.png`: contenido de **y 362 → 1080** (arranca en la punta del palacio y baja hasta
>   el borde inferior, así que su base queda tapada por el piso — está bien).
> - `stage_bg.png`: cubre todo (1920x1080, sin alpha).
>
> Por eso el palacio se ajusta con `STAGE_OFFSETS.mid.y` (ver *Ajuste fino* más abajo).

---

## Faltantes — hay que crearlos ⬜

### 1) Spritesheets de personajes ✅ GENERADOS AUTOMÁTICAMENTE

Los 20 archivos ya están creados en `public/assets/sprites/` a partir de las hojas
`raw_orsi.jpg`, `raw_lacalle.jpg`, `raw_mujica.jpg` y `raw_ojeda.jpg` (grilla 4×3)
mediante `tools/process_sprites.py`. El script hizo: recorte de cada celda con margen
de 8 px, chroma key del fondo verde, detección de bounding box, escalado a ~185 px
de alto, centrado horizontal y anclaje de pies en y = 238, y ensamblado de las 5
tiras por personaje.

| Archivo | Ruta | Frames | Dimensiones | Estado |
|---|---|---|---|---|
| `orsi_idle.png` | `public/assets/sprites/orsi_idle.png` | 6 | 1536×256 | ✅ generado |
| `orsi_walk.png` | `public/assets/sprites/orsi_walk.png` | 8 | 2048×256 | ✅ generado |
| `orsi_attack.png` | `public/assets/sprites/orsi_attack.png` | 5 | 1280×256 | ✅ generado (hitbox activo en frame 3) |
| `orsi_hit.png` | `public/assets/sprites/orsi_hit.png` | 3 | 768×256 | ✅ generado |
| `orsi_special.png` | `public/assets/sprites/orsi_special.png` | 12 | 3072×256 | ✅ generado |
| `lacalle_idle.png` | `public/assets/sprites/lacalle_idle.png` | 6 | 1536×256 | ✅ generado |
| `lacalle_walk.png` | `public/assets/sprites/lacalle_walk.png` | 8 | 2048×256 | ✅ generado |
| `lacalle_attack.png` | `public/assets/sprites/lacalle_attack.png` | 5 | 1280×256 | ✅ generado |
| `lacalle_hit.png` | `public/assets/sprites/lacalle_hit.png` | 3 | 768×256 | ✅ generado |
| `lacalle_special.png` | `public/assets/sprites/lacalle_special.png` | 12 | 3072×256 | ✅ generado |
| `mujica_idle.png` | `public/assets/sprites/mujica_idle.png` | 6 | 1536×256 | ✅ generado |
| `mujica_walk.png` | `public/assets/sprites/mujica_walk.png` | 8 | 2048×256 | ✅ generado |
| `mujica_attack.png` | `public/assets/sprites/mujica_attack.png` | 5 | 1280×256 | ✅ generado |
| `mujica_hit.png` | `public/assets/sprites/mujica_hit.png` | 3 | 768×256 | ✅ generado |
| `mujica_special.png` | `public/assets/sprites/mujica_special.png` | 12 | 3072×256 | ✅ generado |
| `ojeda_idle.png` | `public/assets/sprites/ojeda_idle.png` | 6 | 1536×256 | ✅ generado |
| `ojeda_walk.png` | `public/assets/sprites/ojeda_walk.png` | 8 | 2048×256 | ✅ generado |
| `ojeda_attack.png` | `public/assets/sprites/ojeda_attack.png` | 5 | 1280×256 | ✅ generado |
| `ojeda_hit.png` | `public/assets/sprites/ojeda_hit.png` | 3 | 768×256 | ✅ generado |
| `ojeda_special.png` | `public/assets/sprites/ojeda_special.png` | 12 | 3072×256 | ✅ generado |

**Secuencias usadas (índices de la grilla 4×3, row-major):**
- `idle` → cuadros 1, 2, 1, 2, 1, 2
- `walk` → cuadros 3, 4, 3, 4, 3, 4, 3, 4
- `attack` → cuadros 1, 5, 6, 5, 1 (golpe conecta en el frame 3)
- `hit` → cuadros 9, 10, 11
- `special` → cuadros 1, 7, 8, 6 repetidos (12 frames)

> ⚠️ Las hojas originales (`raw_*.jpg`) se movieron a la **raíz del proyecto** (fuera de
> `public/`) para no inflar el bundle. Si querés re-procesarlas, volvé a ponerlas en
> `public/assets/sprites/` y corré `python tools/process_sprites.py`.

> 📐 Las poses de los personajes en la grilla original tienen tamaños distintos (algunos
> con brazos extendidos), así que los frames quedan con anchos variables dentro del
> frame de 256 px. Si querés un look más uniforme, reexportá la grilla con poses
> centradas y volvé a correr el script.

### 2) Retratos de personajes ✅ YA PROVISTOS

Ya están cargados y usados en **tres** lugares (Selector, HUD de la pelea y pantalla VS):
`public/assets/portraits/{orsi,lacalle,mujica,ojeda}.png` — 256x256, se escalan sin deformar
(150x150 en el selector, 260x260 en la pantalla VS, 72x72 en el HUD).

> 📝 **Nota sobre el formato:** los que subiste son PNG de **256x256 sin canal alpha** (imagen
> completa de borde a borde). Se ven bien tal cual, porque entran dentro del recuadro. Solo
> tendrías que reexportarlos con **transparencia** si quisieras que el **fondo de la cara se
> vea** por arriba del recuadro (una silueta recortada). No hace falta por ahora.

### 3) Efectos de sonido

Formato `.mp3`. Actualmente se usan **beeps temporales** generados por Web Audio.

| Archivo | Ruta | Evento |
|---|---|---|
| `hit.mp3` | `public/assets/audio/hit.mp3` | Impacto / daño recibido |
| `attack.mp3` | `public/assets/audio/attack.mp3` | Inicio de golpe básico |
| `special_start.mp3` | `public/assets/audio/special_start.mp3` | Inicio de ataque especial |
| `ko.mp3` | `public/assets/audio/ko.mp3` | K.O. / fin de pelea |

### 4) Música de fondo ⭐ (nuevo)

Formato `.mp3`, en **loop**. Se encarga solo: no hay que tocar código.

| Archivo | Ruta | Dónde suena | Estado |
|---|---|---|---|
| `menu_music.mp3` | `public/assets/audio/menu_music.mp3` | Menú + selección + pantalla VS + pantalla de K.O. | ✅ **Ya lo subiste** (3:48, en loop, verificado) |
| `battle_music.mp3` | `public/assets/audio/battle_music.mp3` | Durante la pelea | ❌ **Falta** |

> Mientras falte `battle_music.mp3`, **en la pelea sigue sonando la del menú** (nunca te quedás
> en silencio). En cuanto subas ese archivo, la pelea usa su propia música automáticamente.

**Recomendaciones:**
- Que el **final enganche con el principio** (loop sin silencio), si no se nota el corte.
- ~1 a 3 minutos alcanza, porque se repite.
- El volumen se ajusta en `MUSIC.volume` de `src/game/config.js` (hoy 0.42).
- En el juego, la tecla **M** apaga/prende todo el sonido.
- Si los archivos no existen, **el juego corre en silencio** (sin errores, todo jugable).

### 5) Capas extra del escenario (opcional)

| Archivo | Ruta | Formato | Para qué |
|---|---|---|---|
| `stage_clouds.png` | `public/assets/stages/stage_clouds.png` | 1920x1080, PNG **transparente**, SOLO las nubes | Las nubes se mueven solas, por delante del fondo |
| `vs_bg.png` | `public/assets/ui/vs_bg.png` | 1280x720 PNG | Fondo propio de la pantalla VS (si falta, usa `select_bg`) |

> ☁️ **Las nubes que se mueven:** hoy el fondo tiene un movimiento suave, pero para que
> **tus** nubes se muevan hay que separarlas en `stage_clouds.png` — o sea, exportá tu fondo
> dos veces: `stage_bg.png` **sin** las nubes, y `stage_clouds.png` con **solo** las nubes
> (fondo transparente). El juego las superpone y las hace derivar solas.
>
> 🚫 **¿Y un GIF?** No sirve: Phaser (con `load.image`) solo muestra el **primer cuadro** de
> un GIF, no lo anima. Tendrías un GIF congelado. Las opciones que sí funcionan son:
> 1. **PNG separado** + el movimiento lo hace el código (recomendado, es lo de arriba).
> 2. **Spritesheet** (PNG horizontal con varios cuadros) y yo te lo animo — sirve si querés
>    que las nubes además *cambien de forma*, no solo que se corran.

### 7) Voces por personaje (nuevo)
Formato `.mp3`. Se reproducen **aleatoriamente** (uno de los 5) cada vez que el jugador da un golpe básico. Si un voice ya está sonando, no se interrumpe (no se solapa). La música de fondo nunca se corta.

Ruta: `public/assets/audio/voices/<id>_1.mp3` ... `<id>_5.mp3`

| Archivo | Ruta | Personaje |
|---|---|---|
| `orsi_1.mp3` … `orsi_5.mp3` | `public/assets/audio/voices/orsi_*.mp3` | Orsi |
| `lacalle_1.mp3` … `lacalle_5.mp3` | `public/assets/audio/voices/lacalle_*.mp3` | Lacalle Pou |
| `mujica_1.mp3` … `mujica_5.mp3` | `public/assets/audio/voices/mujica_*.mp3` | Mujica |
| `ojeda_1.mp3` … `ojeda_5.mp3` | `public/assets/audio/voices/ojeda_*.mp3` | Ojeda |

> Mientras falten, el juego corre igual (sin voice). Al subirlos, se reproducen automáticamente.

`public/assets/particles/spark.png` (40x40) está cargada y en uso en los golpes.
El motor la escala solo para que un archivo de cualquier tamaño se vea igual.

> **Importante sobre los mensajes de la consola:** mientras falte un `.mp3` (hoy `battle_music`)
> o un PNG opcional (`stage_clouds`, `vs_bg`), la consola muestra mensajes como
> `Failed to process file: ... audio battle_music` o `Unable to decode audio data`.
> **No son errores del juego**: es Phaser avisando que el archivo no está. El juego corre
> igual y 100% jugable. Al subir los archivos reales, esos mensajes desaparecen solos.

---

## 🔧 Ajuste fino del escenario

El palacio (capa del medio, `stage_mid.png`) se puede subir o bajar. Hay dos formas:

1. **En vivo, en el juego:** en la pelea, apretá **`[`** para bajarlo y **`]`** para subirlo.
   Arriba a la izquierda aparece el valor exacto (`PALACIO (mid.y) = -30px`).
2. **Fijo, en el código:** `src/game/config.js` → `STAGE_OFFSETS.mid.y`
   (negativo = hacia arriba, positivo = hacia abajo). Hoy está en **-30**.

Ahí mismo, en `STAGE_OFFSETS`, podés mover también `bg` (fondo) y `fg` (piso), y en
`STAGE_DRIFT` la velocidad del movimiento del fondo y las nubes.

---

_Última actualización: generado por el equipo de desarrollo. Los assets de `public/` se copian a `dist/` en el build._
