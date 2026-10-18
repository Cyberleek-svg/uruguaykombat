import { ROSTER } from '../systems/Roster.js';
import { InputManager } from '../systems/InputManager.js';
import { AudioManager } from '../systems/AudioManager.js';
import { goToScene } from '../systems/SceneFlow.js';
import { buildStage } from '../systems/StageBuilder.js';
import { MUSIC } from '../config.js';

const AUTO_ADVANCE_MS = 2800;

export class VersusScene extends Phaser.Scene {
  constructor() { super('VersusScene'); }

  init(data) {
    this.p1Id = (data && data.p1) || 'orsi';
    this.p2Id = (data && data.p2) || 'lacalle';
    this.mode = (data && data.mode) || 'cpu';
    this.done = false;
  }

  create() {
    this.audio = new AudioManager(this);
    this.inputMgr = new InputManager(this);
    this.audio.playMusic(MUSIC.menu);

    const resume = () => this.audio.resume();
    this.input.once('pointerdown', resume);
    this.input.keyboard.once('keydown', resume);

    const { width, height } = this.scale;

    // Fondo: vs_bg (opcional) -> select_bg -> escenario -> gradiente.
    // Se le suma el movimiento de nubes/fondo (StageBuilder).
    if (!this.textures.exists('vs_bg') && !this.textures.exists('select_bg')) {
      // Sin arte de menu: StageBuilder usa stage_bg + nubes.
      buildStage(this);
    } else {
      const bgKey = this.textures.exists('vs_bg') ? 'vs_bg' : 'select_bg';
      const g = this.add.graphics();
      g.fillGradientStyle(0x05050c, 0x05050c, 0x14142b, 0x14142b, 1);
      g.fillRect(0, 0, width, height);
      // Fondo de menu + nubes encima (se mueven solas).
      this.add.image(width / 2, height / 2, bgKey).setDisplaySize(width, height);
      if (this.textures.exists('stage_clouds')) {
        this.add.image(width / 2, height / 2, 'stage_clouds')
          .setDisplaySize(width * 1.16, height * 1.16).setAlpha(0.35);
      }
      // Oscurece un poco para que las caras resalten.
      this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.35);
    }

    // Paneles y retratos
    const p1 = this.drawFighterPanel(width * 0.27, height * 0.5, this.p1Id, 0x00e5ff, 1);
    const p2 = this.drawFighterPanel(width * 0.73, height * 0.5, this.p2Id, 0xffeb3b, -1);

    // Entrada tipo arcade: desde fuera de la pantalla hacia dentro.
    p1.group.x -= width;
    p2.group.x += width;
    this.tweens.add({ targets: p1.group, x: width * 0.27, duration: 520, ease: 'Back.easeOut' });
    this.tweens.add({ targets: p2.group, x: width * 0.73, duration: 520, ease: 'Back.easeOut' });

    // VS
    const vs = this.add.text(width / 2, height * 0.46, 'VS', {
      fontSize: '130px', color: '#ff2222', fontStyle: 'bold', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 12,
    }).setOrigin(0.5).setScale(0.1).setAngle(-15);
    this.tweens.add({
      targets: vs, scale: 1, angle: 0, duration: 380, ease: 'Back.easeOut', delay: 420,
    });
    this.tweens.add({ targets: vs, alpha: { from: 0.7, to: 1 }, duration: 400, delay: 820, yoyo: true, repeat: -1 });

    // Barra inferior con el modo de juego
    const modo = this.mode === 'cpu' ? 'MODO: 1 JUGADOR vs CPU' : 'MODO: 2 JUGADORES';
    this.add.text(width / 2, height * 0.9, modo, {
      fontSize: '20px', color: '#fff', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.96, 'ENTER: pelear   ESC: elegir de nuevo', {
      fontSize: '16px', color: '#bdbdbd', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Avance automatico + salida
    this.time.delayedCall(AUTO_ADVANCE_MS, () => this.startFight());

    const onEnter = () => this.startFight();
    const onEsc = () => { this.audio.select(); goToScene(this, 'SelectScene', { mode: this.mode }); };
    this.input.keyboard.on('keydown-ENTER', onEnter);
    this.input.keyboard.on('keydown-ESC', onEsc);
    this.events.on('shutdown', () => {
      this.input.keyboard.off('keydown-ENTER', onEnter);
      this.input.keyboard.off('keydown-ESC', onEsc);
    });
  }

  drawFighterPanel(x, y, id, color, dir) {
    const data = ROSTER.find((d) => d.id === id) || ROSTER[0];
    const group = this.add.container(x, y);

    const PANEL_W = 330, PANEL_H = 430;
    const box = this.add.rectangle(0, 0, PANEL_W, PANEL_H, 0x000000, 0.72).setStrokeStyle(4, color);
    group.add(box);

    // Retrato grande (assets/portraits/<id>.png); si falta, caja de color.
    const SIZE = 260;
    const portraitKey = `portrait_${data.id}`;
    let portrait;
    if (this.textures.exists(portraitKey)) {
      portrait = this.add.image(0, -30, portraitKey);
      const src = this.textures.get(portraitKey).getSourceImage();
      portrait.setScale(Math.min(SIZE / src.width, SIZE / src.height));
    } else {
      portrait = this.add.rectangle(0, -30, SIZE, SIZE, data.color).setStrokeStyle(2, 0xffffff);
    }
    group.add(portrait);

    const name = this.add.text(0, PANEL_H / 2 - 58, data.name.toUpperCase(), {
      fontSize: '30px', color: '#ffffff', fontStyle: 'bold', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);
    group.add(name);

    const side = this.add.text(0, PANEL_H / 2 - 22, dir > 0 ? 'JUGADOR 1' : (this.mode === 'cpu' ? 'RIVAL (CPU)' : 'JUGADOR 2'), {
      fontSize: '17px', color: Phaser.Display.Color.IntegerToColor(color).rgba, fontStyle: 'bold', fontFamily: 'monospace',
    }).setOrigin(0.5);
    group.add(side);

    return { group, portrait };
  }

  startFight() {
    if (this.done) return;
    this.done = true;
    this.audio.select();
    goToScene(this, 'GameScene', { p1: this.p1Id, p2: this.p2Id, mode: this.mode });
  }
}
