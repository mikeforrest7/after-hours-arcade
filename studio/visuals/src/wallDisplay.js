import * as THREE from '../vendor/three.module.js';
import { Materials, screenMaterial } from './materials.js';
import { roundedBox, conduit } from './geometryHelpers.js';

/**
 * An independently wall-supported display (never panel-mounted to either cabinet —
 * matches the shared contract: both the 43" and 55" screens are off-the-shelf TVs on a
 * full-motion bracket, purchased separately from the furniture).
 */
export function buildWallTV({ activeW, activeH, mountHeight, texture, standoff = 0.1 }) {
  const group = new THREE.Group();
  const bezel = 0.016;
  const chassisDepth = 0.045;
  const panelW = activeW + bezel * 2;
  const panelH = activeH + bezel * 2;

  // Wall plate + articulating bracket arm.
  const plate = new THREE.Mesh(roundedBox(0.22, 0.02, 0.32, 0.01, 0.003), Materials.chromeDark());
  plate.position.set(0, 0.0, -0.16);
  group.add(plate);

  const armMat = Materials.chromeDark();
  const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, standoff * 0.65, 12), armMat);
  upperArm.position.set(-panelW * 0.22, standoff * 0.33, panelH * 0.3);
  group.add(upperArm);
  const lowerArm = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, standoff * 0.65, 12), armMat);
  lowerArm.position.set(panelW * 0.22, standoff * 0.33, -panelH * 0.3);
  group.add(lowerArm);

  // Chassis (dark, slim modern panel) + bezel + screen.
  const chassis = new THREE.Mesh(roundedBox(panelW, chassisDepth, panelH, 0.012, 0.004), Materials.glassScreenBezel());
  chassis.position.set(0, standoff, -panelH / 2);
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  group.add(chassis);

  const screenMat = screenMaterial(texture);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(activeW, activeH), screenMat);
  screen.position.set(0, standoff + chassisDepth / 2 + 0.008, 0);
  screen.rotation.set(-Math.PI / 2, 0, Math.PI);
  group.add(screen);

  // Subtle glass clearcoat skin in front of the screen for a believable display surface.
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(activeW * 1.002, activeH * 1.002), Materials.screenGlass());
  glass.position.set(0, standoff + chassisDepth / 2 + 0.0085, 0);
  glass.rotation.set(-Math.PI / 2, 0, Math.PI);
  group.add(glass);

  // Slim speaker strip along the chassis base.
  const speaker = new THREE.Mesh(new THREE.PlaneGeometry(panelW * 0.5, 0.02), Materials.grille());
  speaker.position.set(0, standoff + chassisDepth / 2 + 0.0008, -panelH / 2 - 0.016);
  speaker.rotation.x = -Math.PI / 2;
  group.add(speaker);

  group.position.set(0, 0, mountHeight);
  group.userData.panelW = panelW;
  group.userData.panelH = panelH;
  group.userData.screen = screen;
  group.userData.setTexture = (tex) => {
    screenMat.map = tex;
    screenMat.emissiveMap = tex;
    screenMat.needsUpdate = true;
  };
  return group;
}

/** Cable raceway running from the TV's wall plate down to a low cable-tidy box. */
export function buildCableRun(xWallOffset, fromZ, toZ) {
  const group = new THREE.Group();
  const geo = conduit(new THREE.Vector3(0, 0.012, fromZ), new THREE.Vector3(0, 0.012, toZ), 0.009, 0.0);
  const mesh = new THREE.Mesh(geo, Materials.charcoalPanel());
  mesh.castShadow = false;
  group.add(mesh);

  const tidy = new THREE.Mesh(roundedBox(0.1, 0.045, 0.07, 0.01, 0.004), Materials.charcoalPanel());
  tidy.position.set(0, 0.022, toZ - 0.02);
  group.add(tidy);
  const vent = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.03), Materials.grille());
  vent.rotation.x = -Math.PI / 2;
  vent.position.set(0, 0.0451, toZ - 0.02);
  group.add(vent);

  group.position.x = xWallOffset;
  return group;
}
