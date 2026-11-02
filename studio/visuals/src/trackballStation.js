import * as THREE from '../vendor/three.module.js';
import { STATION_A, PALETTE } from './config.js';
import { Materials } from './materials.js';
import { roundedBox, arcadeButton } from './geometryHelpers.js';

function plaqueTexture(text) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 64);
  grad.addColorStop(0, '#d8dadf');
  grad.addColorStop(1, '#9aa0a6');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = '#20232a';
  ctx.font = '700 22px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '2px';
  ctx.fillText(text, 128, 34);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function labelSprite(text, sub) {
  const c = document.createElement('canvas');
  c.width = 384;
  c.height = 112;
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(14,16,18,0.82)';
  ctx.beginPath();
  ctx.roundRect(0, 0, 384, 112, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(43,217,199,0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(1, 1, 382, 110, 10);
  ctx.stroke();
  ctx.fillStyle = '#f3f6f5';
  ctx.font = '700 26px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(text, 18, 46);
  ctx.fillStyle = '#b9c6c3';
  ctx.font = '400 17px "Segoe UI", Arial, sans-serif';
  wrapText(ctx, sub, 18, 72, 348, 20);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.68, 0.198, 1);
  sprite.renderOrder = 10;
  return sprite;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (const w of words) {
    const test = line + w + ' ';
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = w + ' ';
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, yy);
}

/**
 * Station A — Trackball Pedestal (Golden Tee / Silver Strike). Returns a group plus a
 * setExplode(t) function (0 = assembled furniture, 1 = fully broken into labeled panels)
 * used to drive both the "trackball" product view and the "exploded" construction view.
 */
export function buildTrackballStation() {
  const root = new THREE.Group();
  root.name = 'stationA';

  const W = STATION_A.width;
  const D = STATION_A.depth;
  const baseH = 0.08;
  const bodyH = 0.74;
  const deckH = 0.13;

  const explodables = [];
  function track(mesh, exploded) {
    mesh.userData.assembled = mesh.position.clone();
    mesh.userData.exploded = mesh.position.clone().add(exploded);
    explodables.push(mesh);
    return mesh;
  }

  // Floating plinth with a recessed teal underglow strip.
  const plinth = new THREE.Mesh(roundedBox(W - 0.05, D - 0.06, baseH, 0.012, 0.004), Materials.charcoal());
  plinth.position.set(0, 0, 0.012);
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  root.add(track(plinth, new THREE.Vector3(0, 0, -0.42)));

  const kick = new THREE.Mesh(new THREE.BoxGeometry(W - 0.09, 0.012, 0.01), Materials.tealAccent());
  kick.position.set(0, D / 2 - 0.02, 0.006);
  root.add(track(kick, new THREE.Vector3(0, 0, -0.42)));
  const kickLight = new THREE.PointLight(0x2bd9c7, 0.7, 1.1, 2.2);
  kickLight.position.set(0, D / 2 - 0.02, 0.01);
  plinth.add(kickLight);

  // Open 18 mm panel shell; the exploded view must reveal a serviceable cavity.
  const body = new THREE.Group();
  for (const x of [-W / 2 + 0.009, W / 2 - 0.009]) {
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.018, D - 0.05, bodyH), Materials.charcoal());
    side.position.set(x, 0, bodyH / 2);
    side.castShadow = true;
    side.receiveShadow = true;
    body.add(side);
  }
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(W - 0.036, D - 0.05, 0.018), Materials.charcoal());
  shelf.position.z = 0.009;
  shelf.receiveShadow = true;
  body.add(shelf);
  body.position.set(0, 0, baseH);
  root.add(track(body, new THREE.Vector3(0, 0, 0)));

  // Walnut front accent face panel.
  const faceW = W - 0.09;
  const faceH = bodyH - 0.07;
  const face = new THREE.Mesh(roundedBox(faceW, 0.018, faceH, 0.014, 0.004), Materials.walnut());
  face.position.set(0, (D - 0.05) / 2 - 0.004, baseH + 0.035);
  face.castShadow = true;
  root.add(track(face, new THREE.Vector3(-0.7, 0.45, 0.15)));

  // Perforated speaker grille + status strip on the face panel.
  const speaker = new THREE.Mesh(new THREE.PlaneGeometry(faceW * 0.5, 0.11), Materials.grille());
  speaker.position.set(0, 0.015, baseH + 0.14);
  speaker.rotation.x = -Math.PI / 2;
  face.add(speaker);
  const statusStrip = new THREE.Mesh(new THREE.BoxGeometry(faceW * 0.72, 0.01, 0.012), Materials.amberAccent());
  statusStrip.position.set(0, 0.01, 0.1);
  face.add(statusStrip);
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.04), new THREE.MeshStandardMaterial({ map: plaqueTexture('STATION A'), roughness: 0.4, metalness: 0.5 }));
  plaque.position.set(0, 0.015, faceH - 0.08);
  plaque.rotation.set(-Math.PI / 2, 0, Math.PI);
  face.add(plaque);

  // Back service panel with visible cam-lock hardware (flat-pack serviceability).
  const back = new THREE.Mesh(roundedBox(faceW, 0.016, faceH, 0.014, 0.004), Materials.charcoalPanel());
  back.position.set(0, -(D - 0.05) / 2 + 0.004, baseH + 0.035);
  back.castShadow = true;
  root.add(track(back, new THREE.Vector3(0.7, -0.45, 0.15)));
  for (const [sx, sz] of [
    [-faceW / 2 + 0.05, 0.05],
    [faceW / 2 - 0.05, 0.05],
    [-faceW / 2 + 0.05, faceH - 0.05],
    [faceW / 2 - 0.05, faceH - 0.05],
  ]) {
    const camlock = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.006, 16), Materials.chromeDark());
    camlock.position.set(sx, -0.009, sz);
    back.add(camlock);
  }
  const ventSlot = new THREE.Mesh(new THREE.PlaneGeometry(faceW * 0.55, 0.05), Materials.grille());
  ventSlot.rotation.x = Math.PI / 2;
  ventSlot.position.set(0, -0.009, faceH - 0.1);
  back.add(ventSlot);

  // Control deck block + tilted walnut control surface.
  const deckBlock = new THREE.Mesh(roundedBox(W, D, deckH, 0.02, 0.006), Materials.charcoal());
  deckBlock.position.set(0, 0, baseH + bodyH);
  deckBlock.castShadow = true;
  deckBlock.receiveShadow = true;
  root.add(track(deckBlock, new THREE.Vector3(0, 0, 0.5)));

  const deckGroup = new THREE.Group();
  deckGroup.position.set(0, 0.015, baseH + bodyH + deckH - 0.01);
  deckGroup.rotation.x = -0.15;
  root.add(deckGroup);
  explodables.push(deckGroup);
  deckGroup.userData.assembled = deckGroup.position.clone();
  deckGroup.userData.exploded = deckGroup.position.clone().add(new THREE.Vector3(0, 0, 0.95));

  const deckPlate = new THREE.Mesh(roundedBox(W - 0.1, D - 0.08, 0.022, 0.018, 0.006), Materials.walnut());
  deckGroup.add(deckPlate);

  const ballR = STATION_A.trackballDiameter / 2;
  const ballCenter = new THREE.Vector3(-0.1, 0.01, 0.022 - ballR * 0.12);
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(ballR * 1.28, 0.006, 12, 28), Materials.chrome());
  bezel.position.copy(ballCenter);
  bezel.position.z = 0.023;
  deckPlate.add(bezel);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(ballR, 28, 20), Materials.trackballResin());
  ball.position.copy(ballCenter);
  ball.castShadow = true;
  deckPlate.add(ball);

  const buttonLabels = ['amberAccent', 'tealAccent', 'tealAccent', 'amberAccent', 'tealAccent', 'amberAccent', 'tealAccent', 'amberAccent'];
  const arcStart = -0.55;
  const arcEnd = 0.95;
  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    const angle = arcStart + (arcEnd - arcStart) * t;
    const r = 0.21;
    const bx = 0.07 + Math.cos(angle) * r;
    const by = -0.03 + Math.sin(angle) * r * 0.55;
    const btn = arcadeButton({
      radius: i === 0 ? 0.015 : 0.012,
      bezelMaterial: Materials.chrome(),
      capMaterial: i === 0 ? Materials.amberAccent() : (i % 2 === 0 ? Materials.tealAccent() : Materials.amberAccent()),
    });
    btn.position.set(bx, by, 0.022);
    deckPlate.add(btn);
  }

  // Padded forearm rest rail along the front edge.
  const rail = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, W - 0.14, 4, 12), Materials.walnutDark());
  rail.rotation.z = Math.PI / 2;
  rail.position.set(0, D / 2 - 0.045, -0.01);
  deckGroup.add(rail);

  // Annotation labels (visible only as the exploded state activates).
  const labels = [
    { obj: plinth, text: 'PLINTH / BASE', sub: 'Recessed status light. Foot and anchor details remain to engineer.', at: [-1.15, 0.2, -0.2] },
    { obj: body, text: '18 MM PANEL SHELL', sub: 'Open service cavity. Final joints and fasteners require CAD release.', at: [-1.15, 0.2, 0.95] },
    { obj: face, text: 'REMOVABLE FACE', sub: 'Walnut finish, speaker grille and local service access.', at: [-1.15, 0.45, 0.4] },
    { obj: back, text: 'REAR SERVICE PANEL', sub: 'Ventilation and removable access; airflow must be tested.', at: [1.15, 0, 0.4] },
    { obj: deckBlock, text: 'DECK SUPPORT', sub: 'Control-deck support and enclosure; mount details not released.', at: [1.15, 0, 1.28] },
    { obj: deckGroup, text: 'CONTROL DECK', sub: 'Trackball and buttons. Release-specific labels remain to select.', at: [1.15, 0, 1.95] },
  ];
  const labelGroup = new THREE.Group();
  labelGroup.visible = false;
  for (const l of labels) {
    const sprite = labelSprite(l.text, l.sub);
    const anchor = l.obj.userData.exploded ? l.obj.userData.exploded.clone() : l.obj.position.clone();
    sprite.position.set(...l.at);
    const towardAnchor = anchor.clone().sub(sprite.position).normalize().multiplyScalar(0.34);
    const lineGeo = new THREE.BufferGeometry().setFromPoints([anchor, sprite.position.clone().add(towardAnchor)]);
    const line = new THREE.Line(lineGeo, new THREE.LineDashedMaterial({ color: 0x2bd9c7, dashSize: 0.02, gapSize: 0.015, transparent: true, opacity: 0.8 }));
    line.computeLineDistances();
    labelGroup.add(sprite, line);
  }
  root.add(labelGroup);

  function setExplode(t) {
    for (const obj of explodables) {
      obj.position.lerpVectors(obj.userData.assembled, obj.userData.exploded, t);
    }
    labelGroup.visible = t > 0.2;
    labelGroup.children.forEach((c) => {
      if (c.material) c.material.opacity = Math.min(1, (t - 0.2) / 0.5) * (c.isSprite ? 1 : 0.8);
    });
  }
  setExplode(0);

  root.userData.setExplode = setExplode;
  return { group: root, setExplode };
}
