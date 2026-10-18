// Construye el escenario (3 capas de parallax + nubes opcionales) y les da
// movimiento suave. Lo comparten GameScene y VersusScene.
//
// Movimiento: en vez de hacer scroll infinito (que muestra una costura si el
// PNG no es seamless), cada capa se agranda un pelo y deriva de ida y vuelta.
// Asi nunca se ve el borde y el fondo queda siempre "vivo".
import { GAME_WIDTH, GAME_HEIGHT, STAGE_OFFSETS, STAGE_DRIFT } from '../config.js';

export function buildStage(scene) {
  const W = GAME_WIDTH, H = GAME_HEIGHT;
  const cx = W / 2, cy = H / 2;
  const off = STAGE_OFFSETS || {};
  const d = STAGE_DRIFT || {};
  const layers = {};

  // --- Capa 1: fondo (cielo + nubes si vienen pegadas) ---
  if (scene.textures.exists('stage_bg')) {
    const s = d.bgOverscale || 1;
    layers.bg = scene.add.image(cx + (off.bg?.x || 0), cy + (off.bg?.y || 0), 'stage_bg')
      .setDisplaySize(W * s, H * s)
      .setScrollFactor(0);
  } else {
    const g = scene.add.graphics();
    g.fillGradientStyle(0x1a237e, 0x1a237e, 0x0d1b3e, 0x0d1b3e, 1);
    g.fillRect(0, 0, W, H);
    layers.bg = g;
  }

  // --- Nubes: capa OPCIONAL (public/assets/stages/stage_clouds.png) ---
  // Es el único archivo que hace falta crear para que las nubes se muevan solas.
  if (scene.textures.exists('stage_clouds')) {
    const s = d.cloudsOverscale || 1;
    layers.clouds = scene.add.image(cx + (off.clouds?.x || 0), cy + (off.clouds?.y || 0), 'stage_clouds')
      .setDisplaySize(W * s, H * s)
      .setScrollFactor(0)
      .setAlpha(typeof d.cloudsAlpha === 'number' ? d.cloudsAlpha : 1);
  }

  // --- Capa 2: medio (palacio / edificios) ---
  if (scene.textures.exists('stage_mid')) {
    layers.mid = scene.add.image(cx + (off.mid?.x || 0), cy + (off.mid?.y || 0), 'stage_mid')
      .setDisplaySize(W, H)
      .setScrollFactor(0);
  }

  // --- Capa 3: primer plano (piso) ---
  if (scene.textures.exists('stage_fg')) {
    layers.fg = scene.add.image(cx + (off.fg?.x || 0), cy + (off.fg?.y || 0), 'stage_fg')
      .setDisplaySize(W, H)
      .setScrollFactor(0);
  }

  // --- Movimiento suave ---
  if (d.enabled !== false) {
    drift(scene, layers.bg, d.bgPx, d.bgDur);
    drift(scene, layers.clouds, d.cloudsPx, d.cloudsDur);
  }

  return layers;
}

// Deriva horizontal de ida y vuelta (sin costura, sin bordes visibles).
function drift(scene, img, px, dur) {
  if (!img || !img.x || !px || px <= 0) return;
  const from = img.x - px / 2;
  const to = img.x + px / 2;
  scene.tweens.add({
    targets: img,
    x: { from, to },
    duration: Math.max(1000, dur || 30000),
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
}
