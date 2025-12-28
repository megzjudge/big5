document.addEventListener('DOMContentLoaded', () => {
  
  /* =========================
     ZOOM
     ========================= */

  (function () {
    const scroller =
      document.querySelector('.snap-wrap') ||
      document.querySelector('.scroll-sections') ||
      document.scrollingElement ||
      document.documentElement;

    const EPS = 0.01;

    function isZoomed() {
      if (!window.visualViewport) return false;
      return Math.abs(window.visualViewport.scale - 1) > EPS;
    }

    function syncZoomState() {
      scroller.classList.toggle('zoomed', isZoomed());
    }

    syncZoomState();

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', syncZoomState);
      window.visualViewport.addEventListener('scroll', syncZoomState);
    }

    window.addEventListener('resize', syncZoomState);
  })();

  /* =========================
     BARS
     ========================= */
     
  const wrap = document.querySelector('.snap-wrap');
  const pages = Array.from(document.querySelectorAll('.page'));

  if (!wrap || pages.length === 0) return;

  const setActivePage = (page) => {
    pages.forEach(p => {
      if (p !== page) p.classList.remove('active', 'done');
    });

    page.classList.add('active');
    page.classList.remove('done');

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

  setActivePage(pages[0]);

  const io = new IntersectionObserver((entries) => {
    const visible = entries
      .filter(e => e.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;

    const page = visible.target;
    if (page.classList.contains('active')) return;

    setActivePage(page);
  }, {
    root: wrap,
    threshold: [0.35, 0.6, 0.85],
    rootMargin: '0px 0px -10% 0px',
  });

  pages.forEach(p => io.observe(p));
});
