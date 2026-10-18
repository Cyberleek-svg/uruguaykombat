# 🥊 Uruguay Kombat — FA vs Derecha

Juego de pelea 2D 1v1 hecho con **Phaser 3 + Vite + Electron**.
4 luchadores, IA por distancia, hitstop estilo arcade, escenario con parallax de 3 capas.

## 🎮 Jugar online

_(URL publica: pendiente de definir)_

## ▶️ Correr en desarrollo

```bash
npm install
npm run dev          # solo el juego en el navegador (http://localhost:5173)
npm run electron:dev  # juego + ventana de Electron
```

## 📦 Empaquetar para Windows

```bash
npm run electron:pack   # genera release/Uruguay Kombat Setup 1.0.0.exe
```

## 🕹️ Controles

| Acción | Jugador 1 (teclado) | Gamepad |
|---|---|---|
| Mover / navegar | Flechas o A-D | D-pad / stick izquierdo |
| Saltar | W / ↑ | A (botón 0) |
| Golpe | J | X (botón 2) |
| Especial | K | B (botón 1) |
| Confirmar | ENTER | START (botón 9) |
| Volver / ESC | ESC | B (botón 1) |
| Silenciar música | M | — |

## 🗺️ Flujo de escenas

`Boot → Menú → Selección → Versus → Pelea → Game Over → (ENTER) Selección`
ESC retrocede en todos los menús; en Game Over vuelve a la selección.

## 📁 Estructura

```
src/game/
  config.js            # constantes: hitbox, offsets de escenario, música, roster
  scenes/
    BootScene.js       # carga reales + placeholders procedurales de todo
    MenuScene.js       # menú principal (incluye botón de donación)
    SelectScene.js     # selección de personaje por pasos
    VersusScene.js     # pantalla de enfrentamiento
    GameScene.js       # la pelea (HUD, hitboxes, KO, partículas)
    GameOverScene.js   # pantalla de derrota / reintento
  entities/
    Fighter.js         # máquina de estados estricta + física + hitstop
    AI.js              # IA enemiga por distancia
  systems/
    Roster.js          # data-driven: Orsi, Lacalle Pou, Mujica, Ojeda
    InputManager.js    # teclado + Gamepad API nativa
    AudioManager.js    # música + beeps Web Audio (hit/attack/special/ko)
    StageBuilder.js    # 3 capas de parallax + deriva de nubes
    SceneFlow.js       # transiciones sin apilar escenas
public/assets/         # tus imágenes y audio reales (ver ASSETS_FALTANTES.md)
electron/              # main.js (sandbox + contextIsolation) y preload.js
```

## 🎨 Assets

Los spritesheets, sonidos y capas que faltan están listados en
[`ASSETS_FALTANTES.md`](./ASSETS_FALTANTES.md) con la medida exacta de cada archivo.
Mientras no existan, el juego genera **placeholders procedurales** y nunca se rompe.

## 🌐 Despliegue

Cada push a `master` compila con Vite y publica en GitHub Pages vía
`.github/workflows/deploy-pages.yml` (Settings → Pages → Source: **GitHub Actions**).

## 💰 Donaciones

Constante `DONATION_LINK` en `src/game/scenes/MenuScene.js`.
Dejala vacía (`""`) y el botón queda deshabilitado.
