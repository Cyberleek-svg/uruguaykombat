import { HURTBOX, HITBOX, SPRITE_SCALE, FRAME, HURTBOX_OFFSET_Y, BODY_CENTER_OFFSET, HITBOX_TRIGGER_FRAME } from '../config.js';
import { getFighterData } from '../systems/Roster.js';

export class Fighter extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, dataOrId, isPlayer = true) {
    const data = typeof dataOrId === 'string' ? getFighterData(dataOrId) : dataOrId;
    super(scene, x, y, `fighter_${data.id}`, 0);
    this.scene = scene;
    // NOTA: no usar `this.data` — Phaser.GameObjects tiene un `data` interno
    // (DataManager) y GameObject.destroy() lo llama; colisiona y rompe.
    this.stats = data;
    this.isPlayer = isPlayer;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(SPRITE_SCALE);
    // IMPORTANTE: setSize/setOffset usan píxeles del frame (source). Phaser multiplica
    // el tamaño y el offset por la escala del sprite internamente (_sx/_sy).
    this.body.setSize(HURTBOX.w, HURTBOX.h, false);
    this.body.setOffset((FRAME.w - HURTBOX.w) / 2, HURTBOX_OFFSET_Y);
    this.body.setCollideWorldBounds(true);
    this.setDepth(10);

    this.facing = isPlayer ? 1 : -1;
    this.setFlipX(this.facing < 0);

    this.maxHp = data.maxHp;
    this.hp = data.maxHp;
    this.speed = data.speed;
    this.state = 'idle';
    this.stateTimer = 0;
    this.attackCooldown = 0;
    this.specialCooldown = 0;
    this.hitstun = 0;
    this.hitbox = null;
    this.hitboxActive = false;
    this.hitboxSpawned = false;
    this.attackLanded = false;
    this.invulnTimer = 0;
    this.hitstopTimer = 0;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.dead = false;

    this.playAnim('idle');

