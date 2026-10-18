import { ROSTER } from '../systems/Roster.js';
import { InputManager } from '../systems/InputManager.js';
import { AudioManager } from '../systems/AudioManager.js';
import { TouchControls } from '../systems/TouchControls.js';
import { goToScene } from '../systems/SceneFlow.js';
import { isTouchDevice } from '../systems/Device.js';

export class SelectScene extends Phaser.Scene {
  constructor() { super('SelectScene'); }

  init(data) { this.mode = 'cpu'; }

  create() {
    this._onEsc = () => { goToScene(this, 'MenuScene'); };
    this.input.keyboard.on('keydown-ESC', this._onEsc);
    this.audio = new AudioManager(this);
    this.inputMgr = new InputManager(this);
    this.touchControls = new TouchControls(this, this.inputMgr);
    this.moveCd = 0;
    const resume = () => this.audio.resume();
    this.input.once('pointerdown', resume);
    this.input.keyboard.once('keydown', resume);

    const { width, height } = this.scale;
    if (this.textures.exists('select_bg')) {
      this.add.image(width / 2, height / 2, 'select_bg').setDisplaySize(width, height);
    } else {
      const g = this.add.graphics();
      g.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x0a0a0a, 0x0a0a0a, 1);
      g.fillRect(0, 0, width, height);
    }

    this.title = this.add.text(width / 2, 50, 'SELECCIONA TU LUCHADOR', {
      fontSize: '34px', color: '#ffeb3b', fontStyle: 'bold', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    this.step = 0;
    this.p1Index = 0;
    this.p1Choice = null;

    this.cards = [];
    const cardW = 210, cardH = 300;
    const gap = 24;
    const startX = (width - ROSTER.length * (cardW + gap)) / 2 + cardW / 2;
    const PORTRAIT = 150;
    ROSTER.forEach((d, i) => {
      const x = startX + i * (cardW + gap);
      const y = height / 2 + 10;
      const rect = this.add.rectangle(x, y, cardW, cardH, 0x000000, 0.6).setStrokeStyle(3, d.color);
      const name = this.add.text(x, y - cardH / 2 + 10, d.name, { fontSize: '18px', color: '#fff', fontStyle: 'bold', fontFamily: 'monospace' }).setOrigin(0.5, 0);

      const px = x;
      const py = y - 34;
      const frame = this.add.rectangle(px, py, PORTRAIT + 10, PORTRAIT + 10, 0x0a0a0a, 0.85).setStrokeStyle(2, d.color);
      const portraitKey = `portrait_${d.id}`;
      let portrait;
      if (this.textures.exists(portraitKey)) {
        portrait = this.add.image(px, py, portraitKey);
        const src = this.textures.get(portraitKey).getSourceImage();
        const s = Math.min(PORTRAIT / src.width, PORTRAIT / src.height);
        portrait.setScale(s);
      } else {
        portrait = this.add.rectangle(px, py, PORTRAIT, PORTRAIT, d.color).setStrokeStyle(2, 0xffffff);
      }

      const stats = this.add.text(x, y + cardH / 2 - 62, `HP ${d.maxHp}\nVEL ${d.speed}\nATK ${d.attackDamage}`, { fontSize: '14px', color: '#ddd', fontFamily: 'monospace', align: 'center' }).setOrigin(0.5, 0);

      // Click/tap para seleccionar
      rect.setInteractive({ useHandCursor: true });
      rect.on('pointerdown', () => {
        this.p1Index = i;
        this.updateCursor();
        this.audio.select();
      });

      this.cards.push({ data: d, rect, name, stats, frame, portrait, x, y, index: i });
    });

    this.cursorP1 = this.add.rectangle(this.cards[0].x, this.cards[0].y, cardW + 12, cardH + 12).setStrokeStyle(4, 0x00e5ff).setFillStyle(0x000000, 0);

    // Boton de confirmacion (mouse/touch)
    const btnY = height - 70;
    const btnBg = this.add.rectangle(width / 2, btnY, 260, 52, 0x000000, 0.75).setStrokeStyle(3, 0x00e5ff);
    const btnTxt = this.add.text(width / 2, btnY, 'CONFIRMAR', { fontSize: '24px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5);
    btnBg.setInteractive({ useHandCursor: true });
    btnBg.on('pointerover', () => { btnBg.setFillStyle(0x00e5ff, 0.25); btnTxt.setColor('#ffeb3b'); });
    btnBg.on('pointerout', () => { btnBg.setFillStyle(0x000000, 0.75); btnTxt.setColor('#ffffff'); });
    btnBg.on('pointerdown', () => { this.audio.select(); this.confirmSelection(); });

    // Boton volver (movil/desktop)
    const backBg = this.add.rectangle(90, 40, 140, 36, 0x000000, 0.6).setStrokeStyle(2, 0xffffff);
    const backTxt = this.add.text(90, 40, '< VOLVER', { fontSize: '16px', color: '#fff', fontFamily: 'monospace' }).setOrigin(0.5);
    backBg.setInteractive({ useHandCursor: true });
    backBg.on('pointerdown', () => { this.audio.select(); goToScene(this, 'MenuScene'); });

    this.hint = this.add.text(width / 2, height - 110, 'Click en un luchador y CONFIRMAR  |  A/D mover  J confirmar  ESC volver', {
      fontSize: '14px', color: '#fff', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.updateCursor();
    this.events.on('shutdown', () => this.input.keyboard.off('keydown-ESC', this._onEsc));
  }

  updateCursor() {
    const c = this.cards[this.p1Index];
    this.cursorP1.setPosition(c.x, c.y);
  }

  confirmSelection() {
    this.p1Choice = ROSTER[this.p1Index].id;
    // Rival CPU: elige uno distinto al azar
    const candidates = ROSTER.map((d, i) => i).filter(i => i !== this.p1Index);
    const rivalIdx = candidates[Math.floor(Math.random() * candidates.length)];
    const p2Choice = ROSTER[rivalIdx].id;
    goToScene(this, 'VersusScene', { p1: this.p1Choice, p2: p2Choice, mode: 'cpu' });
  }

  update(time, delta) {
    this.moveCd -= delta;
    const canMove = this.moveCd <= 0;
    const st = this.inputMgr.getState(0);
    if (canMove && st.left) { this.p1Index = Math.max(0, this.p1Index - 1); this.updateCursor(); this.moveCd = 180; }
    if (canMove && st.right) { this.p1Index = Math.min(ROSTER.length - 1, this.p1Index + 1); this.updateCursor(); this.moveCd = 180; }
    if (st.attack || st.confirm) {
      this.audio.select();
      this.confirmSelection();
    }
  }
}
