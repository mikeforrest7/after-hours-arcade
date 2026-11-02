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
  let selected = guide.media.findIndex((image) => image.id === guide.heroMediaId);
  if (selected < 0) throw new Error('The reference gallery has no lead image.');
  const currentPage = gamePages.findIndex(([id]) => id === slug);
  const nextPage = gamePages[(currentPage + 1) % gamePages.length];

  node('#guide-content').innerHTML = `
    <header class="gd-title" aria-labelledby="guide-title">
      <div><p class="chapter-number">${html(guide.number)} / ${html(guide.kicker)}</p><h1 id="guide-title">${html(guide.title)}</h1></div><p class="gd-headline">${html(guide.headline)}</p>
    </header>

    <section class="gd-gallery" id="gallery" aria-labelledby="gallery-title">
      <div class="gd-gallery-intro"><h2 id="gallery-title">Reference gallery</h2><p>Select a photo or screen below. Enlarge it to inspect the details.</p></div>
      <div class="gd-viewer"><button class="gd-stage" id="open-image" type="button" aria-label="Enlarge selected reference image"><img id="selected-image" alt=""><span class="gd-enlarge">Enlarge image</span></button><div class="gd-image-notes" id="selected-notes" aria-live="polite"></div></div>
      <div class="gd-gallery-bar"><p id="gallery-position" aria-live="polite"></p><div><button class="quiet-button" id="gallery-previous" type="button" aria-label="Previous reference image">Previous</button><button class="quiet-button" id="gallery-next" type="button" aria-label="Next reference image">Next</button></div></div>
      <div class="gd-thumbnails" role="group" aria-label="Reference image choices">${guide.media.map((image, index) => `<button class="gd-thumbnail" type="button" data-image="${index}" aria-pressed="false" aria-label="View image ${index + 1}: ${html(image.alt)}"><img src="${html(image.src)}" alt="" width="${image.width}" height="${image.height}" loading="lazy"><span>${String(index + 1).padStart(2, '0')} / ${html(image.kind)}</span></button>`).join('')}</div>
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
  const thumbnails = Array.from(document.querySelectorAll('[data-image]'));
  function showImage(index) {
    selected = (index + guide.media.length) % guide.media.length;
    const image = guide.media[selected];
    const source = sources.get(image.sourceId);
    if (!source) throw new Error(`Missing image source: ${image.sourceId}`);
    for (const selector of ['#selected-image', '#dialog-image']) {
      const element = node(selector);
      element.src = image.src;
      element.alt = image.alt;
      element.width = image.width;
      element.height = image.height;
    }
    node('#selected-notes').innerHTML = `<p class="eyebrow">${html(image.kind)}</p><h3>${html(image.release)}</h3><p class="gd-image-caption">${html(image.caption)}</p><p class="gd-credit">${html(image.credit)}</p><p>${external(source.url, 'View source')} <span aria-hidden="true">↗</span></p><details class="gd-image-provenance"><summary>Image provenance</summary><p>${html(image.processing)}</p><p>${image.width} × ${image.height} px · Retrieved ${html(image.retrievedAt)}</p>${external(image.assetUrl, 'Original image / document')}</details>`;
    const position = `${selected + 1} / ${guide.media.length}`;
    node('#gallery-position').textContent = `${position} reference images`;
    node('#dialog-position').textContent = position;
    node('#dialog-title').textContent = `${guide.title} — ${image.kind}`;
    node('#dialog-caption').textContent = `${image.release}. ${image.caption} Credit: ${image.credit}`;
    node('#dialog-original').href = image.src;
    node('#dialog-source').href = source.url;
    thumbnails.forEach((button, index) => button.setAttribute('aria-pressed', String(index === selected)));
  }
  thumbnails.forEach((button, index) => button.addEventListener('click', () => showImage(index)));
  node('#gallery-previous').addEventListener('click', () => showImage(selected - 1));
  node('#gallery-next').addEventListener('click', () => showImage(selected + 1));
  node('#dialog-previous').addEventListener('click', () => showImage(selected - 1));
  node('#dialog-next').addEventListener('click', () => showImage(selected + 1));
  let previousOverflow = '';
  node('#open-image').addEventListener('click', () => {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
  });
  node('#dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { document.body.style.overflow = previousOverflow; });
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showImage(selected + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  showImage(selected);
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
