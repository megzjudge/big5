document.addEventListener('DOMContentLoaded', () => {
  const wrap = document.querySelector('.snap-wrap');
  const pages = Array.from(document.querySelectorAll('.page'));

  if (!wrap) {
    console.warn('No .snap-wrap found');
    return;
  }
  if (pages.length === 0) {
    console.warn('No .page sections found');
    return;
  }

  const setActivePage = (page) => {
    // deactivate others (CSS will hard-reset their fills to 0)
    pages.forEach(p => {
      if (p !== page) p.classList.remove('active', 'done');
    });

    // (re)activate this page
    page.classList.add('active');
    page.classList.remove('done');

    // count only fills that actually animate
    const fills = Array.from(page.querySelectorAll('.fill')).filter(el => {
      const name = getComputedStyle(el).animationName;
      return name && name !== 'none';
    });

    if (fills.length === 0) {
      page.classList.add('done');
      return;
    }

    let finished = 0;

    const onEnd = () => {
      finished += 1;
      if (finished >= fills.length) page.classList.add('done');
    };

    fills.forEach(f => f.addEventListener('animationend', onEnd, { once: true }));
  };

  // Ensure first page animates immediately (important with strict thresholds)
  setActivePage(pages[0]);

  const io = new IntersectionObserver((entries) => {
    const visible = entries
      .filter(e => e.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;

    const page = visible.target;

    // Prevent retriggering the same page while scrolling within it
    if (page.classList.contains('active')) return;

    setActivePage(page);
  }, {
    root: wrap,
    threshold: [0.35, 0.6, 0.85], // more forgiving than 0.75/0.9
    rootMargin: '0px 0px -10% 0px' // helps pick the "current" page
  });

  pages.forEach(p => io.observe(p));
});
