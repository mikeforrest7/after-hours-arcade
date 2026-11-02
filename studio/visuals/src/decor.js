import * as THREE from '../vendor/three.module.js';
import { ROOM, STATION_A, STATION_B, PALETTE, GROUP_CENTER_X } from './config.js';
import { Materials } from './materials.js';
import { rugTexture, glowSpriteTexture } from './textures.js';
import { roundedBox } from './geometryHelpers.js';

const groupCenterX = GROUP_CENTER_X;

function signTexture(text = 'AFTER HOURS', sub = 'ARCADE STUDIO · WORKING CONCEPT') {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 1024, 256);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = 'italic 700 96px "Segoe Script", "Brush Script MT", cursive';
  ctx.shadowColor = '#ff9c4a';
  ctx.shadowBlur = 28;
  ctx.fillStyle = '#ffd9ab';
  ctx.fillText(text, 512, 112);
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#fff4e6';
  ctx.fillText(text, 512, 112);

  ctx.font = '600 28px "Segoe UI", Arial, sans-serif';
  ctx.shadowColor = '#2bd9c7';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#bff3ea';
  ctx.letterSpacing = '6px';
  ctx.fillText(sub, 512, 190);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function buildSign() {
  const group = new THREE.Group();
  group.rotation.set(-Math.PI / 2, 0, Math.PI);
  const tex = signTexture();
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.475), mat);
  group.add(plane);

  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 1.0),
    new THREE.MeshBasicMaterial({ map: glowSpriteTexture('#ffb066'), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  glow.position.z = -0.01;
  group.add(glow);

  // Local Y points up (+Z); local Z points from the wall into the room (+Y).
  const signLight = new THREE.PointLight(0xffb066, 2.2, 2.4, 2);
  signLight.position.set(0, 0.25, 0.15);
  group.add(signLight);

  return group;
}

function buildSlatWall(width, height) {
  const group = new THREE.Group();
  const slatW = 0.028;
  const gap = 0.018;
  const count = Math.floor(width / (slatW + gap));
  const geo = roundedBox(slatW, 0.022, height, 0.004, 0.0015, 1);
  const mesh = new THREE.InstancedMesh(geo, Materials.walnutDark(), count);
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  const m = new THREE.Matrix4();
  const start = -width / 2 + slatW / 2;
  for (let i = 0; i < count; i++) {
    m.makeTranslation(start + i * (slatW + gap), 0, 0);
    mesh.setMatrixAt(i, m);
  }
  mesh.instanceMatrix.needsUpdate = true;
  group.add(mesh);
  return group;
}

function buildCanLight(x, y) {
  const group = new THREE.Group();
  const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.05, 20), Materials.chromeDark());
  housing.rotation.x = Math.PI / 2;
  group.add(housing);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.04, 20), Materials.amberAccent());
  lens.rotation.x = Math.PI;
  lens.position.z = -0.026;
  group.add(lens);
  group.position.set(x, y, ROOM.ceiling - 0.005);

  const spot = new THREE.SpotLight(0xffd9ad, 9, 4.2, Math.PI / 6.5, 0.55, 1.6);
  spot.position.set(0, 0, -0.01);
  spot.target.position.set(0, 0.35, -2.1);
  spot.castShadow = false;
  group.add(spot, spot.target);
  return group;
}

function buildTrackLight(lightPos, targetPos) {
  const group = new THREE.Group();
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 0.04), Materials.chromeDark());
  group.add(rail);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.12, 12), Materials.chromeDark());
  arm.rotation.x = Math.PI / 2;
  arm.position.set(0, 0, -0.07);
  group.add(arm);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.028, 0.08, 16), Materials.charcoal());
  head.position.set(0, 0, -0.13);
  head.rotation.x = Math.PI / 2 + 0.5;
  group.add(head);

  const spot = new THREE.SpotLight(0xfff0d8, 14, 3.4, Math.PI / 7, 0.4, 1.8);
  spot.position.set(0, 0, -0.13);
  spot.castShadow = true;
  spot.shadow.mapSize.set(1024, 1024);
  spot.shadow.bias = -0.0015;
  const targetObj = new THREE.Object3D();
  // Target is a child of this group, so its position must be LOCAL (world target minus
  // this light's own world position), not the raw world-space target coordinates.
  targetObj.position.subVectors(targetPos, lightPos);
  group.add(spot, targetObj);
  spot.target = targetObj;
  group.position.copy(lightPos);

  return group;
}

function buildWallSconce(x, y, z) {
  const group = new THREE.Group();
  const back = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.14, 16), Materials.walnutDark());
  group.add(back);
  const shadeMat = new THREE.MeshStandardMaterial({ color: 0x1b1b1e, emissive: PALETTE.amberEmissive, emissiveIntensity: 0.9, roughness: 0.6 });
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 16, 1, true), shadeMat);
  shade.rotation.x = Math.PI / 2;
  shade.position.y = 0.09;
  group.add(shade);
  const light = new THREE.PointLight(0xffac5c, 1.4, 2.2, 2.2);
  light.position.y = 0.09;
  group.add(light);
  group.position.set(x, y, z);
  return group;
}

