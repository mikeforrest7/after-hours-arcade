// Entry point: detects real WebGL availability and boots either the full Three.js
// scene (src/sceneApp.js) or a genuine dimensioned 2D fallback (src/fallback2d.js).
// Both modules implement the same documented interface: window.setView(name),
// window.ARCADE_VIEWS, window.renderReady. See render.html / MANIFEST.md.

function detectWebGL() {
  try {
    const test = document.createElement('canvas');
    const gl = test.getContext('webgl2') || test.getContext('webgl') || test.getContext('experimental-webgl');
    return !!gl;
  } catch (e) {
    return false;
  }
}

const params = new URLSearchParams(window.location.search);
const initialView = params.get('view');

if (detectWebGL()) {
  import('./sceneApp.js').then((mod) => mod.boot(initialView));
} else {
  import('./fallback2d.js').then((mod) => mod.boot(initialView));
}
