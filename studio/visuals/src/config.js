// Shared numeric/visual configuration for the Arcade Studio concept scene.
// Dimensions are sourced from ../../cad/parameters.json (the engineering baseline),
// converted from millimetres to metres for Three.js. Do not invent new offsets here —
// if the CAD baseline changes, update the numbers below to match it.

export const mm = (v) => v / 1000;

// Illustrative room envelope (NOT Mike's measured basement — see parameters.json).
export const ROOM = {
  width: mm(4500),
  depth: mm(3500),
  ceiling: mm(2300),
};

// Station A — Trackball Pedestal (Golden Tee / Silver Strike).
export const STATION_A = {
  x0: mm(300),
  width: mm(760),
  depth: mm(610),
  height: mm(950),
  trackballDiameter: mm(76.2),
  trackballCutout: mm(150),
  strikeClearanceRadius: mm(300),
};
STATION_A.xCenter = STATION_A.x0 + STATION_A.width / 2;

// Station B — Shooter Console (Big Buck Hunter / Jurassic Park Arcade).
export const STATION_B = {
  x0: STATION_A.x0 + STATION_A.width + mm(600),
  width: mm(1300),
  depth: mm(400),
  height: mm(750),
  holsterSpacing: mm(700),
  standoff: mm(1700),
};
STATION_B.xCenter = STATION_B.x0 + STATION_B.width / 2;

// Independently wall-supported displays (never panel-mounted to either cabinet).
export const TV43 = {
  diagonalIn: 43,
  activeW: mm(952),
  activeH: mm(535),
  mountCenterHeight: mm(1500),
  xCenter: STATION_A.xCenter,
};

export const TV55 = {
  diagonalIn: 55,
  activeW: mm(1218),
  activeH: mm(685),
  mountCenterHeight: mm(1600),
  xCenter: STATION_B.xCenter,
};

// Restrained residential-furniture palette: warm walnut + matte charcoal structure,
// amber task lighting, teal status/accent lighting. No RGB-stripe arcade cliché.
export const PALETTE = {
  walnutDark: 0x3c2516,
  walnutMid: 0x6b4327,
  walnutLight: 0x8f6038,
  walnutFloor: 0x55381f,
  charcoal: 0x232327,
  charcoalPanel: 0x2d2d32,
  charcoalDeep: 0x18181b,
  wallPlaster: 0xcdc1ae,
  wallPlasterShadow: 0xb7aa94,
  rug: 0x201d1d,
  rugPiping: 0x2bb3a3,
  chrome: 0xd4d7db,
  chromeDark: 0x8d9095,
  rubber: 0x121214,
  amber: 0xe79a52,
  amberEmissive: 0xff9c4a,
  teal: 0x2bd9c7,
  tealEmissive: 0x27e8cf,
  signWarm: 0xffb066,
  safariMetal: 0x565c52,
  safariMetalDark: 0x32352f,
  safariAccent: 0xd9a441,
  holsterShell: 0x2a2a2e,
  gunBody: 0x2f3338,
  gunAccent: 0xe79a52,
};

export const VIEW_NAMES = ['hero', 'room', 'trackball', 'shooter', 'mounted', 'exploded'];

export const VIEW_CAPTIONS = {
  hero: 'AFTER HOURS — hero three-quarter, both stations',
  room: 'Illustrative room context (4.5 × 3.5 m, 2.3 m ceiling — not a measured site)',
  trackball: 'Station A — Trackball Pedestal, control-deck detail',
  shooter: 'Station B — Shooter Console, handheld holster configuration',
  mounted: 'Single mounted-gun mechanism study — not a released two-player assembly',
  exploded: 'Station A — construction concept, not fabrication-ready joinery',
};

// Horizontal midpoint between both stations — used to center the feature wall, sign
// and room-context cameras consistently across modules.
export const GROUP_CENTER_X = (STATION_A.xCenter + STATION_B.xCenter) / 2;
