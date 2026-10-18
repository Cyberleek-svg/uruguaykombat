// Musica de fondo, beeps de eventos y control de volumen unico del juego.
import { MUSIC, VOICE_VOLUME, SFX_VOLUME, KO_VOLUME } from '../config.js';

export class AudioManager {
  static sharedCtx = null;
  static currentMusic = null;
  static currentKey = null;
  static currentVoice = null;
  static musicBase = 0;     // volumen "normal" de la pista que suena
  static ducked = false;    // true mientras suena una voz (la musica baja)

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
      const vol = AudioManager.volumeFor(key, volume);
      // Ya suena esta pista (o falta el archivo y sigue la anterior): solo se
      // reajusta el volumen al que corresponde a esta pantalla.
      if (AudioManager.currentKey === key) { AudioManager.setMusicVolume(vol); return; }
      if (!this.scene.cache.audio.exists(key)) {
        AudioManager._avisado = AudioManager._avisado || {};
        if (!AudioManager._avisado[key]) {
          AudioManager._avisado[key] = true;
          console.warn(`[AudioManager] Falta la pista "${key}" -> se mantiene la que ya suena (o silencio). Ponela en public/assets/audio/ para que suene.`);
        }
        // La pelea sin su musica propia usa la del menu, pero con el volumen de batalla.
        if (AudioManager.currentMusic) AudioManager.setMusicVolume(vol);
        return;
      }
      AudioManager.stopMusic();
      const music = sound.add(key, { loop: true, volume: vol });
      music.play();
      AudioManager.currentMusic = music;
      AudioManager.currentKey = key;
      AudioManager.musicBase = vol;
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
    AudioManager.ducked = false;
  }

  // Volumen que corresponde a cada pista (menu vs. pelea), salvo que se pida otro.
  static volumeFor(key, volume) {
    if (typeof volume === 'number') return volume;
    return key === MUSIC.battle ? MUSIC.battleVolume : MUSIC.volume;
  }

  static setMusicVolume(base) {
    AudioManager.musicBase = base;
    const m = AudioManager.currentMusic;
    if (!m) return;
    try { m.volume = AudioManager.ducked ? base * MUSIC.duckFactor : base; } catch (e) { /* ignore */ }
  }

  // Baja (on=true) o devuelve (on=false) el volumen de la musica de fondo para que
  // las voces se escuchen por encima. Con transicion suave si la escena sigue viva.
  static duck(on, scene) {
    AudioManager.ducked = on;
    const m = AudioManager.currentMusic;
    if (!m) return;
    const target = on ? AudioManager.musicBase * MUSIC.duckFactor : AudioManager.musicBase;
    try {
      if (scene && scene.sys && scene.sys.isActive() && scene.tweens) {
        scene.tweens.add({ targets: m, volume: target, duration: on ? 80 : 350 });
      } else {
        m.volume = target;
      }
    } catch (e) {
      try { m.volume = target; } catch (e2) { /* ignore */ }
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

  // --- Efectos de eventos (.mp3 si existe, beep del codigo si falta) ---
  // key: identificador en cache ("fx_hit"...). vol permite atenuar efectos
  // puntuales (ej. el KO va al nivel de la musica, no al de los golpes).
  // Reproduce una instancia nueva (los golpes se solapan un poco) y la
  // destruye al terminar.
  sfx(key, beepFallback, vol = SFX_VOLUME) {
    try {
      const sound = this.scene && this.scene.sound;
      if (sound && this.scene.cache.audio.exists(key)) {
        const s = sound.add(key, { volume: vol });
        s.play();
        s.once('complete', () => { try { s.destroy(); } catch (e) { /* ya destruido */ } });
        return;
      }
    } catch (e) { /* si algo falla, sigue el beep */ }
    beepFallback();
  }

  hit() { this.sfx('fx_hit', () => this.beep(220, 0.06, 'sawtooth', 0.15)); }
  attack() { this.sfx('fx_attack', () => this.beep(660, 0.05, 'square', 0.1)); }
  special_start() {
    this.sfx('fx_special_start', () => {
      this.beep(330, 0.12, 'triangle', 0.18);
      if (this.scene && this.scene.time) this.scene.time.delayedCall(120, () => this.beep(550, 0.12, 'triangle', 0.18));
    });
  }
  ko() { this.sfx('fx_ko', () => this.beep(150, 0.4, 'sawtooth', 0.2), KO_VOLUME); }
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
      const v = sound.add(key, { volume: VOICE_VOLUME });
      v.play();
      AudioManager.currentVoice = v;
      // La musica baja mientras habla el personaje y vuelve cuando termina.
      AudioManager.duck(true, this.scene);
      const scene = this.scene;
      let restaurada = false;
      const clear = () => {
        if (AudioManager.currentVoice === v) AudioManager.currentVoice = null;
        if (!restaurada) { restaurada = true; AudioManager.duck(false, scene); }
      };
      // Al terminar se libera el sonido (si no, se acumulan objetos de audio sin uso).
      const liberar = () => { clear(); try { v.destroy(); } catch (e) { /* ya destruido */ } };
      v.once('complete', liberar);
      v.once('destroy', clear);
      // Red de seguridad: si 'complete' no llegara, la musica igual se restaura.
      if (scene.time) scene.time.delayedCall(((v.duration || 3) + 0.5) * 1000, liberar);
    } catch (e) {
      console.warn('[AudioManager] playVoice omitido:', e.message);
    }
  }
}