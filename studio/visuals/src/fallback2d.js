import { ROOM, STATION_A, STATION_B, TV43, TV55, VIEW_NAMES, VIEW_CAPTIONS } from './config.js';

/**
 * A genuine alternate renderer used only when WebGL is unavailable in the viewing
 * browser. It draws real dimensioned 2D plan/elevation diagrams from the same
 * config.js numbers the 3D scene uses — not a placeholder image. Clearly labeled as
 * a fallback so it is never mistaken for the primary WebGL product renders.
 */
export function boot(initialViewOverride) {
  const canvas = document.getElementById('scene');
  const ctx = canvas.getContext('2d');

  let currentView = 'hero';

  function clear(w, h) {
    ctx.fillStyle = '#121014';
    ctx.fillRect(0, 0, w, h);
  }

  function dimLine(x1, y1, x2, y2, text) {
    ctx.strokeStyle = 'rgba(230,235,233,0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.fillStyle = '#cfe9e3';
    ctx.font = '12px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, (x1 + x2) / 2, Math.min(y1, y2) - 6);
  }

  function labelBox(x, y, w, h, fill, stroke, title, sub) {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = '#f3f6f5';
    ctx.font = '600 13px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(title, x + 8, y + 18);
    if (sub) {
      ctx.fillStyle = '#bcd';
      ctx.font = '11px "Segoe UI", Arial, sans-serif';
      ctx.fillText(sub, x + 8, y + 34);
    }
  }

  function drawPlan(w, h, highlight) {
    const margin = 90;
    const scale = Math.min((w - margin * 2) / ROOM.width, (h - margin * 2 - 60) / ROOM.depth);
    const ox = (w - ROOM.width * scale) / 2;
    const oy = 70;
    ctx.save();
    ctx.translate(ox, oy);

    ctx.strokeStyle = 'rgba(205,195,170,0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, ROOM.width * scale, ROOM.depth * scale);
    ctx.fillStyle = 'rgba(85,56,31,0.18)';
    ctx.fillRect(0, 0, ROOM.width * scale, ROOM.depth * scale);

    function footprint(st, color, label) {
      const x = st.x0 * scale;
      const y = 0;
      const ww = st.width * scale;
      const hh = st.depth * scale;
      labelBox(x, y, ww, hh, color + '33', color, label, `${Math.round(st.width * 1000)} × ${Math.round(st.depth * 1000)} mm`);
    }
    footprint(STATION_A, highlight === 'trackball' ? '#2bd9c7' : '#8f6038', 'STATION A — TRACKBALL');
    footprint(STATION_B, highlight === 'shooter' || highlight === 'mounted' ? '#2bd9c7' : '#8f6038', 'STATION B — SHOOTER');

    // Wall TVs as dashed marks on the back wall.
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = '#e79a52';
    [TV43, TV55].forEach((tv) => {
      ctx.strokeRect(tv.xCenter * scale - (tv.activeW * scale) / 2, -10, tv.activeW * scale, 8);
    });
    ctx.setLineDash([]);

    if (highlight === 'room') {
      const fx = STATION_A.xCenter * scale + 20;
      const fy = (STATION_A.depth + 0.3) * scale;
      ctx.fillStyle = '#cd9a73';
      ctx.beginPath();
      ctx.arc(fx, fy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#eee';
      ctx.font = '11px Arial';
      ctx.fillText('1.74 m reference figure', fx + 10, fy + 4);
    }

    dimLine(0, -26, ROOM.width * scale, -26, `Room ${ROOM.width * 1000} mm wide (illustrative, not measured)`);
    ctx.restore();
  }

  function drawElevation(w, h, station, mode) {
    const scale = Math.min((w - 200) / station.width, (h - 220) / station.height) * 0.85;
    const ox = w / 2 - (station.width * scale) / 2;
    const oy = h - 120 - station.height * scale;
    ctx.save();
    ctx.translate(ox, oy);
    labelBox(0, 0, station.width * scale, station.height * scale, 'rgba(45,45,50,0.6)', '#2bd9c7', 'FRONT ELEVATION (fallback 2D)', `${Math.round(station.width * 1000)}×${Math.round(station.depth * 1000)}×${Math.round(station.height * 1000)} mm`);

    if (station === STATION_A) {
      ctx.fillStyle = '#e79a52';
      ctx.beginPath();
      ctx.arc(station.width * scale * 0.4, station.height * scale * 0.12, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#eee';
      ctx.font = '11px Arial';
      ctx.fillText('76.2 mm trackball', station.width * scale * 0.4 + 20, station.height * scale * 0.12 + 4);
    } else {
      if (mode === 'mounted') {
        ctx.fillStyle = '#565c52';
        ctx.fillRect(station.width * scale * 0.42, station.height * scale * 0.05, station.width * scale * 0.16, 30);
        ctx.fillStyle = '#eee';
        ctx.font = '11px Arial';
        ctx.fillText('mounted 2-axis gimbal (Jurassic Park alt.)', station.width * scale * 0.42, station.height * scale * 0.05 - 8);
      } else {
        [-1, 1].forEach((s) => {
          const x = station.width * scale * 0.5 + (s * STATION_B.holsterSpacing * scale) / 2;
          ctx.fillStyle = '#e79a52';
          ctx.beginPath();
          ctx.arc(x, station.height * scale * 0.08, 10, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.fillStyle = '#eee';
        ctx.font = '11px Arial';
        ctx.fillText('two handheld holster guns', station.width * scale * 0.5 - 60, -10);
      }
    }
    ctx.restore();
  }

  function drawExploded(w, h) {
    const parts = [
      { label: 'CONTROL DECK', color: '#8f6038' },
      { label: 'DECK PLINTH', color: '#2d2d32' },
      { label: 'BACK SERVICE PANEL', color: '#2d2d32' },
      { label: 'FACE PANEL', color: '#8f6038' },
      { label: 'BODY SHELL', color: '#232327' },
      { label: 'PLINTH / BASE', color: '#232327' },
    ];
    const boxW = 320;
    const boxH = 46;
    const gap = 18;
    const totalH = parts.length * (boxH + gap);
    let y = h / 2 - totalH / 2;
    const x = w / 2 - boxW / 2;
    for (const p of parts) {
      labelBox(x, y, boxW, boxH, p.color + 'aa', '#2bd9c7', p.label, '');
      y += boxH + gap;
    }
  }

  function render() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;
    clear(w, h);

    ctx.fillStyle = '#f3f6f5';
    ctx.font = '700 20px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('AFTER HOURS — Arcade Studio (2D fallback renderer)', 24, 36);
    ctx.fillStyle = '#ffb066';
    ctx.font = '600 13px "Segoe UI", Arial, sans-serif';
    ctx.fillText('WebGL is unavailable in this browser — showing a dimensioned 2D plan/elevation instead of the 3D product render.', 24, 56);

    if (currentView === 'exploded') {
      drawExploded(w, h);
    } else if (currentView === 'trackball') {
      drawElevation(w, h, STATION_A, 'holster');
    } else if (currentView === 'shooter') {
      drawElevation(w, h, STATION_B, 'holster');
    } else if (currentView === 'mounted') {
      drawElevation(w, h, STATION_B, 'mounted');
    } else {
      drawPlan(w, h, currentView);
    }

    ctx.fillStyle = 'rgba(10,10,12,0.68)';
    ctx.fillRect(18, h - 56, 420, 32);
    ctx.fillStyle = '#f1f4f3';
    ctx.font = '600 13px "Segoe UI", Arial, sans-serif';
    ctx.fillText('CONCEPT RENDER — not a built or photographed product', 30, h - 35);

    const capText = VIEW_CAPTIONS[currentView] || currentView;
    ctx.font = '600 13px "Segoe UI", Arial, sans-serif';
    const capW = ctx.measureText(capText).width + 36;
    ctx.fillStyle = 'rgba(10,10,12,0.68)';
    ctx.fillRect(w - capW - 18, h - 56, capW, 32);
    ctx.fillStyle = '#f1f4f3';
    ctx.textAlign = 'right';
    ctx.fillText(capText, w - 30, h - 35);
    ctx.textAlign = 'left';
  }

  function applyView(name) {
    currentView = VIEW_NAMES.includes(name) ? name : 'hero';
    render();
    document.querySelectorAll('[data-view]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.view === currentView);
    });
    const label = document.getElementById('viewLabel');
    if (label) label.textContent = VIEW_CAPTIONS[currentView] || currentView;
    const url = new URL(window.location.href);
    url.searchParams.set('view', currentView);
    window.history.replaceState(null, '', url);
  }

  window.addEventListener('resize', render);
  document.querySelectorAll('[data-view]').forEach((btn) => {
    btn.addEventListener('click', () => applyView(btn.dataset.view));
  });

  window.setView = applyView;
  window.ARCADE_VIEWS = VIEW_NAMES;
  window.ARCADE_RENDERER = '2d-fallback';

  const params = new URLSearchParams(window.location.search);
  const requested = initialViewOverride || params.get('view');
  applyView(VIEW_NAMES.includes(requested) ? requested : 'hero');

  window.renderReady = true;
}
