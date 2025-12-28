document.addEventListener('DOMContentLoaded', () => {
  const wrap = document.querySelector('.snap-wrap');
  const pages = Array.from(document.querySelectorAll('.page'));
  if (!wrap || pages.length === 0) return;

  const io = new IntersectionObserver((entries) => {
    const visible = entries
      .filter(e => e.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;

    const page = visible.target;

    pages.forEach(p => {
      if (p !== page) p.classList.remove('active', 'done');
    });

    page.classList.add('active');
    page.classList.remove('done');

    const fills = Array.from(page.querySelectorAll('.fill'));
    if (fills.length === 0) {
      page.classList.add('done');
      return;
    }

    // retrigger animations
    fills.forEach(el => { el.style.animation = 'none'; });
    void page.offsetHeight;
    fills.forEach(el => { el.style.animation = ''; });

    let finished = 0;

    const onEnd = (evt) => {
      const el = evt.currentTarget;
      if (el.dataset.done === '1') return;
      el.dataset.done = '1';

      finished += 1;
      if (finished >= fills.length) {
        page.classList.add('done');
        fills.forEach(f => {
          delete f.dataset.done;
          f.removeEventListener('animationend', onEnd);
        });
      }
    };

    fills.forEach(f => {
      f.dataset.done = '0';
      f.addEventListener('animationend', onEnd);
    });

  }, {
    root: wrap,
    threshold: [0.55, 0.7, 0.85],
  });

  pages.forEach(p => io.observe(p));
});
