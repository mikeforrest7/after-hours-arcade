import * as THREE from '../vendor/three.module.js';

// A deliberately abstract, non-photoreal scale figure (capsule torso/limbs) used only
// in the "room" view to demonstrate comfortable standing-play scale against the
// furniture. Not a character asset, not a photograph stand-in.

export function buildFigure(heightM = 1.74) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x3a3f46, roughness: 0.75, metalness: 0.02 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xcd9a73, roughness: 0.65 });

  const legH = heightM * 0.47;
  const torsoH = heightM * 0.33;
  const headR = heightM * 0.065;

  const legs = new THREE.Mesh(new THREE.CapsuleGeometry(heightM * 0.09, legH - heightM * 0.09 * 2, 4, 10), mat);
  legs.rotation.x = Math.PI / 2;
  legs.position.z = legH / 2;
  legs.castShadow = true;
  group.add(legs);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(heightM * 0.12, torsoH - heightM * 0.12 * 2, 4, 10), mat);
  torso.rotation.x = Math.PI / 2;
  torso.position.z = legH + torsoH / 2;
  torso.castShadow = true;
  group.add(torso);

  const armLen = heightM * 0.33;
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(heightM * 0.045, armLen - heightM * 0.09, 4, 8), mat);
    arm.position.set(side * (heightM * 0.16), 0, legH + torsoH - armLen / 2 + heightM * 0.03);
    arm.rotation.set(Math.PI / 2, 0, side * 0.15);
    arm.castShadow = true;
    group.add(arm);
  }

  const head = new THREE.Mesh(new THREE.SphereGeometry(headR, 20, 16), skin);
  head.position.z = legH + torsoH + headR * 1.1;
  head.castShadow = true;
  group.add(head);

  group.traverse((o) => {
    if (o.isMesh) o.receiveShadow = true;
  });
  return group;
}
