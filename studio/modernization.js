'use strict';

const modernHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[character]));
const modernNode = (selector) => document.querySelector(selector);

function paintResolutionDemo(mode) {
  const canvas = modernNode('#resolution-demo');
  const output = canvas.getContext('2d');
  const detailed = mode === 'detail';
  const scene = document.createElement('canvas');
  scene.width = detailed ? 960 : 160;
  scene.height = detailed ? 540 : 90;
  const ctx = scene.getContext('2d');
  ctx.scale(scene.width / 960, scene.height / 540);
  const sky = ctx.createLinearGradient(0, 0, 0, 350);
  sky.addColorStop(0, '#6b9da5');
  sky.addColorStop(1, '#e4d5ac');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 960, 540);
  const polygon = (points, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath();
    ctx.fill();
  };
  const ellipse = (x, y, rx, ry, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  ellipse(750, 114, 40, 40, '#f1dfae');
  polygon([[0, 269], [96, 211], [198, 259], [310, 185], [447, 269], [590, 218], [727, 269], [850, 219], [960, 257], [960, 340], [0, 340]], '#668b86');
  polygon([[0, 319], [110, 275], [205, 310], [355, 265], [488, 322], [654, 278], [790, 314], [960, 270], [960, 540], [0, 540]], '#54765c');
  polygon([[530, 311], [960, 295], [960, 540], [690, 540], [742, 445], [634, 390]], '#527f85');
  polygon([[406, 300], [490, 307], [555, 347], [501, 395], [612, 445], [689, 540], [150, 540], [313, 428], [299, 372]], '#97a86a');
  ellipse(430, 331, 88, 25, '#aec185');
  ellipse(551, 392, 35, 13, '#d9c79d');
  ellipse(297, 461, 58, 20, '#d9c79d');
  const tree = (x, y, size) => {
    if (detailed) ellipse(x + size * .3, y + 3, size * .7, size * .12, '#3f594d');
    ctx.fillStyle = '#4c4f40';
    ctx.fillRect(x - size * .04, y - size * .6, size * .08, size * .6);
    polygon([[x, y - size], [x - size * .4, y - size * .35], [x + size * .4, y - size * .35]], '#304f47');
    polygon([[x, y - size * .82], [x - size * .48, y - size * .12], [x + size * .48, y - size * .12]], '#385e4d');
    if (detailed) polygon([[x, y - size * .82], [x, y - size * .12], [x + size * .48, y - size * .12]], '#466d51');
  };
  [[88, 356, 83], [190, 378, 66], [252, 336, 47], [615, 330, 48], [835, 351, 70], [894, 389, 106], [85, 485, 169]].forEach((args) => tree(...args));
  if (detailed) {
    for (let index = 0; index < 70; index++) {
      const x = 20 + ((index * 137) % 925);
      const y = 390 + ((index * 67) % 145);
      if (x > 170 && x < 690) continue;
      if (x > 690) continue;
      ctx.strokeStyle = index % 2 ? '#708761' : '#adc18a';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 2, y - 5 - index % 8);
      ctx.stroke();
    }
    ctx.strokeStyle = '#a8c4b2';
    ctx.lineWidth = 1;
    for (let index = 0; index < 24; index++) {
      const y = 340 + index * 7;
      const x = 772 + Math.sin(index * 2.2) * 42;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 25 + index * 2, y);
      ctx.stroke();
    }
    for (let index = 0; index < 6; index++) tree(20 + index * 43, 312 + index % 2 * 9, 20 + index * 3);
    const light = ctx.createLinearGradient(250, 250, 500, 540);
    light.addColorStop(0, 'rgba(239,219,144,.12)');
    light.addColorStop(1, 'rgba(25,51,40,.12)');
    ctx.fillStyle = light;
    ctx.fillRect(0, 290, 680, 250);
  }
  ellipse(441, 332, detailed ? 5 : 6, 2, '#243e39');
  ctx.strokeStyle = '#ece6cf';
  ctx.lineWidth = detailed ? 2 : 4;
  ctx.beginPath();
  ctx.moveTo(441, 332);
  ctx.lineTo(441, 271);
  ctx.stroke();
  polygon([[442, 271], [470, 280], [442, 291]], '#ce8261');
  ellipse(410, 500, 9, 4, '#536c50');
  ellipse(407, 493, 6, 6, '#f4eedc');
  output.clearRect(0, 0, canvas.width, canvas.height);
  output.imageSmoothingEnabled = mode !== 'native';
  output.imageSmoothingQuality = 'high';
  output.drawImage(scene, 0, 0, canvas.width, canvas.height);
  modernNode('#demo-explanation').textContent = {
    native:'A 160 × 90 illustration is enlarged with nearest-neighbor sampling. The steps reveal the small source raster. These dimensions are chosen for the demonstration, not taken from any target game.',
    scaled:'The very same 160 × 90 illustration is filtered into a 960 × 540 canvas. Edges soften, but the filter does not add trees, new material detail or a new lighting model.',
    detail:'This illustration is redrawn at 960 × 540 with extra vegetation, highlights and shadows. Those changes were authored. Achieving comparable changes in a real game requires a supported rendering path and new content.'
  }[mode];
  for (const button of document.querySelectorAll('[data-demo]')) button.setAttribute('aria-pressed', String(button.dataset.demo === mode));
  window.arcadeModernDemo = mode;
}

