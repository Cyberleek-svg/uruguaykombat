import { getFighterData } from '../systems/Roster.js';
import { AudioManager } from '../systems/AudioManager.js';
import { goToScene } from '../systems/SceneFlow.js';
import { MUSIC } from '../config.js';

export class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.winnerId = (data && data.winner) || 'orsi';
    this.loserId = (data && data.loser) || 'lacalle';
  }

  create() {
    this.audio = new AudioManager(this);
    // Corta la musica de batalla y vuelve la del menu.
    this.audio.playMusic(MUSIC.menu);
    const { width, height } = this.scale;
    const g = this.add.graphics();
    g.fillGradientStyle(0x0d1b3e, 0x0d1b3e, 0x1a237e, 0x1a237e, 1);
    g.fillRect(0, 0, width, height);

    const winner = getFighterData(this.winnerId);
    const ko = this.add.text(width / 2, height * 0.3, 'K.O.', { fontSize: '120px', color: '#ff2222', fontStyle: 'bold', fontFamily: 'monospace', stroke: '#000', strokeThickness: 10 }).setOrigin(0.5);
    this.tweens.add({ targets: ko, scale: { from: 0.6, to: 1.1 }, duration: 250, yoyo: true, repeat: 1 });
    this.add.text(width / 2, height * 0.5, `${winner.name} GANA`, { fontSize: '40px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);

    const retry = this.add.text(width / 2, height * 0.7, 'Reintentar (ENTER)', { fontSize: '24px', color: '#fff', backgroundColor: '#e53935', padding: { x: 20, y: 8 } }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    retry.on('pointerdown', () => { this.audio.select(); goToScene(this, 'SelectScene'); });

    const menu = this.add.text(width / 2, height * 0.8, 'Menú (ESC)', { fontSize: '20px', color: '#fff', backgroundColor: '#333', padding: { x: 20, y: 8 } }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    menu.on('pointerdown', () => { this.audio.select(); goToScene(this, 'MenuScene'); });

    const onEnter = () => { this.audio.select(); goToScene(this, 'SelectScene'); };
    const onEsc = () => { this.audio.select(); goToScene(this, 'MenuScene'); };
    this.input.keyboard.on('keydown-ENTER', onEnter);
    this.input.keyboard.on('keydown-ESC', onEsc);
    this.events.on('shutdown', () => {
      this.input.keyboard.off('keydown-ENTER', onEnter);
      this.input.keyboard.off('keydown-ESC', onEsc);
    });
  }
}