export class InputManager {
  constructor(scene) {
    this.scene = scene;
    this.touchControls = null;
    this.keys = scene.input.keyboard.addKeys({
      p1Left: Phaser.Input.Keyboard.KeyCodes.A,
      p1Right: Phaser.Input.Keyboard.KeyCodes.D,
      p1Up: Phaser.Input.Keyboard.KeyCodes.W,
      p1Attack: Phaser.Input.Keyboard.KeyCodes.J,
      p1Special: Phaser.Input.Keyboard.KeyCodes.K,
      p1Confirm: Phaser.Input.Keyboard.KeyCodes.ENTER,
      p2Left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      p2Right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      p2Up: Phaser.Input.Keyboard.KeyCodes.UP,
      p2Attack: Phaser.Input.Keyboard.KeyCodes.L,
      p2Special: Phaser.Input.Keyboard.KeyCodes.O,
      globalConfirm: Phaser.Input.Keyboard.KeyCodes.SPACE,
      globalConfirm2: Phaser.Input.Keyboard.KeyCodes.ENTER,
    });
    this.prevPad = { 0: {}, 1: {} };
  }

  pollGamepads() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    return Array.from(pads).filter(Boolean);
  }

  getState(playerIndex) {
    const k = this.keys;
    let left = false, right = false;
    let attack = false, special = false, confirm = false, jump = false;
    let attackEdge = false, specialEdge = false, confirmEdge = false, jumpEdge = false;

    if (playerIndex === 0) {
      left = k.p1Left.isDown;
      right = k.p1Right.isDown;
      attackEdge = Phaser.Input.Keyboard.JustDown(k.p1Attack);
      specialEdge = Phaser.Input.Keyboard.JustDown(k.p1Special);
      confirmEdge = Phaser.Input.Keyboard.JustDown(k.p1Confirm);
      jumpEdge = Phaser.Input.Keyboard.JustDown(k.p1Up);
    } else {
      left = k.p2Left.isDown;
      right = k.p2Right.isDown;
      attackEdge = Phaser.Input.Keyboard.JustDown(k.p2Attack);
      specialEdge = Phaser.Input.Keyboard.JustDown(k.p2Special);
      jumpEdge = Phaser.Input.Keyboard.JustDown(k.p2Up);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.globalConfirm) || Phaser.Input.Keyboard.JustDown(this.keys.globalConfirm2)) {
      confirmEdge = true;
    }

    const pads = this.pollGamepads();
    const pad = pads[playerIndex];
    if (pad) {
      const ax = pad.axes[0] || 0;
      if (ax < -0.25) left = true;
      if (ax > 0.25) right = true;
      if (pad.buttons[14] && pad.buttons[14].pressed) left = true;
      if (pad.buttons[15] && pad.buttons[15].pressed) right = true;

      const prev = this.prevPad[playerIndex] || {};
      const b0 = !!(pad.buttons[0] && pad.buttons[0].pressed);
      const b1 = !!(pad.buttons[1] && pad.buttons[1].pressed);
      const b9 = !!(pad.buttons[9] && pad.buttons[9].pressed);
      const b12 = !!(pad.buttons[12] && pad.buttons[12].pressed);
      if (b0 && !prev.b0) attackEdge = true;
      if (b1 && !prev.b1) specialEdge = true;
      if (b9 && !prev.b9) confirmEdge = true;
      if (b12 && !prev.b12) jumpEdge = true;
      this.prevPad[playerIndex] = { b0, b1, b9, b12 };
    }

    // Controles tactiles (movil)
    const tc = this.touchControls;
    if (tc && tc.enabled) {
      if (tc.state.left) left = true;
      if (tc.state.right) right = true;
      if (tc.state.attack) attackEdge = true;
      if (tc.state.special) specialEdge = true;
      if (tc.state.jump) jumpEdge = true;
      if (tc.state.confirm) confirmEdge = true;
      // consumir edges
      tc.edges.attack = false;
      tc.edges.special = false;
      tc.edges.jump = false;
      tc.edges.confirm = false;
    }

    return { left, right, attack: attackEdge, special: specialEdge, confirm: confirmEdge, jump: jumpEdge };
  }
}