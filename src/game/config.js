import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { SelectScene } from './scenes/SelectScene.js';
import { VersusScene } from './scenes/VersusScene.js';
import { GameScene } from './scenes/GameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
// Altura de los stages en pixeles fuente (contrato de assets).
export const STAGE_SRC_HEIGHT = 1080;

export const FRAME = { w: 256, h: 256 };
export const HURTBOX = { w: 80, h: 180 };
export const HITBOX = { w: 60, h: 40 };
export const SPRITE_SCALE = 1.75;
// Contrato: "hitbox activo en el frame 3" -> cuenta desde 1 => indice 2 (0-based).
export const HITBOX_TRIGGER_FRAME = 2;

// Contrato de assets: cuantos frames trae CADA hoja de animacion y a que
// velocidad corre (estilo retro 10-12 FPS).
// La hoja se exporta horizontal: idle 1536x256, walk 2048x256, attack 1280x256,
// hit 768x256, special 3072x256.
export const ANIM_FRAMES = { idle: 6, walk: 8, attack: 5, hit: 3, special: 12 };
export const ANIM_FPS = { idle: 10, walk: 12, attack: 12, hit: 12, special: 12 };

// Hurtbox offset DENTRO del frame (source pixels, sin escalar).
// Phaser multiplica el offset por la escala del sprite por su cuenta.
export const HURTBOX_OFFSET_Y = (FRAME.h - HURTBOX.h) / 2 + 20; // 58 -> pegado a los pies
// Distancia (world px) entre el centro del sprite y la planta de los pies.
export const BODY_BOTTOM_OFFSET = SPRITE_SCALE * (HURTBOX_OFFSET_Y + HURTBOX.h - FRAME.h / 2);
// Distancia (world px) entre el centro del sprite y el centro del torso (para hitboxes).
export const BODY_CENTER_OFFSET = SPRITE_SCALE * (HURTBOX_OFFSET_Y + HURTBOX.h / 2 - FRAME.h / 2);
// Línea de piso visible del stage_fg (1920x1080 -> 1280x720).
// Valor de fallback: lo usa GameScene si BootScene no pudo detectar el piso.
// El piso del stage real (stage_fg.png) arranca en el pixel 892 de 1080 -> 595.
export const GROUND_TOP = 595;
// Piso del placeholder procedural (por si faltan los assets reales).
export const GROUND_TOP_PROCEDURAL = 687;

export const DONATION_LINK = '';

// ---------------------------------------------------------------------------
// AJUSTE DE LAS CAPAS DEL ESCENARIO (en px de PANTALLA, 1280x720)
// ---------------------------------------------------------------------------
// Cada capa se dibuja a pantalla completa. Con estos valores la movés/ajustás.
//   x: positivo = a la derecha    |  y: negativo = hacia ARRIBA
// El palacio (capa del medio) suele necesitar subir un poco para encajar con el piso.
export const STAGE_OFFSETS = {
  bg:  { x: 0, y: 0 },
  mid: { x: 0, y: -120 },   // <-- AJUSTA ACA: subir/bajar el palacio (+ abajo, - arriba)
  fg:  { x: 0, y: 0 },
};

// Movimiento suave de fondo y nubes (deriva de ida y vuelta, sin costuras).
export const STAGE_DRIFT = {
  enabled: true,
  bgPx: 34,            // recorrido total del fondo en px (sutil)
  bgDur: 42000,        // ms por tramo
  bgOverscale: 1.04,   // el fondo se agranda un pelo para poder moverse sin mostrar bordes
  cloudsPx: 110,       // recorrido total de las nubes en px (mas notorio)
  cloudsDur: 34000,
  cloudsOverscale: 1.16,
  cloudsAlpha: 0.9,
};

// Herramienta de calibracion en vivo: en el juego, tecla "[" y "]" mueven el
// palacio (capa del medio) y muestran el valor actual. Poner en false cuando
// ya este ajustado (no afecta nada si queda en true; solo responde a esas teclas).
export const STAGE_TUNE = false;

// Musica de fondo (archivos .mp3 opcionales en public/assets/audio/).
// Si el archivo no existe, el juego corre en silencio (no se rompe nada).
export const MUSIC = {
  menu: 'menu_music',
  battle: 'battle_music',
  volume: 0.42,
};

export const gameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#0a0a0a',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 2600 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, SelectScene, VersusScene, GameScene, GameOverScene],
  audio: {
    disableWebAudio: false,
  },
};