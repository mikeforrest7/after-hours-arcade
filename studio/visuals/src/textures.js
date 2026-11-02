import * as THREE from '../vendor/three.module.js';

// All surface textures are generated procedurally on an HTML canvas at module-load time.
// No external image files, no internet access required to view the scene.

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function toTexture(c, { repeatX = 1, repeatY = 1, srgb = true } = {}) {
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = 8;
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Walnut plank wood grain: warm base + layered streak grain + end-grain pore noise. */
export function woodTexture({ base = '#6b4327', dark = '#2c180c', light = '#a9774a', seed = 7, planks = 4 } = {}) {
  const c = canvas(512, 512);
  const ctx = c.getContext('2d');
  const rnd = mulberry32(seed);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 512, 512);

  // Long grain streaks, horizontal (wrapped along the board's length).
  for (let i = 0; i < 90; i++) {
    const y = rnd() * 512;
    const amp = 2 + rnd() * 10;
    const hue = rnd() > 0.5 ? dark : light;
    ctx.strokeStyle = hue;
    ctx.globalAlpha = 0.05 + rnd() * 0.12;
    ctx.lineWidth = 0.6 + rnd() * 2.2;
    ctx.beginPath();
    let py = y;
    ctx.moveTo(0, py);
    for (let x = 0; x <= 512; x += 16) {
      py = y + Math.sin(x * 0.012 + i) * amp + (rnd() - 0.5) * 3;
      ctx.lineTo(x, py);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Plank seams.
  ctx.strokeStyle = 'rgba(10,6,3,0.35)';
  ctx.lineWidth = 2;
  for (let p = 1; p < planks; p++) {
    const x = (512 / planks) * p;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }

  // Fine pore speckle.
  for (let i = 0; i < 2200; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(20,10,4,0.10)' : 'rgba(255,230,190,0.05)';
    ctx.fillRect(rnd() * 512, rnd() * 512, 1, 1);
  }
  return toTexture(c);
}

/** Matte charcoal structural laminate with subtle fleck + soft panel sheen gradient. */
export function charcoalTexture({ base = '#232327', seed = 3 } = {}) {
  const c = canvas(256, 256);
  const ctx = c.getContext('2d');
  const rnd = mulberry32(seed);
  const grad = ctx.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, '#2a2a30');
  grad.addColorStop(0.5, base);
  grad.addColorStop(1, '#1c1c20');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3000; i++) {
    const v = rnd();
    ctx.fillStyle = v > 0.5 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.05)';
    ctx.fillRect(rnd() * 256, rnd() * 256, 1, 1);
  }
  return toTexture(c, { repeatX: 2, repeatY: 2 });
}

/** Brushed aluminium: fine horizontal anisotropic streak noise. */
export function brushedMetalTexture({ seed = 11 } = {}) {
  const c = canvas(256, 256);
  const ctx = c.getContext('2d');
  const rnd = mulberry32(seed);
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#e9ebee');
  grad.addColorStop(0.5, '#b7bcc2');
  grad.addColorStop(1, '#8d9298');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y++) {
    ctx.strokeStyle = `rgba(${rnd() > 0.5 ? '255,255,255' : '40,42,46'},${0.04 + rnd() * 0.08})`;
    ctx.beginPath();
    ctx.moveTo(0, y + (rnd() - 0.5));
    ctx.lineTo(256, y + (rnd() - 0.5));
    ctx.stroke();
  }
  return toTexture(c, { repeatX: 1, repeatY: 1 });
}

/** Perforated speaker-grille: dark backer with a dot grid of drilled holes. */
export function grilleTexture({ holeColor = '#050505', backer = '#1b1b1e' } = {}) {
  const c = canvas(256, 256);
  const ctx = c.getContext('2d');
  ctx.fillStyle = backer;
  ctx.fillRect(0, 0, 256, 256);
  const step = 12;
  for (let y = step / 2; y < 256; y += step) {
    for (let x = step / 2; x < 256; x += step) {
      const offset = (Math.round(y / step) % 2) * (step / 2);
      ctx.fillStyle = holeColor;
      ctx.beginPath();
      ctx.arc((x + offset) % 256, y, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  return toTexture(c, { repeatX: 2, repeatY: 1 });
}

/** Woven charcoal area-rug texture with a teal piping tone worked into the weave. */
export function rugTexture({ base = '#201d1d', piping = '#2bb3a3', seed = 21 } = {}) {
  const c = canvas(512, 512);
  const ctx = c.getContext('2d');
  const rnd = mulberry32(seed);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 512, 512);
  ctx.globalAlpha = 0.5;
  for (let y = 0; y < 512; y += 3) {
    ctx.strokeStyle = rnd() > 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.03)';
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // Border frame with a single piping line, inset.
  ctx.strokeStyle = piping;
  ctx.globalAlpha = 0.65;
  ctx.lineWidth = 4;
  ctx.strokeRect(26, 26, 460, 460);
  ctx.globalAlpha = 1;
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.08)';
    ctx.fillRect(rnd() * 512, rnd() * 512, 1, 1);
  }
  return toTexture(c, { repeatX: 1, repeatY: 1 });
}

/** Soft radial glow sprite used for faux-bloom around emissive signage/accents. */
export function glowSpriteTexture(hexColor = '#ff9c4a') {
  const c = canvas(128, 128);
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, hexColor);
  grad.addColorStop(0.35, hexColor);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/** Thin fabric/felt texture for seat pads or acoustic infill (subtle use). */
export function feltTexture({ base = '#232327', seed = 44 } = {}) {
  const c = canvas(128, 128);
  const ctx = c.getContext('2d');
  const rnd = mulberry32(seed);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(rnd() * 128, rnd() * 128, 1, 1);
  }
  return toTexture(c, { repeatX: 3, repeatY: 3 });
}

export { canvas, toTexture, mulberry32 };
