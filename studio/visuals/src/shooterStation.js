import * as THREE from '../vendor/three.module.js';
import { STATION_B, PALETTE } from './config.js';
import { Materials } from './materials.js';
import { roundedBox, arcadeButton, coiledCable, conduit, grip } from './geometryHelpers.js';

/** A handheld blaster-style light gun: barrel, pistol grip, trigger guard, foregrip. */
function buildHandheldGun() {
  const g = new THREE.Group();
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.02, 0.2, 16), Materials.gunBody());
  barrel.rotation.z = Math.PI / 2;
  barrel.position.set(0, 0, 0.03);
  barrel.castShadow = true;
  g.add(barrel);

  const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.016, 0.02, 16), Materials.chromeDark());
  muzzle.rotation.z = Math.PI / 2;
  muzzle.position.set(0.11, 0, 0.03);
  g.add(muzzle);

  const foregrip = new THREE.Mesh(grip(0.016, 0.07), Materials.rubber());
  foregrip.position.set(0.05, 0, 0.005);
  foregrip.rotation.x = Math.PI / 2;
  g.add(foregrip);

  const pistolGrip = new THREE.Mesh(grip(0.018, 0.11), Materials.rubber());
  pistolGrip.position.set(-0.05, 0, -0.03);
  pistolGrip.rotation.x = Math.PI * 0.92;
  g.add(pistolGrip);

  const guard = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.006, 8, 16, Math.PI * 1.3), Materials.chromeDark());
  guard.position.set(-0.03, 0, -0.005);
  guard.rotation.z = Math.PI * 0.35;
  g.add(guard);

  const accent = new THREE.Mesh(new THREE.TorusGeometry(0.019, 0.004, 8, 20), Materials.amberAccent());
  accent.position.set(0.1, 0, 0.03);
  accent.rotation.y = Math.PI / 2;
  g.add(accent);

  g.rotation.z = Math.PI / 2;
  return g;
}

/** Flared holster cup + resting handheld gun + coiled service cable down into the console. */
function buildHolsterUnit(side) {
  const g = new THREE.Group();
  const riser = new THREE.Mesh(roundedBox(0.09, 0.09, 0.05, 0.016, 0.004), Materials.charcoalPanel());
  riser.position.z = 0.025;
  riser.castShadow = true;
  g.add(riser);

  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.045, 0.14, 20, 1, true), Materials.holsterShell());
  cup.position.z = 0.05 + 0.07;
  cup.rotation.x = Math.PI / 2 - 0.32;
  cup.castShadow = true;
  g.add(cup);
  const cupRim = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.006, 10, 24), Materials.chrome());
  cupRim.position.copy(cup.position);
  cupRim.position.z += 0.065;
  cupRim.rotation.x = Math.PI / 2 - 0.32;
  g.add(cupRim);

  const gun = buildHandheldGun();
  gun.position.set(0, -0.01, 0.17);
  gun.rotation.x = -0.32;
  g.add(gun);

  const cableStart = new THREE.Vector3(side * 0.02, -0.03, 0.09);
  const cableEnd = new THREE.Vector3(side * 0.02, -0.03, -0.3);
  const cable = new THREE.Mesh(coiledCable(cableStart, cableEnd, { coilRadius: 0.02, coils: 9, tubeRadius: 0.0045 }), Materials.rubber());
  g.add(cable);

  return g;
}

/**
 * The mounted-gimbal alternative (Jurassic Park Arcade style): a heavy swivel base,
 * two-axis trunnion yoke, potentiometer housings and a chunky safari-rifle body with a
 * forearm/shoulder rest. Deliberately bulkier and olive/gunmetal-toned so it reads as a
 * fixed apparatus, never mistaken for the slim charcoal/amber handheld holster guns.
 */
function buildMountedGimbal() {
  const g = new THREE.Group();

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.04, 28), Materials.safariMetalDark());
  base.rotation.x = Math.PI / 2;
  base.position.z = 0.02;
  base.castShadow = true;
  g.add(base);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.01, 8), Materials.chromeDark());
    bolt.rotation.x = Math.PI / 2;
    bolt.position.set(Math.cos(a) * 0.09, Math.sin(a) * 0.09, 0.041);
    g.add(bolt);
  }

  const yawCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.1, 20), Materials.safariMetal());
  yawCollar.rotation.x = Math.PI / 2;
  yawCollar.position.z = 0.04 + 0.05;
  yawCollar.castShadow = true;
  g.add(yawCollar);
  const yawPot = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.03, 16), Materials.chromeDark());
  yawPot.rotation.z = Math.PI / 2;
  yawPot.position.set(0.07, 0, 0.09);
  g.add(yawPot);

  const yoke = new THREE.Group();
  yoke.position.z = 0.04 + 0.1;
  g.add(yoke);

  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.1, 16), Materials.safariMetal());
  post.rotation.x = Math.PI / 2;
  post.position.z = 0.05;
  yoke.add(post);

  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(roundedBox(0.03, 0.03, 0.16, 0.01, 0.003), Materials.safariMetal());
    arm.position.set(side * 0.1, 0, 0.1);
    arm.castShadow = true;
    yoke.add(arm);
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.05, 14), Materials.chromeDark());
    pot.rotation.z = Math.PI / 2;
    pot.position.set(side * 0.1, 0, 0.18);
    yoke.add(pot);
  }

  const cradle = new THREE.Group();
  cradle.position.set(0, 0, 0.18);
  cradle.rotation.x = -0.18;
  yoke.add(cradle);

  const body = new THREE.Mesh(roundedBox(0.09, 0.42, 0.1, 0.03, 0.01), Materials.safariMetal());
  body.position.set(0, 0.12, 0.02);
  body.castShadow = true;
  cradle.add(body);

  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.03, 0.16, 16), Materials.safariMetalDark());
  barrel.position.set(0, 0.33, 0.02);
  cradle.add(barrel);

  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.05, 0.012), Materials.safariAccent());
  stripe.position.set(0, 0.06, 0.07);
  cradle.add(stripe);

  const rest = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.022, 10, 20, Math.PI), Materials.rubber());
  rest.rotation.x = Math.PI / 2;
  rest.rotation.z = Math.PI;
  rest.position.set(0, -0.08, 0.02);
  cradle.add(rest);

  const handle = new THREE.Mesh(grip(0.02, 0.1), Materials.rubber());
  handle.position.set(0, -0.02, -0.04);
  handle.rotation.x = Math.PI * 0.35;
  cradle.add(handle);

  const conduitMesh = new THREE.Mesh(conduit(new THREE.Vector3(0.06, 0, 0.02), new THREE.Vector3(0.1, 0, -0.32), 0.014, 0.01), Materials.charcoalPanel());
  g.add(conduitMesh);

  return g;
}

