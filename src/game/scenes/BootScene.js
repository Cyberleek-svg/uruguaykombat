import { ROSTER } from '../systems/Roster.js';
import { ANIM_FRAMES, ANIM_FPS, FRAME, GAME_HEIGHT, GROUND_TOP, GROUND_TOP_PROCEDURAL, STAGE_SRC_HEIGHT } from '../config.js';
import { goToScene } from '../systems/SceneFlow.js';

// Assets reales (se cargan si existen en /public/assets).
// Si un archivo falta, se usa el placeholder procedural correspondiente.
const REAL_ASSETS = {
  stage_bg: 'assets/stages/stage_bg.png',
  stage_mid: 'assets/stages/stage_mid.png',
  stage_fg: 'assets/stages/stage_fg.png',
  stage_clouds: 'assets/stages/stage_clouds.png', // opcional: nubes que se mueven solas
  menu_bg: 'assets/ui/menu_bg.png',
  select_bg: 'assets/ui/select_bg.png',
  vs_bg: 'assets/ui/vs_bg.png', // opcional: fondo propio de la pantalla VS
  spark: 'assets/particles/spark.png', // opcional: particula de impacto
};

// Musica de fondo (.mp3). Si falta el archivo, el juego corre en silencio.
const REAL_AUDIO = {
  menu_music: 'assets/audio/menu_music.mp3',
  battle_music: 'assets/audio/battle_music.mp3',
};

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    // Barra de carga: en celular con datos lentos evita quedarse con pantalla negra.
    const { width: bw, height: bh } = this.scale;
    this.add.text(bw / 2, bh / 2 - 44, 'CARGANDO...', {
      fontSize: '26px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.rectangle(bw / 2, bh / 2, 404, 24, 0x222222).setStrokeStyle(2, 0xffffff);
    const bar = this.add.rectangle(bw / 2 - 200, bh / 2, 1, 18, 0xff2222).setOrigin(0, 0.5);
    this.load.on('progress', (v) => { bar.width = Math.max(1, 400 * v); });

    // Archivos reales (si no existen, se registra el error y se usa placeholder).
    this.load.on('loaderror', (file) => {
      console.warn(`[BootScene] No se encontro el asset "${file.key}" (${file.src}); se usara placeholder procedural.`);
    });
    Object.entries(REAL_ASSETS).forEach(([key, src]) => this.load.image(key, src));
    Object.entries(REAL_AUDIO).forEach(([key, src]) => this.load.audio(key, src));
    // Retratos para el selector (opcionales: si faltan, se usa el placeholder de color).
    ROSTER.forEach((d) => {
      this.load.image(`portrait_${d.id}`, `assets/portraits/${d.id}.png`);
    });
    // Voces por personaje (opcionales: 5 archivos por luchador).
    // Ruta: assets/audio/voices/<id>_1.mp3 ... <id>_5.mp3
    ROSTER.forEach((d) => {
      for (let i = 1; i <= 5; i++) {
        this.load.audio(`voice_${d.id}_${i}`, `assets/audio/voices/${d.id}_${i}.mp3`);
      }
    });
    // Hojas de sprites REALES por personaje (opcionales).
    // Formato: assets/sprites/<id>_<anim>.png -> tira horizontal de frames 256x256.
    // Si falta alguna animacion, esa se dibuja con placeholder procedural.
    ROSTER.forEach((d) => {
      Object.keys(ANIM_FRAMES).forEach((anim) => {
        this.load.image(`raw_${d.id}_${anim}`, `assets/sprites/${d.id}_${anim}.png`);
      });
    });
  }

  create() {
    try {
      this.composeFighterSheets();
      this.prepareStages();
      this.prepareUI();
      this.generateParticle();
    } catch (e) {
      console.error('Boot error', e);
    }
    setTimeout(() => goToScene(this, 'MenuScene'), 100);
  }

  // --- Stages: usa el arte real si existe, si no genera placeholder ---
  prepareStages() {
    if (!this.textures.exists('stage_bg')) {
      this.generateStageBg();
      // Placeholder: nubes propias para que se vea el movimiento del fondo.
      if (!this.textures.exists('stage_clouds')) this.generateStageClouds();
    }
    if (this.textures.exists('stage_mid')) {
      // Quita el fondo blanco exportado opaco (deberia venir con alpha).
      this.keyOutWhite('stage_mid');
    } else {
      this.generateStageMid();
    }
    if (this.textures.exists('stage_fg')) {
      this.keyOutWhite('stage_fg');
      // Detecta la linea de piso del stage real (funciona en web/dev).
      // En Electron empaquetado el canvas de file:// puede estar "tainted":
      // en ese caso usamos el valor por defecto del config, ya calibrado.
      let srcY = null;
      try { srcY = this.detectFloorLine('stage_fg'); } catch (e) { /* ignore */ }
      const screenY = srcY
        ? Math.round(srcY * (GAME_HEIGHT / STAGE_SRC_HEIGHT))
        : GROUND_TOP; // GROUND_TOP = linea del stage real
      this.registry.set('groundTopScreen', screenY);
    } else {
      this.generateStageFg();
      this.registry.set('groundTopScreen', GROUND_TOP_PROCEDURAL);
    }
  }

  prepareUI() {
    if (!this.textures.exists('menu_bg')) this.generateMenuBg();
    if (!this.textures.exists('select_bg')) this.generateSelectBg();
  }

  // Convierte en transparente el blanco contiguo a los bordes (quita el fondo
  // blanco de PNGs exportados sin canal alpha), preservando blancos internos.
  keyOutWhite(key, tol = 18) {
    try {
      const img = this.textures.get(key).getSourceImage();
      const W = img.width, H = img.height;
      const canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, W, H);
      const d = data.data;
      // Si el PNG ya trae alpha (borde superior transparente), no hay nada que hacer.
      if (d[3] < 250) return;
      const visited = new Uint8Array(W * H);
      const stack = new Int32Array(W * H + 4);
      let sp = 0;
      const push = (x, y) => {
        if (x >= 0 && y >= 0 && x < W && y < H) stack[sp++] = y * W + x;
      };
      for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
      for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }
      const thr = 255 - tol;
      while (sp > 0) {
        const p = stack[--sp];
        if (visited[p]) continue;
        visited[p] = 1;
        const i = p * 4;
        if (d[i] < thr || d[i + 1] < thr || d[i + 2] < thr) continue;
        d[i + 3] = 0;
        const x = p % W;
        const y = (p - x) / W;
        push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
      }
      ctx.putImageData(data, 0, 0);
      this.textures.remove(key);
      this.textures.addImage(key, canvas);
    } catch (e) {
      console.warn(`[BootScene] keyOutWhite("${key}") omitido:`, e.message);
    }
  }

  // Devuelve el Y (en pixeles del stage, 1920x1080) de la linea de piso:
  // la primera fila (desde abajo) donde la banda opaca se corta.
  detectFloorLine(key) {
    const img = this.textures.get(key).getSourceImage();
    const W = img.width, H = img.height;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, W, H).data;
    for (let y = H - 1; y >= 0; y--) {
      let opaque = 0, total = 0;
      for (let x = 0; x < W; x += 8) {
        total++;
        if (d[(y * W + x) * 4 + 3] > 128) opaque++;
      }
      if (opaque / total < 0.5) return y + 1;
    }
    return null;
  }

  // --- Luchadores -----------------------------------------------------------
  // Combina las hojas REALES (public/assets/sprites/<id>_<anim>.png) con
  // placeholders procedurales para las animaciones que falten, todo dentro de
  // UNA textura "fighter_<id>" para no tener que tocar Fighter.js.
  composeFighterSheets() {
    ROSTER.forEach((data) => {
      const usados = {}; // anim -> { x, frames, real, canvas }
      let total = 0;

      Object.keys(ANIM_FRAMES).forEach((anim) => {
        const real = this.loadRealSheet(data.id, anim);
        if (real) {
          usados[anim] = { x: total * FRAME.w, frames: real.frames, real: true, canvas: real.canvas };
          total += real.frames;
        } else {
          usados[anim] = { x: total * FRAME.w, frames: ANIM_FRAMES[anim], real: false };
          total += ANIM_FRAMES[anim];
        }
      });

      const canvas = document.createElement('canvas');
      canvas.width = FRAME.w * total;
      canvas.height = FRAME.h;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1) hojas reales (ya con el fondo quitado)
      Object.values(usados).forEach((u) => {
        if (u.real) ctx.drawImage(u.canvas, u.x, 0);
      });
      // 2) placeholders en los huecos de las animaciones que faltan
      Object.entries(usados).forEach(([anim, u]) => {
        if (u.real) return;
        for (let f = 0; f < u.frames; f++) this.drawPlaceholderFrame(ctx, u.x + f * FRAME.w, data, anim, f);
      });

      this.textures.addSpriteSheet(`fighter_${data.id}`, canvas, { frameWidth: FRAME.w, frameHeight: FRAME.h });

      // 3) animaciones con los rangos REALES: una hoja puede traer menos frames
      //    de los que pide el contrato y se usa igual, con los que hay.
      Object.entries(usados).forEach(([anim, u]) => {
        const key = `${data.id}_${anim}`;
        if (this.anims.exists(key)) this.anims.remove(key);
        const primero = u.x / FRAME.w;
        this.anims.create({
          key,
          frames: this.anims.generateFrameNumbers(`fighter_${data.id}`, {
            start: primero,
            end: primero + u.frames - 1,
          }),
          frameRate: ANIM_FPS[anim],
          repeat: anim === 'idle' || anim === 'walk' ? -1 : 0,
        });
      });
    });
  }

  // Trae una hoja real, le saca el fondo plano (chroma key) y devuelve el canvas
  // listo para pegar. Devuelve null si no existe o si no respeta el contrato.
  loadRealSheet(id, anim) {
    const rawKey = `raw_${id}_${anim}`;
    if (!this.textures.exists(rawKey)) return null;
    const img = this.textures.get(rawKey).getSourceImage();
    if (!img || !img.width || !img.height) return null;

    if (img.height !== FRAME.h || img.width % FRAME.w !== 0) {
      console.warn(
        `[BootScene] ${rawKey}.png mide ${img.width}x${img.height}. Debe medir 256 de alto y un multiplo de 256 de ancho (un frame por cada 256px). Se ignora y se usa placeholder.`
      );
      this.textures.remove(rawKey);
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    this.quitarFondoPlano(ctx, img.width, img.height);
    this.textures.remove(rawKey); // la textura cruda ya no hace falta

    const frames = Math.max(1, Math.round(img.width / FRAME.w));
    return { frames, canvas };
  }

  // Chroma key automatico: si el fondo es un color plano opaco (verde, blanco,
  // magenta...) lo vuelve transparente, con decaimiento suave en los bordes
  // para no dejar una orla del color del fondo alrededor del personaje.
  quitarFondoPlano(ctx, w, h, tolerancia = 95) {
    const d = ctx.getImageData(0, 0, w, h);
    const p = d.data;
    // El color de fondo se toma de las 4 esquinas.
    const esquinas = [0, (w - 1) * 4, (h - 1) * w * 4, ((h - 1) * w + w - 1) * 4];
    if (esquinas.some((i) => p[i + 3] < 128)) return false; // ya trae alfa: no tocar

    let br = 0, bg = 0, bb = 0;
    esquinas.forEach((i) => { br += p[i]; bg += p[i + 1]; bb += p[i + 2]; });
    br = Math.round(br / 4); bg = Math.round(bg / 4); bb = Math.round(bb / 4);

    const suave = tolerancia * 1.8;
    let tocados = 0;
    for (let i = 0; i < p.length; i += 4) {
      const dr = p[i] - br, dg = p[i + 1] - bg, db = p[i + 2] - bb;
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);
      if (dist <= tolerancia) {
        p[i + 3] = 0;
        tocados++;
      } else if (dist < suave) {
        const k = (dist - tolerancia) / (suave - tolerancia);
        p[i + 3] = Math.min(p[i + 3], Math.round(p[i + 3] * k));
        tocados++;
      }
    }
    if (tocados) {
      ctx.putImageData(d, 0, 0);
      console.log(`[BootScene] Chroma key: fondo rgb(${br},${bg},${bb}) removido en ${tocados} px de la hoja ${w}x${h}.`);
    }
    return tocados > 0;
  }

  drawPlaceholderFrame(ctx, x, data, anim, f) {
          // background transparent
          ctx.clearRect(x, 0, FRAME.w, FRAME.h);
          // body rectangle (hurtbox-ish)
          const cx = x + FRAME.w / 2;
          const cy = FRAME.h / 2 + 20;
          // shadow
          ctx.fillStyle = 'rgba(0,0,0,0.35)';
          ctx.beginPath();
          ctx.ellipse(cx, FRAME.h - 18, 46, 12, 0, 0, Math.PI * 2);
          ctx.fill();
          // torso
          ctx.fillStyle = '#' + data.color.toString(16).padStart(6, '0');
          roundRect(ctx, cx - 40, cy - 90, 80, 180, 12);
          ctx.fill();
          // head
          ctx.fillStyle = data.accent ? '#' + data.accent.toString(16).padStart(6, '0') : '#ffffff';
          ctx.beginPath();
          ctx.arc(cx, cy - 105, 34, 0, Math.PI * 2);
          ctx.fill();
          // eyes
          ctx.fillStyle = '#000';
          const eyeOffset = anim === 'hit' ? 2 : 0;
          ctx.fillRect(cx - 14, cy - 112 + eyeOffset, 6, 6);
          ctx.fillRect(cx + 8, cy - 112 + eyeOffset, 6, 6);
          // mouth
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2;
          ctx.beginPath();
          if (anim === 'attack' || anim === 'special') {
            ctx.arc(cx, cy - 95, 8, 0, Math.PI, false);
          } else if (anim === 'hit') {
            ctx.arc(cx, cy - 88, 8, Math.PI, Math.PI * 2, false);
          } else {
            ctx.moveTo(cx - 8, cy - 92);
            ctx.lineTo(cx + 8, cy - 92);
          }
          ctx.stroke();

          // pose variations per anim/frame
          if (anim === 'walk') {
            const leg = f % 2 === 0 ? 6 : -6;
            ctx.fillStyle = '#' + darken(data.color, 0.3).toString(16).padStart(6, '0');
            ctx.fillRect(cx - 30 + leg, cy + 70, 18, 22);
            ctx.fillRect(cx + 12 - leg, cy + 70, 18, 22);
          }
          if (anim === 'attack') {
            // arm punch on frame 2 (hitbox active frame index 2 -> frame 3)
            if (f >= 2) {
              ctx.fillStyle = '#' + darken(data.color, 0.2).toString(16).padStart(6, '0');
              ctx.fillRect(cx + 40, cy - 30, 50, 18);
            }
          }
          if (anim === 'special') {
            // glowing aura
            ctx.strokeStyle = 'rgba(255,215,0,0.7)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(cx, cy - 10, 70 + (f % 3) * 4, 0, Math.PI * 2);
            ctx.stroke();
          }
          // label
          ctx.fillStyle = 'rgba(255,255,255,0.6)';
          ctx.font = '12px monospace';
          ctx.fillText(`${data.id} ${anim} ${f} placeholder`, x + 6, 16);
  }

  generateStageBg() {
    // 1920x1080
    const w = 1920, h = 1080;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#1a237e'); g.addColorStop(0.5, '#283593'); g.addColorStop(1, '#0d1b3e');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    // stars
    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.8 + 0.2})`;
      ctx.fillRect(Math.random() * w, Math.random() * h * 0.6, 2, 2);
    }
    // moon
    ctx.fillStyle = '#fff9c4';
    ctx.beginPath(); ctx.arc(w * 0.8, h * 0.18, 60, 0, Math.PI * 2); ctx.fill();
    this.textures.addImage('stage_bg', c);
  }

  // Capa de nubes (solo placeholder: solo se usa si el usuario no tiene stage real).
  // Es transparente para poder superponerse al fondo y derivar suavemente.
  generateStageClouds() {
    const w = 1920, h = 1080;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    const drawCloud = (x, y, s) => {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      [[0, 0, 60], [50, -12, 48], [100, 0, 56], [50, 14, 62]].forEach(([dx, dy, r]) => {
        ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); ctx.fill();
      });
    };
    for (let i = 0; i < 7; i++) {
      drawCloud(Math.random() * w, 80 + Math.random() * 300, 0.7 + Math.random() * 0.6);
    }
    this.textures.addImage('stage_clouds', c);
  }

  generateStageMid() {
    const w = 1920, h = 1080;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    // buildings
    for (let i = 0; i < 14; i++) {
      const bw = 80 + Math.random() * 120;
      const bh = 200 + Math.random() * 400;
      const x = i * (w / 14) + Math.random() * 40;
      ctx.fillStyle = `rgba(20,30,60,${0.7 + Math.random() * 0.2})`;
      ctx.fillRect(x, h - bh, bw, bh);
      // windows
      ctx.fillStyle = 'rgba(255,235,59,0.6)';
      for (let wy = h - bh + 20; wy < h - 20; wy += 28) {
        for (let wx = x + 10; wx < x + bw - 10; wx += 22) {
          if (Math.random() > 0.4) ctx.fillRect(wx, wy, 10, 14);
        }
      }
    }
    // ground line
    ctx.fillStyle = '#0d1b3e';
    ctx.fillRect(0, h - 60, w, 60);
    this.textures.addImage('stage_mid', c);
  }

  generateStageFg() {
    const w = 1920, h = 1080;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    // fence
    ctx.fillStyle = '#3e2723';
    for (let i = 0; i < 40; i++) {
      const x = i * 50;
      ctx.fillRect(x, h - 110, 8, 60);
    }
    ctx.fillRect(0, h - 95, w, 6);
    ctx.fillRect(0, h - 70, w, 6);
    // ground
    ctx.fillStyle = '#1b5e20';
    ctx.fillRect(0, h - 50, w, 50);
    ctx.fillStyle = '#2e7d32';
    for (let i = 0; i < w; i += 40) ctx.fillRect(i, h - 50, 20, 8);
    this.textures.addImage('stage_fg', c);
  }

  generateUI() {
    // portrait placeholder
    const c = document.createElement('canvas'); c.width = 96; c.height = 96;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#333'; ctx.fillRect(0, 0, 96, 96);
    ctx.strokeStyle = '#fff'; ctx.strokeRect(0, 0, 96, 96);
    this.textures.addImage('portrait', c);
  }

  generateMenuBg() {
    const w = 1280, h = 720;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#0a0a1a'); g.addColorStop(0.5, '#1a0a2e'); g.addColorStop(1, '#2e0a1a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    // scanlines
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
    // grid
    ctx.strokeStyle = 'rgba(255,0,0,0.25)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    this.textures.addImage('menu_bg', c);
  }

  generateSelectBg() {
    const w = 1280, h = 720;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#1a1a2e'); g.addColorStop(1, '#0a0a0a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < 60; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    this.textures.addImage('select_bg', c);
  }

  generateParticle() {
    // Solo si el usuario no aporto su propia particula (assets/particles/spark.png).
    if (this.textures.exists('spark')) return;
    const c = document.createElement('canvas'); c.width = 8; c.height = 8;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 8, 8);
    this.textures.addImage('spark', c);
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function darken(color, amt) {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return ((Math.max(0, r - amt * 255) | 0) << 16) | ((Math.max(0, g - amt * 255) | 0) << 8) | (Math.max(0, b - amt * 255) | 0);
}