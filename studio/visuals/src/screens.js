import * as THREE from '../vendor/three.module.js';
import { mulberry32 } from './textures.js';

// Original painted/procedural screen art for the wall displays inside the 3D scene.
// These are illustrative HUD compositions evoking golf / bowling / hunting / jungle-shooter
// sessions — they are NOT reproductions of any copyrighted game UI, logo or screenshot.
// Each in-scene screen is paired with the same disclaimer in render.html's caption HUD.

function mkCanvas(w = 1024, h = 576) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function toScreenTexture(c) {
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function hudBar(ctx, x, y, w, h, fill, radius = 6) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
}

function label(ctx, text, x, y, { size = 20, color = '#e9f3f0', align = 'left', weight = '700', alpha = 1 } = {}) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Segoe UI", Arial, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** Golden-Tee-style golf course attract/play frame: sky, fairway, green, flag, trajectory HUD. */
export function golfScreenTexture() {
  const c = mkCanvas();
  const ctx = c.getContext('2d');
  const rnd = mulberry32(101);

  const sky = ctx.createLinearGradient(0, 0, 0, 340);
  sky.addColorStop(0, '#bfe3f7');
  sky.addColorStop(1, '#eaf6e3');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1024, 340);

  // Distant tree line.
  ctx.fillStyle = '#4c7a4a';
  for (let x = -20; x < 1044; x += 34) {
    const h = 40 + rnd() * 26;
    ctx.beginPath();
    ctx.moveTo(x, 300);
    ctx.lineTo(x + 17, 300 - h);
    ctx.lineTo(x + 34, 300);
    ctx.closePath();
    ctx.fill();
  }

  // Rolling fairway with mower stripes, converging toward a green.
  const fairway = ctx.createLinearGradient(0, 300, 0, 576);
  fairway.addColorStop(0, '#6fae4e');
  fairway.addColorStop(1, '#3f7a38');
  ctx.fillStyle = fairway;
  ctx.fillRect(0, 300, 1024, 276);
  ctx.save();
  for (let i = 0; i < 9; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    const top = 300 + i * 22;
    const wTop = 60 - i * 3;
    ctx.beginPath();
    ctx.moveTo(512 - wTop * 6, 576 - i * 2);
    ctx.lineTo(512 + wTop * 6, 576 - i * 2);
    ctx.lineTo(512 + wTop * 2, top);
    ctx.lineTo(512 - wTop * 2, top);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Green + bunker + water hazard.
  ctx.fillStyle = '#8bc96a';
  ctx.beginPath();
  ctx.ellipse(700, 330, 150, 46, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d9c68a';
  ctx.beginPath();
  ctx.ellipse(590, 352, 46, 16, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5fa3c9';
  ctx.beginPath();
  ctx.ellipse(250, 365, 70, 20, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Flag + pin.
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(705, 300);
  ctx.lineTo(705, 336);
  ctx.stroke();
  ctx.fillStyle = '#d64545';
  ctx.beginPath();
  ctx.moveTo(705, 300);
  ctx.lineTo(730, 308);
  ctx.lineTo(705, 316);
  ctx.closePath();
  ctx.fill();

  // Dotted trajectory arc from a trackball-style shot.
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 3;
  ctx.setLineDash([6, 10]);
  ctx.beginPath();
  ctx.moveTo(150, 530);
  ctx.quadraticCurveTo(420, 140, 700, 318);
  ctx.stroke();
  ctx.setLineDash([]);

  // HUD chrome.
  hudBar(ctx, 0, 0, 1024, 46, 'rgba(10,22,14,0.55)', 0);
  label(ctx, 'HOLE 1 · PAR 4 · 372 YDS', 20, 30, { size: 22 });
  label(ctx, 'WIND →  7 MPH', 1004, 30, { align: 'right', color: '#d7ffe9' });
  hudBar(ctx, 20, 500, 280, 46, 'rgba(10,22,14,0.6)', 10);
  label(ctx, 'SHOT POWER', 36, 520, { size: 15, color: '#cdeedd' });
  hudBar(ctx, 36, 526, 240, 10, 'rgba(255,255,255,0.18)', 5);
  hudBar(ctx, 36, 526, 168, 10, '#ffb066', 5);
  hudBar(ctx, 740, 500, 264, 46, 'rgba(10,22,14,0.6)', 10);
  label(ctx, 'CLUB: 7-IRON', 756, 528, { size: 17, color: '#ffe6c8' });

  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 10;
  ctx.strokeRect(0, 0, 1024, 576);
  return toScreenTexture(c);
}

/** Silver-Strike-style bowling lane perspective with pins, lane boards and a spin meter. */
export function bowlingScreenTexture() {
  const c = mkCanvas();
  const ctx = c.getContext('2d');

  const sky = ctx.createLinearGradient(0, 0, 0, 180);
  sky.addColorStop(0, '#1c2430');
  sky.addColorStop(1, '#2a3444');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1024, 180);

  // Lane in forced perspective toward a vanishing point.
  const vanishX = 512;
  const vanishY = 150;
  const laneGrad = ctx.createLinearGradient(0, 180, 0, 576);
  laneGrad.addColorStop(0, '#caa15a');
  laneGrad.addColorStop(1, '#8a6228');
  ctx.fillStyle = laneGrad;
  ctx.beginPath();
  ctx.moveTo(vanishX - 40, vanishY);
  ctx.lineTo(vanishX + 40, vanishY);
  ctx.lineTo(1024, 576);
  ctx.lineTo(0, 576);
  ctx.closePath();
  ctx.fill();

  // Plank seams converging to the vanishing point.
  ctx.strokeStyle = 'rgba(60,35,10,0.35)';
  ctx.lineWidth = 1.4;
  for (let i = -6; i <= 6; i++) {
    ctx.beginPath();
    ctx.moveTo(vanishX + i * 7, vanishY);
    ctx.lineTo(vanishX + i * 80, 576);
    ctx.stroke();
  }
  // Gutters.
  ctx.fillStyle = '#12161c';
  ctx.beginPath();
  ctx.moveTo(vanishX - 40, vanishY);
  ctx.lineTo(vanishX - 60, vanishY);
  ctx.lineTo(0, 576);
  ctx.lineTo(120, 576);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(vanishX + 40, vanishY);
  ctx.lineTo(vanishX + 60, vanishY);
  ctx.lineTo(1024, 576);
  ctx.lineTo(904, 576);
  ctx.closePath();
  ctx.fill();

  // Pins (triangular rack near the vanishing point).
  const pinRows = [[0], [-1, 1], [-2, 0, 2], [-3, -1, 1, 3]];
  ctx.fillStyle = '#f4efe4';
  pinRows.forEach((row, r) => {
    const py = vanishY + 6 + r * 7;
    row.forEach((cIdx) => {
      const px = vanishX + cIdx * 7;
      ctx.beginPath();
      ctx.ellipse(px, py, 2.6, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  });

  // Ball mid-lane with motion streak.
  ctx.fillStyle = '#2b2f36';
  ctx.beginPath();
  ctx.ellipse(470, 430, 22, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(300, 470);
  ctx.quadraticCurveTo(400, 445, 470, 430);
  ctx.stroke();

  // HUD.
  hudBar(ctx, 0, 0, 1024, 46, 'rgba(8,12,18,0.6)', 0);
  label(ctx, 'FRAME 3 · GAME 1', 20, 30, { size: 22 });
  label(ctx, 'SCORE 148', 1004, 30, { align: 'right', color: '#bfe8ff' });
  hudBar(ctx, 20, 496, 300, 50, 'rgba(8,12,18,0.6)', 10);
  label(ctx, 'SPIN / ROTATE', 36, 516, { size: 14, color: '#cfe9ff' });
  // Curved spin gauge.
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(170, 538, 70, Math.PI, Math.PI * 1.65);
  ctx.stroke();
  ctx.strokeStyle = '#2bd9c7';
  ctx.beginPath();
  ctx.arc(170, 538, 70, Math.PI, Math.PI * 1.42);
  ctx.stroke();
  hudBar(ctx, 720, 496, 284, 50, 'rgba(8,12,18,0.6)', 10);
  label(ctx, 'STRIKE!', 862, 528, { size: 22, align: 'center', color: '#ffd37a' });

  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 10;
  ctx.strokeRect(0, 0, 1024, 576);
  return toScreenTexture(c);
}

/** Dusk wetland hunting scene: silhouetted buck, reeds, reticle and ammo HUD. */
export function huntScreenTexture() {
  const c = mkCanvas();
  const ctx = c.getContext('2d');
  const rnd = mulberry32(303);

  const sky = ctx.createLinearGradient(0, 0, 0, 380);
  sky.addColorStop(0, '#2a2140');
  sky.addColorStop(0.55, '#8a5a52');
  sky.addColorStop(1, '#e8a455');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1024, 380);

  // Sun disc low on the horizon.
  ctx.fillStyle = 'rgba(255,214,150,0.9)';
  ctx.beginPath();
  ctx.arc(760, 330, 60, 0, Math.PI * 2);
  ctx.fill();

  // Tree silhouettes.
  ctx.fillStyle = '#1c1420';
  for (let x = -20; x < 1044; x += 60) {
    const h = 120 + rnd() * 160;
    const lean = (rnd() - 0.5) * 20;
    ctx.beginPath();
    ctx.moveTo(x, 380);
    ctx.lineTo(x + 6 + lean, 380 - h);
    ctx.lineTo(x + 12, 380);
    ctx.closePath();
    ctx.fill();
  }

  // Marsh water + reeds.
  const water = ctx.createLinearGradient(0, 380, 0, 576);
  water.addColorStop(0, '#3a2f3c');
  water.addColorStop(1, '#171320');
  ctx.fillStyle = water;
  ctx.fillRect(0, 380, 1024, 196);
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  for (let i = 0; i < 40; i++) {
    const x = rnd() * 1024;
    const y = 400 + rnd() * 160;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rnd() - 0.5) * 10, y - 30 - rnd() * 30);
    ctx.stroke();
  }

  // Buck silhouette with antlers, standing in the clearing.
  ctx.fillStyle = '#120d16';
  ctx.save();
  ctx.translate(430, 300);
  ctx.beginPath();
  ctx.ellipse(0, 40, 70, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-56, 55, 10, 45);
  ctx.fillRect(40, 55, 10, 45);
  ctx.beginPath();
  ctx.ellipse(66, 6, 26, 20, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#120d16';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(72, -10);
    ctx.lineTo(72 + s * 18, -46);
    ctx.lineTo(72 + s * 30, -34);
    ctx.moveTo(72 + s * 18, -46);
    ctx.lineTo(72 + s * 6, -58);
    ctx.stroke();
  }
  ctx.restore();

  // Reticle.
  ctx.strokeStyle = 'rgba(235,240,225,0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(512, 288, 34, 0, Math.PI * 2);
  ctx.moveTo(512 - 50, 288);
  ctx.lineTo(512 - 40, 288);
  ctx.moveTo(512 + 40, 288);
  ctx.lineTo(512 + 50, 288);
  ctx.moveTo(512, 238);
  ctx.lineTo(512, 248);
  ctx.moveTo(512, 328);
  ctx.lineTo(512, 338);
  ctx.stroke();

  // HUD.
  hudBar(ctx, 0, 0, 1024, 46, 'rgba(10,8,14,0.6)', 0);
  label(ctx, 'ROUND 1 · 02:14', 20, 30, { size: 22 });
  label(ctx, 'SCORE 0', 1004, 30, { align: 'right', color: '#ffd9b0' });
  hudBar(ctx, 20, 500, 220, 46, 'rgba(10,8,14,0.6)', 10);
  label(ctx, 'AMMO', 36, 520, { size: 14, color: '#f0d8c0' });
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i < 5 ? '#e79a52' : 'rgba(255,255,255,0.2)';
    ctx.fillRect(36 + i * 28, 526, 18, 10);
  }
  hudBar(ctx, 790, 500, 214, 46, 'rgba(10,8,14,0.6)', 10);
  label(ctx, 'TRIGGER + PUMP', 806, 522, { size: 13, color: '#ffe6c8' });
  label(ctx, 'PLAY MODE: RELEASE-GATED', 806, 538, { size: 10, color: '#c9b9a8' });

  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 10;
  ctx.strokeRect(0, 0, 1024, 576);
  return toScreenTexture(c);
}

/** Prehistoric jungle scene for the mounted-gun configuration: volcano, ferns, a lunging dino. */
export function jungleScreenTexture() {
  const c = mkCanvas();
  const ctx = c.getContext('2d');
  const rnd = mulberry32(707);

  const sky = ctx.createLinearGradient(0, 0, 0, 340);
  sky.addColorStop(0, '#0f2b2a');
  sky.addColorStop(1, '#2f5b3d');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1024, 340);

  // Volcano silhouette with a glowing vent.
  ctx.fillStyle = '#17241c';
  ctx.beginPath();
  ctx.moveTo(620, 340);
  ctx.lineTo(760, 120);
  ctx.lineTo(900, 340);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,140,60,0.85)';
  ctx.beginPath();
  ctx.ellipse(760, 128, 14, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(120,120,120,0.35)';
  ctx.beginPath();
  ctx.ellipse(772, 95, 30, 16, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Dense jungle canopy + fern silhouettes foreground.
  ctx.fillStyle = '#122417';
  for (let x = -20; x < 1044; x += 50) {
    const h = 90 + rnd() * 140;
    ctx.beginPath();
    ctx.ellipse(x, 340 - h * 0.2, 46, h * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const ground = ctx.createLinearGradient(0, 300, 0, 576);
  ground.addColorStop(0, '#1d3a24');
  ground.addColorStop(1, '#0c1811');
  ctx.fillStyle = ground;
  ctx.fillRect(0, 300, 1024, 276);

  ctx.fillStyle = '#0d1a10';
  for (let i = 0; i < 10; i++) {
    const x = rnd() * 1024;
    const y = 420 + rnd() * 140;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rnd() - 0.5) * 0.6);
    for (let f = -2; f <= 2; f++) {
      ctx.beginPath();
      ctx.ellipse(f * 16, 0, 26, 7, f * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Lunging raptor-like silhouette.
  ctx.fillStyle = '#0a1410';
  ctx.save();
  ctx.translate(560, 260);
  ctx.beginPath();
  ctx.moveTo(-70, 60);
  ctx.quadraticCurveTo(-30, -10, 40, -30);
  ctx.quadraticCurveTo(70, -34, 86, -46);
  ctx.quadraticCurveTo(72, -30, 58, -22);
  ctx.quadraticCurveTo(30, 10, 18, 60);
  ctx.lineTo(30, 70);
  ctx.lineTo(6, 70);
  ctx.lineTo(0, 40);
  ctx.lineTo(-20, 68);
  ctx.lineTo(-46, 66);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(78, -40);
  ctx.lineTo(96, -44);
  ctx.lineTo(80, -32);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Mounted-gun reticle (heavier bracket style, distinct from the handheld reticle).
  ctx.strokeStyle = 'rgba(220,255,230,0.9)';
  ctx.lineWidth = 3;
  const rx = 540;
  const ry = 300;
  ctx.strokeRect(rx - 46, ry - 46, 92, 92);
  ctx.beginPath();
  ctx.moveTo(rx - 60, ry);
  ctx.lineTo(rx - 50, ry);
  ctx.moveTo(rx + 50, ry);
  ctx.lineTo(rx + 60, ry);
  ctx.stroke();

  // HUD — mounted-control framing, distinct wording from the handheld hunt screen.
  hudBar(ctx, 0, 0, 1024, 46, 'rgba(8,16,10,0.6)', 0);
  label(ctx, 'MOUNTED CONTROL ACTIVE', 20, 30, { size: 22 });
  label(ctx, 'SCORE 0', 1004, 30, { align: 'right', color: '#cdf5d8' });
  hudBar(ctx, 20, 500, 260, 46, 'rgba(8,16,10,0.6)', 10);
  label(ctx, 'GIMBAL AIM · 2-AXIS', 36, 522, { size: 14, color: '#d7ffe0' });
  label(ctx, 'VIBRATION FEEDBACK ARMED', 36, 538, { size: 11, color: '#9fcfa8' });
  hudBar(ctx, 760, 500, 244, 46, 'rgba(8,16,10,0.6)', 10);
  label(ctx, 'MISSION 1 · GATE BREACH', 776, 522, { size: 13, color: '#e8ffe6' });
  label(ctx, '2 PLAYERS · SIMULTANEOUS', 776, 538, { size: 11, color: '#9fcfa8' });

  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 10;
  ctx.strokeRect(0, 0, 1024, 576);
  return toScreenTexture(c);
}
