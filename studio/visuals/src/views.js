import * as THREE from '../vendor/three.module.js';
import { STATION_A, STATION_B, GROUP_CENTER_X } from './config.js';

// A deterministic camera + scene-state registry. Every named view sets an exact camera
// pose (no orbiting/animation) and toggles a small set of visibility/content flags.
// This is the "documented function to change views" referenced in render.html.

export const STAGE_CENTER = new THREE.Vector3(6.4, 1.6, 0.45);

function look(camPos, target, fov) {
  return { camPos: new THREE.Vector3(...camPos), target: new THREE.Vector3(...target), fov };
}

const VIEWS = {
  hero: {
    ...look([0.7, 4.65, 2.0], [1.7, 0.45, 1.05], 44),
    room: true,
    figure: false,
    explode: 0,
    controlMode: 'holster',
    stationBScreen: 'hunt',
  },
  room: {
    ...look([2.2, 5.4, 2.0], [2.1, 1.0, 0.95], 48),
    room: true,
    figure: true,
    explode: 0,
    controlMode: 'holster',
    stationBScreen: 'hunt',
  },
  trackball: {
    ...look([1.55, 1.35, 1.22], [0.68, 0.18, 0.82], 34),
    room: true,
    figure: false,
    explode: 0,
    controlMode: 'holster',
    stationBScreen: 'hunt',
  },
  shooter: {
    ...look([3.35, 1.95, 1.18], [2.31, 0.12, 0.82], 36),
    room: true,
    figure: false,
    explode: 0,
    controlMode: 'holster',
    stationBScreen: 'hunt',
  },
  mounted: {
    ...look([1.15, 1.85, 1.05], [2.31, 0.08, 0.95], 34),
    room: true,
    figure: false,
    explode: 0,
    controlMode: 'mounted',
    stationBScreen: 'jungle',
  },
  exploded: {
    ...look(
      [STAGE_CENTER.x + 0.6, STAGE_CENTER.y + 4.8, STAGE_CENTER.z + 2.4],
      [STAGE_CENTER.x, STAGE_CENTER.y, STAGE_CENTER.z + 0.85],
      40
    ),
    room: false,
    figure: false,
    explode: 1,
    controlMode: 'holster',
    stationBScreen: 'hunt',
  },
};

export function getViewState(name) {
  return VIEWS[name] || VIEWS.hero;
}

export const ROOM_STATION_A_POS = new THREE.Vector3(STATION_A.xCenter, STATION_A.depth / 2, 0);
export const ROOM_STATION_B_POS = new THREE.Vector3(STATION_B.xCenter, STATION_B.depth / 2, 0);
