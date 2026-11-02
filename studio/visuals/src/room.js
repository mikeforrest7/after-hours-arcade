import * as THREE from '../vendor/three.module.js';
import { ROOM } from './config.js';
import { Materials } from './materials.js';

// A 3-wall "showroom" shell (back + two side walls, open front, partial ceiling coffer
// near the back only) — the standard furniture-catalogue diorama technique. It keeps the
// camera free to shoot from the open side without clipping a full box ceiling, while still
// reading as a real room: floor, walls, baseboards and a lit coffer.

export function buildRoomShell() {
  const group = new THREE.Group();
  group.name = 'roomShell';

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.width, ROOM.depth), Materials.floorWalnut());
  floor.position.set(ROOM.width / 2, ROOM.depth / 2, 0);
  floor.receiveShadow = true;
  group.add(floor);

  // Back wall (lower charcoal wainscot + upper warm plaster), at y = 0.
  const wainscotH = ROOM.ceiling * 0.42;
  const wainscot = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.width, wainscotH), Materials.charcoalPanel());
  wainscot.rotation.x = -Math.PI / 2;
  wainscot.position.set(ROOM.width / 2, 0, wainscotH / 2);
  wainscot.receiveShadow = true;
  group.add(wainscot);

  const upperWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.width, ROOM.ceiling - wainscotH), Materials.wall());
  upperWall.rotation.x = -Math.PI / 2;
  upperWall.position.set(ROOM.width / 2, 0, wainscotH + (ROOM.ceiling - wainscotH) / 2);
  upperWall.receiveShadow = true;
  group.add(upperWall);

  // Cap rail between wainscot and upper wall.
  const capGeo = new THREE.BoxGeometry(ROOM.width, 0.01, 0.032);
  const cap = new THREE.Mesh(capGeo, Materials.walnutDark());
  cap.position.set(ROOM.width / 2, 0.006, wainscotH);
  group.add(cap);

  // Side walls. Geometry params are (ceiling, depth): a rotation about Y preserves the
  // local-Y axis (-> world Y/depth) and maps local-X into world Z/height.
  const sideGeo = new THREE.PlaneGeometry(ROOM.ceiling, ROOM.depth);
  const leftWall = new THREE.Mesh(sideGeo, Materials.wallShadow());
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(0, ROOM.depth / 2, ROOM.ceiling / 2);
  leftWall.receiveShadow = true;
  group.add(leftWall);

  const rightWall = new THREE.Mesh(sideGeo, Materials.wallShadow());
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(ROOM.width, ROOM.depth / 2, ROOM.ceiling / 2);
  rightWall.receiveShadow = true;
  group.add(rightWall);

  // Baseboards (walnut, matching furniture trim).
  const baseH = 0.09;
  const baseMat = Materials.walnutDark();
  const backBase = new THREE.Mesh(new THREE.BoxGeometry(ROOM.width, 0.018, baseH), baseMat);
  backBase.position.set(ROOM.width / 2, 0.008, baseH / 2);
  group.add(backBase);
  const leftBase = new THREE.Mesh(new THREE.BoxGeometry(0.018, ROOM.depth, baseH), baseMat);
  leftBase.position.set(0.008, ROOM.depth / 2, baseH / 2);
  group.add(leftBase);
  const rightBase = new THREE.Mesh(new THREE.BoxGeometry(0.018, ROOM.depth, baseH), baseMat);
  rightBase.position.set(ROOM.width - 0.008, ROOM.depth / 2, baseH / 2);
  group.add(rightBase);

  // Partial ceiling coffer near the back wall only (holds recessed can lights),
  // deep enough to read as a real ceiling plane without boxing in the camera.
  // rotation.x = PI faces the coffer's normal down (-Z) into the room, as seen from below.
  const cofferDepth = ROOM.depth * 0.62;
  const coffer = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.width, cofferDepth), Materials.wall());
  coffer.rotation.x = Math.PI;
  coffer.position.set(ROOM.width / 2, cofferDepth / 2, ROOM.ceiling);
  coffer.receiveShadow = true;
  group.add(coffer);

  // Soft fascia edge where the coffer ends, so the open edge doesn't look clipped.
  const fascia = new THREE.Mesh(new THREE.BoxGeometry(ROOM.width, 0.14, 0.03), Materials.charcoalPanel());
  fascia.position.set(ROOM.width / 2, cofferDepth, ROOM.ceiling - 0.015);
  group.add(fascia);

  return { group, cofferDepth, wainscotH };
}

/** Minimal neutral studio backdrop + ground for the exploded assembly view. */
export function buildStudioBackdrop(radius = 2.6) {
  const group = new THREE.Group();
  group.name = 'studioBackdrop';

  const ground = new THREE.Mesh(new THREE.CircleGeometry(radius, 48), Materials.studioFloor());
  // No rotation: CircleGeometry already lies flat with normal +Z (up), matching our floor.
  ground.receiveShadow = true;
  ground.position.z = -0.45; // The exploded assembly is lifted; its dropped plinth reaches room-floor level.
  group.add(ground);

  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(radius * 2, 4),
    Materials.studioBackdrop()
  );
  backdrop.rotation.x = -Math.PI / 2;
  backdrop.position.set(0, -1.6, 1.55);
  backdrop.receiveShadow = true;
  group.add(backdrop);

  return group;
}
