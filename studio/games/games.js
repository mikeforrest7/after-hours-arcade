'use strict';

const gamePages = [
  ['golden-tee', 'Golden Tee'],
  ['big-buck-hunter', 'Big Buck Hunter'],
  ['silver-strike', 'Silver Strike'],
  ['jurassic-park', 'Jurassic Park']
];
const html = (value) => String(value).replace(/[&<>"']/g, (character) => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[character]));
const external = (url, label) => `<a href="${html(url)}" target="_blank" rel="noopener noreferrer">${html(label)}</a>`;
const node = (selector) => document.querySelector(selector);
const viewLabels = {environment:'Environment view', station:'Station view', detail:'Detail view'};
const viewLabel = (view) => viewLabels[view] || html(view);

async function loadGameGuide() {
  const slug = document.body.dataset.game;
  if (!gamePages.some(([id]) => id === slug)) throw new Error('Unknown game page.');
  node('#game-links').innerHTML = gamePages.map(([id, title], index) => `<a href="${id}.html"${id === slug ? ' aria-current="page"' : ''}><span>${String(index + 1).padStart(2, '0')}</span>${html(title)}</a>`).join('');
  const [guide, specifications] = await Promise.all([`${slug}.json`, '../experience.json'].map(async (file) => {
    const response = await fetch(file, {cache:'no-store'});
    if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
    return response.json();
  }));
  const specification = specifications.games.find((game) => game.id === guide.overviewId);
  if (!specification) throw new Error('The engineering contract for this game is missing.');
  const sources = new Map(guide.sources.map((source, index) => [source.id, {...source, number:index + 1}]));
  const cite = (ids) => `<span class="gd-citations">${ids.map((id) => {
    const source = sources.get(id);
    if (!source) throw new Error(`Missing source: ${id}`);
    return `<a href="#source-${html(id)}" aria-label="Source ${source.number}: ${html(source.title)}">[${source.number}]</a>`;
  }).join(' ')}</span>`;

  const concepts = guide.media.filter((image) => image.role === 'concept');
  if (concepts.length !== 3) throw new Error('Expected exactly three proposed-look concept images.');
  const references = guide.media.filter((image) => image.role !== 'concept');
  if (!references.length) throw new Error('The reference gallery has no images.');
  const galleries = {concept:concepts, reference:references};
  const selected = {concept:concepts.findIndex((image) => image.id === guide.heroMediaId), reference:0};
  if (selected.concept < 0) throw new Error('The concept gallery has no lead image.');
  let activeGallery = 'concept';

  const currentPage = gamePages.findIndex(([id]) => id === slug);
  const nextPage = gamePages[(currentPage + 1) % gamePages.length];

  const thumbnail = (gallery, image, index) => gallery === 'concept'
    ? `<button class="gd-thumbnail gd-thumbnail-concept" type="button" data-concept-image="${index}" aria-pressed="false" aria-label="View proposed look ${index + 1} (${viewLabel(image.view)}): ${html(image.alt)}"><img src="${html(image.src)}" alt="" width="${image.width}" height="${image.height}" loading="lazy"><span><b class="gd-thumbnail-flag">Proposed look</b>${viewLabel(image.view)}</span></button>`
    : `<button class="gd-thumbnail" type="button" data-reference-image="${index}" aria-pressed="false" aria-label="View image ${index + 1}: ${html(image.alt)}"><img src="${html(image.src)}" alt="" width="${image.width}" height="${image.height}" loading="lazy"><span>${String(index + 1).padStart(2, '0')} / ${html(image.kind)}</span></button>`;

  node('#guide-content').innerHTML = `
    <header class="gd-title" aria-labelledby="guide-title">
      <div><p class="chapter-number">${html(guide.number)} / ${html(guide.kicker)}</p><h1 id="guide-title">${html(guide.title)}</h1></div><p class="gd-headline">${html(guide.headline)}</p>
    </header>

    <section class="gd-gallery gd-concept-gallery" id="gallery" aria-labelledby="gallery-title">
      <div class="gd-gallery-intro"><div><p class="eyebrow">Proposed look</p><h2 id="gallery-title">See the new look.</h2></div><p>Three views: environment, detail and station. Compare the proposed direction with the original commercial references below. <a class="text-link" href="#reference-gallery">Jump to the commercial reference gallery <span aria-hidden="true">↓</span></a></p></div>
      <div class="gd-viewer"><button class="gd-stage" id="concept-open-image" type="button" aria-label="Enlarge selected proposed-look image"><img id="concept-stage-image" alt=""><span class="gd-enlarge">Enlarge image</span></button><div class="gd-image-notes" id="concept-notes" aria-live="polite"></div></div>
      <div class="gd-gallery-bar"><p id="concept-position" aria-live="polite"></p><div><button class="quiet-button" id="concept-gallery-previous" type="button" aria-label="Previous proposed-look image">Previous</button><button class="quiet-button" id="concept-gallery-next" type="button" aria-label="Next proposed-look image">Next</button></div></div>
      <div class="gd-thumbnails" role="group" aria-label="Proposed-look image choices">${concepts.map((image, index) => thumbnail('concept', image, index)).join('')}</div>
      <p class="gd-gallery-boundary">Original 3D concept studies—not commercial game footage, validated remasters or evidence of a fabricated product.</p>
    </section>

    <section class="gd-gallery gd-reference-gallery" id="reference-gallery" aria-labelledby="reference-gallery-title">
      <div class="gd-gallery-intro"><div><p class="eyebrow">Commercial reference</p><h2 id="reference-gallery-title">Reference gallery</h2></div><p>Select a photo or screen below. Enlarge it to inspect the details. <a class="text-link" href="#gallery">Back to the proposed look <span aria-hidden="true">↑</span></a></p></div>
      <div class="gd-viewer"><button class="gd-stage" id="reference-open-image" type="button" aria-label="Enlarge selected reference image"><img id="reference-stage-image" alt=""><span class="gd-enlarge">Enlarge image</span></button><div class="gd-image-notes" id="reference-notes" aria-live="polite"></div></div>
      <div class="gd-gallery-bar"><p id="reference-position" aria-live="polite"></p><div><button class="quiet-button" id="reference-gallery-previous" type="button" aria-label="Previous reference image">Previous</button><button class="quiet-button" id="reference-gallery-next" type="button" aria-label="Next reference image">Next</button></div></div>
      <div class="gd-thumbnails" role="group" aria-label="Reference image choices">${references.map((image, index) => thumbnail('reference', image, index)).join('')}</div>
      <p class="gd-gallery-boundary">Photos and screenshots document the credited commercial games and cabinets. They are not captures from our proposed system. Source attribution is not a commercial image license.</p>
    </section>

    <section class="gd-intro" aria-labelledby="overview-title">
      <div><p class="eyebrow">THE PLAYER EXPERIENCE</p><h2 id="overview-title">What it feels like.</h2><p class="gd-deck">${html(guide.intro)}</p></div>
      <aside class="gd-reference"><p class="eyebrow">THE REFERENCE EXPERIENCE</p><h2>${html(guide.referenceScope.primary)}</h2><p>${html(guide.referenceScope.reason)}</p><p class="gd-reference-limit">${html(guide.referenceScope.caveat)}</p></aside>
    </section>

    <section class="gd-session" aria-label="The social experience"><article><p class="eyebrow">THE SESSION</p><p>${html(guide.session.format)}</p></article><article><p class="eyebrow">THE ROOM AROUND IT</p><p>${html(guide.session.social)}</p>${cite(guide.session.sourceIds)}</article><article><p class="eyebrow">WHAT MUST NOT BREAK</p><p>${html(guide.session.failureToAvoid)}</p></article></section>

    <section class="gd-section" id="play" aria-labelledby="play-title">
      <div class="gd-section-heading"><div><p class="eyebrow">FROM WALK-UP TO PAYOFF</p><h2 id="play-title">A round, from<br>the player's side.</h2></div><p>The physical action, the feedback on screen, and the judgment that makes the next attempt better.</p></div>
      <ol class="gd-play-loop">${guide.playLoop.map((step, index) => `<li><span class="gd-step-number">${String(index + 1).padStart(2, '0')}</span><div><h3>${html(step.title)}</h3><p>${html(step.action)}</p><dl><div><dt>On screen</dt><dd>${html(step.feedback)}</dd></div><div><dt>The skill</dt><dd>${html(step.skill)}</dd></div></dl>${cite(step.sourceIds)}</div></li>`).join('')}</ol>
    </section>

    <section class="gd-section gd-reading" id="screen" aria-labelledby="screen-title">
      <div class="gd-section-heading"><div><p class="eyebrow">WHAT THE PLAYER READS</p><h2 id="screen-title">The screen is<br>part of the control.</h2></div><p>These cues explain why a correctly shaped cabinet alone is not enough. The displayed reference release matters.</p></div>
      <div class="gd-cue-grid">${guide.screenRead.map((cue) => `<article><h3>${html(cue.label)}</h3><p>${html(cue.meaning)}</p>${cite(cue.sourceIds)}</article>`).join('')}</div>
      <div class="gd-moments">${guide.signatureMoments.map((moment) => `<article><p class="eyebrow">THE MOMENT TO PRESERVE</p><h3>${html(moment.title)}</h3><p>${html(moment.description)}</p>${cite(moment.sourceIds)}</article>`).join('')}</div>
    </section>

    <section class="gd-section" id="controls" aria-labelledby="controls-title">
      <div class="gd-section-heading"><div><p class="eyebrow">IN THE HANDS</p><h2 id="controls-title">What the player<br>actually touches.</h2></div><p>Original control behavior and our design interpretation are separated. A similar-looking input does not prove the same experience.</p></div>
      <div class="gd-table-wrap"><table class="gd-control-table"><thead><tr><th scope="col">Input</th><th scope="col">What it does</th><th scope="col">What the build must preserve</th></tr></thead><tbody>${guide.controls.map((control) => `<tr><th scope="row">${html(control.input)}</th><td>${html(control.action)}${cite(control.sourceIds)}</td><td>${html(control.feel)}</td></tr>`).join('')}</tbody></table></div>
    </section>

    <section class="gd-section gd-build" id="build" aria-labelledby="build-title">
      <div class="gd-section-heading"><div><p class="eyebrow">BACK TO THE BASEMENT</p><h2 id="build-title">Turn the experience<br>into a build brief.</h2></div><p>Proposed acceptance checks, not results already achieved. No game has been run or hardware qualified by this study.</p></div>
      <div class="gd-build-grid">${guide.buildPriorities.map((priority) => `<article><h3>${html(priority.title)}</h3><p>${html(priority.why)}</p><div class="gd-proof"><h4>Future proof</h4><p>${html(priority.proof)}</p></div>${cite(priority.sourceIds)}</article>`).join('')}</div>
      <details class="gd-contract"><summary>The existing control contract and prototype gate</summary><div><h3>Control contract</h3><p>${html(specification.controlContract)}</p><h3>Prototype acceptance</h3><p>${html(specification.prototypeTest)}</p><a href="../index.html#experience">Return to the full buy / build / donor comparison</a></div></details>
      <p><a class="text-link" href="../modernization.html#game-${html(guide.slug)}">How far can we modernize ${html(guide.title)}? <span aria-hidden="true">↗</span></a></p>
    </section>

    <section class="gd-section gd-releases" aria-labelledby="releases-title"><div class="gd-section-heading"><div><p class="eyebrow">KEEP THE GENERATIONS STRAIGHT</p><h2 id="releases-title">The name alone<br>is not a specification.</h2></div><p>These distinctions remain open selection decisions. Showing a cabinet or screenshot does not select that release for purchase or emulation.</p></div><div class="gd-release-grid">${guide.releaseNotes.map((note) => `<article><h3>${html(note.title)}</h3><p>${html(note.body)}</p>${cite(note.sourceIds)}</article>`).join('')}</div></section>

    <section class="gd-section gd-sources" id="sources" aria-labelledby="sources-title"><p class="eyebrow">PROVENANCE</p><h2 id="sources-title">Where the reference<br>comes from.</h2><p class="gd-source-boundary">Review-resolution excerpts accompany analysis of these games and cabinets. Rights remain with the credited owners; this study grants no commercial image license, endorsement or right to distribute game software. References to different releases are identified in each caption. No protected game software is included.</p><ol>${guide.sources.map((source) => `<li id="source-${html(source.id)}">${external(source.url, source.title)}<p>${html(source.publisher)} · Accessed ${html(source.accessed)}</p></li>`).join('')}</ol></section>

    <nav class="gd-next-game" aria-label="Continue exploring"><a class="text-link" href="../index.html#experience">Back to the studio proposal</a><a class="button primary" href="${nextPage[0]}.html">Next experience: ${html(nextPage[1])}<span aria-hidden="true">→</span></a></nav>`;

  const dialog = node('#image-dialog');
  const thumbnails = {
    concept: Array.from(document.querySelectorAll('[data-concept-image]')),
    reference: Array.from(document.querySelectorAll('[data-reference-image]'))
  };

  function renderStage(gallery) {
    const items = galleries[gallery];
    const index = selected[gallery];
    const image = items[index];
    const source = sources.get(image.sourceId);
    if (!source) throw new Error(`Missing image source: ${image.sourceId}`);
    const stageImage = node(`#${gallery}-stage-image`);
    stageImage.src = image.src;
    stageImage.alt = image.alt;
    stageImage.width = image.width;
    stageImage.height = image.height;
    const eyebrow = gallery === 'concept' ? `Proposed look · ${viewLabel(image.view)}` : html(image.kind);
    node(`#${gallery}-notes`).innerHTML = `<p class="eyebrow">${eyebrow}</p><h3>${html(image.release)}</h3><p class="gd-image-caption">${html(image.caption)}</p><p class="gd-credit">${html(image.credit)}</p><p>${external(source.url, 'View source')} <span aria-hidden="true">↗</span></p><details class="gd-image-provenance"><summary>Image provenance</summary><p>${html(image.processing)}</p><p>${image.width} × ${image.height} px · Retrieved ${html(image.retrievedAt)}</p>${external(image.assetUrl, 'Original image / document')}</details>`;
    const position = `${index + 1} / ${items.length}`;
    node(`#${gallery}-position`).textContent = gallery === 'concept' ? `${position} proposed looks` : `${position} reference images`;
    thumbnails[gallery].forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    return {image, source, position};
  }

  function renderDialog(gallery, image, source, position) {
    const roleLabel = gallery === 'concept' ? 'Proposed look' : 'Commercial reference';
    node('#dialog-title').textContent = `${guide.title} — ${roleLabel} — ${image.kind}`;
    node('#dialog-position').textContent = `${position} ${gallery === 'concept' ? 'proposed looks' : 'reference images'}`;
    const dialogImage = node('#dialog-image');
    dialogImage.src = image.src;
    dialogImage.alt = image.alt;
    dialogImage.width = image.width;
    dialogImage.height = image.height;
    node('#dialog-caption').textContent = `${gallery === 'concept' ? `Proposed look (${viewLabel(image.view)}). ` : ''}${image.release}. ${image.caption} Credit: ${image.credit}`;
    node('#dialog-original').href = image.src;
    node('#dialog-source').href = source.url;
  }

  function showImage(gallery, index) {
    const items = galleries[gallery];
    selected[gallery] = (index + items.length) % items.length;
    const {image, source, position} = renderStage(gallery);
    if (gallery === activeGallery) renderDialog(gallery, image, source, position);
  }

  function openGallery(gallery) {
    activeGallery = gallery;
    const items = galleries[gallery];
    const image = items[selected[gallery]];
    const source = sources.get(image.sourceId);
    renderDialog(gallery, image, source, `${selected[gallery] + 1} / ${items.length}`);
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
  }

  thumbnails.concept.forEach((button, index) => button.addEventListener('click', () => showImage('concept', index)));
  thumbnails.reference.forEach((button, index) => button.addEventListener('click', () => showImage('reference', index)));
  node('#concept-gallery-previous').addEventListener('click', () => showImage('concept', selected.concept - 1));
  node('#concept-gallery-next').addEventListener('click', () => showImage('concept', selected.concept + 1));
  node('#reference-gallery-previous').addEventListener('click', () => showImage('reference', selected.reference - 1));
  node('#reference-gallery-next').addEventListener('click', () => showImage('reference', selected.reference + 1));
  node('#dialog-previous').addEventListener('click', () => showImage(activeGallery, selected[activeGallery] - 1));
  node('#dialog-next').addEventListener('click', () => showImage(activeGallery, selected[activeGallery] + 1));
  let previousOverflow = '';
  node('#concept-open-image').addEventListener('click', () => openGallery('concept'));
  node('#reference-open-image').addEventListener('click', () => openGallery('reference'));
  node('#dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { document.body.style.overflow = previousOverflow; });
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showImage(activeGallery, selected[activeGallery] + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  showImage('concept', selected.concept);
  showImage('reference', selected.reference);
  node('#guide-loading').hidden = true;
  node('#guide-content').hidden = false;
  document.title = `${guide.title} — In the Game / After Hours`;
  window.arcadeGameReady = true;
  window.arcadeGameSlug = slug;
}

loadGameGuide().catch((error) => {
  node('#guide-loading').hidden = true;
  node('#guide-error').hidden = false;
  node('#guide-error').textContent = `The game guide could not load: ${error.message} Open it through the private HTTP preview rather than file://.`;
  window.arcadeGameError = error.message;
  console.error(error);
});