function buildPottedPlant(x, y) {
  const group = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.18, 16), Materials.charcoalPanel());
  pot.rotation.x = Math.PI / 2;
  pot.position.z = 0.09;
  pot.castShadow = true;
  group.add(pot);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2f5a37, roughness: 0.75 });
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.38 + Math.random() * 0.18, 6), leafMat);
    const a = (i / 7) * Math.PI * 2;
    leaf.position.set(Math.cos(a) * 0.03, Math.sin(a) * 0.03, 0.18 + 0.2 + Math.random() * 0.05);
    // Cones point apex-up (+Z, matching the base Y->Z reorientation below) with a small
    // random lean so the cluster reads as a natural scraggly plant, not a perfect ring.
    leaf.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.35;
    leaf.rotation.y = (Math.random() - 0.5) * 0.35;
    leaf.castShadow = true;
    group.add(leaf);
  }
  group.position.set(x, y, 0);
  return group;
}

function buildSideTable(x, y) {
  const group = new THREE.Group();
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.025, 28), Materials.walnut());
  top.rotation.x = Math.PI / 2;
  top.position.z = 0.46;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);
  for (const a of [0.6, 2.5, 4.3]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.44, 8), Materials.chromeDark());
    leg.position.set(Math.cos(a) * 0.15, Math.sin(a) * 0.15, 0.22);
    leg.rotation.x = Math.PI / 2 + Math.sin(a) * 0.05;
    leg.rotation.y = Math.cos(a) * 0.05;
    group.add(leg);
  }
  group.position.set(x, y, 0);
  group.add(buildPottedPlant(0, -0.02));
  return group;
}

function buildFloorLamp(x, y) {
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.025, 20), Materials.chromeDark());
  base.rotation.x = Math.PI / 2;
  base.position.z = 0.0125;
  group.add(base);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.3, 12), Materials.walnutDark());
  pole.rotation.x = Math.PI / 2;
  pole.position.z = 0.025 + 0.65;
  group.add(pole);
  const shadeMat = new THREE.MeshStandardMaterial({ color: 0xf2e4c8, emissive: 0xffb066, emissiveIntensity: 0.55, roughness: 0.7, side: THREE.DoubleSide });
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.26, 20, 1, true), shadeMat);
  shade.rotation.x = Math.PI / 2;
  shade.position.z = 1.3 + 0.025 + 0.13;
  group.add(shade);
  const light = new THREE.PointLight(0xffc383, 1.6, 2.8, 2);
  light.position.z = 1.3 + 0.025 + 0.13;
  group.add(light);
  group.position.set(x, y, 0);
  return group;
}

export function buildDecor({ cofferDepth, wainscotH }) {
  const group = new THREE.Group();
  group.name = 'decor';

  // Area rug grounding both stations.
  const rugW = 3.1;
  const rugD = 2.1;
  const rugMat = new THREE.MeshStandardMaterial({ map: rugTexture(), roughness: 0.95 });
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(rugW, rugD), rugMat);
  rug.position.set(groupCenterX, 1.2, 0.004);
  rug.receiveShadow = true;
  group.add(rug);

  // Feature slat-wood wall behind both stations, from just above the baseboard cap
  // rail up to a band that clears the sign without poking through the 2.3 m ceiling.
  const slatBottom = wainscotH - 0.066;
  const slatHeight = 1.05;
  const slatWall = buildSlatWall(3.0, slatHeight);
  slatWall.position.set(groupCenterX, 0.018, slatBottom);
  group.add(slatWall);

  // Backlit wordmark sign, mounted over the top of the feature wall.
  const sign = buildSign();
  sign.position.set(groupCenterX, 0.03, slatBottom + slatHeight + 0.08);
  group.add(sign);

  // Recessed ceiling can lights across the coffer.
  const canXs = [groupCenterX - 1.5, groupCenterX - 0.5, groupCenterX + 0.5, groupCenterX + 1.5];
  canXs.forEach((x) => group.add(buildCanLight(x, cofferDepth * 0.55)));

  // Direct task track-lighting over each station's control surface.
  const trackA = buildTrackLight(
    new THREE.Vector3(STATION_A.xCenter, 0.3, ROOM.ceiling - 0.04),
    new THREE.Vector3(STATION_A.xCenter, STATION_A.depth * 0.5, STATION_A.height * 0.85)
  );
  group.add(trackA);
  const trackB = buildTrackLight(
    new THREE.Vector3(STATION_B.xCenter, 0.3, ROOM.ceiling - 0.04),
    new THREE.Vector3(STATION_B.xCenter, STATION_B.depth * 0.5, STATION_B.height * 0.85)
  );
  group.add(trackB);

  // Wall sconces flanking the feature wall.
  group.add(buildWallSconce(groupCenterX - 1.3, 0.03, 1.55));
  group.add(buildWallSconce(groupCenterX + 1.3, 0.03, 1.55));

  // Side furniture filling the open right-hand bay (reads as lived-in, not a workshop).
  group.add(buildSideTable(ROOM.width - 0.8, 1.0));
  group.add(buildFloorLamp(ROOM.width - 0.55, 2.35));

  return group;
}