export function buildShooterConsole({ controlMode = 'holster' } = {}) {
  const root = new THREE.Group();
  root.name = 'stationB';

  const W = STATION_B.width;
  const D = STATION_B.depth;
  const baseH = 0.07;
  const bodyH = 0.6;
  const topH = 0.08;

  const plinth = new THREE.Mesh(roundedBox(W - 0.06, D - 0.05, baseH, 0.012, 0.004), Materials.charcoal());
  plinth.position.z = 0.0;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  root.add(plinth);
  const kick = new THREE.Mesh(new THREE.BoxGeometry(W - 0.12, 0.012, 0.01), Materials.tealAccent());
  kick.position.set(0, D / 2 - 0.02, 0.006);
  root.add(kick);
  const kickLight = new THREE.PointLight(0x2bd9c7, 0.9, 1.6, 2.2);
  kickLight.position.set(0, D / 2 - 0.02, 0.01);
  root.add(kickLight);

  const body = new THREE.Mesh(roundedBox(W, D - 0.04, bodyH, 0.02, 0.006), Materials.charcoal());
  body.position.z = baseH;
  body.castShadow = true;
  body.receiveShadow = true;
  root.add(body);

  // Two walnut service doors with finger-pulls.
  for (const side of [-1, 1]) {
    const door = new THREE.Mesh(roundedBox(W * 0.42, 0.018, bodyH - 0.1, 0.016, 0.004), Materials.walnut());
    door.position.set(side * W * 0.24, (D - 0.04) / 2 - 0.003, baseH + bodyH / 2);
    door.castShadow = true;
    root.add(door);
    const pull = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.014, 0.012), Materials.chromeDark());
    pull.position.set(side * (W * 0.24 - W * 0.16), (D - 0.04) / 2 + 0.012, baseH + bodyH / 2);
    root.add(pull);
  }
  const centerStrip = new THREE.Mesh(new THREE.PlaneGeometry(0.03, bodyH - 0.1), Materials.charcoalPanel());
  centerStrip.rotation.x = -Math.PI / 2;
  centerStrip.position.set(0, (D - 0.04) / 2 + 0.002, baseH + bodyH / 2);
  root.add(centerStrip);

  // Perforated grilles on both ends.
  for (const side of [-1, 1]) {
    // Params are (height, depth): a Y-axis rotation preserves local-Y (-> world Y/depth)
    // and maps local-X into world Z/height — see the room.js side-wall comment.
    const grille = new THREE.Mesh(new THREE.PlaneGeometry(bodyH * 0.45, D * 0.6), Materials.grille());
    grille.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    grille.position.set(side * (W / 2 - 0.002), 0, baseH + bodyH * 0.55);
    root.add(grille);
  }

  // Back vent + cam-lock accents (service design language, matching Station A).
  const back = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.7, 0.05), Materials.grille());
  back.rotation.x = Math.PI / 2;
  back.position.set(0, -(D - 0.04) / 2 - 0.001, baseH + bodyH - 0.08);
  root.add(back);

  // Low walnut top surface (the "credenza top") where holsters or the gimbal mount.
  const top = new THREE.Mesh(roundedBox(W, D, topH, 0.02, 0.006), Materials.walnut());
  top.position.z = baseH + bodyH;
  top.castShadow = true;
  top.receiveShadow = true;
  root.add(top);

  const controlTopZ = baseH + bodyH + topH;

  // Holster module (two handheld guns).
  const holsterGroup = new THREE.Group();
  for (const side of [-1, 1]) {
    const unit = buildHolsterUnit(side);
    unit.position.set(side * (STATION_B.holsterSpacing / 2), 0, controlTopZ);
    holsterGroup.add(unit);
  }
  root.add(holsterGroup);

  // Mounted-gimbal module (Jurassic Park Arcade alternative) — centered, visually distinct.
  const mountedGroup = new THREE.Group();
  const gimbal = buildMountedGimbal();
  gimbal.position.set(0, -0.02, controlTopZ);
  mountedGroup.add(gimbal);
  root.add(mountedGroup);

  function setControlMode(mode) {
    holsterGroup.visible = mode === 'holster';
    mountedGroup.visible = mode === 'mounted';
  }
  setControlMode(controlMode);

  root.userData.setControlMode = setControlMode;
  return { group: root, setControlMode };
}
