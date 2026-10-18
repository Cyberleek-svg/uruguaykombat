export class AIController {
  constructor(fighter, opponent, difficulty = 1) {
    this.fighter = fighter;
    this.opponent = opponent;
    this.difficulty = difficulty;
    this.decisionTimer = 0;
    this.current = { left: false, right: false, attack: false, special: false, jump: false };
  }

  update(delta) {
    const f = this.fighter;
    const o = this.opponent;
    if (!f || !o || f.dead || o.dead) {
      this.current = { left: false, right: false, attack: false, special: false, jump: false };
      return this.current;
    }
    this.decisionTimer -= delta;
    if (this.decisionTimer > 0) return this.current;

    const dist = Math.abs(f.x - o.x);
    const attackRange = 150;
    const specialRange = 170;
    const desired = { left: false, right: false, attack: false, special: false, jump: false };

    // movement toward opponent with spacing
    if (dist > attackRange + 40) {
      if (o.x > f.x) desired.right = true; else desired.left = true;
    } else if (dist < attackRange - 30) {
      if (o.x > f.x) desired.left = true; else desired.right = true;
    }

    // attack decisions
    const r = Math.random();
    if (dist <= attackRange && r < 0.6 * this.difficulty) {
      desired.attack = true;
    }
    // f.specialCooldown es el temporizador vivo (f.stats.specialCooldown es solo la
    // constante de configuracion y nunca llega a 0, por eso la CPU jamas usaba el especial).
    if (dist <= specialRange && r < 0.15 * this.difficulty && f.specialCooldown <= 0) {
      desired.special = true;
      desired.attack = false; // el especial reemplaza al golpe basico
    }
    // block-ish retreat occasionally
    if (o.state === 'attack' && dist < 120 && Math.random() < 0.3) {
      if (o.x > f.x) desired.left = true; else desired.right = true;
      desired.attack = false;
    }

    this.current = desired;
    this.decisionTimer = 220 + Math.random() * 260;
    return this.current;
  }

  getState() { return this.current; }
}