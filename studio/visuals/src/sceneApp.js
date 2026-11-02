import * as THREE from '../vendor/three.module.js';
import { STATION_A, TV43, TV55, VIEW_NAMES, VIEW_CAPTIONS } from './config.js';
import { buildRoomShell, buildStudioBackdrop } from './room.js';
import { buildDecor } from './decor.js';
import { buildFigure } from './figure.js';
import { buildTrackballStation } from './trackballStation.js';
import { buildShooterConsole } from './shooterStation.js';
import { buildWallTV, buildCableRun } from './wallDisplay.js';
import { golfScreenTexture, huntScreenTexture, jungleScreenTexture } from './screens.js';
import { getViewState, STAGE_CENTER, ROOM_STATION_A_POS, ROOM_STATION_B_POS } from './views.js';

/**
 * Boots the full WebGL Three.js scene onto <canvas id="scene">. Call once. Sets
 * window.setView / window.ARCADE_VIEWS / window.renderReady as documented in render.html.
 */
export function boot(initialViewOverride) {
  // ---------------------------------------------------------------------------
  // Renderer / scene bootstrap
  // ---------------------------------------------------------------------------
  const canvas = document.getElementById('scene');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x121014);

  const camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.05, 40);
  camera.up.set(0, 0, 1);

  // ---------------------------------------------------------------------------
  // Procedural environment lighting (no external HDR — a small gradient "softbox"
  // scene convolved into an irradiance map via PMREMGenerator).
  // ---------------------------------------------------------------------------
  function buildEnvScene() {
    const s = new THREE.Scene();
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 64;
    skyCanvas.height = 64;
    const ctx = skyCanvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 64);
    grad.addColorStop(0, '#fff2d9');
    grad.addColorStop(0.45, '#ad9c86');
    grad.addColorStop(1, '#241c16');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const skyTex = new THREE.CanvasTexture(skyCanvas);
    skyTex.colorSpace = THREE.SRGBColorSpace;
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(8, 24, 16), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide }));
    s.add(sphere);
    const warm = new THREE.Mesh(new THREE.PlaneGeometry(3, 2), new THREE.MeshBasicMaterial({ color: 0xffb066 }));
    warm.position.set(-3, 1.5, -3);
    warm.lookAt(0, 0, 0);
    s.add(warm);
    const cool = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 2), new THREE.MeshBasicMaterial({ color: 0x3fd6c4 }));
    cool.position.set(3, 0.5, 2);
    cool.lookAt(0, 0, 0);
    s.add(cool);
    return s;
  }

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envRT = pmrem.fromScene(buildEnvScene(), 0.03);
  scene.environment = envRT.texture;
  pmrem.dispose();

  // ---------------------------------------------------------------------------
  // Lighting
  // ---------------------------------------------------------------------------
  const hemi = new THREE.HemisphereLight(0xfff3e0, 0x15110c, 0.55);
  hemi.position.set(0, 0, 5);
  scene.add(hemi);
  const fill = new THREE.DirectionalLight(0x9fb3d9, 0.22);
  fill.position.set(3, 7, 4);
  fill.target.position.set(1.6, 1.0, 0.9);
  scene.add(fill, fill.target);
  const studioKey = new THREE.DirectionalLight(0xffe2bb, 2.4);
  studioKey.position.set(STAGE_CENTER.x - 2, STAGE_CENTER.y + 3, STAGE_CENTER.z + 4);
  studioKey.target.position.copy(STAGE_CENTER);
  scene.add(studioKey, studioKey.target);

  // ---------------------------------------------------------------------------
  // Scene content
  // ---------------------------------------------------------------------------
  const roomShell = buildRoomShell();
  scene.add(roomShell.group);

  const decor = buildDecor({ cofferDepth: roomShell.cofferDepth, wainscotH: roomShell.wainscotH });
  scene.add(decor);

  const studioBackdrop = buildStudioBackdrop();
  studioBackdrop.position.copy(STAGE_CENTER);
  scene.add(studioBackdrop);

  const figure = buildFigure();
  figure.position.set(STATION_A.xCenter + 0.55, 1.1, 0);
  figure.rotation.z = Math.PI;
  scene.add(figure);

  const stationA = buildTrackballStation();
  stationA.group.position.copy(ROOM_STATION_A_POS);
  scene.add(stationA.group);

  const stationB = buildShooterConsole({ controlMode: 'holster' });
  stationB.group.position.copy(ROOM_STATION_B_POS);
  scene.add(stationB.group);

  const golfTex = golfScreenTexture();
  const huntTex = huntScreenTexture();
  const jungleTex = jungleScreenTexture();

  const tv43 = buildWallTV({ activeW: TV43.activeW, activeH: TV43.activeH, mountHeight: TV43.mountCenterHeight, texture: golfTex, standoff: 0.09 });
  tv43.position.x = TV43.xCenter;
  scene.add(tv43);
  const cable43 = buildCableRun(TV43.xCenter, TV43.mountCenterHeight - TV43.activeH / 2 - 0.04, 0.03);
  scene.add(cable43);

  const tv55 = buildWallTV({ activeW: TV55.activeW, activeH: TV55.activeH, mountHeight: TV55.mountCenterHeight, texture: huntTex, standoff: 0.1 });
  tv55.position.x = TV55.xCenter;
  scene.add(tv55);
  const cable55 = buildCableRun(TV55.xCenter, TV55.mountCenterHeight - TV55.activeH / 2 - 0.04, 0.03);
  scene.add(cable55);

  // ---------------------------------------------------------------------------
  // HUD overlay (baked into the same canvas via a second orthographic pass, so the
  // "concept render" disclaimer and view caption survive no matter how the parent
  // captures the page — full-page screenshot or a clip of the <canvas> element).
  // ---------------------------------------------------------------------------
  const hudScene = new THREE.Scene();
  const hudCamera = new THREE.OrthographicCamera(0, window.innerWidth, window.innerHeight, 0, -10, 10);
  hudCamera.position.z = 5;
  let hudDisclaimer = null;
  let hudCaption = null;

  function pillTexture(text, { align = 'left', accent = '#2bd9c7' } = {}) {
    const padding = 18;
    const fontSize = 15;
    const c = document.createElement('canvas');
    const measure = document.createElement('canvas').getContext('2d');
    measure.font = `600 ${fontSize}px "Segoe UI", Arial, sans-serif`;
    const textW = measure.measureText(text).width;
    const w = Math.ceil(textW + padding * 2);
    const h = 38;
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    ctx.fillStyle = 'rgba(10,10,12,0.68)';
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 8);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(0.5, 0.5, w - 1, h - 1, 8);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#f1f4f3';
    ctx.font = `600 ${fontSize}px "Segoe UI", Arial, sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = align;
    ctx.fillText(text, align === 'left' ? padding : w - padding, h / 2 + 1);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return { tex, w, h };
  }

  function makeHudMesh(text, opts) {
    const { tex, w, h } = pillTexture(text, opts);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false }));
    mesh.userData.w = w;
    mesh.userData.h = h;
    return mesh;
  }

  function layoutHud() {
    const margin = 18;
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (hudDisclaimer) {
      hudDisclaimer.position.set(margin + hudDisclaimer.userData.w / 2, margin + hudDisclaimer.userData.h / 2, 0);
    }
    if (hudCaption) {
      hudCaption.position.set(w - margin - hudCaption.userData.w / 2, margin + hudCaption.userData.h / 2, 0);
    }
  }

  function updateHud(viewName) {
    if (hudDisclaimer) hudScene.remove(hudDisclaimer);
    if (hudCaption) hudScene.remove(hudCaption);
    hudDisclaimer = makeHudMesh('CONCEPT RENDER — not a built or photographed product', { align: 'left', accent: '#ff9c4a' });
    hudCaption = makeHudMesh(VIEW_CAPTIONS[viewName] || viewName, { align: 'right', accent: '#2bd9c7' });
    hudScene.add(hudDisclaimer, hudCaption);
    layoutHud();
  }

  // ---------------------------------------------------------------------------
  // Deterministic view switching
  // ---------------------------------------------------------------------------
  let currentView = 'hero';

  function updateActiveButton(name) {
    document.querySelectorAll('[data-view]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.view === name);
    });
    const label = document.getElementById('viewLabel');
    if (label) label.textContent = VIEW_CAPTIONS[name] || name;
  }

  function renderFrame() {
    renderer.autoClear = true;
    renderer.render(scene, camera);
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.render(hudScene, hudCamera);
    renderer.autoClear = true;
  }

  function applyView(name) {
    const v = getViewState(VIEW_NAMES.includes(name) ? name : 'hero');
    currentView = VIEW_NAMES.includes(name) ? name : 'hero';

    camera.fov = v.fov;
    camera.position.copy(v.camPos);
    camera.lookAt(v.target);
    camera.updateProjectionMatrix();

    const exploded = currentView === 'exploded';
    roomShell.group.visible = !exploded;
    decor.visible = !exploded;
    studioBackdrop.visible = exploded;
    studioKey.visible = exploded;
    figure.visible = !!v.figure;
    stationB.group.visible = !exploded;
    tv43.visible = !exploded;
    tv55.visible = !exploded;
    cable43.visible = !exploded;
    cable55.visible = !exploded;

    stationA.group.position.copy(exploded ? STAGE_CENTER : ROOM_STATION_A_POS);
    stationA.setExplode(v.explode);
    stationB.setControlMode(v.controlMode);
    tv55.userData.setTexture(v.stationBScreen === 'jungle' ? jungleTex : huntTex);

    updateHud(currentView);
    renderFrame();
    updateActiveButton(currentView);

    const url = new URL(window.location.href);
    url.searchParams.set('view', currentView);
    window.history.replaceState(null, '', url);
  }

  function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    hudCamera.right = w;
    hudCamera.top = h;
    hudCamera.updateProjectionMatrix();
    layoutHud();
    renderFrame();
  }

  window.addEventListener('resize', onResize);
  document.querySelectorAll('[data-view]').forEach((btn) => {
    btn.addEventListener('click', () => applyView(btn.dataset.view));
  });

  // Documented global entry point for switching views (used by the toolbar buttons
  // and available for the parent's capture harness to call directly).
  window.setView = applyView;
  window.ARCADE_VIEWS = VIEW_NAMES;
  window.ARCADE_RENDERER = 'webgl';

  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------
  const initialParams = new URLSearchParams(window.location.search);
  const requested = initialViewOverride || initialParams.get('view');
  onResize();
  applyView(VIEW_NAMES.includes(requested) ? requested : 'hero');

  window.renderReady = true;
}
