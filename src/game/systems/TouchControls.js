import { isTouchDevice } from './Device.js';

// Controles tactiles en pantalla (solo se crean en dispositivos touch).
// Alimentan el mismo InputManager que teclado/gamepad.
export class TouchControls {
  constructor(scene, inputMgr) {
    this.scene = scene;
    this.inputMgr = inputMgr;
    this.enabled = isTouchDevice();
    this.state = { left: false, right: false, attack: false, special: false, jump: false, confirm: false };
    this.edges = { attack: false, special: false, jump: false, confirm: false };
    if (!this.enabled) return;

    // Multi-touch
    scene.input.addPointer(4);

    const w = scene.scale.width;
    const h = scene.scale.height;
    const bs = Math.max(64, Math.round(Math.min(w, h) * 0.09));
    const m = 14;

    // --- Movimiento (izquierda) ---
    this.makeBtn(m, h - m - bs, bs, '◀', 'left', true);
    this.makeBtn(m + bs + 8, h - m - bs, bs, '▶', 'right', true);
    // Salto (encima del movimiento)
    this.makeBtn(m + (bs + 8) / 2, h - m - bs * 2 - 12, bs, '▲', 'jump', false);

    // --- Acciones (derecha) ---
    const rx = w - m - bs;
    this.makeBtn(rx, h - m - bs, bs, 'A', 'attack', false);
    this.makeBtn(rx - bs - 8, h - m - bs, bs, 'S', 'special', false);
    this.makeBtn(rx, h - m - bs * 2 - 12, bs, 'JMP', 'jump', false);

    // Registrar en el InputManager para que getState() lo lea
    inputMgr.touchControls = this;
  }

  makeBtn(x, y, size, label, key, held) {
    const cx = x + size / 2;
    const cy = y + size / 2;
    const rect = this.scene.add.rectangle(cx, cy, size, size, 0x000000, 0.45)
      .setStrokeStyle(2, 0xffffff).setScrollFactor(0).setDepth(2000);
    const txt = this.scene.add.text(cx, cy, label, {
      fontSize: Math.round(size * 0.42) + 'px', color: '#ffffff', fontStyle: 'bold', fontFamily: 'monospace',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2001);

    rect.setInteractive();
    const press = () => {
      this.state[key] = true;
      if (!held) this.edges[key] = true;
      rect.setFillStyle(0xffffff, 0.25);
    };
    const release = () => {
      this.state[key] = false;
      rect.setFillStyle(0x000000, 0.45);
    };
    rect.on('pointerdown', press);
    rect.on('pointerup', release);
    rect.on('pointerout', release);
    rect.on('pointerupoutside', release);
  }

  // Llamar al final de getState() del InputManager para consumir edges
  consumeEdges() {
    this.edges.attack = false;
    this.edges.special = false;
    this.edges.jump = false;
    this.edges.confirm = false;
  }
}