    // animation complete handling
    this.on('animationcomplete', (anim) => {
      const key = anim.key;
      if (key.includes('_attack')) {
        this.destroyHitbox();
        if (this.state === 'attack') this.setState('idle');
      } else if (key.includes('_hit')) {
        if (this.state === 'hit') this.setState('idle');
      } else if (key.includes('_special')) {
        this.destroyHitbox();
        if (this.state === 'special') this.setState('idle');
      }
    });
  }

  playAnim(name) {
    const key = `${this.stats.id}_${name}`;
    if (this.anims.currentAnim && this.anims.currentAnim.key === key) return;
    this.play(key, true);
  }

  setState(state) {
    if (this.dead && state !== 'ko') return;
    this.state = state;
    this.stateTimer = 0;
    switch (state) {
      case 'idle': this.playAnim('idle'); break;
      case 'walk': this.playAnim('walk'); break;
      case 'attack': this.playAnim('attack'); this.attackLanded = false; this.hitboxSpawned = false; if (this.scene.audio) this.scene.audio.playVoice(this.stats.id); break; // voz: jugador Y CPU
      case 'hit': this.playAnim('hit'); this.destroyHitbox(); break;
      case 'special': this.playAnim('special'); this.hitboxSpawned = false; break;
      case 'ko': this.playAnim('hit'); this.destroyHitbox(); break;
    }
  }

  update(delta, input, opponent) {
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= delta;
      this.body.setVelocityX(0);
      if (this.hitstopTimer <= 0) {
        this.hitstopTimer = 0;
        this.anims.timeScale = 1;
      }
      this.handleHitboxLifecycle();
      return;
    }
    if (this.dead) {
      this.body.setVelocityX(0);
      return;
    }
    this.stateTimer += delta;
    if (this.invulnTimer > 0) this.invulnTimer -= delta;
    // no ground lock: physics handles gravity/collisions
    if (this.attackCooldown > 0) this.attackCooldown -= delta;
    if (this.specialCooldown > 0) this.specialCooldown -= delta;

    // facing toward opponent (solo fuera de estados que bloquean)
    if (opponent && !this.dead && this.state !== 'attack' && this.state !== 'special' && this.state !== 'hit' && this.state !== 'ko') {
      this.facing = (opponent.x > this.x) ? 1 : -1;
      this.setFlipX(this.facing < 0);
    }

    if (this.state === 'hit') {
      if (this.stateTimer > 350) {
        this.body.setVelocityX(0);
        this.setState('idle');
      }
      this.handleHitboxLifecycle();
      return;
    }
    if (this.state === 'attack') {
      this.body.setVelocityX(0);
      this.tryActivateHitbox();
      this.handleHitboxLifecycle();
      return;
    }
    if (this.state === 'special') {
      this.body.setVelocityX(0);
      this.tryActivateHitbox(true);
      this.handleHitboxLifecycle();
      return;
    }
    if (this.state === 'ko') {
      this.body.setVelocityX(0);
      return;
    }

    // coyote + jump buffer timers
    if (this.body.onFloor()) this.coyoteTimer = 90;
    else this.coyoteTimer = Math.max(0, this.coyoteTimer - delta);
    if (input && input.jump) this.jumpBufferTimer = 110;
    else this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - delta);

    // jump
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0 && this.state !== 'hit' && this.state !== 'attack' && this.state !== 'special') {
      this.body.setVelocityY(-(this.stats.jumpForce || 500));
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
    }

    // movement (air control)
    let vx = 0;
    if (input) {
      if (input.left) vx = -this.speed;
      if (input.right) vx = this.speed;
    }
    if (!this.body.onFloor()) vx *= 0.55;
    this.body.setVelocityX(vx);

    // state (only when grounded and not attacking)
    if (this.state !== 'attack' && this.state !== 'special' && this.state !== 'hit' && this.state !== 'ko') {
      if (!this.body.onFloor()) {
        if (this.state !== 'idle') this.setState('idle');
      } else if (vx !== 0) {
        if (this.state !== 'walk') this.setState('walk');
      } else {
        if (this.state !== 'idle') this.setState('idle');
      }
    }

    // actions
    if (input) {
      if (input.attack && this.attackCooldown <= 0 && this.state !== 'hit') {
        this.attackCooldown = this.stats.attackCooldown;
        this.setState('attack');
        this.scene.audio.attack();
      }
      if (input.special && this.specialCooldown <= 0 && this.state !== 'hit') {
        this.specialCooldown = this.stats.specialCooldown;
        this.setState('special');
        this.scene.audio.special_start();
      }
    }

    this.handleHitboxLifecycle();
  }

  tryActivateHitbox(special = false) {
    const anim = this.anims.currentAnim;
    if (!anim) return;
    const frameIndex = this.anims.currentFrame ? this.anims.currentFrame.index : -1;
    // "hitbox activo en el frame 3" (indice 2 de la hoja de 5 frames).
    // Si la hoja real trae menos frames de los esperados, la ventana se
    // encoge para que el golpe nunca quede sin hitbox.
    const total = anim.frames && anim.frames.length ? anim.frames.length : (special ? 12 : 5);
    const triggerFrame = special ? Math.min(6, total - 1) : Math.min(HITBOX_TRIGGER_FRAME, total - 1);
    const lastActive = special ? Math.min(8, total - 1) : total - 1;
    if (frameIndex > lastActive) { this.destroyHitbox(); return; }
    if (frameIndex >= triggerFrame && !this.hitboxActive && !this.hitboxSpawned) {
      this.spawnHitbox(special);
      this.hitboxSpawned = true;
    }
  }

  spawnHitbox(special = false) {
    const dmg = special ? this.stats.specialDamage : this.stats.attackDamage;
    const hbW = (special ? HITBOX.w * 2 : HITBOX.w) * SPRITE_SCALE;
    const hbH = (special ? HITBOX.h * 1.5 : HITBOX.h) * SPRITE_SCALE;
    const x = this.x + this.facing * (HURTBOX.w * SPRITE_SCALE / 2 + hbW / 2 + 10 * SPRITE_SCALE);
    const y = this.y + BODY_CENTER_OFFSET;
    const rect = this.scene.add.rectangle(x, y, hbW, hbH, 0xff0000, 0.0);
    this.scene.physics.add.existing(rect);
    rect.body.setAllowGravity(false);
    rect.body.setImmovable(true);
    rect.damage = dmg;
    rect.owner = this;
    rect.special = special;
    rect.createdAt = this.scene.time.now;
    rect.lifetime = special ? 180 : 90;
    this.hitbox = rect;
    this.hitboxActive = true;
    // store offset for follow
    rect._offX = this.facing * (HURTBOX.w * SPRITE_SCALE / 2 + hbW / 2 + 10 * SPRITE_SCALE);
  }

  handleHitboxLifecycle() {
    if (!this.hitbox) return;
    const hb = this.hitbox;
    // follow fighter
    if (this.hitboxActive) {
      hb.x = this.x + hb._offX;
      hb.y = this.y + BODY_CENTER_OFFSET;
    }
    if (this.scene.time.now - hb.createdAt > hb.lifetime) {
      this.destroyHitbox();
    }
  }

  destroyHitbox() {
    if (this.hitbox) {
      this.hitbox.destroy();
      this.hitbox = null;
    }
    this.hitboxActive = false;
  }

  takeDamage(amount, attacker, launch = false) {
    if (this.dead) return;
    if (this.invulnTimer > 0) return;
    if (this.state === 'hit' && this.body.onFloor()) return;
    this.hp = Math.max(0, this.hp - amount);
    this.invulnTimer = launch ? 60 : 120;
    this.setTint(0xffffff);
    this.scene.time.delayedCall(70, () => { if (this.active) this.clearTint(); });
    this.triggerHitstop(65);
    if (attacker && attacker.triggerHitstop) attacker.triggerHitstop(65);
    this.scene.audio.hit();
    if (this.hp <= 0) {
      this.hp = 0;
      this.die();
    } else {
      this.setState('hit');
      // knockback
      const dir = attacker ? (this.x > attacker.x ? 1 : -1) : 1;
      this.body.setVelocityX(dir * 180);
      if (launch) this.body.setVelocityY(-900);
      if (this._kbTimer) this._kbTimer.remove();
      this._kbTimer = this.scene.time.delayedCall(120, () => {
        if (!this.dead && this.body) this.body.setVelocityX(0);
      });
    }
    this.scene.events.emit('healthChanged');
  }

  triggerHitstop(ms = 65) {
    this.hitstopTimer = ms;
    this.anims.timeScale = 0;
    this.body.setVelocity(0, this.body.velocity.y);
  }

  die() {
    this.dead = true;
    this.state = 'ko';
    if (this._kbTimer) { this._kbTimer.remove(); this._kbTimer = null; }
    if (this._hitstopTimer) { clearTimeout(this._hitstopTimer); this._hitstopTimer = null; }
    this.destroyHitbox();
    this.body.setVelocityX(0);
    this.playAnim('hit');
    this.scene.audio.ko();
    this.scene.events.emit('ko', this);
  }

  getHitbox() { return this.hitbox; }
}