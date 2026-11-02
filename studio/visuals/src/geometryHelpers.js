import * as THREE from '../vendor/three.module.js';

// Shared geometry helpers so every cabinet/control part reads as real furniture —
// soft vertical corners + chamfered top/bottom edges — instead of a sharp CAD box.

/** Builds a rounded-rectangle footprint Shape, width w (X) x depth d (Y), centered at origin. */
function roundedRectShape(w, d, radius) {
  const hw = w / 2;
  const hd = d / 2;
  const r = Math.min(radius, hw, hd);
  const shape = new THREE.Shape();
  shape.moveTo(-hw + r, -hd);
  shape.lineTo(hw - r, -hd);
  shape.quadraticCurveTo(hw, -hd, hw, -hd + r);
  shape.lineTo(hw, hd - r);
  shape.quadraticCurveTo(hw, hd, hw - r, hd);
  shape.lineTo(-hw + r, hd);
  shape.quadraticCurveTo(-hw, hd, -hw, hd - r);
  shape.lineTo(-hw, -hd + r);
  shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
  return shape;
}

/**
 * A furniture-grade box: width (X) x depth (Y) x height (Z, extruded up from z=0),
 * soft vertical corners (radius) and chamfered top/bottom perimeter (bevel).
 * Local origin sits at the footprint center, on the floor plane (z=0).
 */
export function roundedBox(w, d, h, radius = 0.012, bevel = 0.004, segments = 3) {
  const shape = roundedRectShape(w, d, Math.max(radius, 0.0005));
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: h,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: segments,
    curveSegments: 10,
    steps: 1,
  });
  geo.computeVertexNormals();
  return geo;
}

/** A thin flat panel (door, deck overlay, kick strip) sharing the same soft-edge language. */
export function panel(w, d, thickness, radius = 0.006, bevel = 0.0025) {
  return roundedBox(w, d, thickness, radius, bevel, 2);
}

/** Slightly domed arcade button: chrome bezel ring + colored cap, returned as a Group. */
export function arcadeButton({ radius = 0.012, capColor = 0xe79a52, bezelMaterial, capMaterial }) {
  const group = new THREE.Group();
  const bezel = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 1.22, radius * 1.3, radius * 0.5, 24),
    bezelMaterial
  );
  bezel.position.z = radius * 0.25;
  bezel.rotation.x = Math.PI / 2;
  group.add(bezel);

  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.58),
    capMaterial || new THREE.MeshPhysicalMaterial({ color: capColor, roughness: 0.3, clearcoat: 0.6 })
  );
  cap.rotation.x = Math.PI / 2;
  cap.position.z = radius * 0.5 + 0.0015;
  group.add(cap);
  return group;
}

/** Builds a coiled service cable (handheld-gun or deck cable) as a TubeGeometry. */
export function coiledCable(start, end, { coilRadius = 0.028, coils = 10, tubeRadius = 0.006, sag = 0.05 } = {}) {
  const dir = new THREE.Vector3().subVectors(end, start);
  const len = dir.length();
  dir.normalize();
  let up = Math.abs(dir.z) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1);
  const side = new THREE.Vector3().crossVectors(dir, up).normalize();
  up = new THREE.Vector3().crossVectors(side, dir).normalize();

  const points = [];
  const samples = Math.max(40, coils * 10);
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const base = new THREE.Vector3().copy(start).addScaledVector(dir, len * t);
    const angle = t * coils * Math.PI * 2;
    const localCoil = coilRadius * (0.4 + 0.6 * Math.sin(Math.PI * t));
    base.addScaledVector(side, Math.cos(angle) * localCoil);
    base.addScaledVector(up, Math.sin(angle) * localCoil - sag * Math.sin(Math.PI * t));
    points.push(base);
  }
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.TubeGeometry(curve, samples, tubeRadius, 8, false);
}

/** A gently sagging straight service/conduit run between two points. */
export function conduit(start, end, tubeRadius = 0.012, sag = 0.02) {
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  mid.z -= sag;
  const curve = new THREE.CatmullRomCurve3([start, mid, end]);
  return new THREE.TubeGeometry(curve, 24, tubeRadius, 8, false);
}

/** Rounded capsule-profile grip (handheld gun body / handle). */
export function grip(radius, length, segments = 16) {
  return new THREE.CapsuleGeometry(radius, Math.max(length - radius * 2, 0.001), 6, segments);
}

export { roundedRectShape };
