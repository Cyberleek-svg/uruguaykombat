// Musica de fondo, beeps de eventos y control de volumen unico del juego.
import { MUSIC } from '../config.js';

export class AudioManager {
  static sharedCtx = null;
  static currentMusic = null;
  static currentKey = null;
  static currentVoice = null;

  constructor(scene) {
    this.scene = scene;
    if (!AudioManager.sharedCtx) {
      try {
        AudioManager.sharedCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        AudioManager.sharedCtx = null;
      }
    }
    this.ctx = AudioManager.sharedCtx;
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  // --- Musica de fondo ---------------------------------------------------
  // Reproduce (en loop) la pista indicada. Si ya esta sonando, no hace nada.
  //
  // Comportamiento si falta el archivo:
  //   * menu_music   -> silencio.
  //   * battle_music -> sigue sonando la del menu (nunca quedamos a puro silencio).
  playMusic(key, volume) {
    try {
      const sound = this.scene && this.scene.sound;
      if (!sound || !key) return;
      if (AudioManager.currentKey === key) return; // ya suena esta pista
      if (!this.scene.cache.audio.exists(key)) {
        if (!AudioManager._avisado) {
          AudioManager._avisado = {};
          AudioManager._avisado[key] = true;
          console.warn(`[AudioManager] Falta la pista "${key}" -> se mantiene la que ya suena (o silencio). Ponela en public/assets/audio/ para que suene.`);
        }
        return;
      }
      AudioManager.stopMusic();
      const vol = typeof volume === 'number' ? volume : (MUSIC.volume || 0.42);
      const music = sound.add(key, { loop: true, volume: vol });
      music.play();
      AudioManager.currentMusic = music;
      AudioManager.currentKey = key;
    } catch (e) {
      console.warn('[AudioManager] playMusic omitido:', e.message);
    }
  }

  stopMusic() {
    AudioManager.stopMusic();
  }

  static stopMusic() {
    if (AudioManager.currentMusic) {
      try { AudioManager.currentMusic.stop(); AudioManager.currentMusic.destroy(); } catch (e) { /* ignore */ }
      AudioManager.currentMusic = null;
      AudioManager.currentKey = null;
    }
  }

  // El boton "mute" de Phaser mutea todo lo del SoundManager (musica), pero los
  // beeps van por AudioContext crudo: chequeamos el mute a mano.
  get muted() {
    try { return !!(this.scene && this.scene.game && this.scene.game.sound && this.scene.game.sound.mute); } catch (e) { return false; }
  }

  beep(freq = 440, dur = 0.08, type = 'square', gain = 0.12) {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  hit() { this.beep(220, 0.06, 'sawtooth', 0.15); }
  attack() { this.beep(660, 0.05, 'square', 0.1); }
  special_start() {
    this.beep(330, 0.12, 'triangle', 0.18);
    if (this.scene && this.scene.time) this.scene.time.delayedCall(120, () => this.beep(550, 0.12, 'triangle', 0.18));
  }
  ko() { this.beep(150, 0.4, 'sawtooth', 0.2); }
  select() { this.beep(880, 0.05, 'sine', 0.1); }

  playVoice(id) {
    try {
      if (this.muted) return;
      const sound = this.scene && this.scene.sound;
      if (!sound) return;
      // No interrumpir un voice que ya esta sonando.
      if (AudioManager.currentVoice && AudioManager.currentVoice.isPlaying) return;
      const keys = [];
      for (let i = 1; i <= 5; i++) {
        const k = `voice_${id}_${i}`;
        if (this.scene.cache.audio.exists(k)) keys.push(k);
      }
      if (keys.length === 0) return;
      const key = keys[Math.floor(Math.random() * keys.length)];
      const v = sound.add(key, { volume: 0.75 });
      v.play();
      AudioManager.currentVoice = v;
      const clear = () => { if (AudioManager.currentVoice === v) AudioManager.currentVoice = null; };
      v.on('complete', clear);
      v.on('destroy', clear);
    } catch (e) {
      console.warn('[AudioManager] playVoice omitido:', e.message);
    }
  }
}