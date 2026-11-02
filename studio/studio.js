'use strict';

const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = (value) => new Intl.NumberFormat('en-US', {style:'currency', currency:'USD', maximumFractionDigits:0}).format(value);
const percent = (value) => `${value.toFixed(1)}%`;
const list = (items) => `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
const link = (url, label) => `<a href="${escapeHtml(url)}"${/^https?:/.test(url) ? ' target="_blank" rel="noopener noreferrer"' : ''}>${escapeHtml(label)}</a>`;

const gameEditorial = [
  {
    key:'golf', id:'golden_tee', label:'Golden Tee', headline:'A tiny putt.<br>A room-sized reaction.',
    slug:'golden-tee',
    actions:['Set the shot','Roll back → drive forward','Watch the result'],
    boundary:'Compare a Fore! emulation bench with the factory Fore! Remastered preorder. Older Arcade1Up titles and modern PGA TOUR are different choices, not automatic equivalents.'
  },
  {
    key:'hunt', id:'big_buck_hunter', label:'Big Buck Hunter', headline:'Aim. Fire. Pump.<br>Hand over the score to beat.',
    slug:'big-buck-hunter',
    actions:['Track the target','Trigger + pump','Compete in the selected mode'],
    boundary:'Early Eagle-era emulation and Arcade1Up Pro/World home products cover different releases. Two holsters do not establish simultaneous two-player play.'
  },
  {
    key:'bowling', id:'silver_strike', label:'Silver Strike', headline:'The roll is yours.<br>The strike belongs to the room.',
    slug:'silver-strike',
    actions:['Choose the setup','Roll with follow-through','Chase the next frame'],
    boundary:'Compare a demonstrated classic donor with Arcade Collection or League Night Home Edition. League Night is a portrait-format reboot requiring a separate 4K TV; it is not the landscape game illustrated here.'
  },
  {
    key:'jungle', id:'jurassic_park_arcade', label:'Jurassic Park Arcade', headline:'Two players.<br>One very bad island.',
    slug:'jurassic-park',
    actions:['Take a mounted control','Track + fire independently','Finish the mission together'],
    boundary:'Raw Thrills 2015 uses positional mounted guns and original I/O/security hardware. A handheld optical alternative changes the experience and still requires compatibility proof. Older Sega games are separate selections.'
  }
];

function renderExperience(data, guides) {
  $('#game-panels').innerHTML = gameEditorial.map((editorial, index) => {
    const game = data.games.find((entry) => entry.id === editorial.id);
    if (!game) throw new Error(`Missing advisor specification: ${editorial.id}`);
    const guide = guides.find((entry) => entry.overviewId === editorial.id);
    if (!guide) throw new Error(`Missing illustrated guide: ${editorial.id}`);
    const image = guide.media.find((entry) => entry.id === guide.heroMediaId);
    if (!image) throw new Error(`Missing reference image: ${guide.slug}`);
    const source = guide.sources.find((entry) => entry.id === image.sourceId);
    if (!source) throw new Error(`Missing image attribution: ${image.sourceId}`);
    const page = `games/${guide.slug}.html`;
    return `<article class="game-panel" id="panel-${editorial.key}" role="tabpanel" aria-labelledby="tab-${editorial.key}"${index ? ' hidden' : ''}>
      <figure class="game-image reference-preview"><a href="${page}" aria-label="View ${escapeHtml(editorial.label)} reference gallery"><img src="games/${escapeHtml(image.src)}" alt="${escapeHtml(image.alt)}" width="${image.width}" height="${image.height}" loading="lazy"></a><figcaption><span>${escapeHtml(image.kind)} / ${escapeHtml(image.release)}</span>${link(source.url, image.credit)}</figcaption></figure>
      <div class="game-copy"><p class="eyebrow">${String(index + 1).padStart(2,'0')} / ${escapeHtml(editorial.label)}</p><h3>${editorial.headline}</h3><p>${escapeHtml(guide.intro)}</p><ul class="game-actions">${editorial.actions.map((action) => `<li>${escapeHtml(action)}</li>`).join('')}</ul><div class="game-boundary"><strong>THE RELEASE DECISION</strong>${escapeHtml(editorial.boundary)}</div><a class="button primary experience-page-link" href="${page}" aria-label="Explore ${escapeHtml(editorial.label)} game experience">Explore the game experience <span aria-hidden="true">→</span></a><p class="experience-preview-note">${guide.media.length} reference images · Gameplay, controls and build implications</p></div>
      <details class="game-detail"><summary>Control contract, acquisition paths and prototype acceptance</summary><div class="game-detail-grid"><div><h4>The physical interaction</h4>${list(game.physicalActions)}<h4>Control contract</h4><p>${escapeHtml(game.controlContract)}</p></div><div><h4>Buy / build / donor branches</h4>${list(game.softwareBranches)}<h4>Fidelity risks</h4>${list(game.fidelityRisks)}</div><div class="game-test"><h4>What a prototype must demonstrate</h4><p>${escapeHtml(game.prototypeTest)}</p></div></div></details>
    </article>`;
  }).join('');

  const journey = [
    ['Walk up','A recognizable control and a quiet ready state—not a desktop or a technician-only menu.'],
    ['Choose & join','The selected game, panel legend and actual alternating or simultaneous mode are clear.'],
    ['Confirm the controls','A short aim/identity check where needed; no silent P1/P2 swap after reconnecting.'],
    ['Play the full round','Readable feedback, predictable response and independent station volume.'],
    ['Return & recover','A clean next-turn boundary; deliberate service access and documented restart behavior.']
  ];
  $('#guest-journey').innerHTML = journey.map(([title, description]) => `<li><h4>${escapeHtml(title)}</h4><p>${escapeHtml(description)}</p></li>`).join('');
  $('#arcade-corrections').innerHTML = `<div class="correction-list">${data.architectureDecisions.map((decision) => `<article><h4>${escapeHtml(decision.id)} / ${escapeHtml(decision.decision)}</h4><p>${escapeHtml(decision.rationale)}</p></article>`).join('')}</div>`;
  const tabs = Array.from(document.querySelectorAll('[role=tab]'));
  function selectTab(tab, focus = false) {
    tabs.forEach((item) => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
    });
    if (focus) tab.focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', (event) => {
      let destination;
      if (event.key === 'ArrowRight') destination = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') destination = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') destination = 0;
      if (event.key === 'End') destination = tabs.length - 1;
      if (destination !== undefined) { event.preventDefault(); selectTab(tabs[destination], true); }
    });
  });
}

function renderDirections() {
  const directions = [
    ['Workshop notebook','Materials, measurements and the satisfaction of making. Strong appendix; too process-led for the opening story.'],
    ['Product studio','Finished room first, the game ritual next, economics and gates behind it. The selected executive direction.'],
    ['Sports-club social','Rivalries, scoreboards and a shared night of play. Strong experience lens; too narrow for the production case.'],
    ['Investment committee','Cash, contribution and kill criteria lead. Useful decision layer; cold as a product introduction.'],
    ['Cinematic attraction','Immersive jungle, theatrical light and environmental spectacle. Memorable, but expensive and too close to implying a licensed attraction.']
  ];
  $('#direction-gallery').innerHTML = directions.map(([title, description], index) => `<article class="direction-card${index === 1 ? ' selected' : ''}"><small>${index === 1 ? 'SELECTED DIRECTION' : `ALTERNATIVE ${index + 1}`}</small><div class="direction-frame" aria-hidden="true"></div><h4>${escapeHtml(title)}</h4><p>${escapeHtml(description)}</p></article>`).join('');
}

function renderMarket(data) {
  const listingPrice = new Intl.NumberFormat('en-US', {style:'currency', currency:'USD', minimumFractionDigits:0, maximumFractionDigits:2});
  $('#competitor-table tbody').innerHTML = data.competitors.map((item) => `
    <tr><th scope="row">${escapeHtml(item.name)}</th>
    <td>${listingPrice.format(item.priceUsd)}<small class="price-note">${escapeHtml(item.availabilityLabel)}</small></td>
    <td><p>${escapeHtml(item.executiveComparison)}</p>
      <details class="market-detail"><summary>Configuration & evidence limits</summary><div>
        <p>${escapeHtml(item.configuration)}</p><p>${escapeHtml(item.priceBasis)}</p><p>${escapeHtml(item.comparisonLimit)}</p>
      </div></details></td>
    <td>${link(item.url, 'Read listing')}<small class="source-date">${escapeHtml(item.observedOn)}</small></td></tr>`).join('');
  $('#demand-validation').innerHTML = data.validationPlan.map((item) => `<li><strong>${escapeHtml(item.hypothesis)}</strong><p>${escapeHtml(item.test)}</p><p class="pass-signal">Pass signal: ${escapeHtml(item.passSignal)}</p><p class="fail-signal">Stop / revise: ${escapeHtml(item.failSignal)}</p></li>`).join('');
  $('#executive-thesis').textContent = 'The custom two-station concept is the design vision—not a claim that building beats buying. Compare the exact games with licensed home products, prove the hard control paths, and keep commercial launch behind a separate demand-and-margin gate.';
  $('#commercial-thesis').textContent = 'The defensible starting offer is a defined hardware kit or a separately quoted integration service—not four commercial games bundled without distribution rights. The current recommendation is prototype first; do not release a production batch.';
  $('#commercial-offer').innerHTML = '<div><p class="eyebrow">CONDITIONAL PRODUCT HYPOTHESIS</p><h3>Furniture-quality controls.<br>Not a mystery game box.</h3></div><div><p><strong>Buyer hypothesis</strong>A space-conscious home-arcade enthusiast who values full-size controls, serviceability and a coherent room more than the lowest purchase price.</p><p><strong>Offer to validate</strong>One documented trackball furniture/control kit, with display, PC and game software explicitly excluded. Custom donor integration is quoted per job. The two-station private room remains the personal design goal, not the SKU priced below.</p></div>';
}

function computeEconomics(data, scenarioId, priceOverride = null, stress = 0) {
  const scenario = data.scenarios.find((item) => item.id === scenarioId);
  if (!scenario) throw new Error(`Unknown production scenario: ${scenarioId}`);
  const price = priceOverride ?? scenario.targetPriceUsd;
  if (price !== null && (!Number.isFinite(price) || price <= 0)) throw new Error('Enter a finite selling price greater than zero.');
  if (!Number.isFinite(stress) || stress < 0) throw new Error('Direct-cost stress must be finite and nonnegative.');
  const mid = (item) => item.lowUsd === null || item.highUsd === null ? null : (item.lowUsd + item.highUsd) / 2;
  const total = (items) => items.some((item) => mid(item) === null) ? null : items.reduce((sum, item) => sum + mid(item), 0);
  const assumptions = data.sharedAssumptions;
  const materialLines = scenario.materialCostLinesRef.split('+').flatMap((key) => data[key]);
  const materials = total(materialLines);
  const volume = scenario.volumeUnits;
  const hours = scenario.laborBreakdown.reduce((sum, item) => sum + item.hours, 0);
  const nre = mid(scenario.nreTotalUsd);
  const setup = total(data.oneTimeLaunchCostsUsd);
  const annual = total(data.firstYearOperatingFixedCostsUsd);
  const common = {scenarioId, volumeUnits:volume, priceUsd:price, directCostStressPct:stress, blocked:Boolean(scenario.blocked) || materials === null, blockedReason:scenario.blockedReason, leadTimeDays:assumptions.productionCapacity.procurementLeadDays + Math.ceil(hours * volume / assumptions.productionCapacity.weeklyCapacityHours) * 7};
  if (materials === null) return {...common, variableUnitCogsUsd:null, marginalContributionMarginUsd:null, marginalContributionMarginPct:null, batchFullyLoadedMarginUsd:null, launchLiquidityRequiredUsd:null};
  const factor = 1 + stress;
  const labor = scenario.laborBreakdown.reduce((sum, item) => sum + item.hours * item.rateUsdPerHr, 0) * factor;
  const parts = materials * factor;
  const packaging = mid(scenario.packagingUsd) * factor;
  const freight = mid(scenario.freightOutUsd) * factor;
  const direct = parts + labor + packaging + freight;
  const round = (value, digits = 2) => Number(value.toFixed(digits));
  const nrePerUnit = nre / volume;
  const cashExcludingLabor = (parts + packaging + freight) * volume + nre;
  const cashIncludingLabor = cashExcludingLabor + labor * volume;
  if (price === null) return {...common, variableUnitCogsUsd:round(direct), marginalContributionMarginUsd:null, marginalContributionMarginPct:null, batchFullyLoadedMarginUsd:null, nrePerUnitUsd:round(nrePerUnit), cashOutlayExclLaborUsd:round(cashExcludingLabor), cashOutlayInclLaborUsd:round(cashIncludingLabor), launchLiquidityRequiredUsd:null};
  const reserveRate = scenario.reservePct ?? assumptions.warrantyReservePct_hardwareOnly;
  const acquisition = scenario.cacUsdOverride ?? assumptions.cacBaselineUsd_hardwareOnly;
  const fee = price * assumptions.channelFeePct + assumptions.channelFeeFlatUsd;
  const reserve = price * reserveRate;
  const contribution = price - direct - fee - reserve - acquisition;
  const afterTooling = contribution - nrePerUnit;
  const cashBasis = scenario.laborIsOwnerSweatEquity ? cashExcludingLabor : cashIncludingLabor;
  const liquidity = setup + annual + cashBasis + (acquisition + fee + reserve) * volume;
  const deposit = price * assumptions.customerDepositPct * volume;
  return {...common,
    variableUnitCogsUsd:round(direct), marginalContributionMarginUsd:round(contribution), marginalContributionMarginPct:round(contribution / price * 100, 1),
    nrePerUnitUsd:round(nrePerUnit), batchFullyLoadedMarginUsd:round(afterTooling), batchFullyLoadedMarginPct:round(afterTooling / price * 100, 1),
    breakevenUnits:contribution > 0 ? Math.ceil((nre + setup) / contribution) : null,
    cashOutlayExclLaborUsd:round(cashExcludingLabor), cashOutlayInclLaborUsd:round(cashIncludingLabor),
    customerDepositCashInUsd:round(deposit), refundableDepositLiabilityUsd:round(deposit), launchLiquidityRequiredUsd:round(liquidity), fundingGapIfDepositsCollectedUsd:round(Math.max(0, liquidity - deposit)),
    batchResultAfterModeledFixedUsd:round(contribution * volume - nre - setup - annual),
    detail:{parts,labor,packaging,freight,fee,reserve,acquisition,nre,nrePerUnit,setup,annual,hours,reserveRate}
  };
}

function renderEconomics(data) {
  const select = $('#batch-select');
  const priceInput = $('#price-input');
  const stressInput = $('#cost-stress');
  const choices = data.scenarios.filter((item) => item.forSale && !item.blocked);
  select.innerHTML = choices.map((item) => `<option value="${escapeHtml(item.id)}">${item.offerType === 'hardware_only' ? `${item.volumeUnits} units · hardware kit` : '1 job · donor integration'}</option>`).join('');
  const exactMoney = (value) => new Intl.NumberFormat('en-US', {style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(value);
  const cashLine = (label, value) => `<div class="cash-line"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
  function update() {
    const scenario = choices.find((item) => item.id === select.value);
    const stress = Number(stressInput.value) / 100;
    $('#stress-output').textContent = `+${stressInput.value}%`;
    try {
      const result = computeEconomics(data, scenario.id, priceInput.value === '' ? NaN : Number(priceInput.value), stress);
      priceInput.setCustomValidity('');
      priceInput.removeAttribute('aria-invalid');
      const d = result.detail;
      $('#economics-basis').textContent = `${scenario.volumeUnits === 1 ? 'One service job' : `${scenario.volumeUnits}-unit hardware-only run`}; standalone tooling basis, not a sequential rollout. No game software${scenario.offerType === 'hardware_only' ? ', TV or PC' : ' or donor purchase'} included. Selling price excludes sales tax. Labor is charged to the margin whether paid in cash or supplied by the owner.`;
      const metrics = [
        ['DIRECT BUILD COST',result.variableUnitCogsUsd,'Per unit; material, paid-value labor, packaging and outbound freight.'],
        ['UNIT CONTRIBUTION',result.marginalContributionMarginUsd,`${percent(result.marginalContributionMarginPct)} after acquisition, payment fees and reserve; before fixed costs.`],
        ['AFTER BATCH TOOLING',result.batchFullyLoadedMarginUsd,`${percent(result.batchFullyLoadedMarginPct)} per unit; still before business setup and annual overhead.`],
        ['BATCH AFTER MODELED FIXED COSTS',result.batchResultAfterModeledFixedUsd,'Entire batch, after standalone tooling, setup and first-year insurance. Not full business profit.']
      ];
      $('#economic-results').innerHTML = metrics.map(([label,value,basis]) => `<article${value < 0 ? ' class="negative"' : ''}><small>${escapeHtml(label)}</small><strong>${money(value)}</strong><p>${escapeHtml(basis)}</p></article>`).join('');
      const rows = [
        ['Materials + landed inputs',d.parts,'Midpoint of line-item ranges; includes inbound freight/procurement allowance.'],
        ['Production / integration labor',d.labor,`${d.hours} hours per unit/job at the scenario's stated rates; not a measured time study.`],
        ['Packaging',d.packaging,'Planning allowance, not a packaging-vendor quotation.'],
        ['Outbound freight',d.freight,scenario.offerType === 'hardware_only' ? 'Seller-funded allowance; no route/carrier quote.' : 'Customer pickup; delivery must be separately quoted.'],
        ['Payment processing',d.fee,`${percent(data.sharedAssumptions.channelFeePct * 100)} + ${exactMoney(data.sharedAssumptions.channelFeeFlatUsd)} per sale.`],
        ['Warranty / damage reserve',d.reserve,`${percent(d.reserveRate * 100)} of selling price; not established claims experience.`],
        ['Customer acquisition',d.acquisition,'Unvalidated per-order assumption; no campaign or orders observed.'],
        ['Standalone tooling allocation',d.nrePerUnit,`${money(d.nre)} divided by ${scenario.volumeUnits}; excluded from unit contribution above.`]
      ];
      $('#cost-table tbody').innerHTML = rows.map(([label,value,basis]) => `<tr><th scope="row">${escapeHtml(label)}</th><td>${exactMoney(value)}</td><td>${escapeHtml(basis)}</td></tr>`).join('');
      $('#cash-model').innerHTML = cashLine('Launch cash floor, before deposits',money(result.launchLiquidityRequiredUsd)) +
        cashLine('Potential deposits / equal refund obligation',money(result.customerDepositCashInUsd)) +
        cashLine('Optimistic gap after every deposit arrives',money(result.fundingGapIfDepositsCollectedUsd)) +
        cashLine('Modeled production lead time',`${result.leadTimeDays} days`) +
        `<p class="caption">${scenario.laborIsOwnerSweatEquity ? `Cash assumes unpaid owner labor worth ${money(d.labor * scenario.volumeUnits)}; add it if labor must be paid. ` : 'Cash includes paid production labor. '}Deposits may arrive after setup spending and can require refunds. This is a funding model, not maximum loss or a dated cash-flow forecast.</p>`;
      const recovery = result.breakevenUnits === null ? 'No finite setup/tooling recovery at negative contribution.' : `${result.breakevenUnits} units recover the modeled ${money(d.nre + d.setup)} setup/tooling pool at this unit contribution. This excludes annual overhead and assumes the same unit costs.`;
      $('#economic-assumptions').innerHTML = `<ul class="assumption-list">${[
        recovery,`One-time business setup: ${money(d.setup)}. First-year recurring insurance: ${money(d.annual)}. Extra rent, hosting, utilities, income tax, financing and unmodeled compliance work can reduce the result further.`,
        `Cost stress applies only to materials, labor, packaging and outbound freight. It does not stress NRE, CAC, fee rates or reserve rates. All source ranges use their midpoints.`,
        `Capacity is ${data.sharedAssumptions.productionCapacity.weeklyCapacityHours} productive hours/week plus ${data.sharedAssumptions.productionCapacity.procurementLeadDays} procurement days, rounded to whole production weeks. No staffing or supplier commitment exists.`,
        'Every batch comparison carries full standalone tooling. A sequential 10→50→100 rollout reuses tooling; see the production plan rather than summing these standalone cash requirements.',
        'The private two-station room budget is separate from this one-kit/service business model. Licensed turnkey remains blocked: unknown game rights and royalties are not priced as zero.'
      ].map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
    } catch (error) {
      priceInput.setCustomValidity(error.message);
      priceInput.setAttribute('aria-invalid','true');
      $('#economic-results').innerHTML = `<p role="alert">${escapeHtml(error.message)}</p>`;
      $('#cost-table tbody').innerHTML = '';
      $('#cash-model').textContent = 'Correct the price to calculate; no stale result is displayed.';
      $('#economic-assumptions').textContent = '';
    }
  }
  select.addEventListener('change', () => { priceInput.value = choices.find((item) => item.id === select.value).targetPriceUsd; update(); });
  priceInput.addEventListener('input', update);
  stressInput.addEventListener('input', update);
  $('#reset-economics').addEventListener('click', () => { select.value = 'batch_10'; priceInput.value = choices.find((item) => item.id === 'batch_10').targetPriceUsd; stressInput.value = '0'; update(); });
  priceInput.value = choices.find((item) => item.id === select.value).targetPriceUsd;
  $('#production-gates').innerHTML = [
    ['GATE 1 / PERSONAL PROOF','Build the prototype',data.goNoGo.conditionsForCommercialLaunchOfHardwareOnlyKit[0]],
    ['GATE 2 / COMMERCIAL PILOT','Prove demand and obligations',`${data.goNoGo.conditionsForCommercialLaunchOfHardwareOnlyKit[1]} ${data.goNoGo.conditionsForCommercialLaunchOfHardwareOnlyKit[2]}`],
    ['GATE 3 / BATCH RELEASE','Fund it without wishful thinking',data.killCriteria.find((item) => item.id === 'K1').rule]
  ].map(([stage,title,description]) => `<article><p class="eyebrow">${escapeHtml(stage)}</p><h3>${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p></article>`).join('');
  update();
}

function renderSources(...datasets) {
  const seen = new Set();
  const sources = datasets.flatMap((data) => data.sources || []).filter((source) => {
    if (!source.url || seen.has(source.url)) return false;
    seen.add(source.url);
    return true;
  });
  $('#source-register').innerHTML = `<ol>${sources.map((source) => `<li>${link(source.url, source.title)}<span>${escapeHtml(source.observedOn || 'Planning source')} · ${escapeHtml(source.claim)}</span></li>`).join('')}</ol>`;
}

$('#print-button').addEventListener('click', () => window.print());
renderDirections();

async function loadPresentation() {
  const [experience, narrative, economics, ...guides] = await Promise.all(['experience.json','narrative.json','economics.json',...gameEditorial.map((game) => `games/${game.slug}.json`)].map(async (file) => {
    const response = await fetch(file, {cache:'no-store'});
    if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
    return response.json();
  }));
  renderExperience(experience, guides);
  renderMarket(narrative);
  renderEconomics(economics);
  renderSources(experience, narrative, economics);
  window.arcadeStudioReady = true;
}

loadPresentation().catch((error) => {
  const message = $('#data-error');
  message.textContent = `The presentation could not load its source data: ${error.message}. Use the private HTTP preview, not a file:// copy.`;
  message.hidden = false;
  window.arcadeStudioError = error.message;
  console.error(error);
});
