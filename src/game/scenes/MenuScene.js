import { DONATION_LINK, MUSIC } from '../config.js';
import { AudioManager } from '../systems/AudioManager.js';
import { goToScene } from '../systems/SceneFlow.js';

export class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    this.audio = new AudioManager(this);
    const resume = () => this.audio.resume();
    this.input.once('pointerdown', resume);
    this.input.keyboard.once('keydown', resume);
    this.audio.playMusic(MUSIC.menu);

    const { width, height } = this.scale;

    // background
    if (this.textures.exists('menu_bg')) {
      this.add.image(width / 2, height / 2, 'menu_bg').setDisplaySize(width, height);
    } else {
      const g = this.add.graphics();
      g.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x2e0a1a, 0x2e0a1a, 1);
      g.fillRect(0, 0, width, height);
    }

    // title glow layers
    this.add.text(width / 2 + 4, height * 0.22 + 4, 'URUGUAY KOMBAT', {
      fontSize: '74px', color: '#000000', fontStyle: 'bold', fontFamily: 'monospace',
    }).setOrigin(0.5).setAlpha(0.6);
    const title = this.add.text(width / 2, height * 0.22, 'URUGUAY KOMBAT', {
      fontSize: '74px', color: '#ff2222', fontStyle: 'bold', fontFamily: 'monospace',
      stroke: '#ffeb3b', strokeThickness: 4,
    }).setOrigin(0.5);

    this.tweens.add({ targets: title, alpha: { from: 0.85, to: 1 }, duration: 900, yoyo: true, repeat: -1 });

    this.add.text(width / 2, height * 0.33, 'FRENTE AMPLIO  vs  DERECHA', {
      fontSize: '22px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);

    const makeBtn = (y, label, color, cb) => {
      const bg = this.add.rectangle(width / 2, y, 360, 52, 0x000000, 0.75).setStrokeStyle(3, color);
      const txt = this.add.text(width / 2, y, label, {
        fontSize: '26px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5);
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => { bg.setFillStyle(color, 0.35); txt.setColor('#ffeb3b'); });
      bg.on('pointerout', () => { bg.setFillStyle(0x000000, 0.75); txt.setColor('#ffffff'); });
      bg.on('pointerdown', () => { this.audio.select(); cb(); });
      return { bg, txt };
    };

    makeBtn(height * 0.55, '1 JUGADOR  vs  CPU', 0xff2222, () => goToScene(this, 'SelectScene', { mode: 'cpu' }));

    makeBtn(height * 0.72, 'APOYAR AL DESARROLLADOR', 0xffeb3b, () => {
      if (DONATION_LINK) window.open(DONATION_LINK, '_blank');
      else alert('Gracias por tu apoyo! (Configura DONATION_LINK en src/game/config.js)');
    });

    this.add.text(width / 2, height * 0.87, 'P1: A/D mover  W saltar  J ataque  K especial     P2: Flechas  ↑ saltar  L ataque  O especial     ESC: volver', {
      fontSize: '13px', color: '#bdbdbd', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.add.text(width / 2, height * 0.905, 'M: silencio ON/OFF', {
      fontSize: '13px', color: '#7d7d7d', fontFamily: 'monospace',
    }).setOrigin(0.5);

    const onEnter = () => { this.audio.select(); goToScene(this, 'SelectScene', { mode: 'cpu' }); };
    this.input.keyboard.on('keydown-ENTER', onEnter);
    this.events.on('shutdown', () => this.input.keyboard.off('keydown-ENTER', onEnter));
  }
}