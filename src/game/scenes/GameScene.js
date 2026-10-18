import { GAME_WIDTH, GAME_HEIGHT, GROUND_TOP, BODY_BOTTOM_OFFSET, MUSIC, STAGE_OFFSETS, STAGE_TUNE } from '../config.js';
import { Fighter } from '../entities/Fighter.js';
import { AIController } from '../entities/AI.js';
import { InputManager } from '../systems/InputManager.js';
import { TouchControls } from '../systems/TouchControls.js';
import { isTouchDevice } from '../systems/Device.js';
import { AudioManager } from '../systems/AudioManager.js';
import { goToScene } from '../systems/SceneFlow.js';
import { buildStage } from '../systems/StageBuilder.js';

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.p1Id = (data && data.p1) || 'orsi';
    this.p2Id = (data && data.p2) || 'lacalle';
    this.mode = (data && data.mode) || 'cpu';
  }

  create() {
    this.audio = new AudioManager(this);
    this.inputMgr = new InputManager(this);
    this.touchControls = new TouchControls(this, this.inputMgr);
    if (isTouchDevice()) {
      const back = this.add.text(12, 8, '< MENU', { fontSize: '18px', color: '#fff', backgroundColor: '#000', padding: { x: 8, y: 4 }, fontFamily: 'monospace' }).setDepth(2002).setScrollFactor(0);
      back.setInteractive({ useHandCursor: true });
      back.on('pointerdown', () => goToScene(this, 'MenuScene'));
    }
    this.gameOver = false;
    this.audio.resume();
    this.audio.playMusic(MUSIC.battle);

    // stage: 3 capas de parallax + nubes (si existen), con movimiento suave
    const layers = buildStage(this);
    this.bg = layers.bg;
    this.mid = layers.mid;
    this.fg = layers.fg;
    this.clouds = layers.clouds;

    // Calibracion en vivo de la capa del medio (palacio)
    this.setupStageTuning();

    // ground: usa la linea de piso detectada del stage real (o el fallback)
    const groundTop = this.registry.get('groundTopScreen') || GROUND_TOP;
    this.groundTop = groundTop;
    this.groundY = groundTop - BODY_BOTTOM_OFFSET - 2;

    // physics ground (top en groundTop)
    const ground = this.add.rectangle(GAME_WIDTH / 2, groundTop + 20, GAME_WIDTH, 40, 0x000000, 0);
    this.physics.add.existing(ground, true);
    this.ground = ground;

    // fighters
    this.fighter1 = new Fighter(this, 260, this.groundY, this.p1Id, true);
    this.fighter2 = new Fighter(this, GAME_WIDTH - 260, this.groundY, this.p2Id, false);
    this.fighter1.groundY = this.groundY;
    this.fighter2.groundY = this.groundY;
    this.fighter1.opponent = this.fighter2;
    this.fighter2.opponent = this.fighter1;
    this.physics.add.collider(this.fighter1, this.ground);
    this.physics.add.collider(this.fighter2, this.ground);

    // AI (solo modo CPU)
    this.ai = this.mode === 'cpu' ? new AIController(this.fighter2, this.fighter1, 1) : null;

    // health bars UI
    this.createUI();

    // events
    this.events.on('healthChanged', () => this.updateHealthBars());
    this.events.on('ko', (who) => this.handleKO(who));
    const onEsc = () => goToScene(this, 'MenuScene');
    this.input.keyboard.on('keydown-ESC', onEsc);
    this.events.on('shutdown', () => this.input.keyboard.off('keydown-ESC', onEsc));

    this.updateHealthBars();
  }

  // Calibracion en vivo de la capa del medio (el palacio).
  // Tecla "[" baja el palacio, "]" lo sube. Muestra el valor un rato y lo imprime
  // en la consola, para que despues lo copies a STAGE_OFFSETS.mid.y en config.js.
  setupStageTuning() {
    if (!STAGE_TUNE || !this.mid) return;
    const txt = this.add.text(10, 100, '', {
      fontSize: '16px', color: '#ffeb3b', fontFamily: 'monospace',
      backgroundColor: '#000', padding: { x: 8, y: 6 },
    }).setDepth(999).setAlpha(0);
    let hideTimer = null;

    const show = (msg) => {
      txt.setText(msg).setAlpha(1);
      if (hideTimer) hideTimer.remove();
      hideTimer = this.time.delayedCall(2200, () => txt.setAlpha(0));
      console.log('[StageTune]', msg);
    };

    const move = (dy) => {
      STAGE_OFFSETS.mid.y = Math.round(STAGE_OFFSETS.mid.y + dy);
      this.mid.y = this.scale.height / 2 + STAGE_OFFSETS.mid.y;
      show(`PALACIO (mid.y) = ${STAGE_OFFSETS.mid.y}px   |   copialo en config.js -> STAGE_OFFSETS.mid.y`);
    };

    const onDown = () => move(+6);
    const onUp = () => move(-6);
    this.input.keyboard.on('keydown-OPEN_BRACKET', onDown);
    this.input.keyboard.on('keydown-CLOSED_BRACKET', onUp);
    this.events.on('shutdown', () => {
      this.input.keyboard.off('keydown-OPEN_BRACKET', onDown);
      this.input.keyboard.off('keydown-CLOSED_BRACKET', onUp);
    });
    if (hideTimer) hideTimer = null;
  }

  createUI() {
    const { width } = this.scale;
    const PORTRAIT = 72;          // tamano de la cara en el HUD
    this.barMaxW = 400;           // ancho maximo de la barra de vida
    const barX = 100;             // donde arranca/termina la barra (deja lugar al retrato)
    const portraitY = 50;         // centro vertical del retrato
    const labelY = portraitY - PORTRAIT / 2 - 16;

    // --- P1 (izquierda) ---
    this.p1Portrait = this.addPortrait(52, portraitY, this.fighter1.stats, PORTRAIT);
    this.p1Name = this.add.text(barX, 20, this.fighter1.stats.name, { fontSize: '22px', color: '#fff', fontStyle: 'bold' });
    this.p1BarBg = this.add.rectangle(barX, 62, this.barMaxW, 24, 0x333333).setOrigin(0, 0.5);
    this.p1Bar = this.add.rectangle(barX, 62, this.barMaxW, 24, 0x1e88e5).setOrigin(0, 0.5);

    // --- P2 (derecha, espejado) ---
    this.p2Portrait = this.addPortrait(width - 52, portraitY, this.fighter2.stats, PORTRAIT);
    this.p2Name = this.add.text(width - barX, 20, this.fighter2.stats.name, { fontSize: '22px', color: '#fff', fontStyle: 'bold' }).setOrigin(1, 0);
    this.p2BarBg = this.add.rectangle(width - barX, 62, this.barMaxW, 24, 0x333333).setOrigin(1, 0.5);
    this.p2Bar = this.add.rectangle(width - barX, 62, this.barMaxW, 24, 0xe53935).setOrigin(1, 0.5);

    // Etiquetas de jugador
    this.add.text(52, labelY, 'P1', { fontSize: '14px', color: '#00e5ff', fontStyle: 'bold', fontFamily: 'monospace' }).setOrigin(0.5);
    this.add.text(width - 52, labelY, this.mode === 'cpu' ? 'CPU' : 'P2', { fontSize: '14px', color: '#ffeb3b', fontStyle: 'bold', fontFamily: 'monospace' }).setOrigin(0.5);
  }

  // Retrato del HUD: usa assets/portraits/<id>.png si existe; si no, un cuadro de color.
  addPortrait(x, y, stats, size) {
    this.add.rectangle(x, y, size + 6, size + 6, 0x0a0a0a, 0.8).setStrokeStyle(2, stats.color);
    const key = `portrait_${stats.id}`;
    if (this.textures.exists(key)) {
      const img = this.add.image(x, y, key);
      const src = this.textures.get(key).getSourceImage();
      img.setScale(Math.min(size / src.width, size / src.height));
      return img;
    }
    return this.add.rectangle(x, y, size, size, stats.color).setStrokeStyle(1, 0xffffff);
  }

  updateHealthBars() {
    const maxW = this.barMaxW || 400;
    const r1 = this.fighter1.hp / this.fighter1.maxHp;
    const r2 = this.fighter2.hp / this.fighter2.maxHp;
    this.p1Bar.width = Math.max(0, maxW * r1);
    this.p2Bar.width = Math.max(0, maxW * r2);
  }

  update(time, delta) {
    if (this.gameOver) {
      // still update anims? fighters handle
      this.fighter1.update(delta, { left: false, right: false, attack: false, special: false }, this.fighter2);
      this.fighter2.update(delta, { left: false, right: false, attack: false, special: false }, this.fighter1);
      return;
    }

    const in1 = this.inputMgr.getState(0);
    let in2;
    if (this.mode === 'versus') {
      in2 = this.inputMgr.getState(1);
    } else {
      const aiIn = this.ai.update(delta);
      in2 = { left: aiIn.left, right: aiIn.right, attack: aiIn.attack, special: aiIn.special, confirm: false, jump: aiIn.jump || false };
      if (this.ai.current) { this.ai.current.attack = false; this.ai.current.special = false; }
    }

    this.fighter1.update(delta, in1, this.fighter2);
    this.fighter2.update(delta, in2, this.fighter1);

    // hitbox vs hurtbox collision
    this.checkHits(this.fighter1, this.fighter2);
    this.checkHits(this.fighter2, this.fighter1);

    // parallax subtle based on midpoint? keep static
  }

  checkHits(attacker, defender) {
    const hb = attacker.hitbox;
    if (!hb || !attacker.hitboxActive) return;
    if (hb.owner !== attacker) return;
    // avoid multiple hits: track hit list on hb
    if (!hb._hit) hb._hit = new Set();
    if (hb._hit.has(defender)) return;

    const body = defender.body;
    const bLeft = body.x;
    const bTop = body.y;

    const hbBounds = hb.getBounds();
    if (Phaser.Geom.Intersects.RectangleToRectangle(hbBounds, new Phaser.Geom.Rectangle(bLeft, bTop, body.width, body.height))) {
      hb._hit.add(defender);
      defender.takeDamage(hb.damage, attacker, !!hb.special);
      attacker.hitboxActive = false; // one hit per swing
      // partículas de impacto
      if (this.textures.exists('spark')) {
        // Normaliza el tamano: la particula se ve igual sin importar la
        // resolucion del archivo (8x8 procedural, 40x40 del usuario, etc.).
        const sparkSrc = this.textures.get('spark').getSourceImage();
        const sparkBase = 9 / Math.max(1, sparkSrc.width, sparkSrc.height);
        const emitter = this.add.particles(defender.x, defender.y - 40, 'spark', {
          speed: { min: 60, max: 220 },
          angle: { min: 0, max: 360 },
          scale: { start: sparkBase * 1.4, end: 0 },
          alpha: { start: 1, end: 0 },
          tint: attacker.stats.color,
          lifespan: 300,
          quantity: 12,
          emitting: false,
        });
        emitter.explode(12);
        this.time.delayedCall(360, () => emitter.destroy());
      }
      // destroy hitbox early
      attacker.destroyHitbox();
    }
  }

  handleKO(who) {
    if (this.gameOver) return;
    this.gameOver = true;
    const winner = who === this.fighter1 ? this.fighter2 : this.fighter1;
    this.time.delayedCall(1200, () => {
      goToScene(this, 'GameOverScene', { winner: winner.stats.id, loser: who.stats.id });
    });
  }
}