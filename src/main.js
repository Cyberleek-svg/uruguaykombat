import Phaser from 'phaser';
import { gameConfig } from './game/config.js';

window.addEventListener('load', () => {
  window.game = new Phaser.Game(gameConfig);

  // Silencio global (musica + beeps). Phaser mutea el SoundManager; los beeps
  // van por AudioContext crudo pero AudioManager chequea este mismo mute.
  window.addEventListener('keydown', (e) => {
    if (e.key === 'm' || e.key === 'M') {
      const g = window.game;
      if (g && g.sound) g.sound.mute = !g.sound.mute;
    }
  });
});