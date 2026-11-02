import * as THREE from '../vendor/three.module.js';
import { PALETTE } from './config.js';
import { woodTexture, charcoalTexture, brushedMetalTexture, grilleTexture, rugTexture, feltTexture } from './textures.js';

// One cached instance per named material so the whole scene shares GPU resources
// and tweaking a finish in one place updates every part that uses it.
const cache = new Map();
function cached(key, build) {
  if (!cache.has(key)) cache.set(key, build());
  return cache.get(key);
}

export const Materials = {
  walnut: () =>
    cached('walnut', () => {
      const map = woodTexture({ base: '#6b4327', dark: '#2a160b', light: '#a9774a', seed: 7 });
      map.repeat.set(1.4, 1.1);
      return new THREE.MeshPhysicalMaterial({
        map,
        roughness: 0.38,
        metalness: 0.0,
        clearcoat: 0.35,
        clearcoatRoughness: 0.25,
        envMapIntensity: 0.9,
      });
    }),

  walnutDark: () =>
    cached('walnutDark', () => {
      const map = woodTexture({ base: '#4a2c17', dark: '#1d0f07', light: '#78502e', seed: 13 });
      return new THREE.MeshPhysicalMaterial({
        map,
        roughness: 0.42,
        clearcoat: 0.25,
        clearcoatRoughness: 0.3,
        envMapIntensity: 0.8,
      });
    }),

  floorWalnut: () =>
    cached('floorWalnut', () => {
      const map = woodTexture({ base: '#55381f', dark: '#23140a', light: '#8a6038', seed: 19, planks: 6 });
      map.repeat.set(3.6, 3.6);
      return new THREE.MeshPhysicalMaterial({
        map,
        roughness: 0.3,
        clearcoat: 0.25,
        clearcoatRoughness: 0.2,
        envMapIntensity: 1.0,
      });
    }),

  charcoal: () =>
    cached('charcoal', () => {
      const map = charcoalTexture({ base: '#232327', seed: 3 });
      return new THREE.MeshStandardMaterial({ map, roughness: 0.62, metalness: 0.08, envMapIntensity: 0.6 });
    }),

  charcoalPanel: () =>
    cached('charcoalPanel', () => {
      const map = charcoalTexture({ base: '#2d2d32', seed: 9 });
      return new THREE.MeshStandardMaterial({ map, roughness: 0.5, metalness: 0.1, envMapIntensity: 0.7 });
    }),

  wall: () =>
    cached('wall', () => new THREE.MeshStandardMaterial({ color: PALETTE.wallPlaster, roughness: 0.92, metalness: 0 })),

  wallShadow: () =>
    cached('wallShadow', () => new THREE.MeshStandardMaterial({ color: PALETTE.wallPlasterShadow, roughness: 0.95 })),

  chrome: () =>
    cached('chrome', () => {
      const map = brushedMetalTexture({ seed: 11 });
      return new THREE.MeshStandardMaterial({ map, roughness: 0.28, metalness: 0.92, envMapIntensity: 1.3 });
    }),

  chromeDark: () =>
    cached('chromeDark', () => new THREE.MeshStandardMaterial({ color: PALETTE.chromeDark, roughness: 0.4, metalness: 0.88, envMapIntensity: 1.1 })),

  grille: () =>
    cached('grille', () => {
      const map = grilleTexture();
      return new THREE.MeshStandardMaterial({ map, roughness: 0.55, metalness: 0.4 });
    }),

  rubber: () =>
    cached('rubber', () => new THREE.MeshStandardMaterial({ color: PALETTE.rubber, roughness: 0.85, metalness: 0.0 })),

  rug: () =>
    cached('rug', () => {
      const map = rugTexture();
      return new THREE.MeshStandardMaterial({ map, roughness: 0.95, metalness: 0 });
    }),

  felt: () =>
    cached('felt', () => new THREE.MeshStandardMaterial({ map: feltTexture(), roughness: 0.9 })),

  amberAccent: () =>
    cached('amberAccent', () => new THREE.MeshStandardMaterial({ color: PALETTE.amber, emissive: PALETTE.amberEmissive, emissiveIntensity: 1.6, roughness: 0.3, metalness: 0.1 })),

  tealAccent: () =>
    cached('tealAccent', () => new THREE.MeshStandardMaterial({ color: PALETTE.teal, emissive: PALETTE.tealEmissive, emissiveIntensity: 1.8, roughness: 0.25, metalness: 0.1 })),

  signWarm: () =>
    cached('signWarm', () => new THREE.MeshBasicMaterial({ color: PALETTE.signWarm })),

  trackballResin: () =>
    cached('trackballResin', () => new THREE.MeshPhysicalMaterial({ color: 0xcf7a2e, roughness: 0.18, clearcoat: 0.9, clearcoatRoughness: 0.12, envMapIntensity: 1.2 })),

  safariMetal: () =>
    cached('safariMetal', () => new THREE.MeshStandardMaterial({ color: PALETTE.safariMetal, roughness: 0.55, metalness: 0.55 })),

  safariMetalDark: () =>
    cached('safariMetalDark', () => new THREE.MeshStandardMaterial({ color: PALETTE.safariMetalDark, roughness: 0.5, metalness: 0.6 })),

  safariAccent: () =>
    cached('safariAccent', () => new THREE.MeshStandardMaterial({ color: PALETTE.safariAccent, roughness: 0.4, metalness: 0.2 })),

  gunBody: () =>
    cached('gunBody', () => new THREE.MeshStandardMaterial({ color: PALETTE.gunBody, roughness: 0.4, metalness: 0.35 })),

  holsterShell: () =>
    cached('holsterShell', () => new THREE.MeshStandardMaterial({ color: PALETTE.holsterShell, roughness: 0.55, metalness: 0.2 })),

  glassScreenBezel: () =>
    cached('glassScreenBezel', () => new THREE.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 0.35, metalness: 0.6 })),

  screenGlass: () =>
    cached('screenGlass', () => new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.04, depthWrite: false, roughness: 0.12, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.08, envMapIntensity: 1.4 })),

  studioBackdrop: () =>
    cached('studioBackdrop', () => new THREE.MeshStandardMaterial({ color: 0x1a1a1d, roughness: 1 })),

  studioFloor: () =>
    cached('studioFloor', () => new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.6, metalness: 0.05 })),

  labelPlaque: () =>
    cached('labelPlaque', () => new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true })),
};

export function screenMaterial(texture) {
  // Each call gets its own material instance (texture differs per screen / view).
  return new THREE.MeshStandardMaterial({
    map: texture,
    emissiveMap: texture,
    emissive: 0xffffff,
    emissiveIntensity: 1.15,
    roughness: 0.42,
    metalness: 0.0,
  });
}
