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

  function stopPage(page){
    page.classList.remove('play', 'done');
    page.querySelectorAll('.fill').forEach(f => {
      f.style.animation = 'none';
      f.style.width = '0%';
    });
  }

  function playPage(page){
    // stop everyone else
    pages.forEach(p => { if (p !== page) stopPage(p); });

    // hard reset this page, then start
    stopPage(page);
    void page.offsetHeight;          // reflow so reset commits
    page.classList.add('play');

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
  }

  const io = new IntersectionObserver((entries) => {
    const best = entries
      .filter(e => e.isIntersecting)
      .sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!best) return;

    const page = best.target;
    if (page.classList.contains('play')) return;

    playPage(page);
  }, { root: wrap, threshold: [0.6, 0.8, 0.95] });

  pages.forEach(p => io.observe(p));

  // Start with the first visible page inside the scroller
  // (prevents "page[0] plays even if header is visible")
  requestAnimationFrame(() => {
    const firstVisible = pages.find(p => {
      const r = p.getBoundingClientRect();
      const wr = wrap.getBoundingClientRect();
      const visible = Math.min(r.bottom, wr.bottom) - Math.max(r.top, wr.top);
      return visible / r.height > 0.6;
    }) || pages[0];
    playPage(firstVisible);
  });
});