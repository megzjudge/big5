// Flow layout — groups flat sections into trait panels, accordions, and cards
document.addEventListener('DOMContentLoaded', () => {
  initBackgroundGlows();
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

function initBackgroundGlows() {
  const mount = document.querySelector('.bg-glow');
  if (!mount) return;

  const palette = [
    { rgb: '10, 126, 140', alpha: 0.16 },
    { rgb: '140, 10, 126', alpha: 0.13 },
    { rgb: '126, 140, 10', alpha: 0.11 },
    { rgb: '140, 58, 10', alpha: 0.10 },
    { rgb: '10, 90, 100', alpha: 0.12 },
    { rgb: '100, 10, 90', alpha: 0.09 },
  ];

  const blobs = [];
  const count = 14 + Math.floor(Math.random() * 8);

  for (let i = 0; i < count; i++) {
    const color = palette[Math.floor(Math.random() * palette.length)];
    const alpha = color.alpha * (0.65 + Math.random() * 0.7);
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const w = 28 + Math.random() * 55;
    const h = 22 + Math.random() * 48;
    blobs.push(
      `radial-gradient(ellipse ${w.toFixed(1)}% ${h.toFixed(1)}% at ${x.toFixed(1)}% ${y.toFixed(1)}%, rgba(${color.rgb}, ${alpha.toFixed(3)}), transparent 52%)`
    );
  }

  mount.style.background = [
    ...blobs,
    'linear-gradient(180deg, var(--bg-deep) 0%, var(--bg-mid) 100%)',
  ].join(', ');
}

function initReveal() {
  const els = document.querySelectorAll('.reveal, .trait-panel, .card, .profile-fold, .trait-chapter, .flow-zone, .about-panel');
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
      page.querySelectorAll('.progress-bar, .progress-bar-men, .progress-bar-women').forEach((bar) => bar.remove());
      page.querySelector(':scope > h5')?.remove();

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
  // About section is authored as .about-panel markup in index.html
}

function parseProfileTitle(raw) {
  const emoji = (raw.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) || []).join('');
  const text = raw.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();
  return { text, emoji };
}

function inferTraitSlug(title) {
  const t = title.toLowerCase();
  if (/extraversion|assertive|enthusiasm/.test(t)) return 'extraversion';
  if (/openness|intellect|aesthetic/.test(t)) return 'openness';
  if (/conscientious|industrious|orderliness/.test(t)) return 'conscientiousness';
  if (/neurotic|volatil|withdrawal/.test(t)) return 'neuroticism';
  if (/agreeab|compassion|polite/.test(t)) return 'agreeableness';
  return 'openness';
}

function wrapProfileImage(body, variant) {
  const img = body.querySelector(':scope > img');
  if (!img) return;

  const figure = document.createElement('figure');
  figure.className = `profile-fold__figure${variant === 'hero' ? ' profile-fold__figure--hero' : ''}`;
  body.insertBefore(figure, img);
  figure.appendChild(img);
}

function buildProfileFold(section) {
  const h2 = section.querySelector(':scope > h2');
  const h3 = section.querySelector(':scope > h3');
  const rawTitle = h2?.textContent?.trim() || h3?.textContent?.trim() || 'Profile';
  const { text, emoji } = parseProfileTitle(rawTitle);
  const isTraitRoot = Boolean(h2 && !h3 && section.querySelector('img') && !section.querySelector('ul'));
  const trait = inferTraitSlug(text);

  const details = document.createElement('details');
  details.className = `profile-fold profile-fold--${trait}${isTraitRoot ? ' profile-fold--root' : ' profile-fold--aspect'}`;
  details.dataset.trait = trait;
  if (isTraitRoot) details.open = true;

  const summary = document.createElement('summary');
  summary.className = 'profile-fold__summary';
  summary.innerHTML = `
    <span class="profile-fold__marker" aria-hidden="true"></span>
    <span class="profile-fold__glyph" aria-hidden="true">${emoji || (isTraitRoot ? '◎' : '·')}</span>
    <span class="profile-fold__headings">
      <span class="profile-fold__kicker">${isTraitRoot ? 'Core trait' : 'Aspect'}</span>
      <span class="profile-fold__title">${text}</span>
    </span>
    <span class="profile-fold__toggle" aria-hidden="true">
      <span class="profile-fold__toggle-open">Read</span>
      <span class="profile-fold__toggle-close">Close</span>
    </span>
  `;

  const body = document.createElement('div');
  body.className = 'profile-fold__body';

  if (h2) h2.remove();
  while (section.firstChild) body.appendChild(section.firstChild);

  wrapProfileImage(body, isTraitRoot ? 'hero' : 'thumb');

  details.append(summary, body);
  return details;
}

function makeProfileAccordions() {
  const mount = document.getElementById('traits-stack');
  if (!mount) return;

  const sections = [...mount.querySelectorAll('.page')];
  const chapters = [];
  let aspectMount = null;

  sections.forEach((section) => {
    const fold = buildProfileFold(section);
    const isRoot = fold.classList.contains('profile-fold--root');

    if (isRoot) {
      const chapter = document.createElement('article');
      chapter.className = `trait-chapter trait-chapter--${fold.dataset.trait} reveal`;
      chapter.appendChild(fold);

      aspectMount = document.createElement('div');
      aspectMount.className = 'trait-chapter__aspects';
      chapter.appendChild(aspectMount);

      chapters.push(chapter);
    } else {
      fold.classList.add('reveal');
      if (aspectMount) {
        aspectMount.appendChild(fold);
      } else {
        const solo = document.createElement('article');
        solo.className = 'trait-chapter trait-chapter--solo reveal';
        solo.appendChild(fold);
        chapters.push(solo);
      }
    }
  });

  mount.replaceChildren(...chapters);
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
