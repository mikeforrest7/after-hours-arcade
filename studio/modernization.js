'use strict';

const modernHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[character]));
const modernNode = (selector) => document.querySelector(selector);
const gameAsset = (src) => `games/${src}`;

function conceptFigure(media, label, extraClass = '') {
  const url = gameAsset(media.src);
  return `<figure class="modern-concept${extraClass ? ` ${extraClass}` : ''}"><a href="${modernHtml(url)}" target="_blank" rel="noopener noreferrer" aria-label="Open full-size image: ${modernHtml(media.alt)}"><img src="${modernHtml(url)}" width="${media.width}" height="${media.height}" alt="${modernHtml(media.alt)}" loading="lazy"></a><figcaption><span>${modernHtml(label)}</span>${modernHtml(media.caption)}</figcaption></figure>`;
}

async function loadModernization() {
  const response = await fetch('modernization.json', {cache:'no-store'});
  if (!response.ok) throw new Error(`Modernization plan: HTTP ${response.status}`);
  const plan = await response.json();
  if (plan.schemaVersion !== 1 || plan.games.length !== 4) throw new Error('The four-game modernization contract is incomplete.');

  const guideEntries = await Promise.all(plan.games.map(async (game) => {
    const file = `games/${game.slug}.json`;
    const guideResponse = await fetch(file, {cache:'no-store'});
    if (!guideResponse.ok) throw new Error(`${file}: HTTP ${guideResponse.status}`);
    return [game.slug, await guideResponse.json()];
  }));
  const guides = new Map(guideEntries);

  const concepts = new Map(plan.games.map((game) => {
    const guide = guides.get(game.slug);
    if (!guide || !Array.isArray(guide.media)) throw new Error(`${game.title}: game guide has no media gallery.`);
    const conceptMedia = guide.media.filter((item) => item.role === 'concept');
    const environment = conceptMedia.find((item) => item.view === 'environment');
    const detail = conceptMedia.find((item) => item.view === 'detail');
    const station = conceptMedia.find((item) => item.view === 'station');
    if (!environment || !detail || !station) throw new Error(`${game.title}: concept gallery is incomplete (expected environment, detail and station renders).`);
    const reference = guide.media.find((item) => item.role !== 'concept' && /screenshot|trailer frame/i.test(item.kind)) || guide.media.find((item) => item.role !== 'concept');
    if (!reference) throw new Error(`${game.title}: no existing commercial reference image found.`);
    return [game.slug, {environment, detail, station, reference}];
  }));

  const sources = new Map(plan.sources.map((source, index) => [source.id, {...source, number:index + 1}]));
  const cite = (ids = []) => `<span class="modern-citations">${ids.map((id) => {
    const source = sources.get(id);
    if (!source) throw new Error(`Unknown modernization source: ${id}`);
    return `<a href="#modern-source-${modernHtml(id)}" aria-label="Source ${source.number}: ${modernHtml(source.title)}">[${source.number}]</a>`;
  }).join('')}</span>`;
  const list = (items) => `<ul>${items.map((item) => `<li>${modernHtml(item)}</li>`).join('')}</ul>`;

  modernNode('#modern-thesis').textContent = plan.thesis;
  modernNode('#modern-recommendation').textContent = plan.recommendation;

  modernNode('#modern-hero-gallery').innerHTML = plan.games.map((game) => {
    const environment = concepts.get(game.slug).environment;
    const url = gameAsset(environment.src);
    return `<a class="modern-hero-tile" href="#game-${modernHtml(game.slug)}"><img src="${modernHtml(url)}" width="${environment.width}" height="${environment.height}" alt="${modernHtml(environment.alt)}" loading="lazy"><span>${modernHtml(game.title)}<small>PROPOSED CONCEPT</small></span></a>`;
  }).join('');

  modernNode('#modern-detail-gallery').innerHTML = plan.games.map((game) => conceptFigure(concepts.get(game.slug).station, game.title)).join('');

  modernNode('#upgrade-paths').innerHTML = plan.tiers.map((tier, index) => `<article class="upgrade-path" id="path-${modernHtml(tier.id)}"><span class="path-number">0${index + 1} / UPGRADE PATH</span><h3>${modernHtml(tier.title)}</h3><p>${modernHtml(tier.promise)}${cite(tier.sourceIds)}</p><h4>What can change</h4>${list(tier.changes)}<details><summary>Limits and the evidence to earn it</summary><h4>What this does not buy</h4>${list(tier.limits)}<h4>Release proof</h4>${list(tier.proof)}</details></article>`).join('');

  modernNode('#modern-game-tabs').innerHTML = plan.games.map((game, index) => `<button role="tab" type="button" id="modern-tab-${modernHtml(game.slug)}" aria-controls="game-${modernHtml(game.slug)}" aria-selected="${index === 0}" tabindex="${index === 0 ? 0 : -1}" data-modern-game="${modernHtml(game.slug)}">0${index + 1}<span>${modernHtml(game.title)}</span></button>`).join('');

  modernNode('#modern-game-panels').innerHTML = plan.games.map((game, index) => {
    const concept = concepts.get(game.slug);
    const gallery = `<div class="modern-game-gallery">${conceptFigure(concept.environment, 'PROPOSED CONCEPT · Environment study')}${conceptFigure(concept.detail, 'PROPOSED CONCEPT · Detail study')}${conceptFigure(concept.reference, `EXISTING COMMERCIAL REFERENCE · ${concept.reference.kind}`, 'modern-reference')}</div><p class="modern-gallery-boundary">Concept renders are original visual studies for this proposal, not a captured, upscaled or remastered frame of ${game.title}. No working build or emulator output is implied.</p>`;
    return `<article class="modern-game-panel" id="game-${modernHtml(game.slug)}" role="tabpanel" aria-labelledby="modern-tab-${modernHtml(game.slug)}" tabindex="0"${index ? ' hidden' : ''}><div class="modern-game-heading"><div><p class="eyebrow">THE SELECTED-RELEASE QUESTION</p><h3>${modernHtml(game.title)}</h3><a class="text-link" href="games/${modernHtml(game.slug)}.html">Reference images and in-game walkthrough <span aria-hidden="true">↗</span></a></div><p>${modernHtml(game.baseline)}${cite(game.sourceIds)}</p></div>${gallery}<div class="modern-actions"><article><h4>Improve the experience first</h4><p>${modernHtml(game.nearTerm)}</p></article><article><h4>Conditional graphics work</h4><p>${modernHtml(game.conditional)}</p></article><article><h4>A separate modern-engine concept</h4><p>${modernHtml(game.modernConcept)}</p></article><article><h4>What we must not promise</h4><p>${modernHtml(game.doNotClaim)}</p></article></div><details class="modern-experiments"><summary>Bench experiments and measurable acceptance gates</summary><ol>${game.experiments.map((experiment) => `<li><h4>${modernHtml(experiment.name)}</h4><p>${modernHtml(experiment.method)}</p><strong>Proposed pass gate</strong><p>${modernHtml(experiment.passGate)}</p></li>`).join('')}</ol></details></article>`;
  }).join('');

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

loadModernization().catch((error) => {
  modernNode('#modern-error').textContent = `The modernization guide could not load. ${error.message}`;
  modernNode('#modern-error').hidden = false;
  window.arcadeModernError = error.message;
});