async function loadModernization() {
  const response = await fetch('modernization.json', {cache:'no-store'});
  if (!response.ok) throw new Error(`Modernization plan: HTTP ${response.status}`);
  const plan = await response.json();
  if (plan.schemaVersion !== 1 || plan.games.length !== 4) throw new Error('The four-game modernization contract is incomplete.');
  const sources = new Map(plan.sources.map((source, index) => [source.id, {...source, number:index + 1}]));
  const cite = (ids = []) => `<span class="modern-citations">${ids.map((id) => {
    const source = sources.get(id);
    if (!source) throw new Error(`Unknown modernization source: ${id}`);
    return `<a href="#modern-source-${modernHtml(id)}" aria-label="Source ${source.number}: ${modernHtml(source.title)}">[${source.number}]</a>`;
  }).join('')}</span>`;
  const list = (items) => `<ul>${items.map((item) => `<li>${modernHtml(item)}</li>`).join('')}</ul>`;
  modernNode('#modern-thesis').textContent = plan.thesis;
  modernNode('#modern-recommendation').textContent = plan.recommendation;
  modernNode('#upgrade-paths').innerHTML = plan.tiers.map((tier, index) => `<article class="upgrade-path" id="path-${modernHtml(tier.id)}"><span class="path-number">0${index + 1} / UPGRADE PATH</span><h3>${modernHtml(tier.title)}</h3><p>${modernHtml(tier.promise)}${cite(tier.sourceIds)}</p><h4>What can change</h4>${list(tier.changes)}<details><summary>Limits and the evidence to earn it</summary><h4>What this does not buy</h4>${list(tier.limits)}<h4>Release proof</h4>${list(tier.proof)}</details></article>`).join('');
  modernNode('#modern-game-tabs').innerHTML = plan.games.map((game, index) => `<button role="tab" type="button" id="modern-tab-${modernHtml(game.slug)}" aria-controls="game-${modernHtml(game.slug)}" aria-selected="${index === 0}" tabindex="${index === 0 ? 0 : -1}" data-modern-game="${modernHtml(game.slug)}">0${index + 1}<span>${modernHtml(game.title)}</span></button>`).join('');
  modernNode('#modern-game-panels').innerHTML = plan.games.map((game, index) => `<article class="modern-game-panel" id="game-${modernHtml(game.slug)}" role="tabpanel" aria-labelledby="modern-tab-${modernHtml(game.slug)}" tabindex="0"${index ? ' hidden' : ''}><div class="modern-game-heading"><div><p class="eyebrow">THE SELECTED-RELEASE QUESTION</p><h3>${modernHtml(game.title)}</h3><a class="text-link" href="games/${modernHtml(game.slug)}.html">Reference images and in-game walkthrough <span aria-hidden="true">↗</span></a></div><p>${modernHtml(game.baseline)}${cite(game.sourceIds)}</p></div><div class="modern-actions"><article><h4>Improve the experience first</h4><p>${modernHtml(game.nearTerm)}</p></article><article><h4>Conditional graphics work</h4><p>${modernHtml(game.conditional)}</p></article><article><h4>A separate modern-engine concept</h4><p>${modernHtml(game.modernConcept)}</p></article><article><h4>What we must not promise</h4><p>${modernHtml(game.doNotClaim)}</p></article></div><details class="modern-experiments"><summary>Bench experiments and measurable acceptance gates</summary><ol>${game.experiments.map((experiment) => `<li><h4>${modernHtml(experiment.name)}</h4><p>${modernHtml(experiment.method)}</p><strong>Proposed pass gate</strong><p>${modernHtml(experiment.passGate)}</p></li>`).join('')}</ol></details></article>`).join('');
  const pipelineTitles = new Map(plan.pipeline.map((step) => [step.id, step.title]));
  modernNode('#modern-pipeline').innerHTML = plan.pipeline.map((step, index) => `<li><span class="pipeline-id">${String(index + 1).padStart(2, '0')} / ${modernHtml(step.id)}</span><h3>${modernHtml(step.title)}</h3><p>${modernHtml(step.output)}</p><p class="pipeline-gate">${modernHtml(step.gate)}</p><span class="pipeline-dependencies">${step.dependsOn.length ? `Requires: ${step.dependsOn.map((id) => {
    if (!pipelineTitles.has(id)) throw new Error(`Unknown pipeline dependency: ${id}`);
    return modernHtml(pipelineTitles.get(id));
  }).join(' · ')}` : 'Can start independently'}</span></li>`).join('');
  modernNode('#modern-decisions').innerHTML = plan.decisions.map((decision) => `<article><h3>${modernHtml(decision.title)}</h3><p>${modernHtml(decision.recommendation)}</p><small>${modernHtml(decision.why)}</small></article>`).join('');
  modernNode('#modern-sources').innerHTML = plan.sources.map((source) => `<li id="modern-source-${modernHtml(source.id)}"><a href="${modernHtml(source.url)}" target="_blank" rel="noopener noreferrer">${modernHtml(source.title)}</a><p>${modernHtml(source.publisher)} · Accessed ${modernHtml(source.accessed)}</p></li>`).join('');
  const buttons = Array.from(document.querySelectorAll('[data-modern-game]'));
  function selectGame(slug, focus = false) {
    if (!plan.games.some((game) => game.slug === slug)) return;
    for (const button of buttons) {
      const selected = button.dataset.modernGame === slug;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
      modernNode(`#game-${button.dataset.modernGame}`).hidden = !selected;
      if (selected && focus) button.focus();
    }
    window.arcadeModernGame = slug;
  }
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => {
      selectGame(button.dataset.modernGame);
      history.replaceState(null, '', `#game-${button.dataset.modernGame}`);
    });
    button.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next].click();
      selectGame(buttons[next].dataset.modernGame, true);
    });
  });
  const applyHash = () => {
    const slug = location.hash.replace(/^#game-/, '');
    if (plan.games.some((game) => game.slug === slug)) {
      selectGame(slug);
      modernNode('#games').scrollIntoView({behavior:'instant', block:'start'});
    }
  };
  selectGame(plan.games[0].slug);
  applyHash();
  window.addEventListener('hashchange', applyHash);
  window.arcadeModernReady = true;
}

for (const button of document.querySelectorAll('[data-demo]')) button.addEventListener('click', () => paintResolutionDemo(button.dataset.demo));
paintResolutionDemo('native');
loadModernization().catch((error) => {
  modernNode('#modern-error').textContent = `The modernization guide could not load. ${error.message}`;
  modernNode('#modern-error').hidden = false;
  window.arcadeModernError = error.message;
});
