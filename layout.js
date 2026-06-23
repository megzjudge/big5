// Flow layout — groups flat sections into trait panels, accordions, and cards
document.addEventListener('DOMContentLoaded', () => {
  buildScoreOverview();
  groupTraitPanels();
  polishAboutCards();
  makeProfileAccordions();
  wrapVideoCards();
  initReveal();
});

const TRAITS = [
  { id: 'extraversion', label: 'Extraversion', emoji: '🗣️' },
  { id: 'openness', label: 'Openness', emoji: '🏹' },
  { id: 'conscientiousness', label: 'Conscientiousness', emoji: '💼' },
  { id: 'neuroticism', label: 'Neuroticism', emoji: '💢' },
  { id: 'agreeableness', label: 'Agreeableness', emoji: '✅' },
];

function initReveal() {
  const els = document.querySelectorAll('.reveal, .trait-panel, .card, .profile-fold, .flow-zone');
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  );
  els.forEach((el) => io.observe(el));
}

function buildScoreOverview() {
  const mount = document.getElementById('score-overview');
  if (!mount) return;

  TRAITS.forEach((trait) => {
    const section = document.getElementById(trait.id);
    if (!section) return;

    const h5 = section.querySelector('h5');
    const bar = section.querySelector('.progress-bar[data-progress]');
    const score = bar?.dataset.progress;
    const title = h5?.textContent?.replace(/\s+\d+.*/, '') || trait.label;

    const card = document.createElement('a');
    card.href = `#${trait.id}`;
    card.className = `score-pill score-pill--${trait.id} reveal`;
    card.innerHTML = `
      <span class="score-pill__emoji">${trait.emoji}</span>
      <span class="score-pill__name">${trait.label}</span>
      <span class="score-pill__value">${score ? score + 'th' : '—'}</span>
    `;
    mount.appendChild(card);
  });
}

function groupTraitPanels() {
  const stream = document.getElementById('trait-stream');
  if (!stream) return;

  const panels = [];

  TRAITS.forEach((trait, ti) => {
    const overview = stream.querySelector(`#${trait.id}`);
    if (!overview) return;

    const nextId = TRAITS[ti + 1]?.id;
    const pages = [overview];
    let sib = overview.nextElementSibling;

    while (sib?.classList?.contains('page')) {
      if (nextId && sib.id === nextId) break;
      if (sib.id && TRAITS.some((t) => t.id === sib.id && t.id !== trait.id)) break;
      pages.push(sib);
      sib = sib.nextElementSibling;
    }

    const panel = document.createElement('article');
    panel.className = `trait-panel trait-panel--${trait.id} reveal`;
    panel.id = trait.id;

    const head = document.createElement('header');
    head.className = 'trait-panel__head';
    const mainH5 = overview.querySelector('h5');
    const scoreMatch = mainH5?.textContent?.match(/(\d+)(?:st|nd|rd|th)/i);
    head.innerHTML = `
      <span class="trait-panel__emoji">${trait.emoji}</span>
      <div class="trait-panel__titles">
        <h2 class="trait-panel__title">${trait.label}</h2>
        ${scoreMatch ? `<span class="trait-panel__score">${scoreMatch[0]}</span>` : ''}
      </div>
    `;

    const overviewCard = document.createElement('div');
    overviewCard.className = 'trait-panel__overview card';
    while (overview.firstChild) overviewCard.appendChild(overview.firstChild);

    const charts = document.createElement('div');
    charts.className = 'trait-panel__charts';

    pages.slice(1).forEach((page) => {
      const chartCard = document.createElement('div');
      chartCard.className = 'chart-card card';
      while (page.firstChild) chartCard.appendChild(page.firstChild);
      charts.appendChild(chartCard);
    });

    pages.forEach((p) => p.remove());

    panel.append(head, overviewCard);
    if (charts.children.length) panel.append(charts);
    panels.push(panel);
  });

  stream.replaceChildren(...panels);
}

function polishAboutCards() {
  const mount = document.getElementById('about-cards');
  if (!mount) return;

  mount.querySelectorAll('.page').forEach((section) => {
    section.classList.add('about-card', 'card', 'reveal');
  });
}

function makeProfileAccordions() {
  const mount = document.getElementById('traits-stack');
  if (!mount) return;

  const sections = [...mount.querySelectorAll('.page')];
  sections.forEach((section) => {
    const h2 = section.querySelector(':scope > h2');
    const h3 = section.querySelector(':scope > h3');
    const title = h2?.textContent?.trim() || h3?.textContent?.trim() || 'Profile';
    const isTraitRoot = h2 && !h3 && section.querySelector('img') && !section.querySelector('ul');

    const details = document.createElement('details');
    details.className = `profile-fold profile-fold reveal${isTraitRoot ? ' profile-fold--root' : ''}`;
    if (isTraitRoot) details.open = true;

    const summary = document.createElement('summary');
    summary.className = 'profile-fold__summary';
    summary.innerHTML = `<span class="profile-fold__title">${title}</span><span class="profile-fold__chev" aria-hidden="true">+</span>`;

    const body = document.createElement('div');
    body.className = 'profile-fold__body';

    if (h2) h2.remove();
    while (section.firstChild) body.appendChild(section.firstChild);

    details.append(summary, body);
    section.replaceWith(details);
  });
}

function wrapVideoCards() {
  const grid = document.getElementById('video-grid');
  if (!grid) return;

  const sections = [...grid.querySelectorAll('.page')];
  sections.forEach((section) => {
    const card = document.createElement('article');
    card.className = 'video-card card reveal';
    while (section.firstChild) card.appendChild(section.firstChild);
    section.replaceWith(card);
  });
}
